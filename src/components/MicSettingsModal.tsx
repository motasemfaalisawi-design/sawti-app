import React, { useState, useEffect } from 'react';
import { X, Mic, Sliders, Volume2, ShieldCheck, Check } from 'lucide-react';
import { RecordingSettings, Language } from '../types/audio';
import { translations } from '../utils/i18n';

interface MicSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RecordingSettings;
  onSaveSettings: (settings: RecordingSettings) => void;
  lang: Language;
}

export const MicSettingsModal: React.FC<MicSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  lang,
}) => {
  const t = translations[lang];
  const [currentSettings, setCurrentSettings] = useState<RecordingSettings>(settings);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  // Enumerate Audio Devices
  useEffect(() => {
    if (!isOpen) return;

    async function loadDevices() {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices.filter((d) => d.kind === 'audioinput');
        setDevices(audioInputs);
      } catch (err) {
        console.warn('Cannot enumerate audio devices:', err);
      }
    }
    loadDevices();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(currentSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-semibold">{t.micSettings}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-5 space-y-4">
          {/* Device Selection */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              {t.selectMic}
            </label>
            <div className="relative">
              <select
                value={currentSettings.deviceId}
                onChange={(e) =>
                  setCurrentSettings((prev) => ({ ...prev, deviceId: e.target.value }))
                }
                className="w-full appearance-none rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-neutral-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="">{t.deviceDefault}</option>
                {devices.map((device, index) => (
                  <option key={device.deviceId || index} value={device.deviceId}>
                    {device.label || `${t.selectMic} ${index + 1}`}
                  </option>
                ))}
              </select>
              <Mic className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-neutral-500 rtl:right-auto rtl:left-3" />
            </div>
          </div>

          {/* Audio Filters (Toggles) */}
          <div className="space-y-3 pt-2">
            {/* Noise Suppression */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-950 cursor-pointer transition-colors">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-neutral-200">{t.noiseSuppression}</span>
                <p className="text-xs text-neutral-500">
                  {lang === 'ar' ? 'فلترة أصوات المراوح والمكيفات والضجيج' : 'Filters background ambient rumble and hum'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={currentSettings.noiseSuppression}
                onChange={(e) =>
                  setCurrentSettings((prev) => ({ ...prev, noiseSuppression: e.target.checked }))
                }
                className="h-4 w-4 rounded border-neutral-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-neutral-900 accent-amber-500"
              />
            </label>

            {/* Echo Cancellation */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-950 cursor-pointer transition-colors">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-neutral-200">{t.echoCancellation}</span>
                <p className="text-xs text-neutral-500">
                  {lang === 'ar' ? 'منع ارتداد وتكرار الصوت في الغرفة' : 'Prevents room acoustic bounce and feedback'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={currentSettings.echoCancellation}
                onChange={(e) =>
                  setCurrentSettings((prev) => ({ ...prev, echoCancellation: e.target.checked }))
                }
                className="h-4 w-4 rounded border-neutral-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-neutral-900 accent-amber-500"
              />
            </label>

            {/* Auto Gain Control */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-950 cursor-pointer transition-colors">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-neutral-200">{t.autoGainControl}</span>
                <p className="text-xs text-neutral-500">
                  {lang === 'ar' ? 'تعديل علو الصوت تلقائياً عند الابتعاد أو الاقتراب' : 'Automatically regulates microphone volume levels'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={currentSettings.autoGainControl}
                onChange={(e) =>
                  setCurrentSettings((prev) => ({ ...prev, autoGainControl: e.target.checked }))
                }
                className="h-4 w-4 rounded border-neutral-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-neutral-900 accent-amber-500"
              />
            </label>

            {/* Live Monitoring (Headphones) */}
            <label className="flex items-center justify-between p-3 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-950 cursor-pointer transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="h-4 w-4 text-sky-400" />
                  <span className="text-sm font-medium text-neutral-200">{t.monitoringHeadphones}</span>
                </div>
                <p className="text-xs text-neutral-500">{t.monitoringDesc}</p>
              </div>
              <input
                type="checkbox"
                checked={currentSettings.monitoring}
                onChange={(e) =>
                  setCurrentSettings((prev) => ({ ...prev, monitoring: e.target.checked }))
                }
                className="h-4 w-4 rounded border-neutral-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-neutral-900 accent-amber-500"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
          >
            <Check className="h-4 w-4" />
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};
