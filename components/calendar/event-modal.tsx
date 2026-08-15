"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { X } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ReminderPicker } from "@/components/ui/reminder-picker";
import { Mascot } from "@/components/icons/mascot";
import { TypeSelect } from "@/components/calendar/type-select";
import { useUIStore } from "@/stores/ui.store";
import type { EventType } from "@/features/calendar/types";
import { createEventTypeAndReturn } from "@/features/calendar/actions";
import { createEvent, updateEvent, deleteEvent } from "@/features/events/actions";
import type { CalendarEvent } from "@/features/events/types";

type EventModalProps = {
  types: EventType[];
  event?: CalendarEvent | null;
  defaultDate: Date;
  defaultReminders: number[];
};

function toDateInput(date: Date) {
  return format(date, "yyyy-MM-dd");
}
function toTimeInput(date: Date) {
  return format(date, "HH:mm");
}

export function EventModal({ types, event, defaultDate, defaultReminders }: EventModalProps) {
  const router = useRouter();
  const modalOpen = useUIStore((s) => s.modalOpen);
  const modalMode = useUIStore((s) => s.modalMode);
  const closeModal = useUIStore((s) => s.closeModal);

  const [eventTypeId, setEventTypeId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(toDateInput(defaultDate));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [reminders, setReminders] = useState<number[]>(defaultReminders);
  const [availableTypes, setAvailableTypes] = useState<EventType[]>(types);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setAvailableTypes(types);
  }, [types]);

  useEffect(() => {
    if (!modalOpen) return;
    setError(null);

    if (modalMode === "edit" && event) {
      setEventTypeId(event.eventTypeId);
      setTitle(event.title);
      setDate(toDateInput(new Date(event.startAt)));
      setStartTime(toTimeInput(new Date(event.startAt)));
      setEndTime(toTimeInput(new Date(event.endAt)));
      setReminders(event.reminders);
    } else {
      setEventTypeId(availableTypes[0]?.id ?? null);
      setTitle("");
      setDate(toDateInput(defaultDate));
      setStartTime("09:00");
      setEndTime("10:00");
      setReminders(defaultReminders);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, modalMode, event]);

  async function handleCreateType(name: string, color: Parameters<typeof createEventTypeAndReturn>[1]) {
    const created = await createEventTypeAndReturn(name, color);
    setAvailableTypes((prev) => [...prev, created]);
    return created;
  }

  function handleSave() {
    if (!eventTypeId) {
      setError("Choisis un type d'activité.");
      return;
    }

    const input = {
      title,
      eventTypeId,
      startAt: new Date(`${date}T${startTime}`).toISOString(),
      endAt: new Date(`${date}T${endTime}`).toISOString(),
      reminders,
    };

    startTransition(async () => {
      const result =
        modalMode === "edit" && event
          ? await updateEvent(event.id, input)
          : await createEvent({ error: null }, input);

      if (result.error) {
        setError(result.error);
        return;
      }

      closeModal();
      router.refresh();
    });
  }

  function handleDelete() {
    if (!event) return;
    startTransition(async () => {
      const result = await deleteEvent(event.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      closeModal();
      router.refresh();
    });
  }

  return (
    <BottomSheet open={modalOpen} onClose={closeModal}>
      <div className="flex items-center justify-between">
        <h2 className="flex-1 min-w-0 whitespace-nowrap font-serif text-xl truncate">
          {modalMode === "edit" ? "Modifier l'activité" : "Nouvelle activité"}
        </h2>
        <button
          type="button"
          onClick={closeModal}
          className="flex-none size-8 rounded-chip border border-line bg-surface text-ink-2 flex items-center justify-center cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto">
        <div>
          <div className="font-mono text-[10px] tracking-[.12em] uppercase text-muted mb-[6px]">
            Type
          </div>
          <TypeSelect
            types={availableTypes}
            value={eventTypeId}
            onChange={setEventTypeId}
            onCreateType={handleCreateType}
          />
        </div>

        <Input label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />

        <div>
          <div className="font-mono text-[10px] tracking-[.12em] uppercase text-muted mb-[6px]">
            Quand
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 h-12 rounded-card border border-line bg-surface px-3 text-[13.5px] font-mono focus:border-accent focus:outline-none"
            />
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-12 rounded-card border border-line bg-surface px-3 text-[13.5px] font-mono focus:border-accent focus:outline-none"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-12 rounded-card border border-line bg-surface px-3 text-[13.5px] font-mono focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div>
          <div className="font-mono text-[10px] tracking-[.12em] uppercase text-muted mb-[6px]">
            Rappels
          </div>
          <ReminderPicker value={reminders} onChange={setReminders} />
          <p className="text-[11.5px] text-muted mt-[6px]">
            Une notification est aussi envoyée au début de l&apos;activité, en plus de ces rappels.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="mt-auto flex gap-[11px] items-center">
        <div className="flex-none">
          <Mascot size={30} />
        </div>
        {modalMode === "edit" && (
          <Button variant="danger" className="w-auto px-4" onClick={handleDelete} disabled={pending}>
            Supprimer
          </Button>
        )}
        <Button variant="primary" className="flex-1" onClick={handleSave} disabled={pending}>
          {pending ? "..." : "Enregistrer"}
        </Button>
      </div>
    </BottomSheet>
  );
}
