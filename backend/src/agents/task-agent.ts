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
import { createSpecialDate } from "../services/special-date.service";
import {
  createTask,
  deleteTask,
  getTasks,
  TaskServiceError,
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

type ConversationContextRole = "user" | "assistant";

interface ConversationContextRow {
  role: ConversationContextRole;
  content: string;
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

const updateTaskSchema = taskLookupSchema.extend({
  title: z.string().optional(),
  task_date: z.string().optional(),
  task_time: z.string().optional(),
  description: z.string().optional(),
  color: z.enum(["purple", "teal", "coral", "amber"]).optional(),
  rrule: z.string().optional(),
  is_recurring: z.boolean().optional(),
  recurrence_end: z.string().optional()
});

const deleteTaskSchema = taskLookupSchema.extend({
  scope: z.enum(["this", "all"]).default("all")
});

const addSpecialDateSchema = z.object({
  name: z.string(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  notify_on_day: z.boolean().default(true),
  notify_1_day_before: z.boolean().default(false),
  notify_1_week_before: z.boolean().default(true),
  notify_1_month_before: z.boolean().default(false)
});

const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_task",
      description:
        "Cria uma nova tarefa ou evento na agenda do usuário. " +
        "Se o backend retornar erro de horário ocupado (409), informe o usuário " +
        "que o horário está ocupado e sugira os horários mais próximos disponíveis " +
        "(30 minutos antes ou depois).",
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
        "Cria uma tarefa NOVA e recorrente. Use apenas quando o usuário quiser criar uma " +
        "tarefa nova com recorrência. Se a tarefa já existe e o usuário quer torná-la " +
        "recorrente, use update_task com rrule. " +
        "Sinais de uso: todo dia, toda semana, toda segunda, sempre, repetir, recorrente. " +
        "Se o backend retornar erro de horário ocupado (409), informe o usuário " +
        "que o horário está ocupado e sugira os horários mais próximos disponíveis " +
        "(30 minutos antes ou depois).",
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
      description:
        "Cancela ou deleta uma tarefa da agenda. " +
        "Para tarefas recorrentes, use scope='all' para apagar todas as ocorrências " +
        "ou scope='this' para apagar apenas a do dia especificado. " +
        "Quando o usuário pedir para apagar uma tarefa sem especificar, use scope='all'.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          title_hint: { type: "string" },
          scope: {
            type: "string",
            enum: ["this", "all"],
            description: "'all' apaga todas as ocorrências (padrão), 'this' apaga só uma específica"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description:
        "Edita dados de uma tarefa existente: título, data, horário, descrição, cor " +
        "ou regra de recorrência. " +
        "Use sempre que o usuário quiser alterar, editar, mover, corrigir ou " +
        "tornar recorrente uma tarefa já criada. " +
        "Nunca use delete_task + create_task para editar. " +
        "Se a tarefa já existe e o usuário quer adicionar recorrência (toda semana, " +
        "todo dia, etc.), use update_task com rrule — não crie uma nova tarefa.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          title_hint: { type: "string" },
          title: { type: "string" },
          task_date: { type: "string", description: "Data no formato YYYY-MM-DD" },
          task_time: { type: "string", description: "Hora no formato HH:MM" },
          description: { type: "string" },
          color: {
            type: "string",
            enum: ["purple", "teal", "coral", "amber"]
          },
          rrule: { type: "string", description: "Regra de recorrência no formato RRULE" },
          is_recurring: { type: "boolean" },
          recurrence_end: {
            type: "string",
            description: "Data final da recorrência no formato YYYY-MM-DD"
          }
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
  },
  {
    type: "function",
    function: {
      name: "add_special_date",
      description:
        "Cadastra uma data especial como aniversário ou data comemorativa pessoal. " +
        "Use quando o usuário mencionar: aniversário, data especial, comemoração, " +
        "lembrar de, não esquecer de, aniversário de casamento.",
      parameters: {
        type: "object",
        required: ["name", "month", "day"],
        properties: {
          name: {
            type: "string",
            description: "Ex: 'Aniversário da mãe', 'Casamento'"
          },
          month: { type: "number", minimum: 1, maximum: 12 },
          day: { type: "number", minimum: 1, maximum: 31 },
          notify_on_day: { type: "boolean" },
          notify_1_day_before: { type: "boolean" },
          notify_1_week_before: { type: "boolean" },
          notify_1_month_before: { type: "boolean" }
        }
      }
    }
  }
];

export async function processMessage(input: ProcessMessageInput): Promise<string> {
  const systemPrompt = buildSystemPrompt(input.userName, input.permissions);

  try {
    const conversationHistory = await getConversationContext(input.userId);
    await saveConversationContextMessage(input.userId, "user", input.text);

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.reverse().map<ChatCompletionMessageParam>((entry) => ({
        role: entry.role,
        content: entry.content
      })),
      { role: "user", content: input.text }
    ];

    const firstCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools,
      tool_choice: "auto"
    });
    let message = firstCompletion.choices[0]?.message;

    if (!message) {
      const response = await fallbackResponse(input);
      return saveAssistantResponse(input.userId, response);
    }

    if (!message.tool_calls || message.tool_calls.length === 0) {
      const requiredTool = getRequiredToolForClaim(message.content);

      if (!requiredTool) {
        const response = message.content ?? (await fallbackResponse(input));
        return saveAssistantResponse(input.userId, response);
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
        const response = await fallbackResponse(input);
        return saveAssistantResponse(input.userId, response);
      }

      if (!message.tool_calls || message.tool_calls.length === 0) {
        const response = getRequiredToolForClaim(message.content)
          ? "Não consegui concluir essa ação agora. Pode tentar novamente?"
          : message.content ?? fallbackResponse(input);
        return saveAssistantResponse(input.userId, await response);
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

    const response =
      finalCompletion.choices[0]?.message.content ??
      "Pronto! Atualizei sua agenda.";

    return saveAssistantResponse(input.userId, response);
  } catch (error) {
    console.error("Erro no agente GPT-4o:", error);
    const response = await fallbackResponse(input);
    return saveAssistantResponse(input.userId, response);
  }
}

async function getConversationContext(userId: string) {
  return sql<ConversationContextRow[]>`
    SELECT role, content
    FROM whatsapp_conversation_context
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 10
  `;
}

async function saveConversationContextMessage(
  userId: string,
  role: ConversationContextRole,
  content: string
) {
  await sql`
    INSERT INTO whatsapp_conversation_context (user_id, role, content)
    VALUES (${userId}, ${role}, ${content})
  `;
}

async function saveAssistantResponse(userId: string, response: string) {
  try {
    await saveConversationContextMessage(userId, "assistant", response);
    await trimConversationContext(userId);
  } catch (error) {
    console.error("Erro ao salvar contexto da resposta:", error);
  }

  return response;
}

async function trimConversationContext(userId: string) {
  await sql`
    DELETE FROM whatsapp_conversation_context
    WHERE user_id = ${userId}
      AND id NOT IN (
        SELECT id
        FROM whatsapp_conversation_context
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 50
      )
  `;
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
      try {
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
      } catch (error) {
        if (error instanceof TaskServiceError) {
          return { ok: false, error: error.message, statusCode: error.statusCode };
        }
        throw error;
      }
    }
    case "create_recurring_task": {
      try {
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
      } catch (error) {
        if (error instanceof TaskServiceError) {
          return { ok: false, error: error.message, statusCode: error.statusCode };
        }
        throw error;
      }
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
    case "update_task": {
      const parsed = updateTaskSchema.parse(args);
      const taskId = await resolveTaskId(userId, parsed.task_id, parsed.title_hint);

      if (!taskId) {
        return { ok: false, error: "Tarefa não encontrada" };
      }

      const updates: Record<string, unknown> = {};
      if (parsed.title !== undefined) updates.title = parsed.title;
      if (parsed.task_date !== undefined) updates.task_date = parsed.task_date;
      if (parsed.task_time !== undefined) updates.task_time = parsed.task_time;
      if (parsed.description !== undefined) updates.description = parsed.description;
      if (parsed.color !== undefined) updates.color = parsed.color;
      if (parsed.rrule !== undefined) updates.rrule = parsed.rrule;
      if (parsed.is_recurring !== undefined) updates.is_recurring = parsed.is_recurring;
      if (parsed.recurrence_end !== undefined) updates.recurrence_end = parsed.recurrence_end;

      const task = await updateTask(
        taskId,
        updates,
        { requesterId: userId, requesterRole: "user" }
      );
      return { ok: true, task };
    }
    case "delete_task": {
      const parsed = deleteTaskSchema.parse(args);
      const taskId = await resolveTaskId(userId, parsed.task_id, parsed.title_hint);

      if (!taskId) {
        return { ok: false, error: "Tarefa não encontrada" };
      }

      const result = await deleteTask(taskId, {
        requesterId: userId,
        requesterRole: "user"
      }, parsed.scope);

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
    case "add_special_date": {
      const parsed = addSpecialDateSchema.parse(args);
      const specialDate = await createSpecialDate(
        {
          name: parsed.name,
          month: parsed.month,
          day: parsed.day,
          notify_on_day: parsed.notify_on_day,
          notify_1_day_before: parsed.notify_1_day_before,
          notify_1_week_before: parsed.notify_1_week_before,
          notify_1_month_before: parsed.notify_1_month_before
        },
        userId
      );

      const notifyLabels: string[] = [];
      if (parsed.notify_on_day) notifyLabels.push("no dia");
      if (parsed.notify_1_day_before) notifyLabels.push("1 dia antes");
      if (parsed.notify_1_week_before) notifyLabels.push("1 semana antes");
      if (parsed.notify_1_month_before) notifyLabels.push("1 mês antes");

      return { ok: true, specialDate, notifications: notifyLabels };
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
    ORDER BY created_at DESC
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
- Se a mensagem mencionar um título diferente de qualquer tarefa citada anteriormente na conversa, trate sempre como novo comando independente — não altere tarefas existentes.
- Expressões como "agora", "hoje", "coloque pra HH:MM [título]" sem referência explícita a uma tarefa anterior significam sempre criar uma nova tarefa para a data atual.
- Nunca renomeie, mova ou altere uma tarefa existente com base em um comando que menciona um título diferente.
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
- Para editar título, data, horário, descrição ou cor de uma tarefa já existente, use
  update_task — NUNCA use delete_task seguido de create_task para editar
- Ao criar ou atualizar uma tarefa, sempre preencha color e description
  usando o contexto da mensagem do usuário, mesmo em mensagens abertas
  ou áudios transcritos.
- Regras de cor:
  coral  → tarefas urgentes, críticas, com prazo próximo, médico, emergência
  amber  → reuniões, compromissos importantes, financeiro, entregas, clientes
  teal   → rotina, saúde, exercício, lazer, tarefas recorrentes sem urgência
  purple → padrão quando não há indicação clara de prioridade
- Regras de descrição:
  Extraia do contexto do usuário os detalhes relevantes e escreva uma
  descrição objetiva de 1 a 2 linhas. Se o usuário fornecer contexto
  rico (motivo, participantes, restrições de tempo, itens a tratar),
  inclua essas informações. Se o contexto for mínimo, escreva uma
  descrição curta baseada no título. Nunca deixe description vazio.
- Para remanejar apenas uma ocorrência de uma tarefa recorrente para outro horário
  ou data, use SEMPRE esta sequência:
  1. delete_task com scope='this' para excluir só aquela ocorrência
  2. create_task com o mesmo título e a nova data/horário desejado
  Nunca use update_task para remanejar uma ocorrência específica de uma série
  recorrente — isso alteraria a série inteira
- Para cadastrar aniversários ou datas comemorativas pessoais, use add_special_date
- Nunca diga que criou, alterou, concluiu ou removeu algo sem executar a ferramenta
  correspondente e receber um resultado de sucesso
- Se a intenção não for reconhecida, peça esclarecimento gentilmente
- Ao listar tarefas, formate em lista numerada com horário e título
- Ao criar uma tarefa, confirme com: "Tarefa criada! [título] em [data] às [hora]"
- Após criar recorrência, confirme com:
  "Tarefa recorrente criada! [título] — [descrição humana da regra]"
- Se não houver tarefas para o período, diga isso de forma amigável
- Nunca invente dados. Se não encontrar uma tarefa, diga que não encontrou
- Se ao criar uma tarefa o sistema retornar erro de horário ocupado, informe o usuário
  qual horário está ocupado e sugira alternativas como 30 minutos antes ou depois`;
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
      "update_task",
      /\b(tarefa|reuni[aã]o|compromisso|evento)\b.{0,30}\b(atualizad[ao]|alterad[ao]|editad[ao]|modificad[ao]|movid[ao]|mudad[ao])\b/
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
    ],
    [
      "add_special_date",
      /\b(data\s+especial|anivers[aá]rio|comemora[çc][aã]o)\b.{0,30}\b(cadastrad[ao]|adicionad[ao]|criad[ao]|salv[ao])\b/
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
    update_task: permissions.can_create_task,
    list_tasks: permissions.can_read_tasks,
    complete_task: permissions.can_read_tasks,
    delete_task: permissions.can_delete_task,
    add_reminder: permissions.can_add_reminder,
    get_today_summary: permissions.can_read_tasks,
    add_special_date: permissions.can_create_task
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
