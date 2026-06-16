import { sql } from "../config/db";
import type { Task, TaskColor } from "../types/task";
import { getFirstActiveAuthorizedNumberForUser } from "../services/authorized-number.service";
import {
  sendTextMessage,
  type EvolutionConnectionState
} from "../services/evolution.service";
import { createReminder } from "../services/reminder.service";
import {
  expandRecurringTask,
  parseDateAtEndOfDay,
  parseDateAtStartOfDay
} from "../services/recurrence.service";

interface PendingReminderRow {
  id: string;
  task_id: string;
  user_id: string;
  minutes_before: number;
  scheduled_for: Date | string | null;
  occurrence_date: Date | string | null;
  title: string;
  description: string | null;
  task_date: Date | string;
  task_time: string | null;
  color: TaskColor;
  done: boolean;
  rrule: string | null;
  is_recurring: boolean;
  parent_id: string | null;
  recurrence_end: Date | string | null;
  excluded_dates: string[];
  done_dates: string[];
  created_at: Date | string;
  updated_at: Date | string;
  user_name: string;
  instance_name: string | null;
  instance_status: EvolutionConnectionState | null;
  phone_number: string | null;
}

export async function dispatchPendingReminders(): Promise<void> {
  const reminders = await sql<PendingReminderRow[]>`
    SELECT r.id, r.task_id, r.user_id, r.minutes_before, r.scheduled_for,
      r.occurrence_date, t.title, t.description, t.task_date, t.task_time,
      t.color, t.done, t.rrule, t.is_recurring, t.parent_id,
      t.recurrence_end, t.excluded_dates, t.done_dates, t.created_at,
      t.updated_at, u.name AS user_name,
      wi.instance_name, wi.status AS instance_status, wi.phone_number
    FROM reminders r
    JOIN tasks t ON t.id = r.task_id
    JOIN users u ON u.id = r.user_id
    LEFT JOIN whatsapp_instances wi ON wi.user_id = u.id
    WHERE r.pending_send = true
      AND r.sent_at IS NULL
      AND t.done = false
    ORDER BY r.scheduled_for ASC NULLS LAST
    LIMIT 50
    FOR UPDATE OF r SKIP LOCKED
  `;

  for (const reminder of reminders) {
    await dispatchReminder(reminder);
  }
}

async function dispatchReminder(reminder: PendingReminderRow) {
  try {
    if (!reminder.instance_name || reminder.instance_status !== "open") {
      console.warn(
        `Instancia indisponivel para lembrete: ${reminder.title}`
      );
      await markReminderSent(reminder);
      return;
    }

    const authorizedNumber = await getFirstActiveAuthorizedNumberForUser(
      reminder.user_id
    );
    const phone = authorizedNumber?.phone ?? reminder.phone_number;

    if (!phone) {
      console.warn(`Nenhum numero disponivel para lembrete: ${reminder.title}`);
      await markReminderSent(reminder);
      return;
    }

    const delivery = await sendTextMessage(
      reminder.instance_name,
      phone,
      buildReminderMessage(reminder)
    );

    if (delivery.delivered) {
      await markReminderSent(reminder);
      return;
    }

    console.error(`Erro ao enviar lembrete: ${reminder.title}`, delivery);
    await markReminderSent(reminder);
  } catch (error) {
    console.error("Erro ao processar lembrete pendente:", error);
    await markReminderSent(reminder);
  }
}

async function markReminderSent(reminder: PendingReminderRow) {
  await sql`
    UPDATE reminders
    SET sent_at = NOW(), pending_send = false
    WHERE id = ${reminder.id}
  `;

  await createNextRecurringReminder(reminder);
}

async function createNextRecurringReminder(reminder: PendingReminderRow) {
  try {
    if (!reminder.rrule) {
      return;
    }

    const currentOccurrenceDate = formatDateOnly(
      reminder.occurrence_date ?? reminder.task_date
    );
    const rangeStart = parseDateAtStartOfDay(getTodayKey());
    const rangeEnd = parseDateAtEndOfDay(getFutureDateKey(60));
    const nextOccurrence = expandRecurringTask(
      toTask(reminder),
      rangeStart,
      rangeEnd
    )
      .filter((occurrence) => occurrence.task_date > currentOccurrenceDate)
      .sort((left, right) => left.task_date.localeCompare(right.task_date))[0];

    if (!nextOccurrence) {
      return;
    }

    const existing = await sql<{ id: string }[]>`
      SELECT id
      FROM reminders
      WHERE task_id = ${reminder.task_id}
        AND user_id = ${reminder.user_id}
        AND minutes_before = ${reminder.minutes_before}
        AND occurrence_date = ${nextOccurrence.task_date}
      LIMIT 1
    `;

    if (existing[0]) {
      return;
    }

    await createReminder(
      {
        task_id: reminder.task_id,
        minutes_before: reminder.minutes_before,
        occurrence_date: nextOccurrence.task_date
      },
      { requesterId: reminder.user_id }
    );
  } catch (error) {
    console.error("Erro ao criar próximo lembrete recorrente:", error);
  }
}

function buildReminderMessage(reminder: PendingReminderRow) {
  return formatReminderMessage(
    reminder.user_name,
    reminder.title,
    reminder.occurrence_date ?? reminder.task_date,
    reminder.task_time,
    reminder.minutes_before
  );
}

function formatReminderMessage(
  userName: string,
  taskTitle: string,
  taskDate: Date | string,
  taskTime: string | null,
  minutesBefore: number
): string {
  const dateStr =
    taskDate instanceof Date ? taskDate.toISOString().slice(0, 10) : taskDate;
  const dateFormatted = new Date(`${dateStr}T12:00:00`).toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "2-digit" }
  );

  const timeFormatted = taskTime ? taskTime.substring(0, 5) : null;

  let whenText: string;

  if (minutesBefore === 1440) {
    whenText = "1 dia antes";
  } else if (minutesBefore === 60) {
    whenText = "1 hora antes";
  } else if (minutesBefore === 30) {
    whenText = "30 minutos antes";
  } else if (minutesBefore === 15) {
    whenText = "15 minutos antes";
  } else {
    whenText = `${minutesBefore} minutos antes`;
  }

  const timeStr = timeFormatted ? ` às ${timeFormatted}` : "";

  return [
    `⏰ *Lembrete TarefasFlow*`,
    ``,
    `Olá, ${userName}! Você tem um compromisso chegando:`,
    ``,
    `📌 *${taskTitle}*`,
    `📅 ${dateFormatted}${timeStr}`,
    `🔔 Este lembrete é ${whenText}`,
    ``,
    `Boa sorte! 💪`
  ].join("\n");
}

function toTask(row: PendingReminderRow): Task {
  return {
    id: row.task_id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    task_date: formatDateOnly(row.task_date),
    task_time: formatTimeOnly(row.task_time),
    color: row.color,
    done: row.done,
    rrule: row.rrule,
    is_recurring: row.is_recurring,
    parent_id: row.parent_id,
    recurrence_end: row.recurrence_end ? formatDateOnly(row.recurrence_end) : null,
    excluded_dates: row.excluded_dates ?? [],
    done_dates: row.done_dates ?? [],
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getFutureDateKey(daysFromToday: number) {
  const date = new Date(`${getTodayKey()}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

function formatDateOnly(value: Date | string) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}

function formatTimeOnly(value: string | null) {
  if (!value) {
    return null;
  }

  return value.slice(0, 5);
}
