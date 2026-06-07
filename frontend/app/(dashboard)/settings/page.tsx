"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bell, KeyRound, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiFetchError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const timezoneStorageKey = "taskflow:timezone";
const reminderDefaultOptions = [
  { label: "15 min antes", value: 15 },
  { label: "30 min antes", value: 30 },
  { label: "1 hora antes", value: 60 },
  { label: "1 dia antes", value: 1440 }
];

interface ReminderDefaultsResponse {
  reminder_defaults: number[];
}

interface DailySummaryResponse {
  enabled: boolean;
  time: string;
}

interface WhatsappStatusResponse {
  connected: boolean;
  name: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [timezone, setTimezone] = useState("America/Fortaleza");
  const [timezoneFeedback, setTimezoneFeedback] = useState<string | null>(null);
  const [reminderDefaults, setReminderDefaults] = useState<number[]>([]);
  const [loadingReminderDefaults, setLoadingReminderDefaults] = useState(true);
  const [savingReminderDefault, setSavingReminderDefault] = useState<
    number | null
  >(null);
  const [reminderDefaultsError, setReminderDefaultsError] = useState<
    string | null
  >(null);
  const [reminderDefaultsFeedback, setReminderDefaultsFeedback] = useState<
    string | null
  >(null);
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(false);
  const [dailySummaryTime, setDailySummaryTime] = useState("06:00");
  const [loadingDailySummary, setLoadingDailySummary] = useState(true);
  const [savingDailySummary, setSavingDailySummary] = useState(false);
  const [dailySummaryFeedback, setDailySummaryFeedback] = useState<string | null>(null);
  const [dailySummaryError, setDailySummaryError] = useState<string | null>(null);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const storedTimezone = window.localStorage.getItem(timezoneStorageKey);

