"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { apiFetch } from "@/lib/api";

const inputClass =
  "h-12 w-full rounded-[10px] border border-[#E5E7EB] px-4 text-sm outline-none transition " +
  "bg-white focus:border-[#534AB7] focus:shadow-[0_0_0_3px_#EEEDFE] " +
  "dark:border-tf-dark-border dark:bg-tf-dark-bg-sidebar dark:text-tf-dark-text-primary";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiFetch<null>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });

      router.push(`/verify-email?email=${encodeURIComponent(email)}&type=reset_password`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar código. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F7FF] px-4 py-8 dark:bg-tf-dark-bg-page">
      <div
        className="w-full max-w-[420px] rounded-[20px] bg-white p-10 dark:bg-tf-dark-bg-card"
        style={{ boxShadow: "0 12px 40px rgba(15,23,42,0.08)" }}
      >
        <div className="mb-6 flex justify-center">
          <Image src="/logo-light.png" width={120} height={36} alt="TarefasFlow" priority />
        </div>

        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F0EFFE] dark:bg-tf-dark-purple-light">
            <KeyRound className="h-7 w-7 text-[#534AB7]" />
          </div>
        </div>

        <h2 className="mb-2 text-center text-2xl font-bold text-[#1A1A2E] dark:text-tf-dark-text-primary">
          Esqueceu sua senha?
        </h2>
        <p className="mb-8 text-center text-sm leading-relaxed text-[#6B7280] dark:text-tf-dark-text-muted">
          Digite seu email e enviaremos um código para redefinir sua senha
        </p>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[#1A1A2E] dark:text-tf-dark-text-primary">Email</span>
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

          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {error}
            </p>
          ) : null}

          <button
            className="h-12 w-full rounded-[10px] text-sm font-semibold text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            style={{ background: "#534AB7" }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget.style.background = "#4339A0"); }}
            onMouseLeave={(e) => { if (!loading) (e.currentTarget.style.background = "#534AB7"); }}
            type="submit"
          >
            {loading ? "Enviando..." : "Enviar código"}
          </button>

          <div className="flex justify-center">
            <Link
              className="flex items-center gap-1.5 text-sm font-medium hover:underline"
              href="/login"
              style={{ color: "#534AB7" }}
            >
              ← Voltar para o login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
