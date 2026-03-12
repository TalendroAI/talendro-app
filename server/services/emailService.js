/**
 * emailService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized email service for all transactional emails sent by Talendro.
 *
 * Uses the Resend SDK for reliable, high-deliverability transactional email.
 *
 * Required environment variables:
 *   RESEND_API_KEY  — obtain from https://resend.com
 *   EMAIL_FROM      — verified sender address (e.g., "Talendro <noreply@talendro.com>")
 *   FRONTEND_URL    — base URL of the frontend (e.g., https://talendro.com)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = process.env.EMAIL_FROM || 'Talendro <noreply@talendro.com>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://talendro.com';

// ─── Brand constants ──────────────────────────────────────────────────────────
const BRAND_BLUE = '#2F6DF6';
const BRAND_AQUA = '#00C4CC';
const BRAND_DARK = '#1a1d23';
const BRAND_SLATE = '#2C2F38';

// ─── Base HTML wrapper ────────────────────────────────────────────────────────

function wrapEmail(bodyHtml, previewText = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Talendro</title>
  <meta name="description" content="${previewText}" />
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${BRAND_DARK};padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:800;color:${BRAND_BLUE};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;letter-spacing:-0.5px;">
                      Talendro<span style="color:${BRAND_AQUA}">™</span>
                    </span>
                    <span style="font-size:11px;color:#9ca3af;letter-spacing:2px;display:block;margin-top:2px;">AUTONOMOUS JOB APPLICATION PLATFORM</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                You're receiving this email because you have an account at <a href="${FRONTEND_URL}" style="color:${BRAND_BLUE};text-decoration:none;">Talendro</a>.
                <br />
                <a href="${FRONTEND_URL}/app/settings" style="color:${BRAND_BLUE};text-decoration:none;">Manage email preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Helper: send via Resend ──────────────────────────────────────────────────

async function sendEmail({ to, subject, html, text }) {
  if (!resend) {
    // Development fallback — log to console
    console.log(`[emailService] DEV MODE — would send email:`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Preview: ${text?.slice(0, 120) || '(no text)'}`);
    return { id: 'dev-mode-no-send' };
  }

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [to],
    subject,
    html,
    text: text || '',
  });

  if (error) {
    console.error('[emailService] Resend error:', error);
    throw new Error(error.message || 'Email send failed');
  }

  console.log(`[emailService] Email sent: ${data?.id} → ${to} | ${subject}`);
  return data;
}

// ─── 1. Application Confirmation ─────────────────────────────────────────────

async function sendApplicationConfirmation({ toEmail, userName, jobTitle, companyName, applyUrl, appliedAt }) {
  const dateStr = appliedAt
    ? new Date(appliedAt).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })
    : new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  const html = wrapEmail(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${BRAND_SLATE};">Application Submitted ✅</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hi ${userName}, your AI just applied to a new job on your behalf.</p>

    <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:1px;">Position Applied</p>
      <p style="margin:0 0 12px;font-size:20px;font-weight:700;color:${BRAND_SLATE};">${jobTitle}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#374151;"><strong>Company:</strong> ${companyName}</p>
      <p style="margin:0;font-size:14px;color:#374151;"><strong>Applied:</strong> ${dateStr}</p>
    </div>

    <p style="font-size:14px;color:#6b7280;margin:0 0 24px;">
      Your AI-tailored resume and cover letter were submitted automatically. The application has been logged in your dashboard.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="padding-right:12px;">
          <a href="${FRONTEND_URL}/app/applications" style="display:inline-block;padding:12px 24px;background:${BRAND_BLUE};color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
            View Applications →
          </a>
        </td>
        ${applyUrl ? `<td>
          <a href="${applyUrl}" style="display:inline-block;padding:12px 24px;border:1.5px solid #e5e7eb;color:${BRAND_SLATE};font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
            View Job Posting
          </a>
        </td>` : ''}
      </tr>
    </table>

    <p style="font-size:13px;color:#9ca3af;margin:0;">
      Your AI continues to search and apply to new matching positions daily. Check your dashboard for updates.
    </p>
  `, `Applied to ${jobTitle} at ${companyName}`);

  return sendEmail({
    to: toEmail,
    subject: `✅ Applied: ${jobTitle} at ${companyName}`,
    html,
    text: `Hi ${userName},\n\nYour AI just applied to ${jobTitle} at ${companyName} on ${dateStr}.\n\nView your applications: ${FRONTEND_URL}/app/applications`,
  });
}

// ─── 2. Welcome Email ─────────────────────────────────────────────────────────

async function sendWelcomeEmail({ toEmail, userName }) {
  const html = wrapEmail(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${BRAND_SLATE};">Welcome to Talendro 🎯</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hi ${userName}, your account is ready. Let's get your job search on autopilot.</p>

    <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:${BRAND_BLUE};">Here's what happens next:</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        ${[
          ['1', 'Complete your profile', 'Upload your resume and fill in your details — takes about 10 minutes.'],
          ['2', 'AI optimizes your resume', 'Your resume is rewritten and scored for ATS compatibility.'],
          ['3', 'AI starts applying', 'Your AI applies to matching jobs automatically, every day.'],
        ].map(([n, title, desc]) => `
          <tr>
            <td style="padding:8px 0;vertical-align:top;width:32px;">
              <span style="display:inline-block;width:24px;height:24px;background:${BRAND_BLUE};color:#fff;border-radius:50%;font-size:12px;font-weight:700;text-align:center;line-height:24px;">${n}</span>
            </td>
            <td style="padding:8px 0 8px 12px;vertical-align:top;">
              <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:${BRAND_SLATE};">${title}</p>
              <p style="margin:0;font-size:13px;color:#6b7280;">${desc}</p>
            </td>
          </tr>
        `).join('')}
      </table>
    </div>

    <a href="${FRONTEND_URL}/app/onboarding" style="display:inline-block;padding:14px 32px;background:${BRAND_BLUE};color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;margin-bottom:24px;">
      Complete My Profile →
    </a>

    <p style="font-size:13px;color:#9ca3af;margin:0;">
      Questions? Reply to this email or visit our <a href="${FRONTEND_URL}/help" style="color:${BRAND_BLUE};">help center</a>.
    </p>
  `, 'Welcome to Talendro — your AI job search starts now.');

  return sendEmail({
    to: toEmail,
    subject: '🎯 Welcome to Talendro — Let\'s get your job search on autopilot',
    html,
    text: `Hi ${userName},\n\nWelcome to Talendro! Complete your profile to get started: ${FRONTEND_URL}/app/onboarding`,
  });
}

// ─── 3. Email Verification ────────────────────────────────────────────────────

async function sendVerificationEmail({ toEmail, userName, verificationToken }) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;

  const html = wrapEmail(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${BRAND_SLATE};">Verify Your Email</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hi ${userName}, click the button below to verify your email address and activate your account.</p>

    <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;background:${BRAND_BLUE};color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;margin-bottom:24px;">
      Verify Email Address →
    </a>

    <p style="font-size:13px;color:#9ca3af;margin:0 0 8px;">
      This link expires in 24 hours. If you didn't create a Talendro account, you can safely ignore this email.
    </p>
    <p style="font-size:12px;color:#d1d5db;margin:0;word-break:break-all;">
      Or copy this link: ${verifyUrl}
    </p>
  `, 'Verify your Talendro email address');

  return sendEmail({
    to: toEmail,
    subject: 'Verify your Talendro email address',
    html,
    text: `Hi ${userName},\n\nVerify your email: ${verifyUrl}\n\nThis link expires in 24 hours.`,
  });
}

// ─── 4. Password Reset ────────────────────────────────────────────────────────

async function sendPasswordResetEmail({ toEmail, userName, resetToken }) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  const html = wrapEmail(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${BRAND_SLATE};">Reset Your Password</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hi ${userName}, we received a request to reset your Talendro password.</p>

    <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:${BRAND_BLUE};color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;margin-bottom:24px;">
      Reset Password →
    </a>

    <p style="font-size:13px;color:#9ca3af;margin:0 0 8px;">
      This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password will not change.
    </p>
    <p style="font-size:12px;color:#d1d5db;margin:0;word-break:break-all;">
      Or copy this link: ${resetUrl}
    </p>
  `, 'Reset your Talendro password');

  return sendEmail({
    to: toEmail,
    subject: 'Reset your Talendro password',
    html,
    text: `Hi ${userName},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
  });
}

// ─── 5. Application Failed ────────────────────────────────────────────────────

async function sendApplicationFailed({ toEmail, userName, jobTitle, companyName }) {
  const html = wrapEmail(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${BRAND_SLATE};">Application Could Not Be Submitted</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hi ${userName}, we were unable to automatically submit your application for the following position.</p>

    <div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:1px;">Position</p>
      <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:${BRAND_SLATE};">${jobTitle}</p>
      <p style="margin:0;font-size:14px;color:#374151;"><strong>Company:</strong> ${companyName}</p>
    </div>

    <p style="font-size:14px;color:#6b7280;margin:0 0 16px;">
      This can happen when an employer's application form requires a CAPTCHA, login, or custom fields that our AI cannot complete automatically.
      You can apply to this position manually from your dashboard.
    </p>

    <a href="${FRONTEND_URL}/app/applications" style="display:inline-block;padding:12px 24px;background:${BRAND_BLUE};color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
      View Applications Dashboard →
    </a>
  `, `Application failed: ${jobTitle} at ${companyName}`);

  return sendEmail({
    to: toEmail,
    subject: `⚠️ Application could not be submitted: ${jobTitle} at ${companyName}`,
    html,
    text: `Hi ${userName},\n\nWe were unable to automatically apply to ${jobTitle} at ${companyName}. Please apply manually from your dashboard: ${FRONTEND_URL}/app/applications`,
  });
}

// ─── 6. Quota Warning ────────────────────────────────────────────────────────

async function sendQuotaWarning({ toEmail, userName, plan, used, limit }) {
  const html = wrapEmail(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${BRAND_SLATE};">Monthly Application Limit Reached</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hi ${userName}, your AI has reached its monthly application limit for your current plan.</p>

    <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Plan:</strong> ${plan.charAt(0).toUpperCase() + plan.slice(1)}</p>
      <p style="margin:0 0 8px;font-size:14px;color:#374151;"><strong>Applications this month:</strong> ${used} / ${limit}</p>
      <p style="margin:0;font-size:14px;color:#374151;">Your limit resets at the start of your next billing cycle.</p>
    </div>

    <p style="font-size:14px;color:#6b7280;margin:0 0 24px;">
      Upgrade your plan to increase your monthly application limit and keep your job search running without interruption.
    </p>

    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:12px;">
          <a href="${FRONTEND_URL}/app/billing" style="display:inline-block;padding:12px 24px;background:${BRAND_BLUE};color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
            Upgrade Plan →
          </a>
        </td>
        <td>
          <a href="${FRONTEND_URL}/app/applications" style="display:inline-block;padding:12px 24px;border:1.5px solid #e5e7eb;color:${BRAND_SLATE};font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
            View Applications
          </a>
        </td>
      </tr>
    </table>
  `, `Monthly application limit reached (${used}/${limit})`);

  return sendEmail({
    to: toEmail,
    subject: `⚠️ Monthly application limit reached — ${used}/${limit} applications used`,
    html,
    text: `Hi ${userName},\n\nYou've reached your monthly application limit (${used}/${limit} for ${plan} plan).\n\nUpgrade your plan: ${FRONTEND_URL}/app/billing`,
  });
}

// ─── 7. Documents Ready ───────────────────────────────────────────────────────

async function sendDocumentsReady({ toEmail, userName, plan }) {
  const isConcierge = plan === 'concierge';

  const html = wrapEmail(`
    <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${BRAND_SLATE};">Your Career Documents Are Ready 📄</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hi ${userName}, your AI has finished generating your optimized career documents.</p>

    <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#059669;">Documents included:</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        ${[
          ['📄', 'Optimized Resume', 'ATS-optimized, keyword-rich, ready to submit'],
          ...(plan === 'pro' || isConcierge ? [['📋', 'PDF Resume', 'Professionally formatted PDF version']] : []),
          ...(isConcierge ? [['🔗', 'LinkedIn Profile Optimization', 'Full rewrite or build-from-scratch']] : []),
        ].map(([icon, title, desc]) => `
          <tr>
            <td style="padding:6px 0;vertical-align:top;width:28px;font-size:18px;">${icon}</td>
            <td style="padding:6px 0 6px 10px;vertical-align:top;">
              <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:${BRAND_SLATE};">${title}</p>
              <p style="margin:0;font-size:13px;color:#6b7280;">${desc}</p>
            </td>
          </tr>
        `).join('')}
      </table>
    </div>

    <a href="${FRONTEND_URL}/app/document-delivery" style="display:inline-block;padding:14px 32px;background:${BRAND_BLUE};color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;margin-bottom:24px;">
      View My Documents →
    </a>
  `, 'Your Talendro career documents are ready');

  return sendEmail({
    to: toEmail,
    subject: '📄 Your career documents are ready — Talendro',
    html,
    text: `Hi ${userName},\n\nYour optimized career documents are ready. View them here: ${FRONTEND_URL}/app/document-delivery`,
  });
}

// ─── 8. Rare Role Alert ─────────────────────────────────────────────────────

/**
 * Sent immediately when a Rare or Exceptionally Rare role is detected,
 * regardless of whether it passed the location gate.
 *
 * @param {object} params
 * @param {string} params.toEmail
 * @param {string} params.userName
 * @param {string} params.jobTitle
 * @param {string} params.companyName
 * @param {string} params.location
 * @param {string} params.salary
 * @param {string} params.postedAgo   e.g. "47 minutes ago"
 * @param {string} params.jobUrl
 * @param {'rare'|'exceptionally_rare'} params.rarity
 * @param {boolean} params.locationPassed  true = applied automatically, false = held for review
 */
