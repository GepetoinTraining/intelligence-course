/**
 * Email Service — Powered by Resend
 * 
 * Usage:
 *   import { sendInviteEmail } from '@/lib/email';
 *   await sendInviteEmail({ to, inviterName, orgName, role, joinUrl });
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'NodeZero';

// ============================================================================
// GENERIC SEND
// ============================================================================

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('[email] RESEND_API_KEY not set — email skipped:', { to, subject });
        return { success: false, error: 'No API key configured' };
    }

    try {
        const result = await resend.emails.send({
            from: from || FROM_EMAIL,
            to,
            subject,
            html,
        });

        console.log('[email] Sent:', { to, subject, id: result.data?.id });
        return { success: true, id: result.data?.id };
    } catch (error) {
        console.error('[email] Failed to send:', error);
        return { success: false, error: String(error) };
    }
}

// ============================================================================
// INVITE EMAIL
// ============================================================================

interface InviteEmailParams {
    to: string;
    inviterName: string;
    orgName: string;
    role: string;
    inviteeName: string;
    joinUrl: string;
}

const ROLE_LABELS: Record<string, string> = {
    owner: 'Co-proprietário(a)',
    admin: 'Administrador(a)',
    teacher: 'Professor(a)',
    staff: 'Equipe',
    accountant: 'Contador(a)',
    support: 'Suporte',
};

export async function sendInviteEmail(params: InviteEmailParams) {
    const { to, inviterName, orgName, role, inviteeName, joinUrl } = params;
    const roleLabel = ROLE_LABELS[role] || role;
    const firstName = inviteeName.split(' ')[0];

    const subject = `${inviterName} convidou você para ${orgName}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convite — ${orgName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
                            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${APP_NAME}</h1>
                            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Plataforma de Gestão Institucional</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:40px;">
                            <h2 style="margin:0 0 8px;color:#18181b;font-size:20px;">Olá, ${firstName}! 👋</h2>
                            <p style="color:#52525b;font-size:15px;line-height:1.6;margin:0 0 24px;">
                                <strong>${inviterName}</strong> convidou você para fazer parte da equipe da 
                                <strong>${orgName}</strong> como <strong>${roleLabel}</strong>.
                            </p>

                            <!-- Role Badge -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                                <tr>
                                    <td style="background:#f5f3ff;border-radius:8px;padding:16px 20px;border-left:4px solid #6366f1;">
                                        <p style="margin:0;color:#6366f1;font-size:13px;font-weight:600;text-transform:uppercase;">Seu papel</p>
                                        <p style="margin:4px 0 0;color:#18181b;font-size:16px;font-weight:600;">${roleLabel}</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="${joinUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.3px;">
                                            Aceitar Convite
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color:#a1a1aa;font-size:13px;margin:24px 0 0;text-align:center;">
                                Este convite expira em 7 dias. Se você não esperava este email, pode ignorá-lo.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background:#fafafa;padding:20px 40px;border-top:1px solid #f0f0f0;">
                            <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;">
                                Enviado por ${orgName} via ${APP_NAME}<br>
                                <a href="${joinUrl}" style="color:#6366f1;text-decoration:none;">Clique aqui</a> caso o botão não funcione
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

    return sendEmail({ to, subject, html });
}
