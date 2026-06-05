import "@fastify/jwt";
import type { JwtPayload, PublicUser } from "./auth";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: PublicUser;
  }
}
