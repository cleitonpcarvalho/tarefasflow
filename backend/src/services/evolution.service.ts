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

const defaultHeaders = {
  "Content-Type": "application/json",
  apikey: env.EVOLUTION_API_KEY
};

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
        base64: false,
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
  phone: string,
  text: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${env.EVOLUTION_API_URL}/message/sendText/${instanceName}`,
      {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify({
          number: phone,
          text
        })
      }
    );

    if (!response.ok) {
      console.error(
        `Erro ao enviar mensagem Evolution: HTTP ${response.status}`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Erro ao enviar mensagem Evolution:", error);
    return false;
  }
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
