"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { taskColorClasses } from "@/lib/task-colors";
import { toDateKey } from "@/lib/date";
import type { Task } from "@/types";

interface WeekViewProps {
  tasks: Task[];
  currentDate: Date;
  onSelectTask: (task: Task) => void;
  onCreateTask: (date: string, time: string) => void;
}

const hours = Array.from({ length: 24 }, (_, hour) => hour);
const hourHeight = 60;
const timelineHeight = hours.length * hourHeight;

export function WeekView({
  tasks,
  currentDate,
  onSelectTask,
  onCreateTask
}: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());
  const days = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const today = toDateKey(now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const target = days.some((day) => toDateKey(day) === today)
      ? currentMinutes
      : 8 * 60;

    scrollRef.current?.scrollTo({
      top: Math.max(0, target - 180),
      behavior: "instant"
    });
  }, [days, today]);

  return (
    <section className="overflow-hidden rounded-lg border border-tf-border bg-white">
      <div className="grid grid-cols-[48px_repeat(7,minmax(104px,1fr))] border-b border-tf-border bg-white">
        <div />
        {days.map((day) => {
          const dateKey = toDateKey(day);
          return (
            <div
              className={cn(
                "border-l border-tf-border-light px-2 py-2 text-center",
                dateKey === today && "text-[#534AB7]"
              )}
              key={dateKey}
            >
              <p className="text-[10px] font-medium uppercase">
                {day.toLocaleDateString("pt-BR", { weekday: "short" }).replace(
                  ".",
                  ""
                )}
              </p>
              <p className="mt-0.5 text-[13px] font-semibold">
                {day.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      <div
        className="max-h-[calc(100vh-190px)] min-h-[480px] overflow-auto"
        ref={scrollRef}
      >
        <div
          className="grid min-w-[780px] grid-cols-[48px_repeat(7,minmax(104px,1fr))]"
          style={{ height: timelineHeight }}
        >
          <TimeLabels />

          {days.map((day) => {
            const dateKey = toDateKey(day);
            const dayTasks = tasks.filter(
              (task) => task.task_date === dateKey && task.task_time
            );

            return (
              <div
                className="relative border-l border-tf-border-light bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_59px,#F3F4F6_59px,#F3F4F6_60px)]"
                data-date={dateKey}
                data-testid="week-day-column"
                key={dateKey}
                onClick={(event) =>
                  onCreateTask(dateKey, timeFromPointer(event))
                }
                role="presentation"
              >
                {dayTasks.map((task) => (
                  <button
                    className={cn(
                      "absolute left-1 right-1 z-10 min-h-[56px] overflow-hidden rounded-md px-2 py-1.5 text-left text-[11px] shadow-sm transition hover:brightness-95",
                      taskColorClasses[task.color],
                      task.done && "opacity-55"
                    )}
                    key={task.id}
                    data-task-id={task.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectTask(task);
                    }}
                    style={{ top: minutesFromTime(task.task_time) }}
                    title={task.title}
                    type="button"
                  >
                    <span className="block font-semibold">
                      {formatTaskTime(task.task_time)}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 flex items-center gap-1 truncate",
                        task.done && "line-through"
                      )}
                    >
                      {task.is_recurring ? (
                        <RefreshCw className="h-2.5 w-2.5 shrink-0" />
                      ) : null}
                      <span className="truncate">{task.title}</span>
                    </span>
                  </button>
                ))}

                {dateKey === today ? <CurrentTimeLine now={now} /> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TimeLabels() {
  return (
    <div className="relative">
      {hours.map((hour) => (
        <span
          className="absolute right-2 -translate-y-1/2 text-[11px] text-[#9CA3AF]"
          key={hour}
          style={{ top: hour * hourHeight }}
        >
          {String(hour).padStart(2, "0")}:00
        </span>
      ))}
    </div>
  );
}

function CurrentTimeLine({ now }: { now: Date }) {
  const minutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-20 border-t border-red-500"
      style={{ top: minutes }}
    >
      <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
    </div>
  );
}

function getWeekDays(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function minutesFromTime(time: string | null) {
  if (!time) {
    return 0;
  }

  const [hoursValue, minutesValue] = time.split(":").map(Number);
  return hoursValue * 60 + minutesValue;
}

function formatTaskTime(time: string | null) {
  return time?.slice(0, 5) ?? "Dia todo";
}

function timeFromPointer(event: React.MouseEvent<HTMLDivElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  const minutes = Math.max(
    0,
    Math.min(23 * 60 + 45, Math.floor((event.clientY - bounds.top) / 15) * 15)
  );
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
