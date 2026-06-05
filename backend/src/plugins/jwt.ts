import fastifyJwt from "@fastify/jwt";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { env } from "../config/env";

const jwtPluginHandler: FastifyPluginAsync = async (app) => {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET
  });
};

export const jwtPlugin = fp(jwtPluginHandler, {
  name: "taskflow-jwt"
});
