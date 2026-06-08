import type { FastifyPluginAsync } from "fastify";
import { authRoutes } from "./auth";
import { authorizedNumbersRoutes } from "./authorized-numbers";
import { remindersRoutes } from "./reminders";
import { specialDatesRoutes } from "./special-dates";
import { tasksRoutes } from "./tasks";
import { profileRoutes, usersRoutes } from "./users";
import { whatsappRoutes } from "./whatsapp";

export const routes: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => ({
    success: true,
    data: { status: "ok" },
    message: "TarefasFlow API online.",
    error: null
  }));

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(tasksRoutes, { prefix: "/tasks" });
  await app.register(remindersRoutes, { prefix: "/reminders" });
  await app.register(specialDatesRoutes, { prefix: "/special-dates" });
  await app.register(profileRoutes, { prefix: "/profile" });
  await app.register(whatsappRoutes, { prefix: "/whatsapp" });
  await app.register(authorizedNumbersRoutes, {
    prefix: "/whatsapp/instances/:instanceName/numbers"
  });
  await app.register(usersRoutes, { prefix: "/admin/users" });
};
