import { RecordingItem } from '../types/audio';
import { audioBufferToWav } from './wavEncoder';
import { extractPeaks, getAudioContext } from './audioProcessing';

/**
 * Generates an elegant pleasant demo audio track (warm harmonics chime/voice simulation)
 * for first-time onboarding so the user can immediately experience the waveform,
 * trimming, playback, and effects.
 */
export function createDemoRecording(lang: 'ar' | 'en'): RecordingItem {
  const audioCtx = getAudioContext();
  const sampleRate = 44100;
  const duration = 6; // 6 seconds
  const frameCount = sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);

  // Generate melodic voice-like chords with gentle decay
  const notes = [261.63, 329.63, 392.0, 523.25, 440.0, 349.23]; // C4, E4, G4, C5, A4, F4
  const noteDuration = duration / notes.length;

  for (let i = 0; i < frameCount; i++) {
    const t = i / sampleRate;
    const noteIdx = Math.min(notes.length - 1, Math.floor(t / noteDuration));
    const noteFreq = notes[noteIdx];
    const noteT = t % noteDuration;

    // Envelope
    const envelope = Math.exp(-noteT * 2.5);

    // Fundamental + gentle harmonics
    const s1 = Math.sin(2 * Math.PI * noteFreq * t);
    const s2 = 0.4 * Math.sin(2 * Math.PI * noteFreq * 2 * t);
    const s3 = 0.2 * Math.sin(2 * Math.PI * noteFreq * 3 * t);

    // Add mild acoustic vibrato
    const vibrato = 1 + 0.005 * Math.sin(2 * Math.PI * 5 * t);

    data[i] = (s1 + s2 + s3) * envelope * 0.3 * vibrato;
  }

  const wavBlob = audioBufferToWav(buffer);
  const peaks = extractPeaks(buffer, 120);

  return {
    id: 'demo_welcome_recording',
    title: lang === 'ar' ? 'تسجيل ترحيبي تجريبي - صوتي' : 'Welcome Demo Recording - Sawti',
    blob: wavBlob,
    duration: duration,
    createdAt: Date.now() - 3600000,
    format: 'audio/wav',
    size: wavBlob.size,
    tags: [lang === 'ar' ? 'ترحيب' : 'Welcome', lang === 'ar' ? 'تجربة' : 'Demo'],
    notes:
      lang === 'ar'
        ? 'مرحباً بك في استوديو صوتي! هذا ملف تجريبي يمكنك من تجربة الموجات الصوتية التفاعلية، القص، وتأثيرات الصوت.'
        : 'Welcome to Sawti Audio Studio! This is a demo track to test waveform scrubbing, trimming, and audio effects.',
    transcription:
      lang === 'ar'
        ? 'أهلاً بك في استوديو صوتي لتسجيل وتحرير الصوت بدقة استوديو احترافية.'
        : 'Welcome to Sawti Studio for high fidelity voice recording and editing.',
    translatedText:
      lang === 'ar'
        ? 'Welcome to Sawti Studio for high-fidelity audio recording and professional editing.'
        : 'أهلاً بك في استوديو صوتي لتسجيل الصوت وتحريره بدقة استوديو احترافية عالية.',
    detectedLanguage: lang === 'ar' ? 'ar' : 'en',
    detectedLanguageLabel: lang === 'ar' ? 'العربية' : 'English',
    targetLanguage: lang === 'ar' ? 'en' : 'ar',
    targetLanguageLabel: lang === 'ar' ? 'English' : 'العربية',
    summary:
      lang === 'ar'
        ? 'تسجيل تجريبي ترحيبي يستعرض خصائص التفريغ الصوتي والترجمة التلقائية بين العربية والإنجليزية.'
        : 'Welcome demo audio showcasing AI transcription and bidirectional Arabic ⇄ English translation.',
    segments: [
      {
        originalText:
          lang === 'ar'
            ? 'أهلاً بك في استوديو صوتي لتسجيل وتحرير الصوت بدقة استوديو احترافية.'
            : 'Welcome to Sawti Studio for high fidelity voice recording and editing.',
        translatedText:
          lang === 'ar'
            ? 'Welcome to Sawti Studio for high-fidelity audio recording and professional editing.'
            : 'أهلاً بك في استوديو صوتي لتسجيل الصوت وتحريره بدقة استوديو احترافية عالية.',
      },
    ],
    bookmarks: [
      { id: 'bm_1', time: 1.0, label: lang === 'ar' ? 'مقدمة النغمة' : 'Intro Melody', createdAt: Date.now() },
      { id: 'bm_2', time: 3.5, label: lang === 'ar' ? 'الانتقال الموسيقي' : 'Transition', createdAt: Date.now() },
    ],
    peaks,
    favorite: true,
    sampleRate: 44100,
    channels: 1,
  };
}
