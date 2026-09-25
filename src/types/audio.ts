export interface AudioBookmark {
  id: string;
  time: number; // in seconds
  label: string;
  createdAt: number;
}

export interface TranscriptionSegment {
  originalText: string;
  translatedText: string;
}

export interface RecordingItem {
  id: string;
  title: string;
  blob: Blob;
  duration: number; // in seconds
  createdAt: number;
  format: string; // e.g. 'audio/webm', 'audio/wav', 'audio/mp4'
  size: number; // bytes
  tags: string[];
  notes: string;
  transcription?: string; // Original spoken transcript
  translatedText?: string; // AI translation into counterpart language (Arabic <-> English)
  detectedLanguage?: 'ar' | 'en' | string;
  detectedLanguageLabel?: string;
  targetLanguage?: 'ar' | 'en' | string;
  targetLanguageLabel?: string;
  summary?: string;
  segments?: TranscriptionSegment[];
  bookmarks: AudioBookmark[];
  peaks: number[]; // Normalized waveform peak data (0 to 1)
  favorite: boolean;
  sampleRate?: number;
  channels?: number;
}

export interface RecordingSettings {
  deviceId: string;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  format: 'webm' | 'wav';
  audioBitsPerSecond: number;
  monitoring: boolean;
}

export type VisualizerMode = 'bars' | 'wave' | 'frequency';

export type AudioEffectType = 'normal' | 'vocal_enhance' | 'bass_boost' | 'clean_voice' | 'studio_reverb';

export type Language = 'ar' | 'en';

export interface VoiceprintProfile {
  enrolledAt: number;
  sampleDuration: number;
  averagePitch: number;
  energyProfile: number[];
  voiceSummary: string;
}

export interface OverlayTranslatorConfig {
  textColor: '#ffffff' | '#000000' | '#9ca3af' | string; // اسود، ابيض، رمادي
  fontSize: number; // 1 to 30
  fontOpacity: number; // 0 to 100%
  hasBackground: boolean; // true = خلفية سوداء, false = بلا خلفية (فلوتينج)
  bgOpacity: number;
  displayDuration: number; // مدة ظهور الكلام بالثواني
  position: 'custom' | 'bottom' | 'top' | 'center';
  customCoords: { x: number; y: number }; // احداثيات في الشاشة
  translationMode: 'words' | 'sentences'; // نوع الترجمة: كلمات أو جمل
  voiceModeWhisper: boolean; // تشك بوكس همس
  voiceModeNormal: boolean; // تشك بوكس عادي
  voiceMode?: 'all' | 'whisper' | 'normal';
  speakerFilter?: 'all' | 'myVoiceOnly';
  voiceprint?: VoiceprintProfile;
  sourceLang: 'ar-SA' | 'en-US' | string; // لغة التحدث: عربي أو انجليزي
  targetLang: 'en' | 'ar' | string;
  clickThrough?: boolean;
  textOutline?: boolean;
}

export interface OverlayHistoryItem {
  id: string;
  timestamp: string;
  original: string;
  translated: string;
  sourceLang: string;
  targetLang: string;
  voiceType?: 'whisper' | 'normal';
}
