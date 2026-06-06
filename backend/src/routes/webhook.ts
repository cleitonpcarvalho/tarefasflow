import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { processMessage } from "../agents/task-agent";
import { sql } from "../config/db";
import { env } from "../config/env";
import { getAuthorizedNumberByPhones } from "../services/authorized-number.service";
import {
  findMessageReplyTarget,
  getMediaMessageBase64,
  sendTextMessage,
  type EvolutionSendResult
} from "../services/evolution.service";
import { findPublicUserById } from "../services/auth.service";
import { transcribeAudio } from "../services/whisper.service";
import { createWhatsappLog } from "../services/whatsapp-log.service";
import {
  getWhatsappInstanceByName,
  updateWhatsappInstanceStatus
} from "../services/whatsapp-instance.service";
import type { EvolutionConnectionState } from "../services/evolution.service";

type JsonObject = Record<string, unknown>;
type ExtractedMessage =
  | {
      type: "text";
      content: string;
      mediaType: null;
      mimeType: null;
    }
  | {
      type: "audio";
      content: string | null;
      mediaType: "audio";
      mimeType: string;
    }
  | {
      type: "unknown";
      content: null;
      mediaType: null;
      mimeType: null;
    };

const webhookPayloadSchema = z
  .object({
    event: z.string().optional(),
    instance: z.string().optional(),
    apikey: z.union([z.string(), z.number()]).optional(),
    data: z
      .object({
        instance: z.string().optional(),
        key: z
          .object({
            id: z.string().optional(),
            remoteJid: z.string().optional(),
            remoteJidAlt: z.string().optional(),
            senderPn: z.string().optional(),
            senderLid: z.string().optional(),
            addressingMode: z.string().optional(),
            fromMe: z.boolean().optional()
          })
          .passthrough()
          .optional(),
        message: z.record(z.unknown()).optional(),
        messageType: z.string().optional(),
        sender: z.string().optional(),
        data: z.record(z.unknown()).optional()
      })
      .passthrough()
      .optional()
  })
  .passthrough();

