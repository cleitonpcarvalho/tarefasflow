"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { toDateKey } from "@/lib/date";
import { taskColorClasses } from "@/lib/task-colors";
import type { Task } from "@/types";

interface CalendarGridProps {
  tasks: Task[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  currentMonth: number;
  currentYear: number;
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
  currentMonth,
  currentYear
}: CalendarGridProps) {
  const cells = buildCalendarCells(currentMonth, currentYear);

  return (
    <section>
      <div className="overflow-hidden rounded-lg border border-tf-border bg-white dark:border-tf-dark-border dark:bg-tf-dark-bg-card">
        <div className="grid grid-cols-7 border-b border-tf-border bg-tf-bg-page dark:border-tf-dark-border dark:bg-tf-dark-bg-page">
          {weekDays.map((day) => (
            <div
              className="px-1.5 py-1.5 text-center text-[11px] font-medium text-tf-text-faint dark:text-tf-dark-text-faint"
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
                  "min-h-20 border-b border-r border-tf-border-light bg-white p-1.5 text-left transition duration-100 hover:bg-tf-bg-page dark:border-tf-dark-border-light dark:bg-tf-dark-bg-card dark:hover:bg-tf-dark-bg-page",
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
                    "dark:text-tf-dark-text-muted",
                    cell.isToday &&
                      "rounded-full bg-tf-purple font-semibold text-white dark:text-white"
                  )}
                >
                  {cell.date.getDate()}
                </span>

                {dayTasks.length > 0 ? (
                  <span className="block space-y-0.5">
                    {dayTasks.slice(0, 2).map((task) => (
                      <span
                        className={cn(
                          "flex items-center gap-1 truncate rounded px-1.5 py-px text-[10px]",
                          taskColorClasses[task.color]
                        )}
                        key={task.id}
                        title={
                          task.description
                            ? `${task.title} — ${task.description}`
                            : task.title
                        }
                      >
                        {task.is_recurring ? (
                          <RefreshCw
                            aria-label="Tarefa recorrente"
                            className="h-2.5 w-2.5 shrink-0"
                          />
                        ) : null}
                        {task.task_time ? (
                          <strong className="shrink-0 font-bold">
                            {task.task_time.slice(0, 5)}
                          </strong>
                        ) : null}
                        <span className="truncate font-normal">{task.title}</span>
                      </span>
                    ))}
                    {dayTasks.length > 2 ? (
                      <span className="block text-[10px] font-medium text-tf-text-faint dark:text-tf-dark-text-faint">
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
