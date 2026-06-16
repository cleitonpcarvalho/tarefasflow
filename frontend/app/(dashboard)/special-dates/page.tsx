"use client";

import { useEffect, useState } from "react";
import { Gift, Pencil, Plus, Trash2 } from "lucide-react";
import {
  SpecialDateForm,
  type SpecialDateFormValues
} from "@/components/special-dates/SpecialDateForm";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useSpecialDates } from "@/hooks/useSpecialDates";
import { cn } from "@/lib/cn";
import type { SpecialDate } from "@/types";

const NOTIFY_OPTIONS: { field: keyof NotifySettings; label: string }[] = [
  { field: "notify_on_day", label: "No dia" },
  { field: "notify_1_day_before", label: "1 dia antes" },
  { field: "notify_1_week_before", label: "1 semana antes" },
  { field: "notify_1_month_before", label: "1 mês antes" }
];

interface NotifySettings {
  notify_on_day: boolean;
  notify_1_day_before: boolean;
  notify_1_week_before: boolean;
  notify_1_month_before: boolean;
}

export default function SpecialDatesPage() {
  const {
    specialDates,
    loading,
    error,
    fetchSpecialDates,
    createSpecialDate,
    updateSpecialDate,
    deleteSpecialDate
  } = useSpecialDates();

  const [savedId, setSavedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<SpecialDate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    void fetchSpecialDates();
  }, [fetchSpecialDates]);

  const nationalDates = specialDates.filter((d) => d.is_national);
  const personalDates = specialDates.filter((d) => !d.is_national);

  async function handleUpdate(
    id: string,
    data: Partial<SpecialDate>
  ): Promise<void> {
    try {
      await updateSpecialDate(id, data);
      setSavedId(id);
      setTimeout(
        () => setSavedId((curr) => (curr === id ? null : curr)),
        2000
      );
    } catch {
      setPageError("Erro ao salvar alterações. Tente novamente.");
    }
  }

  async function handleSave(form: SpecialDateFormValues): Promise<void> {
    try {
      if (editingDate) {
        await updateSpecialDate(editingDate.id, form);
      } else {
        await createSpecialDate(form);
      }
      setIsModalOpen(false);
      setEditingDate(null);
    } catch {
      setPageError("Erro ao salvar data especial. Tente novamente.");
    }
  }

  async function handleDelete(): Promise<void> {
    if (!deleteConfirm) return;
    setDeleting(true);

    try {
      await deleteSpecialDate(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch {
      setPageError("Erro ao excluir data especial. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  }

  function openEdit(date: SpecialDate): void {
    setEditingDate(date);
    setIsModalOpen(true);
  }

  function closeModal(): void {
    setIsModalOpen(false);
    setEditingDate(null);
  }

  return (
    <section className="space-y-6 p-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] dark:text-tf-dark-text-primary">
            Datas Especiais
          </h1>
          <p className="mt-1 text-sm text-[#6B7280] dark:text-tf-dark-text-muted">
            Gerencie aniversários e datas comemorativas
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} type="button">
          <Plus className="h-3.5 w-3.5" />
          Adicionar data
        </Button>
      </header>

      {(error ?? pageError) ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error ?? pageError}
        </p>
      ) : null}

      {/* Datas nacionais */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-[#111827] dark:text-tf-dark-text-primary">
            Datas nacionais
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-tf-dark-text-muted">
            Ative as que deseja receber lembretes
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-[#6B7280] dark:text-tf-dark-text-muted">
            Carregando...
          </p>
        ) : (
          <div className="space-y-2">
            {nationalDates.map((date) => (
              <NationalDateCard
                date={date}
                key={date.id}
                onUpdate={handleUpdate}
                savedId={savedId}
              />
            ))}
          </div>
        )}
      </section>

      {/* Minhas datas */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-[#111827] dark:text-tf-dark-text-primary">
            Minhas datas
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-tf-dark-text-muted">
            Aniversários e datas pessoais
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-[#6B7280] dark:text-tf-dark-text-muted">
            Carregando...
          </p>
        ) : personalDates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-tf-dark-border dark:bg-tf-dark-bg-card">
            <Gift className="mx-auto mb-3 h-8 w-8 text-[#9CA3AF] dark:text-tf-dark-text-faint" />
            <p className="text-sm font-medium text-[#374151] dark:text-tf-dark-text-primary">
              Nenhuma data cadastrada ainda
            </p>
            <p className="mt-1 text-xs text-[#6B7280] dark:text-tf-dark-text-muted">
              Adicione aniversários, datas de casamento e comemorações pessoais.
            </p>
            <Button
              className="mt-4"
              onClick={() => setIsModalOpen(true)}
              type="button"
              variant="outline"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar primeira data
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-tf-dark-border dark:bg-tf-dark-bg-card">
            {personalDates.map((date, idx) => (
              <PersonalDateRow
                date={date}
                isLast={idx === personalDates.length - 1}
                key={date.id}
                onDelete={(id, name) => setDeleteConfirm({ id, name })}
                onEdit={openEdit}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal criar/editar */}
      {isModalOpen ? (
        <SpecialDateForm
          date={editingDate}
          mode="modal"
          onCancel={closeModal}
          onSave={handleSave}
        />
      ) : null}

      {/* Confirm delete */}
      <ConfirmModal
        confirmLabel="Excluir"
        isOpen={Boolean(deleteConfirm)}
        loading={deleting}
        message={`"${deleteConfirm?.name}" será excluída permanentemente.`}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => void handleDelete()}
        title="Excluir data especial?"
        variant="danger"
      />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* National date card                                                   */
/* ------------------------------------------------------------------ */

function NationalDateCard({
  date,
  onUpdate,
  savedId
}: {
  date: SpecialDate;
  onUpdate: (id: string, data: Partial<SpecialDate>) => Promise<void>;
  savedId: string | null;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-[#F9FAFB] p-4 transition-opacity dark:border-tf-dark-border dark:bg-tf-dark-bg-page",
        !date.active && "opacity-60"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[#111827] dark:text-tf-dark-text-primary">
            {date.name}
          </span>
          <span className="rounded-full bg-[#EEEDFE] px-2 py-0.5 text-[10px] font-semibold text-[#534AB7] dark:bg-tf-dark-purple-light">
            Nacional
          </span>
          <span className="text-xs text-[#6B7280] dark:text-tf-dark-text-muted">
            {String(date.day).padStart(2, "0")}/
            {String(date.month).padStart(2, "0")}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {savedId === date.id ? (
            <span className="text-[11px] font-medium text-emerald-600">
              Salvo!
            </span>
          ) : null}
          <Toggle
            checked={date.active}
            onChange={(checked) => void onUpdate(date.id, { active: checked })}
          />
        </div>
      </div>

      {date.active ? (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {NOTIFY_OPTIONS.map((opt) => (
            <label
              className="flex cursor-pointer items-center gap-1.5 text-xs text-[#374151] dark:text-tf-dark-text-muted"
              key={opt.field}
            >
              <input
                checked={date[opt.field]}
                className="h-3.5 w-3.5 cursor-pointer rounded accent-[#534AB7]"
                onChange={(e) =>
                  void onUpdate(date.id, { [opt.field]: e.target.checked })
                }
                type="checkbox"
              />
              {opt.label}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Personal date row                                                    */
/* ------------------------------------------------------------------ */

function PersonalDateRow({
  date,
  isLast,
  onEdit,
  onDelete
}: {
  date: SpecialDate;
  isLast: boolean;
  onEdit: (date: SpecialDate) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const activeBadges = NOTIFY_OPTIONS.filter((opt) => date[opt.field]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        !isLast && "border-b border-slate-100 dark:border-tf-dark-border-light"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[#111827] dark:text-tf-dark-text-primary">
            {date.name}
          </span>
          <span className="text-xs text-[#6B7280] dark:text-tf-dark-text-muted">
            {String(date.day).padStart(2, "0")}/
            {String(date.month).padStart(2, "0")}
          </span>
        </div>
        {activeBadges.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {activeBadges.map((opt) => (
              <span
                className="rounded-full bg-[#EEEDFE] px-2 py-0.5 text-[10px] font-medium text-[#534AB7] dark:bg-tf-dark-purple-light"
                key={opt.field}
              >
                {opt.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          aria-label={`Editar ${date.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] dark:text-tf-dark-text-muted dark:hover:bg-tf-dark-bg-sidebar dark:hover:text-tf-dark-text-primary"
          onClick={() => onEdit(date)}
          type="button"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          aria-label={`Excluir ${date.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[#6B7280] hover:bg-rose-50 hover:text-rose-600 dark:text-tf-dark-text-muted dark:hover:bg-tf-dark-bg-sidebar"
          onClick={() => onDelete(date.id, date.name)}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle switch                                                        */
/* ------------------------------------------------------------------ */

function Toggle({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      aria-checked={checked}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#534AB7] focus:ring-offset-2",
        checked ? "bg-[#534AB7]" : "bg-slate-200 dark:bg-tf-dark-border"
      )}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 dark:bg-tf-dark-text-primary",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}
