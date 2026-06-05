"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useReminders } from "@/hooks/useReminders";
import type { Task } from "@/types";

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

const reminderOptions = [
  { label: "15 min antes", value: 15 },
  { label: "30 min antes", value: 30 },
  { label: "1 hora antes", value: 60 },
  { label: "1 dia antes", value: 1440 }
];

export function ReminderModal({
  isOpen,
  onClose,
  task
}: ReminderModalProps) {
  const { reminders, loading, fetchReminders, createReminder, deleteReminder } =
    useReminders();
  const [addedValue, setAddedValue] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError("");
      void fetchReminders(task.id);
    }
  }, [fetchReminders, isOpen, task.id]);

  if (!isOpen) {
    return null;
  }

  async function handleCreateReminder(minutesBefore: number) {
    setError("");

    try {
      await createReminder(task.id, minutesBefore);
      setAddedValue(minutesBefore);
      window.setTimeout(() => setAddedValue(null), 1000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Erro ao criar lembrete."
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="w-[90vw] max-w-[480px] rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
              Lembretes
            </p>
            <h2 className="truncate text-lg font-semibold text-[#111827]">
              {task.title}
            </h2>
          </div>
          <button
            aria-label="Fechar modal"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7280] transition hover:bg-[#f3f4f6]"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#111827]">
            Lembretes ativos
          </h3>
          {loading ? (
            <p className="rounded-lg bg-[#f9fafb] p-3 text-sm text-[#6b7280]">
              Carregando...
            </p>
          ) : reminders.length > 0 ? (
            <div className="space-y-2">
              {reminders.map((reminder) => (
                <div
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                  key={reminder.id}
                >
                  <span className="inline-flex items-center gap-2 text-sm text-[#111827]">
                    <Bell className="h-4 w-4 text-[#534AB7]" />
                    {formatReminderLabel(reminder.minutes_before)}
                  </span>
                  <button
                    aria-label="Excluir lembrete"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] transition hover:bg-[#f3f4f6]"
                    onClick={() => deleteReminder(reminder.id)}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-[#f9fafb] p-3 text-sm text-[#6b7280]">
              Nenhum lembrete configurado.
            </p>
          )}
        </div>

        <div className="mt-5">
          <h3 className="mb-3 text-sm font-semibold text-[#111827]">
            Adicionar
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {reminderOptions.map((option) => {
              const exists = reminders.some(
                (reminder) => reminder.minutes_before === option.value
              );

              return (
                <Button
                  disabled={exists}
                  key={option.value}
                  onClick={() => handleCreateReminder(option.value)}
                  type="button"
                  variant={exists ? "secondary" : "primary"}
                >
                  {addedValue === option.value
                    ? "Adicionado"
                    : exists
                      ? "Adicionado"
                      : option.label}
                </Button>
              );
            })}
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}

function formatReminderLabel(minutesBefore: number) {
  if (minutesBefore === 60) {
    return "1 hora antes";
  }

  if (minutesBefore === 1440) {
    return "1 dia antes";
  }

  return `${minutesBefore} min antes`;
}
