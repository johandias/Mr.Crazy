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

/**
 * Envia o e-mail contendo o personagem Mr. Crazy, o balão de fala característico,
 * o código numérico de 6 dígitos e o botão/link de 1 clique para ativação de conta.
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

  // Extrai o host de produção para os assets estáticos do personagem
  let appUrl = "https://www.mrcrazy.fun";
  try {
    const parsed = new URL(verifyUrl);
    appUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {
    appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mrcrazy.fun";
  }
  appUrl = appUrl.replace(/\/$/, "");

  const avatarUrl = `${appUrl}/assets/character/mr_crazy_full_clean.png`;
  const logoUrl = `${appUrl}/app-icon-512.png`;

  const subject = `🔥 [${code}] Ative seu acesso ao Mr.Crazy, ${displayName}!`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #07080c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #07080c; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- CONTAINER PRINCIPAL -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #0d1018; border: 1.5px solid #232938; border-radius: 20px; overflow: hidden; box-shadow: 0 24px 48px rgba(0,0,0,0.85);">
          
          <!-- TOPO BRANDING -->
          <tr>
            <td style="padding: 24px 28px 16px 28px; background: linear-gradient(180deg, rgba(245, 158, 11, 0.14) 0%, rgba(13, 16, 24, 0) 100%); border-bottom: 1px solid #1a202e;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img src="${logoUrl}" width="38" height="38" alt="Mr.Crazy" style="display: block; border-radius: 8px; border: 1px solid #f59e0b;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="display: block; font-size: 16px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px;">MR.CRAZY</span>
                          <span style="display: block; font-size: 11px; font-weight: 700; color: #f59e0b; letter-spacing: 1px; text-transform: uppercase;">Inglês Sem Frescura</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <div style="display: inline-block; padding: 5px 12px; background-color: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 9999px; font-size: 11px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.5px;">
                      ⚡ Prova Oral
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SEÇÃO DO PERSONAGEM MR. CRAZY & BALÃO DIDÁTICO -->
          <tr>
            <td style="padding: 30px 28px 18px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <!-- AVATAR MR. CRAZY -->
                  <td width="110" align="center" style="vertical-align: top; padding-right: 18px;">
                    <div style="width: 104px; height: 114px; background: radial-gradient(circle, rgba(245, 158, 11, 0.28) 0%, rgba(13, 16, 24, 0) 70%); border-radius: 16px; border: 1.5px solid rgba(245, 158, 11, 0.35); text-align: center; padding-top: 6px;">
                      <img src="${avatarUrl}" width="82" height="96" alt="Mr. Crazy" style="display: inline-block; image-rendering: pixelated; border: 0;" />
                    </div>
                    <span style="display: block; margin-top: 6px; font-size: 11px; font-weight: 800; color: #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px;">
                      Mr. Crazy
                    </span>
                    <span style="display: block; font-size: 10px; color: #f59e0b; font-weight: 600;">
                      Tutor Brabo
                    </span>
                  </td>

                  <!-- BALÃO DE FALA -->
                  <td style="vertical-align: top;">
                    <div style="background-color: #151924; border: 1.5px solid #f59e0b; border-radius: 14px; padding: 18px; position: relative; box-shadow: 0 8px 20px rgba(0,0,0,0.5);">
                      <div style="font-size: 12px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                        🗣️ Fala aí, ${displayName}!
                      </div>
                      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #f1f5f9; font-weight: 500;">
                        Chega de travar e de inventar desculpa. O seu acesso tá quase liberado. Digite o código abaixo ou aperte no botão pra validar agora antes que eu perca a paciência!
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BLOCO DO CÓDIGO DE 6 DÍGITOS -->
          <tr>
            <td style="padding: 10px 28px 24px 28px;" align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="background-color: #080a0f; border: 2px dashed #f59e0b; border-radius: 14px; padding: 22px 24px; text-align: center; max-width: 360px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.7);">
                      <span style="display: block; font-size: 12px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">
                        🔑 SEU CÓDIGO DE ATIVAÇÃO
                      </span>
                      <span style="display: block; font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #ffffff; text-shadow: 0 0 20px rgba(245, 158, 11, 0.45); line-height: 1;">
                        ${code}
                      </span>
                      <span style="display: block; margin-top: 10px; font-size: 12px; color: #64748b;">
                        ⏳ Válido por 24 horas • Não compartilhe
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BOTÃO DE ATIVAÇÃO EM 1 CLIQUE -->
          <tr>
            <td style="padding: 0 28px 24px 28px;" align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); box-shadow: 0 8px 24px rgba(245, 158, 11, 0.35);">
                    <a href="${verifyUrl}" target="_blank" style="font-size: 16px; font-weight: 900; color: #07080c; text-decoration: none; padding: 16px 36px; display: inline-block; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                      🚀 Ativar Minha Conta em 1 Clique &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.4; text-align: center;">
                Ou copie e cole o link direto no seu navegador:<br>
                <a href="${verifyUrl}" style="color: #f59e0b; word-break: break-all; text-decoration: underline;">${verifyUrl}</a>
              </p>
            </td>
          </tr>

          <!-- CARDS DE REGRAS DO MR. CRAZY -->
          <tr>
            <td style="padding: 12px 28px 24px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #080a0f; border: 1px solid #1a202e; border-radius: 12px; padding: 16px;">
                <tr>
                  <td style="padding: 6px 12px; vertical-align: top;" width="33%">
                    <div style="font-size: 18px; margin-bottom: 4px;">🎙️</div>
                    <strong style="display: block; font-size: 12px; color: #f1f5f9; margin-bottom: 2px;">Treino por Voz</strong>
                    <span style="font-size: 11px; color: #64748b; line-height: 1.3; display: block;">Fale no microfone e receba correções imediatas.</span>
                  </td>
                  <td style="padding: 6px 12px; vertical-align: top; border-left: 1px solid #1a202e;" width="33%">
                    <div style="font-size: 18px; margin-bottom: 4px;">⚔️</div>
                    <strong style="display: block; font-size: 12px; color: #f1f5f9; margin-bottom: 2px;">O Chefão</strong>
                    <span style="font-size: 11px; color: #64748b; line-height: 1.3; display: block;">Prova oral de verdade ao fim de cada módulo.</span>
                  </td>
                  <td style="padding: 6px 12px; vertical-align: top; border-left: 1px solid #1a202e;" width="33%">
                    <div style="font-size: 18px; margin-bottom: 4px;">⚡</div>
                    <strong style="display: block; font-size: 12px; color: #f1f5f9; margin-bottom: 2px;">Sem Enrolação</strong>
                    <span style="font-size: 11px; color: #64748b; line-height: 1.3; display: block;">Explicações curtas (&lt;25 palavras) em português.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DIVISOR -->
          <tr>
            <td style="padding: 0 28px;">
              <div style="border-top: 1px solid #1a202e;"></div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 24px 28px 30px 28px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b; line-height: 1.4;">
                Se você não solicitou este cadastro no <strong>Mr.Crazy</strong>, relaxa e ignore este e-mail. Nenhuma ação será realizada.
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; ${new Date().getFullYear()} Mr.Crazy English &bull; <a href="https://www.mrcrazy.fun" style="color: #64748b; text-decoration: underline;">mrcrazy.fun</a>
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
MR.CRAZY ENGLISH - ATIVAÇÃO DE CONTA

Fala aí, ${displayName}!

Chega de travar e de inventar desculpa. O seu acesso tá quase liberado.

SEU CÓDIGO DE ATIVAÇÃO:
${code}

Ou ative sua conta diretamente pelo link:
${verifyUrl}

Este código expira em 24 horas.
Se você não solicitou este cadastro, pode ignorar esta mensagem com segurança.

Mr.Crazy English • mrcrazy.fun
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
