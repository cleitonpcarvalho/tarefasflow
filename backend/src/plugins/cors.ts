import cors from "@fastify/cors";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const corsPluginHandler: FastifyPluginAsync = async (app) => {
  await app.register(cors, {
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true
  });
};

export const corsPlugin = fp(corsPluginHandler, {
  name: "taskflow-cors"
});
