import { sendDailySummaries } from "./daily-summary";
import { dispatchOnboardingFollowup } from "./onboarding-followup";
import { dispatchPendingReminders } from "./reminder-dispatcher";
import { dispatchSpecialDateNotifications } from "./special-dates-dispatcher";

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

  console.log("[JOBS] Special dates dispatcher iniciado");

  setInterval(async () => {
    try {
      await dispatchSpecialDateNotifications();
    } catch (err) {
      console.error("[JOBS] Erro no special dates:", err);
    }
  }, 60_000);

  console.log("[JOBS] Onboarding follow-up iniciado");

  setInterval(async () => {
    try {
      await dispatchOnboardingFollowup();
    } catch (error) {
      console.error("[JOBS] Erro no onboarding follow-up:", error);
    }
  }, 60_000);
}
