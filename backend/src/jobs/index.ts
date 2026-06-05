import { dispatchPendingReminders } from "./reminder-dispatcher";

export function startJobs() {
  console.log("[JOBS] Reminder dispatcher iniciado");

  setInterval(async () => {
    try {
      await dispatchPendingReminders();
    } catch (error) {
      console.error("[JOBS] Erro no dispatcher:", error);
    }
  }, 60_000);
}
