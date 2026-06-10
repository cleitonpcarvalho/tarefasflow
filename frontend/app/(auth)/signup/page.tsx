"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/api";

const bullets = [
  "Agente IA no WhatsApp",
  "Lembretes automáticos inteligentes",
  "Calendário e tarefas organizados"
];

function LeftPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-[45%] flex-col justify-center gap-8 p-12"
      style={{ background: "linear-gradient(135deg, #534AB7 0%, #7C6FD4 100%)" }}
    >
      <div className="flex flex-col gap-6">
        <Image src="/logo-dark.png" width={160} height={48} alt="TarefasFlow" priority />
        <div className="mt-4 flex flex-col gap-4">
          <h1 style={{ color: "white", fontSize: 28, fontWeight: 700, lineHeight: 1.3, margin: 0 }}>
            Organize sua vida com inteligência
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, margin: 0, lineHeight: 1.6 }}>
            Gerencie tarefas, compromissos e lembretes com seu agente IA no WhatsApp
          </p>
          <ul className="mt-2 flex flex-col gap-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {bullets.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                >
                  ✓
                </span>
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>© 2026 TarefasFlow</p>
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-[10px] border border-[#E5E7EB] px-4 text-sm outline-none transition " +
  "focus:border-[#534AB7] focus:shadow-[0_0_0_3px_#EEEDFE] bg-white";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhone(e.target.value));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const rawPhone = phone.replace(/\D/g, "");

    if (rawPhone.length !== 11) {
      setError("WhatsApp deve ter exatamente 11 dígitos (DDD + número).");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!terms) {
      setError("Você precisa aceitar os termos para continuar.");
      return;
    }

    setLoading(true);

    try {
      await apiFetch<{ email: string }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          whatsapp_phone: rawPhone,
          password,
          confirm_password: confirmPassword
        })
      });

      router.push(`/verify-email?email=${encodeURIComponent(email)}&type=signup`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <LeftPanel />

      <div className="flex w-full lg:w-[55%] items-center justify-center bg-white p-6">
        <div className="w-full max-w-[400px] py-10">
          <div className="mb-8 flex justify-center lg:hidden">
            <Image src="/logo-dark.png" width={120} height={36} alt="TarefasFlow" priority />
          </div>

          <h2 className="mb-1 text-2xl font-bold" style={{ color: "#1A1A2E" }}>
            Crie sua conta
          </h2>
          <p className="mb-8 text-sm" style={{ color: "#6B7280" }}>
            Comece a organizar sua vida hoje
          </p>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium" style={{ color: "#1A1A2E" }}>Nome completo</span>
              <input
                autoComplete="name"
                className={inputClass}
                onChange={(e) => setName(e.target.value)}
                placeholder="João Silva"
                required
                type="text"
                value={name}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium" style={{ color: "#1A1A2E" }}>Email</span>
              <input
                autoComplete="email"
                className={inputClass}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@email.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium" style={{ color: "#1A1A2E" }}>WhatsApp</span>
              <div className="relative">
                <input
                  autoComplete="tel"
                  className={inputClass + " pl-10"}
                  inputMode="numeric"
                  onChange={handlePhoneChange}
                  placeholder="(55) 99999-9999"
                  required
                  type="text"
                  value={phone}
                />
                <span
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                  style={{ color: "#25D366" }}
                >
                  WA
                </span>
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium" style={{ color: "#1A1A2E" }}>Senha</span>
              <div className="relative">
                <input
                  autoComplete="new-password"
                  className={inputClass + " pr-11"}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  type="button"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium" style={{ color: "#1A1A2E" }}>Confirmar senha</span>
              <div className="relative">
                <input
                  autoComplete="new-password"
                  className={inputClass + " pr-11"}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  tabIndex={-1}
                  type="button"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                checked={terms}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#534AB7]"
                onChange={(e) => setTerms(e.target.checked)}
                type="checkbox"
              />
              <span className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                Concordo com os{" "}
                <a className="font-medium hover:underline" href="#" style={{ color: "#534AB7" }}>
                  Termos de Uso
                </a>{" "}
                e{" "}
                <a className="font-medium hover:underline" href="#" style={{ color: "#534AB7" }}>
                  Política de Privacidade
                </a>
              </span>
            </label>

            {error ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {error}
              </p>
            ) : null}

            <button
              className="mt-1 h-12 w-full rounded-[10px] text-sm font-semibold text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              style={{ background: "#534AB7" }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget.style.background = "#4339A0"); }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget.style.background = "#534AB7"); }}
              type="submit"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>

            <p className="text-center text-sm" style={{ color: "#6B7280" }}>
              Já tenho uma conta{" "}
              <Link className="font-medium hover:underline" href="/login" style={{ color: "#534AB7" }}>
                Fazer login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
