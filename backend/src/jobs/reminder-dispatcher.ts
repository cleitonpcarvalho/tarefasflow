import { sql } from "../config/db";
import { getFirstActiveAuthorizedNumberForUser } from "../services/authorized-number.service";
import {
  sendTextMessage,
  type EvolutionConnectionState
} from "../services/evolution.service";

interface PendingReminderRow {
  id: string;
  task_id: string;
  user_id: string;
  minutes_before: number;
  scheduled_for: Date | string | null;
  title: string;
  task_date: Date | string;
  task_time: string | null;
  user_name: string;
  instance_name: string | null;
  instance_status: EvolutionConnectionState | null;
  phone_number: string | null;
}

export async function dispatchPendingReminders(): Promise<void> {
  const reminders = await sql<PendingReminderRow[]>`
    SELECT r.id, r.task_id, r.user_id, r.minutes_before, r.scheduled_for,
      t.title, t.task_date, t.task_time, u.name AS user_name,
      wi.instance_name, wi.status AS instance_status, wi.phone_number
    FROM reminders r
    JOIN tasks t ON t.id = r.task_id
    JOIN users u ON u.id = r.user_id
    LEFT JOIN whatsapp_instances wi ON wi.user_id = u.id
    WHERE r.pending_send = true
      AND r.sent_at IS NULL
    ORDER BY r.scheduled_for ASC NULLS LAST
    LIMIT 50
  `;

  for (const reminder of reminders) {
    await dispatchReminder(reminder);
  }
}

async function dispatchReminder(reminder: PendingReminderRow) {
  try {
    if (!reminder.instance_name || reminder.instance_status !== "open") {
      console.warn(
        `Instancia indisponivel para lembrete: ${reminder.title}`
      );
      await markReminderSent(reminder.id);
      return;
    }

    const authorizedNumber = await getFirstActiveAuthorizedNumberForUser(
      reminder.user_id
    );
    const phone = authorizedNumber?.phone ?? reminder.phone_number;

    if (!phone) {
      console.warn(`Nenhum numero disponivel para lembrete: ${reminder.title}`);
      await markReminderSent(reminder.id);
      return;
    }

    const delivery = await sendTextMessage(
      reminder.instance_name,
      phone,
      buildReminderMessage(reminder)
    );

    if (delivery.delivered) {
      await markReminderSent(reminder.id);
      return;
    }

    console.error(`Erro ao enviar lembrete: ${reminder.title}`, delivery);
  } catch (error) {
    console.error("Erro ao processar lembrete pendente:", error);
  }
}

async function markReminderSent(reminderId: string) {
  await sql`
    UPDATE reminders
    SET sent_at = NOW(), pending_send = false
    WHERE id = ${reminderId}
  `;
}

function buildReminderMessage(reminder: PendingReminderRow) {
  return [
    `Lembrete TarefasFlow: ${reminder.title}`,
    `Data: ${formatDate(reminder.task_date)} as ${formatTime(reminder.task_time)}`,
    `${reminder.minutes_before} min antes do compromisso.`
  ].join("\n");
}

function formatDate(value: Date | string) {
  const dateKey = value instanceof Date ? value.toISOString().slice(0, 10) : value;
  const [year, month, day] = dateKey.split("-");

  if (!year || !month || !day) {
    return dateKey;
  }

  return `${day}/${month}`;
}

function formatTime(value: string | null) {
  return (value ?? "08:00:00").slice(0, 5);
}