export const webhookRoutes: FastifyPluginAsync = async (app) => {
  app.post("/whatsapp", async (request, reply) => {
    try {
      const parsedPayload = webhookPayloadSchema.safeParse(request.body);

      if (!parsedPayload.success) {
        return reply.code(200).send({
          success: false,
          data: null,
          message: "Webhook ignorado.",
          error: "Payload inválido."
        });
      }

      const payload = parsedPayload.data;
      const receivedApiKey = getReceivedApiKey(
        payload.apikey,
        request.headers.apikey
      );

      app.log.info(
        {
          event: payload.event,
          instance: payload.instance,
          apikey: maskApiKey(receivedApiKey),
          remoteJid: payload.data?.key?.remoteJid
        },
        "Webhook WhatsApp recebido"
      );

      if (!(await isValidWebhookApiKey(receivedApiKey))) {
        app.log.warn(
          { receivedApiKey: maskApiKey(receivedApiKey) },
          "Webhook rejeitado: apikey inválida"
        );

        return reply.code(200).send({
          success: false,
          data: null,
          message: "Webhook ignorado.",
          error: "API key inválida."
        });
      }

      const instanceName = extractInstanceName(payload);

      if (!instanceName) {
        app.log.info("Webhook WhatsApp ignorado: instância ausente.");
        return reply.code(200).send({
          success: true,
          data: { ignored: true, reason: "Instância ausente." },
          message: "Webhook recebido.",
          error: null
        });
      }

      const instance = await getWhatsappInstanceByName(instanceName);

      if (!instance) {
        app.log.info(
          { instanceName },
          "Webhook WhatsApp ignorado: instância não encontrada."
        );
        return reply.code(200).send({
          success: true,
          data: { ignored: true, reason: "Instância não encontrada." },
          message: "Webhook recebido.",
          error: null
        });
      }

      if (isConnectionUpdateEvent(payload.event)) {
        const state = extractConnectionState(payload);

        if (state) {
          await updateWhatsappInstanceStatus(instance.instance_name, state);
        }

        return reply.code(200).send({
          success: true,
          data: { processed: true, state },
          message: "Status da instância atualizado.",
          error: null
        });
      }

      if (!isMessageEvent(payload.event)) {
        return reply.code(200).send({
          success: true,
          data: { ignored: true, reason: "Evento não processado." },
          message: "Webhook recebido.",
          error: null
        });
      }

      if (payload.data?.key?.fromMe) {
        return reply.code(200).send({
          success: true,
          data: { ignored: true, reason: "Mensagem enviada pela instância." },
          message: "Webhook recebido.",
          error: null
        });
      }

      const user = await findPublicUserById(instance.user_id);

      if (!user) {
        app.log.info(
          { instanceName },
          "Webhook WhatsApp ignorado: usuário da instância não encontrado."
        );
        return reply.code(200).send({
          success: true,
          data: { ignored: true, reason: "Usuário não encontrado." },
          message: "Webhook recebido.",
          error: null
        });
      }

      const rawPhone = extractRawPhone(payload);
      const phone = rawPhone ? normalizeWhatsappPhone(rawPhone) : null;
      const phoneVariants = phone ? normalizePhone(phone) : [];
      const replyTarget = await resolveReplyTarget(
        payload,
        instance.instance_name,
        phone
      );
      const extractedMessage = extractMessageContent(payload);
      let inboundContent =
        extractedMessage.type === "text"
          ? extractedMessage.content
          : extractedMessage.type === "audio"
            ? "[áudio recebido]"
            : "[mensagem sem texto]";

      if (!phone || phoneVariants.length === 0) {
        await createWhatsappLog({
          userId: user.id,
          phone,
          direction: "inbound",
          content: inboundContent,
          mediaType: extractedMessage.mediaType,
          processed: false
        });

        return reply.code(200).send({
          success: true,
          data: { processed: false, reason: "Telefone não identificado." },
          message: "Webhook recebido.",
          error: null
        });
      }

      const authorizedNumber = await getAuthorizedNumberByPhones(
        instance.id,
        phoneVariants,
        true
      );

      if (!authorizedNumber) {
        const response =
          "Seu numero nao esta autorizado a usar este agente. Entre em contato com o administrador do TarefasFlow.";

        await createWhatsappLog({
          userId: user.id,
          phone,
          direction: "inbound",
          content: inboundContent,
          mediaType: extractedMessage.mediaType,
          processed: false
        });
        const delivery = await sendAgentResponse(
          app,
          instance.instance_name,
          replyTarget ?? phone,
          response
        );

        return reply.code(200).send({
          success: true,
          data: { processed: false, response, delivery },
          message: "Número não autorizado.",
          error: null
        });
      }

      let messageText =
        extractedMessage.type === "text" ? extractedMessage.content : null;

      if (extractedMessage.type === "audio") {
        app.log.info(
          {
            instanceName: instance.instance_name,
            messageId: payload.data?.key?.id,
            hasBase64: Boolean(extractedMessage.content),
            mimeType: extractedMessage.mimeType
          },
          "Áudio do WhatsApp detectado"
        );

        const transcription = await transcribeWhatsappAudio({
          app,
          extractedMessage,
          instanceName: instance.instance_name,
          messageId: payload.data?.key?.id
        });

        if (transcription) {
          messageText = transcription;
          inboundContent = transcription;
          app.log.info(
            {
              instanceName: instance.instance_name,
              messageId: payload.data?.key?.id,
              transcriptionLength: transcription.length
            },
            "Áudio do WhatsApp transcrito"
          );
        }
      }

      if (!messageText) {
        const response =
          extractedMessage.type === "audio"
            ? "Não consegui entender o áudio. Pode repetir em texto?"
            : "Recebi sua mensagem, mas não consegui identificar texto ou áudio para processar.";
        await createWhatsappLog({
          userId: user.id,
          phone,
          direction: "inbound",
          content: inboundContent,
          mediaType: extractedMessage.mediaType,
          processed: false
        });
        const delivery = await sendAgentResponse(
          app,
          instance.instance_name,
          replyTarget ?? phone,
          response
        );
        await createWhatsappLog({
          userId: user.id,
          phone,
          direction: "outbound",
          content: response,
          processed: delivery.delivered
        });

        return reply.code(200).send({
          success: true,
          data: { processed: false, response, delivery },
          message: "Mensagem sem conteúdo processável.",
          error: null
        });
      }

      const agentResponse = await processMessage({
        text: messageText,
        userId: user.id,
        userPhone: phone,
        userName: user.name,
        permissions: {
          can_create_task: authorizedNumber.can_create_task,
          can_read_tasks: authorizedNumber.can_read_tasks,
          can_delete_task: authorizedNumber.can_delete_task,
          can_add_reminder: authorizedNumber.can_add_reminder
        }
      });

      await createWhatsappLog({
        userId: user.id,
        phone,
        direction: "inbound",
        content: inboundContent,
        mediaType: extractedMessage.mediaType,
        processed: true
      });
      const delivery = await sendAgentResponse(
        app,
        instance.instance_name,
        replyTarget ?? phone,
        agentResponse
      );
      await createWhatsappLog({
        userId: user.id,
        phone,
        direction: "outbound",
        content: agentResponse,
        processed: delivery.delivered
      });

      return reply.code(200).send({
        success: delivery.delivered,
        data: {
          processed: delivery.delivered,
          response: agentResponse,
          delivery
        },
        message: delivery.delivered
          ? "Mensagem processada e entregue com sucesso."
          : "Mensagem processada, mas não entregue pelo WhatsApp.",
        error: delivery.error
      });
    } catch (error) {
      app.log.error({ err: error }, "Erro no webhook WhatsApp");

      return reply.code(200).send({
        success: false,
        data: null,
        message: "Webhook recebido, mas não processado.",
        error: "Erro interno ao processar webhook."
      });
    }
  });
};

