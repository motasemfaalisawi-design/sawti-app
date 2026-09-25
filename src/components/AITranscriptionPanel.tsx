import React, { useState } from 'react';
import {
  Sparkles,
  Languages,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Download,
  ArrowLeftRight,
  FileText,
  RefreshCw,
  Edit3,
  CheckCheck,
} from 'lucide-react';
import { RecordingItem, Language } from '../types/audio';
import { translations } from '../utils/i18n';
import {
  transcribeAndTranslateAudio,
  speakText,
  stopSpeaking,
  generateSrtContent,
} from '../utils/aiTranscription';

interface AITranscriptionPanelProps {
  recording: RecordingItem;
  onUpdateRecording: (updated: RecordingItem) => void;
  lang: Language;
}

export const AITranscriptionPanel: React.FC<AITranscriptionPanelProps> = ({
  recording,
  onUpdateRecording,
  lang,
}) => {
  const t = translations[lang];

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bilingual' | 'original' | 'translated' | 'summary'>('bilingual');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<'original' | 'translated' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableOriginal, setEditableOriginal] = useState(recording.transcription || '');
  const [editableTranslated, setEditableTranslated] = useState(recording.translatedText || '');

  const hasContent = Boolean(recording.transcription || recording.translatedText);

  // Trigger AI Transcription & Bidirectional Translation
  const handleTranscribeAndTranslate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await transcribeAndTranslateAudio(recording.blob, recording.transcription);

      const updated: RecordingItem = {
        ...recording,
        transcription: result.originalTranscription || recording.transcription || '',
        translatedText: result.translatedText || '',
        detectedLanguage: result.detectedLanguage,
        detectedLanguageLabel: result.detectedLanguageLabel,
        targetLanguage: result.targetLanguage,
        targetLanguageLabel: result.targetLanguageLabel,
        summary: result.summary,
        segments: result.segments || [],
      };

      setEditableOriginal(result.originalTranscription || '');
      setEditableTranslated(result.translatedText || '');
      onUpdateRecording(updated);
    } catch (err: any) {
      console.error('Transcription error:', err);
      setErrorMessage(err.message || (lang === 'ar' ? 'حدث خطأ أثناء التفريغ والترجمة' : 'Error processing transcription and translation'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyBoth = () => {
    const combined = `[${t.originalSpeech} - ${recording.detectedLanguageLabel || recording.detectedLanguage || 'Original'}]\n${recording.transcription}\n\n[${t.translatedSpeech} - ${recording.targetLanguageLabel || recording.targetLanguage || 'Translation'}]\n${recording.translatedText}`;
    handleCopy(combined, 'both');
  };

  const handleSpeak = (text: string, speechLang: 'ar' | 'en', type: 'original' | 'translated') => {
    if (isSpeaking === type) {
      stopSpeaking();
      setIsSpeaking(null);
      return;
    }
    stopSpeaking();
    setIsSpeaking(type);
    const success = speakText(text, speechLang);
    if (!success) {
      setIsSpeaking(null);
    }
    // Auto reset speaking state after rough duration
    const words = text.split(/\s+/).length;
    const estMillis = Math.max(2000, words * 400);
    setTimeout(() => {
      setIsSpeaking((curr) => (curr === type ? null : curr));
    }, estMillis);
  };

  const handleSaveEdits = () => {
    const updated: RecordingItem = {
      ...recording,
      transcription: editableOriginal,
      translatedText: editableTranslated,
    };
    onUpdateRecording(updated);
    setIsEditing(false);
  };

  const handleExportSrt = () => {
    const srt = generateSrtContent(
      recording.segments || [
        {
          originalText: recording.transcription || '',
          translatedText: recording.translatedText || '',
        },
      ],
      recording.duration || 5,
      activeTab === 'translated' ? 'translated' : activeTab === 'original' ? 'original' : 'bilingual'
    );
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.title.replace(/\s+/g, '_')}_subtitles.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isDetectedArabic = recording.detectedLanguage === 'ar' || (!recording.detectedLanguage && lang === 'ar');

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-neutral-900/80 p-5 sm:p-6 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Languages className="h-4 w-4" />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-neutral-100">
              {t.bilingualTranscriptionTitle}
            </h3>
          </div>
          <p className="text-xs text-neutral-400">
            {t.bidirectionalFeatureDesc}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Language direction badge */}
          {hasContent && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-950 border border-neutral-800 text-neutral-200">
              <span className="text-amber-400 font-mono">
                {recording.detectedLanguage === 'ar' ? 'العربية' : 'English'}
              </span>
              <ArrowLeftRight className="h-3 w-3 text-neutral-500" />
              <span className="text-sky-400 font-mono">
                {recording.targetLanguage === 'ar' ? 'العربية' : 'English'}
              </span>
            </div>
          )}

          {/* Trigger Button */}
          <button
            onClick={handleTranscribeAndTranslate}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>{t.transcribingAndTranslating}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 fill-current" />
                <span>{hasContent ? (lang === 'ar' ? 'إعادة التفريغ والترجمة' : 'Re-Transcribe & Translate') : t.transcribeNow}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-neutral-400 hover:text-neutral-200 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading animation state */}
      {isLoading && (
        <div className="mt-6 p-8 rounded-xl border border-amber-500/20 bg-neutral-950/60 text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
            <Sparkles className="h-6 w-6 animate-spin" />
          </div>
          <div className="font-semibold text-neutral-200 text-sm">{t.generatingAiTranscript}</div>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {lang === 'ar'
              ? 'يتم الاستماع للتسجيل وتحويل الكلام لنص دقيق، مع التعرف على اللغة وترجمتها الفورية بالعكس (عربي ⇄ إنجليزي).'
              : 'Listening to your audio, detecting speech, and generating a precise bidirectional Arabic ⇄ English translation.'}
          </p>
        </div>
      )}

      {/* Content View */}
      {!isLoading && hasContent && (
        <div className="mt-4 space-y-4">
          {/* Summary Banner if available */}
          {recording.summary && (
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300/90 flex items-start gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">{t.aiSummary}: </span>
                <span>{recording.summary}</span>
              </div>
            </div>
          )}

          {/* Sub Navigation Bar & Tools */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {/* View switchers */}
            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setActiveTab('bilingual')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'bilingual'
                    ? 'bg-neutral-800 text-neutral-100 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {t.viewBilingual}
              </button>
              <button
                onClick={() => setActiveTab('original')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'original'
                    ? 'bg-neutral-800 text-neutral-100 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {t.viewOriginal}
              </button>
              <button
                onClick={() => setActiveTab('translated')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'translated'
                    ? 'bg-neutral-800 text-neutral-100 font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {t.viewTranslation}
              </button>
            </div>

            {/* Actions: Copy both, edit, export subtitles */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`p-1.5 text-xs rounded-lg border transition-colors ${
                  isEditing
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border-neutral-800'
                }`}
                title={lang === 'ar' ? 'تعديل النص يدوياً' : 'Edit text'}
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={handleCopyBoth}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-neutral-950 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
                title={t.copyBoth}
              >
                {copiedType === 'both' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{copiedType === 'both' ? t.copied : t.copyBoth}</span>
              </button>

              <button
                onClick={handleExportSrt}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-neutral-950 text-sky-300 hover:text-sky-200 border border-sky-500/20 transition-colors"
                title={t.exportSubtitles}
              >
                <Download className="h-3.5 w-3.5" />
                <span>SRT</span>
              </button>
            </div>
          </div>

          {/* Main Display: Side-by-Side or Selected Single View */}
          {isEditing ? (
            /* Editing Mode */
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 mb-1 block">
                    {t.originalSpeech} ({recording.detectedLanguage === 'ar' ? 'عربي' : 'English'})
                  </label>
                  <textarea
                    rows={6}
                    value={editableOriginal}
                    onChange={(e) => setEditableOriginal(e.target.value)}
                    dir={recording.detectedLanguage === 'ar' ? 'rtl' : 'ltr'}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 mb-1 block">
                    {t.translatedSpeech} ({recording.targetLanguage === 'ar' ? 'عربي' : 'English'})
                  </label>
                  <textarea
                    rows={6}
                    value={editableTranslated}
                    onChange={(e) => setEditableTranslated(e.target.value)}
                    dir={recording.targetLanguage === 'ar' ? 'rtl' : 'ltr'}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSaveEdits}
                  className="flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>{t.save}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Standard Display Mode */
            <div
              className={`grid gap-4 pt-1 ${
                activeTab === 'bilingual' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {/* Original Speech Column */}
              {(activeTab === 'bilingual' || activeTab === 'original') && (
                <div className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-950 p-4 shadow-inner">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800/80">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span className="text-xs font-semibold text-neutral-200">{t.originalSpeech}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                        {recording.detectedLanguageLabel || (recording.detectedLanguage === 'ar' ? 'العربية' : 'English')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Speech synthesis speak */}
                      <button
                        onClick={() =>
                          handleSpeak(
                            recording.transcription || '',
                            recording.detectedLanguage === 'ar' ? 'ar' : 'en',
                            'original'
                          )
                        }
                        className={`p-1.5 rounded-md transition-colors ${
                          isSpeaking === 'original'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                        title={isSpeaking === 'original' ? t.listenStop : t.listenToOriginal}
                      >
                        {isSpeaking === 'original' ? (
                          <VolumeX className="h-3.5 w-3.5 animate-pulse text-amber-400" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* Copy */}
                      <button
                        onClick={() => handleCopy(recording.transcription || '', 'original')}
                        className="p-1.5 text-neutral-400 hover:text-neutral-200 transition-colors"
                        title={t.copyTranscription}
                      >
                        {copiedType === 'original' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p
                    dir={recording.detectedLanguage === 'ar' ? 'rtl' : 'ltr'}
                    className="text-xs sm:text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap select-text flex-1"
                  >
                    {recording.transcription}
                  </p>
                </div>
              )}

              {/* Translated Speech Column */}
              {(activeTab === 'bilingual' || activeTab === 'translated') && (
                <div className="flex flex-col rounded-xl border border-sky-500/30 bg-sky-950/10 p-4 shadow-inner">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-sky-500/20">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sky-400" />
                      <span className="text-xs font-semibold text-sky-300">{t.translatedSpeech}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-500/30">
                        {recording.targetLanguageLabel || (recording.targetLanguage === 'ar' ? 'العربية' : 'English')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Speech synthesis speak */}
                      <button
                        onClick={() =>
                          handleSpeak(
                            recording.translatedText || '',
                            recording.targetLanguage === 'ar' ? 'ar' : 'en',
                            'translated'
                          )
                        }
                        className={`p-1.5 rounded-md transition-colors ${
                          isSpeaking === 'translated'
                            ? 'bg-sky-500/30 text-sky-200'
                            : 'text-sky-400 hover:text-sky-200'
                        }`}
                        title={isSpeaking === 'translated' ? t.listenStop : t.listenToTranslation}
                      >
                        {isSpeaking === 'translated' ? (
                          <VolumeX className="h-3.5 w-3.5 animate-pulse text-sky-300" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* Copy */}
                      <button
                        onClick={() => handleCopy(recording.translatedText || '', 'translated')}
                        className="p-1.5 text-sky-400 hover:text-sky-200 transition-colors"
                        title={t.copyTranscription}
                      >
                        {copiedType === 'translated' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p
                    dir={recording.targetLanguage === 'ar' ? 'rtl' : 'ltr'}
                    className="text-xs sm:text-sm text-neutral-100 leading-relaxed whitespace-pre-wrap select-text flex-1"
                  >
                    {recording.translatedText}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State when no transcription has taken place yet */}
      {!isLoading && !hasContent && (
        <div className="mt-4 p-6 rounded-xl border border-dashed border-neutral-800 bg-neutral-950/40 text-center">
          <Languages className="mx-auto h-8 w-8 text-neutral-600 mb-2" />
          <p className="text-xs text-neutral-400 mb-3">{t.noTranscriptionYet}</p>
          <button
            onClick={handleTranscribeAndTranslate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 shadow-md transition-colors cursor-pointer"
          >
            <Sparkles className="h-4 w-4 fill-current" />
            <span>{t.transcribeNow}</span>
          </button>
        </div>
      )}
    </div>
  );
};
