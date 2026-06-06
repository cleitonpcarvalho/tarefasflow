"use client";

import { useEffect, useRef, useState } from "react";
import { Edit3, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { taskColorClasses, taskColorDots } from "@/lib/task-colors";
import { todayKey } from "@/lib/date";
import type { Task } from "@/types";

interface DayViewProps {
  tasks: Task[];
  date: string;
  onSelectTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onCreateTask: (date: string, time: string) => void;
}

const hours = Array.from({ length: 24 }, (_, hour) => hour);
const timelineHeight = 24 * 60;

export function DayView({
  tasks,
  date,
  onSelectTask,
  onDeleteTask,
  onCreateTask
}: DayViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());
  const timedTasks = tasks.filter((task) => task.task_time);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const target =
      date === todayKey() ? now.getHours() * 60 + now.getMinutes() : 8 * 60;
    scrollRef.current?.scrollTo({
      top: Math.max(0, target - 180),
      behavior: "instant"
    });
  }, [date]);

  return (
    <section className="overflow-hidden rounded-lg border border-tf-border bg-white">
      <div className="grid grid-cols-[56px_1fr] border-b border-tf-border bg-white">
        <div />
        <div className="border-l border-tf-border-light px-4 py-3">
          <p className="text-[13px] font-semibold capitalize text-tf-text-primary">
            {formatDayHeader(date)}
          </p>
        </div>
      </div>

      <div
        className="max-h-[calc(100vh-190px)] min-h-[480px] overflow-auto"
        ref={scrollRef}
      >
        <div
          className="grid grid-cols-[56px_1fr]"
          style={{ height: timelineHeight }}
        >
          <div className="relative">
            {hours.map((hour) => (
              <span
                className="absolute right-2 -translate-y-1/2 text-[11px] text-[#9CA3AF]"
                key={hour}
                style={{ top: hour * 60 }}
              >
                {String(hour).padStart(2, "0")}:00
              </span>
            ))}
          </div>

          <div
            className="relative border-l border-tf-border-light bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_59px,#F3F4F6_59px,#F3F4F6_60px)]"
            data-date={date}
            data-testid="day-timeline"
            onClick={(event) => onCreateTask(date, timeFromPointer(event))}
            role="presentation"
          >
            {timedTasks.map((task) => (
              <article
                className={cn(
                  "absolute left-2 right-3 z-10 flex min-h-[56px] items-start gap-3 overflow-hidden rounded-md px-3 py-2 shadow-sm",
                  taskColorClasses[task.color],
                  task.done && "opacity-55"
                )}
                key={task.id}
                data-task-id={task.id}
                onClick={(event) => event.stopPropagation()}
                style={{ top: minutesFromTime(task.task_time) }}
              >
                <span
                  className={cn(
                    "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                    taskColorDots[task.color]
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold">
                    {task.task_time?.slice(0, 5)}
                  </p>
                  <p
                    className={cn(
                      "text-[13px] font-semibold",
                      task.done && "line-through"
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {task.is_recurring ? (
                        <RefreshCw className="h-3 w-3" />
                      ) : null}
                      {task.title}
                    </span>
                  </p>
                  {task.description ? (
                    <p className="mt-0.5 line-clamp-2 text-[11px] opacity-80">
                      {task.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    aria-label={`Editar ${task.title}`}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-white/60 transition hover:bg-white"
                    onClick={() => onSelectTask(task)}
                    type="button"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    aria-label={`Deletar ${task.title}`}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-white/60 transition hover:bg-white"
                    onClick={() => onDeleteTask(task)}
                    type="button"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))}

            {date === todayKey() ? <CurrentTimeLine now={now} /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function CurrentTimeLine({ now }: { now: Date }) {
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-20 border-t border-red-500"
      style={{ top: now.getHours() * 60 + now.getMinutes() }}
    >
      <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
    </div>
  );
}

function formatDayHeader(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function minutesFromTime(time: string | null) {
  if (!time) {
    return 0;
  }

  const [hoursValue, minutesValue] = time.split(":").map(Number);
  return hoursValue * 60 + minutesValue;
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
