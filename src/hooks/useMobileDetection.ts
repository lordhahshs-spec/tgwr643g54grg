import { useState, useEffect } from 'react';

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [hasDismissedInstall, setHasDismissedInstall] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cellhub_app_installed_or_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileDevice = mobileRegex.test(userAgent) || (typeof window !== 'undefined' && window.innerWidth < 768);
    const isAndroidDevice = /Android/i.test(userAgent);
    const isIOSDevice = /iPhone|iPad|iPod/i.test(userAgent);

    setIsMobile(isMobileDevice);
    setIsAndroid(isAndroidDevice);
    setIsIOS(isIOSDevice);

    // Detect if running in standalone PWA mode (already installed on homescreen)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isPWA);

    if (isPWA) {
      localStorage.setItem('cellhub_app_installed_or_dismissed', 'true');
      setHasDismissedInstall(true);
    }

    // Capture Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('cellhub_app_installed_or_dismissed', 'true');
        setHasDismissedInstall(true);
        setDeferredPrompt(null);
        return true;
      }
    }
    return false;
  };

  const dismissInstallPrompt = () => {
    localStorage.setItem('cellhub_app_installed_or_dismissed', 'true');
    setHasDismissedInstall(true);
  };

  return {
    isMobile,
    isAndroid,
    isIOS,
    isStandalone,
    canPromptNativeInstall: !!deferredPrompt,
    hasDismissedInstall,
    triggerInstall,
    dismissInstallPrompt,
  };
}
