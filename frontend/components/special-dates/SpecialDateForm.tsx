"use client";

import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { SpecialDate } from "@/types";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

type NotifyField =
  | "notify_on_day"
  | "notify_1_day_before"
  | "notify_1_week_before"
  | "notify_1_month_before";

const NOTIFY_OPTIONS: { field: NotifyField; label: string }[] = [
  { field: "notify_on_day", label: "No dia" },
  { field: "notify_1_day_before", label: "1 dia antes" },
  { field: "notify_1_week_before", label: "1 semana antes" },
  { field: "notify_1_month_before", label: "1 mês antes" }
];

export interface SpecialDateFormValues {
  name: string;
  month: number;
  day: number;
  notify_on_day: boolean;
  notify_1_day_before: boolean;
  notify_1_week_before: boolean;
  notify_1_month_before: boolean;
}

interface SpecialDateFormProps {
  date?: SpecialDate | null;
  mode?: "inline" | "modal";
  onCancel?: () => void;
  onSave: (form: SpecialDateFormValues) => Promise<void>;
  onSkip?: () => void;
  submitLabel?: string;
}

const DEFAULT_FORM: SpecialDateFormValues = {
  name: "",
  month: 1,
  day: 1,
  notify_on_day: true,
  notify_1_day_before: false,
  notify_1_week_before: false,
  notify_1_month_before: false
};

export function SpecialDateForm({
  date = null,
  mode = "inline",
  onCancel,
  onSave,
  onSkip,
  submitLabel = "Salvar"
}: SpecialDateFormProps) {
  const titleId = useId();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SpecialDateFormValues>(
    date
      ? {
          name: date.name,
          month: date.month,
          day: date.day,
          notify_on_day: date.notify_on_day,
          notify_1_day_before: date.notify_1_day_before,
          notify_1_week_before: date.notify_1_week_before,
          notify_1_month_before: date.notify_1_month_before
        }
      : DEFAULT_FORM
  );

  useEffect(() => {
    firstInputRef.current?.focus();

    if (mode !== "modal" || !onCancel) {
      return;
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel?.();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, onCancel]);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  function setNotify(
    field: NotifyField,
    value: boolean
  ): void {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const formContent = (
    <form
      className={mode === "modal" ? "mt-5 space-y-4" : "space-y-4"}
      onSubmit={(e) => void handleSubmit(e)}
    >
      <div>
        <label
          className="mb-1 block text-xs font-medium text-[#374151] dark:text-tf-dark-text-muted"
          htmlFor="sd-name"
        >
          Nome
        </label>
        <input
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-[#111827] placeholder-[#9CA3AF] outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE] dark:border-tf-dark-border dark:bg-tf-dark-bg-sidebar dark:text-tf-dark-text-primary dark:placeholder:text-tf-dark-text-faint"
          id="sd-name"
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Aniversário da mãe, Casamento…"
          ref={firstInputRef}
          required
          type="text"
          value={form.name}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[#374151] dark:text-tf-dark-text-muted">
          Data
        </label>
        <div className="flex gap-2">
          <select
            className="w-24 rounded-md border border-slate-200 px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE] dark:border-tf-dark-border dark:bg-tf-dark-bg-sidebar dark:text-tf-dark-text-primary"
            onChange={(e) =>
              setForm((prev) => ({ ...prev, day: Number(e.target.value) }))
            }
            value={form.day}
          >
            {days.map((day) => (
              <option key={day} value={day}>
                {String(day).padStart(2, "0")}
              </option>
            ))}
          </select>
          <select
            className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE] dark:border-tf-dark-border dark:bg-tf-dark-bg-sidebar dark:text-tf-dark-text-primary"
            onChange={(e) =>
              setForm((prev) => ({ ...prev, month: Number(e.target.value) }))
            }
            value={form.month}
          >
            {MONTHS.map((name, index) => (
              <option key={index + 1} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-[#374151] dark:text-tf-dark-text-muted">
          Quando avisar
        </p>
        <div className="space-y-2">
          {NOTIFY_OPTIONS.map((option) => (
            <label
              className="flex cursor-pointer items-center gap-2 text-sm text-[#374151] dark:text-tf-dark-text-muted"
              key={option.field}
            >
              <input
                checked={Boolean(form[option.field])}
                className="h-4 w-4 cursor-pointer rounded accent-[#534AB7]"
                onChange={(e) =>
                  setNotify(option.field, e.target.checked)
                }
                type="checkbox"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div
        className={
          mode === "modal"
            ? "flex gap-3 pt-1"
            : "flex flex-col gap-3 pt-2"
        }
      >
        {mode === "modal" && onCancel ? (
          <Button
            className="flex-1"
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Cancelar
          </Button>
        ) : null}
        <button
          className={
            mode === "modal"
              ? "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-[#534AB7] bg-[#534AB7] px-3 text-[12px] font-medium text-white transition hover:bg-[#4540A3] disabled:cursor-not-allowed disabled:opacity-60"
              : "h-12 w-full rounded-[10px] bg-[#534AB7] text-sm font-semibold text-white transition-colors hover:bg-[#4339A0] disabled:opacity-60"
          }
          disabled={saving || !form.name.trim()}
          type="submit"
        >
          {saving ? "Salvando…" : submitLabel}
        </button>
        {mode === "inline" && onSkip ? (
          <Button
            className="self-center"
            onClick={onSkip}
            type="button"
            variant="outline"
          >
            Pular por agora
          </Button>
        ) : null}
      </div>
    </form>
  );

  if (mode === "inline") {
    return formContent;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 dark:bg-black/70"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-[440px] rounded-xl bg-white p-6 shadow-xl dark:bg-tf-dark-bg-card"
        role="dialog"
      >
        <div className="flex items-center justify-between">
          <h2
            className="text-[15px] font-semibold text-[#111827] dark:text-tf-dark-text-primary"
            id={titleId}
          >
            {date ? "Editar data especial" : "Nova data especial"}
          </h2>
          <button
            aria-label="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#6B7280] hover:bg-[#F3F4F6] dark:text-tf-dark-text-muted dark:hover:bg-tf-dark-bg-sidebar"
            onClick={onCancel}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {formContent}
      </section>
    </div>
  );
}
