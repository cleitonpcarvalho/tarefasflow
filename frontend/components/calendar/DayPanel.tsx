"use client";

import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  Trash2,
  Wifi
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  combineDateTime,
  humanizeFutureDistance,
  parseDateKey,
  todayKey
} from "@/lib/date";
import { taskColorDots } from "@/lib/task-colors";
import type { Task } from "@/types";

interface DayPanelProps {
  date: string | null;
  tasks: Task[];
  open: boolean;
  onToggleOpen: () => void;
  onToggleDone: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAddReminder: (task: Task) => void;
  onCreateTask: () => void;
}

export function DayPanel({
  date,
  tasks,
  open,
  onToggleOpen,
  onToggleDone,
  onEditTask,
  onDeleteTask,
  onAddReminder,
  onCreateTask
}: DayPanelProps) {
  const selectedDate = date ?? todayKey();
  const sortedTasks = [...tasks].sort((left, right) => {
    if (left.task_time && right.task_time) {
      return left.task_time.localeCompare(right.task_time);
    }

    if (left.task_time) {
      return -1;
    }

    if (right.task_time) {
      return 1;
    }

    return left.title.localeCompare(right.title);
  });
  const upcomingTasks = getUpcomingTasks(sortedTasks);

  return (
    <aside
      className={cn(
        "relative h-[calc(100vh-56px)] shrink-0 bg-white transition-[width] duration-200 ease-in-out",
        open ? "w-[240px] border-l border-tf-border" : "w-0 border-l-0"
      )}
    >
      <button
        aria-label={open ? "Esconder painel" : "Mostrar painel"}
        className="absolute left-0 top-1/2 z-20 flex h-9 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border border-tf-border bg-white text-tf-text-muted shadow-sm transition hover:text-tf-purple"
        onClick={onToggleOpen}
        type="button"
      >
        {open ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      <div
        className={cn(
          "h-full overflow-y-auto px-4 py-5 transition-opacity duration-150",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <section>
          <h3 className="mb-2.5 text-[12px] font-medium capitalize text-tf-text-muted">
            {formatPanelTitle(selectedDate)}
          </h3>

          {sortedTasks.length > 0 ? (
            <div>
              {sortedTasks.map((task) => (
                <article
                  className="group flex gap-2 border-b border-tf-border-light py-2"
                  key={task.id}
                >
                  <button
                    aria-label="Alternar tarefa concluída"
                    className={cn(
                      "mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition",
                      task.done
                        ? "border-tf-purple bg-tf-purple text-white"
                        : "border-slate-300 text-transparent hover:border-tf-purple"
                    )}
                    onClick={() => onToggleDone(task.id)}
                    type="button"
                  >
                    <Check className="h-2.5 w-2.5" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] leading-4 text-tf-text-faint">
                      {task.task_time ?? "Dia todo"}
                    </p>
                    <p
                      className={cn(
                        "truncate text-[12px] leading-5 text-tf-text-primary",
                        task.done && "text-tf-text-faint line-through"
                      )}
                    >
                      {task.title}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-start gap-0.5 opacity-0 transition group-hover:opacity-100">
                    <IconButton label="Editar" onClick={() => onEditTask(task)}>
                      <Edit3 className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton
                      label="Lembrete"
                      onClick={() => onAddReminder(task)}
                    >
                      <Bell className="h-3.5 w-3.5" />
                    </IconButton>
                    <IconButton
                      label="Deletar"
                      onClick={() => onDeleteTask(task.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-2">
              <p className="mb-3 text-[12px] text-tf-text-faint">
                Nenhuma tarefa para este dia
              </p>
              <Button onClick={onCreateTask} type="button" variant="outline">
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>
          )}
        </section>

        <section className="mt-6">
          <h3 className="mb-2.5 text-[12px] font-medium text-tf-text-muted">
            Lembretes próximos
          </h3>
          {upcomingTasks.length > 0 ? (
            <div>
              {upcomingTasks.map((task) => {
                const targetDate = combineDateTime(
                  task.task_date,
                  task.task_time
                );

                return (
                  <div
                    className="mb-1.5 flex gap-2 rounded-md bg-tf-bg-page p-2"
                    key={task.id}
                  >
                    <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tf-purple" />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] text-tf-text-primary">
                        {task.title}
                      </p>
                      <p className="text-[11px] text-tf-text-muted">
                        {targetDate ? humanizeFutureDistance(targetDate) : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "mt-1 h-2 w-2 shrink-0 rounded-full",
                        taskColorDots[task.color]
                      )}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-md bg-tf-bg-page p-2 text-[12px] text-tf-text-muted">
              Nenhum lembrete nas próximas 24h.
            </p>
          )}
        </section>

        <div className="mt-6 rounded-md border border-[#9FE1CB] bg-tf-teal-bg p-2.5 text-tf-teal-text">
          <div className="flex items-center gap-2 text-[12px] font-medium">
            <Wifi className="h-4 w-4" />
            Agente ativo
          </div>
        </div>
      </div>
    </aside>
  );
}

function IconButton({
  children,
  label,
  onClick
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="flex h-6 w-6 items-center justify-center rounded-md text-tf-text-faint transition hover:bg-tf-bg-page hover:text-tf-text-primary"
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function formatPanelTitle(date: string) {
  const parsedDate = parseDateKey(date);
  const dayMonth = parsedDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short"
  });

  return `${date === todayKey() ? "Hoje" : "Dia"} — ${dayMonth}`;
}

function getUpcomingTasks(tasks: Task[]) {
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return tasks.filter((task) => {
    const targetDate = combineDateTime(task.task_date, task.task_time);
    return targetDate ? targetDate >= now && targetDate <= next24Hours : false;
  });
}
