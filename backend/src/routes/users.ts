import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { z } from "zod";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import {
  changeOwnPassword,
  createUser,
  deleteUser,
  getDailySummary,
  getReminderDefaults,
  getUserById,
  listUsers,
  updateDailySummary,
  updateReminderDefaults,
  updateOwnWhatsappPhone,
  updateUser,
  UserServiceError
} from "../services/user.service";

const idParamsSchema = z.object({
  id: z.string().uuid("ID inválido.")
});

const usersQuerySchema = z.object({
  search: z.string().trim().max(255).optional(),
  role: z.enum(["admin", "user"]).optional(),
  active: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional()
});

const createUserBodySchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().email(),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres."),
  role: z.enum(["admin", "user"]).default("user")
});

const updateUserBodySchema = z.object({
  name: z.string().trim().min(2).max(255).optional(),
  email: z.string().trim().email().optional(),
  role: z.enum(["admin", "user"]).optional(),
  active: z.boolean().optional(),
  whatsapp_phone: z
    .string()
    .regex(/^\d{10,15}$/, "WhatsApp deve conter 10 a 15 dígitos.")
    .nullable()
    .optional()
});

const profileWhatsappBodySchema = z.object({
  phone: z
    .string()
    .regex(/^\d{10,15}$/, "WhatsApp deve conter 10 a 15 dígitos.")
});

const profilePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória."),
  newPassword: z.string().min(8, "Nova senha deve ter pelo menos 8 caracteres.")
});

const profileReminderDefaultsBodySchema = z.object({
  reminder_defaults: z.array(z.number().int().positive()).max(5)
});

const profileDailySummaryBodySchema = z.object({
  enabled: z.boolean(),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:MM.")
});

export const usersRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", authorize("admin"));

  app.get("/", async (request, reply) => {
    const parsedQuery = usersQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return sendValidationError(reply, parsedQuery.error);
    }

    const users = await listUsers(parsedQuery.data);

    return reply.code(200).send({
      success: true,
      data: users,
      message: "Usuários carregados com sucesso.",
      error: null
    });
  });

  app.post("/", async (request, reply) => {
    const parsedBody = createUserBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const user = await createUser(parsedBody.data);

      return reply.code(201).send({
        success: true,
        data: user,
        message: "Usuário criado com sucesso.",
        error: null
      });
    } catch (error) {
      if (error instanceof UserServiceError) {
        return reply.code(error.statusCode).send({
          success: false,
          data: null,
          message: "Erro ao criar usuário.",
          error: error.message
        });
      }

      throw error;
    }
  });

  app.get("/:id", async (request, reply) => {
    const parsedParams = idParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const user = await getUserById(parsedParams.data.id);

    if (!user) {
      return sendNotFound(reply);
    }

    return reply.code(200).send({
      success: true,
      data: user,
      message: "Usuário carregado com sucesso.",
      error: null
    });
  });

  app.patch("/:id", async (request, reply) => {
    const parsedParams = idParamsSchema.safeParse(request.params);
    const parsedBody = updateUserBodySchema.safeParse(request.body);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const user = await updateUser(
        parsedParams.data.id,
        parsedBody.data,
        request.user.id
      );

      if (!user) {
        return sendNotFound(reply);
      }

      return reply.code(200).send({
        success: true,
        data: user,
        message: "Usuário atualizado com sucesso.",
        error: null
      });
    } catch (error) {
      if (error instanceof UserServiceError) {
        return reply.code(error.statusCode).send({
          success: false,
          data: null,
          message: "Erro ao atualizar usuário.",
          error: error.message
        });
      }

      throw error;
    }
  });

  app.delete("/:id", async (request, reply) => {
    const parsedParams = idParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    try {
      const result = await deleteUser(parsedParams.data.id, request.user.id);

      if (!result) {
        return sendNotFound(reply);
      }

      return reply.code(200).send({
        success: true,
        data: result,
        message: "Usuário excluído com sucesso.",
        error: null
      });
    } catch (error) {
      if (error instanceof UserServiceError) {
        return reply.code(error.statusCode).send({
          success: false,
          data: null,
          message: "Erro ao excluir usuário.",
          error: error.message
        });
      }

      throw error;
    }
  });
};

