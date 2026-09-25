import React, { useState } from 'react';
import {
  Play,
  Type,
  Mic,
  Languages,
  Layers,
  Fingerprint,
  Trash2,
  Check,
  Crosshair,
  Sparkles,
  WholeWord,
  Package,
  Download,
} from 'lucide-react';
import { OverlayTranslatorConfig, VoiceprintProfile } from '../types/audio';
import { enrollVoiceprint } from '../utils/voiceprint';
import { PWAInstallButton } from './PWAInstallButton';
import { PackageForStoresButton } from './PackageForStoresModal';

interface OverlayTranslatorSettingsProps {
  config: OverlayTranslatorConfig;
  onSaveConfig: (updated: OverlayTranslatorConfig) => void;
  onLaunchOverlay: () => void;
}

export const OverlayTranslatorSettings: React.FC<OverlayTranslatorSettingsProps> = ({
  config,
  onSaveConfig,
  onLaunchOverlay,
}) => {
  // Voiceprint enrollment state
  const [isEnrollingVoice, setIsEnrollingVoice] = useState(false);
  const [enrollProgress, setEnrollProgress] = useState(0);
  const [enrollSuccess, setEnrollSuccess] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const updateConfig = (patch: Partial<OverlayTranslatorConfig>) => {
    onSaveConfig({ ...config, ...patch });
  };

  // Handle Voiceprint Enrollment
  const handleEnrollVoice = async () => {
    setIsEnrollingVoice(true);
    setEnrollProgress(0);
    setEnrollError(null);
    setEnrollSuccess(false);

    let activeStream: MediaStream | null = null;
    try {
      activeStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false },
      });

      const profile = await enrollVoiceprint(activeStream, 4, (pct) => {
        setEnrollProgress(pct);
      });

      updateConfig({ voiceprint: profile });
      setEnrollSuccess(true);
      setTimeout(() => setEnrollSuccess(false), 3000);
    } catch (err: any) {
      console.warn('Voiceprint error:', err);
      setEnrollError(
        err.name === 'NotAllowedError'
          ? 'تم رفض إذن الميكروفون'
          : 'تعذر التسجيل، يرجى التحدث بوضوح وإعادة المحاولة'
      );
    } finally {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => {
          try {
            t.stop();
            t.enabled = false;
          } catch {}
        });
      }
      setIsEnrollingVoice(false);
    }
  };

  const handleRemoveVoiceprint = () => {
    updateConfig({ voiceprint: undefined });
  };

  // Center coordinates preset
  const handleCenterCoordinates = () => {
    const x = Math.round(window.innerWidth / 2);
    const y = Math.round(window.innerHeight - 120);
    updateConfig({ customCoords: { x, y } });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#18191a] text-[#202124] dark:text-[#e8eaed] font-sans transition-colors py-8 px-4 flex justify-center items-start">
      <div className="w-full max-w-xl space-y-6">
        {/* Top: Google Header & Single Launch Button */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap px-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              <span>مترجم الشاشة الفوري الشخصي</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="/download-android-project"
                download="sawti-android-project.zip"
                title="تحميل مشروع أندرويد الأصلي مع مسار بناء APK التلقائي"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                <span>تحميل مشروع أندرويد (ZIP)</span>
              </a>
              <PackageForStoresButton />
              <PWAInstallButton />
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#202124] dark:text-[#f1f3f4]">
            إعدادات الترجمة الفورية
          </h1>

          {/* 1. زر تشغيل الترجمة الفورية واحد في الأعلى فقط */}
          <div className="pt-1">
            <button
              onClick={onLaunchOverlay}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full text-white font-semibold text-base bg-[#1a73e8] hover:bg-[#1557b0] active:bg-[#174ea6] shadow-md hover:shadow-lg transition-all transform active:scale-98 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>تشغيل الترجمة الفورية</span>
            </button>
          </div>
        </div>

        {/* 2. إعدادات الخط */}
        <section className="bg-white dark:bg-[#242526] rounded-3xl p-5 border border-[#dadce0] dark:border-[#3a3b3c] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#f1f3f4] dark:border-[#3a3b3c] pb-2.5">
            <Type className="h-4 w-4 text-[#1a73e8] dark:text-[#8ab4f8]" />
            <h2 className="text-sm font-bold text-[#202124] dark:text-[#f1f3f4]">إعدادات الخط</h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* لون الخط (اسود، ابيض، رمادي) فقط */}
            <div className="space-y-1.5">
              <label className="font-medium text-[#5f6368] dark:text-[#9aa0a6] block">
                لون الخط:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'أبيض', hex: '#ffffff', border: 'border-neutral-300 dark:border-neutral-600' },
                  { label: 'أسود', hex: '#000000', border: 'border-neutral-800' },
                  { label: 'رمادي', hex: '#9ca3af', border: 'border-neutral-400' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => updateConfig({ textColor: c.hex as any })}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                      config.textColor.toLowerCase() === c.hex.toLowerCase()
                        ? 'border-[#1a73e8] bg-blue-50/60 dark:bg-blue-950/40 text-[#1a73e8] dark:text-[#8ab4f8] shadow-xs'
                        : 'border-[#dadce0] dark:border-[#3a3b3c] bg-white dark:bg-[#2d2e30] text-[#3c4043] dark:text-[#bdc1c6] hover:bg-neutral-50 dark:hover:bg-[#343537]'
                    }`}
                  >
                    <span
                      className={`h-3.5 w-3.5 rounded-full border ${c.border}`}
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* حجم الخط (من 1 الى 30) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-medium text-[#5f6368] dark:text-[#9aa0a6]">
                  حجم الخط (من 1 إلى 30):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={config.fontSize}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(30, Number(e.target.value) || 1));
                      updateConfig({ fontSize: val });
                    }}
                    className="w-14 text-center font-bold px-1.5 py-0.5 rounded-lg border border-[#dadce0] dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-[#202124] dark:text-[#f1f3f4]"
                  />
                  <span className="text-[11px] text-neutral-400">نقطة</span>
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={config.fontSize}
                onChange={(e) => updateConfig({ fontSize: Number(e.target.value) })}
                className="w-full accent-[#1a73e8] cursor-pointer"
              />
            </div>

            {/* شفافية خط الترجمة */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-medium text-[#5f6368] dark:text-[#9aa0a6]">
                  شفافية خط الترجمة:
                </label>
                <span className="font-bold text-[#202124] dark:text-[#f1f3f4]">
                  {config.fontOpacity}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={config.fontOpacity}
                onChange={(e) => updateConfig({ fontOpacity: Number(e.target.value) })}
                className="w-full accent-[#1a73e8] cursor-pointer"
              />
            </div>

            {/* مدة ظهور الترجمة على الشاشة مع أزرار سريعة */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-medium text-[#5f6368] dark:text-[#9aa0a6]">
                  مدة ظهور الترجمة على الشاشة:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0.3}
                    max={15}
                    step={0.1}
                    value={config.displayDuration}
                    onChange={(e) => {
                      const val = Math.max(0.3, Math.min(15, parseFloat(e.target.value) || 0.3));
                      updateConfig({ displayDuration: Number(val.toFixed(1)) });
                    }}
                    className="w-16 text-center font-bold px-1.5 py-0.5 rounded-lg border border-[#dadce0] dark:border-[#3a3b3c] bg-white dark:bg-[#18191a] text-[#202124] dark:text-[#f1f3f4]"
                  />
                  <span className="text-[11px] text-neutral-400">ثانية</span>
                </div>
              </div>

              {/* أزرار سريعة لاختيار المدة (بما فيها ثانية وأقل لتقليب الكلمات بسرعة) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: '0.5 ثانية (سريعة للكلمات)', value: 0.5 },
                  { label: '1 ثانية', value: 1 },
                  { label: '2 ثانية', value: 2 },
                  { label: '3 ثوانٍ', value: 3 },
                  { label: '5 ثوانٍ', value: 5 },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => updateConfig({ displayDuration: item.value })}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      Math.abs(config.displayDuration - item.value) < 0.05
                        ? 'border-[#1a73e8] bg-blue-50 dark:bg-blue-950/50 text-[#1a73e8] dark:text-[#8ab4f8] shadow-xs'
                        : 'border-[#dadce0] dark:border-[#3a3b3c] bg-[#f8f9fa] dark:bg-[#18191a] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-neutral-100 dark:hover:bg-[#2d2e30]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <input
                type="range"
                min={0.3}
                max={10}
                step={0.1}
                value={config.displayDuration}
                onChange={(e) =>
                  updateConfig({ displayDuration: Number(parseFloat(e.target.value).toFixed(1)) })
                }
                className="w-full accent-[#1a73e8] cursor-pointer"
              />
            </div>

            {/* مكان الظهور: احداثيات في الشاشة انا بكتبها */}
            <div className="space-y-1.5 pt-1 border-t border-[#f1f3f4] dark:border-[#3a3b3c] pt-3">
              <div className="flex items-center justify-between">
                <label className="font-medium text-[#5f6368] dark:text-[#9aa0a6]">
                  مكان الظهور (إحداثيات الشاشة بالبكسل):
                </label>
                <button
                  type="button"
                  onClick={handleCenterCoordinates}
                  className="inline-flex items-center gap-1 text-[11px] text-[#1a73e8] dark:text-[#8ab4f8] hover:underline cursor-pointer"
                  title="وضع النص تلقائياً في أسفل منتصف الشاشة"
                >
                  <Crosshair className="h-3 w-3" />
                  <span>توسيط تلقائي</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-[#f8f9fa] dark:bg-[#1f2022] border border-[#dadce0] dark:border-[#3a3b3c]">
                  <span className="font-mono text-neutral-400 text-xs font-bold">X (أفقي):</span>
                  <input
                    type="number"
                    value={config.customCoords?.x ?? 500}
                    onChange={(e) =>
                      updateConfig({
                        position: 'custom',
                        customCoords: {
                          x: Number(e.target.value) || 0,
                          y: config.customCoords?.y ?? 600,
                        },
                      })
                    }
                    className="w-full text-sm font-bold bg-transparent border-none focus:outline-none text-[#202124] dark:text-[#f1f3f4]"
                    placeholder="مثال: 500"
                  />
                  <span className="text-[10px] text-neutral-400">px</span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-[#f8f9fa] dark:bg-[#1f2022] border border-[#dadce0] dark:border-[#3a3b3c]">
                  <span className="font-mono text-neutral-400 text-xs font-bold">Y (عمودي):</span>
                  <input
                    type="number"
                    value={config.customCoords?.y ?? 600}
                    onChange={(e) =>
                      updateConfig({
                        position: 'custom',
                        customCoords: {
                          x: config.customCoords?.x ?? 500,
                          y: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full text-sm font-bold bg-transparent border-none focus:outline-none text-[#202124] dark:text-[#f1f3f4]"
                    placeholder="مثال: 600"
                  />
                  <span className="text-[10px] text-neutral-400">px</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. نوع الترجمة: كلمات أو جمل (صغيرة وخفيفة بدون تفاصيل كبيرة) */}
        <section className="bg-white dark:bg-[#242526] rounded-3xl p-4 border border-[#dadce0] dark:border-[#3a3b3c] shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WholeWord className="h-4 w-4 text-[#1a73e8] dark:text-[#8ab4f8]" />
              <span className="text-xs font-bold text-[#202124] dark:text-[#f1f3f4]">
                نوع الترجمة:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  updateConfig({
                    translationMode: 'words',
                    displayDuration: 1, // الديفولت للكلمات ثانية واحدة
                  })
                }
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  config.translationMode === 'words'
                    ? 'border-[#1a73e8] bg-blue-50 dark:bg-blue-950/50 text-[#1a73e8] dark:text-[#8ab4f8] shadow-xs'
                    : 'border-[#dadce0] dark:border-[#3a3b3c] bg-[#f8f9fa] dark:bg-[#18191a] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-neutral-100 dark:hover:bg-[#2d2e30]'
                }`}
              >
                كلمات
              </button>

              <button
                type="button"
                onClick={() =>
                  updateConfig({
                    translationMode: 'sentences',
                    displayDuration: 3, // الديفولت للجمل 3 ثوانٍ
                  })
                }
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  config.translationMode !== 'words'
                    ? 'border-[#1a73e8] bg-blue-50 dark:bg-blue-950/50 text-[#1a73e8] dark:text-[#8ab4f8] shadow-xs'
                    : 'border-[#dadce0] dark:border-[#3a3b3c] bg-[#f8f9fa] dark:bg-[#18191a] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-neutral-100 dark:hover:bg-[#2d2e30]'
                }`}
              >
                جمل
              </button>
            </div>
          </div>
        </section>

        {/* 4. إعدادات الصوت (صغيرة ومضغوطة: سطر العنوان، سطر درجة الصوت، سطر بصمة الصوت) */}
        <section className="bg-white dark:bg-[#242526] rounded-3xl p-4 border border-[#dadce0] dark:border-[#3a3b3c] shadow-sm space-y-3">
          {/* سطر العنوان */}
          <div className="flex items-center gap-2 border-b border-[#f1f3f4] dark:border-[#3a3b3c] pb-2">
            <Mic className="h-4 w-4 text-[#1a73e8] dark:text-[#8ab4f8]" />
            <h2 className="text-xs font-bold text-[#202124] dark:text-[#f1f3f4]">إعدادات الصوت</h2>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* سطر درجة الصوت */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#5f6368] dark:text-[#9aa0a6]">
                درجة الصوت:
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = !config.voiceModeWhisper;
                    if (!next && !config.voiceModeNormal) return;
                    updateConfig({ voiceModeWhisper: next });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    config.voiceModeWhisper
                      ? 'border-[#1a73e8] bg-blue-50 dark:bg-blue-950/50 text-[#1a73e8] dark:text-[#8ab4f8] shadow-xs'
                      : 'border-[#dadce0] dark:border-[#3a3b3c] bg-[#f8f9fa] dark:bg-[#18191a] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-neutral-100 dark:hover:bg-[#2d2e30]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      config.voiceModeWhisper ? 'bg-[#1a73e8] dark:bg-[#8ab4f8]' : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                  />
                  همس
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = !config.voiceModeNormal;
                    if (!next && !config.voiceModeWhisper) return;
                    updateConfig({ voiceModeNormal: next });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    config.voiceModeNormal
                      ? 'border-[#1a73e8] bg-blue-50 dark:bg-blue-950/50 text-[#1a73e8] dark:text-[#8ab4f8] shadow-xs'
                      : 'border-[#dadce0] dark:border-[#3a3b3c] bg-[#f8f9fa] dark:bg-[#18191a] text-[#5f6368] dark:text-[#9aa0a6] hover:bg-neutral-100 dark:hover:bg-[#2d2e30]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      config.voiceModeNormal ? 'bg-[#1a73e8] dark:bg-[#8ab4f8]' : 'bg-neutral-300 dark:bg-neutral-600'
                    }`}
                  />
                  عادي
                </button>
              </div>
            </div>

            {/* سطر بصمة الصوت */}
            <div className="flex items-center justify-between pt-1 border-t border-[#f1f3f4] dark:border-[#3a3b3c]">
              <span className="font-bold text-[#5f6368] dark:text-[#9aa0a6]">
                بصمة الصوت:
              </span>

              {config.voiceprint ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <Check className="h-3.5 w-3.5" />
                    مسجلة
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveVoiceprint}
                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                    title="حذف البصمة الصوتية"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isEnrollingVoice}
                  onClick={handleEnrollVoice}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dadce0] dark:border-[#3a3b3c] bg-[#f8f9fa] dark:bg-[#18191a] hover:bg-neutral-100 dark:hover:bg-[#2d2e30] text-xs font-bold text-[#202124] dark:text-[#f1f3f4] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Fingerprint className="h-3.5 w-3.5 text-[#1a73e8] dark:text-[#8ab4f8]" />
                  <span>
                    {isEnrollingVoice
                      ? `جاري التسجيل (${enrollProgress}%)`
                      : 'تسجيل البصمة (4 ثوانٍ)'}
                  </span>
                </button>
              )}
            </div>

            {/* شريط التقدم اللحظي أثناء التسجيل فقط */}
            {isEnrollingVoice && (
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#1a73e8] h-full transition-all duration-100"
                  style={{ width: `${enrollProgress}%` }}
                />
              </div>
            )}
            {enrollError && (
              <p className="text-[11px] text-rose-500 font-medium">{enrollError}</p>
            )}
          </div>
        </section>

        {/* 4. لغة التحدث */}
        <section className="bg-white dark:bg-[#242526] rounded-3xl p-5 border border-[#dadce0] dark:border-[#3a3b3c] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#f1f3f4] dark:border-[#3a3b3c] pb-2.5">
            <Languages className="h-4 w-4 text-[#1a73e8] dark:text-[#8ab4f8]" />
            <h2 className="text-sm font-bold text-[#202124] dark:text-[#f1f3f4]">لغة التحدث</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateConfig({ sourceLang: 'ar-SA', targetLang: 'en' })}
                className={`p-3.5 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                  config.sourceLang === 'ar-SA'
                    ? 'border-[#1a73e8] bg-blue-50/70 dark:bg-blue-950/40 text-[#1a73e8] dark:text-[#8ab4f8] shadow-xs'
                    : 'border-[#dadce0] dark:border-[#3a3b3c] bg-white dark:bg-[#2d2e30] text-[#3c4043] dark:text-[#bdc1c6] hover:bg-neutral-50 dark:hover:bg-[#343537]'
                }`}
              >
                <div className="text-base mb-1">🇸🇦</div>
                <div>العربية</div>
                <div className="text-[10px] text-neutral-400 font-normal mt-0.5">
                  (يترجم تلقائياً إلى الإنجليزية)
                </div>
              </button>

              <button
                type="button"
                onClick={() => updateConfig({ sourceLang: 'en-US', targetLang: 'ar' })}
                className={`p-3.5 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                  config.sourceLang === 'en-US'
                    ? 'border-[#1a73e8] bg-blue-50/70 dark:bg-blue-950/40 text-[#1a73e8] dark:text-[#8ab4f8] shadow-xs'
                    : 'border-[#dadce0] dark:border-[#3a3b3c] bg-white dark:bg-[#2d2e30] text-[#3c4043] dark:text-[#bdc1c6] hover:bg-neutral-50 dark:hover:bg-[#343537]'
                }`}
              >
                <div className="text-base mb-1">🇺🇸</div>
                <div>English</div>
                <div className="text-[10px] text-neutral-400 font-normal mt-0.5">
                  (يترجم تلقائياً إلى العربية)
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* 5. الخلفية: سوداء أو بلا خلفية */}
        <section className="bg-white dark:bg-[#242526] rounded-3xl p-5 border border-[#dadce0] dark:border-[#3a3b3c] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#f1f3f4] dark:border-[#3a3b3c] pb-2.5">
            <Layers className="h-4 w-4 text-[#1a73e8] dark:text-[#8ab4f8]" />
            <h2 className="text-sm font-bold text-[#202124] dark:text-[#f1f3f4]">خلفية الشاشة</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => updateConfig({ hasBackground: false, bgOpacity: 0 })}
              className={`p-3.5 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                !config.hasBackground
                  ? 'border-[#1a73e8] bg-blue-50/70 dark:bg-blue-950/40 text-[#1a73e8] dark:text-[#8ab4f8] shadow-xs'
                  : 'border-[#dadce0] dark:border-[#3a3b3c] bg-white dark:bg-[#2d2e30] text-[#3c4043] dark:text-[#bdc1c6] hover:bg-neutral-50 dark:hover:bg-[#343537]'
              }`}
            >
              <div className="text-sm font-bold">بلا خلفية</div>
              <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] font-normal mt-1">
                ستظهر الكلمات على الشاشة فلوتينج
              </div>
            </button>

            <button
              type="button"
              onClick={() => updateConfig({ hasBackground: true, bgOpacity: 100 })}
              className={`p-3.5 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                config.hasBackground
                  ? 'border-[#1a73e8] bg-blue-50/70 dark:bg-blue-950/40 text-[#1a73e8] dark:text-[#8ab4f8] shadow-xs'
                  : 'border-[#dadce0] dark:border-[#3a3b3c] bg-white dark:bg-[#2d2e30] text-[#3c4043] dark:text-[#bdc1c6] hover:bg-neutral-50 dark:hover:bg-[#343537]'
              }`}
            >
              <div className="text-sm font-bold">خلفية سوداء</div>
              <div className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] font-normal mt-1">
                شاشة معتمة بالكامل
              </div>
            </button>
          </div>
        </section>

        {/* 6. بطاقة Package For Stores - حزم وتصدير التطبيق لمتاجر التطبيقات */}
        <section className="bg-gradient-to-br from-purple-900/10 via-indigo-900/10 to-blue-900/10 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 rounded-3xl p-5 border border-purple-500/25 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <h2 className="text-sm font-bold text-[#202124] dark:text-[#f1f3f4]">
                حزم وتصدير للمتاجر (Package For Stores)
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              جاهز 100%
            </span>
          </div>

          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
            تجهيز وتوليد حزم التوزيع لمتاجر <strong>Google Play</strong> (أندرويد AAB/APK عبر TWA)، و <strong>Microsoft Store</strong> (حزمة Windows MSIX)، و <strong>Apple App Store</strong> (iOS عبر Capacitor أو تثبيت Safari الفوري).
          </p>

          <div className="pt-1 flex items-center justify-between gap-3 flex-wrap">
            <PackageForStoresButton />
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
              ⚡ توليد مباشر عبر PWABuilder أو Bubblewrap CLI
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};
