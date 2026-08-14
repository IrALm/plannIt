"use client";

import { create } from "zustand";

// L'événement natif du navigateur (Chrome/Edge/Android) permettant de
// déclencher le prompt d'installation depuis un bouton custom. Pas de type
// officiel dans lib.dom.d.ts — on le déclare nous-mêmes.
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaState = {
  installPromptEvent: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  setInstallPromptEvent: (event: BeforeInstallPromptEvent | null) => void;
  setInstalled: (installed: boolean) => void;
};

export const usePwaStore = create<PwaState>((set) => ({
  installPromptEvent: null,
  isInstalled: false,
  setInstallPromptEvent: (event) => set({ installPromptEvent: event }),
  setInstalled: (installed) => set({ isInstalled: installed }),
}));