function extractMessageContent(
  payload: z.infer<typeof webhookPayloadSchema>
): ExtractedMessage {
  const text = extractText(payload);

  if (text) {
    return {
      type: "text",
      content: text,
      mediaType: null,
      mimeType: null
    };
  }

  const data = asRecord(payload.data);
  const message = asRecord(payload.data?.message);
  const audioMessage = asRecord(message?.audioMessage);

  if (!audioMessage) {
    return {
      type: "unknown",
      content: null,
      mediaType: null,
      mimeType: null
    };
  }

  const base64 =
    readString(message, ["base64"]) ??
    readString(data, ["message", "base64"]);

  return {
    type: "audio",
    content: normalizeText(base64),
    mediaType: "audio",
    mimeType:
      readString(audioMessage, ["mimetype"])?.split(";")[0]?.trim() ??
      "audio/ogg"
  };
}

async function transcribeWhatsappAudio({
  app,
  extractedMessage,
  instanceName,
  messageId
}: {
  app: Parameters<FastifyPluginAsync>[0];
  extractedMessage: Extract<ExtractedMessage, { type: "audio" }>;
  instanceName: string;
  messageId?: string;
}) {
  try {
    let audioInput = extractedMessage.content;
    let mimeType = extractedMessage.mimeType;

    if (!audioInput && messageId) {
      const media = await getMediaMessageBase64(instanceName, messageId);
      audioInput = media?.base64 ?? null;
      mimeType = media?.mimeType ?? mimeType;
    }

    if (!audioInput) {
      app.log.warn(
        { instanceName, messageId },
        "Áudio recebido sem base64 e sem mídia recuperável"
      );
      return null;
    }

    const transcription = await transcribeAudio(audioInput, mimeType);
    return normalizeText(transcription);
  } catch (error) {
    app.log.error(
      { err: error, instanceName, messageId },
      "Erro ao transcrever áudio do WhatsApp"
    );
    return null;
  }
}

function extractInstanceName(payload: z.infer<typeof webhookPayloadSchema>) {
  const data = asRecord(payload.data);

  return (
    payload.data?.instance ??
    payload.instance ??
    readString(data, ["data", "instance"]) ??
    null
  );
}

function extractConnectionState(
  payload: z.infer<typeof webhookPayloadSchema>
): EvolutionConnectionState | null {
  const data = asRecord(payload.data);
  const state =
    readString(data, ["data", "state"]) ??
    readString(data, ["state"]) ??
    readString(asRecord(payload), ["state"]);

  if (!state) {
    return null;
  }

  const normalized = state.toLowerCase();

  if (normalized === "open" || normalized === "connecting" || normalized === "created") {
    return normalized;
  }

  if (normalized === "close" || normalized === "closed") {
    return "close";
  }

  return null;
}

function extractRawPhone(payload: z.infer<typeof webhookPayloadSchema>) {
  const data = asRecord(payload.data);
  const remoteJid = readString(data, ["key", "remoteJid"]);
  const remoteJidAlt = readString(data, ["key", "remoteJidAlt"]);
  const senderPn = readString(data, ["key", "senderPn"]);

  return (
    (isPhoneJid(remoteJid) ? remoteJid : null) ??
    (isPhoneJid(remoteJidAlt) ? remoteJidAlt : null) ??
    (isPhoneJid(senderPn) ? senderPn : null) ??
    readString(data, ["sender"]) ??
    readString(asRecord(payload), ["sender"])
  );
}

async function resolveReplyTarget(
  payload: z.infer<typeof webhookPayloadSchema>,
  instanceName: string,
  fallbackPhone: string | null
) {
  const data = asRecord(payload.data);
  const directCandidates = [
    readString(data, ["key", "remoteJid"]),
    readString(data, ["key", "remoteJidAlt"]),
    readString(data, ["key", "senderLid"])
  ];
  const directLid = directCandidates.find(isLidJid);

  if (directLid) {
    return directLid;
  }

  const messageId = readString(data, ["key", "id"]);

  if (messageId) {
    const storedTarget = await findMessageReplyTarget(instanceName, messageId);

    if (storedTarget) {
      return storedTarget;
    }
  }

  return fallbackPhone;
}

