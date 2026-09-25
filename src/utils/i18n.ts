import { Language } from '../types/audio';

export interface Translations {
  appName: string;
  appSubtitle: string;
  studioRecorder: string;
  library: string;
  settings: string;
  record: string;
  recording: string;
  paused: string;
  readyToRecord: string;
  pressToRecord: string;
  pause: string;
  resume: string;
  stopAndSave: string;
  cancelRecording: string;
  addBookmark: string;
  bookmarkAdded: string;
  bookmarkPlaceholder: string;
  bookmarks: string;
  noBookmarks: string;
  liveTranscription: string;
  transcriptionPlaceholder: string;
  audioVisualizer: string;
  visualizerBars: string;
  visualizerWave: string;
  visualizerFreq: string;
  micSettings: string;
  selectMic: string;
  noiseSuppression: string;
  echoCancellation: string;
  autoGainControl: string;
  monitoringHeadphones: string;
  monitoringDesc: string;
  formatSelection: string;
  inputLevel: string;
  decibelMeter: string;
  clippingWarning: string;
  totalRecordings: string;
  searchRecordings: string;
  filterAll: string;
  filterFavorites: string;
  noRecordingsYet: string;
  noRecordingsDesc: string;
  startFirstRecording: string;
  importAudioFile: string;
  dragAndDropAudio: string;
  play: string;
  playing: string;
  playbackSpeed: string;
  loopPlayback: string;
  volume: string;
  mute: string;
  unmute: string;
  audioEffects: string;
  fxNormal: string;
  fxVocalEnhance: string;
  fxBassBoost: string;
  fxCleanVoice: string;
  trimAndEdit: string;
  trimSelection: string;
  saveTrimmedCopy: string;
  trimSuccess: string;
  cancelTrim: string;
  startTrim: string;
  endTrim: string;
  notes: string;
  notesPlaceholder: string;
  transcription: string;
  copyTranscription: string;
  copied: string;
  downloadWav: string;
  downloadWebm: string;
  downloadTxt: string;
  deleteRecording: string;
  confirmDelete: string;
  confirmDeleteDesc: string;
  delete: string;
  cancel: string;
  save: string;
  title: string;
  duration: string;
  size: string;
  date: string;
  format: string;
  tags: string;
  addTag: string;
  tagMeeting: string;
  tagIdea: string;
  tagVoiceMemo: string;
  tagLecture: string;
  tagInterview: string;
  micPermissionDenied: string;
  micPermissionHelp: string;
  deviceDefault: string;
  unknownDevice: string;
  close: string;
  selectAll: string;
  deleteSelected: string;
  exportSelected: string;
  aiTranscribeTranslate: string;
  transcribingAndTranslating: string;
  originalSpeech: string;
  translatedSpeech: string;
  arabicToEnglish: string;
  englishToArabic: string;
  detectedLang: string;
  targetLang: string;
  autoTranscribeOnStop: string;
  copyBoth: string;
  listenToTranslation: string;
  listenToOriginal: string;
  viewBilingual: string;
  viewOriginal: string;
  viewTranslation: string;
  aiSummary: string;
  exportSubtitles: string;
  noTranscriptionYet: string;
  transcribeNow: string;
  bidirectionalFeatureDesc: string;
  generatingAiTranscript: string;
  bilingualTranscriptionTitle: string;
  listenStop: string;
  liveInterpreter: string;
  liveInterpreterDesc: string;
  startLiveTranslation: string;
  stopLiveTranslation: string;
  liveSubtitles: string;
  threeSecSilenceRule: string;
  wordsSequentialFlow: string;
  speakingActive: string;
  silenceHoldCountdown: string;
  waitingForVoice: string;
  speakArabicOrEnglish: string;
  liveHistory: string;
  clearLiveHistory: string;
  teleprompterMode: string;
  autoSpeakTranslation: string;
  trySamplePhrase: string;
  liveWordStream: string;
}

