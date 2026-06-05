import Fastify from "fastify";
import type { FastifyError } from "fastify";
import { env } from "./config/env";
import { startJobs } from "./jobs";
import { corsPlugin } from "./plugins/cors";
import { jwtPlugin } from "./plugins/jwt";
import { routes } from "./routes";
import { webhookRoutes } from "./routes/webhook";

export function buildServer() {
  const app = Fastify({
    logger: true
  });

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    app.log.error(error);

    const statusCode = error.statusCode ?? 500;

    return reply.code(statusCode).send({
      success: false,
      data: null,
      message:
        statusCode >= 500
          ? "Erro interno do servidor."
          : "Erro ao processar a requisicao.",
      error: {
        code: error.code ?? "INTERNAL_SERVER_ERROR",
        detail: error.message
      }
    });
  });

  app.register(corsPlugin);
  app.register(jwtPlugin);
  app.register(webhookRoutes, { prefix: "/webhook" });
  app.register(routes, { prefix: "/api/v1" });

  return app;
}

async function start() {
  const app = buildServer();

  try {
    await app.listen({
      port: env.PORT,
      host: "0.0.0.0"
    });
    startJobs();
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
