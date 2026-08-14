"use client";

import { useState } from "react";
import { Check, Download, Share } from "lucide-react";
import { Mascot } from "@/components/icons/mascot";
import { usePwaStore } from "@/stores/pwa.store";

const isIOS = () =>
  typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

export function StepInstall() {
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

  return (
    <div className="flex flex-col gap-[13px] flex-1">
      <div className="flex items-center gap-[11px]">
        <Mascot size={38} />
        <p className="text-[13.5px] text-ink-2">Encore plus pratique, promis.</p>
      </div>
      <div className="size-[52px] rounded-[15px] bg-surface border border-line flex items-center justify-center text-accent">
        <Download size={24} />
      </div>
      <h1 className="font-serif text-[23px] leading-[1.12]">
        Installe PlannIt sur ton téléphone
      </h1>
      <p className="text-[13px] leading-[1.5] text-ink-2">
        Retrouve ton planning en un tap depuis l&apos;écran d&apos;accueil, comme
        une vraie application.
      </p>

      {isInstalled ? (
        <div className="flex items-center gap-[11px] bg-surface border border-accent rounded-card p-[13px] mt-1">
          <span className="size-[22px] rounded-[7px] bg-accent text-accent-ink flex items-center justify-center shrink-0">
            <Check size={13} />
          </span>
          <div className="text-[13.5px] font-semibold">Déjà installée — nickel.</div>
        </div>
      ) : installPromptEvent ? (
        <button
          type="button"
          onClick={handleInstall}
          disabled={prompting}
          className="flex items-center gap-[11px] bg-surface border border-line rounded-card p-[13px] mt-1 cursor-pointer hover:bg-surface-2 disabled:opacity-60"
        >
          <span className="size-[22px] rounded-[7px] bg-tint text-accent flex items-center justify-center shrink-0">
            <Download size={13} />
          </span>
          <div className="text-[13.5px] font-semibold">
            {prompting ? "..." : "Installer l'application"}
          </div>
        </button>
      ) : isIOS() ? (
        <div className="flex items-center gap-[11px] bg-surface border border-line rounded-card p-[13px] mt-1">
          <span className="size-[22px] rounded-[7px] bg-tint text-accent flex items-center justify-center shrink-0">
            <Share size={13} />
          </span>
          <div className="text-[12.5px] text-ink-2">
            Bouton <strong className="text-ink">Partager</strong> de Safari →{" "}
            <strong className="text-ink">Sur l&apos;écran d&apos;accueil</strong>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-[11px] bg-surface border border-line rounded-card p-[13px] mt-1">
          <div className="text-[12.5px] text-ink-2">
            Depuis le menu de ton navigateur : « Installer l&apos;application » ou
            « Ajouter à l&apos;écran d&apos;accueil ».
          </div>
        </div>
      )}
    </div>
  );
}
