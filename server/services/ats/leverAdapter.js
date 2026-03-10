/**
 * ats/leverAdapter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lever ATS Adapter.
 * Handles automated application submission to Lever-hosted job postings.
 *
 * Lever application forms follow a consistent structure:
 *   - Standard fields: name, email, phone, org (current company), resume, cover letter
 *   - Custom questions: rendered as individual form fields with data-qa attributes
 *   - LinkedIn URL field (optional)
 *
 * Lever forms are hosted at:
 *   https://jobs.lever.co/{company}/{job-id}/apply
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

function answerCustomQuestion(questionText, user) {
  const q = questionText.toLowerCase();
  const s1 = user.onboardingData?.s1 || {};
  const s2 = user.onboardingData?.s2 || {};
  const s8 = user.onboardingData?.s8 || {};

  if (q.includes('authorized') || q.includes('work in the us')) return s2.workAuth === 'Yes' ? 'Yes' : 'No';
  if (q.includes('sponsorship') || q.includes('visa')) return s2.sponsorNow === 'Yes' ? 'Yes' : 'No';
  if (q.includes('salary') || q.includes('compensation')) return s8.salaryMin || '';
  if (q.includes('start date') || q.includes('available')) return s8.startDate || '';
  if (q.includes('relocate')) return s8.relocate === 'Yes' ? 'Yes' : 'No';
  if (q.includes('linkedin')) return s1.linkedin || '';
  if (q.includes('website') || q.includes('portfolio')) return s1.website || '';
  if (q.includes('github')) return s1.github || '';
  if (q.includes('veteran') || q.includes('military')) return 'I am not a veteran';
  if (q.includes('disability')) return 'I do not wish to self-identify';
  if (q.includes('gender') || q.includes('race') || q.includes('ethnicity')) return 'I do not wish to self-identify';
  return null;
}

// ─── Main Apply Function ──────────────────────────────────────────────────────

/**
 * Apply to a Lever job posting using Playwright.
 * @param {Object} params
 * @param {Object} params.user           - Full user document from MongoDB
 * @param {Object} params.jobDoc         - Full job document from MongoDB
 * @param {string} params.applyUrl       - Direct URL to the Lever application form
 * @param {string} params.tailoredResume - AI-tailored resume text for this job
 * @param {string} params.coverLetter    - AI-generated cover letter for this job
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function apply({ user, jobDoc, applyUrl, tailoredResume, coverLetter }) {
  console.log(`[leverAdapter] Applying to: ${applyUrl}`);

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
    const fullName = `${firstName} ${lastName}`.trim();
    const email = user.onboardingData?.s1?.email || user.email || '';
    const phone = user.onboardingData?.s1?.phone || user.phone || '';

    // ── Lever uses data-qa attributes for reliable field targeting ────────────

    // Full name (Lever uses a single name field)
    const nameField = page.locator('[data-qa="name-input"], input[name="name"]').first();
    if (await nameField.count() > 0) await nameField.fill(fullName);

    // Email
    const emailField = page.locator('[data-qa="email-input"], input[name="email"], input[type="email"]').first();
    if (await emailField.count() > 0) await emailField.fill(email);

    // Phone
    const phoneField = page.locator('[data-qa="phone-input"], input[name="phone"], input[type="tel"]').first();
    if (await phoneField.count() > 0) await phoneField.fill(phone);

    // Current company / org
    const currentCompany = user.onboardingData?.s3?.entries?.[0]?.company || '';
    const orgField = page.locator('[data-qa="org-input"], input[name="org"]').first();
    if (await orgField.count() > 0 && currentCompany) await orgField.fill(currentCompany);

    // LinkedIn URL
    const linkedinUrl = user.onboardingData?.s1?.linkedin || user.onboardingData?.s8?.linkedinUrl || '';
    if (linkedinUrl) {
      const linkedinField = page.locator('[data-qa="linkedin-input"], input[name*="linkedin"]').first();
      if (await linkedinField.count() > 0) await linkedinField.fill(linkedinUrl);
    }

    // ── Upload resume ─────────────────────────────────────────────────────────
    resumePath = await writeTempFile(tailoredResume, 'resume.txt');
    const resumeInput = page.locator('[data-qa="resume-input"], input[type="file"][name*="resume"]').first();
    if (await resumeInput.count() > 0) {
      await resumeInput.setInputFiles(resumePath);
    }

    // ── Cover letter / additional information ─────────────────────────────────
    const additionalInfo = page.locator('[data-qa="additional-information"], textarea[name*="comments"], textarea[name*="cover"]').first();
    if (await additionalInfo.count() > 0) {
      await additionalInfo.fill(coverLetter);
    }

    // ── Handle custom questions ───────────────────────────────────────────────
    const customCards = await page.locator('.application-question, [data-qa*="question"]').all();
    for (const card of customCards) {
      try {
        const label = await card.locator('label, .question-label').first().textContent().catch(() => '');
        const answer = answerCustomQuestion(label || '', user);
        if (!answer) continue;

        const textInput = card.locator('input[type="text"]').first();
        if (await textInput.count() > 0) { await textInput.fill(answer); continue; }

        const textarea = card.locator('textarea').first();
        if (await textarea.count() > 0) { await textarea.fill(answer); continue; }

        const select = card.locator('select').first();
        if (await select.count() > 0) {
          const options = await select.locator('option').allTextContents();
          const match = options.find(o => o.toLowerCase().includes(answer.toLowerCase()));
          if (match) await select.selectOption({ label: match });
        }
      } catch (e) {
        console.warn('[leverAdapter] Custom question error (non-fatal):', e.message);
      }
    }

    // ── Submit ────────────────────────────────────────────────────────────────
    const submitButton = page.locator(
      '[data-qa="submit-application-button"], button[type="submit"], button:has-text("Submit Application"), button:has-text("Apply")'
    ).first();

    if (await submitButton.count() === 0) {
      await browser.close();
      return { success: false, error: 'Submit button not found on Lever form.' };
    }

    await submitButton.click();

    try {
      await page.waitForSelector('[data-qa="thanks-page"], .thanks-page, .confirmation', { timeout: 15000 });
    } catch {
      await page.waitForTimeout(3000);
    }

    const pageContent = await page.content();
    const success = /thank you|application.*submitted|successfully.*applied|we.*received/i.test(pageContent);

    await browser.close();
    cleanupTempFile(resumePath);

    console.log(`[leverAdapter] ${success ? '✅' : '⚠️'} Application to ${applyUrl} ${success ? 'confirmed' : 'submitted (confirmation uncertain)'}`);
    return { success: true, warning: success ? undefined : 'Confirmation text not detected.' };

  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    cleanupTempFile(resumePath);
    console.error(`[leverAdapter] Error applying to ${applyUrl}:`, err.message);
    return { success: false, error: err.message };
  }
}

export default { apply };
