import React, { useState } from 'react';
import { Download, Monitor, CheckCircle, X, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already running as an installed desktop/standalone app, show a subtle badge or hide
  if (isInstalled) {
    return (
      <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
        <CheckCircle className="h-3.5 w-3.5" />
        <span>تطبيق مثبت</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="تثبيت التطبيق على سطح المكتب"
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 border border-blue-400/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
      >
        <Monitor className="h-3.5 w-3.5" />
        <span>تثبيت على سطح المكتب</span>
        <Download className="h-3.5 w-3.5" />
      </button>

      {/* مودال إرشادات التثبيت على سطح المكتب والجوال */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#1e1f20] border border-[#dadce0] dark:border-[#3a3b3c] rounded-3xl p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-[#f1f3f4] dark:border-[#2d2e30] pb-3">
              <div className="flex items-center gap-2 text-[#1a73e8] dark:text-[#8ab4f8]">
                <Monitor className="h-5 w-5" />
                <h3 className="font-bold text-sm text-[#202124] dark:text-[#f1f3f4]">
                  تثبيت التطبيق على سطح المكتب
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#3c4043] dark:text-[#bdc1c6] leading-relaxed">
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                يمكنك تشغيل تطبيق «صوتي» كنافذة مستقلة وسريعة على سطح مكتبك (Windows / Mac / Linux) كأي برنامج عادي:
              </p>

              {/* خطوات كروم أو إيدج على الكمبيوتر */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#1a73e8] dark:text-[#8ab4f8]">
                  <Download className="h-4 w-4" />
                  <span>طريقة التثبيت على متصفح Chrome أو Edge:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] pr-1">
                  <li>
                    انظر إلى <strong>شريط عنوان المتصفح في الأعلى</strong> (جهة اليمين أو اليسار).
                  </li>
                  <li>
                    ستجد أيقونة تثبيت صغيرة شكلها <strong>(شاشة مع سهم لأسفل ⤓ أو علامة +)</strong>.
                  </li>
                  <li>
                    أو اضغط على <strong>القائمة (ثلاث نقاط ⋮)</strong> بأعلى المتصفح ➔ اختر <strong>«تثبيت صوتي... / Install App»</strong> أو <strong>«حفظ ومشاركة ➔ إنشاء اختصار»</strong> مع تفعيل <i>فتح كنافذة مستقلة</i>.
                  </li>
                </ol>
              </div>

              {isIOS && (
                <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 space-y-1 text-[11px]">
                  <strong className="block text-neutral-700 dark:text-neutral-300">لأجهزة iPhone / iPad:</strong>
                  <span>اضغط زر <strong>مشاركة (Share)</strong> في متصفح Safari، ثم اختر <strong>«إضافة إلى الصفحة الرئيسية (Add to Home Screen)»</strong>.</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs transition-colors cursor-pointer"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
