import { Download } from "lucide-react";
import { Mascot } from "@/components/icons/mascot";
import { InstallCard } from "@/components/pwa/install-card";

export function StepInstall() {
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

      <div className="mt-1">
        <InstallCard />
      </div>

      <p className="text-[11.5px] text-muted mt-1">
        Pas envie tout de suite ? Tu retrouveras ce bouton dans les Réglages.
      </p>
    </div>
  );
}
