"use client";

import { type ReactNode } from "react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Overlay + feuille ancrée en bas. Cf. bloc "MODAL AJOUT" dans PlannIt.dc.html :
 * top:40px (laisse voir la barre de statut), coins hauts 22px, shadow-sheet, animate-plfade.
 */
export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(10,14,20,.5)]"
      />
      <div className="absolute left-0 right-0 bottom-0 top-10 bg-bg rounded-t-sheet shadow-sheet flex flex-col gap-[13px] px-5 pt-3 pb-[18px] animate-plfade">
        <div className="w-[38px] h-1 rounded-full bg-line self-center" />
        {children}
      </div>
    </div>
  );
}
