"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { EventColor } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { setOnboardingStep, completeOnboarding } from "@/app/onboarding/actions";
import { createEventTypes } from "@/features/calendar/actions";
import { StepWelcome } from "./step-welcome";
import { StepFeatures } from "./step-features";
import { StepTypes, type SelectedType } from "./step-types";
import { StepInstall } from "./step-install";
import { StepDone } from "./step-done";

const TOTAL_STEPS = 5;
const TYPES_STEP = 3;

const DEFAULT_TYPES: SelectedType[] = [
  { name: "Réunion", color: "blue", selected: true },
  { name: "Sport", color: "green", selected: true },
  { name: "Santé", color: "coral", selected: true },
  { name: "Étudier", color: "purple", selected: false },
  { name: "Perso", color: "amber", selected: false },
];

const CTA_LABELS: Record<number, string> = {
  1: "C'est parti",
  2: "Suivant",
  3: "Suivant",
  4: "Suivant",
  5: "Aller au planning",
};

type OnboardingWizardProps = {
  initialStep: number;
};

export function OnboardingWizard({ initialStep }: OnboardingWizardProps) {
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), TOTAL_STEPS));
  const [types, setTypes] = useState<SelectedType[]>(DEFAULT_TYPES);
  const [pending, startTransition] = useTransition();
  // Sérialise les appels setOnboardingStep : sans ça, des clics rapides sur
  // plusieurs étapes peuvent lancer des requêtes concurrentes qui se
  // terminent dans le désordre, et la base finit avec un onboarding_step
  // plus ancien que l'étape réellement affichée.
  const stepSaveQueue = useRef(Promise.resolve());

  function toggleType(name: string) {
    setTypes((prev) =>
      prev.map((t) => (t.name === name ? { ...t, selected: !t.selected } : t))
    );
  }

  function addCustomType(name: string, color: EventColor) {
    setTypes((prev) => [...prev, { name, color, selected: true }]);
  }

  function goTo(next: number) {
    setStep(next);
    stepSaveQueue.current = stepSaveQueue.current.then(() => setOnboardingStep(next));
  }

  function handleNext() {
    if (step === TYPES_STEP) {
      const selected = types.filter((t) => t.selected);
      startTransition(async () => {
        await createEventTypes(
          selected.map((t) => ({
            name: t.name,
            color: t.color,
            isDefault: DEFAULT_TYPES.some((d) => d.name === t.name),
          }))
        );
        goTo(TYPES_STEP + 1);
      });
      return;
    }

    if (step === TOTAL_STEPS) {
      startTransition(() => {
        completeOnboarding();
      });
      return;
    }

    goTo(step + 1);
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col px-[22px] pt-3 pb-5 animate-plfade">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[.1em] text-muted">
          ÉTAPE {step} / {TOTAL_STEPS}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => startTransition(() => completeOnboarding())}
            className="text-[13px] font-semibold text-ink-2 cursor-pointer"
          >
            Passer
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex gap-[6px] mt-[10px]">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((i) => (
          <span
            key={i}
            className={`h-[5px] flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-line"}`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col mt-5">
        {step === 1 && <StepWelcome />}
        {step === 2 && <StepFeatures />}
        {step === 3 && (
          <StepTypes types={types} onToggle={toggleType} onAddCustom={addCustomType} />
        )}
        {step === 4 && <StepInstall />}
        {step === 5 && <StepDone />}
      </div>

      <Button variant="primary" className="mt-[14px]" onClick={handleNext} disabled={pending}>
        {pending ? "..." : CTA_LABELS[step]}
      </Button>

      {/* Repli sans JS : lien direct vers le dashboard si jamais handleNext échoue. */}
      <noscript>
        <Link href="/dashboard" className="text-center text-[13px] mt-3 text-accent">
          Aller au planning
        </Link>
      </noscript>
    </div>
  );
}
