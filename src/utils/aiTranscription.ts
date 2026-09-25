import { TranscriptionSegment } from '../types/audio';

export interface AITranscriptionResult {
  detectedLanguage: 'ar' | 'en' | string;
  detectedLanguageLabel?: string;
  targetLanguage: 'ar' | 'en' | string;
  targetLanguageLabel?: string;
  originalTranscription: string;
  translatedText: string;
  summary?: string;
  segments?: TranscriptionSegment[];
}

/**
 * Convert an Audio Blob to Base64 string safely
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Call the server-side Gemini API endpoint to transcribe and translate audio
 */
export async function transcribeAndTranslateAudio(
  audioBlob: Blob,
  fallbackText?: string
): Promise<AITranscriptionResult> {
  try {
    const audioBase64 = await blobToBase64(audioBlob);
    const mimeType = audioBlob.type || 'audio/webm';

    const response = await fetch('/api/transcribe-and-translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioBase64,
        mimeType,
        textInput: fallbackText || undefined,
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Server responded with status ${response.status}`);
    }

    const data: AITranscriptionResult = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error in transcribeAndTranslateAudio:', error);
    // If audio blob payload was too large or failed, attempt fallback to text if provided
    if (fallbackText && fallbackText.trim()) {
      return translateText(fallbackText);
    }
    throw error;
  }
}

/**
 * Translate arbitrary text via the server-side Gemini endpoint
 */
export async function translateText(textInput: string): Promise<AITranscriptionResult> {
  const response = await fetch('/api/transcribe-and-translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      textInput,
    }),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error || `Server responded with status ${response.status}`);
  }

  const data: AITranscriptionResult = await response.json();
  return data;
}

export interface LiveTranslationResponse {
  original: string;
  translated: string;
  detectedLang?: 'ar' | 'en' | string;
  targetLang?: 'ar' | 'en' | string;
  cached?: boolean;
}

// Instant client-side lookup for single words & common conversational words (0ms response)
const INSTANT_WORD_MAP: Record<string, { trans: string; src: 'ar' | 'en'; tgt: 'ar' | 'en' }> = {
  // Arabic -> English
  'مرحبا': { trans: 'Hello', src: 'ar', tgt: 'en' },
  'مرحباً': { trans: 'Hello', src: 'ar', tgt: 'en' },
  'أهلا': { trans: 'Welcome', src: 'ar', tgt: 'en' },
  'اهلا': { trans: 'Welcome', src: 'ar', tgt: 'en' },
  'أهلاً': { trans: 'Welcome', src: 'ar', tgt: 'en' },
  'مرحبا بك': { trans: 'Welcome', src: 'ar', tgt: 'en' },
  'صباح الخير': { trans: 'Good morning', src: 'ar', tgt: 'en' },
  'مساء الخير': { trans: 'Good evening', src: 'ar', tgt: 'en' },
  'شكرا': { trans: 'Thank you', src: 'ar', tgt: 'en' },
  'شكراً': { trans: 'Thank you', src: 'ar', tgt: 'en' },
  'شكرا لك': { trans: 'Thank you', src: 'ar', tgt: 'en' },
  'نعم': { trans: 'Yes', src: 'ar', tgt: 'en' },
  'أجل': { trans: 'Yes', src: 'ar', tgt: 'en' },
  'لا': { trans: 'No', src: 'ar', tgt: 'en' },
  'كلا': { trans: 'No', src: 'ar', tgt: 'en' },
  'كيف حالك': { trans: 'How are you', src: 'ar', tgt: 'en' },
  'كيفك': { trans: 'How are you', src: 'ar', tgt: 'en' },
  'أنا بخير': { trans: 'I am fine', src: 'ar', tgt: 'en' },
  'الحمد لله': { trans: 'Praise be to God / Doing well', src: 'ar', tgt: 'en' },
  'مع السلامة': { trans: 'Goodbye', src: 'ar', tgt: 'en' },
  'وداعا': { trans: 'Goodbye', src: 'ar', tgt: 'en' },
  'صوت': { trans: 'Audio / Voice', src: 'ar', tgt: 'en' },
  'صوتي': { trans: 'My voice / Sawti', src: 'ar', tgt: 'en' },
  'تسجيل': { trans: 'Recording', src: 'ar', tgt: 'en' },
  'تسجيل صوتي': { trans: 'Voice recording', src: 'ar', tgt: 'en' },
  'ترجمة': { trans: 'Translation', src: 'ar', tgt: 'en' },
  'ترجمة فورية': { trans: 'Live translation', src: 'ar', tgt: 'en' },
  'فوري': { trans: 'Instant', src: 'ar', tgt: 'en' },
  'اليوم': { trans: 'Today', src: 'ar', tgt: 'en' },
  'الآن': { trans: 'Now', src: 'ar', tgt: 'en' },
  'غدا': { trans: 'Tomorrow', src: 'ar', tgt: 'en' },
  'غداً': { trans: 'Tomorrow', src: 'ar', tgt: 'en' },
  'ممتاز': { trans: 'Excellent', src: 'ar', tgt: 'en' },
  'رائع': { trans: 'Great / Wonderful', src: 'ar', tgt: 'en' },
  'جميل': { trans: 'Nice / Beautiful', src: 'ar', tgt: 'en' },
  'تطبيق': { trans: 'App / Application', src: 'ar', tgt: 'en' },
  'استوديو': { trans: 'Studio', src: 'ar', tgt: 'en' },
  'كلمة': { trans: 'Word', src: 'ar', tgt: 'en' },
  'كلمات': { trans: 'Words', src: 'ar', tgt: 'en' },
  'كلام': { trans: 'Speech', src: 'ar', tgt: 'en' },
  'حديث': { trans: 'Talk / Speech', src: 'ar', tgt: 'en' },
  'تحدث': { trans: 'Speak', src: 'ar', tgt: 'en' },
  'نحن': { trans: 'We', src: 'ar', tgt: 'en' },
  'أنا': { trans: 'I / Me', src: 'ar', tgt: 'en' },
  'أنت': { trans: 'You', src: 'ar', tgt: 'en' },
  'هذا': { trans: 'This', src: 'ar', tgt: 'en' },
  'هذه': { trans: 'This', src: 'ar', tgt: 'en' },
  'سلام': { trans: 'Peace / Hello', src: 'ar', tgt: 'en' },
  'تجربة': { trans: 'Testing / Trial', src: 'ar', tgt: 'en' },
  // English -> Arabic
  'hello': { trans: 'مرحباً', src: 'en', tgt: 'ar' },
  'hi': { trans: 'أهلاً', src: 'en', tgt: 'ar' },
  'welcome': { trans: 'أهلاً وسهلاً', src: 'en', tgt: 'ar' },
  'yes': { trans: 'نعم', src: 'en', tgt: 'ar' },
  'yeah': { trans: 'نعم / أجل', src: 'en', tgt: 'ar' },
  'no': { trans: 'لا', src: 'en', tgt: 'ar' },
  'thanks': { trans: 'شكراً', src: 'en', tgt: 'ar' },
  'thank you': { trans: 'شكراً لك', src: 'en', tgt: 'ar' },
  'good morning': { trans: 'صباح الخير', src: 'en', tgt: 'ar' },
  'good evening': { trans: 'مساء الخير', src: 'en', tgt: 'ar' },
  'goodbye': { trans: 'مع السلامة', src: 'en', tgt: 'ar' },
  'bye': { trans: 'إلى اللقاء', src: 'en', tgt: 'ar' },
  'how are you': { trans: 'كيف حالك', src: 'en', tgt: 'ar' },
  'i am fine': { trans: 'أنا بخير', src: 'en', tgt: 'ar' },
  'audio': { trans: 'صوت', src: 'en', tgt: 'ar' },
  'voice': { trans: 'صوت', src: 'en', tgt: 'ar' },
  'sound': { trans: 'صوت', src: 'en', tgt: 'ar' },
  'record': { trans: 'سجل / تسجيل', src: 'en', tgt: 'ar' },
  'recording': { trans: 'تسجيل', src: 'en', tgt: 'ar' },
  'translation': { trans: 'ترجمة', src: 'en', tgt: 'ar' },
  'live': { trans: 'مباشر / فوري', src: 'en', tgt: 'ar' },
  'today': { trans: 'اليوم', src: 'en', tgt: 'ar' },
  'now': { trans: 'الآن', src: 'en', tgt: 'ar' },
  'tomorrow': { trans: 'غداً', src: 'en', tgt: 'ar' },
  'test': { trans: 'تجربة / اختبار', src: 'en', tgt: 'ar' },
  'word': { trans: 'كلمة', src: 'en', tgt: 'ar' },
  'words': { trans: 'كلمات', src: 'en', tgt: 'ar' },
  'speak': { trans: 'تحدث', src: 'en', tgt: 'ar' },
  'great': { trans: 'رائع', src: 'en', tgt: 'ar' },
  'good': { trans: 'جيد', src: 'en', tgt: 'ar' },
  'app': { trans: 'تطبيق', src: 'en', tgt: 'ar' },
};

const clientTranslationCache = new Map<string, LiveTranslationResponse>();

/**
 * Rapid live phrase translator for streaming subtitles
 */
export async function liveTranslatePhrase(
  phrase: string,
  direction: 'auto' | 'ar-en' | 'en-ar' | string = 'auto',
  sourceLang?: string,
  targetLang?: string
): Promise<LiveTranslationResponse> {
  const clean = (phrase || '').trim();
  if (!clean) {
    return { original: '', translated: '', detectedLang: sourceLang || 'ar', targetLang: targetLang || 'en' };
  }

  const normalizedKey = clean.toLowerCase();

  // 1. Check instant word dictionary (0ms latency for single words & common phrases)
  if (INSTANT_WORD_MAP[normalizedKey]) {
    const item = INSTANT_WORD_MAP[normalizedKey];
    // Only return if matches target or direction
    if (!targetLang || targetLang.startsWith(item.tgt)) {
      return {
        original: clean,
        translated: item.trans,
        detectedLang: item.src,
        targetLang: item.tgt,
        cached: true,
      };
    }
  }

  // 2. Check client memory cache
  const cacheKey = `${normalizedKey}_${sourceLang || direction}_${targetLang || 'auto'}`;
  if (clientTranslationCache.has(cacheKey)) {
    return clientTranslationCache.get(cacheKey)!;
  }

  // 3. Request low-latency AI translation from backend
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch('/api/live-translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phrase: clean, direction, sourceLang, targetLang }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const result: LiveTranslationResponse = await response.json();
      if (result && result.translated) {
        clientTranslationCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (backendErr) {
    console.warn('Backend live-translate delayed or unavailable, attempting fallback:', backendErr);
  }

  // 4. Bulletproof Fallback Translation (MyMemory Translation API) to guarantee subtitles appear
  try {
    const src = sourceLang ? (sourceLang.startsWith('ar') ? 'ar' : sourceLang.startsWith('en') ? 'en' : 'ar') : (direction === 'en-ar' ? 'en' : 'ar');
    const tgt = targetLang ? (targetLang.startsWith('ar') ? 'ar' : targetLang.startsWith('en') ? 'en' : 'en') : (src === 'ar' ? 'en' : 'ar');
    
    const fallbackRes = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${src}|${tgt}`
    );
    if (fallbackRes.ok) {
      const fbData = await fallbackRes.json();
      const fbTranslated = fbData?.responseData?.translatedText;
      if (fbTranslated && typeof fbTranslated === 'string' && fbTranslated.trim()) {
        const fallbackResult: LiveTranslationResponse = {
          original: clean,
          translated: fbTranslated.trim(),
          detectedLang: src,
          targetLang: tgt,
          cached: false,
        };
        clientTranslationCache.set(cacheKey, fallbackResult);
        return fallbackResult;
      }
    }
  } catch (fbErr) {
    console.warn('Fallback translator error:', fbErr);
  }

  // If all else fails, return the phrase itself so something is displayed
  return {
    original: clean,
    translated: clean,
    detectedLang: sourceLang || 'ar',
    targetLang: targetLang || 'en',
  };
}

