import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Repeat,
  Volume2,
  VolumeX,
  Scissors,
  Bookmark,
  Download,
  Wand2,
  Check,
  Clock,
  Sparkles,
  FileEdit,
  Save,
  X,
} from 'lucide-react';
import { RecordingItem, Language, AudioEffectType, AudioBookmark } from '../types/audio';
import { UseAudioPlayerReturn } from '../hooks/useAudioPlayer';
import { WaveformCanvas } from './WaveformCanvas';
import { translations } from '../utils/i18n';
import { formatTime, formatBytes, decodeAudioBlob, trimAudioBuffer, extractPeaks } from '../utils/audioProcessing';
import { audioBufferToWav } from '../utils/wavEncoder';
import { AITranscriptionPanel } from './AITranscriptionPanel';

interface StudioPlayerProps {
  player: UseAudioPlayerReturn;
  recording: RecordingItem;
  onUpdateRecording: (recording: RecordingItem) => void;
  onSaveTrimmedRecording: (newRecording: RecordingItem) => void;
  onOpenDetails: (recording: RecordingItem) => void;
  lang: Language;
}

export const StudioPlayer: React.FC<StudioPlayerProps> = ({
  player,
  recording,
  onUpdateRecording,
  onSaveTrimmedRecording,
  onOpenDetails,
  lang,
}) => {
  const t = translations[lang];
  const {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    isLooping,
    audioEffect,
    trimRange,
    togglePlay,
    seek,
    setSpeed,
    setVol,
    toggleMute,
    toggleLoop,
    setEffect,
    setTrim,
  } = player;

  const [isTrimmingMode, setIsTrimmingMode] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(duration || recording.duration || 1);
  const [isProcessingTrim, setIsProcessingTrim] = useState(false);
  const [trimSuccessMessage, setTrimSuccessMessage] = useState(false);

  // New Bookmark input
  const [newBookmarkText, setNewBookmarkText] = useState('');
  const [showAddBookmark, setShowAddBookmark] = useState(false);

  // Initialize trimming mode
  const handleToggleTrimMode = () => {
    if (isTrimmingMode) {
      setIsTrimmingMode(false);
      setTrim(null);
    } else {
      setIsTrimmingMode(true);
      const start = 0;
      const end = duration || recording.duration;
      setTrimStart(start);
      setTrimEnd(end);
      setTrim([start, end]);
    }
  };

  const handleTrimStartChange = (val: number) => {
    const clamped = Math.max(0, Math.min(val, trimEnd - 0.5));
    setTrimStart(clamped);
    setTrim([clamped, trimEnd]);
    seek(clamped);
  };

  const handleTrimEndChange = (val: number) => {
    const maxDur = duration || recording.duration;
    const clamped = Math.min(maxDur, Math.max(val, trimStart + 0.5));
    setTrimEnd(clamped);
    setTrim([trimStart, clamped]);
  };

  // Perform Audio Trim & Save as new file
  const handleConfirmTrim = async () => {
    setIsProcessingTrim(true);
    try {
      const audioBuffer = await decodeAudioBlob(recording.blob);
      const { buffer: trimmedBuffer, wavBlob } = trimAudioBuffer(audioBuffer, trimStart, trimEnd);
      const trimmedPeaks = extractPeaks(trimmedBuffer, 120);

      const trimmedItem: RecordingItem = {
        id: 'rec_trim_' + Date.now(),
        title: `${recording.title} (${lang === 'ar' ? 'مقطع مقصوص' : 'Trimmed'})`,
        blob: wavBlob,
        duration: trimEnd - trimStart,
        createdAt: Date.now(),
        format: 'audio/wav',
        size: wavBlob.size,
        tags: [...recording.tags],
        notes: recording.notes ? `${recording.notes}\n[Trimmed segment from original]` : '',
        transcription: recording.transcription,
        bookmarks: recording.bookmarks
          .filter((b) => b.time >= trimStart && b.time <= trimEnd)
          .map((b) => ({ ...b, time: b.time - trimStart })),
        peaks: trimmedPeaks,
        favorite: false,
        sampleRate: trimmedBuffer.sampleRate,
        channels: trimmedBuffer.numberOfChannels,
      };

      onSaveTrimmedRecording(trimmedItem);
      setIsTrimmingMode(false);
      setTrim(null);
      setTrimSuccessMessage(true);
      setTimeout(() => setTrimSuccessMessage(false), 3000);
    } catch (err) {
      console.error('Trim error:', err);
    } finally {
      setIsProcessingTrim(false);
    }
  };

  // Add bookmark at current playback time
  const handleAddMarker = () => {
    const newBm: AudioBookmark = {
      id: 'bm_' + Date.now(),
      time: Math.round(currentTime * 10) / 10,
      label: newBookmarkText.trim() || `علامة عند ${formatTime(currentTime)}`,
      createdAt: Date.now(),
    };
    const updated = {
      ...recording,
      bookmarks: [...recording.bookmarks, newBm],
    };
    onUpdateRecording(updated);
    setNewBookmarkText('');
    setShowAddBookmark(false);
  };

  // Download WAV file
  const handleDownloadWav = async () => {
    try {
      let downloadBlob = recording.blob;
      if (!recording.format.includes('wav')) {
        const buffer = await decodeAudioBlob(recording.blob);
        downloadBlob = audioBufferToWav(buffer);
      }
      const url = URL.createObjectURL(downloadBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recording.title.replace(/\s+/g, '_')}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Download original file
  const handleDownloadOriginal = () => {
    const url = URL.createObjectURL(recording.blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = recording.format.includes('wav') ? 'wav' : 'webm';
    a.download = `${recording.title.replace(/\s+/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  const maxDuration = duration || recording.duration || 1;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 sm:p-7 shadow-xl backdrop-blur-sm">
      {/* Title & Metadata Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-5 border-b border-neutral-800">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            <span>{recording.title}</span>
            {recording.favorite && <span className="text-amber-400">★</span>}
          </h3>
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
            <span>{formatBytes(recording.size)}</span>
            <span>·</span>
            <span>{formatTime(recording.duration)}</span>
            <span>·</span>
            <span className="uppercase text-neutral-500">{recording.format.split('/')[1] || 'audio'}</span>
            <span>·</span>
            <span>{new Date(recording.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action Buttons: Details / Notes / Download */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenDetails(recording)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
          >
            <FileEdit className="h-3.5 w-3.5" />
            <span>{t.notes}</span>
          </button>

          <button
            onClick={handleDownloadWav}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
            title={t.downloadWav}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="font-mono">WAV</span>
          </button>
        </div>
      </div>

      {/* Interactive Waveform Canvas */}
      <div className="my-5">
        <WaveformCanvas
          mode="playback"
          peaks={recording.peaks}
          currentTime={currentTime}
          duration={maxDuration}
          bookmarks={recording.bookmarks}
          trimRange={trimRange}
          onSeek={seek}
          height={140}
        />
      </div>

      {/* Trim Success Toast */}
      {trimSuccessMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="h-4 w-4" />
          <span>{t.trimSuccess}</span>
        </div>
      )}

      {/* Trimming Sliders (Visible when Trimming Mode is Active) */}
      {isTrimmingMode && (
        <div className="mb-6 p-4 rounded-xl border border-sky-500/30 bg-sky-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
              <Scissors className="h-4 w-4" />
              <span>{t.trimSelection}</span>
            </span>
            <span className="text-xs font-mono text-sky-400 tabular-nums">
              {formatTime(trimEnd - trimStart)} ({formatTime(trimStart)} - {formatTime(trimEnd)})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>{t.startTrim}</span>
                <span className="font-mono tabular-nums">{formatTime(trimStart, true)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={maxDuration}
                step="0.1"
                value={trimStart}
                onChange={(e) => handleTrimStartChange(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>{t.endTrim}</span>
                <span className="font-mono tabular-nums">{formatTime(trimEnd, true)}</span>
              </div>
              <input
                type="range"
                min="0"
                max={maxDuration}
                step="0.1"
                value={trimEnd}
                onChange={(e) => handleTrimEndChange(parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={handleToggleTrimMode}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
            >
              {t.cancelTrim}
            </button>
            <button
              onClick={handleConfirmTrim}
              disabled={isProcessingTrim}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-neutral-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors"
            >
              {isProcessingTrim ? (
                <div className="h-3.5 w-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>{t.saveTrimmedCopy}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Playback Bar (Play, Skip, Speed, Volume, Trim, Loop) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        {/* Playback Controls Cluster */}
        <div className="flex items-center gap-3">
          {/* Rewind 5s */}
          <button
            onClick={() => seek(currentTime - 5)}
            className="p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors"
            title="-5s"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* Master Play / Pause */}
          <button
            onClick={togglePlay}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-neutral-950 shadow-md hover:bg-amber-400 active:scale-95 transition-all cursor-pointer"
            title={isPlaying ? t.pause : t.play}
          >
            {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ms-0.5" />}
          </button>

          {/* Forward 5s */}
          <button
            onClick={() => seek(currentTime + 5)}
            className="p-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors"
            title="+5s"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          {/* Loop toggle */}
          <button
            onClick={toggleLoop}
            className={`p-2 rounded-lg transition-colors ${
              isLooping ? 'bg-amber-500/20 text-amber-400' : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
            }`}
            title={t.loopPlayback}
          >
            <Repeat className="h-4 w-4" />
          </button>

          {/* Trim Mode Toggle Button */}
          <button
            onClick={handleToggleTrimMode}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isTrimmingMode
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
            title={t.trimAndEdit}
          >
            <Scissors className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.trimAndEdit}</span>
          </button>
        </div>

        {/* Speed & Volume Section */}
        <div className="flex items-center gap-4">
          {/* Speed Selector */}
          <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs font-mono">
            {speedOptions.map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeed(spd)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  playbackRate === spd ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Volume Slider & Mute */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-neutral-400 hover:text-neutral-200 transition-colors"
              title={isMuted ? t.unmute : t.mute}
            >
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVol(parseFloat(e.target.value))}
              className="w-16 sm:w-20 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Audio Effects / Equalizer Filter Presets */}
      <div className="mt-6 pt-5 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <Wand2 className="h-3.5 w-3.5 text-amber-400" />
          <span>{t.audioEffects}:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'normal', label: t.fxNormal },
              { id: 'vocal_enhance', label: t.fxVocalEnhance },
              { id: 'bass_boost', label: t.fxBassBoost },
              { id: 'clean_voice', label: t.fxCleanVoice },
            ] as const
          ).map((fx) => (
            <button
              key={fx.id}
              onClick={() => setEffect(fx.id as AudioEffectType)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                audioEffect === fx.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium'
                  : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
            >
              {fx.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookmarks / Markers List */}
      <div className="mt-5 pt-4 border-t border-neutral-800">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
            <Bookmark className="h-3.5 w-3.5 text-sky-400" />
            <span>{t.bookmarks} ({recording.bookmarks.length})</span>
          </div>

          <button
            onClick={() => setShowAddBookmark(!showAddBookmark)}
            className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
          >
            <span>+</span>
            <span>{t.addBookmark}</span>
          </button>
        </div>

        {/* Add Marker Row */}
        {showAddBookmark && (
          <div className="mb-3 flex items-center gap-2">
            <input
              type="text"
              value={newBookmarkText}
              onChange={(e) => setNewBookmarkText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMarker()}
              placeholder={t.bookmarkPlaceholder}
              className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none"
            />
            <button
              onClick={handleAddMarker}
              className="px-3 py-1.5 text-xs font-medium text-neutral-900 bg-sky-400 hover:bg-sky-300 rounded-xl transition-colors"
            >
              {t.addBookmark} ({formatTime(currentTime)})
            </button>
            <button
              onClick={() => setShowAddBookmark(false)}
              className="p-1.5 text-neutral-400 hover:text-neutral-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {recording.bookmarks.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {recording.bookmarks.map((bm) => (
              <button
                key={bm.id}
                onClick={() => seek(bm.time)}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 transition-colors cursor-pointer"
                title="اضغط للانتقال لهذا التوقيت"
              >
                <Clock className="h-3 w-3 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="font-mono text-sky-300 tabular-nums">{formatTime(bm.time)}</span>
                <span className="text-neutral-500">·</span>
                <span className="truncate max-w-[150px]">{bm.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-500 italic">{t.noBookmarks}</p>
        )}
      </div>

      {/* AI Speech Transcription & Translation Studio Panel */}
      <div className="mt-6 pt-5 border-t border-neutral-800">
        <AITranscriptionPanel
          recording={recording}
          onUpdateRecording={onUpdateRecording}
          lang={lang}
        />
      </div>
    </div>
  );
};
