/**
 * Serviço de Envio de E-mails Transacionais via Resend (https://resend.com)
 * Mr.Crazy - Inglês sem Frescura
 */

export interface SendVerificationEmailParams {
  email: string;
  nickname?: string;
  code: string;
  verifyUrl: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

export function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY?.trim();
}

export function getResendFromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Mr.Crazy <onboarding@resend.dev>"
  );
}

/**
 * Envia o e-mail contendo o código de 6 dígitos e link de validação para ativação da conta.
 */
export async function sendVerificationEmail({
  email,
  nickname,
  code,
  verifyUrl
}: SendVerificationEmailParams): Promise<EmailResult> {
  const apiKey = getResendApiKey();
  const fromEmail = getResendFromEmail();
  const displayName = nickname?.trim() || "Aluno";

  // Se a chave não estiver configurada no ambiente, loga em modo simulado para não travar fluxos locais ou testes
  if (!apiKey) {
    console.warn(
      `[Resend Dev/Simulated] RESEND_API_KEY não definida no ambiente. Código para ${email}: [${code}] | Link: ${verifyUrl}`
    );
    return {
      success: true,
      simulated: true,
      messageId: `simulated-${Date.now()}`
    };
  }

  const subject = `🔥 Seu código de acesso ao Mr.Crazy: ${code}`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #08090d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #08090d; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #11141d; border: 1px solid #1e2433; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- HEADER -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; background: linear-gradient(180deg, rgba(245, 158, 11, 0.12) 0%, rgba(17, 20, 29, 0) 100%);">
              <div style="display: inline-block; padding: 8px 16px; background-color: #f59e0b; color: #000; font-weight: 900; font-size: 13px; letter-spacing: 1px; border-radius: 9999px; text-transform: uppercase;">
                MR.CRAZY ENGLISH
              </div>
              <h1 style="margin: 20px 0 8px 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                Bora destravar o inglês, ${displayName}!
              </h1>
              <p style="margin: 0; font-size: 15px; color: #94a3b8; line-height: 1.5;">
                O Mr. Crazy não tem paciência pra enrolação. Use o código abaixo ou clique no link para ativar sua conta e entrar agora.
              </p>
            </td>
          </tr>

          <!-- CÓDIGO DE 6 DÍGITOS -->
          <tr>
            <td style="padding: 10px 32px 24px 32px; text-align: center;">
              <div style="background-color: #0a0c12; border: 2px dashed #f59e0b; border-radius: 12px; padding: 20px; display: inline-block; min-width: 260px;">
                <span style="display: block; font-size: 12px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                  Seu Código de Ativação
                </span>
                <span style="display: block; font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #ffffff; text-shadow: 0 0 16px rgba(245, 158, 11, 0.4);">
                  ${code}
                </span>
              </div>
              <p style="margin: 12px 0 0 0; font-size: 13px; color: #64748b;">
                Válido por 24 horas. Não compartilhe com ninguém.
              </p>
            </td>
          </tr>

          <!-- BOTÃO LINK DIRETO -->
          <tr>
            <td style="padding: 0 32px 28px 32px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                    <a href="${verifyUrl}" target="_blank" style="font-size: 16px; font-weight: 800; color: #090b10; text-decoration: none; padding: 14px 28px; display: inline-block; border-radius: 10px; text-shadow: 0 1px 1px rgba(255,255,255,0.2);">
                      🚀 Ativar Conta em 1 Clique &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0 0; font-size: 12px; color: #64748b;">
                Ou copie e cole o link direto no seu navegador:<br>
                <a href="${verifyUrl}" style="color: #f59e0b; word-break: break-all; text-decoration: underline;">${verifyUrl}</a>
              </p>
            </td>
          </tr>

          <!-- DIVISOR -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="border-top: 1px solid #1e2433;"></div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 24px 32px 32px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                Se você não solicitou este cadastro no <strong>Mr.Crazy</strong>, relaxa e ignore este e-mail.
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; ${new Date().getFullYear()} Mr.Crazy English &bull; mrcrazy.fun
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Mr.Crazy - Ativação de Conta

Bora destravar o inglês, ${displayName}!

Seu código de confirmação de 6 dígitos é:
${code}

Ou acesse diretamente pelo link:
${verifyUrl}

Este código expira em 24 horas.
Se você não solicitou este cadastro, desconsidere esta mensagem.
  `.trim();

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject,
        html,
        text
      }),
      signal: AbortSignal.timeout(15000)
    });

    const data = (await response.json()) as { id?: string; message?: string; name?: string };

    if (!response.ok) {
      console.error("[Resend API Error]:", response.status, data);
      return {
        success: false,
        error: data.message || `Erro do Resend (status ${response.status})`
      };
    }

    return {
      success: true,
      messageId: data.id
    };
  } catch (err) {
    console.error("[Resend API Exception]:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha na conexão com Resend"
    };
  }
}