/**
 * Read text aloud using browser Web Speech Synthesis
 */
export function speakText(text: string, lang: string = 'ar'): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;

  const bcp47Map: Record<string, string> = {
    ar: 'ar-SA',
    en: 'en-US',
    fr: 'fr-FR',
    es: 'es-ES',
    de: 'de-DE',
    tr: 'tr-TR',
  };
  utterance.lang = bcp47Map[lang] || (lang.includes('-') ? lang : `${lang}-${lang.toUpperCase()}`);

  // Try finding best matching voice
  const voices = window.speechSynthesis.getVoices();
  const targetPrefix = lang.split('-')[0].toLowerCase();
  const voice = voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix));
  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Stop any active text-to-speech
 */
export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Generate .srt subtitle string from segments and total duration
 */
export function generateSrtContent(
  segments: TranscriptionSegment[],
  totalDuration: number,
  mode: 'bilingual' | 'translated' | 'original' = 'bilingual'
): string {
  if (!segments || segments.length === 0) return '';

  const segmentDuration = totalDuration / segments.length;

  const formatSrtTime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = Math.floor(sec % 60);
    const millis = Math.floor((sec % 1) * 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
  };

  return segments
    .map((seg, idx) => {
      const start = idx * segmentDuration;
      const end = Math.min(totalDuration, (idx + 1) * segmentDuration);
      let content = '';
      if (mode === 'bilingual') {
        content = `${seg.originalText}\n${seg.translatedText}`;
      } else if (mode === 'translated') {
        content = seg.translatedText;
      } else {
        content = seg.originalText;
      }

      return `${idx + 1}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${content}\n`;
    })
    .join('\n');
}