async function sendRareRoleAlert({
  toEmail, userName, jobTitle, companyName, location,
  salary, postedAgo, jobUrl, rarity, locationPassed
}) {
  const isExceptional = rarity === 'exceptionally_rare';

  const rarityLabel = isExceptional
    ? '⚡ Exceptionally Rare Role Detected'
    : '🔔 Rare Role Detected';

  const rarityColor = isExceptional ? '#dc2626' : '#d97706';
  const rarityBg    = isExceptional ? '#fef2f2' : '#fffbeb';
  const rarityBorder= isExceptional ? '#fecaca' : '#fde68a';

  const rarityNote = isExceptional
    ? 'Roles with this title appear fewer than 3–5 times per year nationally. This may be a once-in-a-career opportunity.'
    : 'Roles at this level appear fewer than 10 times per year nationally.';

  const actionNote = locationPassed
    ? `✅ <strong>Talendro has already submitted your application.</strong> You will receive a separate confirmation shortly.`
    : `⚠️ <strong>This role did not match your location preference and was not applied to automatically.</strong> Review it on your dashboard and consider adjusting your criteria.`;

  const html = wrapEmail(`
    <div style="background:${rarityBg};border:2px solid ${rarityBorder};border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0;font-size:16px;font-weight:800;color:${rarityColor};">${rarityLabel}</p>
      <p style="margin:6px 0 0;font-size:13px;color:#374151;">${rarityNote}</p>
    </div>

    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${BRAND_SLATE};">${jobTitle}</h2>
    <p style="margin:0 0 4px;font-size:15px;color:#374151;font-weight:600;">${companyName}</p>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">📍 ${location} &nbsp;|&nbsp; 🕐 Posted ${postedAgo}${salary ? ` &nbsp;|&nbsp; 💰 ${salary}` : ''}</p>

    <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#374151;">${actionNote}</p>
    </div>

    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:12px;">
          <a href="${jobUrl}" style="display:inline-block;padding:12px 24px;background:${rarityColor};color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
            View Full Posting →
          </a>
        </td>
        <td>
          <a href="${FRONTEND_URL}/app/jobs" style="display:inline-block;padding:12px 24px;border:1.5px solid #e5e7eb;color:${BRAND_SLATE};font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
            Open Dashboard
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
      You are receiving this alert because Talendro detected a ${isExceptional ? 'exceptionally rare' : 'rare'} role matching your profile.
      These alerts are sent immediately when detected, regardless of your normal notification preferences.
    </p>
  `, `${rarityLabel}: ${jobTitle} at ${companyName}`);

  return sendEmail({
    to: toEmail,
    subject: `${isExceptional ? '⚡' : '🔔'} ${rarityLabel}: ${jobTitle} at ${companyName}`,
    html,
    text: `Hi ${userName},\n\nTalendro has detected a ${isExceptional ? 'exceptionally rare' : 'rare'} role matching your profile:\n\n${jobTitle} at ${companyName}\n${location} | Posted ${postedAgo}\n\n${rarityNote}\n\n${locationPassed ? 'Your application has been submitted automatically.' : 'This role did not match your location preference. Review it on your dashboard.'}\n\nView posting: ${jobUrl}`,
  });
}

