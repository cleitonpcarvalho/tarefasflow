"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { taskColorHex } from "@/lib/task-colors";
import { todayKey } from "@/lib/date";
import type { CreateTaskInput, Task, TaskColor } from "@/types";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTaskInput) => Promise<void>;
  initialDate?: string;
  task?: Task | null;
}

const colors: TaskColor[] = ["purple", "teal", "coral", "amber"];

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  initialDate,
  task
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [taskDate, setTaskDate] = useState(todayKey());
  const [taskTime, setTaskTime] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<TaskColor>("purple");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTitle(task?.title ?? "");
    setTaskDate(task?.task_date ?? initialDate ?? todayKey());
    setTaskTime(task?.task_time ?? "");
    setDescription(task?.description ?? "");
    setColor(task?.color ?? "purple");
    setError("");
    setSaving(false);
  }, [initialDate, isOpen, task]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !taskDate) {
      setError("Informe título e data para salvar.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      await onSave({
        title: title.trim(),
        task_date: taskDate,
        task_time: taskTime || undefined,
        description: description.trim() || undefined,
        color
      });
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Erro ao salvar tarefa."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="w-[90vw] max-w-[480px] rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#111827]">
            {task ? "Editar tarefa" : "Nova tarefa"}
          </h2>
          <button
            aria-label="Fechar modal"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b7280] transition hover:bg-[#f3f4f6]"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#111827]">
              Título
            </span>
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-[#534AB7] focus:ring-4 focus:ring-[#EEEDFE]"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Nome da tarefa..."
              required
              value={title}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#111827]">
                Data
              </span>
              <input
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-[#534AB7] focus:ring-4 focus:ring-[#EEEDFE]"
                onChange={(event) => setTaskDate(event.target.value)}
                required
                type="date"
                value={taskDate}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#111827]">
                Horário
              </span>
              <input
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-[#534AB7] focus:ring-4 focus:ring-[#EEEDFE]"
                onChange={(event) => setTaskTime(event.target.value)}
                placeholder="HH:MM"
                type="time"
                value={taskTime}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#111827]">
              Descrição
            </span>
            <textarea
              className="min-h-24 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#534AB7] focus:ring-4 focus:ring-[#EEEDFE]"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descrição..."
              rows={3}
              value={description}
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-medium text-[#111827]">Cor</p>
            <div className="flex items-center gap-3">
              {colors.map((item) => (
                <button
                  aria-label={`Selecionar cor ${item}`}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 border-transparent transition",
                    color === item && "border-[#534AB7] ring-4 ring-[#EEEDFE]"
                  )}
                  key={item}
                  onClick={() => setColor(item)}
                  style={{ backgroundColor: taskColorHex[item] }}
                  type="button"
                />
              ))}
            </div>
          </div>

          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button onClick={onClose} type="button" variant="secondary">
              Cancelar
            </Button>
            <Button disabled={saving} type="submit">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
