import type { FastifyPluginAsync, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";
import { sql } from "../config/db";
import { env } from "../config/env";
import { authenticate } from "../middlewares/authenticate";
import {
  AuthServiceError,
  findPublicUserById,
  loginUser,
  registerUser
} from "../services/auth.service";
import { sendVerificationCode } from "../services/email.service";
import { createInstance } from "../services/evolution.service";
import { createWhatsappInstance } from "../services/whatsapp-instance.service";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres."),
  email: z.string().trim().email("Email inválido."),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres.")
});

const loginSchema = z.object({
  email: z.string().trim().email("Email inválido."),
  password: z.string().min(1, "Senha é obrigatória.")
});

const signupSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres."),
  email: z.string().trim().email("Email inválido."),
  whatsapp_phone: z
    .string()
    .regex(/^\d{11}$/, "WhatsApp deve ter exatamente 11 dígitos (DDD + número)."),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres."),
  confirm_password: z.string().min(1, "Confirmação de senha é obrigatória.")
});

const verifyEmailSchema = z.object({
  email: z.string().trim().email("Email inválido."),
  code: z.string().length(6, "Código deve ter 6 dígitos.")
});

const resendCodeSchema = z.object({
  email: z.string().trim().email("Email inválido."),
  type: z.enum(["signup", "reset_password"])
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email inválido.")
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email("Email inválido."),
  code: z.string().length(6, "Código deve ter 6 dígitos."),
  new_password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres."),
  confirm_password: z.string().min(1, "Confirmação de senha é obrigatória.")
});

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const PARTICLES = new Set(["de","da","do","dos","das","e","em","no","na"]);

