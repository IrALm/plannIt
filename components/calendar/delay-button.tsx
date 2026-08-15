"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Mascot } from "@/components/icons/mascot";
import { applyDelayCascade } from "@/features/events/actions";

const QUICK_DELAYS = [5, 10, 15, 30];

type DelayButtonProps = {
  eventId: string;
};

/** "Je suis en retard" — feuille mascotte, décale cet événement et tous
 * ceux qui suivent le même jour du même délai (cf. features/events/actions.ts). */
export function DelayButton({ eventId }: DelayButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function apply(minutes: number) {
    startTransition(async () => {
      const result = await applyDelayCascade(eventId, minutes);
      if (!result.error) {
        router.refresh();
        setOpen(false);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label="Je suis en retard"
        className="size-7 rounded-chip border border-line bg-surface-2 text-ink-2 flex items-center justify-center cursor-pointer shrink-0"
      >
        <Clock size={13} />
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-4 items-center text-center pt-2">
          <Mascot size={56} />
          <div className="font-mono text-[11px] tracking-[.1em] uppercase text-accent">Un imprévu ?</div>
          <h2 className="font-serif text-xl leading-snug">Tu es en retard de combien ?</h2>
          <p className="text-[13.5px] text-ink-2">
            On décale cette activité et tout ce qui suit aujourd&apos;hui.
          </p>

          <div className="grid grid-cols-2 gap-2 w-full">
            {QUICK_DELAYS.map((m) => (
              <button
                key={m}
                type="button"
                disabled={pending}
                onClick={() => apply(m)}
                className="h-11 rounded-input border border-accent bg-tint text-[13.5px] font-medium cursor-pointer disabled:opacity-50"
              >
                {m} min
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={pending}
            className="text-[13px] text-ink-2 underline cursor-pointer"
          >
            Annuler
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
