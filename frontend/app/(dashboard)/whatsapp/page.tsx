"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  Edit3,
  Loader2,
  MessageCircle,
  Plus,
  Power,
  QrCode,
  RefreshCw,
  Save,
  Trash2,
  WifiOff,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useConfirm } from "@/hooks/useConfirm";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";
import type {
  AuthorizedNumber,
  AuthorizedNumberPermissions,
  WhatsappInstance,
  WhatsappInstanceStatus,
  WhatsappQRCode
} from "@/types";

type NumberModalMode = "add" | "edit" | null;

interface NumberFormState extends AuthorizedNumberPermissions {
  phone: string;
  label: string;
}

export default function WhatsAppPage() {
  const { confirm, modalProps } = useConfirm();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [instance, setInstance] = useState<WhatsappInstance | null>(null);
  const [qrCode, setQrCode] = useState<WhatsappQRCode | null>(null);
  const [instanceName, setInstanceName] = useState("minha-agenda");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [authorizedNumbers, setAuthorizedNumbers] = useState<AuthorizedNumber[]>(
    []
  );
  const [numbersLoading, setNumbersLoading] = useState(false);
  const [numberBusyAction, setNumberBusyAction] = useState<string | null>(null);
  const [numberModalMode, setNumberModalMode] =
    useState<NumberModalMode>(null);
  const [editingNumber, setEditingNumber] = useState<AuthorizedNumber | null>(
    null
  );
  const [numberForm, setNumberForm] = useState<NumberFormState>(
    createEmptyNumberForm()
  );
  const [numberFormError, setNumberFormError] = useState<string | null>(null);

  const screenState = useMemo(() => {
    if (!instance) {
      return "empty";
    }

    if (instance.status === "open") {
      return "connected";
    }

    if (instance.status === "close" && !qrCode) {
      return "disconnected";
    }

    return "waiting";
  }, [instance, qrCode]);

  const fetchMine = useCallback(async () => {
    try {
      const response = await apiFetch<WhatsappInstance | null>(
        "/whatsapp/instances/mine"
      );
      setInstance(response.data);
      setError(null);
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, "Erro ao carregar instância."));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAuthorizedNumbers = useCallback(async (targetInstanceName: string) => {
    setNumbersLoading(true);

    try {
      const response = await apiFetch<AuthorizedNumber[]>(
        `/whatsapp/instances/${targetInstanceName}/numbers`
      );
      setAuthorizedNumbers(response.data ?? []);
    } catch (fetchError) {
      setError(
        getErrorMessage(
          fetchError,
          "Erro ao carregar números autorizados."
        )
      );
    } finally {
      setNumbersLoading(false);
    }
  }, []);

  const verifyConnection = useCallback(
    async (quiet = false) => {
      if (!instance) {
        return null;
      }

      if (!quiet) {
        setBusyAction("status");
      }

      try {
        const response = await apiFetch<{ state: WhatsappInstanceStatus }>(
          `/whatsapp/instances/${instance.instance_name}/status`
        );
        const state = response.data?.state ?? "close";
        setInstance((current) =>
          current ? { ...current, status: state } : current
        );

        if (state === "open") {
          setQrCode(null);
          setFeedback("Instância conectada com sucesso.");
        }

        setError(null);
        return state;
      } catch (statusError) {
        if (!quiet) {
          setError(getErrorMessage(statusError, "Erro ao verificar conexão."));
        }

        return null;
      } finally {
        if (!quiet) {
          setBusyAction(null);
        }
      }
    },
    [instance]
  );

  useEffect(() => {
    void fetchMine();
  }, [fetchMine]);

  useEffect(() => {
    if (instance?.status === "open" && !isAdmin) {
      void fetchAuthorizedNumbers(instance.instance_name);
      return;
    }

    setAuthorizedNumbers([]);
  }, [
    fetchAuthorizedNumbers,
    instance?.instance_name,
    instance?.status,
    isAdmin
  ]);

  useEffect(() => {
    if (!instance || !qrCode || instance.status === "open") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void verifyConnection(true);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [instance, qrCode, verifyConnection]);

  async function handleCreateInstance(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    setFeedback(null);

    try {
      const response = await apiFetch<WhatsappInstance>("/whatsapp/instances", {
        method: "POST",
        body: JSON.stringify({ instanceName })
      });
      setInstance(response.data);
      setQrCode(null);
      setFeedback("Instância criada com sucesso.");
    } catch (createError) {
      setError(getErrorMessage(createError, "Erro ao criar instância."));
    } finally {
      setCreating(false);
    }
  }

  async function handleGenerateQRCode() {
    if (!instance) {
      return;
    }

    setBusyAction("qrcode");
    setError(null);
    setFeedback(null);

    try {
      const response = await apiFetch<WhatsappQRCode>(
        `/whatsapp/instances/${instance.instance_name}/qrcode`
      );
      setQrCode(response.data);
      setInstance({ ...instance, status: "connecting" });
      setFeedback("QR Code gerado. Aguardando conexão.");
    } catch (qrError) {
      setError(getErrorMessage(qrError, "Erro ao gerar QR Code."));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleLogout(requireConfirmation = true) {
    if (!instance) {
      return false;
    }

    if (requireConfirmation) {
      const confirmed = await confirm({
        title: "Desconectar instância",
        message:
          "O número será desconectado do agente. Você precisará escanear o QR Code novamente para reconectar.",
        variant: "warning",
        confirmLabel: "Desconectar"
      });

      if (!confirmed) {
        return false;
      }
    }

    setBusyAction("logout");
    setError(null);
    setFeedback(null);

    try {
      await apiFetch<{ loggedOut: true }>(
        `/whatsapp/instances/${instance.instance_name}/logout`,
        { method: "POST" }
      );
      setInstance({ ...instance, status: "close" });
      setQrCode(null);
      setFeedback("Instância desconectada.");
      return true;
    } catch (logoutError) {
      setError(getErrorMessage(logoutError, "Erro ao desconectar instância."));
      return false;
    } finally {
      setBusyAction(null);
    }
  }

  async function handleChangeNumber() {
    if (!instance) {
      return;
    }

    const confirmed = await confirm({
      title: "Trocar número",
      message:
        "Isso irá desconectar o número atual. O envio de notificações ficará pausado até você escanear o novo QR Code. Deseja continuar?",
      variant: "warning",
      confirmLabel: "Trocar número"
    });

    if (!confirmed) {
      return;
    }

    const disconnected = await handleLogout(false);

    if (disconnected) {
      await handleGenerateQRCode();
    }
  }

  async function handleDelete() {
    if (!instance) {
      return;
    }

    const confirmed = await confirm({
      title: "Deletar instância",
      message:
        "A instância será removida permanentemente. Todas as configurações e números autorizados serão perdidos.",
      variant: "danger",
      confirmLabel: "Deletar permanentemente"
    });

    if (!confirmed) {
      return;
    }

    setBusyAction("delete");
    setError(null);
    setFeedback(null);

    try {
      await apiFetch<{ deleted: true }>(
        `/whatsapp/instances/${instance.instance_name}`,
        { method: "DELETE" }
      );
      setInstance(null);
      setQrCode(null);
      setFeedback("Instância deletada.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Erro ao deletar instância."));
    } finally {
      setBusyAction(null);
    }
  }

  function openAddNumberModal() {
    setEditingNumber(null);
    setNumberForm(createEmptyNumberForm());
    setNumberFormError(null);
    setNumberModalMode("add");
  }

  function openEditNumberModal(number: AuthorizedNumber) {
    setEditingNumber(number);
    setNumberForm({
      phone: number.phone,
      label: number.label ?? "",
      can_create_task: number.can_create_task,
      can_read_tasks: number.can_read_tasks,
      can_delete_task: number.can_delete_task,
      can_add_reminder: number.can_add_reminder
    });
    setNumberFormError(null);
    setNumberModalMode("edit");
  }

  function closeNumberModal() {
    setNumberModalMode(null);
    setEditingNumber(null);
    setNumberFormError(null);
  }

  async function handleSubmitNumber(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!instance) {
      return;
    }

    const trimmedPhone = numberForm.phone.trim();
    const trimmedLabel = numberForm.label.trim();

    if (numberModalMode === "add" && !/^\d{10,15}$/.test(trimmedPhone)) {
      setNumberFormError("Telefone deve conter 10 a 15 digitos.");
      return;
    }

    setNumberBusyAction("submit");
    setNumberFormError(null);
    setFeedback(null);

    try {
      if (numberModalMode === "add") {
        await apiFetch<AuthorizedNumber>(
          `/whatsapp/instances/${instance.instance_name}/numbers`,
          {
            method: "POST",
            body: JSON.stringify({
              phone: trimmedPhone,
              label: trimmedLabel || undefined,
              can_create_task: numberForm.can_create_task,
              can_read_tasks: numberForm.can_read_tasks,
              can_delete_task: numberForm.can_delete_task,
              can_add_reminder: numberForm.can_add_reminder
            })
          }
        );
        setFeedback("Número autorizado adicionado.");
      } else if (editingNumber) {
        await apiFetch<AuthorizedNumber>(
          `/whatsapp/instances/${instance.instance_name}/numbers/${editingNumber.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              label: trimmedLabel || null,
              can_create_task: numberForm.can_create_task,
              can_read_tasks: numberForm.can_read_tasks,
              can_delete_task: numberForm.can_delete_task,
              can_add_reminder: numberForm.can_add_reminder
            })
          }
        );
        setFeedback("Permissões do número atualizadas.");
      }

      closeNumberModal();
      await fetchAuthorizedNumbers(instance.instance_name);
    } catch (submitError) {
      setNumberFormError(
        getErrorMessage(submitError, "Erro ao salvar número autorizado.")
      );
    } finally {
      setNumberBusyAction(null);
    }
  }

  async function handleToggleAuthorizedNumber(number: AuthorizedNumber) {
    if (!instance) {
      return;
    }

    setNumberBusyAction(number.id);
    setFeedback(null);

    try {
      const response = await apiFetch<AuthorizedNumber>(
        `/whatsapp/instances/${instance.instance_name}/numbers/${number.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ active: !number.active })
        }
      );

      const updatedNumber = response.data;

      if (updatedNumber) {
        setAuthorizedNumbers((current) =>
          current.map((item) =>
            item.id === updatedNumber.id ? updatedNumber : item
          )
        );
      }
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, "Erro ao atualizar número."));
    } finally {
      setNumberBusyAction(null);
    }
  }

  async function handleRemoveAuthorizedNumber(number: AuthorizedNumber) {
    if (!instance) {
      return;
    }

    const confirmed = await confirm({
      title: "Remover número",
      message: `Remover "${number.label || number.phone}" da lista de números autorizados?`,
      variant: "danger",
      confirmLabel: "Remover"
    });

    if (!confirmed) {
      return;
    }

    setNumberBusyAction(number.id);
    setFeedback(null);

    try {
      await apiFetch<{ deleted: true }>(
        `/whatsapp/instances/${instance.instance_name}/numbers/${number.id}`,
        { method: "DELETE" }
      );
      setAuthorizedNumbers((current) =>
        current.filter((item) => item.id !== number.id)
      );
      setFeedback("Número autorizado removido.");
    } catch (removeError) {
      setError(getErrorMessage(removeError, "Erro ao remover número."));
    } finally {
      setNumberBusyAction(null);
    }
  }

  return (
    <>
      <section className="min-h-[calc(100vh-56px)] p-5">
        <div className="mx-auto max-w-3xl space-y-4">
        {error ? (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700">
            {error}
          </p>
        ) : null}

        {feedback ? (
          <p className="rounded-md bg-tf-teal-bg px-3 py-2 text-[12px] font-medium text-tf-teal-text">
            {feedback}
          </p>
        ) : null}

        {loading ? (
          <Card className="flex min-h-[260px] items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-tf-purple" />
          </Card>
        ) : screenState === "empty" ? (
          <EmptyState
            creating={creating}
            isAdmin={isAdmin}
            instanceName={instanceName}
            onChangeInstanceName={setInstanceName}
            onSubmit={handleCreateInstance}
          />
        ) : instance ? (
          <InstanceState
            authorizedNumbers={authorizedNumbers}
            busyAction={busyAction}
            instance={instance}
            isAdmin={isAdmin}
            numberBusyAction={numberBusyAction}
            numbersLoading={numbersLoading}
            onAddNumber={openAddNumberModal}
            onChangeNumber={handleChangeNumber}
            onDelete={handleDelete}
            onEditNumber={openEditNumberModal}
            onGenerateQRCode={handleGenerateQRCode}
            onLogout={() => void handleLogout()}
            onRemoveNumber={(number) => void handleRemoveAuthorizedNumber(number)}
            onToggleNumber={(number) => void handleToggleAuthorizedNumber(number)}
            onVerify={() => void verifyConnection(false)}
            qrCode={qrCode}
            screenState={screenState}
          />
        ) : null}

        {numberModalMode && !isAdmin ? (
          <AuthorizedNumberModal
            busy={numberBusyAction === "submit"}
            form={numberForm}
            mode={numberModalMode}
            onChange={setNumberForm}
            onClose={closeNumberModal}
            onSubmit={handleSubmitNumber}
            submitError={numberFormError}
          />
        ) : null}
        </div>
      </section>
      <ConfirmModal {...modalProps} />
    </>
  );
}

