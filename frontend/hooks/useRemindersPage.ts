"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "@/lib/api";
import { combineDateTime, humanizeFutureDistance } from "@/lib/date";
import type { ApiResponse, Reminder, Task } from "@/types";

export interface TaskWithReminders {
  task: Task;
  reminders: Reminder[];
}

export interface UpcomingReminder {
  task: Task;
  reminder: Reminder;
  scheduledFor: Date;
  timeUntil: string;
}

export function useRemindersPage() {
  const [tasksWithReminders, setTasksWithReminders] = useState<
    TaskWithReminders[]
  >([]);
  const [upcomingReminders, setUpcomingReminders] = useState<
    UpcomingReminder[]
  >([]);
  const [tasksWithoutReminders, setTasksWithoutReminders] = useState<Task[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rebuildDerivedState = useCallback(
    (items: TaskWithReminders[]) => {
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcoming = items
        .flatMap<UpcomingReminder>(({ task, reminders }) => {
          const taskDate = combineDateTime(task.task_date, task.task_time);

          if (!taskDate) {
            return [];
          }

          return reminders.map((reminder) => {
            const scheduledFor = new Date(
              taskDate.getTime() - reminder.minutes_before * 60 * 1000
            );

            return {
              task,
              reminder,
              scheduledFor,
              timeUntil: humanizeFutureDistance(scheduledFor)
            };
          });
        })
        .filter(
          (item) =>
            !item.reminder.sent_at &&
            item.scheduledFor >= now &&
            item.scheduledFor <= next24Hours
        )
        .sort(
          (left, right) =>
            left.scheduledFor.getTime() - right.scheduledFor.getTime()
        );

      const withoutReminders = items
        .filter(({ task, reminders }) => {
          const taskDate = combineDateTime(task.task_date, task.task_time);
          return (
            reminders.length === 0 &&
            Boolean(taskDate && taskDate >= now && taskDate <= next7Days)
          );
        })
        .map(({ task }) => task);

      setTasksWithReminders(items);
      setUpcomingReminders(upcoming);
      setTasksWithoutReminders(withoutReminders);
    },
    []
  );

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const periods = getPeriodsForNextSevenDays();
      const taskResponses = await Promise.all(
        periods.map(({ month, year }) =>
          apiFetch<Task[]>(`/tasks?month=${month}&year=${year}`)
        )
      );
      const tasksById = new Map<string, Task>();

      taskResponses.forEach((response) => {
        response.data?.forEach((task) => tasksById.set(task.id, task));
      });

      const tasks = [...tasksById.values()].sort(compareTasks);
      const persistentIds = [
        ...new Set(tasks.map((task) => task.parent_id ?? task.id))
      ];
      const reminderEntries = await Promise.all(
        persistentIds.map(async (taskId) => {
          const response = await apiFetch<Reminder[]>(
            `/tasks/${taskId}/reminders`
          );
          return [taskId, response.data ?? []] as const;
        })
      );
      const remindersByTask = new Map(reminderEntries);
      const items = tasks.map((task) => ({
        task,
        reminders: remindersByTask.get(task.parent_id ?? task.id) ?? []
      }));

      rebuildDerivedState(items);
      return items;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar os lembretes.";
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [rebuildDerivedState]);

  const addReminder = useCallback(
    async (taskId: string, minutesBefore: number) => {
      const task = tasksWithReminders.find((item) => item.task.id === taskId)
        ?.task;
      const persistentId = task?.parent_id ?? taskId;
      const response = await apiFetch<Reminder>(
        `/tasks/${persistentId}/reminders`,
        {
          method: "POST",
          body: JSON.stringify({ minutes_before: minutesBefore })
        }
      );
      const reminder = unwrapData(response);
      const nextItems = tasksWithReminders.map((item) =>
        (item.task.parent_id ?? item.task.id) === persistentId
          ? { ...item, reminders: [...item.reminders, reminder] }
          : item
      );
      rebuildDerivedState(nextItems);
      return reminder;
    },
    [rebuildDerivedState, tasksWithReminders]
  );

  const removeReminder = useCallback(
    async (reminderId: string, taskId: string) => {
      await apiFetch<{ deleted: true }>(`/reminders/${reminderId}`, {
        method: "DELETE"
      });
      const task = tasksWithReminders.find((item) => item.task.id === taskId)
        ?.task;
      const persistentId = task?.parent_id ?? taskId;
      const nextItems = tasksWithReminders.map((item) =>
        (item.task.parent_id ?? item.task.id) === persistentId
          ? {
              ...item,
              reminders: item.reminders.filter(
                (reminder) => reminder.id !== reminderId
              )
            }
          : item
      );
      rebuildDerivedState(nextItems);
    },
    [rebuildDerivedState, tasksWithReminders]
  );

  return {
    tasksWithReminders,
    upcomingReminders,
    tasksWithoutReminders,
    loading,
    error,
    fetchAll,
    addReminder,
    removeReminder
  };
}

function getPeriodsForNextSevenDays() {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + 7);
  const periods = [
    { month: now.getMonth() + 1, year: now.getFullYear() }
  ];

  if (
    end.getMonth() !== now.getMonth() ||
    end.getFullYear() !== now.getFullYear()
  ) {
    periods.push({ month: end.getMonth() + 1, year: end.getFullYear() });
  }

  return periods;
}

function compareTasks(left: Task, right: Task) {
  return `${left.task_date} ${left.task_time ?? "99:99"}`.localeCompare(
    `${right.task_date} ${right.task_time ?? "99:99"}`
  );
}

function unwrapData<TData>(response: ApiResponse<TData>) {
  if (!response.data) {
    throw new Error("Resposta inválida da API.");
  }

  return response.data;
}
