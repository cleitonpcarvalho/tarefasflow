import { sql } from "../config/db";
import type { UserRole } from "../types/auth";
import type { Task, TaskColor, TaskRow } from "../types/task";

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
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  task_date?: string;
  task_time?: string | null;
  color?: TaskColor;
  done?: boolean;
}

const taskSelectColumns = `
  id, user_id, title, description, task_date, task_time, color, done,
  created_at, updated_at
`;

export async function getTasks({
  requesterId,
  requesterRole,
  filters = {}
}: RequesterContext & { filters?: TaskFilters }): Promise<Task[]> {
  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (requesterRole === "user") {
    params.push(requesterId);
    conditions.push(`user_id = $${params.length}`);
  }

  if (filters.date) {
    params.push(filters.date);
    conditions.push(`task_date = $${params.length}`);
  }

  if (filters.month) {
    params.push(filters.month);
    conditions.push(`EXTRACT(MONTH FROM task_date) = $${params.length}`);
  }

  if (filters.year) {
    params.push(filters.year);
    conditions.push(`EXTRACT(YEAR FROM task_date) = $${params.length}`);
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

  return rows.map(toTask);
}

export async function getTaskById(
  taskId: string,
  { requesterId, requesterRole }: RequesterContext
): Promise<Task | null> {
  const conditions = ["id = $1"];
  const params = [taskId, requesterId];

  if (requesterRole === "user") {
    conditions.push("user_id = $2");
  }

  const rows = await sql.unsafe<TaskRow[]>(
    `
      SELECT ${taskSelectColumns}
      FROM tasks
      WHERE ${conditions.join(" AND ")}
      LIMIT 1
    `,
    requesterRole === "user" ? params : [taskId]
  );

  return rows[0] ? toTask(rows[0]) : null;
}

export async function createTask(
  data: CreateTaskData,
  { requesterId }: CreateRequesterContext
): Promise<Task> {
  const description = normalizeNullableInsertText(data.description);
  const taskTime = normalizeNullableInsertText(data.task_time);

  const rows = await sql<TaskRow[]>`
    INSERT INTO tasks (
      user_id, title, description, task_date, task_time, color
    )
    VALUES (
      ${requesterId},
      ${data.title.trim()},
      ${description},
      ${data.task_date},
      ${taskTime},
      ${data.color ?? "purple"}
    )
    RETURNING id, user_id, title, description, task_date, task_time, color,
      done, created_at, updated_at
  `;

  return toTask(rows[0]);
}

export async function updateTask(
  taskId: string,
  data: UpdateTaskData,
  { requesterId, requesterRole }: RequesterContext
): Promise<Task | null> {
  const existingTask = await getTaskById(taskId, { requesterId, requesterRole });

  if (!existingTask) {
    return null;
  }

  const updates: string[] = [];
  const params: Array<string | boolean | null> = [];

  addUpdate(updates, params, "title", data.title?.trim());
  addUpdate(updates, params, "description", normalizeNullableText(data.description));
  addUpdate(updates, params, "task_date", data.task_date);
  addUpdate(updates, params, "task_time", normalizeNullableText(data.task_time));
  addUpdate(updates, params, "color", data.color);
  addUpdate(updates, params, "done", data.done);

  if (updates.length === 0) {
    return existingTask;
  }

  updates.push("updated_at = NOW()");

  params.push(taskId);
  const idParam = `$${params.length}`;

  let scopeClause = "";

  if (requesterRole === "user") {
    params.push(requesterId);
    scopeClause = `AND user_id = $${params.length}`;
  }

  const rows = await sql.unsafe<TaskRow[]>(
    `
      UPDATE tasks
      SET ${updates.join(", ")}
      WHERE id = ${idParam} ${scopeClause}
      RETURNING ${taskSelectColumns}
    `,
    params
  );

  return rows[0] ? toTask(rows[0]) : null;
}

export async function deleteTask(
  taskId: string,
  { requesterId, requesterRole }: RequesterContext
): Promise<{ deleted: true } | null> {
  const params = [taskId, requesterId];
  const scopeClause = requesterRole === "user" ? "AND user_id = $2" : "";

  const rows = await sql.unsafe<{ id: string }[]>(
    `
      DELETE FROM tasks
      WHERE id = $1 ${scopeClause}
      RETURNING id
    `,
    requesterRole === "user" ? params : [taskId]
  );

  return rows.length > 0 ? { deleted: true } : null;
}

export async function toggleTaskDone(
  taskId: string,
  { requesterId, requesterRole }: RequesterContext
): Promise<Task | null> {
  const params = [taskId, requesterId];
  const scopeClause = requesterRole === "user" ? "AND user_id = $2" : "";

  const rows = await sql.unsafe<TaskRow[]>(
    `
      UPDATE tasks
      SET done = NOT done, updated_at = NOW()
      WHERE id = $1 ${scopeClause}
      RETURNING ${taskSelectColumns}
    `,
    requesterRole === "user" ? params : [taskId]
  );

  return rows[0] ? toTask(rows[0]) : null;
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
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString()
  };
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
