import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { findPublicUserById } from "../services/auth.service";
import type { JwtPayload } from "../types/auth";

const unauthorizedResponse = {
  success: false,
  data: null,
  message: "Não autorizado.",
  error: "Token ausente ou inválido."
};

const jwtPayloadSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["admin", "user"])
});

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return reply.code(401).send(unauthorizedResponse);
  }

  try {
    const token = authorization.slice("Bearer ".length).trim();
    const payload = request.server.jwt.verify<JwtPayload>(token);
    const parsedPayload = jwtPayloadSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return reply.code(401).send(unauthorizedResponse);
    }

    const user = await findPublicUserById(parsedPayload.data.id);

    if (!user) {
      return reply.code(401).send(unauthorizedResponse);
    }

    request.user = user;
  } catch {
    return reply.code(401).send(unauthorizedResponse);
  }
}
