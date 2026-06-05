"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ApiResponse, Reminder } from "@/types";

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReminders = useCallback(async (taskId: string) => {
    setLoading(true);

    try {
      const response = await apiFetch<Reminder[]>(
        `/tasks/${taskId}/reminders`
      );
      setReminders(response.data ?? []);
      return response.data ?? [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createReminder = useCallback(
    async (taskId: string, minutesBefore: number) => {
      const response = await apiFetch<Reminder>(
        `/tasks/${taskId}/reminders`,
        {
          method: "POST",
          body: JSON.stringify({
            minutes_before: minutesBefore
          })
        }
      );
      const reminder = unwrapData(response);
      setReminders((current) => [...current, reminder]);
      return reminder;
    },
    []
  );

  const deleteReminder = useCallback(async (reminderId: string) => {
    await apiFetch<{ deleted: true }>(`/reminders/${reminderId}`, {
      method: "DELETE"
    });
    setReminders((current) =>
      current.filter((reminder) => reminder.id !== reminderId)
    );
  }, []);

  return {
    reminders,
    loading,
    fetchReminders,
    createReminder,
    deleteReminder
  };
}

function unwrapData<TData>(response: ApiResponse<TData>) {
  if (!response.data) {
    throw new Error("Resposta inválida da API.");
  }

  return response.data;
}
