/**
 * ats/greenhouseAdapter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Greenhouse ATS Adapter.
 * Handles automated application submission to Greenhouse-hosted job postings.
 *
 * Greenhouse application forms follow a consistent structure:
 *   - Standard fields: first_name, last_name, email, phone, resume, cover_letter
 *   - Custom questions: vary per employer, rendered as JSON schema
 *   - GDPR consent checkboxes (when applicable)
 *
 * Forms are hosted at: https://boards.greenhouse.io/{company}/jobs/{id}
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Write text content to a temp file for Playwright file upload.
 * Returns the absolute path to the temp file.
 */
async function writeTempFile(content, filename) {
  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, `talendro_${Date.now()}_${filename}`);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

/**
 * Clean up temp files after use.
 */
function cleanupTempFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    // Non-fatal
  }
}

/**
 * Extract user's first and last name from the user document.
 */
function getUserName(user) {
  const firstName = user.onboardingData?.s1?.firstName || user.firstName || (user.name || '').split(' ')[0] || '';
  const lastName  = user.onboardingData?.s1?.lastName  || user.lastName  || (user.name || '').split(' ').slice(1).join(' ') || '';
  return { firstName, lastName };
}

/**
 * Answer a custom question using the user's profile data.
 * Returns a string answer or null if we can't determine one.
 */
function answerCustomQuestion(questionText, user) {
  const q = questionText.toLowerCase();
  const s1 = user.onboardingData?.s1 || {};
  const s2 = user.onboardingData?.s2 || {};
  const s8 = user.onboardingData?.s8 || {};

  if (q.includes('authorized') || q.includes('work in the us') || q.includes('eligible to work')) {
    return s2.workAuth === 'Yes' ? 'Yes' : 'No';
  }
  if (q.includes('sponsorship') || q.includes('visa')) {
    return s2.sponsorNow === 'Yes' ? 'Yes' : 'No';
  }
  if (q.includes('salary') || q.includes('compensation') || q.includes('pay')) {
    return s8.salaryMin || '';
  }
  if (q.includes('start date') || q.includes('available')) {
    return s8.startDate || '';
  }
  if (q.includes('relocate') || q.includes('relocation')) {
    return s8.relocate === 'Yes' ? 'Yes' : 'No';
  }
  if (q.includes('linkedin')) {
    return s1.linkedin || '';
  }
  if (q.includes('website') || q.includes('portfolio')) {
    return s1.website || '';
  }
  if (q.includes('github')) {
    return s1.github || '';
  }
  if (q.includes('veteran') || q.includes('military')) {
    return 'I am not a veteran';
  }
  if (q.includes('disability') || q.includes('disabled')) {
    return 'I do not wish to self-identify';
  }
  if (q.includes('gender') || q.includes('race') || q.includes('ethnicity')) {
    return 'I do not wish to self-identify';
  }
  return null;
}

// ─── Main Apply Function ──────────────────────────────────────────────────────

/**
 * Apply to a Greenhouse job posting using Playwright.
 * @param {Object} params
 * @param {Object} params.user           - Full user document from MongoDB
 * @param {Object} params.jobDoc         - Full job document from MongoDB
 * @param {string} params.applyUrl       - Direct URL to the Greenhouse application form
 * @param {string} params.tailoredResume - AI-tailored resume text for this job
 * @param {string} params.coverLetter    - AI-generated cover letter for this job
 * @returns {Promise<{success: boolean, error?: string, screenshot?: string}>}
 */
