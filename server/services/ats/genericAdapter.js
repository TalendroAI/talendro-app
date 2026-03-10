/**
 * ats/genericAdapter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generic ATS Adapter — Fallback for unknown or unsupported ATS platforms.
 *
 * Uses best-effort heuristics to fill in application forms by targeting
 * common field name patterns that appear across most ATS platforms.
 * Handles a significant percentage of simple application forms.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function writeTempFile(content, filename) {
  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, `talendro_${Date.now()}_${filename}`);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

function cleanupTempFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {}
}

function getUserName(user) {
  const firstName = user.onboardingData?.s1?.firstName || user.firstName || (user.name || '').split(' ')[0] || '';
  const lastName  = user.onboardingData?.s1?.lastName  || user.lastName  || (user.name || '').split(' ').slice(1).join(' ') || '';
  return { firstName, lastName };
}

/**
 * Try to fill a field using multiple selector patterns.
 * Returns true if a field was found and filled.
 */
async function tryFill(page, selectors, value) {
  if (!value) return false;
  for (const selector of selectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.count() > 0 && await el.isVisible()) {
        await el.fill(value);
        return true;
      }
    } catch (e) {}
  }
  return false;
}

/**
 * Try to upload a file using multiple selector patterns.
 */
async function tryUpload(page, selectors, filePath) {
  for (const selector of selectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.count() > 0) {
        await el.setInputFiles(filePath);
        return true;
      }
    } catch (e) {}
  }
  return false;
}

// ─── Main Apply Function ──────────────────────────────────────────────────────