async function createInstanceForUser(userId: string, name: string): Promise<void> {
  const parts = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/\s+/)
    .filter((p) => p.length > 0 && !PARTICLES.has(p))
    .map((p) => p.replace(/[^a-z0-9]/g, ""))
    .filter((p) => p.length > 0);
  const namePart = parts.slice(0, 2).join("-") || "user";
  const instanceName = `${namePart}-${userId.slice(0, 8)}`;
  const webhookUrl = `${env.WEBHOOK_BASE_URL.replace(/\/$/, "")}/webhook/whatsapp`;
  const created = await createInstance(instanceName, webhookUrl);
  await createWhatsappInstance({
    userId,
    instanceName: created.instanceName,
    instanceToken: created.instanceToken,
    status: created.status === "close" ? "created" : created.status,
    webhookSet: true
  });
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", async (request, reply) => {
    const parsedBody = registerSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.code(400).send({
        success: false,
        data: null,
        message: "Dados inválidos.",
        error: parsedBody.error.issues[0]?.message ?? "Payload inválido."
      });
    }

    try {
      const session = await registerUser(
        parsedBody.data.name,
        parsedBody.data.email,
        parsedBody.data.password
      );

      return reply.code(201).send({
        success: true,
        data: session,
        message: "Usuário registrado com sucesso.",
        error: null
      });
    } catch (error) {
      return sendAuthError(reply, error);
    }
  });

  app.post("/login", async (request, reply) => {
    const parsedBody = loginSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.code(400).send({
        success: false,
        data: null,
        message: "Dados inválidos.",
        error: parsedBody.error.issues[0]?.message ?? "Payload inválido."
      });
    }

    try {
      const session = await loginUser(
        parsedBody.data.email,
        parsedBody.data.password
      );

      return reply.code(200).send({
        success: true,
        data: session,
        message: "Login realizado com sucesso.",
        error: null
      });
    } catch (error) {
      return sendAuthError(reply, error);
    }
  });

  app.get("/me", { preHandler: authenticate }, async (request, reply) => {
    const user = await findPublicUserById(request.user.id);

    if (!user) {
      return reply.code(401).send({
        success: false,
        data: null,
        message: "Não autorizado.",
        error: "Token ausente ou inválido."
      });
    }

    return reply.code(200).send({
      success: true,
      data: { user },
      message: "Usuário autenticado.",
      error: null
    });
  });

  app.post("/signup", async (request, reply) => {
    const parsedBody = signupSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.code(400).send({
        success: false,
        data: null,
        message: "Dados inválidos.",
        error: parsedBody.error.issues[0]?.message ?? "Payload inválido."
      });
    }

    const { name, email, whatsapp_phone, password, confirm_password } = parsedBody.data;

    if (confirm_password !== password) {
      return reply.code(400).send({
        success: false,
        data: null,
        message: "As senhas não coincidem.",
        error: "As senhas não coincidem."
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingEmail = await sql<{ id: string }[]>`
      SELECT id FROM users WHERE email = ${normalizedEmail} LIMIT 1
    `;
    if (existingEmail.length > 0) {
      return reply.code(409).send({
        success: false,
        data: null,
        message: "Este email já está cadastrado.",
        error: "Este email já está cadastrado."
      });
    }

    const existingPhone = await sql<{ id: string }[]>`
      SELECT id FROM users WHERE whatsapp_phone = ${whatsapp_phone} LIMIT 1
    `;
    if (existingPhone.length > 0) {
      return reply.code(409).send({
        success: false,
        data: null,
        message: "Este número de WhatsApp já está cadastrado.",
        error: "Este número de WhatsApp já está cadastrado."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUsers = await sql<{ id: string }[]>`
      INSERT INTO users (name, email, password, whatsapp_phone, email_verified, active, role)
      VALUES (
        ${name.trim()},
        ${normalizedEmail},
        ${passwordHash},
        ${whatsapp_phone},
        false,
        true,
        'user'
      )
      RETURNING id
    `;
    const userId = newUsers[0]?.id;

    const code = generateOTP();

    await sql`
      INSERT INTO email_verification_codes (user_id, email, code, type)
      VALUES (${userId}, ${normalizedEmail}, ${code}, 'signup')
    `;

    await sendVerificationCode(normalizedEmail, name.trim(), code, "signup");

    void createInstanceForUser(userId, name.trim()).catch((err) => {
      console.error("[SIGNUP] Falha ao criar instância WhatsApp:", err);
    });

    return reply.code(201).send({
      success: true,
      data: { email: normalizedEmail },
      message: "Conta criada! Verifique seu email para ativar.",
      error: null
    });
  });

  app.post("/verify-email", async (request, reply) => {
    const parsedBody = verifyEmailSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.code(400).send({
        success: false,
        data: null,
        message: "Dados inválidos.",
        error: parsedBody.error.issues[0]?.message ?? "Payload inválido."
      });
    }

    const normalizedEmail = normalizeEmail(parsedBody.data.email);
    const { code } = parsedBody.data;

    const rows = await sql<{ id: string; code: string }[]>`
      SELECT id, code FROM email_verification_codes
      WHERE email = ${normalizedEmail}
        AND type = 'signup'
        AND used = false
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) {
      return reply.code(400).send({
        success: false,
        data: null,
        message: "Código inválido ou expirado.",
        error: "Código inválido ou expirado."
      });
    }

    if (rows[0].code !== code) {
      return reply.code(400).send({
        success: false,
        data: null,
        message: "Código incorreto.",
        error: "Código incorreto."
      });
    }

    await sql`
      UPDATE email_verification_codes SET used = true WHERE id = ${rows[0].id}
    `;

    await sql`
      UPDATE users SET email_verified = true WHERE email = ${normalizedEmail}
    `;

    return reply.code(200).send({
      success: true,
      data: null,
      message: "Email verificado com sucesso.",
      error: null
    });
  });

  app.post("/resend-code", async (request, reply) => {
    const parsedBody = resendCodeSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.code(400).send({
        success: false,
        data: null,
        message: "Dados inválidos.",
        error: parsedBody.error.issues[0]?.message ?? "Payload inválido."
      });
    }

    const normalizedEmail = normalizeEmail(parsedBody.data.email);
    const { type } = parsedBody.data;

    const users = await sql<{ id: string; name: string }[]>`
      SELECT id, name FROM users WHERE email = ${normalizedEmail} LIMIT 1
    `;

    if (users.length === 0) {
      return reply.code(200).send({
        success: true,
        data: null,
        message: "Se o email existir, um novo código foi enviado.",
        error: null
      });
    }

    const user = users[0];

    await sql`
      UPDATE email_verification_codes
      SET used = true
      WHERE email = ${normalizedEmail}
        AND type = ${type}
        AND used = false
    `;

    const code = generateOTP();

    await sql`
      INSERT INTO email_verification_codes (user_id, email, code, type)
      VALUES (${user.id}, ${normalizedEmail}, ${code}, ${type})
    `;

    await sendVerificationCode(normalizedEmail, user.name, code, type);

    return reply.code(200).send({
      success: true,
      data: null,
      message: "Novo código enviado para seu email.",
      error: null
    });
  });

  app.post("/forgot-password", async (request, reply) => {
    const parsedBody = forgotPasswordSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.code(400).send({
        success: false,
        data: null,
        message: "Dados inválidos.",
        error: parsedBody.error.issues[0]?.message ?? "Payload inválido."
      });
    }

    const normalizedEmail = normalizeEmail(parsedBody.data.email);

    const users = await sql<{ id: string; name: string }[]>`
      SELECT id, name FROM users WHERE email = ${normalizedEmail} LIMIT 1
    `;

    if (users.length > 0) {
      const user = users[0];
      const code = generateOTP();

      await sql`
        INSERT INTO email_verification_codes (user_id, email, code, type)
        VALUES (${user.id}, ${normalizedEmail}, ${code}, 'reset_password')
      `;

      await sendVerificationCode(normalizedEmail, user.name, code, "reset_password");
    }

    return reply.code(200).send({
      success: true,
      data: null,
      message: "Se o email existir, um código foi enviado.",
      error: null
    });
  });

  app.post("/reset-password", async (request, reply) => {
    const parsedBody = resetPasswordSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.code(400).send({
        success: false,
        data: null,
        message: "Dados inválidos.",
        error: parsedBody.error.issues[0]?.message ?? "Payload inválido."
      });
    }

    const { new_password, confirm_password, code } = parsedBody.data;
    const normalizedEmail = normalizeEmail(parsedBody.data.email);

    if (confirm_password !== new_password) {
      return reply.code(400).send({
        success: false,
        data: null,
        message: "As senhas não coincidem.",
        error: "As senhas não coincidem."
      });
    }

    const rows = await sql<{ id: string; code: string }[]>`
      SELECT id, code FROM email_verification_codes
      WHERE email = ${normalizedEmail}
        AND type = 'reset_password'
        AND used = false
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) {
      return reply.code(400).send({
        success: false,
        data: null,
        message: "Código inválido ou expirado.",
        error: "Código inválido ou expirado."
      });
    }

    if (rows[0].code !== code) {
      return reply.code(400).send({
        success: false,
        data: null,
        message: "Código incorreto.",
        error: "Código incorreto."
      });
    }

    const passwordHash = await bcrypt.hash(new_password, 12);

    await sql`
      UPDATE users SET password = ${passwordHash} WHERE email = ${normalizedEmail}
    `;

    await sql`
      UPDATE email_verification_codes SET used = true WHERE id = ${rows[0].id}
    `;

    return reply.code(200).send({
      success: true,
      data: null,
      message: "Senha redefinida com sucesso.",
      error: null
    });
  });
};

function sendAuthError(reply: FastifyReply, error: unknown) {
  if (error instanceof AuthServiceError) {
    return reply.code(error.statusCode).send({
      success: false,
      data: null,
      message: "Erro de autenticação.",
      error: error.message
    });
  }

  throw error;
}
