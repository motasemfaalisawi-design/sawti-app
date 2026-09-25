import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  Bookmark,
  Sliders,
  Sparkles,
  Volume2,
  AlertTriangle,
  FileAudio,
  Radio,
  Clock,
  Check,
  Languages,
  ArrowLeftRight,
} from 'lucide-react';
import { UseAudioRecorderReturn } from '../hooks/useAudioRecorder';
import { RecordingSettings, VisualizerMode, Language, AudioBookmark, RecordingItem } from '../types/audio';
import { WaveformCanvas } from './WaveformCanvas';
import { translations } from '../utils/i18n';
import { formatTime, decodeAudioBlob, extractPeaks } from '../utils/audioProcessing';
import { audioBufferToWav } from '../utils/wavEncoder';
import { LiveSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/speechRecognition';
import { transcribeAndTranslateAudio, liveTranslatePhrase } from '../utils/aiTranscription';

interface StudioRecorderProps {
  recorder: UseAudioRecorderReturn;
  settings: RecordingSettings;
  onOpenSettings: () => void;
  onRecordingSaved: (recording: RecordingItem) => void;
  lang: Language;
}

export const StudioRecorder: React.FC<StudioRecorderProps> = ({
  recorder,
  settings,
  onOpenSettings,
  onRecordingSaved,
  lang,
}) => {
  const t = translations[lang];
  const {
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
  } = recorder;

  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');
  const [selectedFormat, setSelectedFormat] = useState<'webm' | 'wav'>(settings.format || 'wav');
  const [isLiveTranscribeActive, setIsLiveTranscribeActive] = useState(false);
  const [studioSpeechLang, setStudioSpeechLang] = useState<'ar-SA' | 'en-US'>(lang === 'ar' ? 'ar-SA' : 'en-US');
  const [autoAITranscribe, setAutoAITranscribe] = useState(true);
  const [liveTranscriptionText, setLiveTranscriptionText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [liveTranslatedText, setLiveTranslatedText] = useState('');
  const [silenceCountdown, setSilenceCountdown] = useState<number>(3.0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [isSpeakingWords, setIsSpeakingWords] = useState(false);
  const [isProcessingSave, setIsProcessingSave] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [bookmarkInput, setBookmarkInput] = useState('');
  const [showBookmarkSuccess, setShowBookmarkSuccess] = useState(false);

  const speechRecognizerRef = useRef<LiveSpeechRecognizer | null>(null);
  const studioSpeechLangRef = useRef(studioSpeechLang);
  studioSpeechLangRef.current = studioSpeechLang;
  const countdownIntervalRef = useRef<any>(null);
  const translateDebounceTimerRef = useRef<any>(null);

  const clearSilenceCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsCountingDown(false);
    setSilenceCountdown(3.0);
  };

  const startSilenceCountdown = () => {
    clearSilenceCountdown();
    setIsCountingDown(true);
    setSilenceCountdown(3.0);

    const step = 100;
    let remainingMs = 3000;

    countdownIntervalRef.current = setInterval(() => {
      remainingMs -= step;
      if (remainingMs <= 0) {
        clearSilenceCountdown();
        speechRecognizerRef.current?.restartFreshSession();
      } else {
        setSilenceCountdown(Number((remainingMs / 1000).toFixed(1)));
      }
    }, step);
  };

  // Initialize Speech Recognition when requested
  useEffect(() => {
    if (!isSpeechRecognitionSupported()) return;

    const speechLang = studioSpeechLangRef.current;
    speechRecognizerRef.current = new LiveSpeechRecognizer({
      lang: speechLang,
      silenceThresholdMs: 650,
      onText: (final, interim, segment) => {
        clearSilenceCountdown();
        setIsSpeakingWords(true);
        setLiveTranscriptionText(final);
        setInterimText(interim);

        const activePhrase = interim.trim() || segment?.trim() || final.trim();
        if (activePhrase) {
          if (translateDebounceTimerRef.current) {
            clearTimeout(translateDebounceTimerRef.current);
          }
          const isSingleWord = !activePhrase.includes(' ');
          const delay = isSingleWord ? 25 : 80;

          translateDebounceTimerRef.current = setTimeout(async () => {
            try {
              const isArabic = studioSpeechLangRef.current === 'ar-SA';
              const srcL = isArabic ? 'ar' : 'en';
              const tgtL = isArabic ? 'en' : 'ar';
              const res = await liveTranslatePhrase(activePhrase, undefined, srcL, tgtL);
              if (res && res.translated) {
                setLiveTranslatedText(res.translated);
              }
            } catch (e) {
              console.warn('Live translate inline error:', e);
            }
          }, delay);
        }
      },
      onSpeechStart: () => {
        clearSilenceCountdown();
        setIsSpeakingWords(true);
      },
      onSpeechEnd: () => {
        setIsSpeakingWords(false);
      },
      onSilence: () => {
        setIsSpeakingWords(false);
        startSilenceCountdown();
      },
    });

    return () => {
      speechRecognizerRef.current?.abort();
      clearSilenceCountdown();
    };
  }, [lang]);

  // Start / stop speech recognition based on recording state
  useEffect(() => {
    if (!isLiveTranscribeActive || !speechRecognizerRef.current) return;

    if (status === 'recording') {
      speechRecognizerRef.current.start();
    } else if (status === 'paused') {
      speechRecognizerRef.current.stop();
    } else if (status === 'idle') {
      speechRecognizerRef.current.stop();
    }
  }, [status, isLiveTranscribeActive]);

  const handleStart = async () => {
    setLiveTranscriptionText('');
    setInterimText('');
    const success = await startRecording({
      ...settings,
      format: selectedFormat,
    });
    if (success && isLiveTranscribeActive && speechRecognizerRef.current) {
      speechRecognizerRef.current.start();
    }
  };

  const handleStopAndSave = async () => {
    setIsProcessingSave(true);
    setProcessingStatusText(
      autoAITranscribe
        ? (lang === 'ar' ? 'جاري المعالجة والتفريغ والترجمة (عربي ⇄ إنجليزي)...' : 'Processing audio & translating (Arabic ⇄ English)...')
        : (lang === 'ar' ? 'جاري حفظ الملف الصوتي...' : 'Saving audio file...')
    );

    let transcription = liveTranscriptionText;
    if (speechRecognizerRef.current) {
      transcription = speechRecognizerRef.current.stop();
    }

    const result = await stopRecording();
    if (!result) {
      setIsProcessingSave(false);
      setProcessingStatusText('');
      return;
    }

    try {
      let finalBlob = result.blob;
      let finalFormat = result.blob.type || 'audio/webm';
      let decodedBuffer: AudioBuffer | null = null;

      try {
        decodedBuffer = await decodeAudioBlob(result.blob);
      } catch (e) {
        console.warn('Decode blob warning:', e);
      }

      // Convert to pure WAV if WAV format selected
      if (selectedFormat === 'wav' && decodedBuffer) {
        finalBlob = audioBufferToWav(decodedBuffer);
        finalFormat = 'audio/wav';
      }

      // Precompute peaks for fast waveform rendering
      const peaks = decodedBuffer ? extractPeaks(decodedBuffer, 120) : [];

      const now = new Date();
      const defaultTitle =
        lang === 'ar'
          ? `تسجيل ${now.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })} - ${now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`
          : `Recording ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

      let translatedText = '';
      let detectedLanguage: string | undefined = undefined;
      let detectedLanguageLabel: string | undefined = undefined;
      let targetLanguage: string | undefined = undefined;
      let targetLanguageLabel: string | undefined = undefined;
      let summary: string | undefined = undefined;
      let segments: any[] = [];

      // If Auto AI Transcribe & Translate is enabled, execute via Gemini API
      if (autoAITranscribe) {
        try {
          const aiResult = await transcribeAndTranslateAudio(finalBlob, transcription);
          if (aiResult) {
            transcription = aiResult.originalTranscription || transcription;
            translatedText = aiResult.translatedText || '';
            detectedLanguage = aiResult.detectedLanguage;
            detectedLanguageLabel = aiResult.detectedLanguageLabel;
            targetLanguage = aiResult.targetLanguage;
            targetLanguageLabel = aiResult.targetLanguageLabel;
            summary = aiResult.summary;
            segments = aiResult.segments || [];
          }
        } catch (aiErr) {
          console.warn('AI transcription during save skipped/errored:', aiErr);
        }
      }

      const newRecording: RecordingItem = {
        id: 'rec_' + Date.now(),
        title: defaultTitle,
        blob: finalBlob,
        duration: Math.max(0.5, result.duration),
        createdAt: Date.now(),
        format: finalFormat,
        size: finalBlob.size,
        tags: [lang === 'ar' ? 'صوت' : 'Audio'],
        notes: '',
        transcription: transcription.trim(),
        translatedText: translatedText.trim(),
        detectedLanguage,
        detectedLanguageLabel,
        targetLanguage,
        targetLanguageLabel,
        summary,
        segments,
        bookmarks: [...bookmarks],
        peaks,
        favorite: false,
        sampleRate: decodedBuffer?.sampleRate || 48000,
        channels: decodedBuffer?.numberOfChannels || 1,
      };

      onRecordingSaved(newRecording);
    } catch (err) {
      console.error('Save recording error:', err);
    } finally {
      setIsProcessingSave(false);
      setProcessingStatusText('');
      setLiveTranscriptionText('');
      setInterimText('');
    }
  };

  const handleAddBookmark = () => {
    if (status === 'idle') return;
    addBookmark(bookmarkInput.trim() || undefined);
    setBookmarkInput('');
    setShowBookmarkSuccess(true);
    setTimeout(() => setShowBookmarkSuccess(false), 2000);
  };

  const hasSpeechSupport = isSpeechRecognitionSupported();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Studio Header Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            <span>{t.studioRecorder}</span>
            {status === 'recording' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                {t.recording}
              </span>
            )}
            {status === 'paused' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {t.paused}
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            {status === 'idle' ? t.pressToRecord : t.recording}
          </p>
        </div>

        {/* Studio Controls Header (Visualizer mode, format, settings) */}
        <div className="flex items-center gap-2">
          {/* Format selector */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setSelectedFormat('wav')}
              disabled={status !== 'idle'}
              className={`px-2.5 py-1 rounded-md font-mono transition-colors ${
                selectedFormat === 'wav'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              WAV
            </button>
            <button
              onClick={() => setSelectedFormat('webm')}
              disabled={status !== 'idle'}
              className={`px-2.5 py-1 rounded-md font-mono transition-colors ${
                selectedFormat === 'webm'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              WebM
            </button>
          </div>

          {/* Visualizer Mode selector */}
          <div className="hidden sm:flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setVisualizerMode('bars')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                visualizerMode === 'bars'
                  ? 'bg-neutral-800 text-neutral-100'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {t.visualizerBars}
            </button>
            <button
              onClick={() => setVisualizerMode('wave')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                visualizerMode === 'wave'
                  ? 'bg-neutral-800 text-neutral-100'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {t.visualizerWave}
            </button>
            <button
              onClick={() => setVisualizerMode('frequency')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                visualizerMode === 'frequency'
                  ? 'bg-neutral-800 text-neutral-100'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {t.visualizerFreq}
            </button>
          </div>

          {/* Mic settings trigger */}
          <button
            onClick={onOpenSettings}
            disabled={status !== 'idle'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors disabled:opacity-50"
            title={t.micSettings}
          >
            <Sliders className="h-3.5 w-3.5 text-neutral-400" />
            <span className="hidden md:inline">{t.settings}</span>
          </button>
        </div>
      </div>

      {/* Error alert if mic denied */}
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <div className="font-semibold">{t.micPermissionDenied}</div>
            <div className="text-neutral-400 mt-0.5">{t.micPermissionHelp}</div>
          </div>
        </div>
      )}

      {/* Main Studio Deck */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 sm:p-8 backdrop-blur-sm shadow-xl">
        {/* Large Timer Display */}
        <div className="flex flex-col items-center justify-center pt-2 pb-6">
          <div className="font-mono text-4xl sm:text-6xl font-bold tracking-tight text-neutral-100 tabular-nums">
            {formatTime(elapsedTime, true)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs font-mono text-neutral-500">
            <Radio className={`h-3 w-3 ${status === 'recording' ? 'text-rose-500 animate-pulse' : 'text-neutral-600'}`} />
            <span>48 kHz</span>
            <span>·</span>
            <span className="uppercase">{selectedFormat}</span>
            <span>·</span>
            <span>128 kbps</span>
          </div>
        </div>

        {/* Audio Waveform Canvas */}
        <div className="my-2">
          <WaveformCanvas
            mode="live"
            visualizerMode={visualizerMode}
            frequencyData={frequencyData}
            timeDomainData={timeDomainData}
            isRecording={status === 'recording'}
            height={130}
          />
        </div>

        {/* Decibel Level Meter (VU Meter) */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80">
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1.5">
            <span className="flex items-center gap-1">
              <Volume2 className="h-3.5 w-3.5 text-neutral-500" />
              <span>{t.decibelMeter}</span>
            </span>
            <span className="tabular-nums">
              {status === 'recording' ? `${decibels} dB` : '-∞ dB'}
            </span>
          </div>

          <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-800">
            {/* Decibel progress bar: mapped from -60 to 0dB */}
            <div
              className={`h-full transition-all duration-75 ${
                isClipping
                  ? 'bg-rose-500'
                  : decibels > -6
                  ? 'bg-amber-400'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: status === 'recording' ? `${Math.max(0, Math.min(100, ((decibels + 60) / 60) * 100))}%` : '0%',
              }}
            />
          </div>

          {isClipping && (
            <p className="mt-1.5 text-[11px] text-rose-400 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {t.clippingWarning}
            </p>
          )}
        </div>

        {/* Studio Primary Controls */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {status === 'idle' ? (
            <button
              onClick={handleStart}
              className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 active:scale-95 transition-all cursor-pointer"
              title={t.record}
            >
              <div className="absolute inset-0 rounded-full bg-rose-500 opacity-20 group-hover:animate-ping" />
              <Mic className="h-8 w-8 transition-transform group-hover:scale-110" />
            </button>
          ) : (
            <div className="flex items-center gap-4">
              {/* Cancel / Discard button */}
              <button
                onClick={cancelRecording}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                title={t.cancelRecording}
              >
                <RotateCcw className="h-5 w-5" />
              </button>

              {/* Pause / Resume button */}
              {status === 'recording' ? (
                <button
                  onClick={pauseRecording}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all"
                  title={t.pause}
                >
                  <Pause className="h-6 w-6" />
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all"
                  title={t.resume}
                >
                  <Play className="h-6 w-6 fill-current" />
                </button>
              )}

              {/* Stop & Save button */}
              <button
                onClick={handleStopAndSave}
                disabled={isProcessingSave}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 active:scale-95 transition-all"
                title={t.stopAndSave}
              >
                {isProcessingSave ? (
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Square className="h-7 w-7 fill-current" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Processing & Translation Status Message */}
        {isProcessingSave && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center animate-pulse">
            <p className="text-xs text-amber-300 font-medium flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 animate-spin text-amber-400" />
              <span>{processingStatusText}</span>
            </p>
          </div>
        )}

        {/* AI Bilingual Transcribe & Translate Toggle */}
        <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
              <Languages className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-neutral-200">
                  {t.aiTranscribeTranslate}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 text-amber-300">
                  <span>عربي</span>
                  <ArrowLeftRight className="h-2.5 w-2.5 text-neutral-400" />
                  <span>English</span>
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {t.bidirectionalFeatureDesc}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 self-end sm:self-center">
            <input
              type="checkbox"
              checked={autoAITranscribe}
              onChange={(e) => setAutoAITranscribe(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Live Bookmarking Toolbar (during active recording) */}
        {status !== 'idle' && (
          <div className="mt-8 pt-6 border-t border-neutral-800/80">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={bookmarkInput}
                onChange={(e) => setBookmarkInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddBookmark()}
                placeholder={t.bookmarkPlaceholder}
                className="w-full sm:flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none"
              />
              <button
                onClick={handleAddBookmark}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-neutral-900 bg-sky-400 hover:bg-sky-300 rounded-xl transition-colors whitespace-nowrap"
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span>{t.addBookmark}</span>
              </button>
            </div>

            {showBookmarkSuccess && (
              <p className="mt-2 text-xs text-sky-400 flex items-center gap-1 animate-in fade-in">
                <Check className="h-3.5 w-3.5" />
                {t.bookmarkAdded} ({formatTime(elapsedTime)})
              </p>
            )}

            {/* List of bookmarks added so far */}
            {bookmarks.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {bookmarks.map((bm) => (
                  <span
                    key={bm.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300"
                  >
                    <Clock className="h-3 w-3 text-sky-400" />
                    <span className="font-mono tabular-nums text-sky-300">{formatTime(bm.time)}</span>
                    <span className="text-neutral-400">·</span>
                    <span>{bm.label}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Live Speech & Instant Subtitle Panel */}
        {hasSpeechSupport && (
          <div className="mt-6 pt-5 border-t border-neutral-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-neutral-200">{t.liveSubtitles}</span>
                {isCountingDown && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                    {silenceCountdown}s متبقية
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Manual Voice Selection for Subtitles */}
                <select
                  value={studioSpeechLang}
                  onChange={(e) => {
                    const newL = e.target.value as 'ar-SA' | 'en-US';
                    setStudioSpeechLang(newL);
                    studioSpeechLangRef.current = newL;
                    speechRecognizerRef.current?.setLanguage(newL);
                  }}
                  className="bg-neutral-900 border border-neutral-700 text-amber-300 text-xs rounded-lg px-2.5 py-1 font-semibold cursor-pointer focus:outline-none"
                  title="لغة التحدث للميكروفون"
                >
                  <option value="ar-SA">🇸🇦 أحكي عربي (Translate to English)</option>
                  <option value="en-US">🇺🇸 Speak English (ترجم للعربي)</option>
                </select>

                <button
                  onClick={() => setIsLiveTranscribeActive(!isLiveTranscribeActive)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    isLiveTranscribeActive
                      ? 'bg-amber-400 text-neutral-950 font-semibold'
                      : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {isLiveTranscribeActive ? (lang === 'ar' ? 'مفعل' : 'Active') : (lang === 'ar' ? 'تفعيل' : 'Enable')}
                </button>
              </div>
            </div>

            {isLiveTranscribeActive && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
                {/* Spoken consecutive words stream */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-amber-400 mb-1.5">
                    <span>{t.originalSpeech}:</span>
                    {isSpeakingWords && (
                      <span className="text-emerald-400 text-[10px] flex items-center gap-1 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>{t.speakingActive}</span>
                      </span>
                    )}
                  </div>

                  {liveTranscriptionText || interimText ? (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-200 leading-relaxed font-sans">
                      {(liveTranscriptionText + ' ' + interimText)
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean)
                        .map((w, i, arr) => (
                          <span
                            key={i}
                            className={`px-1.5 py-0.5 rounded transition-all ${
                              i === arr.length - 1 && isSpeakingWords
                                ? 'bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40'
                                : 'bg-neutral-900 text-neutral-200'
                            }`}
                          >
                            {w}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <span className="text-neutral-500 italic text-xs">
                      {t.transcriptionPlaceholder}
                    </span>
                  )}
                </div>

                {/* Instant Live Translation Subtitle */}
                {liveTranslatedText && (
                  <div className="pt-2 border-t border-neutral-800/80">
                    <span className="text-[11px] font-medium text-sky-400 block mb-1">
                      {t.translatedSpeech}:
                    </span>
                    <p className="text-xs text-sky-200 font-medium leading-relaxed">
                      {liveTranslatedText}
                    </p>
                  </div>
                )}

                {/* 3-Second Hold Countdown Bar */}
                {isCountingDown && (
                  <div className="pt-1 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-amber-400/90">
                      <span>{t.threeSecSilenceRule}</span>
                      <span>{silenceCountdown}s</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-100 ease-linear rounded-full"
                        style={{ width: `${(silenceCountdown / 3.0) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
