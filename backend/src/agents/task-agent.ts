import type {
  ChatCompletionMessageParam,
  ChatCompletionTool
} from "openai/resources/chat/completions";
import { z } from "zod";
import { openai } from "../config/openai";
import { sql } from "../config/db";
import type { AuthorizedNumberPermissions } from "../services/authorized-number.service";
import { createReminder } from "../services/reminder.service";
import {
  createTask,
  deleteTask,
  getTasks,
  updateTask
} from "../services/task.service";
import type { TaskColor } from "../types/task";

interface ProcessMessageInput {
  text: string;
  userId: string;
  userPhone: string;
  userName: string;
  permissions: AuthorizedNumberPermissions;
}

const createTaskSchema = z.object({
  title: z.string(),
  task_date: z.string(),
  task_time: z.string().optional(),
  description: z.string().optional(),
  color: z.enum(["purple", "teal", "coral", "amber"]).optional()
});

const listTasksSchema = z.object({
  date: z.string().optional(),
  month: z.number().optional(),
  year: z.number().optional()
});

const taskLookupSchema = z.object({
  task_id: z.string().uuid().optional(),
  title_hint: z.string().optional()
});

const addReminderSchema = taskLookupSchema.extend({
  minutes_before: z.number().int().positive()
});

const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Cria uma nova tarefa ou evento na agenda do usuário",
      parameters: {
        type: "object",
        required: ["title", "task_date"],
        properties: {
          title: { type: "string" },
          task_date: { type: "string", description: "Data no formato YYYY-MM-DD" },
          task_time: { type: "string", description: "Hora no formato HH:MM" },
          description: { type: "string" },
          color: {
            type: "string",
            enum: ["purple", "teal", "coral", "amber"]
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description: "Lista tarefas do usuário por data ou período",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Data no formato YYYY-MM-DD" },
          month: { type: "number", minimum: 1, maximum: 12 },
          year: { type: "number" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "complete_task",
      description: "Marca uma tarefa como concluída",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          title_hint: { type: "string" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: "Cancela ou deleta uma tarefa da agenda",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          title_hint: { type: "string" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_reminder",
      description: "Adiciona um lembrete a uma tarefa existente",
      parameters: {
        type: "object",
        required: ["minutes_before"],
        properties: {
          task_id: { type: "string" },
          title_hint: { type: "string" },
          minutes_before: { type: "number" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_today_summary",
      description: "Retorna um resumo das tarefas de hoje",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];

export async function processMessage(input: ProcessMessageInput): Promise<string> {
  const systemPrompt = buildSystemPrompt(input.userName, input.permissions);
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: input.text }
  ];

  try {
    const firstCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools,
      tool_choice: "auto"
    });
    const message = firstCompletion.choices[0]?.message;

    if (!message) {
      return fallbackResponse(input);
    }

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return message.content ?? fallbackResponse(input);
    }

    messages.push(message);

    for (const toolCall of message.tool_calls) {
      if (toolCall.type !== "function") {
        continue;
      }

      const result = await executeTool(
        toolCall.function.name,
        toolCall.function.arguments,
        input.userId,
        input.permissions
      );

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });
    }

    const finalCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages
    });

    return (
      finalCompletion.choices[0]?.message.content ??
      "Pronto! Atualizei sua agenda."
    );
  } catch (error) {
    console.error("Erro no agente GPT-4o:", error);
    return fallbackResponse(input);
  }
}

async function executeTool(
  name: string,
  rawArguments: string,
  userId: string,
  permissions: AuthorizedNumberPermissions
) {
  const permissionDenied = getPermissionDeniedResult(name, permissions);

  if (permissionDenied) {
    return permissionDenied;
  }

  const args = parseToolArguments(rawArguments);

  switch (name) {
    case "create_task": {
      const parsed = createTaskSchema.parse(args);
      const task = await createTask(
        {
          title: parsed.title,
          task_date: parsed.task_date,
          task_time: parsed.task_time,
          description: parsed.description,
          color: parsed.color as TaskColor | undefined
        },
        { requesterId: userId }
      );
      return { ok: true, task };
    }
    case "list_tasks": {
      const parsed = listTasksSchema.parse(args);
      const tasks = await getTasks({
        requesterId: userId,
        requesterRole: "user",
        filters: parsed
      });
      return { ok: true, tasks };
    }
    case "complete_task": {
      const parsed = taskLookupSchema.parse(args);
      const taskId = await resolveTaskId(userId, parsed.task_id, parsed.title_hint);

      if (!taskId) {
        return { ok: false, error: "Tarefa não encontrada" };
      }

      const task = await updateTask(
        taskId,
        { done: true },
        { requesterId: userId, requesterRole: "user" }
      );
      return { ok: true, task };
    }
    case "delete_task": {
      const parsed = taskLookupSchema.parse(args);
      const taskId = await resolveTaskId(userId, parsed.task_id, parsed.title_hint);

      if (!taskId) {
        return { ok: false, error: "Tarefa não encontrada" };
      }

      const result = await deleteTask(taskId, {
        requesterId: userId,
        requesterRole: "user"
      });
      return { ok: Boolean(result), result };
    }
    case "add_reminder": {
      const parsed = addReminderSchema.parse(args);
      const taskId = await resolveTaskId(userId, parsed.task_id, parsed.title_hint);

      if (!taskId) {
        return { ok: false, error: "Tarefa não encontrada" };
      }

      const reminder = await createReminder(
        {
          task_id: taskId,
          minutes_before: parsed.minutes_before
        },
        { requesterId: userId }
      );
      return { ok: true, reminder };
    }
    case "get_today_summary": {
      const tasks = await getTasks({
        requesterId: userId,
        requesterRole: "user",
        filters: { date: getTodayKey() }
      });
      return { ok: true, tasks };
    }
    default:
      return { ok: false, error: `Tool desconhecida: ${name}` };
  }
}

