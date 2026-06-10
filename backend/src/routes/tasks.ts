import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { z } from "zod";
import { authenticate } from "../middlewares/authenticate";
import {
  createReminder,
  getRemindersByTask,
  ReminderServiceError
} from "../services/reminder.service";
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  TaskServiceError,
  toggleTaskDone,
  updateTask
} from "../services/task.service";

const idParamsSchema = z.object({
  id: z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?:_\d{4}-\d{2}-\d{2})?$/i,
      "ID inválido."
    )
});

const taskReminderParamsSchema = z.object({
  taskId: z.string().uuid("ID da tarefa inválido.")
});

const taskQuerySchema = z
  .object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(1900).max(9999).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD.")
      .optional()
  })
  .refine((data) => !data.month || Boolean(data.year), {
    message: "Ano é obrigatório quando mês for informado.",
    path: ["year"]
  });

const taskBodySchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(1000).optional(),
  task_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD."),
  task_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Hora deve estar no formato HH:MM.")
    .optional(),
  color: z.enum(["purple", "teal", "coral", "amber"]).default("purple"),
  rrule: z.string().trim().min(1).max(500).optional(),
  is_recurring: z.boolean().optional().default(false),
  recurrence_end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data final deve estar no formato YYYY-MM-DD.")
    .optional()
}).superRefine((data, context) => {
  if (data.is_recurring && !data.rrule) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "RRULE é obrigatória para tarefas recorrentes.",
      path: ["rrule"]
    });
  }
});

const taskPatchBodySchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  task_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD.")
    .optional(),
  task_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Hora deve estar no formato HH:MM.")
    .nullable()
    .optional(),
  color: z.enum(["purple", "teal", "coral", "amber"]).optional(),
  done: z.boolean().optional(),
  rrule: z.string().trim().min(1).max(500).nullable().optional(),
  is_recurring: z.boolean().optional(),
  recurrence_end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data final deve estar no formato YYYY-MM-DD.")
    .nullable()
    .optional()
});

const deleteTaskQuerySchema = z.object({
  scope: z.enum(["this", "all"]).default("this")
});

const reminderBodySchema = z.object({
  minutes_before: z.number().int().positive()
});

export const tasksRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", authenticate);

  app.get("/", async (request, reply) => {
    const parsedQuery = taskQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return sendValidationError(reply, parsedQuery.error);
    }

    const tasks = await getTasks({
      requesterId: request.user.id,
      requesterRole: request.user.role,
      filters: parsedQuery.data
    });

    return reply.code(200).send({
      success: true,
      data: tasks,
      message: "Tarefas carregadas com sucesso.",
      error: null
    });
  });

  app.post("/", async (request, reply) => {
    const parsedBody = taskBodySchema.safeParse(request.body);

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const task = await createTask(parsedBody.data, {
        requesterId: request.user.id
      });

      return reply.code(201).send({
        success: true,
        data: task,
        message: "Tarefa criada com sucesso.",
        error: null
      });
    } catch (error) {
      if (error instanceof TaskServiceError) {
        return reply.code(error.statusCode).send({
          success: false,
          data: null,
          message: error.message,
          error: error.message
        });
      }

      throw error;
    }
  });

  app.get("/:taskId/reminders", async (request, reply) => {
    const parsedParams = taskReminderParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const reminders = await getRemindersByTask(parsedParams.data.taskId, {
      requesterId: request.user.id,
      requesterRole: request.user.role
    });

    if (!reminders) {
      return sendNotFound(reply, "Tarefa não encontrada");
    }

    return reply.code(200).send({
      success: true,
      data: reminders,
      message: "Lembretes carregados com sucesso.",
      error: null
    });
  });

  app.post("/:taskId/reminders", async (request, reply) => {
    const parsedParams = taskReminderParamsSchema.safeParse(request.params);
    const parsedBody = reminderBodySchema.safeParse(request.body);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const reminder = await createReminder(
        {
          task_id: parsedParams.data.taskId,
          minutes_before: parsedBody.data.minutes_before
        },
        { requesterId: request.user.id }
      );

      return reply.code(201).send({
        success: true,
        data: reminder,
        message: "Lembrete criado com sucesso.",
        error: null
      });
    } catch (error) {
      if (error instanceof ReminderServiceError) {
        return reply.code(error.statusCode).send({
          success: false,
          data: null,
          message: "Erro ao criar lembrete.",
          error: error.message
        });
      }

      throw error;
    }
  });

  app.patch("/:id/toggle", async (request, reply) => {
    const parsedParams = idParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const task = await toggleTaskDone(parsedParams.data.id, {
      requesterId: request.user.id,
      requesterRole: request.user.role
    });

    if (!task) {
      return sendNotFound(reply, "Tarefa não encontrada");
    }

    return reply.code(200).send({
      success: true,
      data: task,
      message: "Status da tarefa atualizado com sucesso.",
      error: null
    });
  });

  app.get("/:id", async (request, reply) => {
    const parsedParams = idParamsSchema.safeParse(request.params);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    const task = await getTaskById(parsedParams.data.id, {
      requesterId: request.user.id,
      requesterRole: request.user.role
    });

    if (!task) {
      return sendNotFound(reply, "Tarefa não encontrada");
    }

    return reply.code(200).send({
      success: true,
      data: task,
      message: "Tarefa carregada com sucesso.",
      error: null
    });
  });

  app.patch("/:id", async (request, reply) => {
    const parsedParams = idParamsSchema.safeParse(request.params);
    const parsedBody = taskPatchBodySchema.safeParse(request.body);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    if (!parsedBody.success) {
      return sendValidationError(reply, parsedBody.error);
    }

    try {
      const task = await updateTask(parsedParams.data.id, parsedBody.data, {
        requesterId: request.user.id,
        requesterRole: request.user.role
      });

      if (!task) {
        return sendNotFound(reply, "Tarefa não encontrada");
      }

      return reply.code(200).send({
        success: true,
        data: task,
        message: "Tarefa atualizada com sucesso.",
        error: null
      });
    } catch (error) {
      if (error instanceof TaskServiceError) {
        return reply.code(error.statusCode).send({
          success: false,
          data: null,
          message: error.message,
          error: error.message
        });
      }

      throw error;
    }
  });

  app.delete("/:id", async (request, reply) => {
    const parsedParams = idParamsSchema.safeParse(request.params);
    const parsedQuery = deleteTaskQuerySchema.safeParse(request.query);

    if (!parsedParams.success) {
      return sendValidationError(reply, parsedParams.error);
    }

    if (!parsedQuery.success) {
      return sendValidationError(reply, parsedQuery.error);
    }

    const result = await deleteTask(parsedParams.data.id, {
      requesterId: request.user.id,
      requesterRole: request.user.role
    }, parsedQuery.data.scope);

    if (!result) {
      return sendNotFound(reply, "Tarefa não encontrada");
    }

    return reply.code(200).send({
      success: true,
      data: result,
      message: "Tarefa excluída com sucesso.",
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

function sendNotFound(reply: FastifyReply, error: string) {
  return reply.code(404).send({
    success: false,
    data: null,
    message: error,
    error
  });
}
