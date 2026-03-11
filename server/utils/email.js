import { Resend } from 'resend';

// Guard: only initialize Resend when the API key is present.
// Without this guard the server crashes on startup in environments
// where RESEND_API_KEY has not yet been configured.
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const FROM = 'Talendro <support@talendro.com>';
const APP_URL = process.env.APP_URL || 'https://talendro.com';

/**
 * Send email verification link to a newly registered user.
 */
export async function sendVerificationEmail(user, token) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping verification email for', user.email);
    return;
  }
  const link = `${APP_URL}/api/auth/verify-email?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: 'Verify your Talendro email address',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#F9FAFB;font-family:'Inter',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:40px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#2F6DF6 0%,#00C4CC 100%);padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Talendro</h1>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Precision Matching. Automated Applications.</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px 40px 32px;">
                  <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#2C2F38;">Verify your email address</h2>
                  <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
                    Hi ${user.name.split(' ')[0]}, welcome to Talendro! Click the button below to verify your email and activate your account.
                  </p>
                  <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                    <tr>
                      <td style="background:#2F6DF6;border-radius:10px;padding:14px 36px;">
                        <a href="${link}" style="color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;display:block;">
                          Verify Email Address →
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 8px;font-size:13px;color:#9FA6B2;line-height:1.5;">
                    This link expires in <strong>24 hours</strong>. If you didn't create a Talendro account, you can safely ignore this email.
                  </p>
                  <p style="margin:0;font-size:12px;color:#D1D5DB;">
                    Or copy this URL: <span style="color:#2F6DF6;">${link}</span>
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#F9FAFB;padding:20px 40px;border-top:1px solid #E5E7EB;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#9FA6B2;">
                    © ${new Date().getFullYear()} Talendro · <a href="https://talendro.com" style="color:#2F6DF6;text-decoration:none;">talendro.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}

/**
 * Send a welcome email after the user verifies their email.
 */
export async function sendWelcomeEmail(user) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping welcome email for', user.email);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: 'Welcome to Talendro — you\'re all set!',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#F9FAFB;font-family:'Inter',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:40px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#2F6DF6 0%,#00C4CC 100%);padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Talendro</h1>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Precision Matching. Automated Applications.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px 40px 32px;">
                  <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#2C2F38;">✅ Email verified — you're all set!</h2>
                  <p style="margin:0 0 24px;font-size:15px;color:#6B7280;line-height:1.6;">
                    Hi ${user.name.split(' ')[0]}, your email is verified and your Talendro account is fully active. You can now complete your profile and let AI start finding and applying to jobs for you.
                  </p>
                  <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                    <tr>
                      <td style="background:#10B981;border-radius:10px;padding:14px 36px;">
                        <a href="${APP_URL}/app/dashboard" style="color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;display:block;">
                          Go to Dashboard →
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0;font-size:13px;color:#9FA6B2;line-height:1.5;">
                    Remember: you have a <strong>7-day money-back guarantee</strong>. If Talendro isn't right for you, just reply to this email within 7 days for a full refund — no questions asked.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background:#F9FAFB;padding:20px 40px;border-top:1px solid #E5E7EB;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#9FA6B2;">
                    © ${new Date().getFullYear()} Talendro · <a href="https://talendro.com" style="color:#2F6DF6;text-decoration:none;">talendro.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  });
}