async function fallbackResponse(input: ProcessMessageInput) {
  const normalizedText = input.text.toLowerCase();

  if (
    normalizedText.includes("hoje") &&
    (normalizedText.includes("tarefa") ||
      normalizedText.includes("agenda") ||
      normalizedText.includes("compromisso"))
  ) {
    if (!input.permissions.can_read_tasks) {
      return "Este numero nao tem permissao para consultar tarefas.";
    }

    const tasks = await getTasks({
      requesterId: input.userId,
      requesterRole: "user",
      filters: { date: getTodayKey() }
    });

    if (tasks.length === 0) {
      return "Você não tem tarefas para hoje.";
    }

    const lines = tasks.map((task, index) => {
      const time = task.task_time ?? "Dia todo";
      return `${index + 1}. ${time} - ${task.title}`;
    });

    return `Suas tarefas de hoje:\n${lines.join("\n")}`;
  }

  return "Não entendi totalmente. Pode me dizer se quer criar, listar, concluir ou cancelar uma tarefa?";
}

async function resolveTaskId(
  userId: string,
  taskId?: string,
  titleHint?: string
) {
  if (taskId) {
    return taskId;
  }

  if (!titleHint) {
    return null;
  }

  const rows = await sql<{ id: string; title: string }[]>`
    SELECT id, title
    FROM tasks
    WHERE user_id = ${userId}
      AND title ILIKE ${`%${titleHint}%`}
    LIMIT 1
  `;

  return rows[0]?.id ?? null;
}

function parseToolArguments(rawArguments: string) {
  try {
    return JSON.parse(rawArguments) as unknown;
  } catch {
    return {};
  }
}

function buildSystemPrompt(
  userName: string,
  permissions: AuthorizedNumberPermissions
) {
  return `Você é o assistente de agenda TaskFlow. Você ajuda o usuário a
gerenciar suas tarefas e compromissos via WhatsApp.

Usuário atual: ${userName}
Data e hora atual (Brasil): ${getBrazilDateTime()}
Permissoes deste numero: criar tarefas: ${toSimNao(permissions.can_create_task)},
consultar tarefas: ${toSimNao(permissions.can_read_tasks)},
deletar tarefas: ${toSimNao(permissions.can_delete_task)},
adicionar lembretes: ${toSimNao(permissions.can_add_reminder)}

Regras:
- Responda SEMPRE em português do Brasil, de forma curta e direta
- Para criar tarefas, confirme os detalhes antes se a data não foi clara
- Se a intenção não for reconhecida, peça esclarecimento gentilmente
- Ao listar tarefas, formate em lista numerada com horário e título
- Ao criar uma tarefa, confirme com: "Tarefa criada! [título] em [data] às [hora]"
- Se não houver tarefas para o período, diga isso de forma amigável
- Nunca invente dados. Se não encontrar uma tarefa, diga que não encontrou`;
}

function getPermissionDeniedResult(
  toolName: string,
  permissions: AuthorizedNumberPermissions
) {
  const permissionMap: Record<string, boolean> = {
    create_task: permissions.can_create_task,
    list_tasks: permissions.can_read_tasks,
    complete_task: permissions.can_read_tasks,
    delete_task: permissions.can_delete_task,
    add_reminder: permissions.can_add_reminder,
    get_today_summary: permissions.can_read_tasks
  };

  if (toolName in permissionMap && !permissionMap[toolName]) {
    return { error: "Sem permissao para esta acao" };
  }

  return null;
}

function toSimNao(value: boolean) {
  return value ? "sim" : "nao";
}

function getBrazilDateTime() {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Fortaleza"
  }).format(new Date());
}

function getTodayKey() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date());
}
