import { Check } from "lucide-react";
import { Mascot } from "@/components/icons/mascot";
import { GoogleIcon } from "@/components/icons/google-icon";

export function StepGoogle() {
  return (
    <div className="flex flex-col gap-[13px] flex-1">
      <div className="flex items-center gap-[11px]">
        <Mascot size={38} />
        <p className="text-[13.5px] text-ink-2">Petite étape utile, promis.</p>
      </div>
      <div className="size-[52px] rounded-[15px] bg-surface border border-line flex items-center justify-center">
        <GoogleIcon size={24} />
      </div>
      <h1 className="font-serif text-[23px] leading-[1.12]">
        Connecte Google Calendar
      </h1>
      <p className="text-[13px] leading-[1.5] text-ink-2">
        Reçois tes rappels sur ton téléphone et retrouve toutes tes activités
        au même endroit.
      </p>
      <div className="flex flex-col gap-[9px] mt-0.5">
        <div className="flex items-center gap-[11px] bg-surface border border-accent rounded-card p-[12px]">
          <span className="size-[22px] rounded-[7px] bg-accent text-accent-ink flex items-center justify-center shrink-0">
            <Check size={13} />
          </span>
          <div>
            <div className="text-[13px] font-semibold">Google Calendar installée</div>
            <div className="text-[11.5px] text-muted">Prête sur ton téléphone</div>
          </div>
        </div>
        <div className="flex items-center gap-[11px] bg-surface border border-line rounded-card p-[12px]">
          <span className="size-[22px] rounded-[6px] border-[1.6px] border-line shrink-0" />
          <div>
            <div className="text-[13px] font-semibold">Compte Google</div>
            <div className="text-[11.5px] text-muted">Connecte-toi en un tap</div>
          </div>
        </div>
      </div>
    </div>
  );
}
