import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioBookmark, RecordingSettings } from '../types/audio';
import { calculateDecibels, getAudioContext } from '../utils/audioProcessing';

export interface UseAudioRecorderReturn {
  status: 'idle' | 'recording' | 'paused';
  elapsedTime: number;
  decibels: number;
  isClipping: boolean;
  bookmarks: AudioBookmark[];
  frequencyData: Uint8Array | null;
  timeDomainData: Uint8Array | null;
  startRecording: (settings: RecordingSettings) => Promise<boolean>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<{ blob: Blob; duration: number } | null>;
  cancelRecording: () => void;
  addBookmark: (label?: string) => AudioBookmark | null;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [status, setStatus] = useState<'idle' | 'recording' | 'paused'>('idle');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [decibels, setDecibels] = useState(-60);
  const [isClipping, setIsClipping] = useState(false);
  const [bookmarks, setBookmarks] = useState<AudioBookmark[]>([]);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  const [timeDomainData, setTimeDomainData] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const totalPausedDurationRef = useRef<number>(0);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const monitorGainNodeRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const stopPromiseResolverRef = useRef<((val: { blob: Blob; duration: number } | null) => void) | null>(null);

  const cleanupAudioNodes = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (monitorGainNodeRef.current) {
      monitorGainNodeRef.current.disconnect();
      monitorGainNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const updateMeters = useCallback(() => {
    if (!analyserRef.current || status !== 'recording') return;

    const analyser = analyserRef.current;
    const fData = new Uint8Array(analyser.frequencyBinCount);
    const tData = new Uint8Array(analyser.fftSize);

    analyser.getByteFrequencyData(fData);
    analyser.getByteTimeDomainData(tData);

    setFrequencyData(new Uint8Array(fData));
    setTimeDomainData(new Uint8Array(tData));

    const { db, isClipping: clipping } = calculateDecibels(tData);
    setDecibels(db);
    setIsClipping(clipping);

    animationFrameRef.current = requestAnimationFrame(updateMeters);
  }, [status]);

  useEffect(() => {
    if (status === 'recording') {
      animationFrameRef.current = requestAnimationFrame(updateMeters);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [status, updateMeters]);

  const startRecording = useCallback(
    async (settings: RecordingSettings): Promise<boolean> => {
      try {
        setError(null);
        cleanupAudioNodes();
        audioChunksRef.current = [];
        setBookmarks([]);
        setElapsedTime(0);

        const constraints: MediaStreamConstraints = {
          audio: {
            deviceId: settings.deviceId ? { exact: settings.deviceId } : undefined,
            echoCancellation: settings.echoCancellation,
            noiseSuppression: settings.noiseSuppression,
            autoGainControl: settings.autoGainControl,
          },
          video: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        const audioCtx = getAudioContext();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const source = audioCtx.createMediaStreamSource(stream);
        sourceNodeRef.current = source;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.75;
        source.connect(analyser);
        analyserRef.current = analyser;

        // Monitoring
        if (settings.monitoring) {
          const monitorGain = audioCtx.createGain();
          monitorGain.gain.value = 0.8;
          source.connect(monitorGain);
          monitorGain.connect(audioCtx.destination);
          monitorGainNodeRef.current = monitorGain;
        }

        // Determine mime type
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = '';
            }
          }
        }

        const options: MediaRecorderOptions = {
          mimeType: mimeType || undefined,
          audioBitsPerSecond: settings.audioBitsPerSecond || 128000,
        };

        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const fullBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorder.mimeType || 'audio/webm',
          });
          const duration = (Date.now() - startTimeRef.current - totalPausedDurationRef.current) / 1000;

          if (stopPromiseResolverRef.current) {
            stopPromiseResolverRef.current({
              blob: fullBlob,
              duration: Math.max(0.5, duration),
            });
            stopPromiseResolverRef.current = null;
          }
          cleanupAudioNodes();
        };

        mediaRecorder.start(200); // 200ms slice
        startTimeRef.current = Date.now();
        totalPausedDurationRef.current = 0;
        setStatus('recording');

        timerRef.current = window.setInterval(() => {
          const elapsed = (Date.now() - startTimeRef.current - totalPausedDurationRef.current) / 1000;
          setElapsedTime(Math.max(0, elapsed));
        }, 100);

        return true;
      } catch (err: any) {
        console.error('Error starting audio recording:', err);
        setError(err.message || 'Microphone error');
        setStatus('idle');
        cleanupAudioNodes();
        return false;
      }
    },
    [cleanupAudioNodes]
  );

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.pause();
      pausedTimeRef.current = Date.now();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setStatus('paused');
    }
  }, [status]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'paused') {
      mediaRecorderRef.current.resume();
      if (pausedTimeRef.current > 0) {
        totalPausedDurationRef.current += Date.now() - pausedTimeRef.current;
        pausedTimeRef.current = 0;
      }
      setStatus('recording');

      timerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current - totalPausedDurationRef.current) / 1000;
        setElapsedTime(Math.max(0, elapsed));
      }, 100);
    }
  }, [status]);

  const stopRecording = useCallback((): Promise<{ blob: Blob; duration: number } | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || status === 'idle') {
        resolve(null);
        return;
      }

      stopPromiseResolverRef.current = resolve;
      setStatus('idle');

      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      } else {
        resolve(null);
      }
    });
  }, [status]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    cleanupAudioNodes();
    audioChunksRef.current = [];
    setStatus('idle');
    setElapsedTime(0);
    setBookmarks([]);
  }, [cleanupAudioNodes]);

  const addBookmark = useCallback((label?: string): AudioBookmark | null => {
    if (status === 'idle') return null;
    const newBookmark: AudioBookmark = {
      id: 'bm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      time: Math.round(elapsedTime * 10) / 10,
      label: label || `علامة عند ${Math.floor(elapsedTime / 60)}:${Math.floor(elapsedTime % 60).toString().padStart(2, '0')}`,
      createdAt: Date.now(),
    };
    setBookmarks((prev) => [...prev, newBookmark]);
    return newBookmark;
  }, [status, elapsedTime]);

  return {
    status,
    elapsedTime,
    decibels,
    isClipping,
    bookmarks,
    frequencyData,
    timeDomainData,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    addBookmark,
    error,
  };
}