    if (storedTimezone) {
      setTimezone(storedTimezone);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadReminderDefaults() {
      setLoadingReminderDefaults(true);
      setReminderDefaultsError(null);

      try {
        const response = await apiFetch<ReminderDefaultsResponse>(
          "/profile/reminder-defaults"
        );

        if (active) {
          setReminderDefaults(response.data?.reminder_defaults ?? []);
        }
      } catch (error) {
        if (active) {
          setReminderDefaultsError(
            getErrorMessage(error, "Erro ao carregar lembretes padrão.")
          );
        }
      } finally {
        if (active) {
          setLoadingReminderDefaults(false);
        }
      }
    }

    void loadReminderDefaults();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDailySummary() {
      setLoadingDailySummary(true);

      try {
        const [summaryRes, statusRes] = await Promise.all([
          apiFetch<DailySummaryResponse>("/profile/daily-summary"),
          apiFetch<WhatsappStatusResponse>("/whatsapp/status")
        ]);

        if (active) {
          setDailySummaryEnabled(summaryRes.data?.enabled ?? false);
          setDailySummaryTime(summaryRes.data?.time ?? "06:00");
          setWhatsappConnected(statusRes.data?.connected ?? false);
        }
      } catch {
        // non-critical, leave defaults
      } finally {
        if (active) {
          setLoadingDailySummary(false);
        }
      }
    }

    void loadDailySummary();

    return () => {
      active = false;
    };
  }, []);

  async function handleSaveDailySummary(enabled: boolean, time: string) {
    setSavingDailySummary(true);
    setDailySummaryFeedback(null);
    setDailySummaryError(null);

    try {
      const res = await apiFetch<DailySummaryResponse>("/profile/daily-summary", {
        method: "PATCH",
        body: JSON.stringify({ enabled, time })
      });

      setDailySummaryEnabled(res.data?.enabled ?? enabled);
      setDailySummaryTime(res.data?.time ?? time);
      setDailySummaryFeedback("Salvo!");
      window.setTimeout(() => setDailySummaryFeedback(null), 2000);
    } catch (error) {
      setDailySummaryError(getErrorMessage(error, "Erro ao salvar resumo diário."));
    } finally {
      setSavingDailySummary(false);
    }
  }

  function handleSaveTimezone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem(timezoneStorageKey, timezone);
    setTimezoneFeedback("Ajustes salvos com sucesso.");
  }

  async function handleToggleReminderDefault(minutesBefore: number) {
    const enabled = reminderDefaults.includes(minutesBefore);
    const nextDefaults = enabled
      ? reminderDefaults.filter((value) => value !== minutesBefore)
      : [...reminderDefaults, minutesBefore];

    setSavingReminderDefault(minutesBefore);
    setReminderDefaultsError(null);
    setReminderDefaultsFeedback(null);

    try {
      const response = await apiFetch<ReminderDefaultsResponse>(
        "/profile/reminder-defaults",
        {
          method: "PATCH",
          body: JSON.stringify({
            reminder_defaults: nextDefaults
          })
        }
      );

      setReminderDefaults(response.data?.reminder_defaults ?? nextDefaults);
      setReminderDefaultsFeedback("Salvo!");
      window.setTimeout(() => setReminderDefaultsFeedback(null), 2000);
    } catch (error) {
      setReminderDefaultsError(
        getErrorMessage(error, "Erro ao salvar lembretes padrão.")
      );
    } finally {
      setSavingReminderDefault(null);
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordError("Informe a senha atual.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("A confirmacao nao confere com a nova senha.");
      return;
    }

    setSavingPassword(true);

    try {
      const response = await apiFetch<{ updated: true }>("/profile/password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      setPasswordFeedback(response.message ?? "Senha alterada com sucesso");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordModalOpen(false);
    } catch (error) {
      setPasswordError(getErrorMessage(error, "Erro ao alterar senha."));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <section className="space-y-5 p-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">
          Configuracoes
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Preferencias da conta e parametros pessoais.
        </p>
      </div>

      <form
        className="max-w-2xl rounded-lg border border-slate-200 bg-white p-4"
        onSubmit={handleSaveTimezone}
      >
        <label className="block max-w-sm">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Fuso horario
          </span>
          <select
            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-[#534AB7] focus:ring-4 focus:ring-[#EEEDFE]"
            onChange={(event) => setTimezone(event.target.value)}
            value={timezone}
          >
            <option value="America/Fortaleza">America/Fortaleza</option>
            <option value="America/Sao_Paulo">America/Sao_Paulo</option>
          </select>
        </label>

        {timezoneFeedback ? (
          <p className="mt-3 rounded-md bg-tf-teal-bg px-3 py-2 text-[12px] font-medium text-tf-teal-text">
            {timezoneFeedback}
          </p>
        ) : null}

        <div className="mt-5">
          <Button type="submit">
            <Save className="h-3.5 w-3.5" />
            Salvar ajustes
          </Button>
        </div>
      </form>

      <section className="max-w-2xl rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-slate-950">Conta</h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Dados do usuario logado.
            </p>
          </div>
          <Button
            onClick={() => {
              setPasswordError(null);
              setPasswordFeedback(null);
              setPasswordModalOpen(true);
            }}
            type="button"
            variant="outline"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Alterar senha
          </Button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ReadOnlyField label="Nome completo" value={user?.name ?? "-"} />
          <ReadOnlyField label="Email" value={user?.email ?? "-"} />
        </div>

        {passwordFeedback ? (
          <p className="mt-4 rounded-md bg-tf-teal-bg px-3 py-2 text-[12px] font-medium text-tf-teal-text">
            {passwordFeedback}
          </p>
        ) : null}

        {passwordModalOpen ? (
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[15px] font-semibold text-slate-950">
                Alterar senha
              </h3>
              <button
                aria-label="Fechar modal"
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-slate-900"
                onClick={() => setPasswordModalOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleChangePassword}>
              <PasswordInput
                autoComplete="current-password"
                label="Senha atual"
                onChange={setCurrentPassword}
                value={currentPassword}
              />
              <PasswordInput
                autoComplete="new-password"
                label="Nova senha"
                onChange={setNewPassword}
                value={newPassword}
              />
              <PasswordInput
                autoComplete="new-password"
                label="Confirmar nova senha"
                onChange={setConfirmPassword}
                value={confirmPassword}
              />

              {passwordError ? (
                <p className="rounded-md bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700">
                  {passwordError}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button disabled={savingPassword} type="submit">
                  {savingPassword ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Salvar
                </Button>
                <Button
                  disabled={savingPassword}
                  onClick={() => setPasswordModalOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </section>

      <section className="max-w-2xl rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <h2 className="text-[16px] font-semibold text-slate-950">
            Lembretes padrão
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            Toda nova tarefa criada receberá automaticamente estes lembretes
          </p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {reminderDefaultOptions.map((option) => {
            const active = reminderDefaults.includes(option.value);

            return (
              <Button
                className="h-10 justify-start"
                disabled={loadingReminderDefaults || savingReminderDefault !== null}
                key={option.value}
                onClick={() => handleToggleReminderDefault(option.value)}
                type="button"
                variant={active ? "primary" : "secondary"}
              >
                {savingReminderDefault === option.value ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Bell className="h-3.5 w-3.5" />
                )}
                {option.label}
              </Button>
            );
          })}
        </div>

        {loadingReminderDefaults ? (
          <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-500">
            Carregando lembretes padrão...
          </p>
        ) : null}

        {reminderDefaultsFeedback ? (
          <p className="mt-3 rounded-md bg-tf-teal-bg px-3 py-2 text-[12px] font-medium text-tf-teal-text">
            {reminderDefaultsFeedback}
          </p>
        ) : null}

        {reminderDefaultsError ? (
          <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700">
            {reminderDefaultsError}
          </p>
        ) : null}
      </section>

      <section className="max-w-2xl rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <h2 className="text-[16px] font-semibold text-slate-950">
            Resumo diário
          </h2>
          <p className="mt-1 text-[13px] text-slate-500">
            Receba um resumo das suas tarefas do dia via WhatsApp todo dia no horário escolhido
          </p>
        </div>

        {loadingDailySummary ? (
          <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-500">
            Carregando...
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <label className="flex cursor-pointer items-center gap-3">
              <button
                aria-checked={dailySummaryEnabled}
                aria-label="Ativar resumo diário"
                className={[
                  "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#534AB7] focus:ring-offset-2",
                  dailySummaryEnabled ? "bg-[#534AB7]" : "bg-slate-300"
                ].join(" ")}
                disabled={savingDailySummary}
                onClick={() => {
                  const next = !dailySummaryEnabled;
                  setDailySummaryEnabled(next);
                  void handleSaveDailySummary(next, dailySummaryTime);
                }}
                role="switch"
                type="button"
              >
                <span
                  className={[
                    "pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform",
                    dailySummaryEnabled ? "translate-x-5.5" : "translate-x-0.5"
                  ].join(" ")}
                />
              </button>
              <span className="text-sm font-medium text-slate-700">
                Ativar resumo diário
              </span>
            </label>

            {dailySummaryEnabled ? (
              <label className="block max-w-xs">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Horário do resumo
                </span>
                <input
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#534AB7] focus:ring-4 focus:ring-[#EEEDFE]"
                  disabled={savingDailySummary}
                  onBlur={(e) => void handleSaveDailySummary(dailySummaryEnabled, e.target.value)}
                  onChange={(e) => setDailySummaryTime(e.target.value)}
                  type="time"
                  value={dailySummaryTime}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Horário de Brasília (UTC-3)
                </p>
              </label>
            ) : null}

            {dailySummaryEnabled && !whatsappConnected ? (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-700">
                ⚠️ Conecte seu WhatsApp em{" "}
                <a className="underline" href="/whatsapp">
                  /whatsapp
                </a>{" "}
                para receber o resumo
              </p>
            ) : null}

            {dailySummaryFeedback ? (
              <p className="rounded-md bg-tf-teal-bg px-3 py-2 text-[12px] font-medium text-tf-teal-text">
                {dailySummaryFeedback}
              </p>
            ) : null}

            {dailySummaryError ? (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700">
                {dailySummaryError}
              </p>
            ) : null}
          </div>
        )}
      </section>
    </section>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 truncate text-[14px] font-medium text-slate-950">
        {value}
      </p>
    </div>
  );
}

function PasswordInput({
  autoComplete,
  label,
  onChange,
  value
}: {
  autoComplete: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        autoComplete={autoComplete}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#534AB7] focus:ring-4 focus:ring-[#EEEDFE]"
        onChange={(event) => onChange(event.target.value)}
        type="password"
        value={value}
      />
    </label>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiFetchError) {
    return error.message;
  }

  return error instanceof Error ? error.message : fallback;
}
