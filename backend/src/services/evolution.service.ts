import { env } from "../config/env";

export type EvolutionConnectionState = "created" | "connecting" | "open" | "close";

export class EvolutionServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "EvolutionServiceError";
    this.statusCode = statusCode;
  }
}

interface CreateInstanceResponse {
  instance?: {
    instanceName?: string;
    instanceId?: string;
    status?: string;
  };
  hash?: string | {
    apikey?: string;
  };
  token?: string;
}

interface QRCodeResponse {
  code?: string;
  pairingCode?: string;
}

interface ConnectionStateResponse {
  instance?: {
    instanceName?: string;
    state?: string;
  };
}

interface EvolutionMessageKey {
  id?: string;
  remoteJid?: string;
  remoteJidAlt?: string;
  fromMe?: boolean;
  addressingMode?: string;
}

interface EvolutionMessageRecord {
  key?: EvolutionMessageKey;
  MessageUpdate?: Array<{
    status?: string;
  }>;
}

interface EvolutionFindMessagesResponse {
  messages?: {
    records?: EvolutionMessageRecord[];
  };
}

interface EvolutionSendTextResponse {
  key?: EvolutionMessageKey;
  status?: string;
}

interface EvolutionMediaResponse {
  base64?: string;
  mimetype?: string;
}

export interface EvolutionSendResult {
  accepted: boolean;
  delivered: boolean;
  messageId: string | null;
  remoteJid: string | null;
  status: string;
  error: string | null;
}

const defaultHeaders = {
  "Content-Type": "application/json",
  apikey: env.EVOLUTION_API_KEY
};

const deliveryStatuses = new Set([
  "SERVER_ACK",
  "DELIVERY_ACK",
  "READ",
  "PLAYED"
]);

const deliveryPollAttempts = 8;
const deliveryPollIntervalMs = 750;

export async function createInstance(
  instanceName: string,
  webhookUrl: string
): Promise<{
  instanceName: string;
  instanceToken: string | null;
  status: EvolutionConnectionState;
}> {
  const response = await fetch(`${env.EVOLUTION_API_URL}/instance/create`, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify({
      instanceName,
      integration: "WHATSAPP-BAILEYS",
      qrcode: false,
      groupsIgnore: true,
      readMessages: true,
      webhook: {
        url: webhookUrl,
        byEvents: false,
        base64: true,
        events: [
          "QRCODE_UPDATED",
          "MESSAGES_UPSERT",
          "CONNECTION_UPDATE",
          "SEND_MESSAGE"
        ]
      }
    })
  });

  const payload = (await readJson(response)) as CreateInstanceResponse | null;

  if (!response.ok) {
    throw new EvolutionServiceError(
      getEvolutionErrorMessage(payload, "Erro ao criar instância na Evolution."),
      response.status
    );
  }

  return {
    instanceName: payload?.instance?.instanceName ?? instanceName,
    instanceToken: extractInstanceToken(payload),
    status: normalizeConnectionState(payload?.instance?.status ?? "created")
  };
}

export async function getQRCode(instanceName: string): Promise<{
  code: string;
  pairingCode: string | null;
}> {
  const response = await fetch(
    `${env.EVOLUTION_API_URL}/instance/connect/${instanceName}`,
    {
      method: "GET",
      headers: defaultHeaders
    }
  );
  const payload = (await readJson(response)) as QRCodeResponse | null;

  if (!response.ok) {
    throw new EvolutionServiceError(
      getEvolutionErrorMessage(payload, "Erro ao gerar QR Code."),
      response.status
    );
  }

  return {
    code: payload?.code ?? "",
    pairingCode: payload?.pairingCode ?? null
  };
}

export async function getConnectionState(instanceName: string): Promise<{
  state: EvolutionConnectionState;
}> {
  const response = await fetch(
    `${env.EVOLUTION_API_URL}/instance/connectionState/${instanceName}`,
    {
      method: "GET",
      headers: defaultHeaders
    }
  );
  const payload = (await readJson(response)) as ConnectionStateResponse | null;

  if (!response.ok) {
    throw new EvolutionServiceError(
      getEvolutionErrorMessage(payload, "Erro ao consultar status da instância."),
      response.status
    );
  }

  return {
    state: normalizeConnectionState(payload?.instance?.state ?? "close")
  };
}

export async function deleteInstance(instanceName: string): Promise<void> {
  await runDeleteRequest(
    `${env.EVOLUTION_API_URL}/instance/delete/${instanceName}`,
    "Erro ao deletar instância."
  );
}

export async function logoutInstance(instanceName: string): Promise<void> {
  await runDeleteRequest(
    `${env.EVOLUTION_API_URL}/instance/logout/${instanceName}`,
    "Erro ao desconectar instância."
  );
}

