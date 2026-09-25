import React, { useRef, useEffect, useCallback } from 'react';
import { VisualizerMode, AudioBookmark } from '../types/audio';
import { formatTime } from '../utils/audioProcessing';

interface WaveformCanvasProps {
  mode: 'live' | 'playback';
  visualizerMode?: VisualizerMode;
  // Live props
  frequencyData?: Uint8Array | null;
  timeDomainData?: Uint8Array | null;
  isRecording?: boolean;
  // Playback props
  peaks?: number[];
  currentTime?: number;
  duration?: number;
  bookmarks?: AudioBookmark[];
  trimRange?: [number, number] | null;
  onSeek?: (time: number) => void;
  onSelectBookmark?: (time: number) => void;
  height?: number;
  interactive?: boolean;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  mode,
  visualizerMode = 'bars',
  frequencyData,
  timeDomainData,
  isRecording = false,
  peaks = [],
  currentTime = 0,
  duration = 0,
  bookmarks = [],
  trimRange = null,
  onSeek,
  onSelectBookmark,
  height = 140,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);

  // Draw Live Recording Visualizer
  const drawLive = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, width, h);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    // Center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(width, h / 2);
    ctx.stroke();

    if (!isRecording) {
      // Idle state: gentle idle resting line
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(width, h / 2);
      ctx.stroke();
      return;
    }

    if (visualizerMode === 'wave' && timeDomainData) {
      // Oscilloscope time-domain wave
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();

      const sliceWidth = width / timeDomainData.length;
      let x = 0;

      for (let i = 0; i < timeDomainData.length; i++) {
        const v = timeDomainData[i] / 128.0;
        const y = (v * h) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();

      // Soft glow
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (visualizerMode === 'frequency' && frequencyData) {
      // Frequency spectrum gradient
      const barCount = 64;
      const barWidth = width / barCount - 2;
      const step = Math.floor(frequencyData.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const val = frequencyData[i * step] || 0;
        const barHeight = (val / 255) * (h * 0.85);
        const x = i * (barWidth + 2);
        const y = h - barHeight;

        const grad = ctx.createLinearGradient(0, y, 0, h);
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0.2)');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    } else {
      // Default: Symmetrical Studio Bars
      const data = frequencyData || timeDomainData;
      if (!data) return;

      const barCount = 48;
      const barWidth = Math.max(3, (width / barCount) - 3);
      const step = Math.floor(data.length / barCount);

      for (let i = 0; i < barCount; i++) {
        let val = 0;
        if (frequencyData) {
          val = (frequencyData[i * step] || 0) / 255;
        } else if (timeDomainData) {
          val = Math.abs((timeDomainData[i * step] || 128) - 128) / 128;
        }

        const barHeight = Math.max(4, val * (h * 0.8));
        const x = i * (width / barCount) + 2;
        const y = (h - barHeight) / 2;

        // Gradient from amber to lighter yellow
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, '#fbbf24');
        grad.addColorStop(0.5, '#f59e0b');
        grad.addColorStop(1, '#d97706');

        ctx.fillStyle = grad;
        // Rounded bar
        ctx.beginPath();
        const r = Math.min(barWidth / 2, 3);
        ctx.roundRect(x, y, barWidth, barHeight, r);
        ctx.fill();
      }
    }
  }, [isRecording, visualizerMode, frequencyData, timeDomainData]);

  // Draw Playback Waveform
  const drawPlayback = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, width, h);

    // Subtle background
    ctx.fillStyle = 'rgba(15, 15, 15, 0.6)';
    ctx.fillRect(0, 0, width, h);

    // Grid marks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
    const playheadX = progressRatio * width;

    // Highlight Trim Region if active
    if (trimRange && duration > 0) {
      const trimStartX = (trimRange[0] / duration) * width;
      const trimEndX = (trimRange[1] / duration) * width;

      // Dim outside trim
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, trimStartX, h);
      ctx.fillRect(trimEndX, 0, width - trimEndX, h);

      // Active trim zone border
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(trimStartX, 1, trimEndX - trimStartX, h - 2);

      // Trim start handle
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(trimStartX - 2, 0, 4, h);
      // Trim end handle
      ctx.fillRect(trimEndX - 2, 0, 4, h);
    }

    // Render Peak Bars
    const barCount = peaks.length || 100;
    const barWidth = Math.max(2, width / barCount - 2);
    const spacing = width / barCount;

    for (let i = 0; i < barCount; i++) {
      const amp = peaks[i] !== undefined ? peaks[i] : 0.2;
      const barHeight = Math.max(4, amp * (h * 0.75));
      const x = i * spacing + 1;
      const y = (h - barHeight) / 2;

      const isPlayed = x <= playheadX;

      if (isPlayed) {
        ctx.fillStyle = '#f59e0b'; // Amber for played
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'; // Muted for unplayed
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    }

    // Draw Bookmarks Flag Pins
    if (duration > 0 && bookmarks.length > 0) {
      bookmarks.forEach((bm) => {
        const bmX = (bm.time / duration) * width;
        // Marker vertical pin line
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(bmX, 0);
        ctx.lineTo(bmX, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Marker pin head
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(bmX, 8, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw Current Playhead Line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, h);
    ctx.stroke();

    // Playhead handle top
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(playheadX, 4, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [peaks, currentTime, duration, bookmarks, trimRange]);

  // Handle Resize and Canvas DPI
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      if (mode === 'live') {
        drawLive();
      } else {
        drawPlayback();
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [mode, height, drawLive, drawPlayback]);

  // Redraw when props update
  useEffect(() => {
    if (mode === 'live') {
      drawLive();
    } else {
      drawPlayback();
    }
  }, [mode, drawLive, drawPlayback]);

  // Mouse / Touch Seeking interaction
  const handleSeekFromClientX = (clientX: number) => {
    if (!canvasRef.current || !onSeek || duration <= 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const targetTime = (x / rect.width) * duration;
    onSeek(targetTime);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || mode !== 'playback') return;
    isDraggingRef.current = true;
    handleSeekFromClientX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      handleSeekFromClientX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!interactive || mode !== 'playback' || e.touches.length === 0) return;
    isDraggingRef.current = true;
    handleSeekFromClientX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current && e.touches.length > 0) {
      handleSeekFromClientX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 shadow-inner">
      <canvas
        ref={canvasRef}
        className={`w-full ${interactive && mode === 'playback' ? 'cursor-pointer' : ''}`}
        style={{ height: `${height}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Playback time indicators overlay */}
      {mode === 'playback' && duration > 0 && (
        <div className="pointer-events-none absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[11px] font-mono tabular-nums text-neutral-400">
          <span>{formatTime(currentTime, true)}</span>
          <span>{formatTime(duration, false)}</span>
        </div>
      )}
    </div>
  );
};
