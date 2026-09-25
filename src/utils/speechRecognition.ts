import {
  registerActiveRecognition,
  unregisterActiveRecognition,
} from './audioHardware';

// Interface declaration for browser Web Speech API
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as IWindow;
  return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export interface SpeechRecognizerOptions {
  lang?: string;
  onText: (finalText: string, interimText: string, latestSegment?: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onSilence?: () => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  silenceThresholdMs?: number;
}

export class LiveSpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private isDestroyed = false;
  private options: SpeechRecognizerOptions;
  private accumulatedText = '';
  private silenceTimer: any = null;
  private restartTimer: any = null;

  constructor(optionsOrCb: SpeechRecognizerOptions | ((finalText: string, interimText: string) => void), lang = 'ar-SA') {
    if (typeof optionsOrCb === 'function') {
      this.options = {
        onText: optionsOrCb,
        lang: lang,
        silenceThresholdMs: 700,
      };
    } else {
      this.options = {
        silenceThresholdMs: 700,
        lang: 'ar-SA',
        ...optionsOrCb,
      };
    }
    this.initRecognition();
  }

  private triggerSilence() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.options.onSilence) {
      this.options.onSilence();
    }
  }

  private resetSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }
    const timeout = this.options.silenceThresholdMs || 700;
    this.silenceTimer = setTimeout(() => {
      this.triggerSilence();
    }, timeout);
  }

  private initRecognition() {
    if (!isSpeechRecognitionSupported()) return;

    const win = window as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    this.recognition = new SpeechRec();

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.options.lang || 'ar-SA';

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.options.onStart) {
        this.options.onStart();
      }
    };

    this.recognition.onspeechstart = () => {
      if (this.options.onSpeechStart) {
        this.options.onSpeechStart();
      }
    };

    this.recognition.onspeechend = () => {
      if (this.options.onSpeechEnd) {
        this.options.onSpeechEnd();
      }
      // Do not trigger silence prematurely on micro-pauses between words;
      // keep the silenceTimer running for the configured silenceThresholdMs (e.g. 1.5s)
      this.resetSilenceTimer();
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let latestSegment = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const phrase = transcript.trim();
          if (phrase) {
            this.accumulatedText += (this.accumulatedText ? ' ' : '') + phrase;
            latestSegment = phrase;
          }
        } else {
          interim += transcript;
          latestSegment = interim.trim();
        }
      }

      this.resetSilenceTimer();
      this.options.onText(this.accumulatedText, interim, latestSegment);
    };

    this.recognition.onerror = (event: any) => {
      if (this.options.onError) {
        this.options.onError(event.error || 'speech-recognition-error');
      }
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('Speech recognition warning:', event.error);
      }
    };

    this.recognition.onend = () => {
      // Keep listening continuously unless explicitly stopped or destroyed
      if (this.isDestroyed || !this.isListening) return;

      if (this.restartTimer) {
        clearTimeout(this.restartTimer);
      }
      this.restartTimer = setTimeout(() => {
        if (!this.isDestroyed && this.isListening && this.recognition) {
          try {
            this.recognition.start();
          } catch {
            // Ignore restart error
          }
        }
      }, 120);
    };

    registerActiveRecognition(this.recognition);
  }

  public restartFreshSession() {
    this.accumulatedText = '';
    if (!this.recognition || this.isDestroyed) return;
    try {
      this.recognition.abort();
    } catch {
      // Ignore
    }
    if (this.restartTimer) clearTimeout(this.restartTimer);
    this.restartTimer = setTimeout(() => {
      if (this.isListening && !this.isDestroyed && this.recognition) {
        try {
          this.recognition.start();
        } catch {
          // Ignore
        }
      }
    }, 80);
  }

  public resetAccumulatedText() {
    this.accumulatedText = '';
  }

  public setLanguage(lang: string) {
    this.options.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
      if (this.isListening) {
        this.restartFreshSession();
      }
    }
  }

  public start() {
    if (!this.recognition || this.isDestroyed) return;
    this.isListening = true;
    this.accumulatedText = '';
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    try {
      this.recognition.start();
    } catch {
      // May already be started
    }
  }

  public stop(): string {
    this.isListening = false;
    this.isDestroyed = true;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.recognition) {
      const rec = this.recognition;
      this.recognition = null;
      unregisterActiveRecognition(rec);
      rec.onstart = null;
      rec.onspeechstart = null;
      rec.onspeechend = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.stop();
      } catch {
        // Ignore
      }
      try {
        rec.abort();
      } catch {
        // Ignore
      }
    }
    return this.accumulatedText;
  }

  public abort() {
    this.isListening = false;
    this.isDestroyed = true;
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.recognition) {
      const rec = this.recognition;
      this.recognition = null;
      unregisterActiveRecognition(rec);
      rec.onstart = null;
      rec.onspeechstart = null;
      rec.onspeechend = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        // Ignore
      }
    }
  }
}