/**
 * Apply to a job posting using generic form-filling heuristics.
 * @param {Object} params
 * @param {Object} params.user           - Full user document from MongoDB
 * @param {Object} params.jobDoc         - Full job document from MongoDB
 * @param {string} params.applyUrl       - Direct URL to the application form
 * @param {string} params.tailoredResume - AI-tailored resume text for this job
 * @param {string} params.coverLetter    - AI-generated cover letter for this job
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function apply({ user, jobDoc, applyUrl, tailoredResume, coverLetter }) {
  console.log(`[genericAdapter] Attempting generic apply to: ${applyUrl}`);

  let browser;
  let resumePath;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    await page.goto(applyUrl, { waitUntil: 'networkidle', timeout: 30000 });

    const pageTitle = await page.title();
    if (pageTitle.toLowerCase().includes('access denied') || pageTitle.toLowerCase().includes('captcha')) {
      await browser.close();
      return { success: false, error: 'Access denied or CAPTCHA detected. Manual application required.' };
    }

    const { firstName, lastName } = getUserName(user);
    const email = user.onboardingData?.s1?.email || user.email || '';
    const phone = user.onboardingData?.s1?.phone || user.phone || '';

    // ── First name ────────────────────────────────────────────────────────────
    await tryFill(page, [
      'input[name*="first_name"]', 'input[name*="firstName"]',
      'input[id*="first_name"]', 'input[id*="firstName"]',
      'input[placeholder*="First name"]', 'input[placeholder*="First Name"]',
      'input[autocomplete="given-name"]',
    ], firstName);

    // ── Last name ─────────────────────────────────────────────────────────────
    await tryFill(page, [
      'input[name*="last_name"]', 'input[name*="lastName"]',
      'input[id*="last_name"]', 'input[id*="lastName"]',
      'input[placeholder*="Last name"]', 'input[placeholder*="Last Name"]',
      'input[autocomplete="family-name"]',
    ], lastName);

    // ── Full name (fallback if separate first/last not found) ─────────────────
    await tryFill(page, [
      'input[name="name"]', 'input[name="full_name"]', 'input[name="fullName"]',
      'input[id="name"]', 'input[placeholder*="Full name"]', 'input[placeholder*="Full Name"]',
      'input[autocomplete="name"]',
    ], `${firstName} ${lastName}`.trim());

    // ── Email ─────────────────────────────────────────────────────────────────
    await tryFill(page, [
      'input[type="email"]', 'input[name*="email"]',
      'input[id*="email"]', 'input[placeholder*="email"]',
      'input[placeholder*="Email"]', 'input[autocomplete="email"]',
    ], email);

    // ── Phone ─────────────────────────────────────────────────────────────────
    await tryFill(page, [
      'input[type="tel"]', 'input[name*="phone"]',
      'input[id*="phone"]', 'input[placeholder*="phone"]',
      'input[placeholder*="Phone"]', 'input[autocomplete="tel"]',
    ], phone);

    // ── LinkedIn URL ──────────────────────────────────────────────────────────
    const linkedinUrl = user.onboardingData?.s1?.linkedin || user.onboardingData?.s8?.linkedinUrl || '';
    if (linkedinUrl) {
      await tryFill(page, [
        'input[name*="linkedin"]', 'input[id*="linkedin"]',
        'input[placeholder*="LinkedIn"]', 'input[placeholder*="linkedin"]',
      ], linkedinUrl);
    }

    // ── Website / Portfolio ───────────────────────────────────────────────────
    const website = user.onboardingData?.s1?.website || '';
    if (website) {
      await tryFill(page, [
        'input[name*="website"]', 'input[name*="portfolio"]',
        'input[id*="website"]', 'input[placeholder*="Website"]',
        'input[placeholder*="Portfolio"]',
      ], website);
    }

    // ── Resume upload ─────────────────────────────────────────────────────────
    resumePath = await writeTempFile(tailoredResume, 'resume.txt');
    await tryUpload(page, [
      'input[type="file"][name*="resume"]', 'input[type="file"][id*="resume"]',
      'input[type="file"][accept*=".pdf"]', 'input[type="file"][accept*=".doc"]',
      'input[type="file"]',
    ], resumePath);

    // ── Cover letter ──────────────────────────────────────────────────────────
    await tryFill(page, [
      'textarea[name*="cover"]', 'textarea[id*="cover"]',
      'textarea[name*="letter"]', 'textarea[placeholder*="cover letter"]',
      'textarea[placeholder*="Cover letter"]',
      'textarea[name*="message"]', 'textarea[name*="additional"]',
    ], coverLetter);

    // ── Required checkboxes ───────────────────────────────────────────────────
    const requiredCheckboxes = await page.locator('input[type="checkbox"][required]').all();
    for (const checkbox of requiredCheckboxes) {
      const isChecked = await checkbox.isChecked();
      if (!isChecked) await checkbox.check().catch(() => {});
    }

    // ── Submit ────────────────────────────────────────────────────────────────
    const submitButton = page.locator(
      'button[type="submit"], input[type="submit"], ' +
      'button:has-text("Submit Application"), button:has-text("Apply Now"), ' +
      'button:has-text("Submit"), button:has-text("Apply")'
    ).first();

    if (await submitButton.count() === 0) {
      await browser.close();
      cleanupTempFile(resumePath);
      return { success: false, error: 'Submit button not found. This form may require manual completion.' };
    }

    await submitButton.click();

    try {
      await page.waitForURL(/thank|confirm|success|submitted|applied/i, { timeout: 15000 });
    } catch {
      await page.waitForTimeout(3000);
    }

    const pageContent = await page.content();
    const confirmed = /thank you|application.*submitted|successfully.*applied|we.*received|confirmation/i.test(pageContent);

    await browser.close();
    cleanupTempFile(resumePath);

    console.log(`[genericAdapter] ${confirmed ? '✅' : '⚠️'} Generic apply to ${applyUrl} ${confirmed ? 'confirmed' : 'submitted (confirmation uncertain)'}`);
    return {
      success: true,
      warning: confirmed ? undefined : 'Form submitted but confirmation text not detected. Application likely submitted.',
    };

  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    cleanupTempFile(resumePath);
    console.error(`[genericAdapter] Error applying to ${applyUrl}:`, err.message);
    return { success: false, error: err.message };
  }
}

export default { apply };
