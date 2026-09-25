import React from 'react';
import { Mic, Library, Moon, Sun, Globe, HardDrive, Languages, Sparkles } from 'lucide-react';
import { Language } from '../types/audio';
import { translations } from '../utils/i18n';
import { PackageForStoresButton } from './PackageForStoresModal';

export type AppTab = 'overlay-settings' | 'transparent-overlay' | 'studio' | 'library';

interface HeaderProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  lang: Language;
  onToggleLang: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  recordingsCount: number;
  totalSizeFormatted: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  recordingsCount,
  totalSizeFormatted,
}) => {
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md transition-colors dark:border-neutral-800 dark:bg-neutral-950/90 light:bg-white/90 light:border-neutral-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text wordmark with subtle acoustic accent */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-neutral-100 font-sans">
            {lang === 'ar' ? 'صوتي للترجمة' : 'Sawti Overlay'}
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-sky-400 border border-neutral-700">
            OVERLAY HUD
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {/* Primary Screen 1: Settings Screen */}
          <button
            onClick={() => onSelectTab('overlay-settings')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
              currentTab === 'overlay-settings'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Sparkles className="h-4 w-4 text-sky-400" />
            <span className="whitespace-nowrap">{lang === 'ar' ? 'شاشة الإعدادات' : 'Settings'}</span>
          </button>

          {/* Primary Screen 2: Transparent Live Subtitles */}
          <button
            onClick={() => onSelectTab('transparent-overlay')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer relative ${
              currentTab === 'transparent-overlay'
                ? 'bg-gradient-to-r from-sky-400 to-cyan-400 text-neutral-950 shadow-md shadow-sky-500/20'
                : 'text-sky-400 hover:bg-sky-500/10 border border-sky-500/20'
            }`}
          >
            <Languages className="h-4 w-4" />
            <span className="whitespace-nowrap">{lang === 'ar' ? 'شاشة الترجمة الشفافة' : 'Launch Overlay'}</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
          </button>

          {/* Studio Recorder */}
          <button
            onClick={() => onSelectTab('studio')}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-xl transition-colors ${
              currentTab === 'studio'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Mic className="h-4 w-4" />
            <span className="whitespace-nowrap">{t.studioRecorder}</span>
          </button>

          {/* Library */}
          <button
            onClick={() => onSelectTab('library')}
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-xl transition-colors ${
              currentTab === 'library'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Library className="h-4 w-4" />
            <span className="whitespace-nowrap">{t.library}</span>
            {recordingsCount > 0 && (
              <span className="text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                {recordingsCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Actions (Storage info, Language, Theme) */}
        <div className="flex items-center gap-2">
          {recordingsCount > 0 && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-neutral-400 px-2 py-1 rounded-md bg-neutral-900/80 border border-neutral-800 font-mono tabular-nums">
              <HardDrive className="h-3.5 w-3.5 text-neutral-500" />
              <span>{totalSizeFormatted}</span>
            </div>
          )}

          <PackageForStoresButton variant="compact" />

          {/* Language toggle */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors"
            title="تبديل اللغة / Switch Language"
            aria-label="Toggle language"
          >
            <Globe className="h-3.5 w-3.5 text-neutral-400" />
            <span className="font-sans font-semibold">{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 rounded-md transition-colors"
            title="تبديل المظهر"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