function EmptyState({
  creating,
  isAdmin,
  instanceName,
  onChangeInstanceName,
  onSubmit
}: {
  creating: boolean;
  isAdmin: boolean;
  instanceName: string;
  onChangeInstanceName: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card className="mx-auto max-w-lg text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-tf-purple-light text-tf-purple">
        <MessageCircle className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-[18px] font-semibold text-tf-text-primary">
        Criar instância WhatsApp
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-5 text-tf-text-muted">
        {isAdmin
          ? "Crie uma conexão própria para enviar notificações pelo WhatsApp."
          : "Crie uma conexão própria para atender seus comandos de agenda pelo WhatsApp."}
      </p>

      <form className="mt-5 space-y-3 text-left" onSubmit={onSubmit}>
        <label className="block text-[12px] font-medium text-tf-text-primary">
          Nome da instância
          <input
            className="mt-1 h-9 w-full rounded-md border border-tf-border bg-white px-3 text-[13px] outline-none transition focus:border-tf-purple focus:ring-4 focus:ring-tf-purple-light"
            onChange={(event) => onChangeInstanceName(event.target.value)}
            placeholder="minha-agenda"
            value={instanceName}
          />
        </label>

        <Button className="w-full" disabled={creating} type="submit">
          {creating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Criar instância
        </Button>
      </form>
    </Card>
  );
}

function InstanceState({
  authorizedNumbers,
  busyAction,
  instance,
  isAdmin,
  numberBusyAction,
  numbersLoading,
  onAddNumber,
  onChangeNumber,
  onDelete,
  onEditNumber,
  onGenerateQRCode,
  onLogout,
  onRemoveNumber,
  onToggleNumber,
  onVerify,
  qrCode,
  screenState
}: {
  authorizedNumbers: AuthorizedNumber[];
  busyAction: string | null;
  instance: WhatsappInstance;
  isAdmin: boolean;
  numberBusyAction: string | null;
  numbersLoading: boolean;
  onAddNumber: () => void;
  onChangeNumber: () => void;
  onDelete: () => void;
  onEditNumber: (number: AuthorizedNumber) => void;
  onGenerateQRCode: () => void;
  onLogout: () => void;
  onRemoveNumber: (number: AuthorizedNumber) => void;
  onToggleNumber: (number: AuthorizedNumber) => void;
  onVerify: () => void;
  qrCode: WhatsappQRCode | null;
  screenState: "waiting" | "connected" | "disconnected";
}) {
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge status={instance.status} />
            <span className="text-[12px] text-tf-text-faint">
              {instance.webhook_set ? "Webhook ativo" : "Webhook pendente"}
            </span>
          </div>
          <h1 className="mt-3 break-words text-[18px] font-semibold text-tf-text-primary">
            {instance.instance_name}
          </h1>
          {instance.phone_number && !isAdmin ? (
            <p className="mt-1 text-[13px] text-tf-text-muted">
              Número: {instance.phone_number}
            </p>
          ) : null}
        </div>

        {!isAdmin ? (
          <Button
            className="border-rose-200 text-rose-700 hover:border-rose-400 hover:text-rose-800"
            disabled={busyAction === "delete"}
            onClick={onDelete}
            type="button"
            variant="outline"
          >
            {busyAction === "delete" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Deletar instância
          </Button>
        ) : null}
      </div>

      {screenState === "waiting" ? (
        <WaitingContent
          busyAction={busyAction}
          onGenerateQRCode={onGenerateQRCode}
          onVerify={onVerify}
          qrCode={qrCode}
        />
      ) : null}

      {screenState === "connected" ? (
        <ConnectedContent
          authorizedNumbers={authorizedNumbers}
          busyAction={busyAction}
          numberBusyAction={numberBusyAction}
          numbersLoading={numbersLoading}
          onAddNumber={onAddNumber}
          onChangeNumber={onChangeNumber}
          onEditNumber={onEditNumber}
          onLogout={onLogout}
          onRemoveNumber={onRemoveNumber}
          onToggleNumber={onToggleNumber}
          showAgentControls={!isAdmin}
        />
      ) : null}

      {screenState === "disconnected" ? (
        <DisconnectedContent
          busyAction={busyAction}
          onReconnect={onGenerateQRCode}
        />
      ) : null}
    </Card>
  );
}

function WaitingContent({
  busyAction,
  onGenerateQRCode,
  onVerify,
  qrCode
}: {
  busyAction: string | null;
  onGenerateQRCode: () => void;
  onVerify: () => void;
  qrCode: WhatsappQRCode | null;
}) {
  return (
    <div className="mt-6 grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
      <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-tf-border bg-tf-bg-page p-4">
        {qrCode?.code ? (
          <QRCodeSVG bgColor="#FFFFFF" fgColor="#111827" size={180} value={qrCode.code} />
        ) : (
          <QrCode className="h-16 w-16 text-tf-text-faint" />
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-[15px] font-semibold text-tf-text-primary">
            Aguardando conexão
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-tf-text-muted">
            Abra o WhatsApp &gt; Menu &gt; Dispositivos conectados &gt;
            Conectar.
          </p>
          {qrCode?.pairingCode ? (
            <p className="mt-3 rounded-md bg-tf-bg-page px-3 py-2 text-[12px] text-tf-text-muted">
              Código de pareamento:{" "}
              <span className="font-semibold text-tf-text-primary">
                {qrCode.pairingCode}
              </span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={busyAction === "qrcode"}
            onClick={onGenerateQRCode}
            type="button"
          >
            {busyAction === "qrcode" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <QrCode className="h-3.5 w-3.5" />
            )}
            Gerar QR Code
          </Button>
          <Button
            disabled={busyAction === "status"}
            onClick={onVerify}
            type="button"
            variant="outline"
          >
            {busyAction === "status" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Verificar conexão
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConnectedContent({
  authorizedNumbers,
  busyAction,
  numberBusyAction,
  numbersLoading,
  onAddNumber,
  onChangeNumber,
  onEditNumber,
  onLogout,
  onRemoveNumber,
  onToggleNumber,
  showAgentControls
}: {
  authorizedNumbers: AuthorizedNumber[];
  busyAction: string | null;
  numberBusyAction: string | null;
  numbersLoading: boolean;
  onAddNumber: () => void;
  onChangeNumber: () => void;
  onEditNumber: (number: AuthorizedNumber) => void;
  onLogout: () => void;
  onRemoveNumber: (number: AuthorizedNumber) => void;
  onToggleNumber: (number: AuthorizedNumber) => void;
  showAgentControls: boolean;
}) {
  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-lg border border-[#9FE1CB] bg-tf-teal-bg p-4">
        <div className="flex items-center gap-2 text-[13px] font-medium text-tf-teal-text">
          <CheckCircle2 className="h-4 w-4" />
          {showAgentControls
            ? "Instância pronta para receber mensagens."
            : "Instância pronta para envio de notificações."}
        </div>
      </div>

      {showAgentControls ? (
        <>
          <AuthorizedNumbersSection
            busyAction={numberBusyAction}
            loading={numbersLoading}
            numbers={authorizedNumbers}
            onAdd={onAddNumber}
            onEdit={onEditNumber}
            onRemove={onRemoveNumber}
            onToggleActive={onToggleNumber}
          />

          <Button
            disabled={busyAction === "logout"}
            onClick={onLogout}
            type="button"
            variant="outline"
          >
            {busyAction === "logout" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Power className="h-3.5 w-3.5" />
            )}
            Desconectar
          </Button>
        </>
      ) : (
        <Button
          disabled={busyAction === "logout" || busyAction === "qrcode"}
          onClick={onChangeNumber}
          type="button"
          variant="outline"
        >
          {busyAction === "logout" || busyAction === "qrcode" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Trocar número
        </Button>
      )}
    </div>
  );
}

function AuthorizedNumbersSection({
  busyAction,
  loading,
  numbers,
  onAdd,
  onEdit,
  onRemove,
  onToggleActive
}: {
  busyAction: string | null;
  loading: boolean;
  numbers: AuthorizedNumber[];
  onAdd: () => void;
  onEdit: (number: AuthorizedNumber) => void;
  onRemove: (number: AuthorizedNumber) => void;
  onToggleActive: (number: AuthorizedNumber) => void;
}) {
  return (
    <section className="rounded-lg border border-tf-border bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-tf-text-primary">
            Números autorizados
          </h2>
          <p className="mt-1 text-[12px] text-tf-text-muted">
            Somente estes números podem conversar com o agente.
          </p>
        </div>
        <Button onClick={onAdd} type="button">
          <Plus className="h-3.5 w-3.5" />
          Adicionar número
        </Button>
      </div>

      {loading ? (
        <div className="mt-4 flex h-20 items-center justify-center rounded-md border border-dashed border-tf-border">
          <Loader2 className="h-4 w-4 animate-spin text-tf-purple" />
        </div>
      ) : numbers.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-tf-border bg-tf-bg-page px-3 py-4 text-[12px] text-tf-text-muted">
          Nenhum número autorizado ainda.
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {numbers.map((number) => (
            <AuthorizedNumberItem
              busy={busyAction === number.id}
              key={number.id}
              number={number}
              onEdit={onEdit}
              onRemove={onRemove}
              onToggleActive={onToggleActive}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function AuthorizedNumberItem({
  busy,
  number,
  onEdit,
  onRemove,
  onToggleActive
}: {
  busy: boolean;
  number: AuthorizedNumber;
  onEdit: (number: AuthorizedNumber) => void;
  onRemove: (number: AuthorizedNumber) => void;
  onToggleActive: (number: AuthorizedNumber) => void;
}) {
  return (
    <div className="rounded-md border border-tf-border bg-tf-bg-page p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-tf-text-primary">
            {number.label || "Sem nome"}
          </p>
          <p className="mt-0.5 text-[12px] text-tf-text-muted">
            {formatPhone(number.phone)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PermissionBadges number={number} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActiveSwitch
            active={number.active}
            busy={busy}
            onToggle={() => onToggleActive(number)}
          />
          <Button
            disabled={busy}
            onClick={() => onEdit(number)}
            type="button"
            variant="outline"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Editar
          </Button>
          <Button
            className="border-rose-200 text-rose-700 hover:border-rose-400 hover:text-rose-800"
            disabled={busy}
            onClick={() => onRemove(number)}
            type="button"
            variant="outline"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remover
          </Button>
        </div>
      </div>
    </div>
  );
}

function PermissionBadges({ number }: { number: AuthorizedNumber }) {
  const permissions = [
    {
      active: number.can_create_task,
      label: "Criar",
      className: "bg-emerald-100 text-emerald-700"
    },
    {
      active: number.can_read_tasks,
      label: "Consultar",
      className: "bg-sky-100 text-sky-700"
    },
    {
      active: number.can_delete_task,
      label: "Deletar",
      className: "bg-rose-100 text-rose-700"
    },
    {
      active: number.can_add_reminder,
      label: "Lembretes",
      className: "bg-amber-100 text-amber-700"
    }
  ].filter((permission) => permission.active);

  if (permissions.length === 0) {
    return <Badge variant="slate">Sem permissões</Badge>;
  }

  return permissions.map((permission) => (
    <Badge className={permission.className} key={permission.label}>
      {permission.label}
    </Badge>
  ));
}

function ActiveSwitch({
  active,
  busy,
  onToggle
}: {
  active: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full border px-2.5 text-[12px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-500"
      )}
      disabled={busy}
      onClick={onToggle}
      type="button"
    >
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full",
          active ? "bg-emerald-500" : "bg-slate-300"
        )}
      />
      {active ? "Ativo" : "Inativo"}
    </button>
  );
}

function AuthorizedNumberModal({
  busy,
  form,
  mode,
  onChange,
  onClose,
  onSubmit,
  submitError
}: {
  busy: boolean;
  form: NumberFormState;
  mode: Exclude<NumberModalMode, null>;
  onChange: (form: NumberFormState) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitError: string | null;
}) {
  const editing = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6">
      <div className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-semibold text-tf-text-primary">
              {editing ? "Editar permissões" : "Adicionar número"}
            </h2>
            <p className="mt-1 text-[12px] text-tf-text-muted">
              Configure o acesso deste número ao agente.
            </p>
          </div>
          <button
            aria-label="Fechar modal"
            className="flex h-8 w-8 items-center justify-center rounded-md text-tf-text-muted hover:bg-tf-bg-page hover:text-tf-text-primary"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-tf-text-primary">
              Telefone
            </span>
            <input
              className="h-10 w-full rounded-md border border-tf-border bg-white px-3 text-[13px] outline-none transition focus:border-tf-purple focus:ring-4 focus:ring-tf-purple-light disabled:bg-tf-bg-page disabled:text-tf-text-muted"
              disabled={editing}
              onChange={(event) =>
                onChange({ ...form, phone: event.target.value })
              }
              placeholder="5598999990000"
              value={form.phone}
            />
            <span className="mt-1 block text-[11px] text-tf-text-faint">
              Use apenas dígitos, com DDI e DDD.
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-tf-text-primary">
              Apelido
            </span>
            <input
              className="h-10 w-full rounded-md border border-tf-border bg-white px-3 text-[13px] outline-none transition focus:border-tf-purple focus:ring-4 focus:ring-tf-purple-light"
              maxLength={50}
              onChange={(event) =>
                onChange({ ...form, label: event.target.value })
              }
              placeholder="Meu celular"
              value={form.label}
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <PermissionToggle
              checked={form.can_read_tasks}
              label="Consultar tarefas"
              onChange={(checked) =>
                onChange({ ...form, can_read_tasks: checked })
              }
            />
            <PermissionToggle
              checked={form.can_create_task}
              label="Criar tarefas"
              onChange={(checked) =>
                onChange({ ...form, can_create_task: checked })
              }
            />
            <PermissionToggle
              checked={form.can_delete_task}
              label="Deletar tarefas"
              onChange={(checked) =>
                onChange({ ...form, can_delete_task: checked })
              }
            />
            <PermissionToggle
              checked={form.can_add_reminder}
              label="Adicionar lembretes"
              onChange={(checked) =>
                onChange({ ...form, can_add_reminder: checked })
              }
            />
          </div>

          {submitError ? (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700">
              {submitError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} type="submit">
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {editing ? "Salvar" : "Adicionar"}
            </Button>
            <Button disabled={busy} onClick={onClose} type="button" variant="outline">
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PermissionToggle({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      aria-pressed={checked}
      className={cn(
        "flex h-11 items-center justify-between rounded-md border px-3 text-left text-[12px] font-medium transition",
        checked
          ? "border-tf-purple bg-tf-purple-light text-tf-purple"
          : "border-tf-border bg-white text-tf-text-muted"
      )}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <span>{label}</span>
      <span
        className={cn(
          "h-4 w-4 rounded-full border",
          checked ? "border-tf-purple bg-tf-purple" : "border-slate-300"
        )}
      />
    </button>
  );
}

function DisconnectedContent({
  busyAction,
  onReconnect
}: {
  busyAction: string | null;
  onReconnect: () => void;
}) {
  return (
    <div className="mt-6 rounded-lg border border-tf-border bg-tf-bg-page p-4">
      <div className="flex items-start gap-3">
        <WifiOff className="mt-0.5 h-4 w-4 text-tf-coral-text" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold text-tf-text-primary">
            Instância desconectada
          </h2>
          <p className="mt-1 text-[13px] text-tf-text-muted">
            Gere um novo QR Code para reconectar este dispositivo.
          </p>
          <Button
            className="mt-4"
            disabled={busyAction === "qrcode"}
            onClick={onReconnect}
            type="button"
          >
            {busyAction === "qrcode" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <QrCode className="h-3.5 w-3.5" />
            )}
            Reconectar
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: WhatsappInstanceStatus }) {
  if (status === "open") {
    return <Badge variant="teal">Conectado</Badge>;
  }

  if (status === "close") {
    return <Badge variant="coral">Desconectado</Badge>;
  }

  return <Badge variant="amber">Aguardando conexão</Badge>;
}

function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-tf-border bg-white p-5", className)}>
      {children}
    </div>
  );
}

function createEmptyNumberForm(): NumberFormState {
  return {
    phone: "",
    label: "",
    can_create_task: true,
    can_read_tasks: true,
    can_delete_task: false,
    can_add_reminder: true
  };
}

function formatPhone(phone: string) {
  if (phone.length === 13 && phone.startsWith("55")) {
    return `+55 (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
  }

  if (phone.length === 12 && phone.startsWith("55")) {
    return `+55 (${phone.slice(2, 4)}) ${phone.slice(4, 8)}-${phone.slice(8)}`;
  }

  return `+${phone}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
