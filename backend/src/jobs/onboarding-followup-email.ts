import { Resend } from "resend";
import { sql } from "../config/db";

type FollowupDay = 0 | 1 | 3 | 7 | 12;
type EmailFollowupKey = 100 | 101 | 103 | 107 | 112;

interface FollowupUserRow {
  id: string;
  name: string;
  email: string;
}

interface FollowupEmailContent {
  subject: string;
  body: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);
const BUTTON_TEXT = "Ativar meu agente agora";
const BUTTON_URL = "https://app.tarefasflow.com.br/onboarding";

const SEQUENCE: Array<{ day: FollowupDay; key: EmailFollowupKey }> = [
  { day: 0, key: 100 },
  { day: 1, key: 101 },
  { day: 3, key: 103 },
  { day: 7, key: 107 },
  { day: 12, key: 112 }
];

export async function dispatchOnboardingFollowupEmail(): Promise<void> {
  const now = new Date().toLocaleTimeString("pt-BR", {
    timeZone: "America/Fortaleza",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  if (!isWithinEmailFollowupWindow(now)) {
    return;
  }

  for (const step of SEQUENCE) {
    const users = await sql<FollowupUserRow[]>`
      SELECT u.id, u.name, u.email
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
      await sendFollowupEmail(user, step.day, step.key);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

async function sendFollowupEmail(
  user: FollowupUserRow,
  day: FollowupDay,
  key: EmailFollowupKey
): Promise<void> {
  try {
    const content = buildFollowupEmailContent(day, user.name);
    const { error } = await resend.emails.send({
      from: "noreply@tarefasflow.com.br",
      to: user.email,
      subject: content.subject,
      html: buildFollowupEmailHtml(
        user.name,
        content.body,
        BUTTON_TEXT,
        BUTTON_URL
      )
    });

    if (error) {
      console.error(`[followup-email] dia ${day} → ${user.email} → erro`, error);
      return;
    }

    await sql`
      INSERT INTO onboarding_followup_logs (user_id, day_sequence)
      VALUES (${user.id}, ${key})
    `;

    console.log(`[followup-email] dia ${day} → ${user.email} → ok`);
  } catch (error) {
    console.error(`[followup-email] dia ${day} → ${user.email} → erro`, error);
  }
}

function buildFollowupEmailContent(
  day: FollowupDay,
  name: string
): FollowupEmailContent {
  switch (day) {
    case 0:
      return {
        subject: "Sua conta TarefasFlow está pronta",
        body: [
          `Olá, ${name}! Sua conta foi criada com sucesso.`,
          "Agora falta só um passo: conectar seu agente pessoal no WhatsApp.",
          "É ele quem vai te lembrar de compromissos, criar tarefas por voz",
          "e organizar sua rotina automaticamente.",
          "Configure agora em menos de 2 minutos."
        ].join("\n")
      };
    case 1:
      return {
        subject: "Você ainda não ativou seu agente",
        body: [
          `Olá, ${name}! Notamos que você ainda não conectou`,
          "seu WhatsApp ao TarefasFlow. Enquanto isso, você está",
          "gerenciando sua agenda do jeito antigo. Seu agente pessoal",
          "já está pronto e esperando por você. Ative agora."
        ].join("\n")
      };
    case 3:
      return {
        subject: "Outros usuários já estão usando. E você?",
        body: [
          `Olá, ${name}! Usuários que ativaram o TarefasFlow`,
          "relatam nunca mais esquecer compromissos importantes.",
          "Seu período gratuito está correndo. Aproveite agora",
          "antes que ele acabe sem você ter experimentado de verdade."
        ].join("\n")
      };
    case 7:
      return {
        subject: "Metade do seu período grátis acabou",
        body: [
          `Olá, ${name}! Você já usou metade do seu período`,
          "gratuito sem ativar seu agente. Ainda dá tempo de testar",
          "tudo. Conecte seu WhatsApp hoje e aproveite os 7 dias",
          "restantes com o TarefasFlow funcionando de verdade."
        ].join("\n")
      };
    case 12:
      return {
        subject: "Últimos 2 dias do seu período grátis",
        body: [
          `Olá, ${name}! Seu período gratuito encerra em 2 dias.`,
          "Você ainda não testou o TarefasFlow de verdade. Conecte",
          "agora, use esses 2 dias, e depois decide se quer continuar.",
          "Não faz sentido deixar passar sem experimentar."
        ].join("\n")
      };
  }
}

function buildFollowupEmailHtml(
  name: string,
  bodyText: string,
  buttonText: string,
  buttonUrl: string
): string {
  const safeName = escapeHtml(name);
  const bodyHtml = bodyText
    .split("\n")
    .map((line) => escapeHtml(line))
    .join("<br>");
  const safeButtonText = escapeHtml(buttonText);
  const safeButtonUrl = escapeHtml(buttonUrl);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${safeName}, ative seu agente TarefasFlow</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F7FF;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:24px 16px">
    <div style="background:linear-gradient(135deg,#534AB7,#7C6FD4);border-radius:16px 16px 0 0;padding:32px 24px;text-align:center">
      <img src="https://app.tarefasflow.com.br/logo-dark.png" width="160" alt="TarefasFlow" style="display:inline-block;max-width:100%;height:auto">
    </div>
    <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:32px 24px;border:1px solid #E5E7EB;border-top:none">
      <h1 style="margin:0 0 12px 0;font-size:22px;color:#1A1A2E;font-weight:700;line-height:1.3">Ative seu agente TarefasFlow</h1>
      <p style="margin:0;color:#6B7280;font-size:15px;line-height:1.6">${bodyHtml}</p>
      <div style="text-align:center;margin:28px 0 4px">
        <a href="${safeButtonUrl}" style="display:inline-block;background:#534AB7;color:#ffffff;text-decoration:none;border-radius:12px;padding:14px 22px;font-size:15px;font-weight:700">${safeButtonText}</a>
      </div>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0">
      <p style="margin:0;font-size:12px;color:#9CA3AF">Se você já conectou seu WhatsApp, pode ignorar este email.</p>
    </div>
    <div style="text-align:center;padding:16px 0">
      <p style="margin:0;font-size:12px;color:#9CA3AF">© 2026 TarefasFlow · tarefasflow.com.br</p>
    </div>
  </div>
</body>
</html>`;
}

function isWithinEmailFollowupWindow(time: string): boolean {
  return (
    (time >= "08:00" && time <= "11:00") ||
    (time >= "13:00" && time <= "18:00")
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