// ─── 9. Weekly Digest ────────────────────────────────────────────────────────
/**
 * Weekly digest email sent every Monday morning summarising the past 7 days:
 * applications submitted, jobs discovered, and top upcoming matches.
 *
 * @param {object} opts
 * @param {string} opts.toEmail
 * @param {string} opts.userName
 * @param {string} opts.plan  — 'starter' | 'pro' | 'concierge'
 * @param {number} opts.applicationsThisWeek
 * @param {number} opts.jobsDiscovered
 * @param {Array<{title:string, company:string, score:number, url:string}>} opts.topMatches
 */
async function sendWeeklyDigest({ toEmail, userName, plan, applicationsThisWeek = 0, jobsDiscovered = 0, topMatches = [] }) {
  const firstName = userName?.split(' ')[0] || 'there';
  const planLabel = plan === 'concierge' ? 'Concierge' : plan === 'pro' ? 'Pro' : 'Starter';
  const dashboardUrl = `${FRONTEND_URL}/app/dashboard`;

  const matchRows = topMatches.slice(0, 5).map(m => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
        <a href="${m.url || dashboardUrl}" style="font-size:14px;font-weight:600;color:${BRAND_BLUE};text-decoration:none;">${m.title}</a>
        <span style="font-size:13px;color:#6B7280;"> at ${m.company}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;">
        <span style="display:inline-block;background:${BRAND_BLUE};color:#fff;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;">${m.score}% match</span>
      </td>
    </tr>`).join('');

  const bodyHtml = `
    <td style="padding:40px 40px 32px;">
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#2C2F38;">Your weekly job search digest</h2>
      <p style="margin:0 0 28px;font-size:14px;color:#6B7280;">Hi ${firstName}, here's what Talendro accomplished for you this week.</p>

      <!-- Stats row -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
        <tr>
          <td width="50%" style="padding-right:8px;">
            <div style="background:#f0f7ff;border-radius:12px;padding:20px;text-align:center;">
              <div style="font-size:32px;font-weight:800;color:${BRAND_BLUE};">${applicationsThisWeek}</div>
              <div style="font-size:13px;color:#6B7280;margin-top:4px;">Applications submitted</div>
            </div>
          </td>
          <td width="50%" style="padding-left:8px;">
            <div style="background:#f0fdf4;border-radius:12px;padding:20px;text-align:center;">
              <div style="font-size:32px;font-weight:800;color:#10B981;">${jobsDiscovered}</div>
              <div style="font-size:13px;color:#6B7280;margin-top:4px;">Jobs discovered</div>
            </div>
          </td>
        </tr>
      </table>

      ${topMatches.length > 0 ? `
      <h3 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#2C2F38;">Top matches this week</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        ${matchRows}
      </table>` : ''}

      <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
        <tr>
          <td style="background:${BRAND_BLUE};border-radius:10px;padding:14px 36px;">
            <a href="${dashboardUrl}" style="color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;display:block;">View Full Dashboard →</a>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-size:12px;color:#9FA6B2;text-align:center;">
        You're on the <strong>${planLabel}</strong> plan. Talendro searches for new jobs every 30 minutes so you're always first to apply.
      </p>
    </td>`;

  const html = wrapEmail(bodyHtml, `${applicationsThisWeek} applications submitted this week — view your digest`);
  return sendEmail({
    to: toEmail,
    subject: `📊 Your Talendro weekly digest — ${applicationsThisWeek} applications this week`,
    html,
    text: `Hi ${firstName},\n\nHere's your Talendro weekly summary:\n\n• Applications submitted: ${applicationsThisWeek}\n• Jobs discovered: ${jobsDiscovered}\n\nView your full dashboard: ${dashboardUrl}`,
  });
}

