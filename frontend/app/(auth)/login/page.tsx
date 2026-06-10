"use client";

import { FormEvent, Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { apiFetch, ApiFetchError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AuthSession } from "@/types";

const bullets = [
  "Agente IA no WhatsApp",
  "Lembretes automáticos inteligentes",
  "Calendário e tarefas organizados"
];

function LeftPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-[45%] flex-col justify-center items-center p-12 gap-8"
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

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const verified = searchParams.get("verified") === "true";
  const reset = searchParams.get("reset") === "true";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch<AuthSession>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      if (!response.data) {
        throw new ApiFetchError("Resposta inválida.", 500, "INVALID_RESPONSE");
      }

      login(response.data.user, response.data.token);
      router.replace("/calendar");
    } catch {
      setError("E-mail ou senha inválidos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <LeftPanel />

      <div className="flex w-full lg:w-[55%] items-center justify-center bg-white p-6">
        <div className="w-full max-w-[400px] py-12">
          <div className="mb-8 flex justify-center lg:hidden">
            <Image src="/logo-dark.png" width={120} height={36} alt="TarefasFlow" priority />
          </div>

          <h2 className="mb-1 text-2xl font-bold" style={{ color: "#1A1A2E" }}>
            Bem-vindo de volta
          </h2>
          <p className="mb-8 text-sm" style={{ color: "#6B7280" }}>
            Entre na sua conta para continuar
          </p>

          {verified && (
            <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              Email verificado! Faça login para continuar.
            </div>
          )}
          {reset && (
            <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              Senha redefinida com sucesso! Faça login.
            </div>
          )}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium" style={{ color: "#1A1A2E" }}>Email</span>
              <input
                autoComplete="email"
                className={inputClass}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium" style={{ color: "#1A1A2E" }}>Senha</span>
              <div className="relative">
                <input
                  autoComplete="current-password"
                  className={inputClass + " pr-11"}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
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

            <div className="flex justify-end" style={{ marginTop: -8 }}>
              <Link
                className="text-[13px] font-medium hover:underline"
                href="/forgot-password"
                style={{ color: "#534AB7" }}
              >
                Esqueci minha senha
              </Link>
            </div>

            {error ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {error}
              </p>
            ) : null}

            <button
              className="mt-1 h-12 w-full rounded-[10px] text-sm font-semibold text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              style={{ background: loading ? "#7C6FD4" : "#534AB7" }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget.style.background = "#4339A0"); }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget.style.background = "#534AB7"); }}
              type="submit"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <div className="flex items-center gap-3">
              <hr className="flex-1 border-[#E5E7EB]" />
              <span className="text-sm" style={{ color: "#9CA3AF" }}>ou</span>
              <hr className="flex-1 border-[#E5E7EB]" />
            </div>

            <Link
              className="flex h-12 w-full items-center justify-center rounded-[10px] border text-sm font-semibold transition-colors"
              href="/signup"
              style={{ borderColor: "#534AB7", color: "#534AB7" }}
              onMouseEnter={(e) => { (e.currentTarget.style.background = "#F0EFFE"); }}
              onMouseLeave={(e) => { (e.currentTarget.style.background = "transparent"); }}
            >
              Criar conta grátis
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
