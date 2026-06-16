"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  BellRing,
  ChevronDown,
  ChevronRight,
  Clock3,
  Plus,
  X
} from "lucide-react";
import { ReminderModal } from "@/components/tasks/ReminderModal";
import { Button } from "@/components/ui/Button";
import { useRemindersPage } from "@/hooks/useRemindersPage";
import { cn } from "@/lib/cn";
import { formatCompactDate, parseDateKey } from "@/lib/date";
import { taskColorClasses, taskColorDots } from "@/lib/task-colors";
import type { Task } from "@/types";

type ReminderFilter = "all" | "with" | "without";

const reminderOptions = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hora", value: 60 },
  { label: "1 dia", value: 1440 }
];

export default function RemindersPage() {
  const {
    tasksWithReminders,
    upcomingReminders,
    tasksWithoutReminders,
    loading,
    error,
    fetchAll,
    addReminder,
    removeReminder
  } = useRemindersPage();
  const [filter, setFilter] = useState<ReminderFilter>("all");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [addingTaskId, setAddingTaskId] = useState<string | null>(null);
  const [taskForModal, setTaskForModal] = useState<Task | null>(null);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const filteredTasks = useMemo(
    () =>
      tasksWithReminders.filter(({ reminders }) => {
        if (filter === "with") {
          return reminders.length > 0;
        }

        if (filter === "without") {
          return reminders.length === 0;
        }

        return true;
      }),
    [filter, tasksWithReminders]
  );

  const groupedTasks = useMemo(() => {
    const groups = new Map<string, typeof filteredTasks>();

    filteredTasks.forEach((item) => {
      const group = groups.get(item.task.task_date) ?? [];
      group.push(item);
      groups.set(item.task.task_date, group);
    });

    return [...groups.entries()];
  }, [filteredTasks]);

  function toggleExpanded(taskId: string) {
    setExpandedTasks((current) => {
      const next = new Set(current);

      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }

      return next;
    });
  }

  return (
    <section className="space-y-6 p-5">
      <header>
        <h1 className="text-2xl font-semibold text-[#111827]">Lembretes</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Centralize e acompanhe os avisos das suas tarefas.
        </p>
      </header>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      <section className="w-full overflow-hidden rounded-xl border border-[#D8D5F5] bg-gradient-to-br from-[#F7F6FF] to-white p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEEDFE] text-[#534AB7]">
            <BellRing className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-[#111827]">
              Próximos lembretes
            </h2>
            <p className="text-xs text-[#6B7280]">Nas próximas 24 horas</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[#6B7280]">Carregando...</p>
        ) : upcomingReminders.length ? (
          <div className="grid w-full gap-3 overflow-hidden lg:grid-cols-2">
            {upcomingReminders.map((item) => (
              <article
                className="flex min-w-0 items-start gap-3 overflow-hidden rounded-lg border border-white bg-white p-3 shadow-sm"
                key={`${item.task.id}-${item.reminder.id}`}
              >
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#534AB7]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#111827]">
                    {item.task.title}
                  </p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    {formatTaskDateTime(item.task)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full bg-[#EEEDFE] px-2 py-1 font-medium text-[#534AB7]">
                      {item.timeUntil}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[#6B7280]">
                      {formatReminderLabel(item.reminder.minutes_before)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg bg-white/70 p-4 text-sm text-[#6B7280]">
            <Bell className="h-5 w-5 text-[#9CA3AF]" />
            Nenhum lembrete nas próximas 24h
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#111827]">
              Todas as tarefas
            </h2>
            <p className="text-xs text-[#6B7280]">
              Expanda uma tarefa para gerenciar seus lembretes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["all", "Todas as tarefas"],
              ["with", "Só com lembretes"],
              ["without", "Sem lembretes"]
            ].map(([value, label]) => (
              <button
                className={cn(
                  "h-9 rounded-lg px-3 text-xs font-medium transition",
                  filter === value
                    ? "bg-[#EEEDFE] text-[#534AB7]"
                    : "bg-white text-[#6B7280] hover:bg-[#F3F4F6]"
                )}
                key={value}
                onClick={() => setFilter(value as ReminderFilter)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {groupedTasks.length ? (
          <div className="space-y-4">
            {groupedTasks.map(([date, items]) => (
              <section key={date}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  {formatCompactDate(date)} ·{" "}
                  {parseDateKey(date).toLocaleDateString("pt-BR", {
                    weekday: "long"
                  })}
                </h3>
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {items.map(({ task, reminders }) => {
                    const expanded = expandedTasks.has(task.id);
                    const showingOptions = addingTaskId === task.id;

                    return (
                      <article
                        className="border-b border-slate-100 last:border-b-0"
                        key={task.id}
                      >
                        <button
                          aria-expanded={expanded}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#FAFAFA]"
                          onClick={() => toggleExpanded(task.id)}
                          type="button"
                        >
                          {expanded ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-[#6B7280]" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-[#6B7280]" />
                          )}
                          <span
                            className={cn(
                              "h-2.5 w-2.5 shrink-0 rounded-full",
                              taskColorDots[task.color]
                            )}
                          />
                          <span className="w-12 shrink-0 text-xs font-semibold text-[#534AB7]">
                            {task.task_time ?? "—"}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#111827]">
                            {task.title}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-1 text-[10px] font-medium",
                              taskColorClasses[task.color]
                            )}
                          >
                            {reminders.length} lembrete
                            {reminders.length === 1 ? "" : "s"}
                          </span>
                        </button>

                        {expanded ? (
                          <div className="border-t border-slate-100 bg-[#F9FAFB] px-4 py-4 pl-11">
                            <div className="flex flex-wrap gap-2">
                              {reminders.map((reminder) => (
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D8D5F5] bg-white py-1 pl-2.5 pr-1 text-xs text-[#534AB7]"
                                  key={reminder.id}
                                >
                                  {formatReminderLabel(
                                    reminder.minutes_before
                                  )}
                                  <button
                                    aria-label={`Remover lembrete de ${task.title}`}
                                    className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-[#EEEDFE]"
                                    onClick={() =>
                                      void removeReminder(reminder.id, task.id)
                                    }
                                    type="button"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                              {!reminders.length ? (
                                <span className="text-xs text-[#9CA3AF]">
                                  Nenhum lembrete configurado.
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-3">
                              <Button
                                onClick={() =>
                                  setAddingTaskId(
                                    showingOptions ? null : task.id
                                  )
                                }
                                type="button"
                                variant="outline"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Adicionar lembrete
                              </Button>
                              {showingOptions ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {reminderOptions.map((option) => {
                                    const exists = reminders.some(
                                      (reminder) =>
                                        reminder.minutes_before === option.value
                                    );

                                    return (
                                      <button
                                        className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-[#534AB7] transition hover:border-[#534AB7] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-[#9CA3AF]"
                                        disabled={exists}
                                        key={option.value}
                                        onClick={() =>
                                          void addReminder(
                                            task.id,
                                            option.value
                                          )
                                        }
                                        type="button"
                                      >
                                        {option.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-[#6B7280]">
            Nenhuma tarefa encontrada para este filtro.
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[#F2D49B] bg-[#FAEEDA] p-5">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-[#854F0B]" />
          <div>
            <h2 className="text-base font-semibold text-[#5F3B08]">
              Tarefas sem lembrete
            </h2>
            <p className="text-xs text-[#854F0B]">
              Próximas tarefas dos próximos 7 dias.
            </p>
          </div>
        </div>

        {tasksWithoutReminders.length ? (
          <div className="space-y-2">
            {tasksWithoutReminders.map((task) => (
              <article
                className="flex flex-col gap-3 rounded-lg bg-white/75 px-3 py-3 sm:flex-row sm:items-center"
                key={task.id}
              >
                <Clock3 className="h-4 w-4 shrink-0 text-[#854F0B]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#111827]">
                    {task.title}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {formatTaskDateTime(task)}
                  </p>
                </div>
                <Button
                  onClick={() => setTaskForModal(task)}
                  type="button"
                  variant="outline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar lembrete
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#854F0B]">
            Todas as próximas tarefas já têm lembretes.
          </p>
        )}
      </section>

      {taskForModal ? (
        <ReminderModal
          isOpen
          onClose={() => {
            setTaskForModal(null);
            void fetchAll();
          }}
          task={taskForModal}
        />
      ) : null}
    </section>
  );
}

function formatTaskDateTime(task: Task) {
  const date = parseDateKey(task.task_date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short"
  });
  return `${date} às ${task.task_time ?? "08:00"}`;
}

function formatReminderLabel(minutesBefore: number) {
  if (minutesBefore === 1440) {
    return "1 dia antes";
  }

  if (minutesBefore >= 60 && minutesBefore % 60 === 0) {
    const hours = minutesBefore / 60;
    return `${hours} hora${hours === 1 ? "" : "s"} antes`;
  }

  return `${minutesBefore} min antes`;
}