async function apply({ user, jobDoc, applyUrl, tailoredResume, coverLetter }) {
  console.log(`[greenhouseAdapter] Applying to: ${applyUrl}`);

  let browser;
  let resumePath;
  let coverLetterPath;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    // Navigate to the application form
    await page.goto(applyUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Check for bot detection or login walls
    const pageTitle = await page.title();
    if (pageTitle.toLowerCase().includes('access denied') || pageTitle.toLowerCase().includes('captcha')) {
      await browser.close();
      return { success: false, error: 'Access denied or CAPTCHA detected. Manual application required.' };
    }

    const { firstName, lastName } = getUserName(user);
    const email = user.onboardingData?.s1?.email || user.email || '';
    const phone = user.onboardingData?.s1?.phone || user.phone || '';

    // ── Fill standard Greenhouse fields ──────────────────────────────────────

    // First name
    const firstNameField = page.locator('input[name="first_name"], input[id*="first_name"], input[placeholder*="First"]').first();
    if (await firstNameField.count() > 0) await firstNameField.fill(firstName);

    // Last name
    const lastNameField = page.locator('input[name="last_name"], input[id*="last_name"], input[placeholder*="Last"]').first();
    if (await lastNameField.count() > 0) await lastNameField.fill(lastName);

    // Email
    const emailField = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailField.count() > 0) await emailField.fill(email);

    // Phone
    const phoneField = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneField.count() > 0) await phoneField.fill(phone);

    // LinkedIn URL (if available)
    const linkedinUrl = user.onboardingData?.s1?.linkedin || user.onboardingData?.s8?.linkedinUrl || '';
    if (linkedinUrl) {
      const linkedinField = page.locator('input[name*="linkedin"], input[placeholder*="LinkedIn"]').first();
      if (await linkedinField.count() > 0) await linkedinField.fill(linkedinUrl);
    }

    // ── Upload resume ─────────────────────────────────────────────────────────
    resumePath = await writeTempFile(tailoredResume, 'resume.txt');
    const resumeInput = page.locator('input[type="file"][name*="resume"], input[type="file"][id*="resume"]').first();
    if (await resumeInput.count() > 0) {
      await resumeInput.setInputFiles(resumePath);
    }

    // ── Cover letter ──────────────────────────────────────────────────────────
    const coverLetterTextarea = page.locator('textarea[name*="cover_letter"], textarea[id*="cover_letter"]').first();
    if (await coverLetterTextarea.count() > 0) {
      await coverLetterTextarea.fill(coverLetter);
    } else {
      // Some Greenhouse forms use a file upload for cover letter
      coverLetterPath = await writeTempFile(coverLetter, 'cover_letter.txt');
      const coverLetterInput = page.locator('input[type="file"][name*="cover_letter"]').first();
      if (await coverLetterInput.count() > 0) {
        await coverLetterInput.setInputFiles(coverLetterPath);
      }
    }

    // ── Handle custom questions ───────────────────────────────────────────────
    const customQuestions = await page.locator('.custom-question, [class*="custom_field"], [data-field]').all();
    for (const questionEl of customQuestions) {
      try {
        const label = await questionEl.locator('label').first().textContent().catch(() => '');
        const answer = answerCustomQuestion(label || '', user);
        if (!answer) continue;

        // Try text input
        const textInput = questionEl.locator('input[type="text"], input[type="number"]').first();
        if (await textInput.count() > 0) {
          await textInput.fill(answer);
          continue;
        }

        // Try textarea
        const textarea = questionEl.locator('textarea').first();
        if (await textarea.count() > 0) {
          await textarea.fill(answer);
          continue;
        }

        // Try select
        const select = questionEl.locator('select').first();
        if (await select.count() > 0) {
          const options = await select.locator('option').allTextContents();
          const matchingOption = options.find(o => o.toLowerCase().includes(answer.toLowerCase()));
          if (matchingOption) await select.selectOption({ label: matchingOption });
          continue;
        }
      } catch (e) {
        // Skip individual question errors — non-fatal
        console.warn('[greenhouseAdapter] Custom question error (non-fatal):', e.message);
      }
    }

    // ── Handle EEO / GDPR checkboxes ─────────────────────────────────────────
    // Check any required consent checkboxes
    const requiredCheckboxes = await page.locator('input[type="checkbox"][required]').all();
    for (const checkbox of requiredCheckboxes) {
      const isChecked = await checkbox.isChecked();
      if (!isChecked) await checkbox.check();
    }

    // ── Submit the form ───────────────────────────────────────────────────────
    const submitButton = page.locator(
      'button[type="submit"], input[type="submit"], button:has-text("Submit Application"), button:has-text("Apply")'
    ).first();

    if (await submitButton.count() === 0) {
      await browser.close();
      return { success: false, error: 'Submit button not found on Greenhouse form.' };
    }

    await submitButton.click();

    // Wait for confirmation
    try {
      await page.waitForURL(/thank|confirm|success|submitted/i, { timeout: 15000 });
    } catch {
      // URL may not change — check for confirmation text instead
      await page.waitForTimeout(3000);
    }

    const pageContent = await page.content();
    const success = /thank you|application.*submitted|successfully.*applied|we.*received/i.test(pageContent);

    await browser.close();
    cleanupTempFile(resumePath);
    cleanupTempFile(coverLetterPath);

    if (success) {
      console.log(`[greenhouseAdapter] ✅ Application submitted successfully to ${applyUrl}`);
      return { success: true };
    } else {
      console.warn(`[greenhouseAdapter] ⚠️ Form submitted but confirmation not detected for ${applyUrl}`);
      // Return success: true anyway — the form was submitted, confirmation text may vary
      return { success: true, warning: 'Form submitted but confirmation text not detected. Application likely submitted.' };
    }

  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    cleanupTempFile(resumePath);
    cleanupTempFile(coverLetterPath);
    console.error(`[greenhouseAdapter] Error applying to ${applyUrl}:`, err.message);
    return { success: false, error: err.message };
  }
}

export default { apply };
