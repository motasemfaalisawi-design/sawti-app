import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Star,
  Play,
  Pause,
  Trash2,
  Download,
  Upload,
  Clock,
  HardDrive,
  FileText,
  FileAudio,
  Calendar,
  Sparkles,
  Plus,
  Scissors,
} from 'lucide-react';
import { RecordingItem, Language } from '../types/audio';
import { translations } from '../utils/i18n';
import { formatTime, formatBytes, decodeAudioBlob, extractPeaks } from '../utils/audioProcessing';
import { audioBufferToWav } from '../utils/wavEncoder';

interface RecordingsLibraryProps {
  recordings: RecordingItem[];
  currentPlayingId: string | null;
  isPlaying: boolean;
  onPlayRecording: (recording: RecordingItem) => void;
  onPauseRecording: () => void;
  onDeleteRecording: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenDetails: (recording: RecordingItem) => void;
  onSelectForEdit: (recording: RecordingItem) => void;
  onImportAudio: (newRecording: RecordingItem) => void;
  onNewRecordingClick: () => void;
  lang: Language;
}

export const RecordingsLibrary: React.FC<RecordingsLibraryProps> = ({
  recordings,
  currentPlayingId,
  isPlaying,
  onPlayRecording,
  onPauseRecording,
  onDeleteRecording,
  onToggleFavorite,
  onOpenDetails,
  onSelectForEdit,
  onImportAudio,
  onNewRecordingClick,
  lang,
}) => {
  const t = translations[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Collect unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    recordings.forEach((r) => r.tags?.forEach((tag) => tagsSet.add(tag)));
    return Array.from(tagsSet);
  }, [recordings]);

  // Filtered list
  const filteredRecordings = useMemo(() => {
    return recordings.filter((item) => {
      // Tag filter
      if (selectedTag === 'favorites' && !item.favorite) return false;
      if (selectedTag !== 'all' && selectedTag !== 'favorites' && !item.tags?.includes(selectedTag)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        const matchesTrans = item.transcription?.toLowerCase().includes(q);
        const matchesTranslated = item.translatedText?.toLowerCase().includes(q);
        return matchesTitle || matchesNotes || matchesTrans || matchesTranslated;
      }

      return true;
    });
  }, [recordings, selectedTag, searchQuery]);

  // Handle Audio File Upload / Import
  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|webm|flac)$/i)) {
      alert(lang === 'ar' ? 'يرجى اختيار ملف صوتي صالح' : 'Please select a valid audio file');
      return;
    }

    setIsImporting(true);
    try {
      const buffer = await decodeAudioBlob(file);
      const peaks = extractPeaks(buffer, 120);

      const newRec: RecordingItem = {
        id: 'rec_import_' + Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        blob: file,
        duration: buffer.duration,
        createdAt: file.lastModified || Date.now(),
        format: file.type || 'audio/wav',
        size: file.size,
        tags: [lang === 'ar' ? 'ملف مستورد' : 'Imported'],
        notes: '',
        transcription: '',
        bookmarks: [],
        peaks,
        favorite: false,
        sampleRate: buffer.sampleRate,
        channels: buffer.numberOfChannels,
      };

      onImportAudio(newRec);
    } catch (err) {
      console.error('Import audio error:', err);
      alert(lang === 'ar' ? 'تعذر قراءة الملف الصوتي' : 'Failed to decode audio file');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadWav = async (item: RecordingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      let downloadBlob = item.blob;
      if (!item.format.includes('wav')) {
        const buffer = await decodeAudioBlob(item.blob);
        downloadBlob = audioBufferToWav(buffer);
      }
      const url = URL.createObjectURL(downloadBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.title.replace(/\s+/g, '_')}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Top Header & Actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            <span>{t.library}</span>
            <span className="text-xs font-mono text-neutral-400 font-normal">
              ({recordings.length} {t.totalRecordings})
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio File Import Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileProcess(e.target.files[0]);
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>{isImporting ? (lang === 'ar' ? 'جاري الاستيراد...' : 'Importing...') : t.importAudioFile}</span>
          </button>

          {/* New Recording CTA */}
          <button
            onClick={onNewRecordingClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{t.studioRecorder}</span>
          </button>
        </div>
      </div>

      {/* Search and Category Filters Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-neutral-500 rtl:right-auto rtl:left-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchRecordings}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 px-3.5 py-2 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              selectedTag === 'all'
                ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/60'
            }`}
          >
            {t.filterAll}
          </button>

          <button
            onClick={() => setSelectedTag('favorites')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              selectedTag === 'favorites'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/60'
            }`}
          >
            <Star className="h-3 w-3 fill-current text-amber-400" />
            <span>{t.filterFavorites}</span>
          </button>

          {allTags.map((tg) => (
            <button
              key={tg}
              onClick={() => setSelectedTag(tg)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedTag === tg
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900/60'
              }`}
            >
              {tg}
            </button>
          ))}
        </div>
      </div>

      {/* Drag & Drop zone banner (active when dragged over or quiet at top) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={handleDrop}
        className={`mb-6 p-4 rounded-xl border border-dashed transition-all text-center ${
          isDraggingFile
            ? 'border-amber-400 bg-amber-500/10 text-amber-300 scale-[1.01]'
            : 'border-neutral-800/80 bg-neutral-950/40 text-neutral-500 hover:border-neutral-700'
        }`}
      >
        <p className="text-xs">{t.dragAndDropAudio}</p>
      </div>

      {/* Empty State */}
      {filteredRecordings.length === 0 && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-12 text-center">
          <FileAudio className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
          <h3 className="text-base font-semibold text-neutral-200">{t.noRecordingsYet}</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">{t.noRecordingsDesc}</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={onNewRecordingClick}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{t.startFirstRecording}</span>
            </button>
          </div>
        </div>
      )}

      {/* Recordings Grid / List */}
      <div className="space-y-3">
        {filteredRecordings.map((item) => {
          const isCurrent = currentPlayingId === item.id;
          const isItemPlaying = isCurrent && isPlaying;

          return (
            <div
              key={item.id}
              onClick={() => onSelectForEdit(item)}
              className={`group relative rounded-xl border p-4 transition-all cursor-pointer ${
                isCurrent
                  ? 'border-amber-500/40 bg-neutral-900/90 shadow-md shadow-amber-500/5'
                  : 'border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 hover:border-neutral-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Play button + Title + Metadata */}
                <div className="flex items-start sm:items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isItemPlaying) {
                        onPauseRecording();
                      } else {
                        onPlayRecording(item);
                      }
                    }}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 ${
                      isItemPlaying
                        ? 'bg-amber-500 text-neutral-950'
                        : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                    }`}
                  >
                    {isItemPlaying ? (
                      <Pause className="h-4 w-4 fill-current" />
                    ) : (
                      <Play className="h-4 w-4 fill-current ms-0.5" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-neutral-100 group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </h4>
                      {item.transcription && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {lang === 'ar' ? 'مفرّغ' : 'Transcribed'}
                        </span>
                      )}
                      {item.translatedText && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                          <span>{item.detectedLanguage === 'ar' ? 'عربي' : 'EN'}</span>
                          <span>➔</span>
                          <span>{item.targetLanguage === 'ar' ? 'عربي' : 'EN'}</span>
                        </span>
                      )}
                      {item.bookmarks.length > 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          {item.bookmarks.length} {lang === 'ar' ? 'علامات' : 'markers'}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-neutral-500" />
                        <span className="tabular-nums">{formatTime(item.duration)}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3 text-neutral-500" />
                        <span>{formatBytes(item.size)}</span>
                      </span>
                      <span>·</span>
                      <span className="uppercase text-neutral-500">{item.format.split('/')[1] || 'audio'}</span>
                      <span>·</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-1 self-end sm:self-center">
                  {/* Favorite Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item.id);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      item.favorite
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                    title={t.filterFavorites}
                  >
                    <Star className={`h-4 w-4 ${item.favorite ? 'fill-current' : ''}`} />
                  </button>

                  {/* Trim / Edit quick jump */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectForEdit(item);
                    }}
                    className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
                    title={t.trimAndEdit}
                  >
                    <Scissors className="h-4 w-4" />
                  </button>

                  {/* Notes & Details */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetails(item);
                    }}
                    className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
                    title={t.notes}
                  >
                    <FileText className="h-4 w-4" />
                  </button>

                  {/* Download WAV */}
                  <button
                    onClick={(e) => handleDownloadWav(item, e)}
                    className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
                    title={t.downloadWav}
                  >
                    <Download className="h-4 w-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(t.confirmDeleteDesc)) {
                        onDeleteRecording(item.id);
                      }
                    }}
                    className="p-2 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title={t.delete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Preview of Notes, Transcription, and AI Translation if available */}
              {(item.notes || item.transcription || item.translatedText) && (
                <div className="mt-2.5 pt-2 border-t border-neutral-800/60 text-xs text-neutral-400 space-y-1">
                  {item.notes && (
                    <div className="line-clamp-1 italic text-neutral-400">
                      <span className="font-semibold text-neutral-500">{lang === 'ar' ? 'ملاحظة' : 'Note'}:</span> {item.notes}
                    </div>
                  )}
                  {item.transcription && (
                    <div className="line-clamp-1 text-neutral-300">
                      <span className="font-semibold text-amber-400/90">{lang === 'ar' ? 'الأصل' : 'Speech'}:</span> {item.transcription}
                    </div>
                  )}
                  {item.translatedText && (
                    <div className="line-clamp-1 text-sky-300/90">
                      <span className="font-semibold text-sky-400">{lang === 'ar' ? 'الترجمة' : 'Translation'}:</span> {item.translatedText}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
