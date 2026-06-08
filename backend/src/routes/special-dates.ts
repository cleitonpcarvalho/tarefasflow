import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { z } from "zod";
import { authenticate } from "../middlewares/authenticate";
import {
  createSpecialDate,
  deleteSpecialDate,
  getSpecialDates,
  initNationalDatesForUser,
  updateSpecialDate
} from "../services/special-date.service";

const idParamsSchema = z.object({
  id: z.string().uuid("ID inválido.")
});

const createBodySchema = z.object({
  name: z.string().min(2).max(100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  notify_on_day: z.boolean().default(true),
  notify_1_day_before: z.boolean().default(false),
  notify_1_week_before: z.boolean().default(false),
  notify_1_month_before: z.boolean().default(false)
});

const updateBodySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  month: z.number().int().min(1).max(12).optional(),
  day: z.number().int().min(1).max(31).optional(),
  active: z.boolean().optional(),
  notify_on_day: z.boolean().optional(),
  notify_1_day_before: z.boolean().optional(),
  notify_1_week_before: z.boolean().optional(),
  notify_1_month_before: z.boolean().optional()
});

export const specialDatesRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", authenticate);

  app.get("/", async (request, reply) => {
    const userId = request.user.id;
    let dates = await getSpecialDates(userId);

    if (dates.length === 0) {
      await initNationalDatesForUser(userId);
      dates = await getSpecialDates(userId);
    }

    return reply.code(200).send({
      success: true,
      data: dates,
      message: null,
      error: null
    });
  });

  app.post("/", async (request, reply) => {
    const parsed = createBodySchema.safeParse(request.body);

    if (!parsed.success) {
      return sendValidationError(reply, parsed.error);
    }

    const date = await createSpecialDate(parsed.data, request.user.id);

    return reply.code(201).send({
      success: true,
      data: date,
      message: "Data especial criada com sucesso.",
      error: null
    });
  });

  app.patch("/:id", async (request, reply) => {
    const parsedParams = idParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const parsedBody = updateBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    const date = await updateSpecialDate(
      parsedParams.data.id,
      parsedBody.data,
      request.user.id
    );

    if (!date) {
      return reply.code(404).send({
        success: false,
        data: null,
        message: "Data especial não encontrada.",
        error: "Data especial não encontrada"
      });
    }

    return reply.code(200).send({
      success: true,
      data: date,
      message: "Data especial atualizada.",
      error: null
    });
  });

  app.delete("/:id", async (request, reply) => {
    const parsedParams = idParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const result = await deleteSpecialDate(
      parsedParams.data.id,
      request.user.id
    );

    if (!result) {
      return reply.code(404).send({
        success: false,
        data: null,
        message: "Data especial não encontrada.",
        error: "Data especial não encontrada"
      });
    }

    return reply.code(200).send({
      success: true,
      data: result,
      message: "Data especial excluída.",
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
