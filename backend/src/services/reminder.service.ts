import { sql } from "../config/db";
import type { UserRole } from "../types/auth";
import type { Reminder, ReminderRow } from "../types/reminder";
import { getTaskById } from "./task.service";

interface RequesterContext {
  requesterId: string;
  requesterRole: UserRole;
}

export class ReminderServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ReminderServiceError";
    this.statusCode = statusCode;
  }
}

export async function getRemindersByTask(
  taskId: string,
  { requesterId, requesterRole }: RequesterContext
): Promise<Reminder[] | null> {
  const task = await getTaskById(taskId, { requesterId, requesterRole });

  if (!task) {
    return null;
  }

  const params = [taskId, requesterId];
  const scopeClause = requesterRole === "user" ? "AND user_id = $2" : "";

  const rows = await sql.unsafe<ReminderRow[]>(
    `
      SELECT id, task_id, user_id, minutes_before, sent_at, created_at
      FROM reminders
      WHERE task_id = $1 ${scopeClause}
      ORDER BY minutes_before ASC
    `,
    requesterRole === "user" ? params : [taskId]
  );

  return rows.map(toReminder);
}

export async function createReminder(
  data: { task_id: string; minutes_before: number },
  { requesterId }: { requesterId: string }
): Promise<Reminder> {
  const tasks = await sql<
    { id: string; task_date: Date | string; task_time: string | null }[]
  >`
    SELECT id, task_date, task_time
    FROM tasks
    WHERE id = ${data.task_id}
      AND user_id = ${requesterId}
    LIMIT 1
  `;

  if (!tasks[0]) {
    throw new ReminderServiceError("Tarefa não encontrada.", 404);
  }

  const existingReminders = await sql<{ id: string }[]>`
    SELECT id
    FROM reminders
    WHERE task_id = ${data.task_id}
      AND user_id = ${requesterId}
      AND minutes_before = ${data.minutes_before}
    LIMIT 1
  `;

  if (existingReminders[0]) {
    throw new ReminderServiceError(
      "Lembrete já existe para este horário",
      409
    );
  }

  const rows = await sql<ReminderRow[]>`
    INSERT INTO reminders (task_id, user_id, minutes_before)
    VALUES (${data.task_id}, ${requesterId}, ${data.minutes_before})
    RETURNING id, task_id, user_id, minutes_before, sent_at, created_at
  `;

  const reminder = toReminder(rows[0]);
  const scheduledFor = calculateScheduledFor(
    tasks[0].task_date,
    tasks[0].task_time,
    data.minutes_before
  );

  await sql`
    UPDATE reminders
    SET scheduled_for = ${scheduledFor}, pending_send = false
    WHERE id = ${reminder.id}
  `;

  return reminder;
}

export async function deleteReminder(
  reminderId: string,
  { requesterId, requesterRole }: RequesterContext
): Promise<{ deleted: true } | null> {
  const params = [reminderId, requesterId];
  const scopeClause = requesterRole === "user" ? "AND user_id = $2" : "";

  const rows = await sql.unsafe<{ id: string }[]>(
    `
      DELETE FROM reminders
      WHERE id = $1 ${scopeClause}
      RETURNING id
    `,
    requesterRole === "user" ? params : [reminderId]
  );

  return rows.length > 0 ? { deleted: true } : null;
}

function toReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    task_id: row.task_id,
    user_id: row.user_id,
    minutes_before: row.minutes_before,
    sent_at: row.sent_at ? new Date(row.sent_at).toISOString() : null,
    created_at: new Date(row.created_at).toISOString()
  };
}

function calculateScheduledFor(
  taskDate: Date | string,
  taskTime: string | null,
  minutesBefore: number
) {
  const dateKey =
    taskDate instanceof Date ? taskDate.toISOString().slice(0, 10) : taskDate;
  const timeKey = taskTime ?? "08:00:00";
  // Fortaleza é UTC-3; sem o offset explícito o Node interpreta como UTC em servidores com TZ=UTC
  const scheduledFor = new Date(`${dateKey}T${timeKey}-03:00`);
  scheduledFor.setMinutes(scheduledFor.getMinutes() - minutesBefore);

  return scheduledFor;
}
