"use client";

import { Bell, Check, Edit3, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { parseDateKey } from "@/lib/date";
import { taskColorDots } from "@/lib/task-colors";
import type { Task } from "@/types";

interface MobileDaySheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: string | null;
  tasks: Task[];
  onToggleDone: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onAddReminder: (task: Task) => void;
  onCreateTask: () => void;
}

export function MobileDaySheet({
  isOpen,
  onClose,
  date,
  tasks,
  onToggleDone,
  onEditTask,
  onDeleteTask,
  onAddReminder,
  onCreateTask
}: MobileDaySheetProps) {
  if (!isOpen || !date) {
    return null;
  }

  const formattedDate = parseDateKey(date).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.task_time && b.task_time) {
      return a.task_time.localeCompare(b.task_time);
    }

    if (a.task_time) {
      return -1;
    }

    if (b.task_time) {
      return 1;
    }

    return a.title.localeCompare(b.title);
  });

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />

        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold capitalize text-slate-900">
            {formattedDate}
          </h2>
          <button
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 h-px bg-slate-100" />

        {sortedTasks.length > 0 ? (
          <div>
            {sortedTasks.map((task) => (
              <article
                className="flex gap-3 border-b border-slate-100 py-3"
                key={task.id}
              >
                <button
                  aria-label="Alternar tarefa concluída"
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition",
                    task.done
                      ? "border-[#534AB7] bg-[#534AB7] text-white"
                      : "border-slate-300 text-transparent"
                  )}
                  onClick={() => onToggleDone(task.id)}
                  type="button"
                >
                  <Check className="h-3 w-3" />
                </button>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-slate-400">
                    {task.task_time ? task.task_time.slice(0, 5) : "Dia todo"}
                  </p>
                  <p
                    className={cn(
                      "text-[13px] text-slate-900",
                      task.done && "text-slate-400 line-through"
                    )}
                  >
                    {task.title}
                  </p>
                </div>

                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    taskColorDots[task.color]
                  )}
                />

                <div className="flex shrink-0 items-start gap-1">
                  <button
                    aria-label="Editar"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => {
                      onClose();
                      onEditTask(task);
                    }}
                    type="button"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    aria-label="Lembrete"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => {
                      onClose();
                      onAddReminder(task);
                    }}
                    type="button"
                  >
                    <Bell className="h-3.5 w-3.5" />
                  </button>
                  <button
                    aria-label="Deletar"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => onDeleteTask(task)}
                    type="button"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))}

            <div className="mt-4">
              <Button onClick={onCreateTask} type="button" variant="outline">
                <Plus className="h-3.5 w-3.5" />
                Adicionar tarefa
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <p className="mb-3 text-[13px] text-slate-400">
              Nenhuma tarefa para este dia
            </p>
            <Button onClick={onCreateTask} type="button" variant="outline">
              <Plus className="h-3.5 w-3.5" />
              Adicionar tarefa
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
