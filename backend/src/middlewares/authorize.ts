import type { FastifyReply, FastifyRequest } from "fastify";
import type { UserRole } from "../types/auth";

export function authorize(role: UserRole) {
  return async function authorizeRole(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    if (request.user?.role !== role) {
      return reply.code(403).send({
        success: false,
        data: null,
        message: "Acesso negado.",
        error: "Acesso negado"
      });
    }
  };
}

export const authorizeAdmin = authorize("admin");
