import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationCode(
  email: string,
  name: string,
  code: string,
  type: "signup" | "reset_password"
): Promise<void> {
  const subject =
    type === "signup"
      ? "Ative sua conta TarefasFlow"
      : "Redefinir senha TarefasFlow";

  const { error } = await resend.emails.send({
    from: "noreply@tarefasflow.com.br",
    to: email,
    subject,
    html: buildEmailHtml(name, code, type)
  });

  if (error) {
    console.error("[EMAIL] Falha ao enviar email de verificação:", error);
    throw new Error("Falha ao enviar email de verificação.");
  }
}

function buildEmailHtml(
  name: string,
  code: string,
  type: "signup" | "reset_password"
): string {
  const title =
    type === "signup"
      ? "Bem-vindo ao TarefasFlow! 🎉"
      : "Redefinir sua senha 🔐";

  const intro =
    type === "signup"
      ? `Olá, ${name}! Para ativar sua conta, use o código abaixo:`
      : `Olá, ${name}! Use o código abaixo para redefinir sua senha:`;

  const disclaimer =
    type === "signup"
      ? "Se você não criou uma conta no TarefasFlow, ignore este email."
      : "Se você não solicitou a redefinição de senha, ignore este email.";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F7FF;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:24px 16px">
    <div style="background:linear-gradient(135deg,#534AB7,#7C6FD4);border-radius:16px 16px 0 0;padding:32px 24px;text-align:center">
      <img src="https://app.tarefasflow.com.br/logo-dark.png" width="160" alt="TarefasFlow" style="display:inline-block;max-width:100%;height:auto">
    </div>
    <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:32px 24px;border:1px solid #E5E7EB;border-top:none">
      <h1 style="margin:0 0 12px 0;font-size:22px;color:#1A1A2E;font-weight:700;line-height:1.3">${title}</h1>
      <p style="margin:0;color:#6B7280;font-size:15px;line-height:1.6">${intro}</p>
      <div style="background:#F0EFFE;border-radius:12px;padding:20px 32px;text-align:center;margin:24px 0">
        <span style="font-size:40px;font-weight:700;letter-spacing:10px;color:#534AB7;font-family:monospace,monospace">${code}</span>
      </div>
      <p style="margin:0;font-size:13px;color:#9CA3AF">⏱ Este código expira em 15 minutos.</p>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0">
      <p style="margin:0;font-size:12px;color:#9CA3AF">${disclaimer}</p>
    </div>
    <div style="text-align:center;padding:16px 0">
      <p style="margin:0;font-size:12px;color:#9CA3AF">© 2026 TarefasFlow · tarefasflow.com.br</p>
    </div>
  </div>
</body>
</html>`;
}
