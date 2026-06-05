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
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const fetchTasks = useCallback(async (month: number, year: number) => {
    currentMonthRef.current = { month, year };
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const response = await apiFetch<Task[]>(
        `/tasks?month=${month}&year=${year}`
      );
      setState({
        tasks: response.data ?? [],
        loading: false,
        error: null
      });

      return response.data ?? [];
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
  }, []);

  const fetchTasksByDate = useCallback(
    (date: string) => state.tasks.filter((task) => task.task_date === date),
    [state.tasks]
  );

  const refetchCurrentMonth = useCallback(async () => {
    const { month, year } = currentMonthRef.current;
    await fetchTasks(month, year);
  }, [fetchTasks]);

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
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await apiFetch<{ deleted: true }>(`/tasks/${id}`, {
      method: "DELETE"
    });

    setState((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== id)
    }));
  }, []);

  return {
    tasks: state.tasks,
    loading: state.loading,
    error: state.error,
    fetchTasks,
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
