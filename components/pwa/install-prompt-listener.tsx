"use client";

import { useEffect } from "react";
import { usePwaStore, type BeforeInstallPromptEvent } from "@/stores/pwa.store";

type WindowWithInstallPrompt = Window & {
  __pwaInstallPrompt?: BeforeInstallPromptEvent | null;
  __pwaInstalled?: boolean;
};

/**
 * Relaie vers le store Zustand ce que le script inline de app/layout.tsx a
 * déjà capté (avant même l'hydratation React — cf. INSTALL_PROMPT_CAPTURE_SCRIPT),
 * plus les événements suivants si beforeinstallprompt se déclenche plus tard.
 * Détecte aussi si l'app tourne déjà en mode standalone (installée).
 */
export function InstallPromptListener() {
  const setInstallPromptEvent = usePwaStore((s) => s.setInstallPromptEvent);
  const setInstalled = usePwaStore((s) => s.setInstalled);

  useEffect(() => {
    const win = window as WindowWithInstallPrompt;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone || win.__pwaInstalled) setInstalled(true);

    if (win.__pwaInstallPrompt) setInstallPromptEvent(win.__pwaInstallPrompt);

    function handlePromptReady() {
      if (win.__pwaInstallPrompt) setInstallPromptEvent(win.__pwaInstallPrompt);
    }
    function handleInstalled() {
      setInstalled(true);
      setInstallPromptEvent(null);
    }

    window.addEventListener("pwa-install-prompt-ready", handlePromptReady);
    window.addEventListener("pwa-installed", handleInstalled);
    return () => {
      window.removeEventListener("pwa-install-prompt-ready", handlePromptReady);
      window.removeEventListener("pwa-installed", handleInstalled);
    };
  }, [setInstallPromptEvent, setInstalled]);

  return null;
}
