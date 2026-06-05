import { sql } from "../config/db";

export interface AuthorizedNumberPermissions {
  can_create_task: boolean;
  can_read_tasks: boolean;
  can_delete_task: boolean;
  can_add_reminder: boolean;
}

export interface AuthorizedNumber extends AuthorizedNumberPermissions {
  id: string;
  instance_id: string;
  user_id: string;
  phone: string;
  label: string | null;
  active: boolean;
  created_at: string;
}

interface AuthorizedNumberRow extends AuthorizedNumberPermissions {
  id: string;
  instance_id: string;
  user_id: string;
  phone: string;
  label: string | null;
  active: boolean;
  created_at: Date | string;
}

export interface CreateAuthorizedNumberData extends AuthorizedNumberPermissions {
  instanceId: string;
  userId: string;
  phone: string;
  label?: string | null;
}

export interface UpdateAuthorizedNumberData {
  label?: string | null;
  can_create_task?: boolean;
  can_read_tasks?: boolean;
  can_delete_task?: boolean;
  can_add_reminder?: boolean;
  active?: boolean;
}

const authorizedNumberColumns = `
  id, instance_id, user_id, phone, label, can_create_task, can_read_tasks,
  can_delete_task, can_add_reminder, active, created_at
`;

export async function listAuthorizedNumbers(
  instanceId: string
): Promise<AuthorizedNumber[]> {
  const rows = await sql<AuthorizedNumberRow[]>`
    SELECT id, instance_id, user_id, phone, label, can_create_task,
      can_read_tasks, can_delete_task, can_add_reminder, active, created_at
    FROM authorized_numbers
    WHERE instance_id = ${instanceId}
    ORDER BY created_at DESC
  `;

  return rows.map(toAuthorizedNumber);
}

export async function getAuthorizedNumberByPhone(
  instanceId: string,
  phone: string,
  activeOnly = false
): Promise<AuthorizedNumber | null> {
  const activeClause = activeOnly ? "AND active = true" : "";
  const rows = await sql.unsafe<AuthorizedNumberRow[]>(
    `
      SELECT ${authorizedNumberColumns}
      FROM authorized_numbers
      WHERE instance_id = $1
        AND phone = $2
        ${activeClause}
      LIMIT 1
    `,
    [instanceId, phone]
  );

  return rows[0] ? toAuthorizedNumber(rows[0]) : null;
}

export async function createAuthorizedNumber(
  data: CreateAuthorizedNumberData
): Promise<AuthorizedNumber> {
  const rows = await sql<AuthorizedNumberRow[]>`
    INSERT INTO authorized_numbers (
      instance_id, user_id, phone, label, can_create_task, can_read_tasks,
      can_delete_task, can_add_reminder
    )
    VALUES (
      ${data.instanceId},
      ${data.userId},
      ${data.phone},
      ${data.label ?? null},
      ${data.can_create_task},
      ${data.can_read_tasks},
      ${data.can_delete_task},
      ${data.can_add_reminder}
    )
    RETURNING id, instance_id, user_id, phone, label, can_create_task,
      can_read_tasks, can_delete_task, can_add_reminder, active, created_at
  `;

  return toAuthorizedNumber(rows[0]);
}

export async function updateAuthorizedNumber(
  instanceId: string,
  numberId: string,
  data: UpdateAuthorizedNumberData
): Promise<AuthorizedNumber | null> {
  const updates: string[] = [];
  const params: Array<string | boolean | null> = [];

  addUpdate(updates, params, "label", data.label);
  addUpdate(updates, params, "can_create_task", data.can_create_task);
  addUpdate(updates, params, "can_read_tasks", data.can_read_tasks);
  addUpdate(updates, params, "can_delete_task", data.can_delete_task);
  addUpdate(updates, params, "can_add_reminder", data.can_add_reminder);
  addUpdate(updates, params, "active", data.active);

  if (updates.length === 0) {
    return getAuthorizedNumberById(instanceId, numberId);
  }

  params.push(numberId, instanceId);

  const rows = await sql.unsafe<AuthorizedNumberRow[]>(
    `
      UPDATE authorized_numbers
      SET ${updates.join(", ")}
      WHERE id = $${params.length - 1}
        AND instance_id = $${params.length}
      RETURNING ${authorizedNumberColumns}
    `,
    params
  );

  return rows[0] ? toAuthorizedNumber(rows[0]) : null;
}

export async function deleteAuthorizedNumber(
  instanceId: string,
  numberId: string
): Promise<{ deleted: true } | null> {
  const rows = await sql<{ id: string }[]>`
    DELETE FROM authorized_numbers
    WHERE id = ${numberId}
      AND instance_id = ${instanceId}
    RETURNING id
  `;

  return rows.length > 0 ? { deleted: true } : null;
}

export async function getFirstActiveAuthorizedNumberForUser(
  userId: string
): Promise<AuthorizedNumber | null> {
  const rows = await sql<AuthorizedNumberRow[]>`
    SELECT id, instance_id, user_id, phone, label, can_create_task,
      can_read_tasks, can_delete_task, can_add_reminder, active, created_at
    FROM authorized_numbers
    WHERE user_id = ${userId}
      AND active = true
    ORDER BY created_at ASC
    LIMIT 1
  `;

  return rows[0] ? toAuthorizedNumber(rows[0]) : null;
}

async function getAuthorizedNumberById(
  instanceId: string,
  numberId: string
): Promise<AuthorizedNumber | null> {
  const rows = await sql<AuthorizedNumberRow[]>`
    SELECT id, instance_id, user_id, phone, label, can_create_task,
      can_read_tasks, can_delete_task, can_add_reminder, active, created_at
    FROM authorized_numbers
    WHERE id = ${numberId}
      AND instance_id = ${instanceId}
    LIMIT 1
  `;

  return rows[0] ? toAuthorizedNumber(rows[0]) : null;
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

function toAuthorizedNumber(row: AuthorizedNumberRow): AuthorizedNumber {
  return {
    id: row.id,
    instance_id: row.instance_id,
    user_id: row.user_id,
    phone: row.phone,
    label: row.label,
    can_create_task: row.can_create_task,
    can_read_tasks: row.can_read_tasks,
    can_delete_task: row.can_delete_task,
    can_add_reminder: row.can_add_reminder,
    active: row.active,
    created_at: new Date(row.created_at).toISOString()
  };
}
