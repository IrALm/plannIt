"use client";

import { create } from "zustand";

type Theme = "light" | "dark" | "auto";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "plannit-theme";

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "auto") {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "auto") return stored;
  return "auto";
}

function applyResolvedTheme(resolved: ResolvedTheme) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", resolved);
  }
}

type UIState = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
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
    resolvedTheme: resolveTheme(initialTheme),
    setTheme: (theme) => {
      const resolved = resolveTheme(theme);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, theme);
      }
      applyResolvedTheme(resolved);
      set({ theme, resolvedTheme: resolved });
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
