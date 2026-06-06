"use client";

import { useCallback, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import type {
  ApiResponse,
  CreateTaskInput,
  Task,
  UpdateTaskInput
} from "@/types";

interface UseTasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

export function useTasks() {
  const [state, setState] = useState<UseTasksState>({
    tasks: [],
    loading: false,
    error: null
  });
  const currentMonthRef = useRef({
    periods: [
      {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      }
    ]
  });

  const fetchTaskPeriods = useCallback(
    async (periods: Array<{ month: number; year: number }>) => {
      currentMonthRef.current = { periods };
      setState((current) => ({ ...current, loading: true, error: null }));

      try {
        const responses = await Promise.all(
          periods.map(({ month, year }) =>
            apiFetch<Task[]>(`/tasks?month=${month}&year=${year}`)
          )
        );
        const tasksById = new Map<string, Task>();

        responses.forEach((response) => {
          response.data?.forEach((task) => tasksById.set(task.id, task));
        });

        const tasks = [...tasksById.values()];
        setState({
          tasks,
          loading: false,
          error: null
        });

        return tasks;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar tarefas.";
        setState((current) => ({
          ...current,
          loading: false,
          error: message
        }));
        throw error;
      }
    },
    []
  );

  const fetchTasks = useCallback(async (month: number, year: number) => {
    return fetchTaskPeriods([{ month, year }]);
  }, [fetchTaskPeriods]);

  const fetchTasksForRange = useCallback(async (start: Date, end: Date) => {
    const periods: Array<{ month: number; year: number }> = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const finalMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (cursor <= finalMonth) {
      periods.push({
        month: cursor.getMonth() + 1,
        year: cursor.getFullYear()
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return fetchTaskPeriods(periods);
  }, [fetchTaskPeriods]);

  const refetchCurrentMonth = useCallback(async () => {
    await fetchTaskPeriods(currentMonthRef.current.periods);
  }, [fetchTaskPeriods]);

  const fetchTasksByDate = useCallback(
    (date: string) => state.tasks.filter((task) => task.task_date === date),
    [state.tasks]
  );

  const createTask = useCallback(
    async (data: CreateTaskInput) => {
      const response = await apiFetch<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify(data)
      });

      await refetchCurrentMonth();
      return unwrapData(response);
    },
    [refetchCurrentMonth]
  );

  const updateTask = useCallback(
    async (id: string, data: UpdateTaskInput) => {
      const response = await apiFetch<Task>(`/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
      });

      await refetchCurrentMonth();
      return unwrapData(response);
    },
    [refetchCurrentMonth]
  );

  const toggleDone = useCallback(async (id: string) => {
    let previousTasks: Task[] = [];

    setState((current) => {
      previousTasks = current.tasks;
      return {
        ...current,
        tasks: current.tasks.map((task) =>
          task.id === id ? { ...task, done: !task.done } : task
        )
      };
    });

    try {
      const response = await apiFetch<Task>(`/tasks/${id}/toggle`, {
        method: "PATCH"
      });
      const updatedTask = unwrapData(response);

      if (/_\d{4}-\d{2}-\d{2}$/.test(id)) {
        await refetchCurrentMonth();
        return updatedTask;
      }

      setState((current) => ({
        ...current,
        tasks: current.tasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        )
      }));
      return updatedTask;
    } catch (error) {
      setState((current) => ({ ...current, tasks: previousTasks }));
      throw error;
    }
  }, [refetchCurrentMonth]);

  const deleteTask = useCallback(async (
    id: string,
    scope: "this" | "all" = "this"
  ) => {
    await apiFetch<{ deleted: true }>(`/tasks/${id}?scope=${scope}`, {
      method: "DELETE"
    });

    await refetchCurrentMonth();
  }, [refetchCurrentMonth]);

  return {
    tasks: state.tasks,
    loading: state.loading,
    error: state.error,
    fetchTasks,
    fetchTasksForRange,
    fetchTasksByDate,
    createTask,
    updateTask,
    toggleDone,
    deleteTask
  };
}

function unwrapData<TData>(response: ApiResponse<TData>) {
  if (!response.data) {
    throw new Error("Resposta inválida da API.");
  }

  return response.data;
}
