import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { processMessage } from "../agents/task-agent";
import { env } from "../config/env";
import { getAuthorizedNumberByPhone } from "../services/authorized-number.service";
import { sendTextMessage } from "../services/evolution.service";
import { findPublicUserById } from "../services/auth.service";
import { transcribeAudio } from "../services/whisper.service";
import { createWhatsappLog } from "../services/whatsapp-log.service";
import {
  getWhatsappInstanceByName,
  updateWhatsappInstanceStatus
} from "../services/whatsapp-instance.service";
import type { EvolutionConnectionState } from "../services/evolution.service";

type JsonObject = Record<string, unknown>;

const webhookPayloadSchema = z
  .object({
    event: z.string().optional(),
    instance: z.string().optional(),
    data: z
      .object({
        instance: z.string().optional(),
        key: z
          .object({
            remoteJid: z.string().optional(),
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
      if (!isValidWebhookApiKey(request.headers.apikey)) {
        return reply.code(200).send({
          success: false,
          data: null,
          message: "Webhook ignorado.",
          error: "API key inválida."
        });
      }

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
      const extractedMessage = await extractMessageContent(payload);
      const inboundContent = extractedMessage.text || "[mensagem sem texto]";

      if (!phone) {
        await createWhatsappLog({
          userId: user.id,
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

      const authorizedNumber = await getAuthorizedNumberByPhone(
        instance.id,
        phone,
        true
      );

      if (!authorizedNumber) {
        const response =
          "Seu numero nao esta autorizado a usar este agente. Entre em contato com o administrador do TaskFlow.";

        await createWhatsappLog({
          userId: user.id,
          direction: "inbound",
          content: inboundContent,
          mediaType: extractedMessage.mediaType,
          processed: false
        });
        await sendTextMessage(instance.instance_name, phone, response);

        return reply.code(200).send({
          success: true,
          data: { processed: false, response },
          message: "Número não autorizado.",
          error: null
        });
      }

      if (!extractedMessage.text) {
        const response =
          "Recebi sua mensagem, mas não consegui identificar texto ou áudio para processar.";
        await createWhatsappLog({
          userId: user.id,
          direction: "inbound",
          content: inboundContent,
          mediaType: extractedMessage.mediaType,
          processed: false
        });
        await sendTextMessage(instance.instance_name, phone, response);
        await createWhatsappLog({
          userId: user.id,
          direction: "outbound",
          content: response,
          processed: true
        });

        return reply.code(200).send({
          success: true,
          data: { processed: false, response },
          message: "Mensagem sem conteúdo processável.",
          error: null
        });
      }

      const agentResponse = await processMessage({
        text: extractedMessage.text,
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
        direction: "inbound",
        content: inboundContent,
        mediaType: extractedMessage.mediaType,
        processed: true
      });
      await sendTextMessage(instance.instance_name, phone, agentResponse);
      await createWhatsappLog({
        userId: user.id,
        direction: "outbound",
        content: agentResponse,
        processed: true
      });

      return reply.code(200).send({
        success: true,
        data: {
          processed: true,
          response: agentResponse
        },
        message: "Mensagem processada com sucesso.",
        error: null
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

async function extractMessageContent(payload: z.infer<typeof webhookPayloadSchema>) {
  const text = extractText(payload);

  if (text) {
    return {
      text,
      mediaType: null
    };
  }

  const audioUrl = extractAudioUrl(payload);

  if (!audioUrl) {
    return {
      text: null,
      mediaType: null
    };
  }

  const transcription = await transcribeAudio(audioUrl);

  return {
    text: transcription.trim() || null,
    mediaType: "audio"
  };
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

  return (
    readString(data, ["key", "remoteJid"]) ??
    readString(data, ["sender"]) ??
    readString(asRecord(payload), ["sender"])
  );
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

function extractAudioUrl(payload: z.infer<typeof webhookPayloadSchema>) {
  const data = asRecord(payload.data);
  const message = asRecord(payload.data?.message);

  const candidates = [
    readString(message, ["audioMessage", "url"]),
    readString(message, ["audioMessage", "mediaUrl"]),
    readString(data, ["message", "audioMessage", "url"]),
    readString(data, ["message", "audioMessage", "mediaUrl"]),
    readString(data, ["mediaUrl"]),
    readString(data, ["url"])
  ];

  return candidates.find(Boolean) ?? null;
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

function isValidWebhookApiKey(value: string | string[] | undefined) {
  const headerValue = Array.isArray(value) ? value[0] : value;
  return headerValue === env.EVOLUTION_API_KEY;
}

function normalizeWhatsappPhone(rawPhone: string) {
  if (rawPhone.includes("@g.us")) {
    return null;
  }

  const phone = rawPhone
    .replace(/@s\.whatsapp\.net$/i, "")
    .replace(/@c\.us$/i, "")
    .replace(/\D/g, "");

  return phone.length > 0 ? phone : null;
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
