import React, { useState } from 'react';
import {
  X,
  FileText,
  Copy,
  Check,
  Download,
  Tag,
  Calendar,
  Clock,
  HardDrive,
  Save,
  Trash2,
  Sparkles,
  Languages,
  Volume2,
  VolumeX,
  ArrowLeftRight,
  RefreshCw,
} from 'lucide-react';
import { RecordingItem, Language } from '../types/audio';
import { translations } from '../utils/i18n';
import { formatTime, formatBytes, decodeAudioBlob } from '../utils/audioProcessing';
import { audioBufferToWav } from '../utils/wavEncoder';
import { transcribeAndTranslateAudio, speakText, stopSpeaking } from '../utils/aiTranscription';

interface RecordingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recording: RecordingItem | null;
  onSave: (updated: RecordingItem) => void;
  onDelete: (id: string) => void;
  lang: Language;
}

export const RecordingDetailModal: React.FC<RecordingDetailModalProps> = ({
  isOpen,
  onClose,
  recording,
  onSave,
  onDelete,
  lang,
}) => {
  const t = translations[lang];

  if (!isOpen || !recording) return null;

  const [title, setTitle] = useState(recording.title);
  const [notes, setNotes] = useState(recording.notes || '');
  const [transcription, setTranscription] = useState(recording.transcription || '');
  const [translatedText, setTranslatedText] = useState(recording.translatedText || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(recording.tags || []);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [copiedTranslation, setCopiedTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeSpeech, setActiveSpeech] = useState<'original' | 'translated' | null>(null);

  const handleSave = () => {
    onSave({
      ...recording,
      title: title.trim() || recording.title,
      notes: notes.trim(),
      transcription: transcription.trim(),
      translatedText: translatedText.trim(),
      tags,
    });
    onClose();
  };

  const handleAITranscribe = async () => {
    setIsTranslating(true);
    try {
      const res = await transcribeAndTranslateAudio(recording.blob, transcription);
      if (res) {
        if (res.originalTranscription) setTranscription(res.originalTranscription);
        if (res.translatedText) setTranslatedText(res.translatedText);
      }
    } catch (e) {
      console.error('Error during AI translation:', e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSpeak = (text: string, speechLang: 'ar' | 'en', type: 'original' | 'translated') => {
    if (activeSpeech === type) {
      stopSpeaking();
      setActiveSpeech(null);
      return;
    }
    stopSpeaking();
    setActiveSpeech(type);
    speakText(text, speechLang);
    setTimeout(() => setActiveSpeech(null), 4000);
  };

  const handleCopyTranscript = () => {
    if (!transcription) return;
    navigator.clipboard.writeText(transcription);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const handleCopyTranslation = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopiedTranslation(true);
    setTimeout(() => setCopiedTranslation(false), 2000);
  };

  const handleDownloadTranscript = () => {
    if (!transcription) return;
    const blob = new Blob([transcription], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
      a.download = `${title.replace(/\s+/g, '_')}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (!tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tg) => tg !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-semibold">{t.notes} & {t.transcription}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">{t.title}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-neutral-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Metadata chips */}
          <div className="flex flex-wrap gap-4 text-xs font-mono text-neutral-400 p-3 rounded-xl bg-neutral-950 border border-neutral-800/80">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-neutral-500" />
              <span>{formatTime(recording.duration)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5 text-neutral-500" />
              <span>{formatBytes(recording.size)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-neutral-500" />
              <span>{new Date(recording.createdAt).toLocaleString()}</span>
            </div>
            <div className="text-amber-400 font-semibold uppercase">
              {recording.format.split('/')[1] || 'audio'}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">{t.tags}</label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {tags.map((tg) => (
                <span
                  key={tg}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-xs text-neutral-200"
                >
                  <Tag className="h-3 w-3 text-amber-400" />
                  <span>{tg}</span>
                  <button
                    onClick={() => handleRemoveTag(tg)}
                    className="text-neutral-500 hover:text-neutral-300 ms-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder={t.addTag}
                className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-1.5 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Notes area */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">{t.notes}</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* AI Bilingual Transcription & Translation Area */}
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-neutral-200">
                  {t.bilingualTranscriptionTitle}
                </span>
              </div>

              <button
                onClick={handleAITranscribe}
                disabled={isTranslating}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 transition-colors"
              >
                {isTranslating ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>{t.transcribingAndTranslating}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 fill-current" />
                    <span>{t.transcribeNow}</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Original Speech Field */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-amber-400">
                    {t.originalSpeech}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSpeak(transcription, 'ar', 'original')}
                      className="p-1 text-neutral-400 hover:text-neutral-200"
                      title={t.listenToOriginal}
                    >
                      {activeSpeech === 'original' ? <VolumeX className="h-3 w-3 text-amber-400" /> : <Volume2 className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={handleCopyTranscript}
                      className="p-1 text-neutral-400 hover:text-neutral-200"
                      title={t.copyTranscription}
                    >
                      {copiedTranscript ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                  placeholder={t.transcriptionPlaceholder}
                  className="w-full bg-transparent text-xs text-neutral-200 focus:outline-none leading-relaxed resize-none"
                />
              </div>

              {/* Translated Speech Field */}
              <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-sky-400">
                    {t.translatedSpeech}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSpeak(translatedText, 'en', 'translated')}
                      className="p-1 text-sky-400 hover:text-sky-300"
                      title={t.listenToTranslation}
                    >
                      {activeSpeech === 'translated' ? <VolumeX className="h-3 w-3 text-sky-400" /> : <Volume2 className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={handleCopyTranslation}
                      className="p-1 text-sky-400 hover:text-sky-300"
                      title={t.copyTranscription}
                    >
                      {copiedTranslation ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={translatedText}
                  onChange={(e) => setTranslatedText(e.target.value)}
                  placeholder={lang === 'ar' ? 'ستظهر الترجمة الإنجليزية هنا...' : 'Arabic translation will appear here...'}
                  className="w-full bg-transparent text-xs text-neutral-100 focus:outline-none leading-relaxed resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm(t.confirmDeleteDesc)) {
                  onDelete(recording.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t.delete}</span>
            </button>
            <button
              onClick={handleDownloadWav}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{t.downloadWav}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{t.save}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
