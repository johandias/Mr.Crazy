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

export interface VerificationEmailContent {
  subject: string;
  html: string;
  text: string;
}

export function getResendApiKey(): string | undefined {
  let key = process.env.RESEND_API_KEY?.trim();
  if (key && ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'")))) {
    key = key.slice(1, -1).trim();
  }
  return key;
}

export function getResendFromEmail(): string {
  let from = process.env.RESEND_FROM_EMAIL?.trim() || "Mr.Crazy <noreply@mrcrazy.fun>";
  if ((from.startsWith('"') && from.endsWith('"')) || (from.startsWith("'") && from.endsWith("'"))) {
    from = from.slice(1, -1).trim();
  }
  return from;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

function getAppUrl(verifyUrl: string): string {
  try {
    const parsed = new URL(verifyUrl);
    return `${parsed.protocol}//${parsed.host}`.replace(/\/$/, "");
  } catch {
    return (process.env.NEXT_PUBLIC_APP_URL || "https://www.mrcrazy.fun").replace(/\/$/, "");
  }
}

function formatSpacedCode(code: string): string {
  return code.split("").join(" ");
}

export function buildVerificationEmailContent({
  email,
  nickname,
  code,
  verifyUrl
}: SendVerificationEmailParams): VerificationEmailContent {
  void email;
  const displayName = nickname?.trim() || "Aluno";
  const safeDisplayName = escapeHtml(displayName);
  const safeCode = escapeHtml(code);
  const spacedCode = escapeHtml(formatSpacedCode(code));
  const safeVerifyUrl = escapeHtml(verifyUrl);
  const appUrl = getAppUrl(verifyUrl);
  const heroImageUrl = `${appUrl}/assets/email/mrcrazy-fala-ai-email.png`;

  const subject = `[${code}] Ative seu acesso ao Mr.Crazy, ${displayName}!`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${escapeHtml(subject)}</title>
  <style>
    @media only screen and (max-width: 480px) {
      .email-shell { padding: 18px 10px !important; }
      .email-card { width: 100% !important; border-radius: 18px !important; }
      .mobile-pad { padding-left: 18px !important; padding-right: 18px !important; }
      .brand-badge { display: block !important; margin-top: 12px !important; text-align: center !important; }
      .brand-cell, .badge-cell { display: block !important; width: 100% !important; text-align: center !important; }
      .hero-img { width: 174px !important; height: 174px !important; }
      .headline { font-size: 24px !important; line-height: 1.16 !important; }
      .intro-copy { font-size: 15px !important; }
      .code-card { padding: 18px 12px !important; }
      .code-number { font-size: 34px !important; letter-spacing: 5px !important; }
      .cta-link { display: block !important; width: 100% !important; min-width: 0 !important; padding-left: 0 !important; padding-right: 0 !important; }
      .footer-copy { font-size: 11px !important; }
    }
  </style>
</head>
<body bgcolor="#05080d" style="margin:0; padding:0; background-color:#05080d; color:#f8fafc; font-family:Arial, Helvetica, sans-serif; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#05080d" style="width:100%; background-color:#05080d;">
    <tr>
      <td align="center" class="email-shell" style="padding:30px 12px;">
        <table role="presentation" width="620" cellspacing="0" cellpadding="0" border="0" bgcolor="#08101b" class="email-card" style="width:620px; max-width:620px; background-color:#08101b; border:1px solid #172235; border-radius:22px; overflow:hidden; box-shadow:0 22px 48px rgba(0,0,0,0.62);">
          <tr>
            <td class="mobile-pad" style="padding:22px 28px 14px 28px; border-bottom:1px solid #162235; background-color:#07101a;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="brand-cell" align="left" style="vertical-align:middle;">
                    <div style="font-size:22px; line-height:1; font-weight:900; letter-spacing:1.8px; color:#ffffff;">MR.CRAZY</div>
                    <div style="padding-top:6px; font-size:12px; line-height:1.2; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:#f6b83f;">Inglês sem frescura</div>
                  </td>
                  <td class="badge-cell" align="right" style="vertical-align:middle;">
                    <span class="brand-badge" style="display:inline-block; padding:8px 13px; border:1px solid #23445c; border-radius:999px; background-color:#0c1a29; color:#7dd3fc; font-size:11px; line-height:1; font-weight:900; letter-spacing:0.9px; text-transform:uppercase;">🔐 Ativação</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" class="mobile-pad" style="padding:22px 28px 8px 28px; background-color:#08101b;">
              <img src="${heroImageUrl}" width="210" height="210" alt="Mr.Crazy dizendo Fala aí!" class="hero-img" style="display:block; width:210px; height:210px; max-width:100%; border:0; outline:none; text-decoration:none; image-rendering:pixelated;">
            </td>
          </tr>

          <tr>
            <td align="center" class="mobile-pad" style="padding:4px 42px 20px 42px;">
              <h1 class="headline" style="margin:0; color:#ffffff; font-size:28px; line-height:1.14; font-weight:900; letter-spacing:0;">Fala aí, ${safeDisplayName}!</h1>
              <p class="intro-copy" style="margin:12px 0 0 0; color:#c8d3e1; font-size:16px; line-height:1.55; font-weight:500;">
                Seu acesso tá quase liberado. Use o código abaixo ou toque no botão e eu resolvo o resto. Sem enrolação. Bora falar inglês.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" class="mobile-pad" style="padding:0 34px 20px 34px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#0b1726" class="code-card" style="width:100%; background-color:#0b1726; border:1px solid #9f6b18; border-radius:18px; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.03);">
                <tr>
                  <td align="center" style="padding:22px 20px;">
                    <div style="margin:0 0 12px 0; color:#f6b83f; font-size:12px; line-height:1.2; font-weight:900; letter-spacing:1.8px; text-transform:uppercase;">🔑 Código de ativação</div>
                    <div class="code-number" style="font-family:'Courier New', Courier, monospace; color:#ffffff; font-size:44px; line-height:1; font-weight:900; letter-spacing:9px; text-align:center;">${spacedCode}</div>
                    <div style="margin-top:13px; color:#95a6bd; font-size:13px; line-height:1.35; font-weight:700;">⏳ Expira em 24 horas</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" class="mobile-pad" style="padding:0 34px 12px 34px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect href="${safeVerifyUrl}" style="height:54px;v-text-anchor:middle;width:330px;" arcsize="18%" strokecolor="#f59e0b" fillcolor="#f59e0b">
                      <w:anchorlock/>
                      <center style="color:#07101a;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:900;text-transform:uppercase;">🚀 ATIVAR MINHA CONTA</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-- -->
                    <a href="${safeVerifyUrl}" target="_blank" class="cta-link" style="display:inline-block; min-width:300px; padding:18px 24px; border-radius:14px; background-color:#f59e0b; color:#07101a; font-size:16px; line-height:1; font-weight:900; letter-spacing:0.6px; text-align:center; text-decoration:none; text-transform:uppercase; box-shadow:0 10px 28px rgba(245,158,11,0.24);">🚀 ATIVAR MINHA CONTA</a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
              <p style="margin:10px 0 0 0; color:#8da0b8; font-size:13px; line-height:1.45; text-align:center;">Leva só alguns segundos.</p>
            </td>
          </tr>

          <tr>
            <td class="mobile-pad" style="padding:8px 34px 20px 34px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#091320" style="width:100%; background-color:#091320; border:1px solid #172235; border-radius:14px;">
                <tr>
                  <td style="padding:15px 16px;">
                    <p style="margin:0 0 8px 0; color:#c8d3e1; font-size:13px; line-height:1.45; font-weight:700;">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
                    <a href="${safeVerifyUrl}" target="_blank" style="color:#7dd3fc; font-size:12px; line-height:1.45; text-decoration:underline; word-break:break-all; overflow-wrap:anywhere;">${safeVerifyUrl}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td class="mobile-pad" style="padding:0 34px 24px 34px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#0b1726" style="width:100%; background-color:#0b1726; border:1px solid #1d2a3d; border-radius:14px;">
                <tr>
                  <td style="padding:15px 16px;">
                    <p style="margin:0; color:#d8e2ee; font-size:13px; line-height:1.55;">
                      🔒 Este link e código são exclusivos para você. Não compartilhe seu código de ativação. Se você não solicitou este acesso, pode ignorar este email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" class="mobile-pad" style="padding:20px 28px 26px 28px; border-top:1px solid #162235; background-color:#07101a;">
              <p style="margin:0; color:#ffffff; font-size:14px; line-height:1.2; font-weight:900; letter-spacing:1px;">MR.CRAZY</p>
              <p class="footer-copy" style="margin:7px 0 0 0; color:#8da0b8; font-size:12px; line-height:1.45;">
                <a href="https://www.mrcrazy.fun" target="_blank" style="color:#7dd3fc; text-decoration:underline;">mrcrazy.fun</a><br>
                Inglês sem frescura.
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
MR.CRAZY - ATIVAÇÃO DE CONTA

Fala aí, ${displayName}!

Seu acesso tá quase liberado. Use o código abaixo ou ative sua conta em um clique.

CÓDIGO DE ATIVAÇÃO:
${code}

Expira em 24 horas.

Ativar minha conta:
${verifyUrl}

Este link e código são exclusivos para você. Não compartilhe seu código de ativação.
Se você não solicitou este acesso, pode ignorar este email.

Mr.Crazy • mrcrazy.fun
  `.trim();

  return { subject, html, text };
}

/**
 * Envia o e-mail contendo o personagem Mr. Crazy, o código numérico de 6 dígitos
 * e o botão/link de 1 clique para ativação de conta.
 */
export async function sendVerificationEmail({
  email,
  nickname,
  code,
  verifyUrl
}: SendVerificationEmailParams): Promise<EmailResult> {
  const apiKey = getResendApiKey();
  const fromEmail = getResendFromEmail();
  const content = buildVerificationEmailContent({ email, nickname, code, verifyUrl });

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
        subject: content.subject,
        html: content.html,
        text: content.text
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
