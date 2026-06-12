import bcrypt from "bcrypt";
import { sql } from "../config/db";
import type { PublicUser, UserRole, UserRow } from "../types/auth";
import type { EvolutionConnectionState } from "./evolution.service";

export class UserServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "UserServiceError";
    this.statusCode = statusCode;
  }
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  active?: boolean;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: UserRole;
  active?: boolean;
  whatsapp_phone?: string | null;
}

export interface ReminderDefaultsData {
  reminder_defaults: number[];
}

export interface DailySummaryData {
  enabled: boolean;
  time: string;
}

export interface AdminUser extends PublicUser {
  instance_status: EvolutionConnectionState | null;
}

interface AdminUserRow extends Omit<UserRow, "password"> {
  instance_status: EvolutionConnectionState | null;
}

const userSelectColumns =
  "id, name, email, password, role, active, whatsapp_phone, created_at, updated_at";

export async function listUsers(filters: UserFilters = {}): Promise<PublicUser[]> {
  const conditions: string[] = [];
  const params: Array<string | boolean> = [];

  if (filters.search?.trim()) {
    params.push(`%${filters.search.trim()}%`);
    conditions.push(
      `(name ILIKE $${params.length} OR email ILIKE $${params.length})`
    );
  }

  if (filters.role) {
    params.push(filters.role);
    conditions.push(`role = $${params.length}`);
  }

  if (filters.active !== undefined) {
    params.push(filters.active);
    conditions.push(`active = $${params.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await sql.unsafe<UserRow[]>(
    `
      SELECT ${userSelectColumns}
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
    `,
    params
  );

  return rows.map(toPublicUser);
}

export async function listUsersWithInstanceStatus(
  filters: UserFilters = {}
): Promise<AdminUser[]> {
  const conditions: string[] = [];
  const params: Array<string | boolean> = [];

  if (filters.search?.trim()) {
    params.push(`%${filters.search.trim()}%`);
    conditions.push(
      `(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`
    );
  }

  if (filters.role) {
    params.push(filters.role);
    conditions.push(`u.role = $${params.length}`);
  }

  if (filters.active !== undefined) {
    params.push(filters.active);
    conditions.push(`u.active = $${params.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await sql.unsafe<AdminUserRow[]>(
    `
      SELECT
        u.id, u.name, u.email, u.role, u.active,
        u.whatsapp_phone, u.created_at, u.updated_at,
        wi.status AS instance_status
      FROM users u
      LEFT JOIN LATERAL (
        SELECT status
        FROM whatsapp_instances
        WHERE user_id = u.id
        ORDER BY created_at DESC
        LIMIT 1
      ) wi ON TRUE
      ${whereClause}
      ORDER BY u.created_at DESC
    `,
    params
  );

  return rows.map(toAdminUser);
}

export async function createUser(
  data: CreateUserData
): Promise<PublicUser> {
  const email = data.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(data.password, 12);

  try {
    const rows = await sql<UserRow[]>`
      INSERT INTO users (name, email, password, role)
      VALUES (
        ${data.name.trim()},
        ${email},
        ${passwordHash},
        ${data.role}
      )
      RETURNING id, name, email, password, role, active, whatsapp_phone,
        created_at, updated_at
    `;

    return toPublicUser(rows[0]);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new UserServiceError("Email já cadastrado.", 409);
    }

    throw error;
  }
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const rows = await sql<UserRow[]>`
    SELECT id, name, email, password, role, active, whatsapp_phone,
      created_at, updated_at
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `;

  return rows[0] ? toPublicUser(rows[0]) : null;
}

export async function getActiveUserByWhatsappPhone(
  phone: string
): Promise<PublicUser | null> {
  const rows = await sql<UserRow[]>`
    SELECT id, name, email, password, role, active, whatsapp_phone,
      created_at, updated_at
    FROM users
    WHERE whatsapp_phone = ${phone}
      AND active = true
    LIMIT 1
  `;

  return rows[0] ? toPublicUser(rows[0]) : null;
}

export async function updateUser(
  id: string,
  data: UpdateUserData,
  requesterId: string
): Promise<PublicUser | null> {
  if (id === requesterId && data.active === false) {
    throw new UserServiceError("Admin não pode desativar a si mesmo.", 400);
  }

  const updates: string[] = [];
  const params: Array<string | boolean | null> = [];

  addUpdate(updates, params, "name", data.name?.trim());
  addUpdate(updates, params, "email", data.email?.trim().toLowerCase());
  addUpdate(updates, params, "role", data.role);
  addUpdate(updates, params, "active", data.active);
  if ("whatsapp_phone" in data) {
    addUpdate(updates, params, "whatsapp_phone", data.whatsapp_phone);
  }

  if (updates.length === 0) {
    return getUserById(id);
  }

  updates.push("updated_at = NOW()");
  params.push(id);

  try {
    const rows = await sql.unsafe<UserRow[]>(
      `
        UPDATE users
        SET ${updates.join(", ")}
        WHERE id = $${params.length}
        RETURNING ${userSelectColumns}
      `,
      params
    );

    return rows[0] ? toPublicUser(rows[0]) : null;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new UserServiceError("Email ou WhatsApp já cadastrado.", 400);
    }

    throw error;
  }
}

export async function updateOwnWhatsappPhone(
  userId: string,
  phone: string
): Promise<{ whatsapp_phone: string }> {
  try {
    const rows = await sql<{ whatsapp_phone: string }[]>`
      UPDATE users
      SET whatsapp_phone = ${phone}, updated_at = NOW()
      WHERE id = ${userId}
      RETURNING whatsapp_phone
    `;

    if (!rows[0]) {
      throw new UserServiceError("Usuário não encontrado.", 404);
    }

    return rows[0];
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new UserServiceError("Número WhatsApp já vinculado.", 409);
    }

    throw error;
  }
}

export async function changeOwnPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ updated: true }> {
  const rows = await sql<{ id: string; password: string }[]>`
    SELECT id, password
    FROM users
    WHERE id = ${userId}
      AND active = true
    LIMIT 1
  `;

  const user = rows[0];

  if (!user) {
    throw new UserServiceError("Usuário não encontrado.", 404);
  }

  const validPassword = await bcrypt.compare(currentPassword, user.password);

  if (!validPassword) {
    throw new UserServiceError("Senha atual inválida.", 401);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await sql`
    UPDATE users
    SET password = ${passwordHash}, updated_at = NOW()
    WHERE id = ${userId}
  `;

  return { updated: true };
}

export async function getReminderDefaults(
  userId: string
): Promise<ReminderDefaultsData> {
  const rows = await sql<{ reminder_defaults: number[] | null }[]>`
    SELECT COALESCE(reminder_defaults, '{}'::INTEGER[]) AS reminder_defaults
    FROM users
    WHERE id = ${userId}
      AND active = true
    LIMIT 1
  `;

  if (!rows[0]) {
    throw new UserServiceError("Usuário não encontrado.", 404);
  }

  return {
    reminder_defaults: normalizeReminderDefaults(rows[0].reminder_defaults)
  };
}

export async function updateReminderDefaults(
  userId: string,
  reminderDefaults: number[]
): Promise<ReminderDefaultsData> {
  const normalizedDefaults = normalizeReminderDefaults(reminderDefaults);
  const rows = await sql<{ reminder_defaults: number[] | null }[]>`
    UPDATE users
    SET reminder_defaults = ${sql.array(normalizedDefaults, 23)},
      updated_at = NOW()
    WHERE id = ${userId}
      AND active = true
    RETURNING reminder_defaults
  `;

  if (!rows[0]) {
    throw new UserServiceError("Usuário não encontrado.", 404);
  }

  return {
    reminder_defaults: normalizeReminderDefaults(rows[0].reminder_defaults)
  };
}

export async function getDailySummary(userId: string): Promise<DailySummaryData> {
  const rows = await sql<{ daily_summary_enabled: boolean; daily_summary_time: string | null }[]>`
    SELECT daily_summary_enabled, daily_summary_time
    FROM users
    WHERE id = ${userId}
      AND active = true
    LIMIT 1
  `;

  if (!rows[0]) {
    throw new UserServiceError("Usuário não encontrado.", 404);
  }

  return {
    enabled: rows[0].daily_summary_enabled,
    time: rows[0].daily_summary_time ?? "06:00"
  };
}

export async function updateDailySummary(
  userId: string,
  enabled: boolean,
  time: string
): Promise<DailySummaryData> {
  const rows = await sql<{ daily_summary_enabled: boolean; daily_summary_time: string }[]>`
    UPDATE users
    SET daily_summary_enabled = ${enabled},
        daily_summary_time = ${time},
        updated_at = NOW()
    WHERE id = ${userId}
      AND active = true
    RETURNING daily_summary_enabled, daily_summary_time
  `;

  if (!rows[0]) {
    throw new UserServiceError("Usuário não encontrado.", 404);
  }

  return {
    enabled: rows[0].daily_summary_enabled,
    time: rows[0].daily_summary_time
  };
}

export async function deleteUser(
  id: string,
  requesterId: string
): Promise<{ deleted: true } | null> {
  if (id === requesterId) {
    throw new UserServiceError("Admin não pode deletar a si mesmo.", 400);
  }

  const rows = await sql<{ id: string }[]>`
    DELETE FROM users
    WHERE id = ${id}
    RETURNING id
  `;

  return rows.length > 0 ? { deleted: true } : null;
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

function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    whatsapp_phone: user.whatsapp_phone,
    createdAt: new Date(user.created_at).toISOString(),
    updatedAt: new Date(user.updated_at).toISOString()
  };
}

function toAdminUser(user: AdminUserRow): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    whatsapp_phone: user.whatsapp_phone,
    createdAt: new Date(user.created_at).toISOString(),
    updatedAt: new Date(user.updated_at).toISOString(),
    instance_status: user.instance_status
  };
}

function normalizeReminderDefaults(reminderDefaults: number[] | null) {
  const values = reminderDefaults ?? [];

  return [...new Set(values)]
    .filter((value) => Number.isInteger(value) && value > 0)
    .slice(0, 5);
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
