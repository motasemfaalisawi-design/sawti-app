import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, MicOff, Mic } from 'lucide-react';
import { OverlayTranslatorConfig, OverlayHistoryItem } from '../types/audio';
import { LiveSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/speechRecognition';
import { liveTranslatePhrase } from '../utils/aiTranscription';
import {
  analyzeAcousticFrame,
  classifyVoiceFrame,
  verifyVoiceMatch,
} from '../utils/voiceprint';
import {
  registerActiveStream,
  registerActiveAudioContext,
  stopAllAudioHardware,
} from '../utils/audioHardware';

interface TransparentOverlayScreenProps {
  config: OverlayTranslatorConfig;
  onOpenSettings: () => void;
  onCloseOverlay: () => void;
  onAddHistoryItem?: (item: OverlayHistoryItem) => void;
}

export const TransparentOverlayScreen: React.FC<TransparentOverlayScreenProps> = ({
  config,
  onOpenSettings,
  onCloseOverlay,
  onAddHistoryItem,
}) => {
  // Only the translated text is displayed
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Stable references
  const configRef = useRef(config);
  configRef.current = config;

  const isPausedRef = useRef(false);
  isPausedRef.current = isPaused;

  const recognizerRef = useRef<LiveSpeechRecognizer | null>(null);
  const fadeTimeoutRef = useRef<any>(null);
  const noticeTimeoutRef = useRef<any>(null);
  const lastSpokenRef = useRef<string>('');
  const lastVoiceTypeRef = useRef<'whisper' | 'normal'>('normal');
  const pendingBufferRef = useRef<string>('');

  const isCancelledRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // 1. Cancel fade-out timer
  const cancelFadeTimer = useCallback(() => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    setIsFadingOut(false);
  }, []);

  // 2. Start auto-fade countdown after speech stops
  const scheduleAutoHide = useCallback(() => {
    cancelFadeTimer();
    const fallbackDefault = configRef.current.translationMode === 'words' ? 1 : 3;
    const durationSec = Number(configRef.current.displayDuration) || fallbackDefault;
    // Allow durations as low as 300ms (0.3s) for fast word flipping
    const waitMs = Math.max(300, Math.round(durationSec * 1000));

    fadeTimeoutRef.current = setTimeout(() => {
      setIsFadingOut(true);
      const fadeDuration = waitMs < 1000 ? 180 : 300;
      setTimeout(() => {
        setTranslatedText('');
        setIsFadingOut(false);
      }, fadeDuration);
    }, waitMs);
  }, [cancelFadeTimer]);

  // 3. Translate speech phrase
  const processPhrase = useCallback(
    async (phrase: string) => {
      if (isCancelledRef.current) return;
      const clean = phrase.trim();
      if (!clean) return;

      // Check voice mode filtering
      const allowWhisper = configRef.current.voiceModeWhisper;
      const allowNormal = configRef.current.voiceModeNormal;

      if (!allowWhisper && !allowNormal) return;

      const currentVoiceType = lastVoiceTypeRef.current;
      if (allowWhisper && !allowNormal && currentVoiceType !== 'whisper') {
        // Whisper only: ignore normal speech
        return;
      }
      if (allowNormal && !allowWhisper && currentVoiceType !== 'normal') {
        // Normal only: ignore whisper
        return;
      }

      cancelFadeTimer();

      const srcShort = configRef.current.sourceLang.startsWith('ar') ? 'ar' : 'en';
      const tgtShort = srcShort === 'ar' ? 'en' : 'ar';

      try {
        const res = await liveTranslatePhrase(clean, undefined, srcShort, tgtShort);
        if (res && res.translated) {
          setTranslatedText(res.translated);
          if (onAddHistoryItem) {
            onAddHistoryItem({
              id: `tr_${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              original: clean,
              translated: res.translated,
              sourceLang: srcShort,
              targetLang: tgtShort,
              voiceType: currentVoiceType,
            });
          }
        } else {
          setTranslatedText(clean);
        }
      } catch (err) {
        setTranslatedText(clean);
      }
    },
    [cancelFadeTimer, onAddHistoryItem]
  );

  // 4. Acoustic level and voice monitoring loop
  const initAcoustics = useCallback(async () => {
    try {
      if (micStreamRef.current || isCancelledRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });

      // If user stopped or closed before permission was granted, stop tracks immediately!
      if (isCancelledRef.current) {
        stream.getTracks().forEach((t) => {
          try {
            t.stop();
            t.enabled = false;
          } catch {}
        });
        return;
      }

      micStreamRef.current = stream;
      registerActiveStream(stream);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      registerActiveAudioContext(ctx);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      const checkLoop = () => {
        if (!analyserRef.current || isCancelledRef.current) return;
        const metrics = analyzeAcousticFrame(analyserRef.current);
        const vType = classifyVoiceFrame(metrics.rmsEnergy, metrics.spectralFlatness);
        if (vType === 'whisper' || vType === 'normal') {
          lastVoiceTypeRef.current = vType;
        }

        // Voiceprint verification if enrolled
        if (configRef.current.voiceprint && (vType === 'whisper' || vType === 'normal')) {
          const isMatch = verifyVoiceMatch(metrics, configRef.current.voiceprint);
          if (!isMatch) {
            // Frame does not match user's voice
          }
        }

        animFrameRef.current = requestAnimationFrame(checkLoop);
      };

      checkLoop();
    } catch (e) {
      console.warn('Acoustics notice:', e);
    }
  }, []);

  // 5. Start Speech Recognition
  const startSpeechRecognition = useCallback(() => {
    isCancelledRef.current = false;
    if (!isSpeechRecognitionSupported()) return;

    if (recognizerRef.current) {
      try {
        recognizerRef.current.abort();
      } catch {
        // Ignore
      }
    }

    initAcoustics();

    const isWordMode = configRef.current.translationMode === 'words';
    // Words mode: 0.5 second (500ms) silence wait | Sentences mode: 1.5 seconds (1500ms) silence wait
    const silenceDelay = isWordMode ? 500 : 1500;

    const recognizer = new LiveSpeechRecognizer({
      lang: configRef.current.sourceLang,
      silenceThresholdMs: silenceDelay,
      onSpeechStart: () => {
        cancelFadeTimer();
      },
      onSilence: () => {
        if (isCancelledRef.current) return;
        const phrase = pendingBufferRef.current.trim();
        if (phrase && phrase !== lastSpokenRef.current) {
          lastSpokenRef.current = phrase;
          processPhrase(phrase);
        }
        // Reset buffer and recognizer memory so words/sentences are never linked together
        pendingBufferRef.current = '';
        if (recognizerRef.current) {
          recognizerRef.current.resetAccumulatedText();
        }
        scheduleAutoHide();
      },
      onText: (final, interim, segment) => {
        if (isCancelledRef.current) return;
        cancelFadeTimer();

        if (isWordMode) {
          // Words mode: captures isolated word or term (1-2 words)
          const unit = interim.trim() || segment?.trim() || final.trim();
          if (unit) {
            pendingBufferRef.current = unit;
          }
        } else {
          // Sentences mode: gathers the full sentence during speech without translating mid-sentence
          const fullSentence = (final ? final.trim() + ' ' : '') + (interim ? interim.trim() : '');
          pendingBufferRef.current = fullSentence.trim() || segment?.trim() || '';
        }
      },
    });

    try {
      recognizer.start();
      recognizerRef.current = recognizer;
    } catch (err) {
      console.warn('Speech recognition start:', err);
    }
  }, [cancelFadeTimer, scheduleAutoHide, processPhrase, initAcoustics]);

  // Stop Speech Recognition & Mic completely
  const stopSpeechRecognition = useCallback(() => {
    isCancelledRef.current = true;
    pendingBufferRef.current = '';

    if (recognizerRef.current) {
      try {
        recognizerRef.current.abort();
      } catch {
        // Ignore
      }
      recognizerRef.current = null;
    }

    if (micStreamRef.current) {
      try {
        micStreamRef.current.getTracks().forEach((t) => {
          t.stop();
          t.enabled = false;
        });
      } catch {
        // Ignore
      }
      micStreamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
      } catch {}
      audioContextRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Hard-stop all audio hardware, MediaStreams, and SpeechRecognition instances
    stopAllAudioHardware();
  }, []);

  // Stop microphone & translation and return immediately to settings page
  const handleStopAndReturn = useCallback(() => {
    stopSpeechRecognition();
    onCloseOverlay();
  }, [stopSpeechRecognition, onCloseOverlay]);

  // Keyboard shortcut (Escape to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleStopAndReturn();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStopAndReturn]);

  // Mount lifecycle
  useEffect(() => {
    startSpeechRecognition();

    return () => {
      stopSpeechRecognition();
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [startSpeechRecognition, stopSpeechRecognition]);

  // Map font size: scale 1 to 30 to clean readable pixels (e.g., 14px to 52px)
  const computedFontSize = Math.round(14 + (config.fontSize || 20) * 1.25);

  // Custom coordinates from user settings
  const posX = config.customCoords?.x ?? Math.round(window.innerWidth / 2);
  const posY = config.customCoords?.y ?? (window.innerHeight - 100);

  return (
    <div
      onDoubleClick={handleStopAndReturn}
      className="fixed inset-0 z-50 select-none overflow-hidden"
      style={{
        backgroundColor: config.hasBackground ? '#000000' : 'transparent',
        // In transparent mode, clicks pass directly through except on the text
        pointerEvents: config.hasBackground ? 'auto' : 'none',
      }}
      title="انقر نقراً مزدوجاً لإيقاف المايكروفون والترجمة والعودة لصفحة الإعدادات"
    >
      {/* Subtle invisible exit trigger in top corner, visible on hover only */}
      <button
        type="button"
        onClick={handleStopAndReturn}
        className="absolute top-3 left-3 z-50 p-2 rounded-full bg-black/40 hover:bg-black/80 text-white/40 hover:text-white transition-opacity opacity-0 hover:opacity-100 cursor-pointer pointer-events-auto"
        title="الرجوع إلى الإعدادات (أو اضغط Esc)"
      >
        <X className="h-4 w-4" />
      </button>

      {/* The ONLY displayed element: The Floating Translated Text at Exact Coordinates */}
      {translatedText ? (
        <div
          onDoubleClick={(e) => {
            e.stopPropagation();
            handleStopAndReturn();
          }}
          className={`pointer-events-auto transition-all duration-300 transform ${
            isFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{
            position: 'absolute',
            left: `${posX}px`,
            top: `${posY}px`,
            transform: 'translate(-50%, -50%)',
            opacity: isFadingOut ? 0 : (config.fontOpacity ?? 100) / 100,
            cursor: 'pointer',
          }}
          title="انقر نقراً مزدوجاً لإيقاف المايكروفون والترجمة والعودة للإعدادات"
        >
          <div
            className="font-extrabold tracking-normal text-center leading-snug px-4 py-1"
            style={{
              color: config.textColor || '#ffffff',
              fontSize: `${computedFontSize}px`,
              textShadow:
                config.textColor?.toLowerCase() === '#ffffff'
                  ? '0 2px 10px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.9), 1.5px 1.5px 0 #000, -1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000'
                  : config.textColor?.toLowerCase() === '#9ca3af'
                  ? '0 2px 8px rgba(0,0,0,0.9), 1px 1px 0 #000, -1px -1px 0 #000'
                  : '0 1px 6px rgba(255,255,255,0.7)',
            }}
          >
            {translatedText}
          </div>
        </div>
      ) : null}
    </div>
  );
};
