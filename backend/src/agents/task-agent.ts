import type {
  ChatCompletionMessageParam,
  ChatCompletionTool
} from "openai/resources/chat/completions";
import { z } from "zod";
import { openai } from "../config/openai";
import { sql } from "../config/db";
import type { AuthorizedNumberPermissions } from "../services/authorized-number.service";
import {
  buildRRule,
  describeRRule,
  parseDateAtEndOfDay
} from "../services/recurrence.service";
import { createReminder } from "../services/reminder.service";
import { getWhatsappConversationHistory } from "../services/whatsapp-log.service";
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

const weekdaySchema = z.enum(["MO", "TU", "WE", "TH", "FR", "SA", "SU"]);

const createRecurringTaskSchema = createTaskSchema.extend({
  frequency: z.enum(["daily", "weekly", "monthly"]),
  interval: z.number().int().positive().optional(),
  weekdays: z.array(weekdaySchema).optional(),
  month_day: z.number().int().min(1).max(31).optional(),
  month_weekday_week: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(-1)
  ]).optional(),
  month_weekday_day: weekdaySchema.optional(),
  recurrence_end: z.string().optional(),
  count: z.number().int().positive().optional()
});

const listTasksSchema = z.object({
  date: z.string().optional(),
  month: z.number().optional(),
  year: z.number().optional()
});

const taskLookupSchema = z.object({
  task_id: z.string().optional(),
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
      name: "create_recurring_task",
      description:
        "Cria uma tarefa recorrente. Use quando o usuário disser todo dia, toda semana, toda segunda, sempre, repetir, recorrente ou indicar vários dias da semana.",
      parameters: {
        type: "object",
        required: ["title", "task_date", "frequency"],
        properties: {
          title: { type: "string" },
          task_date: {
            type: "string",
            description: "Data da primeira ocorrência no formato YYYY-MM-DD"
          },
          task_time: { type: "string", description: "Hora no formato HH:MM" },
          description: { type: "string" },
          color: {
            type: "string",
            enum: ["purple", "teal", "coral", "amber"]
          },
          frequency: {
            type: "string",
            enum: ["daily", "weekly", "monthly"]
          },
          interval: { type: "number", minimum: 1 },
          weekdays: {
            type: "array",
            items: {
              type: "string",
              enum: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]
            }
          },
          month_day: { type: "number", minimum: 1, maximum: 31 },
          month_weekday_week: {
            type: "number",
            enum: [1, 2, 3, 4, -1]
          },
          month_weekday_day: {
            type: "string",
            enum: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]
          },
          recurrence_end: {
            type: "string",
            description: "Data final no formato YYYY-MM-DD"
          },
          count: { type: "number", minimum: 1 }
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
  const conversationHistory = await getWhatsappConversationHistory({
    userId: input.userId,
    phone: input.userPhone
  });
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map<ChatCompletionMessageParam>((entry) => ({
      role: entry.direction === "inbound" ? "user" : "assistant",
      content: entry.content
    })),
    { role: "user", content: input.text }
  ];

  try {
    const firstCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools,
      tool_choice: "auto"
    });
    let message = firstCompletion.choices[0]?.message;

    if (!message) {
      return fallbackResponse(input);
    }

    if (!message.tool_calls || message.tool_calls.length === 0) {
      const requiredTool = getRequiredToolForClaim(message.content);

      if (!requiredTool) {
        return message.content ?? fallbackResponse(input);
      }

      const repairCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          ...messages,
          {
            role: "system",
            content:
              `Você não pode afirmar que concluiu uma ação sem executar a ` +
              `ferramenta correspondente. Execute ${requiredTool} agora usando ` +
              `todos os dados disponíveis no histórico.`
          }
        ],
        tools,
        tool_choice: "auto"
      });
      message = repairCompletion.choices[0]?.message;

      if (!message) {
        return fallbackResponse(input);
      }

      if (!message.tool_calls || message.tool_calls.length === 0) {
        return getRequiredToolForClaim(message.content)
          ? "Não consegui concluir essa ação agora. Pode tentar novamente?"
          : message.content ?? fallbackResponse(input);
      }
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
    case "create_recurring_task": {
      const parsed = createRecurringTaskSchema.parse(args);
      const rrule = buildRRule({
        frequency: parsed.frequency,
        interval: parsed.interval,
        weekdays: parsed.weekdays?.map(toWeekdayIndex),
        monthDay: parsed.month_day,
        monthWeekday:
          parsed.month_weekday_week && parsed.month_weekday_day
            ? {
                week: parsed.month_weekday_week,
                day: toWeekdayIndex(parsed.month_weekday_day)
              }
            : undefined,
        until: parsed.recurrence_end
          ? parseDateAtEndOfDay(parsed.recurrence_end)
          : undefined,
        count: parsed.count
      });
      const task = await createTask(
        {
          title: parsed.title,
          task_date: parsed.task_date,
          task_time: parsed.task_time,
          description: parsed.description,
          color: parsed.color as TaskColor | undefined,
          is_recurring: true,
          rrule,
          recurrence_end: parsed.recurrence_end
        },
        { requesterId: userId }
      );

      return {
        ok: true,
        task,
        rrule_human: describeRRule(rrule)
      };
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
  return `Você é o assistente de agenda TarefasFlow. Você ajuda o usuário a
gerenciar suas tarefas e compromissos via WhatsApp.

Usuário atual: ${userName}
Data e hora atual (Brasil): ${getBrazilDateTime()}
Permissoes deste numero: criar tarefas: ${toSimNao(permissions.can_create_task)},
consultar tarefas: ${toSimNao(permissions.can_read_tasks)},
deletar tarefas: ${toSimNao(permissions.can_delete_task)},
adicionar lembretes: ${toSimNao(permissions.can_add_reminder)}

Regras:
- Responda SEMPRE em português do Brasil, de forma curta e direta
- Use o histórico da conversa para completar a intenção atual
- Preserve título, descrição, data e horário já informados em mensagens anteriores
- Nunca peça novamente uma informação que já aparece no histórico
- Reunião, compromisso, agendamento e evento sem repetição devem ser criados
  com create_task
- Use create_recurring_task quando houver repetição: todo dia, toda semana,
  toda segunda, toda terça e quinta, sempre, repetir ou recorrente
- Se título, data e horário estiverem claros, execute create_task imediatamente
- Para recorrência com título, primeira data, horário e regra claros, execute
  create_recurring_task e inclua a regra na confirmação
- Interpretações: "toda terça e quinta" = semanal TU,TH; "todo dia" = diária;
  "toda semana" sem dias = segunda a sexta; "todo primeiro sábado do mês" =
  mensal 1SA; "todo dia 15" = mensal no dia 15
- Pergunte somente pelos dados realmente ausentes para executar a ação
- Para criar tarefas, peça esclarecimento apenas se a data não estiver clara
- Nunca diga que criou, alterou, concluiu ou removeu algo sem executar a ferramenta
  correspondente e receber um resultado de sucesso
- Se a intenção não for reconhecida, peça esclarecimento gentilmente
- Ao listar tarefas, formate em lista numerada com horário e título
- Ao criar uma tarefa, confirme com: "Tarefa criada! [título] em [data] às [hora]"
- Após criar recorrência, confirme com:
  "Tarefa recorrente criada! [título] — [descrição humana da regra]"
- Se não houver tarefas para o período, diga isso de forma amigável
- Nunca invente dados. Se não encontrar uma tarefa, diga que não encontrou`;
}

