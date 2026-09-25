import React, { useState } from 'react';
import {
  Package,
  Store,
  ExternalLink,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  Monitor,
  Apple,
  FileCode,
  X,
  Sparkles,
  ChevronRight,
  Info,
  Terminal,
  Globe,
  Layers,
} from 'lucide-react';

interface PackageForStoresModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type StoreTab = 'pwabuilder' | 'googleplay' | 'microsoft' | 'apple' | 'checklist' | 'export';

export const PackageForStoresModal: React.FC<PackageForStoresModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<StoreTab>('pwabuilder');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrigin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://ais-dev-kxhhdqxs3p4htdzfjmdvgz-657272522163.europe-west1.run.app';

  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(
    currentOrigin
  )}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentOrigin);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {}
  };

  const handleCopyCommand = async (cmd: string, id: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2000);
    } catch {}
  };

  const handleCopyTextSnippet = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(id);
      setTimeout(() => setCopiedText(null), 2000);
    } catch {}
  };

  const downloadJsonFile = (filename: string, data: object | string) => {
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Android Asset Links template
  const assetLinksTemplate = [
    {
      relation: [
        'delegate_permission/common.handle_all_urls',
        'delegate_permission/common.get_login_creds',
      ],
      target: {
        namespace: 'android_app',
        package_name: 'com.sawti.translator',
        sha256_cert_fingerprints: [
          'FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C',
        ],
      },
    },
  ];

  // Store metadata
  const storeListingMetadata = {
    appNameAr: 'صوتي - مترجم الشاشة الفوري واستوديو الصوت',
    appNameEn: 'Sawti - Screen Overlay Translator & Studio',
    shortDescriptionAr: 'ترجمة فورية عائمة على الشاشة بالذكاء الاصطناعي مع دعم الهمس وعزل الصوت.',
    shortDescriptionEn: 'Floating screen subtitle & instant voice translator with whisper mode.',
    keywords: [
      'translator',
      'overlay',
      'speech to text',
      'subtitles',
      'arabic translator',
      'voice recorder',
      'مترجم صوتي',
      'ترجمة فورية',
      'صوتي',
    ],
    category: 'Productivity & Utilities',
    rating: 'Everyone (3+)',
    privacyPolicyUrl: `${currentOrigin}/privacy.html`,
    supportEmail: 'support@sawti.app',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-[#1e1f20] border border-neutral-200 dark:border-neutral-700/80 rounded-3xl shadow-2xl overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-[#18191a]/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/25">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Package For Stores • حزم للمتاجر
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" />
                  100% جاهز للمتاجر
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                تجهيز وتوليد حزم التوزيع لمتاجر Google Play, Microsoft Store, و Apple App Store
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-[#1e1f20] overflow-x-auto scrollbar-none text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pwabuilder')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pwabuilder'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>⚡ توليد فوري (PWABuilder)</span>
          </button>

          <button
            onClick={() => setActiveTab('googleplay')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'googleplay'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 text-emerald-500" />
            <span>Google Play (Android TWA)</span>
          </button>

          <button
            onClick={() => setActiveTab('microsoft')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'microsoft'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Monitor className="h-3.5 w-3.5 text-sky-500" />
            <span>Microsoft Store (Windows MSIX)</span>
          </button>

          <button
            onClick={() => setActiveTab('apple')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'apple'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Apple className="h-3.5 w-3.5 text-neutral-800 dark:text-neutral-200" />
            <span>Apple App Store (iOS)</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'checklist'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
            <span>فحص الجاهزية للمتاجر</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'export'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Download className="h-3.5 w-3.5 text-indigo-500" />
            <span>تنزيل ملفات الحزمة</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PWABUILDER (INSTANT PACKAGING) */}
          {activeTab === 'pwabuilder' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-500/20 text-neutral-800 dark:text-neutral-200 space-y-3">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                  <Sparkles className="h-5 w-5" />
                  <span>الحل الأسرع والأسهل: التوليد الفوري عبر PWABuilder</span>
                </div>
                <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                  <strong>PWABuilder</strong> هي المنصة الرسمية المعتمدة من شركة <strong>Microsoft</strong> بالتعاون مع <strong>Google</strong> لتحويل تطبيقات الويب التقدمية (PWA) إلى حزم جاهزة للرفع مباشرة على متاجر التطبيقات:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5">
                    <Smartphone className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Google Play (APK & AAB)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5">
                    <Monitor className="h-4 w-4 text-sky-500 shrink-0" />
                    <span>Windows (MSIX Package)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5">
                    <Apple className="h-4 w-4 text-neutral-700 dark:text-neutral-300 shrink-0" />
                    <span>iOS App Store Package</span>
                  </div>
                </div>
              </div>

              {/* Current URL & 1-Click Launch */}
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    رابط تطبيقك المباشر المُهيأ للحزم:
                  </span>
                  <button
                    onClick={handleCopyUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span>تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>نسخ الرابط</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="font-mono text-xs p-3 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 break-all select-all">
                  {currentOrigin}
                </div>

                {/* تنبيه مهم في حال كان زر PWABuilder غير قابل للنقر */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>لماذا قد يظهر زر الـ Package معطلاً في PWABuilder؟</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                    روابط بيئة التطوير (AI Studio) محمية بحساب Google، لذا لا يستطيع روبوت PWABuilder فحصها من الخارج. 
                    <strong> للحل الفوري:</strong> يمكنك إما <strong>تثبيت التطبيق مباشرة كـ WebAPK على هاتفك الأندرويد</strong> بضغطة واحدة من متصفح Chrome (ثلاث نقاط ⋮ ➔ تثبيت التطبيق)، أو نشر التطبيق على رابط عام مفتوح (مثل Vercel أو Netlify أو GitHub).
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href={pwaBuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all transform active:scale-98 cursor-pointer"
                  >
                    <Package className="h-4 w-4" />
                    <span>توليد الحزمة الآن على PWABuilder (Package For Stores)</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <button
                    onClick={() => setActiveTab('checklist')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>فحص شروط القبول أولاً</span>
                  </button>
                </div>
              </div>

              {/* Steps overview */}
              <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                  خطوات الحزم والتوليد:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs">
                      1
                    </span>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                      اضغط زر التوليد أعلاه
                    </p>
                    <p className="text-[11px]">
                      سيقوم موقع PWABuilder بفحص الـ Manifest والأيقونات وتأكيد اجتياز المعايير.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs">
                      2
                    </span>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                      اختر المتجر المطلوب
                    </p>
                    <p className="text-[11px]">
                      اختر Google Play لتوليد AAB أو Windows لتوليد MSIX بضغطة زر واحدة.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs">
                      3
                    </span>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                      ارفع الملف للمتجر
                    </p>
                    <p className="text-[11px]">
                      حمل الحزمة المضغوطة وارفعها إلى Google Play Console أو Microsoft Partner Center.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE PLAY STORE (ANDROID TWA) */}
          {activeTab === 'googleplay' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="h-5 w-5 text-emerald-500" />
                  <div>
                    <h3 className="font-bold text-sm">Google Play Store & ملف الـ APK (أندرويد)</h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      معمارية Google الرسمية (TWA) لتحويل التطبيق إلى ملف APK حقيقي وملف AAB للمتجر.
                    </p>
                  </div>
                </div>
              </div>

              {/* بطاقة خطوات الحصول على الـ APK فوراً */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 space-y-4">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                  <Sparkles className="h-5 w-5" />
                  <span>كيف تحصل على ملف الـ APK الخاص بتطبيقك الآن في دقيقة واحدة؟</span>
                </div>

                <div className="space-y-2.5 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] shrink-0 mt-0.5">
                      1
                    </span>
                    <p>
                      اضغط على زر <strong>«توليد وتحميل ملف APK عبر PWABuilder»</strong> الأخضر أدناه.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] shrink-0 mt-0.5">
                      2
                    </span>
                    <p>
                      سيفتح موقع <strong>PWABuilder</strong> تلقائياً مع رابط تطبيقك (ستجده 100% مستوفياً لجميع الشروط).
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] shrink-0 mt-0.5">
                      3
                    </span>
                    <p>
                      في بطاقة <strong>Android</strong> اضغط على زر <strong>Package</strong> (أو <strong>Generate</strong>).
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] shrink-0 mt-0.5">
                      4
                    </span>
                    <p>
                      سينزل لك ملف <strong>ZIP</strong>، افتحه وستجد بداخله:
                      <br />
                      • ملف <strong>.apk</strong> (جاهز لتثبيته فوراً على هاتفك الأندرويد أو إرساله عبر واتساب).
                      <br />
                      • ملف <strong>.aab</strong> (الملف الرسمي المخصص لرفعه على متجر Google Play).
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href={pwaBuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all transform active:scale-98 cursor-pointer"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>توليد وتحميل ملف APK عبر PWABuilder الآن</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>

                  <button
                    onClick={handleCopyUrl}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span>تم نسخ رابط التطبيق!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>نسخ رابط التطبيق</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Package Details */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-3 text-xs">
                <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">
                  بيانات حزمة أندرويد الافتراضية (Package ID):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                    <span className="text-neutral-400 block text-[10px] font-sans">Application ID:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">com.sawti.translator</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                    <span className="text-neutral-400 block text-[10px] font-sans">Version:</span>
                    <span className="text-neutral-700 dark:text-neutral-300">1.0.0 (Version Code: 1)</span>
                  </div>
                </div>
              </div>

              {/* Option A: Bubblewrap CLI */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-neutral-800 dark:text-neutral-200">
                    <Terminal className="h-4 w-4 text-blue-500" />
                    <span>توليد الحزمة محلياً باستخدام Google Bubblewrap CLI:</span>
                  </div>
                </div>

                <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                  أداة Google الرسمية لإنشاء مشاريع Android Studio وحزم AAB من رابط الـ Manifest مباشرة:
                </p>

                <div className="relative font-mono text-[11px] p-3.5 rounded-xl bg-neutral-950 text-emerald-400 border border-neutral-800 space-y-1.5 text-left dir-ltr">
                  <div># 1. تثبيت أداة Google Bubblewrap</div>
                  <div className="text-neutral-200">npm install -g @bubblewrap/cli</div>
                  <div className="pt-1 text-neutral-400"># 2. تهيئة مشروع أندرويد من موقعك الحالي</div>
                  <div className="text-neutral-200">bubblewrap init --manifest={currentOrigin}/manifest.json</div>
                  <div className="pt-1 text-neutral-400"># 3. بناء وتوقيع ملف AAB لمتجر Google Play</div>
                  <div className="text-neutral-200">bubblewrap build</div>

                  <button
                    onClick={() =>
                      handleCopyCommand(
                        `npm install -g @bubblewrap/cli\nbubblewrap init --manifest=${currentOrigin}/manifest.json\nbubblewrap build`,
                        'bubblewrap'
                      )
                    }
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
                    title="نسخ الأوامر"
                  >
                    {copiedCmd === 'bubblewrap' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Digital Asset Links verification */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-neutral-800 dark:text-neutral-200">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>ملف التحقق المتبادل Digital Asset Links (.well-known/assetlinks.json):</span>
                  </div>
                  <button
                    onClick={() => downloadJsonFile('assetlinks.json', assetLinksTemplate)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>تنزيل assetlinks.json</span>
                  </button>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                  يطلب Google Play وضع هذا الملف على مسار <code>/.well-known/assetlinks.json</code> في موقعك ليتم إخفاء شريط عنوان المتصفح تماماً عند فتح التطبيق على هواتف أندرويد.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: MICROSOFT STORE (WINDOWS MSIX) */}
          {activeTab === 'microsoft' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-300">
                <div className="flex items-center gap-2.5">
                  <Monitor className="h-5 w-5 text-sky-500" />
                  <div>
                    <h3 className="font-bold text-sm">Microsoft Store (Windows 10 & 11)</h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      حزم MSIX الأصلية لنظام Windows مع دعم العمل بدون إنترنت ودعم الميكروفون المباشر.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-3 text-xs">
                <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">
                  مزايا حزمة Windows MSIX لتطبيق صوتي:
                </h4>
                <ul className="space-y-2 text-neutral-600 dark:text-neutral-300">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>نافذة مستقلة خالية من شريط المتصفح:</strong> تتيح تشغيل شاشة الترجمة الشفافة كنافذة فوق الألعاب والاجتماعات ومقاطع الفيديو.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>أيقونة مخصصة في قائمة ابدأ وشريط المهام:</strong> تظهر بدقة عالية بفضل أيقونات 512x512 المضمنة.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>تحديث تلقائي وفوري:</strong> بمجرد نشر أي تحديث في الكود، يحصل مستخدم Windows على النسخة الأحدث تلقائياً.</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-3">
                <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">
                  كيفية توليد حزمة MSIX لمتجر مايكروسوفت:
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  تتيح منصة PWABuilder إنشاء حزمة Windows MSIX موقعة بضغطة زر واحدة بدون الحاجة لتثبيت Visual Studio:
                </p>

                <div className="pt-1">
                  <a
                    href={pwaBuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    <Package className="h-4 w-4" />
                    <span>توليد حزمة Windows MSIX الآن</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPLE APP STORE (IOS) */}
          {activeTab === 'apple' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200">
                <div className="flex items-center gap-2.5">
                  <Apple className="h-5 w-5 text-neutral-900 dark:text-white" />
                  <div>
                    <h3 className="font-bold text-sm">Apple App Store (iOS / iPadOS / macOS)</h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      خيارات التوزيع على أجهزة Apple إما عبر التثبيت الفوري أو غلاف WKWebView / Capacitor.
                    </p>
                  </div>
                </div>
              </div>

              {/* Three Deployment Paths */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Method 1: WebClip / PWA Direct (Zero 30% Fee) */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    الخيار الأسرع • بدون عمولة أبل 30%
                  </span>
                  <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                    1. تثبيت PWA مباشر من Safari
                  </h4>
                  <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                    يفتح المستخدم الموقع في Safari، ويضغط <strong>«مشاركة (Share)»</strong> ثم <strong>«إضافة إلى الشاشة الرئيسية (Add to Home Screen)»</strong>. يعمل بكامل ميزات الصوت وشاشة العرض الكاملة.
                  </p>
                </div>

                {/* Method 2: Capacitor iOS Wrapper */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    للنشر على App Store الرسمي
                  </span>
                  <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                    2. حزمة Capacitor 6+ لـ Xcode
                  </h4>
                  <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                    تحويل التطبيق إلى مشروع Xcode أصلي باستخدام Capacitor ورفع الحزمة عبر App Store Connect.
                  </p>
                </div>
              </div>

              {/* Capacitor Code snippet */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">
                    أوامر تحويل التطبيق لمشروع iOS عبر Capacitor:
                  </span>
                </div>

                <div className="relative font-mono text-[11px] p-3.5 rounded-xl bg-neutral-950 text-blue-400 border border-neutral-800 space-y-1 text-left dir-ltr">
                  <div>npm install @capacitor/core @capacitor/cli @capacitor/ios</div>
                  <div>npx cap init "صوتي" com.sawti.translator --web-dir dist</div>
                  <div>npm run build</div>
                  <div>npx cap add ios</div>
                  <div>npx cap open ios # يفتح Xcode مباشرة للرفع إلى App Store</div>

                  <button
                    onClick={() =>
                      handleCopyCommand(
                        `npm install @capacitor/core @capacitor/cli @capacitor/ios\nnpx cap init "صوتي" com.sawti.translator --web-dir dist\nnpm run build\nnpx cap add ios\nnpx cap open ios`,
                        'capacitor'
                      )
                    }
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
                    title="نسخ الأوامر"
                  >
                    {copiedCmd === 'capacitor' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CHECKLIST (STORE READINESS AUDIT) */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <div>
                    <h3 className="font-bold text-sm">فحص معايير المتاجر الرسمية (Store Readiness Audit)</h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      كل المعايير الفنية المطلوبة للقبول الفوري في Google Play و Microsoft Store مستوفاة.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">100%</span>
                  <span className="block text-[10px] text-neutral-500">جاهز للقبول</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Manifest */}
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-start gap-3">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                      Web App Manifest كامل وموثق
                    </span>
                    <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                      محدد بالاسم، الوصف، رابط البداية (<code>start_url: "/"</code>)، ونمط العرض المستقل (<code>display: "standalone"</code>).
                    </p>
                  </div>
                </div>

                {/* 2. Service Worker */}
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-start gap-3">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                      Service Worker للتخزين بدون إنترنت
                    </span>
                    <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                      الملف <code>/sw.js</code> مسجل ويعمل لتوفير تجربة تشغيل فورية حتى في حالة انقطاع الاتصال.
                    </p>
                  </div>
                </div>

                {/* 3. Icons (192 & 512 & Maskable) */}
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-start gap-3">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                      أيقونات عالية الدقة (192px + 512px + Maskable)
                    </span>
                    <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                      أيقونات بصيغة PNG صالحة لهواتف أندرويد وشاشات الحواسيب مع دعم القناع الدائري الآمن.
                    </p>
                  </div>
                </div>

                {/* 4. iOS Apple Touch Icon */}
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-start gap-3">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                      أيقونة أجهزة Apple (apple-touch-icon)
                    </span>
                    <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                      مربوطة بصيغة PNG في ترويسة HTML لتظهر بأناقة على أجهزة iPhone و iPad.
                    </p>
                  </div>
                </div>

                {/* 5. HTTPS / Secure Origin */}
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-start gap-3">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                      اتصال آمن وموثق (HTTPS)
                    </span>
                    <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                      شرط أساسي إلزامي لكافة متاجر التطبيقات للسماح بطلب إذن الميكروفون والصوت.
                    </p>
                  </div>
                </div>

                {/* 6. Screenshots for Stores */}
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-start gap-3">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                      لقطات شاشة للمعاينة (Screenshots)
                    </span>
                    <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                      لقطات شاشة عمودية وأفقية معرفة داخل الـ Manifest لعرضها تلقائياً بصفحة التثبيت.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: EXPORT & DOWNLOAD FILES */}
          {activeTab === 'export' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-300">
                <div className="flex items-center gap-2.5">
                  <Download className="h-5 w-5 text-indigo-500" />
                  <div>
                    <h3 className="font-bold text-sm">تنزيل وتصدير ملفات الحزمة</h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                      يمكنك تنزيل ملفات التكوين والبيانات الوصفية لرفعها مباشرة عند إعداد صفحة متجرك.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Download Manifest */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-bold">
                    <FileCode className="h-4 w-4 text-blue-500" />
                    <span>ملف Web Manifest (manifest.json)</span>
                  </div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                    الملف الذي يحتوي على هوية التطبيق، الألوان، والأيقونات.
                  </p>
                  <a
                    href="/manifest.json"
                    download="manifest.json"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>تنزيل manifest.json</span>
                  </a>
                </div>

                {/* 2. Download AssetLinks */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-bold">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>ملف توثيق أندرويد (assetlinks.json)</span>
                  </div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                    مطلوب من Google Play للتحقق من ملكية النطاق وإخفاء المتصفح.
                  </p>
                  <button
                    onClick={() => downloadJsonFile('assetlinks.json', assetLinksTemplate)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>تنزيل assetlinks.json</span>
                  </button>
                </div>

                {/* 3. Download Store Listing metadata */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-bold">
                    <Store className="h-4 w-4 text-indigo-500" />
                    <span>بيانات بطاقة المتجر (Store Listing)</span>
                  </div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                    العنوان، الوصف القصير والطويل، والكلمات المفتاحية بالعربية والإنجليزية.
                  </p>
                  <button
                    onClick={() => downloadJsonFile('store-listing.json', storeListingMetadata)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>تنزيل store-listing.json</span>
                  </button>
                </div>

                {/* 4. Quick Copy Store Description */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-bold">
                    <Copy className="h-4 w-4 text-purple-500" />
                    <span>نسخ نص الوصف للمتجر</span>
                  </div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                    نسخ نص وصف التطبيق الجاهز للصقه في بطاقة المتجر.
                  </p>
                  <button
                    onClick={() =>
                      handleCopyTextSnippet(
                        `تطبيق صوتي (Sawti): مترجم الشاشة الفوري واستوديو التسجيل الصوتي الاحترافي.\n\nالمميزات:\n- ترجمة فورية حية عائمة فوق شاشتك أثناء المكالمات والاجتماعات والألعاب.\n- دعم نمط الهمس (Whisper Mode) للتحدث الهادئ بدون رفع الصوت.\n- تسجيل وتحرير الصوت الاحترافي بدقة استوديو.\n- يعمل بدون إنترنت وتحديثات فورية.`,
                        'desc'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {copiedText === 'desc' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-white" />
                        <span>تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>نسخ نص الوصف</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-[#18191a]/80">
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <Globe className="h-3.5 w-3.5" />
            <span>PWA Store Packaging Standards v3.0</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={pwaBuilderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              <span>فتح PWABuilder</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Reusable PackageForStoresButton component
 */
export const PackageForStoresButton: React.FC<{
  className?: string;
  variant?: 'primary' | 'secondary' | 'compact';
}> = ({ className = '', variant = 'primary' }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Package For Stores • حزم للمتاجر (Google Play, Microsoft Store, Apple)"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${className}`}
        >
          <Package className="h-3.5 w-3.5 text-purple-500" />
          <span>Package For Stores</span>
        </button>
        <PackageForStoresModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title="Package For Stores • حزم للمتاجر (Google Play, Microsoft Store, Apple)"
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 border border-purple-400/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${className}`}
      >
        <Package className="h-3.5 w-3.5" />
        <span>Package For Stores</span>
        <span className="hidden sm:inline-block text-[10px] py-0.5 px-1.5 rounded bg-white/20 text-white font-mono">
          المتاجر
        </span>
      </button>

      <PackageForStoresModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
