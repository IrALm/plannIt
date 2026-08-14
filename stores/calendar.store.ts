"use client";

import { create } from "zustand";

type CalendarState = {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
};

export const useCalendarStore = create<CalendarState>((set) => ({
  selectedDate: new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
