import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { z } from "zod";
import { authenticate } from "../middlewares/authenticate";
import {
  createAuthorizedNumber,
  deleteAuthorizedNumber,
  getAuthorizedNumberByPhone,
  listAuthorizedNumbers,
  updateAuthorizedNumber
} from "../services/authorized-number.service";
import { getOwnedWhatsappInstance } from "../services/whatsapp-instance.service";

const instanceParamsSchema = z.object({
  instanceName: z.string().min(1, "Instância inválida.")
});

const numberParamsSchema = instanceParamsSchema.extend({
  numberId: z.string().uuid("ID inválido.")
});

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{10,15}$/, "Telefone deve conter 10 a 15 dígitos.");

const createAuthorizedNumberBodySchema = z.object({
  phone: phoneSchema,
  label: z.string().trim().max(50).optional(),
  can_create_task: z.boolean().default(true),
  can_read_tasks: z.boolean().default(true),
  can_delete_task: z.boolean().default(false),
  can_add_reminder: z.boolean().default(true)
});

const updateAuthorizedNumberBodySchema = z
  .object({
    label: z.string().trim().max(50).nullable().optional(),
    can_create_task: z.boolean().optional(),
    can_read_tasks: z.boolean().optional(),
    can_delete_task: z.boolean().optional(),
    can_add_reminder: z.boolean().optional(),
    active: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar."
  });

export const authorizedNumbersRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", authenticate);

  app.get("/", async (request, reply) => {
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

    const numbers = await listAuthorizedNumbers(instance.id);

    return reply.code(200).send({
      success: true,
      data: numbers,
      message: "Números autorizados carregados com sucesso.",
      error: null
    });
  });

  app.post("/", async (request, reply) => {
    if (request.user.role === "admin") {
      return sendAdminOperationForbidden(reply);
    }

    const parsedParams = instanceParamsSchema.safeParse(request.params);
    const parsedBody = createAuthorizedNumberBodySchema.safeParse(request.body);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    const instance = await getOwnedWhatsappInstance(
      parsedParams.data.instanceName,
      request.user.id
    );

    if (!instance) {
      return sendInstanceNotFound(reply);
    }

    const duplicate = await getAuthorizedNumberByPhone(
      instance.id,
      parsedBody.data.phone
    );

    if (duplicate) {
      return reply.code(409).send({
        success: false,
        data: null,
        message: "Número já autorizado nesta instância.",
        error: "Número duplicado."
      });
    }

    try {
      const number = await createAuthorizedNumber({
        instanceId: instance.id,
        userId: request.user.id,
        phone: parsedBody.data.phone,
        label: parsedBody.data.label?.trim() || null,
        can_create_task: parsedBody.data.can_create_task,
        can_read_tasks: parsedBody.data.can_read_tasks,
        can_delete_task: parsedBody.data.can_delete_task,
        can_add_reminder: parsedBody.data.can_add_reminder
      });

      return reply.code(201).send({
        success: true,
        data: number,
        message: "Número autorizado com sucesso.",
        error: null
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        return reply.code(409).send({
          success: false,
          data: null,
          message: "Número já autorizado nesta instância.",
          error: "Número duplicado."
        });
      }

      throw error;
    }
  });

  app.patch("/:numberId", async (request, reply) => {
    if (request.user.role === "admin") {
      return sendAdminOperationForbidden(reply);
    }

    const parsedParams = numberParamsSchema.safeParse(request.params);
    const parsedBody = updateAuthorizedNumberBodySchema.safeParse(request.body);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    const instance = await getOwnedWhatsappInstance(
      parsedParams.data.instanceName,
      request.user.id
    );

    if (!instance) {
      return sendInstanceNotFound(reply);
    }

    const number = await updateAuthorizedNumber(
      instance.id,
      parsedParams.data.numberId,
      {
        ...parsedBody.data,
        label:
          parsedBody.data.label === undefined
            ? undefined
            : parsedBody.data.label?.trim() || null
      }
    );

    if (!number) {
      return sendNumberNotFound(reply);
    }

    return reply.code(200).send({
      success: true,
      data: number,
      message: "Número autorizado atualizado com sucesso.",
      error: null
    });
  });

  app.delete("/:numberId", async (request, reply) => {
    if (request.user.role === "admin") {
      return sendAdminOperationForbidden(reply);
    }

    const parsedParams = numberParamsSchema.safeParse(request.params);

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

    const result = await deleteAuthorizedNumber(
      instance.id,
      parsedParams.data.numberId
    );

    if (!result) {
      return sendNumberNotFound(reply);
    }

    return reply.code(200).send({
      success: true,
      data: result,
      message: "Número autorizado removido com sucesso.",
      error: null
    });
  });
};

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

function sendNumberNotFound(reply: FastifyReply) {
  return reply.code(404).send({
    success: false,
    data: null,
    message: "Número autorizado não encontrado.",
    error: "Número autorizado não encontrado."
  });
}

function sendAdminOperationForbidden(reply: FastifyReply) {
  return reply.code(403).send({
    success: false,
    data: null,
    message: "Operação não permitida para administradores.",
    error: "Operação não permitida para administradores."
  });
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
