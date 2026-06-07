import { sendDailySummaries } from "./daily-summary";
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

  console.log("[JOBS] Daily summary job iniciado");

  setInterval(async () => {
    try {
      await sendDailySummaries();
    } catch (err) {
      console.error("[JOBS] Erro no resumo diario:", err);
    }
  }, 60_000);
}
