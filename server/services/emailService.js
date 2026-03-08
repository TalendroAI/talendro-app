/**
 * emailService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized email service for all transactional emails sent by Talendro.
 *
 * Uses the Resend SDK, which is already installed as a dependency.
 * Resend is preferred over Nodemailer for reliability and deliverability.
 *
 * Required environment variable:
 *   RESEND_API_KEY — obtain from https://resend.com
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO (Task 1.7 — Email Implementation):
 *
 *   1. Add RESEND_API_KEY to your Render environment variables.
 *   2. Add RESEND_API_KEY to render.yaml under envVars.
 *   3. Verify your sending domain in the Resend dashboard.
 *   4. Replace FROM_ADDRESS below with your verified domain email.
 *   5. Implement each method by replacing the stub with:
 *
 *      const { data, error } = await resend.emails.send({
 *        from: FROM_ADDRESS,
 *        to: [toEmail],
 *        subject: '...',
 *        html: buildHtml(...),
 *      });
 *      if (error) throw new Error(error.message);
 *      return data;
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Resend } from 'resend';

// Guard: only initialize Resend when the API key is present.
// Without this guard the server crashes on startup in environments
// where RESEND_API_KEY has not yet been configured.
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const FROM_ADDRESS = process.env.EMAIL_FROM || 'ASAN <noreply@talendro.com>'; // TODO: update with verified domain

/**
 * Send an application confirmation email to the user.
 * Called by applyWorker.js after every successful application submission.
 *
 * @param {Object} params
 * @param {string} params.toEmail    - User's email address
 * @param {string} params.userName   - User's first name
 * @param {string} params.jobTitle   - Title of the job applied to
 * @param {string} params.companyName - Name of the company
 * @param {Date}   params.appliedAt  - Timestamp of submission
 */
async function sendApplicationConfirmation({ toEmail, userName, jobTitle, companyName, appliedAt }) {
  // ── TODO (Task 1.7): Replace stub with Resend implementation ─────────────
  console.warn('[emailService] STUB — sendApplicationConfirmation not yet implemented.');
  console.log(`[emailService] Would send to: ${toEmail} | Job: ${jobTitle} at ${companyName}`);
}

/**
 * Send a welcome email to a new user after account creation.
 * Called by auth.js after successful registration.
 *
 * @param {Object} params
 * @param {string} params.toEmail  - User's email address
 * @param {string} params.userName - User's first name
 */
async function sendWelcomeEmail({ toEmail, userName }) {
  // ── TODO (Task 1.7): Replace stub with Resend implementation ─────────────
  console.warn('[emailService] STUB — sendWelcomeEmail not yet implemented.');
}

/**
 * Send an email verification link to a new user.
 * Called by auth.js during registration.
 *
 * @param {Object} params
 * @param {string} params.toEmail           - User's email address
 * @param {string} params.userName          - User's first name
 * @param {string} params.verificationToken - JWT or UUID verification token
 */
async function sendVerificationEmail({ toEmail, userName, verificationToken }) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  // ── TODO (Task 1.7): Replace stub with Resend implementation ─────────────
  console.warn('[emailService] STUB — sendVerificationEmail not yet implemented.');
  console.log(`[emailService] Verification URL would be: ${verifyUrl}`);
}

/**
 * Send a password reset email.
 *
 * @param {Object} params
 * @param {string} params.toEmail    - User's email address
 * @param {string} params.userName   - User's first name
 * @param {string} params.resetToken - Password reset token
 */
async function sendPasswordResetEmail({ toEmail, userName, resetToken }) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  // ── TODO (Task 1.7): Replace stub with Resend implementation ─────────────
  console.warn('[emailService] STUB — sendPasswordResetEmail not yet implemented.');
  console.log(`[emailService] Reset URL would be: ${resetUrl}`);
}

export default {
  sendApplicationConfirmation,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
