import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { z } from "zod";
import { env } from "../config/env";
import { authenticate } from "../middlewares/authenticate";
import {
  createInstance,
  deleteInstance,
  EvolutionServiceError,
  getConnectionState,
  getQRCode,
  logoutInstance
} from "../services/evolution.service";
import {
  createWhatsappInstance,
  deleteWhatsappInstanceRecord,
  getOwnedWhatsappInstance,
  getWhatsappInstanceByUserId,
  updateWhatsappInstanceStatus
} from "../services/whatsapp-instance.service";
import { listWhatsappLogs } from "../services/whatsapp-log.service";

const instanceBodySchema = z.object({
  instanceName: z
    .string()
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres.")
    .max(30, "Nome deve ter no máximo 30 caracteres.")
    .regex(
      /^[A-Za-z0-9-]+$/,
      "Nome deve conter apenas letras, números e hífen."
    )
});

const instanceParamsSchema = z.object({
  instanceName: z.string().min(1)
});

const logsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  direction: z.enum(["inbound", "outbound"]).optional()
});

export const whatsappRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", authenticate);

  app.post("/instances", async (request, reply) => {
    const parsedBody = instanceBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    const existingInstance = await getWhatsappInstanceByUserId(request.user.id);

    if (existingInstance) {
      return reply.code(409).send({
        success: false,
        data: null,
        message: "Usuário já possui uma instância WhatsApp.",
        error: "Instância já existe."
      });
    }

    const instanceName = buildUniqueInstanceName(
      parsedBody.data.instanceName,
      request.user.id
    );
    const webhookUrl = `${env.WEBHOOK_BASE_URL.replace(/\/$/, "")}/webhook/whatsapp`;

    try {
      const createdInstance = await createInstance(instanceName, webhookUrl);
      const instance = await createWhatsappInstance({
        userId: request.user.id,
        instanceName: createdInstance.instanceName,
        instanceToken: createdInstance.instanceToken,
        status:
          createdInstance.status === "close" ? "created" : createdInstance.status,
        webhookSet: true
      });

      return reply.code(201).send({
        success: true,
        data: instance,
        message: "Instância WhatsApp criada com sucesso.",
        error: null
      });
    } catch (error) {
      return sendEvolutionError(reply, error, "Erro ao criar instância.");
    }
  });

  app.get("/instances/mine", async (request, reply) => {
    const instance = await getWhatsappInstanceByUserId(request.user.id);

    return reply.code(200).send({
      success: true,
      data: instance,
      message: "Instância WhatsApp carregada com sucesso.",
      error: null
    });
  });

  app.get("/instances/:instanceName/qrcode", async (request, reply) => {
    const parsedParams = instanceParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const instance = await getOwnedWhatsappInstance(
      parsedParams.data.instanceName,
      request.user.id
    );

    if (!instance) {
      return sendInstanceNotFound(reply);
    }

    try {
      const qrCode = await getQRCode(instance.instance_name);

      if (instance.status !== "open") {
        await updateWhatsappInstanceStatus(instance.instance_name, "connecting");
      }

      return reply.code(200).send({
        success: true,
        data: qrCode,
        message: "QR Code gerado com sucesso.",
        error: null
      });
    } catch (error) {
      return sendEvolutionError(reply, error, "Erro ao gerar QR Code.");
    }
  });

  app.get("/instances/:instanceName/status", async (request, reply) => {
    const parsedParams = instanceParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const instance = await getOwnedWhatsappInstance(
      parsedParams.data.instanceName,
      request.user.id
    );

    if (!instance) {
      return sendInstanceNotFound(reply);
    }

    try {
      const connection = await getConnectionState(instance.instance_name);
      await updateWhatsappInstanceStatus(instance.instance_name, connection.state);

      return reply.code(200).send({
        success: true,
        data: connection,
        message: "Status da instância carregado com sucesso.",
        error: null
      });
    } catch (error) {
      return sendEvolutionError(reply, error, "Erro ao consultar status.");
    }
  });

  app.delete("/instances/:instanceName", async (request, reply) => {
    const parsedParams = instanceParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const instance = await getOwnedWhatsappInstance(
      parsedParams.data.instanceName,
      request.user.id
    );

    if (!instance) {
      return sendInstanceNotFound(reply);
    }

    try {
      await deleteInstance(instance.instance_name);
      const result = await deleteWhatsappInstanceRecord(
        instance.instance_name,
        request.user.id
      );

      return reply.code(200).send({
        success: true,
        data: result ?? { deleted: true },
        message: "Instância deletada com sucesso.",
        error: null
      });
    } catch (error) {
      return sendEvolutionError(reply, error, "Erro ao deletar instância.");
    }
  });

  app.post("/instances/:instanceName/logout", async (request, reply) => {
    const parsedParams = instanceParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const instance = await getOwnedWhatsappInstance(
      parsedParams.data.instanceName,
      request.user.id
    );

    if (!instance) {
      return sendInstanceNotFound(reply);
    }

    try {
      await logoutInstance(instance.instance_name);
      await updateWhatsappInstanceStatus(instance.instance_name, "close");

      return reply.code(200).send({
        success: true,
        data: { loggedOut: true },
        message: "Instância desconectada com sucesso.",
        error: null
      });
    } catch (error) {
      return sendEvolutionError(reply, error, "Erro ao desconectar instância.");
    }
  });

  app.get("/status", async (request, reply) => {
    const instance = await getWhatsappInstanceByUserId(request.user.id);

    return reply.code(200).send({
      success: true,
      data: {
        connected: instance?.status === "open",
        name: instance?.instance_name ?? "taskflow"
      },
      message: "Status do WhatsApp carregado com sucesso.",
      error: null
    });
  });

  app.get("/logs", async (request, reply) => {
    const parsedQuery = logsQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return sendValidationError(reply, parsedQuery.error);
    }

    const logs = await listWhatsappLogs({
      requesterId: request.user.id,
      requesterRole: request.user.role,
      filters: parsedQuery.data
    });

    return reply.code(200).send({
      success: true,
      data: logs,
      message: "Logs do WhatsApp carregados com sucesso.",
      error: null
    });
  });
};

function buildUniqueInstanceName(instanceName: string, userId: string) {
  return `${instanceName.trim().toLowerCase()}-${userId.slice(0, 8)}`;
}

function sendValidationError(reply: FastifyReply, error: z.ZodError) {
  return reply.code(400).send({
    success: false,
    data: null,
    message: "Dados inválidos.",
    error: error.issues[0]?.message ?? "Payload inválido."
  });
}

function sendInstanceNotFound(reply: FastifyReply) {
  return reply.code(404).send({
    success: false,
    data: null,
    message: "Instância não encontrada.",
    error: "Instância não encontrada."
  });
}

function sendEvolutionError(
  reply: FastifyReply,
  error: unknown,
  fallbackMessage: string
) {
  if (error instanceof EvolutionServiceError) {
    return reply.code(mapEvolutionStatus(error.statusCode)).send({
      success: false,
      data: null,
      message: fallbackMessage,
      error: error.message
    });
  }

  throw error;
}

function mapEvolutionStatus(statusCode: number) {
  if (statusCode === 409) {
    return 409;
  }

  if (statusCode >= 400 && statusCode < 500) {
    return 502;
  }

  return statusCode || 502;
}
