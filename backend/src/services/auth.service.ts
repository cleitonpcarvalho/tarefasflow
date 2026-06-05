import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sql } from "../config/db";
import { env } from "../config/env";
import type { JwtPayload, PublicUser, UserRow } from "../types/auth";

export class AuthServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AuthServiceError";
    this.statusCode = statusCode;
  }
}

interface AuthSession {
  user: PublicUser;
  token: string;
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthSession> {
  const normalizedEmail = normalizeEmail(email);

  const existingUsers = await sql<{ id: string }[]>`
    SELECT id
    FROM users
    WHERE email = ${normalizedEmail}
    LIMIT 1
  `;

  if (existingUsers.length > 0) {
    throw new AuthServiceError("Email ja cadastrado.", 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const users = await sql<UserRow[]>`
      INSERT INTO users (name, email, password)
      VALUES (${name.trim()}, ${normalizedEmail}, ${passwordHash})
      RETURNING id, name, email, password, role, active, whatsapp_phone,
        created_at, updated_at
    `;
    const user = toPublicUser(users[0]);

    return {
      user,
      token: signAuthToken(user)
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AuthServiceError("Email ja cadastrado.", 400);
    }

    throw error;
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthSession> {
  const normalizedEmail = normalizeEmail(email);
  const users = await sql<UserRow[]>`
    SELECT id, name, email, password, role, active, whatsapp_phone,
      created_at, updated_at
    FROM users
    WHERE email = ${normalizedEmail}
    LIMIT 1
  `;

  const userRow = users[0];

  if (!userRow) {
    throw new AuthServiceError("Credenciais inválidas.", 401);
  }

  if (!userRow.active) {
    throw new AuthServiceError("Conta desativada.", 403);
  }

  const validPassword = await bcrypt.compare(password, userRow.password);

  if (!validPassword) {
    throw new AuthServiceError("Credenciais inválidas.", 401);
  }

  const user = toPublicUser(userRow);

  return {
    user,
    token: signAuthToken(user)
  };
}

export async function findPublicUserById(
  id: string
): Promise<PublicUser | null> {
  const users = await sql<UserRow[]>`
    SELECT id, name, email, password, role, active, whatsapp_phone,
      created_at, updated_at
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `;

  const user = users[0];

  if (!user || !user.active) {
    return null;
  }

  return toPublicUser(user);
}

function signAuthToken(user: PublicUser) {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "7d"
  });
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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