function getRequiredToolForClaim(content: string | null) {
  const normalized = content?.toLocaleLowerCase("pt-BR") ?? "";

  if (
    /\b(não|nao|ainda não|ainda nao)\b.{0,50}\b(criad|agendad|conclu[ií]d|finalizad|exclu[ií]d|removid|cancelad|adicionad|configurad)/.test(
      normalized
    )
  ) {
    return null;
  }

  const toolClaims: Array<[string, RegExp]> = [
    [
      "create_recurring_task",
      /\b(tarefa|reuni[aã]o|compromisso|evento)\s+recorrente\b.{0,30}\b(criad[ao]|agendad[ao])\b/
    ],
    [
      "create_task",
      /\b(tarefa|reuni[aã]o|compromisso|evento)\b.{0,30}\b(criad[ao]|agendad[ao])\b|\b(agendei|criei)\b/
    ],
    [
      "complete_task",
      /\b(tarefa|compromisso)\b.{0,30}\b(conclu[ií]d[ao]|finalizad[ao])\b/
    ],
    [
      "delete_task",
      /\b(tarefa|reuni[aã]o|compromisso|evento)\b.{0,30}\b(exclu[ií]d[ao]|removid[ao]|cancelad[ao])\b/
    ],
    [
      "add_reminder",
      /\blembrete\b.{0,30}\b(criad[ao]|adicionad[ao]|configurad[ao])\b/
    ]
  ];

  return toolClaims.find(([, pattern]) => pattern.test(normalized))?.[0] ?? null;
}

function getPermissionDeniedResult(
  toolName: string,
  permissions: AuthorizedNumberPermissions
) {
  const permissionMap: Record<string, boolean> = {
    create_task: permissions.can_create_task,
    create_recurring_task: permissions.can_create_task,
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

function toWeekdayIndex(day: z.infer<typeof weekdaySchema>) {
  const indexes = {
    MO: 0,
    TU: 1,
    WE: 2,
    TH: 3,
    FR: 4,
    SA: 5,
    SU: 6
  };

  return indexes[day];
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
