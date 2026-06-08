"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { SpecialDate } from "@/types";

interface CreateSpecialDateInput {
  name: string;
  month: number;
  day: number;
  notify_on_day?: boolean;
  notify_1_day_before?: boolean;
  notify_1_week_before?: boolean;
  notify_1_month_before?: boolean;
}

interface UpdateSpecialDateInput {
  name?: string;
  month?: number;
  day?: number;
  active?: boolean;
  notify_on_day?: boolean;
  notify_1_day_before?: boolean;
  notify_1_week_before?: boolean;
  notify_1_month_before?: boolean;
}

export function useSpecialDates() {
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecialDates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch<SpecialDate[]>("/special-dates");
      setSpecialDates(response.data ?? []);
    } catch {
      setError("Erro ao carregar datas especiais.");
    } finally {
      setLoading(false);
    }
  }, []);

  const createSpecialDate = useCallback(
    async (data: CreateSpecialDateInput): Promise<SpecialDate> => {
      const response = await apiFetch<SpecialDate>("/special-dates", {
        method: "POST",
        body: JSON.stringify(data)
      });

      if (!response.data) {
        throw new Error("Resposta inválida da API.");
      }

      setSpecialDates((prev) => [...prev, response.data!]);
      return response.data;
    },
    []
  );

  const updateSpecialDate = useCallback(
    async (id: string, data: UpdateSpecialDateInput): Promise<SpecialDate> => {
      const response = await apiFetch<SpecialDate>(`/special-dates/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
      });

      if (!response.data) {
        throw new Error("Resposta inválida da API.");
      }

      setSpecialDates((prev) =>
        prev.map((d) => (d.id === id ? response.data! : d))
      );
      return response.data;
    },
    []
  );

  const deleteSpecialDate = useCallback(async (id: string): Promise<void> => {
    await apiFetch<{ deleted: true }>(`/special-dates/${id}`, {
      method: "DELETE"
    });
    setSpecialDates((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return {
    specialDates,
    loading,
    error,
    fetchSpecialDates,
    createSpecialDate,
    updateSpecialDate,
    deleteSpecialDate
  };
}
