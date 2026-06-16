import { sql } from "../config/db";
import type { UserRole } from "../types/auth";
import type { Task, TaskColor, TaskRow } from "../types/task";
import {
  expandRecurringTask,
  parseDateAtEndOfDay,
  parseDateAtStartOfDay
} from "./recurrence.service";

export class TaskServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "TaskServiceError";
    this.statusCode = statusCode;
  }
}

interface RequesterContext {
  requesterId: string;
  requesterRole: UserRole;
}

interface CreateRequesterContext {
  requesterId: string;
}

export interface TaskFilters {
  month?: number;
  year?: number;
  date?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string | null;
  task_date: string;
  task_time?: string | null;
  color?: TaskColor;
  rrule?: string | null;
  is_recurring?: boolean;
  recurrence_end?: string | null;
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  task_date?: string;
  task_time?: string | null;
  color?: TaskColor;
  done?: boolean;
  rrule?: string | null;
  is_recurring?: boolean;
  recurrence_end?: string | null;
}

const taskSelectColumns = `
  id, user_id, title, description, task_date, task_time, color, done,
  rrule, is_recurring, parent_id, recurrence_end, excluded_dates, done_dates,
  created_at, updated_at
`;

export async function getTasks({
  requesterId,
  filters = {}
}: RequesterContext & { filters?: TaskFilters }): Promise<Task[]> {
  const conditions = ["user_id = $1"];
  const params: Array<string | number> = [requesterId];
  const range = getTaskRange(filters);

  conditions.push("parent_id IS NULL");

  if (range) {
    params.push(range.startDate);
    const startParam = `$${params.length}`;
    params.push(range.endDate);
    const endParam = `$${params.length}`;

    conditions.push(`
      (
        (
          is_recurring = false
          AND task_date BETWEEN ${startParam} AND ${endParam}
        )
        OR
        (
          is_recurring = true
          AND task_date <= ${endParam}
          AND (recurrence_end IS NULL OR recurrence_end >= ${startParam})
        )
      )
    `);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await sql.unsafe<TaskRow[]>(
    `
      SELECT ${taskSelectColumns}
      FROM tasks
      ${whereClause}
      ORDER BY task_date ASC, task_time ASC NULLS LAST
    `,
    params
  );

  const tasks = rows.map(toTask);
  const expandedTasks = range
    ? tasks.flatMap((task) =>
        task.is_recurring
          ? expandRecurringTask(task, range.start, range.end)
          : [task]
      )
    : tasks;

  return expandedTasks.sort(compareTasks);
}

export async function getTaskById(
  taskId: string,
  { requesterId }: RequesterContext
): Promise<Task | null> {
  const occurrence = parseOccurrenceTaskId(taskId);
  const persistentTaskId = occurrence?.parentId ?? taskId;
  const params = [persistentTaskId, requesterId];

  const rows = await sql.unsafe<TaskRow[]>(
    `
      SELECT ${taskSelectColumns}
      FROM tasks
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `,
    params
  );

  const task = rows[0] ? toTask(rows[0]) : null;

  if (!task || !occurrence) {
    return task;
  }

  return (
    expandRecurringTask(
      task,
      parseDateAtStartOfDay(occurrence.date),
      parseDateAtEndOfDay(occurrence.date)
    )[0] ?? null
  );
}

export async function createTask(
  data: CreateTaskData,
  { requesterId }: CreateRequesterContext
): Promise<Task> {
  const description = normalizeNullableInsertText(data.description);
  const taskTime = normalizeNullableInsertText(data.task_time);
  const rrule = normalizeNullableInsertText(data.rrule);
  const isRecurring = Boolean(data.is_recurring && rrule);
  const recurrenceEnd = normalizeNullableInsertText(data.recurrence_end);

  if (taskTime) {
    const conflict = await sql<{ id: string }[]>`
      SELECT id FROM tasks
      WHERE user_id = ${requesterId}
        AND task_date = ${data.task_date}
        AND task_time = ${taskTime}
        AND done = false
      LIMIT 1
    `;
    if (conflict.length > 0) {
      throw new TaskServiceError(
        `Já existe uma tarefa agendada para ${data.task_date} às ${taskTime}. Escolha outro horário.`,
        409
      );
    }

    if (await hasRecurringTaskConflict(requesterId, data.task_date, taskTime)) {
      throw new TaskServiceError(
        `Já existe uma tarefa agendada para ${data.task_date} às ${taskTime}. Escolha outro horário.`,
        409
      );
    }
  }

  const rows = await sql<TaskRow[]>`
    INSERT INTO tasks (
      user_id, title, description, task_date, task_time, color, rrule,
      is_recurring, recurrence_end
    )
    VALUES (
      ${requesterId},
      ${data.title.trim()},
      ${description},
      ${data.task_date},
      ${taskTime},
      ${data.color ?? "purple"},
      ${isRecurring ? rrule : null},
      ${isRecurring},
      ${isRecurring ? recurrenceEnd : null}
    )
    RETURNING id, user_id, title, description, task_date, task_time, color,
      done, rrule, is_recurring, parent_id, recurrence_end, excluded_dates, done_dates,
      created_at, updated_at
  `;

  const task = toTask(rows[0]);
  void applyDefaultReminders(task.id, requesterId);

  return task;
}

export async function updateTask(
  taskId: string,
  data: UpdateTaskData,
  { requesterId, requesterRole }: RequesterContext
): Promise<Task | null> {
  const occurrence = parseOccurrenceTaskId(taskId);
  const persistentTaskId = occurrence?.parentId ?? taskId;
  const existingTask = await getTaskById(persistentTaskId, {
    requesterId,
    requesterRole
  });

  if (!existingTask) {
    return null;
  }

  if (data.task_date !== undefined || data.task_time !== undefined) {
    const newDate = data.task_date ?? existingTask.task_date;
    const newTime =
      data.task_time !== undefined
        ? normalizeNullableText(data.task_time)
        : existingTask.task_time;

    if (newTime) {
      const conflict = await sql<{ id: string }[]>`
        SELECT id FROM tasks
        WHERE user_id = ${requesterId}
          AND task_date = ${newDate}
          AND task_time = ${newTime}
          AND done = false
          AND id != ${persistentTaskId}
        LIMIT 1
      `;
      if (conflict.length > 0) {
        throw new TaskServiceError(
          `Já existe uma tarefa agendada para ${newDate} às ${newTime}. Escolha outro horário.`,
          409
        );
      }

      if (
        await hasRecurringTaskConflict(
          requesterId,
          newDate,
          newTime,
          persistentTaskId
        )
      ) {
        throw new TaskServiceError(
          `Já existe uma tarefa agendada para ${newDate} às ${newTime}. Escolha outro horário.`,
          409
        );
      }
    }
  }

  const updates: string[] = [];
  const params: Array<string | boolean | null> = [];

  addUpdate(updates, params, "title", data.title?.trim());
  addUpdate(updates, params, "description", normalizeNullableText(data.description));
  addUpdate(
    updates,
    params,
    "task_date",
    occurrence && data.task_date === occurrence.date
      ? undefined
      : data.task_date
  );
  addUpdate(updates, params, "task_time", normalizeNullableText(data.task_time));
  addUpdate(updates, params, "color", data.color);
  addUpdate(updates, params, "done", data.done);
  addUpdate(updates, params, "rrule", normalizeNullableText(data.rrule));
  addUpdate(updates, params, "is_recurring", data.is_recurring);
  addUpdate(
    updates,
    params,
    "recurrence_end",
    normalizeNullableText(data.recurrence_end)
  );

  if (updates.length === 0) {
    return existingTask;
  }

  updates.push("updated_at = NOW()");

  params.push(persistentTaskId);
  const idParam = `$${params.length}`;

  params.push(requesterId);
  const userIdParam = `$${params.length}`;

  const rows = await sql.unsafe<TaskRow[]>(
    `
      UPDATE tasks
      SET ${updates.join(", ")}
      WHERE id = ${idParam} AND user_id = ${userIdParam}
      RETURNING ${taskSelectColumns}
    `,
    params
  );

  return rows[0] ? toTask(rows[0]) : null;
}

export async function deleteTask(
  taskId: string,
  { requesterId, requesterRole }: RequesterContext,
  scope: "this" | "all" = "this"
): Promise<{ deleted: true; scope: "this" | "all" } | null> {
  const occurrence = parseOccurrenceTaskId(taskId);
  const persistentTaskId = occurrence?.parentId ?? taskId;
  const task = await getTaskById(persistentTaskId, {
    requesterId,
    requesterRole
  });

  if (!task) {
    return null;
  }

  if (task.is_recurring && scope === "this") {
    const excludedDate = occurrence?.date ?? task.task_date;
    const params = [excludedDate, persistentTaskId, requesterId];
    const rows = await sql.unsafe<{ id: string }[]>(
      `
        UPDATE tasks
        SET excluded_dates = CASE
          WHEN $1 = ANY(excluded_dates) THEN excluded_dates
          ELSE array_append(excluded_dates, $1)
        END,
        updated_at = NOW()
        WHERE id = $2 AND user_id = $3
        RETURNING id
      `,
      params
    );

    return rows.length > 0 ? { deleted: true, scope: "this" } : null;
  }

  const params = [persistentTaskId, requesterId];

  const rows = await sql.unsafe<{ id: string }[]>(
    `
      DELETE FROM tasks
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `,
    params
  );

  return rows.length > 0 ? { deleted: true, scope: "all" } : null;
}

export async function toggleTaskDone(
  taskId: string,
  { requesterId, requesterRole }: RequesterContext
): Promise<Task | null> {
  const occurrence = parseOccurrenceTaskId(taskId);

  if (occurrence) {
    const { parentId, date } = occurrence;
    const params = [date, parentId, requesterId];

    const rows = await sql.unsafe<TaskRow[]>(
      `
        UPDATE tasks
        SET done_dates = CASE
          WHEN $1 = ANY(done_dates) THEN array_remove(done_dates, $1)
          ELSE array_append(done_dates, $1)
        END,
        updated_at = NOW()
        WHERE id = $2 AND user_id = $3
        RETURNING ${taskSelectColumns}
      `,
      params
    );

    if (!rows[0]) return null;
    const parent = toTask(rows[0]);
    const isDone = parent.done_dates.includes(date);

    return { ...parent, id: taskId, task_date: date, done: isDone };
  }

  const params = [taskId, requesterId];

  const rows = await sql.unsafe<TaskRow[]>(
    `
      UPDATE tasks
      SET done = NOT done, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING ${taskSelectColumns}
    `,
    params
  );

  return rows[0] ? toTask(rows[0]) : null;
}

export async function getTasksForDate(
  userId: string,
  date: string
): Promise<
  Array<{
    title: string;
    task_time: string | null;
    color: TaskColor;
    description: string | null;
  }>
> {
  const tasks = await getTasks({
    requesterId: userId,
    requesterRole: "user",
    filters: { date }
  });

  return tasks
    .filter((task) => !task.done)
    .map((task) => ({
      title: task.title,
      task_time: task.task_time,
      color: task.color ?? "purple",
      description: task.description ?? null
    }));
}

async function hasRecurringTaskConflict(
  requesterId: string,
  targetDate: string,
  targetTime: string,
  excludedTaskId?: string
) {
  const recurringRows = await sql.unsafe<TaskRow[]>(
    `
      SELECT ${taskSelectColumns}
      FROM tasks
      WHERE user_id = $1
        AND rrule IS NOT NULL
        AND done = false
    `,
    [requesterId]
  );
  const rangeStart = parseDateAtStartOfDay(targetDate);
  const rangeEnd = parseDateAtEndOfDay(targetDate);

  return recurringRows.some((row) => {
    const task = toTask(row);

    if (task.id === excludedTaskId) {
      return false;
    }

    return expandRecurringTask(task, rangeStart, rangeEnd).some(
      (occurrence) => occurrence.task_time === targetTime
    );
  });
}

function addUpdate(
  updates: string[],
  params: Array<string | boolean | null>,
  field: string,
  value: string | boolean | null | undefined
) {
  if (value !== undefined) {
    params.push(value);
    updates.push(`${field} = $${params.length}`);
  }
}

function normalizeNullableInsertText(value: string | null | undefined) {
  return normalizeNullableText(value) ?? null;
}

function normalizeNullableText(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function applyDefaultReminders(taskId: string, requesterId: string) {
  try {
    const rows = await sql<{ reminder_defaults: number[] | null }[]>`
      SELECT COALESCE(reminder_defaults, '{}'::INTEGER[]) AS reminder_defaults
      FROM users
      WHERE id = ${requesterId}
      LIMIT 1
    `;
    const reminderDefaults = [...new Set(rows[0]?.reminder_defaults ?? [])]
      .filter((value) => Number.isInteger(value) && value > 0)
      .slice(0, 5);

    if (reminderDefaults.length === 0) {
      return;
    }

    const { createReminder } = await import("./reminder.service");
    await Promise.all(
      reminderDefaults.map((minutesBefore) =>
        createReminder(
          { task_id: taskId, minutes_before: minutesBefore },
          { requesterId }
        )
      )
    );
  } catch (error) {
    console.error("Erro ao aplicar lembretes padrão:", error);
  }
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
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
    recurrence_end: row.recurrence_end
      ? formatDateOnly(row.recurrence_end)
      : null,
    excluded_dates: row.excluded_dates ?? [],
    done_dates: row.done_dates ?? [],
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
}

function getTaskRange(filters: TaskFilters) {
  if (filters.date) {
    return {
      startDate: filters.date,
      endDate: filters.date,
      start: parseDateAtStartOfDay(filters.date),
      end: parseDateAtEndOfDay(filters.date)
    };
  }

  if (filters.month && filters.year) {
    const startDate = `${filters.year}-${String(filters.month).padStart(2, "0")}-01`;
    const lastDay = new Date(
      Date.UTC(filters.year, filters.month, 0)
    ).getUTCDate();
    const endDate = `${filters.year}-${String(filters.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    return {
      startDate,
      endDate,
      start: parseDateAtStartOfDay(startDate),
      end: parseDateAtEndOfDay(endDate)
    };
  }

  if (filters.year) {
    const startDate = `${filters.year}-01-01`;
    const endDate = `${filters.year}-12-31`;

    return {
      startDate,
      endDate,
      start: parseDateAtStartOfDay(startDate),
      end: parseDateAtEndOfDay(endDate)
    };
  }

  return null;
}

function parseOccurrenceTaskId(taskId: string) {
  const match = taskId.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})_(\d{4}-\d{2}-\d{2})$/i
  );

  return match ? { parentId: match[1], date: match[2] } : null;
}

function compareTasks(left: Task, right: Task) {
  const dateComparison = left.task_date.localeCompare(right.task_date);

  if (dateComparison !== 0) {
    return dateComparison;
  }

  return (left.task_time ?? "99:99").localeCompare(right.task_time ?? "99:99");
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
