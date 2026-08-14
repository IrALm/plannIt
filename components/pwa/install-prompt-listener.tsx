"use client";

import { useEffect } from "react";
import { usePwaStore, type BeforeInstallPromptEvent } from "@/stores/pwa.store";

/**
 * Capture beforeinstallprompt le plus tôt possible (peut se déclencher avant
 * que l'utilisateur n'atteigne l'étape onboarding dédiée) et détecte si l'app
 * tourne déjà en mode standalone (installée). Monté une fois à la racine.
 */
export function InstallPromptListener() {
  const setInstallPromptEvent = usePwaStore((s) => s.setInstallPromptEvent);
  const setInstalled = usePwaStore((s) => s.setInstalled);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) setInstalled(true);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setInstalled(true);
      setInstallPromptEvent(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [setInstallPromptEvent, setInstalled]);

  return null;
}