export const translations: Record<Language, Translations> = {
  ar: {
    appName: 'صوتي',
    appSubtitle: 'استوديو تسجيل وتحرير الصوت الاحترافي',
    studioRecorder: 'تسجيل جديد',
    library: 'المكتبة الصوتية',
    settings: 'إعدادات الميكروفون',
    record: 'تسجيل',
    recording: 'جاري التسجيل...',
    paused: 'متوقف مؤقتاً',
    readyToRecord: 'جاهز للتسجيل',
    pressToRecord: 'اضغط على الزر الأحمر لبدء تسجيل صوتك بدقة عالية',
    pause: 'إيقاف مؤقت',
    resume: 'استئناف',
    stopAndSave: 'إنهاء وحفظ',
    cancelRecording: 'إلغاء التسجيل',
    addBookmark: 'إضافة علامة',
    bookmarkAdded: 'تمت إضافة علامة زمنية',
    bookmarkPlaceholder: 'وصف العلامة (مثلاً: فكرة هامة، سؤال...)',
    bookmarks: 'العلامات الزمنية',
    noBookmarks: 'لا توجد علامات زمنية مضافة',
    liveTranscription: 'التفريغ الصوتي المباشر',
    transcriptionPlaceholder: 'سيظهر الكلام المنطوق هنا تلقائياً أثناء حديثك...',
    audioVisualizer: 'شكل الموجة',
    visualizerBars: 'أعمدة صوتية',
    visualizerWave: 'موجة متصلة',
    visualizerFreq: 'طيف الترددات',
    micSettings: 'إعدادات الصوت والميكروفون',
    selectMic: 'جهاز الميكروفون',
    noiseSuppression: 'عزل الضوضاء الخلفية',
    echoCancellation: 'إلغاء الصدى الصوتي',
    autoGainControl: 'الموازنة التلقائية لمستوى الصوت',
    monitoringHeadphones: 'مراقبة الصوت المباشرة (سماعات الرأس)',
    monitoringDesc: 'سماع صوتك فورياً عبر السماعات أثناء التسجيل (يُفضل استخدام سماعات الأذن لتجنب التغذية الراجعة)',
    formatSelection: 'صيغة التسجيل',
    inputLevel: 'مستوى الدخل',
    decibelMeter: 'مقياس الديسبل',
    clippingWarning: 'تنبيه: الصوت مرتفع جداً (تشويش/قص)',
    totalRecordings: 'تسجيل',
    searchRecordings: 'بحث في العناوين، الملاحظات، أو النصوص...',
    filterAll: 'جميع التسجيلات',
    filterFavorites: 'المفضلة',
    noRecordingsYet: 'لا توجد تسجيلات بعد',
    noRecordingsDesc: 'ابدأ بتسجيل أول فكرة أو اجتماع بصوت نقي وعالي الجودة، أو اسحب ملف صوتي هنا.',
    startFirstRecording: 'ابدأ التسجيل الآن',
    importAudioFile: 'استيراد ملف صوتي',
    dragAndDropAudio: 'أو اسحب ملف صوتي هنا (MP3, WAV, M4A, OGG)',
    play: 'تشغيل',
    playing: 'قيد التشغيل',
    playbackSpeed: 'السرعة',
    loopPlayback: 'تكرار',
    volume: 'مستوى الصوت',
    mute: 'كتم',
    unmute: 'إلغاء الكتم',
    audioEffects: 'تأثيرات الصوت وفلاتر التردد',
    fxNormal: 'صوت طبيعي',
    fxVocalEnhance: 'تعزيز وضوح الصوت',
    fxBassBoost: 'تضخيم النغمات العميقة',
    fxCleanVoice: 'فلتر تنقية وعزل التشويش',
    trimAndEdit: 'قص وتحرير الصوت',
    trimSelection: 'تحديد النطاق المراد قصه',
    saveTrimmedCopy: 'حفظ المقطع المحدد كملف مستقل',
    trimSuccess: 'تم إنشاء وحفظ المقطع بنجاح!',
    cancelTrim: 'إلغاء القص',
    startTrim: 'البداية',
    endTrim: 'النهاية',
    notes: 'ملاحظات التسجيل',
    notesPlaceholder: 'أضف تفاصيل، ملخص، أو نقاط رئيسية هنا...',
    transcription: 'النص المفرغ',
    copyTranscription: 'نسخ النص',
    copied: 'تم النسخ!',
    downloadWav: 'تحميل كملف WAV (نقاء استوديو)',
    downloadWebm: 'تحميل كملف WebM الأصلي',
    downloadTxt: 'تحميل النص المفرغ (.txt)',
    deleteRecording: 'حذف التسجيل',
    confirmDelete: 'هل أنت متأكد من حذف هذا التسجيل؟',
    confirmDeleteDesc: 'لا يمكن التراجع عن هذه الخطوة وسيتم حذف الملف الصوتي نهائياً من الذاكرة.',
    delete: 'حذف',
    cancel: 'إلغاء',
    save: 'حفظ التعديلات',
    title: 'عنوان التسجيل',
    duration: 'المدة',
    size: 'الحجم',
    date: 'التاريخ',
    format: 'الصيغة',
    tags: 'التصنيفات والوسوم',
    addTag: 'إضافة وسم',
    tagMeeting: 'اجتماع',
    tagIdea: 'فكرة',
    tagVoiceMemo: 'مذكرة شخصية',
    tagLecture: 'محاضرة',
    tagInterview: 'مقابلة',
    micPermissionDenied: 'تعذر الوصول إلى الميكروفون',
    micPermissionHelp: 'يرجى منح إذن الميكروفون في المتصفح للتمكن من تسجيل الصوت.',
    deviceDefault: 'الميكروفون الافتراضي للمتصفح',
    unknownDevice: 'جهاز مجهول',
    close: 'إغلاق',
    selectAll: 'تحديد الكل',
    deleteSelected: 'حذف المحدد',
    exportSelected: 'تصدير المحدد',
    aiTranscribeTranslate: 'تفريغ وترجمة فورية (عربي ⇄ إنجليزي)',
    transcribingAndTranslating: 'جاري التفريغ الذكي والترجمة التلقائية...',
    originalSpeech: 'النص المنطوق الأصلي',
    translatedSpeech: 'الترجمة الفورية',
    arabicToEnglish: 'العربية ← English',
    englishToArabic: 'English ← العربية',
    detectedLang: 'اللغة المكتشفة',
    targetLang: 'اللغة المترجم إليها',
    autoTranscribeOnStop: 'تفريغ وترجمة تلقائياً عند إنهاء التسجيل',
    copyBoth: 'نسخ النصين معاً',
    listenToTranslation: 'استماع للترجمة',
    listenToOriginal: 'استماع للأصل',
    viewBilingual: 'عرض مزدوج',
    viewOriginal: 'الأصل فقط',
    viewTranslation: 'الترجمة فقط',
    aiSummary: 'ملخص المحتوى',
    exportSubtitles: 'تصدير ملف ترجمة (SRT)',
    noTranscriptionYet: 'لم يتم استخراج النص والترجمة بعد.',
    transcribeNow: 'تفريغ وترجمة ذكية الآن',
    bidirectionalFeatureDesc: 'التعرف على الصوت تلقائياً: إذا تحدثت بالعربية يحوله للإنجليزية، وإذا تحدثت بالإنجليزية يحوله للعربية.',
    generatingAiTranscript: 'جاري استماع الذكاء الاصطناعي وترجمة الكلام...',
    bilingualTranscriptionTitle: 'التفريغ والترجمة الصوتية الذكية (عربي ⇄ English)',
    listenStop: 'إيقاف النطق',
    liveInterpreter: 'الترجمة الفورية المباشرة',
    liveInterpreterDesc: 'تحدث وسيتم تفريغ وترجمة كلماتك فورياً متتالية، وتبقى على الشاشة لمدة 3 ثوانٍ عند التوقف',
    startLiveTranslation: 'بدء الترجمة الفورية',
    stopLiveTranslation: 'إيقاف الترجمة الفورية',
    liveSubtitles: 'شاشة الترجمة والسبسكريبشن الحي',
    threeSecSilenceRule: 'تبقى الكلمات ظاهرة لمدة 3 ثوانٍ بعد السكوت',
    wordsSequentialFlow: 'تدفق الكلمات المتتالية',
    speakingActive: 'جاري التحدث...',
    silenceHoldCountdown: 'ثوانٍ متبقية قبل الإخفاء',
    waitingForVoice: 'في انتظار صوتك... تحدث الآن',
    speakArabicOrEnglish: 'تحدث بأي جملة بالعربية أو الإنجليزية وسيترجمها فوراً',
    liveHistory: 'سجل المحادثة والترجمة',
    clearLiveHistory: 'مسح السجل',
    teleprompterMode: 'وضع الشاشة الكاملة / القارئ',
    autoSpeakTranslation: 'نطق الترجمة صوتياً تلقائياً',
    trySamplePhrase: 'تجربة جملة جاهزة',
    liveWordStream: 'الكلمات المباشرة',
  },
  en: {
    appName: 'Sawti',
    appSubtitle: 'Professional Audio Recording & Studio Suite',
    studioRecorder: 'New Recording',
    library: 'Audio Library',
    settings: 'Mic Settings',
    record: 'Record',
    recording: 'Recording...',
    paused: 'Paused',
    readyToRecord: 'Ready to Record',
    pressToRecord: 'Press the red button to record high-fidelity studio audio',
    pause: 'Pause',
    resume: 'Resume',
    stopAndSave: 'Stop & Save',
    cancelRecording: 'Discard Recording',
    addBookmark: 'Add Marker',
    bookmarkAdded: 'Timestamp marker added',
    bookmarkPlaceholder: 'Marker note (e.g. key point, question...)',
    bookmarks: 'Markers',
    noBookmarks: 'No markers added yet',
    liveTranscription: 'Live Voice-to-Text',
    transcriptionPlaceholder: 'Transcribed speech will appear here live as you speak...',
    audioVisualizer: 'Waveform View',
    visualizerBars: 'Audio Bars',
    visualizerWave: 'Oscilloscope',
    visualizerFreq: 'Frequency Spectrum',
    micSettings: 'Microphone & Audio Settings',
    selectMic: 'Microphone Device',
    noiseSuppression: 'Background Noise Suppression',
    echoCancellation: 'Echo Cancellation',
    autoGainControl: 'Auto Gain Control',
    monitoringHeadphones: 'Live Audio Monitoring',
    monitoringDesc: 'Hear your voice in real-time through headphones (use wired/earphones to avoid feedback)',
    formatSelection: 'Recording Format',
    inputLevel: 'Input Level',
    decibelMeter: 'Decibel VU Meter',
    clippingWarning: 'Warning: Volume too loud (clipping distortion)',
    totalRecordings: 'recordings',
    searchRecordings: 'Search titles, notes, or transcripts...',
    filterAll: 'All Recordings',
    filterFavorites: 'Favorites',
    noRecordingsYet: 'No recordings yet',
    noRecordingsDesc: 'Start recording your first memo, voice idea, or drag and drop an audio file.',
    startFirstRecording: 'Start Recording Now',
    importAudioFile: 'Import Audio File',
    dragAndDropAudio: 'or drop an audio file here (MP3, WAV, M4A, OGG)',
    play: 'Play',
    playing: 'Playing',
    playbackSpeed: 'Speed',
    loopPlayback: 'Loop',
    volume: 'Volume',
    mute: 'Mute',
    unmute: 'Unmute',
    audioEffects: 'Audio Effects & EQ',
    fxNormal: 'Natural Audio',
    fxVocalEnhance: 'Vocal Clarity Boost',
    fxBassBoost: 'Deep Bass Boost',
    fxCleanVoice: 'Denoise & Clean Voice',
    trimAndEdit: 'Trim & Edit Audio',
    trimSelection: 'Select Region to Trim',
    saveTrimmedCopy: 'Save Trimmed Segment as New File',
    trimSuccess: 'Trimmed segment saved successfully!',
    cancelTrim: 'Cancel Trim',
    startTrim: 'Start',
    endTrim: 'End',
    notes: 'Recording Notes',
    notesPlaceholder: 'Add summaries, action items, or remarks...',
    transcription: 'Voice Transcript',
    copyTranscription: 'Copy Transcript',
    copied: 'Copied!',
    downloadWav: 'Download WAV (Studio Quality)',
    downloadWebm: 'Download WebM (Original)',
    downloadTxt: 'Export Transcript (.txt)',
    deleteRecording: 'Delete Recording',
    confirmDelete: 'Are you sure you want to delete this recording?',
    confirmDeleteDesc: 'This cannot be undone. The audio file will be permanently removed from storage.',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save Changes',
    title: 'Recording Title',
    duration: 'Duration',
    size: 'Size',
    date: 'Date',
    format: 'Format',
    tags: 'Categories & Tags',
    addTag: 'Add Tag',
    tagMeeting: 'Meeting',
    tagIdea: 'Idea',
    tagVoiceMemo: 'Voice Memo',
    tagLecture: 'Lecture',
    tagInterview: 'Interview',
    micPermissionDenied: 'Microphone Access Denied',
    micPermissionHelp: 'Please enable microphone access in your browser settings to record audio.',
    deviceDefault: 'System Default Microphone',
    unknownDevice: 'Unknown Device',
    close: 'Close',
    selectAll: 'Select All',
    deleteSelected: 'Delete Selected',
    exportSelected: 'Export Selected',
    aiTranscribeTranslate: 'AI Transcribe & Translate (Arabic ⇄ English)',
    transcribingAndTranslating: 'Transcribing speech & translating bidirectional...',
    originalSpeech: 'Original Spoken Text',
    translatedSpeech: 'AI Translation',
    arabicToEnglish: 'Arabic → English',
    englishToArabic: 'English → Arabic',
    detectedLang: 'Detected Language',
    targetLang: 'Target Language',
    autoTranscribeOnStop: 'Auto transcribe & translate on stop',
    copyBoth: 'Copy Both Texts',
    listenToTranslation: 'Listen to Translation',
    listenToOriginal: 'Listen to Original',
    viewBilingual: 'Side-by-Side',
    viewOriginal: 'Original Only',
    viewTranslation: 'Translation Only',
    aiSummary: 'Summary',
    exportSubtitles: 'Export Subtitles (.srt)',
    noTranscriptionYet: 'No transcript or translation yet.',
    transcribeNow: 'Transcribe & Translate Now',
    bidirectionalFeatureDesc: 'Speaks Arabic → Translates to English. Speaks English → Translates to Arabic automatically.',
    generatingAiTranscript: 'AI is listening and translating speech...',
    bilingualTranscriptionTitle: 'AI Speech Transcription & Translation (Arabic ⇄ English)',
    listenStop: 'Stop Voice',
    liveInterpreter: 'Live Instant Translation',
    liveInterpreterDesc: 'Speak and words are transcribed & translated in real time; stays on screen for 3 seconds upon pause',
    startLiveTranslation: 'Start Live Translation',
    stopLiveTranslation: 'Stop Live Translation',
    liveSubtitles: 'Live Bilingual Subtitles & Teleprompter',
    threeSecSilenceRule: 'Words stay on screen for 3s after pause',
    wordsSequentialFlow: 'Sequential Word Stream',
    speakingActive: 'Speaking...',
    silenceHoldCountdown: 'Seconds remaining before hiding',
    waitingForVoice: 'Listening for speech... Speak now',
    speakArabicOrEnglish: 'Speak any sentence in Arabic or English to translate instantly',
    liveHistory: 'Conversation & Translation History',
    clearLiveHistory: 'Clear History',
    teleprompterMode: 'Fullscreen Subtitles',
    autoSpeakTranslation: 'Auto-speak translation (TTS)',
    trySamplePhrase: 'Try sample sentence',
    liveWordStream: 'Live Words',
  },
};
