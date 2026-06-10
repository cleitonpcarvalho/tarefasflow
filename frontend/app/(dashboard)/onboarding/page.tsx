"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, QrCode, Shield, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface OnboardingStatus {
  onboarding_completed: boolean;
  whatsapp_phone: string | null;
  instance_status: string | null;
  instance_name: string | null;
}

interface QrCodeData {
  code: string;
  pairingCode: string | null;
  instance_status: string;
}

const STEPS = [
  { label: "Conectar", icon: QrCode },
  { label: "Autorizar", icon: Shield },
  { label: "Primeira tarefa", icon: Sparkles },
  { label: "Concluir", icon: CheckCircle2 }
];

const inputClass =
  "h-12 w-full rounded-[10px] border border-[#E5E7EB] px-4 text-sm outline-none transition " +
  "focus:border-[#534AB7] focus:shadow-[0_0_0_3px_#EEEDFE] bg-white";

function formatPhoneDisplay(phone: string | null): string {
  if (!phone) return "";
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA");
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.label} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all"
              style={{
                background: i < current ? "#534AB7" : i === current ? "#534AB7" : "#E5E7EB",
                color: i <= current ? "white" : "#9CA3AF"
              }}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className="text-[11px] font-medium"
              style={{ color: i <= current ? "#534AB7" : "#9CA3AF" }}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className="h-0.5 w-12 sm:w-16 mx-1 mb-4 transition-all"
              style={{ background: i < current ? "#534AB7" : "#E5E7EB" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState(getTomorrow());
  const [taskTime, setTaskTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const statusPollRef = useRef<NodeJS.Timeout | null>(null);
  const qrPollRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial onboarding status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await apiFetch<OnboardingStatus>("/profile/onboarding-status");
        if (res.data?.onboarding_completed) {
          router.replace("/calendar");
          return;
        }
        setInstanceName(res.data?.instance_name ?? null);
        setWhatsappPhone(res.data?.whatsapp_phone ?? null);
        setPhoneInput(res.data?.whatsapp_phone ?? "");
        if (res.data?.instance_status === "open") {
          setStep(2);
        }
      } catch {
        // proceed
      } finally {
        setInitialLoading(false);
      }
    }
    fetchStatus();
  }, [router]);

  const fetchQrCode = useCallback(async () => {
    if (!instanceName) return;
    setQrLoading(true);
    setQrError("");
    try {
      const res = await apiFetch<QrCodeData>("/profile/instance-qrcode");
      if (res.data) {
        setQrCode(res.data.code);
        setPairingCode(res.data.pairingCode);
      }
    } catch (err) {
      setQrError(err instanceof Error ? err.message : "Erro ao gerar QR Code.");
    } finally {
      setQrLoading(false);
    }
  }, [instanceName]);

  // QR code fetch and auto-refresh in step 1
  useEffect(() => {
    if (step !== 1 || !instanceName) return;
    fetchQrCode();
    qrPollRef.current = setInterval(fetchQrCode, 20000);
    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    };
  }, [step, instanceName, fetchQrCode]);

  // Connection status polling in step 1
  useEffect(() => {
    if (step !== 1) return;
    statusPollRef.current = setInterval(async () => {
      try {
        const res = await apiFetch<OnboardingStatus>("/profile/onboarding-status");
        if (res.data?.instance_status === "open") {
          setStep(2);
        }
      } catch {}
    }, 3000);
    return () => {
      if (statusPollRef.current) clearInterval(statusPollRef.current);
    };
  }, [step]);

  async function handleCheckConnection() {
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch<OnboardingStatus>("/profile/onboarding-status");
      if (res.data?.instance_status === "open") {
        setStep(2);
      } else {
        setError("WhatsApp ainda não conectado. Escaneie o QR Code e tente novamente.");
      }
    } catch {
      setError("Erro ao verificar conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAuthorizePhone(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!instanceName) {
      setStep(3);
      return;
    }
    const rawPhone = phoneInput.replace(/\D/g, "");
    setLoading(true);
    try {
      await apiFetch(`/whatsapp/instances/${instanceName}/numbers`, {
        method: "POST",
        body: JSON.stringify({ phone: rawPhone, label: "Meu WhatsApp" })
      });
      setStep(3);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("já") || msg.toLowerCase().includes("duplicat") || msg.includes("409")) {
        setStep(3);
      } else {
        setError(msg || "Erro ao autorizar número. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTask(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!taskTitle.trim()) {
      setError("Digite o título da tarefa.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: taskTitle.trim(),
          task_date: taskDate,
          task_time: taskTime || null
        })
      });
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar tarefa.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteOnboarding() {
    setLoading(true);
    try {
      await apiFetch("/profile/complete-onboarding", { method: "POST" });
    } catch {}
    router.replace("/calendar");
  }

  if (initialLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#534AB7" }} />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[calc(100vh-64px)] items-start justify-center px-4 py-10"
      style={{ background: "#F8F7FF" }}
    >
      <div className="w-full max-w-[520px]">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A2E" }}>
            Configure seu TarefasFlow
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
            Siga os passos para começar a usar seu agente no WhatsApp
          </p>
        </div>

        <StepIndicator current={step - 1} />

        <div
          className="rounded-[20px] bg-white p-8"
          style={{ boxShadow: "0 8px 32px rgba(15,23,42,0.08)" }}
        >
          {/* Step 1: Connect WhatsApp */}
          {step === 1 && (
            <div className="flex flex-col items-center gap-5">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: "#F0EFFE" }}
              >
                <QrCode className="h-7 w-7" style={{ color: "#534AB7" }} />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold" style={{ color: "#1A1A2E" }}>
                  Conecte seu WhatsApp
                </h2>
                <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
                  Escaneie o QR Code abaixo com o WhatsApp do seu celular
                </p>
              </div>

              <div
                className="flex h-[220px] w-[220px] items-center justify-center rounded-2xl"
                style={{ border: "2px solid #E5E7EB", background: "#FAFAFA" }}
              >
                {qrLoading && !qrCode && (
                  <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#534AB7" }} />
                )}
                {!qrLoading && qrError && !qrCode && (
                  <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>{qrError}</p>
                    <button
                      className="text-xs font-medium hover:underline"
                      onClick={fetchQrCode}
                      style={{ color: "#534AB7" }}
                      type="button"
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}
                {qrCode && (
                  <img
                    alt="QR Code WhatsApp"
                    className="h-[200px] w-[200px] rounded-xl"
                    src={`data:image/png;base64,${qrCode}`}
                  />
                )}
                {!instanceName && !qrLoading && (
                  <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#534AB7" }} />
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>
                      Preparando sua instância...
                    </p>
                  </div>
                )}
              </div>

              {pairingCode && (
                <div className="text-center">
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Código de pareamento</p>
                  <p className="mt-1 font-mono text-lg font-bold" style={{ color: "#534AB7" }}>
                    {pairingCode}
                  </p>
                </div>
              )}

              {error && (
                <p className="w-full rounded-lg bg-rose-50 px-3 py-2 text-center text-sm font-medium text-rose-700">
                  {error}
                </p>
              )}

              <div className="flex w-full flex-col gap-3 pt-2">
                <button
                  className="h-12 w-full rounded-[10px] text-sm font-semibold text-white transition-colors disabled:opacity-60"
                  disabled={loading}
                  onClick={handleCheckConnection}
                  style={{ background: "#534AB7" }}
                  onMouseEnter={(e) => { if (!loading) (e.currentTarget.style.background = "#4339A0"); }}
                  onMouseLeave={(e) => { if (!loading) (e.currentTarget.style.background = "#534AB7"); }}
                  type="button"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
                    </span>
                  ) : "Já escaneei"}
                </button>
                <button
                  className="text-sm font-medium hover:underline"
                  onClick={() => setStep(2)}
                  style={{ color: "#9CA3AF" }}
                  type="button"
                >
                  Conectar depois
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Authorize phone */}
          {step === 2 && (
            <form className="flex flex-col gap-5" onSubmit={handleAuthorizePhone}>
              <div className="flex flex-col items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ background: "#F0EFFE" }}
                >
                  <Shield className="h-7 w-7" style={{ color: "#534AB7" }} />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold" style={{ color: "#1A1A2E" }}>
                    Autorize seu número
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
                    Confirme o número que receberá os lembretes do agente
                  </p>
                </div>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium" style={{ color: "#1A1A2E" }}>
                  Número de WhatsApp
                </span>
                <input
                  className={inputClass}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="55119999999999"
                  required
                  type="text"
                  value={phoneInput ? formatPhoneDisplay(phoneInput) || phoneInput : ""}
                />
                <span className="text-xs" style={{ color: "#9CA3AF" }}>
                  Apenas dígitos (DDD + número), ex: {formatPhoneDisplay(whatsappPhone) || "55119999999"}
                </span>
              </label>

              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {error}
                </p>
              )}

              <button
                className="h-12 w-full rounded-[10px] text-sm font-semibold text-white transition-colors disabled:opacity-60"
                disabled={loading}
                style={{ background: "#534AB7" }}
                onMouseEnter={(e) => { if (!loading) (e.currentTarget.style.background = "#4339A0"); }}
                onMouseLeave={(e) => { if (!loading) (e.currentTarget.style.background = "#534AB7"); }}
                type="submit"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Autorizando...
                  </span>
                ) : "Autorizar número"}
              </button>
              <button
                className="text-sm font-medium hover:underline"
                onClick={() => setStep(3)}
                style={{ color: "#9CA3AF" }}
                type="button"
              >
                Pular por agora
              </button>
            </form>
          )}

          {/* Step 3: Create first task */}
          {step === 3 && (
            <form className="flex flex-col gap-5" onSubmit={handleCreateTask}>
              <div className="flex flex-col items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ background: "#F0EFFE" }}
                >
                  <Sparkles className="h-7 w-7" style={{ color: "#534AB7" }} />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold" style={{ color: "#1A1A2E" }}>
                    Crie sua primeira tarefa
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>
                    Adicione uma tarefa para começar a organizar sua agenda
                  </p>
                </div>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium" style={{ color: "#1A1A2E" }}>
                  O que você quer fazer?
                </span>
                <input
                  autoFocus
                  className={inputClass}
                  maxLength={255}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="ex: Reunião com o time, Consulta médica..."
                  type="text"
                  value={taskTitle}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium" style={{ color: "#1A1A2E" }}>Data</span>
                  <input
                    className={inputClass}
                    onChange={(e) => setTaskDate(e.target.value)}
                    required
                    type="date"
                    value={taskDate}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium" style={{ color: "#1A1A2E" }}>
                    Horário <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(opcional)</span>
                  </span>
                  <input
                    className={inputClass}
                    onChange={(e) => setTaskTime(e.target.value)}
                    type="time"
                    value={taskTime}
                  />
                </label>
              </div>

              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {error}
                </p>
              )}

              <button
                className="h-12 w-full rounded-[10px] text-sm font-semibold text-white transition-colors disabled:opacity-60"
                disabled={loading}
                style={{ background: "#534AB7" }}
                onMouseEnter={(e) => { if (!loading) (e.currentTarget.style.background = "#4339A0"); }}
                onMouseLeave={(e) => { if (!loading) (e.currentTarget.style.background = "#534AB7"); }}
                type="submit"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Criando tarefa...
                  </span>
                ) : "Criar tarefa"}
              </button>
              <button
                className="text-sm font-medium hover:underline"
                onClick={() => setStep(4)}
                style={{ color: "#9CA3AF" }}
                type="button"
              >
                Pular por agora
              </button>
            </form>
          )}

          {/* Step 4: Complete */}
          {step === 4 && (
            <div className="flex flex-col items-center gap-5 py-2">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full"
                style={{ background: "#F0EFFE" }}
              >
                <CheckCircle2 className="h-10 w-10" style={{ color: "#534AB7" }} />
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold" style={{ color: "#1A1A2E" }}>
                  Tudo pronto!
                </h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                  Seu TarefasFlow está configurado. Acesse seu painel para gerenciar tarefas e
                  conversar com seu agente no WhatsApp.
                </p>
              </div>

              <div
                className="w-full rounded-xl p-4"
                style={{ background: "#F0EFFE", border: "1px solid #D4D0F5" }}
              >
                <p className="text-center text-sm" style={{ color: "#534AB7" }}>
                  <span className="font-semibold">Dica:</span> Envie uma mensagem de WhatsApp para seu agente e diga{" "}
                  <span className="font-mono font-semibold">"Olá"</span> para começar!
                </p>
              </div>

              <button
                className="mt-2 h-12 w-full rounded-[10px] text-sm font-semibold text-white transition-colors disabled:opacity-60"
                disabled={loading}
                onClick={handleCompleteOnboarding}
                style={{ background: "#534AB7" }}
                onMouseEnter={(e) => { if (!loading) (e.currentTarget.style.background = "#4339A0"); }}
                onMouseLeave={(e) => { if (!loading) (e.currentTarget.style.background = "#534AB7"); }}
                type="button"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Abrindo painel...
                  </span>
                ) : "Ir para meu painel"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
