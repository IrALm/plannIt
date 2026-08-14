"use client";

import { useState } from "react";
import { Check, Download, Share } from "lucide-react";
import { usePwaStore } from "@/stores/pwa.store";
import { getPlatformInstallHint, isIOSDevice } from "@/lib/utils/pwa";

/**
 * État de l'installation PWA + action, réutilisé dans l'onboarding
 * (step-install.tsx) et les Réglages — pour que l'utilisateur ait toujours un
 * endroit fiable où installer l'app, pas seulement une chance unique pendant
 * l'onboarding si beforeinstallprompt n'était pas encore prêt à ce moment-là.
 */
export function InstallCard() {
  const installPromptEvent = usePwaStore((s) => s.installPromptEvent);
  const isInstalled = usePwaStore((s) => s.isInstalled);
  const setInstalled = usePwaStore((s) => s.setInstalled);
  const setInstallPromptEvent = usePwaStore((s) => s.setInstallPromptEvent);
  const [prompting, setPrompting] = useState(false);

  async function handleInstall() {
    if (!installPromptEvent) return;
    setPrompting(true);
    await installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
    if (outcome === "accepted") setInstalled(true);
    setPrompting(false);
  }

  if (isInstalled) {
    return (
      <div className="flex items-center gap-[11px] bg-surface border border-accent rounded-card p-[13px]">
        <span className="size-[22px] rounded-[7px] bg-accent text-accent-ink flex items-center justify-center shrink-0">
          <Check size={13} />
        </span>
        <div className="text-[13.5px] font-semibold">Déjà installée — nickel.</div>
      </div>
    );
  }

  if (installPromptEvent) {
    return (
      <button
        type="button"
        onClick={handleInstall}
        disabled={prompting}
        className="flex items-center gap-[11px] bg-surface border border-line rounded-card p-[13px] cursor-pointer hover:bg-surface-2 disabled:opacity-60 w-full text-left"
      >
        <span className="size-[22px] rounded-[7px] bg-tint text-accent flex items-center justify-center shrink-0">
          <Download size={13} />
        </span>
        <div className="text-[13.5px] font-semibold">
          {prompting ? "..." : "Installer l'application"}
        </div>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-[11px] bg-surface border border-line rounded-card p-[13px]">
      <span className="size-[22px] rounded-[7px] bg-tint text-accent flex items-center justify-center shrink-0">
        {isIOSDevice() ? <Share size={13} /> : <Download size={13} />}
      </span>
      <div className="text-[12.5px] text-ink-2">{getPlatformInstallHint()}</div>
    </div>
  );
}
