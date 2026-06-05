import bcrypt from "bcrypt";
import { sql } from "../config/db";
import type { PublicUser, UserRole, UserRow } from "../types/auth";

export class UserServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "UserServiceError";
    this.statusCode = statusCode;
  }
}

export interface UserFilters {
  role?: UserRole;
  active?: boolean;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: UserRole;
  active?: boolean;
  whatsapp_phone?: string | null;
}

const userSelectColumns =
  "id, name, email, password, role, active, whatsapp_phone, created_at, updated_at";

export async function listUsers(filters: UserFilters = {}): Promise<PublicUser[]> {
  const conditions: string[] = [];
  const params: Array<string | boolean> = [];

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

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
