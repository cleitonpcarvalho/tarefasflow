import { sql } from "../config/db";
import { getFirstActiveAuthorizedNumberForUser } from "../services/authorized-number.service";
import { sendTextMessage } from "../services/evolution.service";

interface SpecialDateRow {
  id: string;
  user_id: string;
  name: string;
  month: number;
  day: number;
  user_name: string;
  instance_name: string | null;
  instance_status: string | null;
  phone_number: string | null;
}

type NotifyField =
  | "notify_on_day"
  | "notify_1_day_before"
  | "notify_1_week_before"
  | "notify_1_month_before";

type IntervalType = "today" | "tomorrow" | "week" | "month";

export async function dispatchSpecialDateNotifications(): Promise<void> {
  const now = new Date().toLocaleTimeString("pt-BR", {
    timeZone: "America/Fortaleza",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  if (now !== "08:00") {
    return;
  }

  const today = getFortalezaDateOffset(0);
  const tomorrow = getFortalezaDateOffset(1);
  const nextWeek = getFortalezaDateOffset(7);
  const nextMonth = getFortalezaDateOffset(30);

  await processInterval("notify_on_day", today.day, today.month, "today");
  await processInterval("notify_1_day_before", tomorrow.day, tomorrow.month, "tomorrow");
  await processInterval("notify_1_week_before", nextWeek.day, nextWeek.month, "week");
  await processInterval("notify_1_month_before", nextMonth.day, nextMonth.month, "month");
}

async function processInterval(
  notifyField: NotifyField,
  targetDay: number,
  targetMonth: number,
  intervalType: IntervalType
): Promise<void> {
  const rows = await sql<SpecialDateRow[]>`
    SELECT sd.id, sd.user_id, sd.name, sd.month, sd.day,
           u.name AS user_name,
           wi.instance_name, wi.status AS instance_status, wi.phone_number
    FROM special_dates sd
    JOIN users u ON u.id = sd.user_id
    LEFT JOIN whatsapp_instances wi ON wi.user_id = sd.user_id
    WHERE sd.active = true
      AND ${sql(notifyField)} = true
      AND sd.month = ${targetMonth}
      AND sd.day = ${targetDay}
      AND wi.status = 'open'
  `;

  for (const row of rows) {
    try {
      await sendNotification(row, intervalType);
    } catch (error) {
      console.error(
        `[SPECIAL-DATES] Erro ao enviar notificacao para ${row.name}:`,
        error
      );
    }
  }
}

async function sendNotification(
  row: SpecialDateRow,
  intervalType: IntervalType
): Promise<void> {
  const authorizedNumber = await getFirstActiveAuthorizedNumberForUser(
    row.user_id
  );
  const phone = authorizedNumber?.phone ?? row.phone_number;

  if (!phone || !row.instance_name) {
    console.warn(
      `[SPECIAL-DATES] Nenhum numero disponivel para ${row.user_name}`
    );
    return;
  }

  const message = buildMessage(row, intervalType);
  const delivery = await sendTextMessage(row.instance_name, phone, message);

  if (!delivery.delivered) {
    console.error(
      `[SPECIAL-DATES] Falha ao enviar notificacao para ${row.user_name}`,
      delivery
    );
  }
}

function buildMessage(row: SpecialDateRow, intervalType: IntervalType): string {
  const dayMonth = `${String(row.day).padStart(2, "0")}/${String(row.month).padStart(2, "0")}`;

  switch (intervalType) {
    case "today":
      return [
        `🎉 *${row.name}*`,
        ``,
        `Olá, ${row.user_name}! Hoje é um dia especial:`,
        ``,
        `🗓️ *${row.name}*`,
        ``,
        `Não esqueça de comemorar! 🥳`
      ].join("\n");

    case "tomorrow":
      return [
        `⏰ *Lembrete TarefasFlow*`,
        ``,
        `Olá, ${row.user_name}! Amanhã é um dia especial:`,
        ``,
        `🗓️ *${row.name}* — amanhã, ${dayMonth}`,
        ``,
        `Prepare-se! 😊`
      ].join("\n");

    case "week":
      return [
        `📅 *Lembrete TarefasFlow*`,
        ``,
        `Olá, ${row.user_name}! Em 1 semana é um dia especial:`,
        ``,
        `🗓️ *${row.name}* — ${dayMonth}`,
        ``,
        `Ainda dá tempo de se preparar! 🎁`
      ].join("\n");

    case "month":
      return [
        `📆 *Lembrete TarefasFlow*`,
        ``,
        `Olá, ${row.user_name}! Em 1 mês é um dia especial:`,
        ``,
        `🗓️ *${row.name}* — ${dayMonth}`,
        ``,
        `Anote na agenda! 😉`
      ].join("\n");
  }
}

function getFortalezaDateOffset(offsetDays: number): {
  day: number;
  month: number;
} {
  // Obtém a data atual em Fortaleza (YYYY-MM-DD) e aplica o offset em dias locais
  const fortalezaStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Fortaleza"
  });
  const [year, month, day] = fortalezaStr.split("-").map(Number);
  const date = new Date(year, month - 1, day + offsetDays);
  return { day: date.getDate(), month: date.getMonth() + 1 };
}