function extractText(payload: z.infer<typeof webhookPayloadSchema>) {
  const data = asRecord(payload.data);
  const message = asRecord(payload.data?.message);

  const candidates = [
    readString(message, ["conversation"]),
    readString(message, ["extendedTextMessage", "text"]),
    readString(message, ["imageMessage", "caption"]),
    readString(message, ["videoMessage", "caption"]),
    readString(message, ["documentMessage", "caption"]),
    readString(message, ["buttonsResponseMessage", "selectedDisplayText"]),
    readString(message, ["listResponseMessage", "title"]),
    readString(message, ["templateButtonReplyMessage", "selectedDisplayText"]),
    readString(data, ["message", "text"]),
    readString(data, ["text"])
  ];

  return normalizeText(candidates.find(Boolean) ?? null);
}

function isConnectionUpdateEvent(event: string | undefined) {
  return normalizeEvent(event) === "connection.update";
}

function isMessageEvent(event: string | undefined) {
  const normalizedEvent = normalizeEvent(event);
  return normalizedEvent === "messages.upsert";
}

function normalizeEvent(event: string | undefined) {
  return event?.trim().toLowerCase().replace(/_/g, ".") ?? "";
}

async function isValidWebhookApiKey(receivedApiKey: string) {
  if (!receivedApiKey) {
    return false;
  }

  const instances = await sql<{ instance_token: string | null }[]>`
    SELECT instance_token
    FROM whatsapp_instances
    WHERE instance_token IS NOT NULL
  `;
  const validKeys = [
    env.EVOLUTION_API_KEY,
    env.EVOLUTION_INSTANCE_APIKEY,
    ...instances.map((instance) => instance.instance_token)
  ].filter((key): key is string => Boolean(key));

  return validKeys.includes(receivedApiKey);
}

function getReceivedApiKey(
  payloadApiKey: string | number | undefined,
  headerApiKey: string | string[] | undefined
) {
  if (payloadApiKey !== undefined && String(payloadApiKey).length > 0) {
    return String(payloadApiKey);
  }

  const headerValue = Array.isArray(headerApiKey)
    ? headerApiKey[0]
    : headerApiKey;

  return String(headerValue ?? "");
}

function maskApiKey(apiKey: string) {
  return apiKey ? `${apiKey.slice(0, 8)}...` : "";
}

function normalizeWhatsappPhone(rawPhone: string) {
  if (rawPhone.includes("@g.us") || isLidJid(rawPhone)) {
    return null;
  }

  const phone = rawPhone
    .replace(/@s\.whatsapp\.net$/i, "")
    .replace(/@c\.us$/i, "")
    .replace(/\D/g, "");

  return phone.length > 0 ? phone : null;
}

function normalizePhone(phone: string) {
  const clean = phone.replace(/\D/g, "");
  const variants = new Set<string>();

  if (clean) {
    variants.add(clean);
  }

  if (clean.length === 12 && clean.startsWith("55")) {
    const ddd = clean.substring(2, 4);
    const number = clean.substring(4);
    variants.add(`55${ddd}9${number}`);
  }

  if (clean.length === 13 && clean.startsWith("55")) {
    const withoutNinth = `55${clean.substring(2, 4)}${clean.substring(5)}`;
    variants.add(withoutNinth);
  }

  return [...variants];
}

function isPhoneJid(value: string | null) {
  return Boolean(
    value &&
      (value.toLowerCase().endsWith("@s.whatsapp.net") ||
        value.toLowerCase().endsWith("@c.us"))
  );
}

function isLidJid(value: string | null | undefined) {
  return Boolean(value?.toLowerCase().endsWith("@lid"));
}

async function sendAgentResponse(
  app: Parameters<FastifyPluginAsync>[0],
  instanceName: string,
  destination: string,
  content: string
): Promise<EvolutionSendResult> {
  const delivery = await sendTextMessage(instanceName, destination, content);
  const logContext = {
    instanceName,
    destination,
    messageId: delivery.messageId,
    remoteJid: delivery.remoteJid,
    deliveryStatus: delivery.status,
    delivered: delivery.delivered,
    error: delivery.error
  };

  if (delivery.delivered) {
    app.log.info(logContext, "Resposta do agente entregue pelo WhatsApp");
  } else {
    app.log.error(logContext, "Falha ao entregar resposta do agente pelo WhatsApp");
  }

  return delivery;
}

function normalizeText(value: string | null) {
  const text = value?.trim();
  return text && text.length > 0 ? text : null;
}

function readString(source: JsonObject | null, path: string[]) {
  let current: unknown = source;

  for (const key of path) {
    const object = asRecord(current);

    if (!object || !(key in object)) {
      return null;
    }

    current = object[key];
  }

  return typeof current === "string" ? current : null;
}

function asRecord(value: unknown): JsonObject | null {
  return typeof value === "object" && value !== null
    ? (value as JsonObject)
    : null;
}
