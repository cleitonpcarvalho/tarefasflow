import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { z } from "zod";
import { authenticate } from "../middlewares/authenticate";
import { deleteReminder } from "../services/reminder.service";

const idParamsSchema = z.object({
  id: z.string().uuid("ID inválido.")
});

export const remindersRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", authenticate);

  app.delete("/:id", async (request, reply) => {
    const parsedParams = idParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const result = await deleteReminder(parsedParams.data.id, {
      requesterId: request.user.id,
      requesterRole: request.user.role
    });

    if (!result) {
      return reply.code(404).send({
        success: false,
        data: null,
        message: "Lembrete não encontrado.",
        error: "Lembrete não encontrado"
      });
    }

    return reply.code(200).send({
      success: true,
      data: result,
      message: "Lembrete excluído com sucesso.",
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