export async function sendTextMessage(
  instanceName: string,
  destination: string,
  text: string
): Promise<EvolutionSendResult> {
  try {
    const response = await fetch(
      `${env.EVOLUTION_API_URL}/message/sendText/${instanceName}`,
      {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify({
          number: destination,
          text
        })
      }
    );
    const payload = (await readJson(response)) as EvolutionSendTextResponse | null;

    if (!response.ok) {
      const error = getEvolutionErrorMessage(
        payload,
        `Evolution recusou o envio com HTTP ${response.status}.`
      );
      console.error(
        "Evolution recusou o envio de mensagem.",
        {
          instanceName,
          destination,
          statusCode: response.status,
          error,
          payload
        }
      );
      return {
        accepted: false,
        delivered: false,
        messageId: null,
        remoteJid: null,
        status: "REJECTED",
        error
      };
    }

    const messageId = payload?.key?.id ?? null;
    const remoteJid = payload?.key?.remoteJid ?? null;

    if (!messageId) {
      const error = "Evolution aceitou o envio, mas não retornou o ID da mensagem.";
      console.error(error, { instanceName, destination, payload });
      return {
        accepted: true,
        delivered: false,
        messageId: null,
        remoteJid,
        status: normalizeDeliveryStatus(payload?.status),
        error
      };
    }

    const delivery = await waitForMessageDelivery(instanceName, messageId);
    const result: EvolutionSendResult = {
      accepted: true,
      delivered: deliveryStatuses.has(delivery.status),
      messageId,
      remoteJid,
      status: delivery.status,
      error:
        delivery.status === "ERROR"
          ? "A Evolution aceitou a mensagem, mas o WhatsApp falhou ao entregá-la."
          : null
    };

    if (!result.delivered) {
      console.error("Mensagem da Evolution não foi confirmada como entregue.", {
        instanceName,
        destination,
        ...result
      });
    }

    return result;
  } catch (error) {
    console.error("Erro ao enviar mensagem Evolution:", error);
    return {
      accepted: false,
      delivered: false,
      messageId: null,
      remoteJid: null,
      status: "ERROR",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function findMessageReplyTarget(
  instanceName: string,
  messageId: string
): Promise<string | null> {
  try {
    const records = await findMessages(instanceName, messageId);
    const lidRecord = records.find((record) =>
      record.key?.remoteJid?.toLowerCase().endsWith("@lid")
    );

    return lidRecord?.key?.remoteJid ?? null;
  } catch (error) {
    console.error("Erro ao recuperar o LID da mensagem na Evolution.", {
      instanceName,
      messageId,
      error
    });
    return null;
  }
}

export async function getMediaMessageBase64(
  instanceName: string,
  messageId: string
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const response = await fetch(
      `${env.EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instanceName}`,
      {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify({
          message: {
            key: {
              id: messageId
            }
          }
        })
      }
    );
    const payload = (await readJson(response)) as EvolutionMediaResponse | null;

    if (!response.ok || !payload?.base64) {
      console.error("Evolution não retornou a mídia da mensagem.", {
        instanceName,
        messageId,
        statusCode: response.status,
        payload
      });
      return null;
    }

    return {
      base64: payload.base64,
      mimeType: payload.mimetype ?? "audio/ogg"
    };
  } catch (error) {
    console.error("Erro ao recuperar mídia da mensagem na Evolution.", {
      instanceName,
      messageId,
      error
    });
    return null;
  }
}

async function waitForMessageDelivery(
  instanceName: string,
  messageId: string
): Promise<{ status: string }> {
  for (let attempt = 0; attempt < deliveryPollAttempts; attempt += 1) {
    if (attempt > 0) {
      await sleep(deliveryPollIntervalMs);
    }

    const records = await findMessages(instanceName, messageId);
    const statuses = records.flatMap((record) =>
      (record.MessageUpdate ?? [])
        .map((update) => normalizeDeliveryStatus(update.status))
        .filter(Boolean)
    );

    if (statuses.includes("ERROR")) {
      return { status: "ERROR" };
    }

    const deliveredStatus = statuses.find((status) =>
      deliveryStatuses.has(status)
    );

    if (deliveredStatus) {
      return { status: deliveredStatus };
    }
  }

  return { status: "PENDING" };
}

async function findMessages(
  instanceName: string,
  messageId: string
): Promise<EvolutionMessageRecord[]> {
  const response = await fetch(
    `${env.EVOLUTION_API_URL}/chat/findMessages/${instanceName}`,
    {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify({
        where: {
          key: {
            id: messageId
          }
        },
        page: 1,
        offset: 10
      })
    }
  );
  const payload = (await readJson(response)) as EvolutionFindMessagesResponse | null;

  if (!response.ok) {
    throw new EvolutionServiceError(
      getEvolutionErrorMessage(
        payload,
        "Erro ao consultar a entrega da mensagem na Evolution."
      ),
      response.status
    );
  }

  return payload?.messages?.records ?? [];
}

function normalizeDeliveryStatus(status: string | undefined) {
  return status?.trim().toUpperCase() || "PENDING";
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function runDeleteRequest(url: string, fallbackMessage: string) {
  const response = await fetch(url, {
    method: "DELETE",
    headers: defaultHeaders
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw new EvolutionServiceError(
      getEvolutionErrorMessage(payload, fallbackMessage),
      response.status
    );
  }
}

async function readJson(response: Response) {
  return response.json().catch(() => null) as Promise<unknown>;
}

function normalizeConnectionState(value: string): EvolutionConnectionState {
  const normalized = value.toLowerCase();

  if (normalized === "open" || normalized === "connecting" || normalized === "created") {
    return normalized;
  }

  return "close";
}

function extractInstanceToken(payload: CreateInstanceResponse | null) {
  if (payload?.token) {
    return payload.token;
  }

  if (typeof payload?.hash === "string") {
    return payload.hash;
  }

  return payload?.hash?.apikey ?? null;
}

function getEvolutionErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload !== null) {
    if ("message" in payload && typeof payload.message === "string") {
      return payload.message;
    }

    if ("error" in payload && typeof payload.error === "string") {
      return payload.error;
    }
  }

  return fallback;
}
