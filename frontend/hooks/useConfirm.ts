"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ConfirmModalVariant } from "@/components/ui/ConfirmModal";

interface ConfirmOptions {
  title: string;
  message: string;
  variant?: ConfirmModalVariant;
  confirmLabel?: string;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  variant: ConfirmModalVariant;
  confirmLabel: string;
  loading: boolean;
}

const initialState: ConfirmState = {
  isOpen: false,
  title: "",
  message: "",
  variant: "default",
  confirmLabel: "Confirmar",
  loading: false
};

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(initialState);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const settle = useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setState(initialState);
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    resolverRef.current?.(false);

    setState({
      isOpen: true,
      title: options.title,
      message: options.message,
      variant: options.variant ?? "default",
      confirmLabel: options.confirmLabel ?? "Confirmar",
      loading: false
    });

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((current) => ({ ...current, loading }));
  }, []);

  const onConfirm = useCallback(() => settle(true), [settle]);
  const onCancel = useCallback(() => settle(false), [settle]);

  useEffect(() => {
    return () => {
      resolverRef.current?.(false);
      resolverRef.current = null;
    };
  }, []);

  const modalProps = useMemo(
    () => ({
      isOpen: state.isOpen,
      title: state.title,
      message: state.message,
      variant: state.variant,
      confirmLabel: state.confirmLabel,
      loading: state.loading,
      onConfirm,
      onCancel
    }),
    [onCancel, onConfirm, state]
  );

  return {
    confirm,
    setLoading,
    modalProps
  };
}
