"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail } from "lucide-react";
import { apiFetch } from "@/lib/api";

const inputClass =
  "h-12 w-full rounded-[10px] border border-[#E5E7EB] px-4 text-sm outline-none transition " +
  "bg-white focus:border-[#534AB7] focus:shadow-[0_0_0_3px_#EEEDFE] " +
  "dark:border-tf-dark-border dark:bg-tf-dark-bg-sidebar dark:text-tf-dark-text-primary";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const type = (searchParams.get("type") ?? "signup") as "signup" | "reset_password";
  const isReset = type === "reset_password";

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown === 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = Array(6).fill("");
    for (let i = 0; i < text.length; i++) {
      newOtp[i] = text[i];
    }
    setOtp(newOtp);
    const lastIndex = Math.min(text.length, 5);
    inputRefs.current[lastIndex]?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const code = otp.join("");
    if (code.length < 6) {
      setError("Digite o código completo de 6 dígitos.");
      return;
    }

    if (isReset && newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      if (isReset) {
        await apiFetch<null>("/auth/reset-password", {
          method: "POST",
          body: JSON.stringify({
            email,
            code,
            new_password: newPassword,
            confirm_password: confirmPassword
          })
        });
        router.push("/login?reset=true");
      } else {
        await apiFetch<null>("/auth/verify-email", {
          method: "POST",
          body: JSON.stringify({ email, code })
        });
        router.push("/login?verified=true");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");

    try {
      await apiFetch<null>("/auth/resend-code", {
        method: "POST",
        body: JSON.stringify({ email, type })
      });
      setOtp(Array(6).fill(""));
      setCountdown(60);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao reenviar código.");
    } finally {
      setResending(false);
    }
  }

  const backHref = isReset ? "/forgot-password" : "/signup";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F7FF] px-4 py-8 dark:bg-tf-dark-bg-page">
      <div
        className="w-full max-w-[440px] rounded-[20px] bg-white p-10 dark:bg-tf-dark-bg-card"
        style={{ boxShadow: "0 12px 40px rgba(15,23,42,0.08)" }}
      >
        <div className="mb-6 flex justify-center">
          <Image src="/logo-light.png" width={120} height={36} alt="TarefasFlow" priority />
        </div>

        <div className="mb-5 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F0EFFE] dark:bg-tf-dark-purple-light">
            <Mail className="h-7 w-7 text-[#534AB7]" />
          </div>
        </div>

        <h2 className="mb-2 text-center text-2xl font-bold text-[#1A1A2E] dark:text-tf-dark-text-primary">
          Verifique seu email
        </h2>
        <p className="mb-6 text-center text-sm leading-relaxed text-[#6B7280] dark:text-tf-dark-text-muted">
          Enviamos um código de 6 dígitos para{" "}
          <span className="font-medium text-[#1A1A2E] dark:text-tf-dark-text-primary">
            {email}
          </span>
        </p>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-6 gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                className={`h-[60px] w-full rounded-xl border-2 text-center text-2xl font-bold text-[#534AB7] outline-none transition ${
                  digit
                    ? "border-[#534AB7] bg-[#F0EFFE] dark:bg-tf-dark-purple-light"
                    : "border-[#E5E7EB] bg-white dark:border-tf-dark-border dark:bg-tf-dark-bg-sidebar"
                }`}
                inputMode="numeric"
                maxLength={1}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={handleOtpPaste}
                type="text"
                value={digit}
              />
            ))}
          </div>

          {isReset && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[#1A1A2E] dark:text-tf-dark-text-primary">Nova senha</span>
                <div className="relative">
                  <input
                    autoComplete="new-password"
                    className={inputClass + " pr-11"}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] dark:text-tf-dark-text-faint dark:hover:text-tf-dark-text-muted"
                    onClick={() => setShowNewPassword((v) => !v)}
                    tabIndex={-1}
                    type="button"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[#1A1A2E] dark:text-tf-dark-text-primary">Confirmar nova senha</span>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] dark:text-tf-dark-text-faint dark:hover:text-tf-dark-text-muted"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    tabIndex={-1}
                    type="button"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
            </>
          )}

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
            {loading ? "Verificando..." : "Verificar código"}
          </button>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-[#9CA3AF] dark:text-tf-dark-text-faint">
                Reenviar código em {countdown}s
              </p>
            ) : (
              <button
                className="text-sm font-medium hover:underline disabled:opacity-60"
                disabled={resending}
                onClick={handleResend}
                style={{ color: "#534AB7" }}
                type="button"
              >
                {resending ? "Enviando..." : "Reenviar código"}
              </button>
            )}
          </div>

          <div className="flex justify-center">
            <Link
              className="flex items-center gap-1.5 text-sm font-medium hover:underline"
              href={backHref}
              style={{ color: "#534AB7" }}
            >
              ← Voltar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
