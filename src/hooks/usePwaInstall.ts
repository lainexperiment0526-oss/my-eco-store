import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export const usePwaInstall = () => {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const isIos = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }, []);

  useEffect(() => {
    const checkInstalled = () => {
      const standaloneMatch = window.matchMedia?.('(display-mode: standalone)')?.matches;
      const iosStandalone = (navigator as any).standalone === true;
      setIsInstalled(Boolean(standaloneMatch || iosStandalone));
    };

    checkInstalled();
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const isInstallable = !isInstalled && (Boolean(promptEvent) || isIos);

  const promptInstall = useCallback(async () => {
    if (isInstalled) {
      toast.info('Droplink is already installed.');
      return;
    }
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setPromptEvent(null);
      }
      return;
    }
    if (isIos) {
      toast.info('On iPhone/iPad: tap Share, then “Add to Home Screen”.');
      return;
    }
    toast.info('Install is not available yet on this device.');
  }, [isInstalled, isIos, promptEvent]);

  return { isInstallable, isInstalled, promptInstall };
};
