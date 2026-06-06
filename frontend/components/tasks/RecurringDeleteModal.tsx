"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Task } from "@/types";

interface RecurringDeleteModalProps {
  task: Task | null;
  onCancel: () => void;
  onDelete: (scope: "this" | "all") => void;
}

export function RecurringDeleteModal({
  task,
  onCancel,
  onDelete
}: RecurringDeleteModalProps) {
  if (!task) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section
        aria-labelledby="recurring-delete-title"
        aria-modal="true"
        className="w-full max-w-[430px] rounded-xl bg-white p-6 shadow-xl"
        role="dialog"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EEEDFE] text-[#534AB7]">
          <RefreshCw className="h-5 w-5" />
        </div>
        <h2
          className="mt-3 text-center text-base font-semibold text-[#111827]"
          id="recurring-delete-title"
        >
          Excluir tarefa recorrente
        </h2>
        <p className="mt-2 text-center text-sm leading-5 text-[#6B7280]">
          Deseja excluir somente esta ocorrência de “{task.title}” ou toda a
          série?
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          <Button onClick={onCancel} type="button" variant="secondary">
            Cancelar
          </Button>
          <Button onClick={() => onDelete("this")} type="button" variant="outline">
            Só esta
          </Button>
          <button
            className="inline-flex h-8 items-center justify-center rounded-md bg-rose-600 px-3 text-xs font-medium text-white transition hover:bg-rose-700"
            onClick={() => onDelete("all")}
            type="button"
          >
            Toda a série
          </button>
        </div>
      </section>
    </div>
  );
}
