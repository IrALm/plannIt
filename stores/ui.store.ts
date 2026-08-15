"use client";

import { create } from "zustand";

type Theme = "light" | "dark";

const STORAGE_KEY = "plannit-theme";

// Thème clair par défaut partout tant que l'utilisateur n'a pas explicitement
// choisi "Sombre" dans les Réglages — ne suit plus prefers-color-scheme.
function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

type UIState = {
  theme: Theme;
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;

  modalOpen: boolean;
  modalMode: "add" | "edit";
  editingEventId: string | null;
  openAddModal: () => void;
  openEditModal: (eventId: string) => void;
  closeModal: () => void;
};

export const useUIStore = create<UIState>((set) => {
  const initialTheme = readInitialTheme();

  return {
    theme: initialTheme,
    resolvedTheme: initialTheme,
    setTheme: (theme) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, theme);
      }
      applyTheme(theme);
      set({ theme, resolvedTheme: theme });
    },

    modalOpen: false,
    modalMode: "add",
    editingEventId: null,
    openAddModal: () =>
      set({ modalOpen: true, modalMode: "add", editingEventId: null }),
    openEditModal: (eventId) =>
      set({ modalOpen: true, modalMode: "edit", editingEventId: eventId }),
    closeModal: () => set({ modalOpen: false }),
  };
});