// ─── CAPTCHA Blocked Notification ────────────────────────────────────────────────────

/**
 * Notify user that an application was blocked by CAPTCHA and needs manual completion.
 * Includes the job link and a pre-written cover letter to make it as easy as possible.
 */
async function sendCaptchaBlockedNotification({ toEmail, userName, jobTitle, companyName, applyUrl, coverLetterSnapshot }) {
  const firstName = (userName || 'there').split(' ')[0];
  const dashboardUrl = `${FRONTEND_URL}/app/jobs`;

  const bodyHtml = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#2C2F38;">One application needs your help</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">
      Hi ${firstName}, Talendro tried to apply to the role below but encountered a CAPTCHA verification that requires a real person to complete. Everything else is ready — just click the button and submit.
    </p>
    <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin-bottom:24px;border-left:4px solid ${BRAND_BLUE};">
      <div style="font-size:16px;font-weight:700;color:#2C2F38;">${jobTitle}</div>
      <div style="font-size:14px;color:#6B7280;margin-top:4px;">${companyName}</div>
    </div>
    <p style="margin:0 0 16px;font-size:14px;color:#374151;">
      Your tailored cover letter is ready below. Click the button, complete the CAPTCHA, paste in your cover letter, and submit. It takes under two minutes.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td style="background:${BRAND_BLUE};border-radius:10px;padding:14px 36px;">
          <a href="${applyUrl}" style="color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;display:block;">Complete This Application →</a>
        </td>
      </tr>
    </table>
    ${coverLetterSnapshot ? `
    <div style="background:#f0f7ff;border-radius:12px;padding:20px;margin-bottom:24px;">
      <div style="font-size:12px;font-weight:700;color:${BRAND_BLUE};margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">Your tailored cover letter (ready to paste)</div>
      <div style="font-size:13px;color:#374151;white-space:pre-line;line-height:1.7;">${coverLetterSnapshot.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    </div>` : ''}
    <p style="margin:0;font-size:12px;color:#9FA6B2;">
      This role appears as <strong>Needs Attention</strong> in your <a href="${dashboardUrl}" style="color:${BRAND_BLUE};">dashboard</a>.
    </p>`;

  const html = wrapEmail(bodyHtml, `Action needed: complete your application to ${jobTitle} at ${companyName}`);
  return sendEmail({
    to: toEmail,
    subject: `⚠️ Action needed: complete your application to ${jobTitle} at ${companyName}`,
    html,
    text: `Hi ${firstName},\n\nTalendro tried to apply to ${jobTitle} at ${companyName} but hit a CAPTCHA that needs your help.\n\nComplete the application here: ${applyUrl}\n\nYour cover letter:\n${coverLetterSnapshot || '(not available)'}`,
  });
}

// ─── Exports ────────────────────────────────────────────────────────────────────────────────

export default {
  sendApplicationConfirmation,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendApplicationFailed,
  sendQuotaWarning,
  sendDocumentsReady,
  sendRareRoleAlert,
  sendWeeklyDigest,
  sendCaptchaBlockedNotification,
};