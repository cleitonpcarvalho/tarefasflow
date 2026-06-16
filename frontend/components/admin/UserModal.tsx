"use client";

import { FormEvent, useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type {
  CreateAdminUserInput,
  UpdateAdminUserInput
} from "@/hooks/useAdminUsers";
import type { User, UserRole } from "@/types";

interface UserModalProps {
  isOpen: boolean;
  user?: User | null;
  canChangeActive?: boolean;
  onClose: () => void;
  onCreate: (data: CreateAdminUserInput) => Promise<void>;
  onUpdate: (id: string, data: UpdateAdminUserInput) => Promise<void>;
}

export function UserModal({
  isOpen,
  user,
  canChangeActive = true,
  onClose,
  onCreate,
  onUpdate
}: UserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setPassword(user ? "" : generatePassword());
    setRole(user?.role ?? "user");
    setActive(user?.active ?? true);
    setSaving(false);
    setError("");
  }, [isOpen, user]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (user) {
        await onUpdate(user.id, {
          name: name.trim(),
          email: email.trim(),
          role,
          active
        });
      } else {
        await onCreate({
          name: name.trim(),
          email: email.trim(),
          password,
          role
        });
      }

      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Não foi possível salvar."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 dark:bg-black/70">
      <section
        aria-labelledby="user-modal-title"
        aria-modal="true"
        className="w-full max-w-[520px] rounded-xl bg-white p-6 shadow-xl dark:bg-tf-dark-bg-card"
        role="dialog"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280] dark:text-tf-dark-text-muted">
              Administração
            </p>
            <h2
              className="text-lg font-semibold text-[#111827] dark:text-tf-dark-text-primary"
              id="user-modal-title"
            >
              {user ? "Editar usuário" : "Novo usuário"}
            </h2>
          </div>
          <button
            aria-label="Fechar modal"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] dark:text-tf-dark-text-muted dark:hover:bg-tf-dark-bg-sidebar"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field label="Nome">
            <input
              className={inputClasses}
              minLength={2}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </Field>

          <Field label="Email">
            <input
              className={inputClasses}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </Field>

          {!user ? (
            <Field label="Senha">
              <div className="flex gap-2">
                <input
                  className={inputClasses}
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="text"
                  value={password}
                />
                <Button
                  aria-label="Gerar nova senha"
                  onClick={() => setPassword(generatePassword())}
                  type="button"
                  variant="outline"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Gerar
                </Button>
              </div>
            </Field>
          ) : null}

          <Field label="Role">
            <select
              className={inputClasses}
              onChange={(event) => setRole(event.target.value as UserRole)}
              value={role}
            >
              <option value="user">Usuário</option>
              <option value="admin">Admin</option>
            </select>
          </Field>

          {user ? (
            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-3 dark:border-tf-dark-border">
              <span>
                <span className="block text-sm font-medium text-[#111827] dark:text-tf-dark-text-primary">
                  Usuário ativo
                </span>
                <span className="block text-xs text-[#6B7280] dark:text-tf-dark-text-muted">
                  Usuários inativos não podem acessar a plataforma.
                </span>
              </span>
              <button
                aria-checked={active}
                aria-label="Usuário ativo"
                className={`relative h-6 w-11 rounded-full transition ${
                  active ? "bg-[#534AB7]" : "bg-slate-300 dark:bg-tf-dark-border"
                }`}
                disabled={!canChangeActive}
                onClick={() => setActive((current) => !current)}
                role="switch"
                type="button"
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition dark:bg-tf-dark-text-primary ${
                    active ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </label>
          ) : null}

          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={onClose} type="button" variant="secondary">
              Cancelar
            </Button>
            <Button disabled={saving} type="submit">
              {saving ? "Salvando..." : user ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

const inputClasses =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#534AB7] focus:ring-4 focus:ring-[#EEEDFE] dark:border-tf-dark-border dark:bg-tf-dark-bg-sidebar dark:text-tf-dark-text-primary";

function Field({
  children,
  label
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#111827] dark:text-tf-dark-text-primary">
        {label}
      </span>
      {children}
    </label>
  );
}

function generatePassword() {
  return `Tarefas@${Math.random().toString(36).slice(2, 8)}9`;
}
