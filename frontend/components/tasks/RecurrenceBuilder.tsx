"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  dateToInputValue,
  describeRecurrence,
  parseDateInput
} from "@/lib/rrule-builder";
import type {
  RecurrenceFrequency,
  RecurrenceOptions
} from "@/types";

interface RecurrenceBuilderProps {
  value: RecurrenceOptions | null;
  onChange: (options: RecurrenceOptions | null) => void;
}

type EndMode = "never" | "until" | "count";

const frequencies: Array<{
  value: RecurrenceFrequency;
  label: string;
}> = [
  { value: "daily", label: "Diária" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" }
];

const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const weekdayNames = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo"
];
const weeks = [
  { value: 1, label: "1º" },
  { value: 2, label: "2º" },
  { value: 3, label: "3º" },
  { value: 4, label: "4º" },
  { value: -1, label: "Último" }
] as const;

export function RecurrenceBuilder({
  value,
  onChange
}: RecurrenceBuilderProps) {
  const enabled = Boolean(value);
  const options = value ?? defaultOptions();
  const endMode = getEndMode(options);

  function update(patch: Partial<RecurrenceOptions>) {
    onChange({ ...options, ...patch });
  }

  function changeFrequency(frequency: RecurrenceFrequency) {
    if (frequency === "daily") {
      update({
        frequency,
        weekdays: undefined,
        monthlyMode: undefined,
        monthDay: undefined,
        monthWeekday: undefined
      });
      return;
    }

    if (frequency === "weekly") {
      update({
        frequency,
        weekdays: options.weekdays?.length ? options.weekdays : [0],
        monthlyMode: undefined,
        monthDay: undefined,
        monthWeekday: undefined
      });
      return;
    }

    update({
      frequency,
      weekdays: undefined,
      monthlyMode: options.monthlyMode ?? "monthDay",
      monthDay: options.monthDay ?? 1,
      monthWeekday: options.monthWeekday ?? { week: 1, day: 0 }
    });
  }

  function changeEndMode(mode: EndMode) {
    if (mode === "until") {
      update({
        until: options.until ?? parseDateInput(dateToInputValue(new Date())),
        count: undefined
      });
      return;
    }

    if (mode === "count") {
      update({ until: undefined, count: options.count ?? 10 });
      return;
    }

    update({ until: undefined, count: undefined });
  }

  function toggleWeekday(day: number) {
    const selected = options.weekdays ?? [];
    update({
      weekdays: selected.includes(day)
        ? selected.filter((item) => item !== day)
        : [...selected, day].sort()
    });
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-[#F9FAFB] p-4 dark:border-tf-dark-border dark:bg-tf-dark-bg-page">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#111827] dark:text-tf-dark-text-primary">
            Tarefa recorrente
          </p>
          <p className="mt-0.5 text-xs text-[#6B7280] dark:text-tf-dark-text-muted">
            Repita esta tarefa automaticamente.
          </p>
        </div>
        <button
          aria-checked={enabled}
          aria-label="Tarefa recorrente"
          className={cn(
            "relative h-6 w-11 rounded-full transition",
            enabled ? "bg-[#534AB7]" : "bg-slate-300 dark:bg-tf-dark-border"
          )}
          data-testid="recurrence-toggle"
          onClick={() => onChange(enabled ? null : defaultOptions())}
          role="switch"
          type="button"
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition dark:bg-tf-dark-text-primary",
              enabled ? "left-[22px]" : "left-0.5"
            )}
          />
        </button>
      </div>

      {enabled ? (
        <div className="mt-4 space-y-4 border-t border-slate-200 pt-4 dark:border-tf-dark-border-light">
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-[#374151] dark:text-tf-dark-text-muted">
              Frequência
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {frequencies.map((item) => (
                <button
                  aria-pressed={options.frequency === item.value}
                  className={cn(
                    "h-9 rounded-lg border text-xs font-medium transition",
                    options.frequency === item.value
                      ? "border-[#534AB7] bg-[#EEEDFE] text-[#534AB7] dark:bg-tf-dark-purple-light"
                      : "border-slate-200 bg-white text-[#6B7280] hover:border-slate-300 dark:border-tf-dark-border dark:bg-tf-dark-bg-card dark:text-tf-dark-text-muted"
                  )}
                  key={item.value}
                  onClick={() => changeFrequency(item.value)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          {options.frequency === "daily" ? (
            <label className="flex items-center gap-2 text-xs text-[#374151] dark:text-tf-dark-text-muted">
              A cada
              <NumberInput
                ariaLabel="Intervalo em dias"
                max={365}
                min={1}
                onChange={(interval) => update({ interval })}
                value={options.interval ?? 1}
              />
              dias
            </label>
          ) : null}

          {options.frequency === "weekly" ? (
            <fieldset>
              <legend className="mb-2 text-xs font-medium text-[#374151] dark:text-tf-dark-text-muted">
                Dias da semana
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {weekdays.map((day, index) => {
                  const selected = options.weekdays?.includes(index) ?? false;

                  return (
                    <button
                      aria-pressed={selected}
                      className={cn(
                        "h-8 min-w-10 rounded-full border px-2 text-xs font-medium transition",
                        selected
                          ? "border-[#534AB7] bg-[#EEEDFE] text-[#534AB7] dark:bg-tf-dark-purple-light"
                          : "border-slate-200 bg-white text-[#6B7280] dark:border-tf-dark-border dark:bg-tf-dark-bg-card dark:text-tf-dark-text-muted"
                      )}
                      key={day}
                      onClick={() => toggleWeekday(index)}
                      type="button"
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              {!options.weekdays?.length ? (
                <p className="mt-2 text-xs font-medium text-rose-600">
                  Selecione ao menos um dia.
                </p>
              ) : null}
            </fieldset>
          ) : null}

          {options.frequency === "monthly" ? (
            <fieldset className="space-y-3">
              <legend className="text-xs font-medium text-[#374151] dark:text-tf-dark-text-muted">
                Padrão mensal
              </legend>
              <label className="flex flex-wrap items-center gap-2 text-xs text-[#374151] dark:text-tf-dark-text-muted">
                <input
                  checked={options.monthlyMode !== "monthWeekday"}
                  className="accent-[#534AB7]"
                  name="monthly-mode"
                  onChange={() => update({ monthlyMode: "monthDay" })}
                  type="radio"
                />
                Todo dia
                <NumberInput
                  ariaLabel="Dia do mês"
                  max={31}
                  min={1}
                  onChange={(monthDay) => update({ monthDay })}
                  value={options.monthDay ?? 1}
                />
                do mês
              </label>
              <label className="flex flex-wrap items-center gap-2 text-xs text-[#374151] dark:text-tf-dark-text-muted">
                <input
                  checked={options.monthlyMode === "monthWeekday"}
                  className="accent-[#534AB7]"
                  name="monthly-mode"
                  onChange={() =>
                    update({
                      monthlyMode: "monthWeekday",
                      monthWeekday: options.monthWeekday ?? {
                        week: 1,
                        day: 0
                      }
                    })
                  }
                  type="radio"
                />
                Todo
                <select
                  aria-label="Semana do mês"
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 outline-none focus:border-[#534AB7] dark:border-tf-dark-border dark:bg-tf-dark-bg-sidebar dark:text-tf-dark-text-primary"
                  onChange={(event) =>
                    update({
                      monthWeekday: {
                        week: Number(event.target.value) as 1 | 2 | 3 | 4 | -1,
                        day: options.monthWeekday?.day ?? 0
                      }
                    })
                  }
                  value={options.monthWeekday?.week ?? 1}
                >
                  {weeks.map((week) => (
                    <option key={week.value} value={week.value}>
                      {week.label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Dia da semana mensal"
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 outline-none focus:border-[#534AB7] dark:border-tf-dark-border dark:bg-tf-dark-bg-sidebar dark:text-tf-dark-text-primary"
                  onChange={(event) =>
                    update({
                      monthWeekday: {
                        week: options.monthWeekday?.week ?? 1,
                        day: Number(event.target.value)
                      }
                    })
                  }
                  value={options.monthWeekday?.day ?? 0}
                >
                  {weekdayNames.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>
          ) : null}

          <fieldset className="space-y-2">
            <legend className="mb-1 text-xs font-medium text-[#374151] dark:text-tf-dark-text-muted">
              Fim da recorrência
            </legend>
            <EndOption
              checked={endMode === "never"}
              label="Sem fim definido"
              onChange={() => changeEndMode("never")}
            />
            <EndOption
              checked={endMode === "until"}
              label="Termina em"
              onChange={() => changeEndMode("until")}
            >
              <input
                aria-label="Data final da recorrência"
                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-[#534AB7] dark:border-tf-dark-border dark:bg-tf-dark-bg-sidebar dark:text-tf-dark-text-primary"
                disabled={endMode !== "until"}
                onChange={(event) =>
                  update({
                    until: event.target.value
                      ? parseDateInput(event.target.value)
                      : undefined,
                    count: undefined
                  })
                }
                type="date"
                value={dateToInputValue(options.until)}
              />
            </EndOption>
            <EndOption
              checked={endMode === "count"}
              label="Após"
              onChange={() => changeEndMode("count")}
            >
              <NumberInput
                ariaLabel="Quantidade de ocorrências"
                disabled={endMode !== "count"}
                max={999}
                min={1}
                onChange={(count) => update({ count, until: undefined })}
                value={options.count ?? 10}
              />
              <span>ocorrências</span>
            </EndOption>
          </fieldset>

          <div
            className="flex items-start gap-2 rounded-lg bg-[#EEEDFE] px-3 py-2.5 text-xs font-medium text-[#534AB7] dark:bg-tf-dark-purple-light"
            data-testid="recurrence-preview"
          >
            <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{describeRecurrence(options)}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function NumberInput({
  ariaLabel,
  value,
  min,
  max,
  disabled,
  onChange
}: {
  ariaLabel: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <input
      aria-label={ariaLabel}
      className="h-9 w-16 rounded-lg border border-slate-200 bg-white px-2 text-center text-xs outline-none focus:border-[#534AB7] dark:border-tf-dark-border dark:bg-tf-dark-bg-sidebar dark:text-tf-dark-text-primary"
      disabled={disabled}
      max={max}
      min={min}
      onChange={(event) =>
        onChange(
          Math.min(max, Math.max(min, Number(event.target.value) || min))
        )
      }
      type="number"
      value={value}
    />
  );
}

function EndOption({
  checked,
  label,
  children,
  onChange
}: {
  checked: boolean;
  label: string;
  children?: React.ReactNode;
  onChange: () => void;
}) {
  return (
    <label className="flex flex-wrap items-center gap-2 text-xs text-[#374151] dark:text-tf-dark-text-muted">
      <input
        checked={checked}
        className="accent-[#534AB7]"
        name="recurrence-end"
        onChange={onChange}
        type="radio"
      />
      <span>{label}</span>
      {children}
    </label>
  );
}

function getEndMode(options: RecurrenceOptions): EndMode {
  if (options.until) {
    return "until";
  }

  return options.count ? "count" : "never";
}

function defaultOptions(): RecurrenceOptions {
  return {
    frequency: "weekly",
    interval: 1,
    weekdays: [0]
  };
}
