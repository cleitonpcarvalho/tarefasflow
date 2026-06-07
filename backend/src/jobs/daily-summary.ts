import { sql } from "../config/db";
import { getFirstActiveAuthorizedNumberForUser } from "../services/authorized-number.service";
import { sendTextMessage } from "../services/evolution.service";

interface DailySummaryUserRow {
  id: string;
  name: string;
  daily_summary_time: string;
  instance_name: string;
  status: string;
  phone_number: string | null;
}

interface TaskRow {
  title: string;
  task_time: string | null;
}

export async function sendDailySummaries(): Promise<void> {
  const agora = new Date().toLocaleTimeString("pt-BR", {
    timeZone: "America/Fortaleza",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const users = await sql<DailySummaryUserRow[]>`
    SELECT u.id, u.name, u.daily_summary_time,
           wi.instance_name, wi.status, wi.phone_number
    FROM users u
    JOIN whatsapp_instances wi ON wi.user_id = u.id
    WHERE u.daily_summary_enabled = true
      AND u.daily_summary_time = ${agora}
      AND wi.status = 'open'
  `;

  for (const user of users) {
    try {
      await dispatchSummaryForUser(user);
    } catch (error) {
      console.error(`[DAILY-SUMMARY] Erro ao processar usuario ${user.id}:`, error);
    }
  }
}

async function dispatchSummaryForUser(user: DailySummaryUserRow): Promise<void> {
  const tasks = await sql<TaskRow[]>`
    SELECT title, task_time FROM tasks
    WHERE user_id = ${user.id}
      AND task_date = CURRENT_DATE
      AND done = false
    ORDER BY task_time ASC NULLS LAST
  `;

  const authorizedNumber = await getFirstActiveAuthorizedNumberForUser(user.id);
  const phone = authorizedNumber?.phone ?? user.phone_number;

  if (!phone) {
    console.warn(`[DAILY-SUMMARY] Nenhum numero disponivel para ${user.name}`);
    return;
  }

  const msg = buildSummaryMessage(user.name, tasks);
  const delivery = await sendTextMessage(user.instance_name, phone, msg);

  if (delivery.delivered) {
    console.log(`[DAILY-SUMMARY] Resumo enviado para ${user.name}`);
  } else {
    console.error(`[DAILY-SUMMARY] Falha ao enviar resumo para ${user.name}`, delivery);
  }
}

function buildSummaryMessage(name: string, tasks: TaskRow[]): string {
  const hoje = new Date().toLocaleDateString("pt-BR", {
    timeZone: "America/Fortaleza",
    day: "2-digit",
    month: "2-digit"
  });

  if (tasks.length === 0) {
    return `🌅 Bom dia, ${name}!\n\n✨ Você não tem tarefas agendadas para hoje.\nAproveite o dia! 😊`;
  }

  const linhas = tasks
    .map((task) => {
      const horario = task.task_time ? task.task_time.slice(0, 5) : null;

      return horario ? `🕐 ${horario} — ${task.title}` : `📌 ${task.title}`;
    })
    .join("\n");

  return `🌅 Bom dia, ${name}!\n\n📋 Suas tarefas de hoje (${hoje}):\n\n${linhas}\n\nTenha um ótimo dia! 💪`;
}
