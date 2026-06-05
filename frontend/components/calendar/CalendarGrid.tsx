"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatMonthYear, todayKey, toDateKey } from "@/lib/date";
import { taskColorClasses } from "@/lib/task-colors";
import type { Task } from "@/types";

interface CalendarGridProps {
  tasks: Task[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onCreateTask: (date: string) => void;
  currentMonth: number;
  currentYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

interface CalendarCell {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
}

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarGrid({
  tasks,
  selectedDate,
  onSelectDate,
  onCreateTask,
  currentMonth,
  currentYear,
  onPrevMonth,
  onNextMonth
}: CalendarGridProps) {
  const cells = buildCalendarCells(currentMonth, currentYear);
  const createDate = selectedDate ?? todayKey();

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            aria-label="Mês anterior"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-tf-border text-tf-text-muted transition hover:bg-tf-bg-page"
            onClick={onPrevMonth}
            type="button"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            aria-label="Próximo mês"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-tf-border text-tf-text-muted transition hover:bg-tf-bg-page"
            onClick={onNextMonth}
            type="button"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <h2 className="ml-2 text-[15px] font-medium capitalize text-tf-text-primary">
            {formatMonthYear(currentMonth, currentYear)}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            {["Mês", "Semana", "Dia"].map((view) => (
              <button
                className={cn(
                  "h-7 rounded-md border border-tf-border px-2.5 text-[11px] font-medium transition",
                  view === "Mês"
                    ? "bg-tf-border-light text-tf-text-primary"
                    : "text-tf-text-muted hover:bg-tf-bg-page"
                )}
                key={view}
                type="button"
              >
                {view}
              </button>
            ))}
          </div>
          <Button onClick={() => onCreateTask(createDate)} type="button">
            <Plus className="h-3.5 w-3.5" />
            Nova tarefa
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-tf-border bg-white">
        <div className="grid grid-cols-7 border-b border-tf-border bg-tf-bg-page">
          {weekDays.map((day) => (
            <div
              className="px-1.5 py-1.5 text-center text-[11px] font-medium text-tf-text-faint"
              key={day}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell) => {
            const dayTasks = cell.isCurrentMonth
              ? tasks.filter((task) => task.task_date === cell.dateKey)
              : [];
            const selected = selectedDate === cell.dateKey;

            return (
              <button
                aria-label={`Selecionar ${cell.dateKey}`}
                className={cn(
                  "min-h-20 border-b border-r border-tf-border-light bg-white p-1.5 text-left transition duration-100 hover:bg-tf-bg-page",
                  !cell.isCurrentMonth && "opacity-35",
                  selected &&
                    "relative z-10 outline outline-[1.5px] -outline-offset-[1.5px] outline-tf-purple"
                )}
                key={cell.dateKey}
                onClick={() => onSelectDate(cell.dateKey)}
                type="button"
              >
                <span
                  className={cn(
                    "mb-1 inline-block h-[22px] w-[22px] text-center text-[12px] font-medium leading-[22px] text-tf-text-muted",
                    cell.isToday &&
                      "rounded-full bg-tf-purple font-semibold text-white"
                  )}
                >
                  {cell.date.getDate()}
                </span>

                {dayTasks.length > 0 ? (
                  <span className="block space-y-0.5">
                    {dayTasks.slice(0, 2).map((task) => (
                      <span
                        className={cn(
                          "block truncate rounded px-1.5 py-px text-[10px] font-medium",
                          taskColorClasses[task.color]
                        )}
                        key={task.id}
                        title={task.title}
                      >
                        {task.title}
                      </span>
                    ))}
                    {dayTasks.length > 2 ? (
                      <span className="block text-[10px] font-medium text-tf-text-faint">
                        +{dayTasks.length - 2}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function buildCalendarCells(month: number, year: number): CalendarCell[] {
  const firstDay = new Date(year, month - 1, 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  const lastDay = new Date(year, month, 0);
  const lastGridDay = new Date(lastDay);
  lastGridDay.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

  const cellCount =
    Math.round((lastGridDay.getTime() - start.getTime()) / 86400000) + 1;
  const today = toDateKey(new Date());

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateKey = toDateKey(date);

    return {
      date,
      dateKey,
      isCurrentMonth: date.getMonth() === month - 1,
      isToday: dateKey === today
    };
  });
}
