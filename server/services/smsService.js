/**
 * smsService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * SMS notification service for Talendro.
 *
 * Used exclusively for high-urgency, time-sensitive alerts that must reach
 * the subscriber immediately — specifically Exceptionally Rare role detections.
 *
 * Uses the Twilio API for reliable SMS delivery.
 *
 * Required environment variables:
 *   TWILIO_ACCOUNT_SID  — Twilio Account SID
 *   TWILIO_AUTH_TOKEN   — Twilio Auth Token
 *   TWILIO_FROM_NUMBER  — Twilio phone number (e.g., "+18005551234")
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Twilio client (lazy-initialized to avoid crash if env vars are missing) ──
let twilioClient = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.warn('[smsService] Twilio credentials not configured — SMS alerts disabled.');
    return null;
  }

  // Dynamic import to avoid hard dependency if Twilio is not installed
  try {
    const twilio = require('twilio');
    twilioClient = twilio(accountSid, authToken);
    return twilioClient;
  } catch (err) {
    console.error('[smsService] Twilio package not installed. Run: npm install twilio');
    return null;
  }
}

const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || '';

// ─────────────────────────────────────────────────────────────────────────────
// Core send function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send an SMS message to a subscriber.
 *
 * @param {object} params
 * @param {string} params.to    — Subscriber's phone number in E.164 format (e.g., "+14075551234")
 * @param {string} params.body  — Message body (max 160 chars for single SMS)
 * @returns {Promise<object|null>}
 */
async function sendSms({ to, body }) {
  const client = getTwilioClient();

  if (!client) {
    console.warn(`[smsService] SMS skipped (no client): ${body}`);
    return null;
  }

  if (!to) {
    console.warn('[smsService] SMS skipped: no phone number provided for subscriber.');
    return null;
  }

  try {
    const message = await client.messages.create({
      from: FROM_NUMBER,
      to,
      body,
    });
    console.log(`[smsService] SMS sent to ${to} — SID: ${message.sid}`);
    return message;
  } catch (err) {
    console.error(`[smsService] Failed to send SMS to ${to}:`, err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Exceptionally Rare Role Alert
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sent immediately when an Exceptionally Rare role is detected.
 * This is the highest-urgency notification in the system.
 *
 * @param {object} params
 * @param {string} params.toPhone      — Subscriber phone in E.164 format
 * @param {string} params.userName     — First name for personalization
 * @param {string} params.jobTitle     — Role title
 * @param {string} params.companyName  — Hiring company
 * @param {string} params.location     — Role location
 * @param {string} params.postedAgo    — e.g. "47 minutes ago"
 * @param {string} params.dashboardUrl — Direct link to the subscriber's dashboard
 * @param {boolean} params.applied     — Whether Talendro applied automatically
 */
async function sendExceptionalRoleAlert({
  toPhone,
  userName,
  jobTitle,
  companyName,
  location,
  postedAgo,
  dashboardUrl,
  applied,
}) {
  const actionLine = applied
    ? 'Talendro applied automatically. Check your dashboard.'
    : 'Location mismatch — NOT applied. Review NOW.';

  // Keep under 160 chars for single-segment delivery
  const body =
    `⚡ TALENDRO ALERT: Chief Talent Acquisition Officer roles appear <5x/year.\n` +
    `${jobTitle} @ ${companyName} (${location}) — ${postedAgo}\n` +
    `${actionLine}\n` +
    `${dashboardUrl}`;

  return sendSms({ to: toPhone, body });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Rare Role Alert (lower urgency — single SMS, no urgency language)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sent when a Rare (but not Exceptionally Rare) role is detected.
 *
 * @param {object} params
 * @param {string} params.toPhone
 * @param {string} params.jobTitle
 * @param {string} params.companyName
 * @param {string} params.postedAgo
 * @param {string} params.dashboardUrl
 * @param {boolean} params.applied
 */
async function sendRareRoleSmsAlert({
  toPhone,
  jobTitle,
  companyName,
  postedAgo,
  dashboardUrl,
  applied,
}) {
  const actionLine = applied
    ? 'Applied automatically.'
    : 'Location hold — review on dashboard.';

  const body =
    `🔔 Talendro: Rare role detected.\n` +
    `${jobTitle} @ ${companyName} — ${postedAgo}\n` +
    `${actionLine} ${dashboardUrl}`;

  return sendSms({ to: toPhone, body });
}

// ────────────────────────────────────────────────────────────────────────────────
// 3. CAPTCHA Blocked Alert (with portal credentials)
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Sent when an application is blocked by a CAPTCHA that Talendro cannot solve.
 * Includes the user's portal credentials so they can log in and complete the
 * application manually in under two minutes.
 *
 * Sent as two sequential SMS messages for readability:
 *   Message 1: Alert + job details + direct apply link
 *   Message 2: Portal login credentials
 *
 * @param {object} params
 * @param {string} params.toPhone        — User's phone in E.164 format
 * @param {string} params.userName       — First name
 * @param {string} params.jobTitle       — Job title
 * @param {string} params.companyName    — Company name
 * @param {string} params.applyUrl       — Direct link to the application
 * @param {string} params.portalEmail    — Email to use when logging into the portal
 * @param {string} params.portalPassword — Portal password generated by Talendro
 */
async function sendCaptchaBlockedSms({
  toPhone,
  userName,
  jobTitle,
  companyName,
  applyUrl,
  portalEmail,
  portalPassword,
}) {
  const firstName = (userName || 'there').split(' ')[0];

  // Message 1: Alert and direct link
  const alertBody =
    `⚠️ Talendro: Action needed, ${firstName}.\n` +
    `Applied to ${jobTitle} @ ${companyName} but hit a CAPTCHA.\n` +
    `Complete it here: ${applyUrl}`;

  // Message 2: Credentials (separate message for easy copy-paste)
  const credBody = portalPassword
    ? `Your Talendro portal login:\nEmail: ${portalEmail}\nPassword: ${portalPassword}\n(Use these if the site asks you to create or log into an account.)`
    : `Your Talendro portal login:\nEmail: ${portalEmail}\n(Use your Talendro password if the site asks you to log in.)`;

  await sendSms({ to: toPhone, body: alertBody });
  await sendSms({ to: toPhone, body: credBody });
}

// ────────────────────────────────────────────────────────────────────────────────
// Exports
// ────────────────────────────────────────────────────────────────────────────────

export default {
  sendSms,
  sendExceptionalRoleAlert,
  sendRareRoleSmsAlert,
  sendCaptchaBlockedSms,
};