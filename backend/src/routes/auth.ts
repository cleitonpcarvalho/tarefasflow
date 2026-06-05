import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { z } from "zod";
import { authenticate } from "../middlewares/authenticate";
import {
  AuthServiceError,
  findPublicUserById,
  loginUser,
  registerUser
} from "../services/auth.service";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres."),
  email: z.string().trim().email("Email inválido."),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres.")
});

const loginSchema = z.object({
  email: z.string().trim().email("Email inválido."),
  password: z.string().min(1, "Senha é obrigatória.")
});

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
