import { sql } from "../config/db";
import { sendTextMessage } from "../services/evolution.service";

type FollowupDay = 0 | 1 | 3 | 7 | 12;

interface AdminInstanceRow {
  instance_name: string | null;
  status: string | null;
}

interface FollowupUserRow {
  id: string;
  name: string;
  whatsapp_phone: string;
}

const SEQUENCE: Array<{ day: FollowupDay; key: FollowupDay }> = [
  { day: 0, key: 0 },
  { day: 1, key: 1 },
  { day: 3, key: 3 },
  { day: 7, key: 7 },
  { day: 12, key: 12 }
];

export async function dispatchOnboardingFollowup(): Promise<void> {
  const now = new Date().toLocaleTimeString("pt-BR", {
    timeZone: "America/Fortaleza",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  if (!isWithinFollowupWindow(now)) {
    return;
  }

  const adminRows = await sql<AdminInstanceRow[]>`
    SELECT wi.instance_name, wi.status
    FROM users u
    LEFT JOIN whatsapp_instances wi ON wi.user_id = u.id
    WHERE u.role = 'admin'
    ORDER BY u.created_at ASC
    LIMIT 1
  `;
  const adminInstance = adminRows[0];

  if (!adminInstance?.instance_name || adminInstance.status !== "open") {
    return;
  }

  for (const step of SEQUENCE) {
    const users = await sql<FollowupUserRow[]>`
      SELECT u.id, u.name, u.whatsapp_phone
      FROM users u
      LEFT JOIN whatsapp_instances wi ON wi.user_id = u.id
      WHERE u.role = 'user'
        AND u.active = true
        AND u.whatsapp_phone IS NOT NULL
        AND (wi.status IS NULL OR wi.status != 'open')
        AND u.created_at <= NOW() - ${step.day} * INTERVAL '1 day'
        AND u.id NOT IN (
          SELECT user_id
          FROM onboarding_followup_logs
          WHERE day_sequence = ${step.key}
        )
    `;

    for (const user of users) {
      await sendFollowup(adminInstance.instance_name, user, step.key);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

async function sendFollowup(
  instanceName: string,
  user: FollowupUserRow,
  day: FollowupDay
) {
  try {
    const delivery = await sendTextMessage(
      instanceName,
      user.whatsapp_phone,
      buildFollowupMessage(day, user.name)
    );

    await sql`
      INSERT INTO onboarding_followup_logs (user_id, day_sequence)
      VALUES (${user.id}, ${day})
    `;

    console.log(
      `[followup] dia ${day} → ${user.whatsapp_phone} → ${
        delivery.delivered ? "ok" : "erro"
      }`
    );
  } catch (error) {
    console.error(
      `[followup] dia ${day} → ${user.whatsapp_phone} → erro`,
      error
    );
  }
}

function buildFollowupMessage(day: FollowupDay, name: string) {
  switch (day) {
    case 0:
      return [
        `Olá, ${name}! 👋 Bem-vindo ao TarefasFlow. Você está a um passo de ter`,
        "um assistente pessoal que organiza sua rotina direto no WhatsApp.",
        "Para ativar, é só escanear o QR Code aqui:",
        "https://app.tarefasflow.com.br/onboarding — leva menos de 2 minutos. 🚀"
      ].join("\n");
    case 1:
      return [
        `Oi, ${name}! Vi que você ainda não conectou seu WhatsApp ao TarefasFlow.`,
        "Sem isso, você não recebe lembretes nem consegue criar tarefas por aqui.",
        "Ainda dá tempo de aproveitar seu período grátis completo:",
        "https://app.tarefasflow.com.br/onboarding"
      ].join("\n");
    case 3:
      return [
        `${name}, enquanto você ainda não ativou, outros usuários já estão`,
        "recebendo lembretes automáticos, criando tarefas por voz e nunca mais",
        "esquecendo compromissos. Seu período gratuito está rodando.",
        "Ativa agora e aproveita: https://app.tarefasflow.com.br/onboarding ✅"
      ].join("\n");
    case 7:
      return [
        `Metade do seu período gratuito já passou, ${name}. Se você ativar hoje,`,
        "ainda tem 7 dias para testar tudo sem pagar nada. Depois disso, quem",
        "não testou acaba não sentindo a diferença — e a gente não quer que isso",
        "aconteça com você. É rápido: https://app.tarefasflow.com.br/onboarding"
      ].join("\n");
    case 12:
      return [
        `${name}, faltam só 2 dias para encerrar seu período gratuito e você`,
        "ainda não experimentou o TarefasFlow de verdade. Não faz sentido deixar",
        "passar. Conecta agora, testa esses 2 dias, e aí você decide.",
        "https://app.tarefasflow.com.br/onboarding — qualquer dúvida, é só responder aqui. 👊"
      ].join("\n");
  }
}

function isWithinFollowupWindow(time: string): boolean {
  return (
    (time >= "11:00" && time <= "13:00") ||
    (time >= "18:00" && time <= "20:00")
  );
}
