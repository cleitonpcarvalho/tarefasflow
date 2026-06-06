"use client";

import { useEffect, useId, useRef } from "react";
import {
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export type ConfirmModalVariant = "danger" | "warning" | "default";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmModalVariant;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const variantStyles = {
  danger: {
    icon: AlertTriangle,
    iconContainer: "bg-rose-50 text-[#DC2626]",
    confirmButton:
      "border-[#DC2626] bg-[#DC2626] text-white hover:border-[#B91C1C] hover:bg-[#B91C1C]"
  },
  warning: {
    icon: AlertCircle,
    iconContainer: "bg-amber-50 text-[#D97706]",
    confirmButton:
      "border-[#D97706] bg-[#D97706] text-white hover:border-[#B45309] hover:bg-[#B45309]"
  },
  default: {
    icon: HelpCircle,
    iconContainer: "bg-tf-purple-light text-tf-purple",
    confirmButton:
      "border-tf-purple bg-tf-purple text-white hover:border-[#4540A3] hover:bg-[#4540A3]"
  }
};

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel,
  loading = false
}: ConfirmModalProps) {
  const titleId = useId();
  const messageId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <section
        aria-describedby={messageId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-[400px] rounded-xl bg-white p-6 shadow-soft"
        role="dialog"
      >
        <div
          className={cn(
            "mx-auto flex h-12 w-12 items-center justify-center rounded-full",
            styles.iconContainer
          )}
        >
          <Icon className="h-6 w-6" />
        </div>

        <h2
          className="mt-3 text-center text-[15px] font-semibold text-[#111827]"
          id={titleId}
        >
          {title}
        </h2>
        <p
          className="mt-2 text-center text-[13px] leading-5 text-[#6B7280]"
          id={messageId}
        >
          {message}
        </p>

        <div className="mt-6 flex gap-3">
          <Button
            className="flex-1"
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
            variant="outline"
          >
            {cancelLabel}
          </Button>
          <button
            className={cn(
              "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border px-3 text-[12px] font-medium transition focus:outline-none focus:ring-4 focus:ring-tf-purple-light disabled:cursor-not-allowed disabled:opacity-60",
              styles.confirmButton
            )}
            disabled={loading}
            onClick={onConfirm}
            type="button"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
