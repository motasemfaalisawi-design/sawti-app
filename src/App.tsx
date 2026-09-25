/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { OverlayTranslatorSettings } from './components/OverlayTranslatorSettings';
import { TransparentOverlayScreen } from './components/TransparentOverlayScreen';
import { OverlayTranslatorConfig, OverlayHistoryItem } from './types/audio';
import { stopAllAudioHardware } from './utils/audioHardware';

const DEFAULT_OVERLAY_CONFIG: OverlayTranslatorConfig = {
  textColor: '#ffffff', // أبيض (خيارات: أبيض، أسود، رمادي)
  fontSize: 20, // من 1 إلى 30
  fontOpacity: 100, // 0 - 100%
  hasBackground: false, // بلا خلفية (ستظهر الكلمات على الشاشة فلوتينج)
  bgOpacity: 0,
  displayDuration: 3, // مدة ظهور الكلام بالثواني
  position: 'custom',
  customCoords: {
    x: typeof window !== 'undefined' ? Math.round(window.innerWidth / 2) : 500,
    y: typeof window !== 'undefined' ? Math.round(window.innerHeight - 100) : 600,
  },
  translationMode: 'sentences', // كلمات أو جمل
  voiceModeWhisper: true, // تشك بوكس همس
  voiceModeNormal: true, // تشك بوكس عادي
  sourceLang: 'ar-SA', // لغة التحدث: عربي (والترجمة تلقائياً انجليزي)
  targetLang: 'en',
  clickThrough: true,
  textOutline: true,
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'settings' | 'overlay'>('settings');

  // Overlay Translator Configuration
  const [overlayConfig, setOverlayConfig] = useState<OverlayTranslatorConfig>(() => {
    try {
      const stored = localStorage.getItem('sawti_overlay_config_v2');
      if (stored) {
        return { ...DEFAULT_OVERLAY_CONFIG, ...JSON.parse(stored) };
      }
      return DEFAULT_OVERLAY_CONFIG;
    } catch {
      return DEFAULT_OVERLAY_CONFIG;
    }
  });

  const handleSaveOverlayConfig = (updated: OverlayTranslatorConfig) => {
    setOverlayConfig(updated);
    localStorage.setItem('sawti_overlay_config_v2', JSON.stringify(updated));
  };

  // Set page direction for Arabic Google UI
  useEffect(() => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
  }, []);

  // When on settings screen, ensure all mic hardware & recognition are 100% stopped
  useEffect(() => {
    if (currentScreen === 'settings') {
      stopAllAudioHardware();
    }
  }, [currentScreen]);

  if (currentScreen === 'overlay') {
    return (
      <TransparentOverlayScreen
        config={overlayConfig}
        onOpenSettings={() => setCurrentScreen('settings')}
        onCloseOverlay={() => setCurrentScreen('settings')}
      />
    );
  }

  return (
    <OverlayTranslatorSettings
      config={overlayConfig}
      onSaveConfig={handleSaveOverlayConfig}
      onLaunchOverlay={() => setCurrentScreen('overlay')}
    />
  );
}