export const profileRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/reminder-defaults",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const result = await getReminderDefaults(request.user.id);

        return reply.code(200).send({
          success: true,
          data: result,
          message: "Lembretes padrão carregados com sucesso.",
          error: null
        });
      } catch (error) {
        if (error instanceof UserServiceError) {
          return reply.code(error.statusCode).send({
            success: false,
            data: null,
            message: "Erro ao carregar lembretes padrão.",
            error: error.message
          });
        }

        throw error;
      }
    }
  );

  app.patch(
    "/reminder-defaults",
    { preHandler: authenticate },
    async (request, reply) => {
      const parsedBody = profileReminderDefaultsBodySchema.safeParse(request.body);

      if (!parsedBody.success) {
        return sendValidationError(reply, parsedBody.error);
      }

      try {
        const result = await updateReminderDefaults(
          request.user.id,
          parsedBody.data.reminder_defaults
        );

        return reply.code(200).send({
          success: true,
          data: result,
          message: "Lembretes padrão salvos com sucesso.",
          error: null
        });
      } catch (error) {
        if (error instanceof UserServiceError) {
          return reply.code(error.statusCode).send({
            success: false,
            data: null,
            message: "Erro ao salvar lembretes padrão.",
            error: error.message
          });
        }

        throw error;
      }
    }
  );

  app.get("/daily-summary", { preHandler: authenticate }, async (request, reply) => {
    try {
      const result = await getDailySummary(request.user.id);

      return reply.code(200).send({
        success: true,
        data: result,
        message: "Configurações de resumo diário carregadas com sucesso.",
        error: null
      });
    } catch (error) {
      if (error instanceof UserServiceError) {
        return reply.code(error.statusCode).send({
          success: false,
          data: null,
          message: "Erro ao carregar resumo diário.",
          error: error.message
        });
      }

      throw error;
    }
  });

  app.patch("/daily-summary", { preHandler: authenticate }, async (request, reply) => {
    const parsedBody = profileDailySummaryBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const result = await updateDailySummary(
        request.user.id,
        parsedBody.data.enabled,
        parsedBody.data.time
      );

      return reply.code(200).send({
        success: true,
        data: result,
        message: "Resumo diário atualizado com sucesso.",
        error: null
      });
    } catch (error) {
      if (error instanceof UserServiceError) {
        return reply.code(error.statusCode).send({
          success: false,
          data: null,
          message: "Erro ao atualizar resumo diário.",
          error: error.message
        });
      }

      throw error;
    }
  });

  app.patch("/whatsapp", { preHandler: authenticate }, async (request, reply) => {
    const parsedBody = profileWhatsappBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const result = await updateOwnWhatsappPhone(
        request.user.id,
        parsedBody.data.phone
      );

      return reply.code(200).send({
        success: true,
        data: result,
        message: "Número WhatsApp vinculado com sucesso.",
        error: null
      });
    } catch (error) {
      if (error instanceof UserServiceError) {
        return reply.code(error.statusCode).send({
          success: false,
          data: null,
          message: "Erro ao vincular WhatsApp.",
          error: error.message
        });
      }

      throw error;
    }
  });

  app.patch("/password", { preHandler: authenticate }, async (request, reply) => {
    const parsedBody = profilePasswordBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const result = await changeOwnPassword(
        request.user.id,
        parsedBody.data.currentPassword,
        parsedBody.data.newPassword
      );

      return reply.code(200).send({
        success: true,
        data: result,
        message: "Senha alterada com sucesso",
        error: null
      });
    } catch (error) {
      if (error instanceof UserServiceError) {
        return reply.code(error.statusCode).send({
          success: false,
          data: null,
          message: "Erro ao alterar senha.",
          error: error.message
        });
      }

      throw error;
    }
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

function sendNotFound(reply: FastifyReply) {
  return reply.code(404).send({
    success: false,
    data: null,
    message: "Usuário não encontrado.",
    error: "Usuário não encontrado"
  });
}
