import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Languages,
  Clock,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Trash2,
  Maximize2,
  Minimize2,
  RotateCcw,
  ArrowLeftRight,
  Download,
  Activity,
  Play,
} from 'lucide-react';
import { Language } from '../types/audio';
import { translations } from '../utils/i18n';
import { LiveSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/speechRecognition';
import { liveTranslatePhrase, speakText, stopSpeaking } from '../utils/aiTranscription';

interface HistoryItem {
  id: string;
  timestamp: string;
  original: string;
  translated: string;
  sourceLang: string;
  targetLang: string;
}

export interface SpeechLangOption {
  code: string;
  short: string;
  name: string;
  flag: string;
}

export const SPEECH_LANGUAGES: SpeechLangOption[] = [
  { code: 'ar-SA', short: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦' },
  { code: 'en-US', short: 'en', name: 'English (الإنجليزية)', flag: '🇺🇸' },
  { code: 'fr-FR', short: 'fr', name: 'Français (الفرنسية)', flag: '🇫🇷' },
  { code: 'es-ES', short: 'es', name: 'Español (الإسبانية)', flag: '🇪🇸' },
  { code: 'de-DE', short: 'de', name: 'Deutsch (الألمانية)', flag: '🇩🇪' },
  { code: 'tr-TR', short: 'tr', name: 'Türkçe (التركية)', flag: '🇹🇷' },
];

export const TARGET_LANGUAGES = [
  { short: 'en', name: 'English (الإنجليزية)', flag: '🇺🇸' },
  { short: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦' },
  { short: 'fr', name: 'Français (الفرنسية)', flag: '🇫🇷' },
  { short: 'es', name: 'Español (الإسبانية)', flag: '🇪🇸' },
  { short: 'de', name: 'Deutsch (الألمانية)', flag: '🇩🇪' },
  { short: 'tr', name: 'Türkçe (التركية)', flag: '🇹🇷' },
];

interface LiveTranslatorViewProps {
  lang: Language;
}

export const LiveTranslatorView: React.FC<LiveTranslatorViewProps> = ({ lang }) => {
  const t = translations[lang];

  // Manual Language Selection State
  const [sourceSpeechLang, setSourceSpeechLang] = useState<string>('ar-SA');
  const [targetTranslateLang, setTargetTranslateLang] = useState<string>('en');

  // Active translation state
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // 3-Second Silence Rule countdown
  const [silenceCountdown, setSilenceCountdown] = useState<number>(3.0);
  const [isCountingDown, setIsCountingDown] = useState(false);

  // References
  const recognizerRef = useRef<LiveSpeechRecognizer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<any>(null);
  const lastActivePhraseRef = useRef<{ original: string; translated: string }>({ original: '', translated: '' });
  const pendingTranslateTimeoutRef = useRef<any>(null);

  // Keep references updated for callbacks
  const sourceSpeechLangRef = useRef(sourceSpeechLang);
  sourceSpeechLangRef.current = sourceSpeechLang;
  const targetTranslateLangRef = useRef(targetTranslateLang);
  targetTranslateLangRef.current = targetTranslateLang;
  const spokenTextRef = useRef(spokenText);
  spokenTextRef.current = spokenText;
  const translatedTextRef = useRef(translatedText);
  translatedTextRef.current = translatedText;
  const autoSpeakRef = useRef(autoSpeak);
  autoSpeakRef.current = autoSpeak;
  const isCountingDownRef = useRef(isCountingDown);
  isCountingDownRef.current = isCountingDown;

  // Language change handlers
  const handleChangeSourceLang = (code: string) => {
    setSourceSpeechLang(code);
    sourceSpeechLangRef.current = code;

    const chosenSrc = SPEECH_LANGUAGES.find((l) => l.code === code);
    if (chosenSrc && chosenSrc.short === targetTranslateLang) {
      const fallbackTarget = chosenSrc.short === 'ar' ? 'en' : 'ar';
      setTargetTranslateLang(fallbackTarget);
      targetTranslateLangRef.current = fallbackTarget;
    }

    if (recognizerRef.current) {
      recognizerRef.current.setLanguage(code);
    }
  };

  const handleChangeTargetLang = (short: string) => {
    setTargetTranslateLang(short);
    targetTranslateLangRef.current = short;

    const chosenSrc = SPEECH_LANGUAGES.find((l) => l.code === sourceSpeechLang);
    if (chosenSrc && chosenSrc.short === short) {
      const fallbackSpeech = SPEECH_LANGUAGES.find((l) => l.short !== short);
      if (fallbackSpeech) {
        setSourceSpeechLang(fallbackSpeech.code);
        sourceSpeechLangRef.current = fallbackSpeech.code;
        if (recognizerRef.current) {
          recognizerRef.current.setLanguage(fallbackSpeech.code);
        }
      }
    }
  };

  const handleSwapLanguages = () => {
    const currentSrcObj = SPEECH_LANGUAGES.find((l) => l.code === sourceSpeechLang) || SPEECH_LANGUAGES[0];
    const currentTgtObj = TARGET_LANGUAGES.find((l) => l.short === targetTranslateLang) || TARGET_LANGUAGES[0];

    const nextSpeechLangCode =
      SPEECH_LANGUAGES.find((l) => l.short === currentTgtObj.short)?.code ||
      (currentTgtObj.short === 'en' ? 'en-US' : 'ar-SA');
    const nextTargetLangShort = currentSrcObj.short;

    setSourceSpeechLang(nextSpeechLangCode);
    sourceSpeechLangRef.current = nextSpeechLangCode;
    setTargetTranslateLang(nextTargetLangShort);
    targetTranslateLangRef.current = nextTargetLangShort;

    if (recognizerRef.current) {
      recognizerRef.current.setLanguage(nextSpeechLangCode);
    }
  };

  // Clear countdown interval
  const clearSilenceCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsCountingDown(false);
    setSilenceCountdown(3.0);
  }, []);

  // Commit current phrase to history after 3s silence
  const commitCurrentPhrase = useCallback(() => {
    clearSilenceCountdown();
    const currOrig = spokenTextRef.current.trim();
    const currTrans = translatedTextRef.current.trim();

    if (currOrig || currTrans) {
      const srcShort = SPEECH_LANGUAGES.find((l) => l.code === sourceSpeechLangRef.current)?.short || 'ar';
      const tgtShort = targetTranslateLangRef.current || 'en';

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        original: currOrig || lastActivePhraseRef.current.original,
        translated: currTrans || lastActivePhraseRef.current.translated,
        sourceLang: srcShort,
        targetLang: tgtShort,
      };

      setHistory((prev) => [newItem, ...prev.slice(0, 49)]);

      if (autoSpeakRef.current && newItem.translated) {
        speakText(newItem.translated, tgtShort as any);
      }
    }

    // Gracefully clear active text so the screen is ready for the next sentence
    setSpokenText('');
    setInterimText('');
    setTranslatedText('');
    lastActivePhraseRef.current = { original: '', translated: '' };
    // Continuous listening: refresh speech recognition session cleanly without stopping
    recognizerRef.current?.restartFreshSession();
  }, [clearSilenceCountdown, lang]);

  // Start 3-second countdown when user stops speaking
  const startSilenceCountdown = useCallback(() => {
    if (!spokenTextRef.current.trim() && !interimText) return;

    clearSilenceCountdown();
    setIsCountingDown(true);
    setSilenceCountdown(3.0);

    const step = 100; // 100ms steps
    const totalMs = 3000;
    let remainingMs = totalMs;

    countdownIntervalRef.current = setInterval(() => {
      remainingMs -= step;
      if (remainingMs <= 0) {
        commitCurrentPhrase();
      } else {
        setSilenceCountdown(Number((remainingMs / 1000).toFixed(1)));
      }
    }, step);
  }, [clearSilenceCountdown, commitCurrentPhrase, interimText]);

  // Request instant translation for a phrase
  const requestTranslation = useCallback(async (phrase: string) => {
    if (!phrase || !phrase.trim()) return;

    setIsTranslating(true);
    try {
      const srcShort = SPEECH_LANGUAGES.find((l) => l.code === sourceSpeechLangRef.current)?.short || 'ar';
      const tgtShort = targetTranslateLangRef.current || 'en';

      const res = await liveTranslatePhrase(phrase, undefined, srcShort, tgtShort);
      if (res && res.translated) {
        setTranslatedText(res.translated);
        lastActivePhraseRef.current.translated = res.translated;
      }
    } catch (err) {
      console.warn('Live translate request error:', err);
    } finally {
      setIsTranslating(false);
    }
  }, []);

  // Handle incoming speech from recognizer
  const handleSpeechText = useCallback((finalText: string, interim: string, latestSegment?: string) => {
    // If user starts speaking again, immediately cancel the 3-second countdown
    clearSilenceCountdown();
    setIsSpeaking(true);

    const activePhrase = interim.trim() || latestSegment?.trim() || finalText.trim();
    setSpokenText(finalText);
    setInterimText(interim);

    if (activePhrase) {
      lastActivePhraseRef.current.original = activePhrase;
      // Ultra-fast instant translation: single word (20ms) or phrase (70ms)
      const isSingleWord = !activePhrase.includes(' ');
      const debounceDelay = isSingleWord ? 20 : 70;

      if (pendingTranslateTimeoutRef.current) {
        clearTimeout(pendingTranslateTimeoutRef.current);
      }
      pendingTranslateTimeoutRef.current = setTimeout(() => {
        requestTranslation(activePhrase);
      }, debounceDelay);
    }
  }, [clearSilenceCountdown, requestTranslation]);

  // Audio level analyzer loop
  const startAudioMeter = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);
        animFrameRef.current = requestAnimationFrame(checkLevel);
      };

      checkLevel();
    } catch (err) {
      console.warn('Audio meter init error:', err);
    }
  };

  const stopAudioMeter = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  // Start Live Mode
  const startLiveMode = () => {
    setIsActive(true);
    setSpokenText('');
    setInterimText('');
    setTranslatedText('');
    clearSilenceCountdown();

    startAudioMeter();

    const recognizer = new LiveSpeechRecognizer({
      lang: sourceSpeechLangRef.current,
      silenceThresholdMs: 650,
      onText: (finalText, interim, segment) => {
        handleSpeechText(finalText, interim, segment);
      },
      onSpeechStart: () => {
        clearSilenceCountdown();
        setIsSpeaking(true);
      },
      onSpeechEnd: () => {
        setIsSpeaking(false);
      },
      onSilence: () => {
        setIsSpeaking(false);
        startSilenceCountdown();
      },
    });

    recognizer.start();
    recognizerRef.current = recognizer;
  };

  // Stop Live Mode
  const stopLiveMode = () => {
    setIsActive(false);
    setIsSpeaking(false);
    clearSilenceCountdown();
    stopAudioMeter();
    stopSpeaking();

    if (recognizerRef.current) {
      recognizerRef.current.stop();
      recognizerRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLiveMode();
    };
  }, []);

  // Split words for animated sequential rendering ("كلمات متتالية")
  const fullOriginalText = (spokenText + ' ' + interimText).trim();
  const wordsList = fullOriginalText.split(/\s+/).filter(Boolean);

  // Copy full conversation transcript
  const handleCopyHistory = () => {
    if (history.length === 0) return;
    const lines = history
      .map((h) => `[${h.timestamp}] ${h.original}\n➔ ${h.translated}`)
      .reverse()
      .join('\n\n');
    navigator.clipboard.writeText(lines);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Download conversation as text file
  const handleDownloadHistory = () => {
    if (history.length === 0) return;
    const lines = history
      .map((h) => `[${h.timestamp}]\n${h.sourceLang.toUpperCase()}: ${h.original}\n${h.targetLang.toUpperCase()}: ${h.translated}\n`)
      .reverse()
      .join('\n------------------------\n');
    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sawti_live_translation_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Simulate speaking for instant demonstration of 3s hold rule
  const handleSimulateSentence = (sample: string) => {
    clearSilenceCountdown();
    setIsSpeaking(true);
    setSpokenText('');
    setInterimText('');
    setTranslatedText('');

    const words = sample.split(' ');
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx < words.length) {
        const partial = words.slice(0, currentIdx + 1).join(' ');
        setInterimText(partial);
        currentIdx++;
      } else {
        clearInterval(interval);
        setSpokenText(sample);
        setInterimText('');
        setIsSpeaking(false);
        requestTranslation(sample);
        // User stopped speaking -> start 3-second hold countdown!
        startSilenceCountdown();
      }
    }, 280);
  };

  return (
    <div
      className={`relative mx-auto max-w-5xl px-4 sm:px-6 transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-neutral-950 p-6 overflow-y-auto max-w-none' : ''
      }`}
    >
      {/* Top Banner / Feature Intro */}
      <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
              <Languages className="h-6 w-6" />
              {isActive && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-neutral-100 font-sans tracking-tight">
                  {t.liveInterpreter}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/25">
                  <Sparkles className="h-3 w-3" />
                  <span>عربي ⇄ English</span>
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {t.threeSecSilenceRule}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                {t.liveInterpreterDesc}
              </p>
            </div>
          </div>

          {/* Action buttons & mode toggle */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-300 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 transition-colors"
              title={t.teleprompterMode}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{isFullscreen ? 'تصغير' : 'ملء الشاشة'}</span>
            </button>

            {/* Manual Language Selector (Spoken Language ➔ Translation Target) */}
            <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-2xl border border-neutral-800 shadow-inner flex-wrap sm:flex-nowrap">
              {/* Spoken Language */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900/90 rounded-xl border border-neutral-800/80 hover:border-amber-500/40 transition-colors">
                <Mic className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] text-neutral-400 font-medium hidden md:inline shrink-0">أحكي بـ:</span>
                <select
                  value={sourceSpeechLang}
                  onChange={(e) => handleChangeSourceLang(e.target.value)}
                  className="bg-transparent text-amber-300 font-bold text-xs focus:outline-none cursor-pointer py-0.5"
                  title="اختر اللغة التي ستتحدث بها بالميكروفون"
                >
                  {SPEECH_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-neutral-900 text-neutral-100 font-sans">
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Instant Swap Button */}
              <button
                onClick={handleSwapLanguages}
                className="p-1.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 border border-neutral-750 transition-all transform hover:scale-105 shrink-0"
                title="تبديل لغة التحدث مع لغة الترجمة (Swap)"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </button>

              {/* Target Translation Language */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900/90 rounded-xl border border-neutral-800/80 hover:border-sky-500/40 transition-colors">
                <Languages className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <span className="text-[11px] text-neutral-400 font-medium hidden md:inline shrink-0">ترجم إلى:</span>
                <select
                  value={targetTranslateLang}
                  onChange={(e) => handleChangeTargetLang(e.target.value)}
                  className="bg-transparent text-sky-300 font-bold text-xs focus:outline-none cursor-pointer py-0.5"
                  title="اختر اللغة التي تريد الترجمة إليها"
                >
                  {TARGET_LANGUAGES.map((l) => (
                    <option key={l.short} value={l.short} className="bg-neutral-900 text-neutral-100 font-sans">
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Main Toggle Button */}
            {!isActive ? (
              <button
                onClick={startLiveMode}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/20 transition-all transform active:scale-95"
              >
                <Mic className="h-4 w-4" />
                <span>{t.startLiveTranslation}</span>
              </button>
            ) : (
              <button
                onClick={stopLiveMode}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 transition-all transform active:scale-95 animate-pulse"
              >
                <MicOff className="h-4 w-4" />
                <span>{t.stopLiveTranslation}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Subtitle Teleprompter HUD Area */}
      <div className="relative rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900/90 to-neutral-950/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl overflow-hidden min-h-[340px] flex flex-col justify-between">
        {/* Subtle acoustic decorative background aura */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />

        {/* Top Status & Audio meter toolbar */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-neutral-800/80 z-10">
          <div className="flex items-center gap-3">
            {isActive ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{isSpeaking ? t.speakingActive : t.waitingForVoice}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800 text-neutral-400 text-xs font-medium">
                <MicOff className="h-3.5 w-3.5" />
                <span>جاهز للبدء - اضغط زر التشغيل أعلاه</span>
              </div>
            )}

            {/* Audio volume visualizer bar */}
            {isActive && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs">
                <Activity className="h-3.5 w-3.5 text-amber-400" />
                <div className="w-16 h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-75"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3-Second Silence Rule Countdown Badge */}
          {isCountingDown ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold animate-pulse">
              <Clock className="h-3.5 w-3.5 text-amber-400 animate-spin" />
              <span>
                {t.silenceHoldCountdown}: <span className="text-white text-sm">{silenceCountdown}s</span>
              </span>
            </div>
          ) : (
            <div className="text-[11px] text-neutral-500 font-mono hidden sm:inline-block">
              {t.threeSecSilenceRule}
            </div>
          )}
        </div>

        {/* Center Live Bilingual Subtitle Cards */}
        <div className="my-auto py-6 space-y-6 z-10">
          {fullOriginalText || translatedText ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Spoken Text (Transcription) - Words flow sequentially */}
              <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-5 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>
                      {t.originalSpeech} ({SPEECH_LANGUAGES.find((l) => l.code === sourceSpeechLang)?.name || 'العربية'})
                    </span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
                    {wordsList.length} كلمات
                  </span>
                </div>

                {/* Consecutive animated word badges */}
                <div className="flex flex-wrap items-center gap-2 text-lg sm:text-2xl font-bold leading-relaxed text-neutral-100">
                  {wordsList.map((word, idx) => (
                    <span
                      key={idx}
                      className={`inline-block px-2.5 py-1 rounded-xl transition-all duration-200 transform scale-100 ${
                        idx === wordsList.length - 1 && isSpeaking
                          ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50 scale-105 shadow-md shadow-amber-500/20'
                          : 'bg-neutral-800/60 text-neutral-100'
                      }`}
                    >
                      {word}
                    </span>
                  ))}
                  {isSpeaking && (
                    <span className="inline-block w-2.5 h-6 bg-amber-400 animate-pulse rounded-sm align-middle" />
                  )}
                </div>
              </div>

              {/* Instant Live Translation */}
              <div className="rounded-2xl bg-sky-950/20 border border-sky-500/30 p-5 shadow-lg shadow-sky-500/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5" />
                    <span>
                      {t.translatedSpeech} ({TARGET_LANGUAGES.find((l) => l.short === targetTranslateLang)?.name || 'English'})
                    </span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isTranslating && (
                      <span className="text-[11px] text-sky-400 font-mono animate-pulse">
                        جاري الترجمة...
                      </span>
                    )}
                    {translatedText && (
                      <button
                        onClick={() => speakText(translatedText, targetTranslateLang as any)}
                        className="p-1 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-500/20"
                        title={t.listenToTranslation}
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-lg sm:text-2xl font-bold leading-relaxed text-sky-200 font-sans">
                  {translatedText || (
                    <span className="text-neutral-500 italic font-normal text-base">
                      {isTranslating ? 'جاري استخراج الترجمة الفورية...' : 'ستظهر الترجمة هنا فور التحدث...'}
                    </span>
                  )}
                </p>
              </div>

              {/* 3-Second Countdown Progress Bar */}
              {isCountingDown && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-amber-300">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{t.threeSecSilenceRule}</span>
                    </span>
                    <span>{silenceCountdown} ثوانٍ متبقية</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-100 ease-linear rounded-full"
                      style={{ width: `${(silenceCountdown / 3.0) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Idle Screen / Prompt to Speak */
            <div className="text-center py-10 space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400">
                <Languages className="h-8 w-8 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-200">
                  {isActive ? t.waitingForVoice : 'شاشة الترجمة الفورية جاهزة'}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto leading-relaxed">
                  {t.speakArabicOrEnglish}
                </p>
              </div>

              {/* Sample phrase & single word buttons for instant demonstration */}
              <div className="pt-2 space-y-2">
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <span className="text-[11px] text-neutral-500 font-mono">كلمات فردية سريعة:</span>
                  {['مرحباً', 'شكراً', 'تسجيل', 'صوت', 'Hello', 'Welcome', 'Today'].map((w) => (
                    <button
                      key={w}
                      onClick={() => handleSimulateSentence(w)}
                      className="px-2.5 py-0.5 rounded-md text-xs bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 transition-colors font-medium"
                    >
                      {w}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <span className="text-[11px] text-neutral-500 font-mono">جمل كاملة:</span>
                  <button
                    onClick={() => handleSimulateSentence('مرحباً بك في استوديو صوتي للترجمة الفورية')}
                    className="px-3 py-1 rounded-lg text-xs bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 transition-colors"
                  >
                    "مرحباً بك في استوديو صوتي"
                  </button>
                  <button
                    onClick={() => handleSimulateSentence('Hello and welcome to the real-time translation studio')}
                    className="px-3 py-1 rounded-lg text-xs bg-neutral-800 hover:bg-neutral-700 text-sky-300 border border-neutral-700 transition-colors"
                  >
                    "Hello and welcome to the studio"
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Continuous Translation Active Banner */}
        {isActive && (
          <div className="my-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="font-medium">
                الترجمة المستمرة قيد العمل: تحدث بأي كلمة في أي وقت وستترجم فوراً دون الحاجة لضغط إيقاف.
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 shrink-0">
              تثبيت 3 ثوانٍ عند التوقف
            </span>
          </div>
        )}

        {/* Bottom Options Bar */}
        <div className="pt-4 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
          <label className="flex items-center gap-2 text-neutral-400 hover:text-neutral-200 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500 h-4 w-4"
            />
            <span>{t.autoSpeakTranslation}</span>
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSpokenText('');
                setInterimText('');
                setTranslatedText('');
                clearSilenceCountdown();
              }}
              className="text-neutral-400 hover:text-neutral-200 flex items-center gap-1 text-[11px]"
            >
              <RotateCcw className="h-3 w-3" />
              <span>إعادة تهيئة الشاشة</span>
            </button>
          </div>
        </div>
      </div>

      {/* History & Transcripts Log Section */}
      <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-neutral-200">{t.liveHistory}</h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
              {history.length}
            </span>
          </div>

          {history.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyHistory}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors"
              >
                {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{isCopied ? t.copied : 'نسخ الكل'}</span>
              </button>
              <button
                onClick={handleDownloadHistory}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors"
              >
                <Download className="h-3 w-3" />
                <span>تصدير TXT</span>
              </button>
              <button
                onClick={() => setHistory([])}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                <span>{t.clearLiveHistory}</span>
              </button>
            </div>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-neutral-500 italic py-4 text-center">
            ستظهر هنا كل الجمل المنطوقة وترجمتها تباعاً بعد انقضاء الـ 3 ثوانٍ من كل جملة.
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 space-y-2 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="font-mono text-neutral-500">{item.timestamp}</span>
                  <span className="inline-flex items-center gap-1 font-mono text-amber-400/90">
                    <span>{item.sourceLang.toUpperCase()}</span>
                    <span>➔</span>
                    <span>{item.targetLang.toUpperCase()}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
                  <div className="text-neutral-200">
                    <span className="text-[10px] text-neutral-500 block mb-0.5">الكلام الأصلي:</span>
                    <p className="font-medium">{item.original}</p>
                  </div>
                  <div className="text-sky-300">
                    <span className="text-[10px] text-sky-500/80 block mb-0.5">الترجمة:</span>
                    <p className="font-medium flex items-start justify-between gap-2">
                      <span>{item.translated}</span>
                      <button
                        onClick={() => speakText(item.translated, item.targetLang)}
                        className="text-sky-400 hover:text-sky-200 p-0.5"
                        title="استماع"
                      >
                        <Volume2 className="h-3.5 w-3.5 shrink-0" />
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
