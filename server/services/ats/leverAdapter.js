/**
 * ats/leverAdapter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lever ATS Adapter — Two-layer application strategy:
 *
 *   Layer 1 (preferred): Lever Postings API
 *     - Lever exposes a public Apply API endpoint: POST /apply
 *     - Completely CAPTCHA-free for most postings
 *
 *   Layer 2 (fallback): Stealth browser automation
 *     - Anti-detection fingerprinting (stealthBrowser.js)
 *     - Integrated CAPTCHA solving via CapSolver (captchaSolver.js)
 *     - Human-like typing delays
 *     - Lever uses data-qa attributes for reliable field targeting
 *
 *   Layer 3 (final fallback): captcha_blocked status
 *     - User notified via email with direct link to complete manually
 *
 * Lever forms: https://jobs.lever.co/{company}/{jobId}/apply
 * ─────────────────────────────────────────────────────────────────────────────
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { launchStealthBrowser, humanDelay, humanType, detectCaptcha } from './stealthBrowser.js';
import { autoSolveCaptcha } from './captchaSolver.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function writeTempFile(content, filename) {
  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, `talendro_${Date.now()}_${filename}`);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}
function cleanupTempFile(filePath) {
  try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
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
  if (q.includes('authorized') || q.includes('work in the us') || q.includes('eligible to work')) return s2.workAuth === 'Yes' ? 'Yes' : 'No';
  if (q.includes('sponsorship') || q.includes('visa')) return s2.sponsorNow === 'Yes' ? 'Yes' : 'No';
  if (q.includes('salary') || q.includes('compensation') || q.includes('pay')) return s8.salaryMin || '';
  if (q.includes('start date') || q.includes('available')) return s8.startDate || '';
  if (q.includes('relocate') || q.includes('relocation')) return s8.relocate === 'Yes' ? 'Yes' : 'No';
  if (q.includes('linkedin')) return s1.linkedin || '';
  if (q.includes('website') || q.includes('portfolio')) return s1.website || '';
  if (q.includes('github')) return s1.github || '';
  if (q.includes('veteran') || q.includes('military')) return 'I am not a veteran';
  if (q.includes('disability') || q.includes('disabled')) return 'I do not wish to self-identify';
  if (q.includes('gender') || q.includes('race') || q.includes('ethnicity')) return 'I do not wish to self-identify';
  return null;
}

/**
 * Parse Lever job URL to extract company slug and job ID.
 * Supports: https://jobs.lever.co/{company}/{jobId}/apply
 *           https://jobs.lever.co/{company}/{jobId}
 */
function parseLeverUrl(applyUrl) {
  try {
    const url = new URL(applyUrl);
    if (!url.hostname.includes('lever.co')) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    // parts: [company, jobId] or [company, jobId, 'apply']
    if (parts.length >= 2) {
      return { company: parts[0], jobId: parts[1] };
    }
    return null;
  } catch (_) {
    return null;
  }
}

// ─── Layer 1: Lever Postings API ─────────────────────────────────────────────
async function applyViaApi({ user, jobDoc, applyUrl, tailoredResume, coverLetter }) {
  const parsed = parseLeverUrl(applyUrl);
  if (!parsed) return { success: false, error: 'Could not parse Lever URL', fallback: true };

  const { company, jobId } = parsed;
  console.log(`[leverAdapter] Layer 1 — API apply: ${company}/${jobId}`);

  const { firstName, lastName } = getUserName(user);
  const email    = user.onboardingData?.s1?.email || user.email || '';
  const phone    = user.onboardingData?.s1?.phone || user.phone || '';
  const linkedin = user.onboardingData?.s1?.linkedin || user.onboardingData?.s8?.linkedinUrl || '';
  const website  = user.onboardingData?.s1?.website || '';
  const currentCompany = user.onboardingData?.s3?.entries?.[0]?.company || '';

  const resumeFilePath = await writeTempFile(tailoredResume, 'resume.txt');

  const form = new FormData();
  form.append('name', `${firstName} ${lastName}`.trim());
  form.append('email', email);
  form.append('phone', phone);
  if (currentCompany) form.append('org', currentCompany);
  if (linkedin) form.append('urls[LinkedIn]', linkedin);
  if (website)  form.append('urls[Other]', website);
  form.append('resume', fs.createReadStream(resumeFilePath), {
    filename: `${firstName}_${lastName}_Resume.txt`,
    contentType: 'text/plain',
  });
  form.append('comments', coverLetter);

  try {
    const submitUrl = `https://api.lever.co/v0/postings/${company}/${jobId}/apply`;
    const res = await fetch(submitUrl, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
      timeout: 30000,
    });
    cleanupTempFile(resumeFilePath);

    if (res.ok || res.status === 200 || res.status === 201) {
      console.log(`[leverAdapter] ✅ API apply submitted: ${company}/${jobId}`);
      return { success: true, method: 'lever_api' };
    }
    const body = await res.text().catch(() => '');
    console.warn(`[leverAdapter] API returned ${res.status}: ${body.slice(0, 200)}`);
    return { success: false, error: `Lever API returned ${res.status}`, fallback: true };
  } catch (err) {
    cleanupTempFile(resumeFilePath);
    console.error('[leverAdapter] API error:', err.message);
    return { success: false, error: err.message, fallback: true };
  }
}

// ─── Layer 2: Stealth Browser Apply ──────────────────────────────────────────
async function applyViaBrowser({ user, jobDoc, applyUrl, tailoredResume, coverLetter }) {
  console.log(`[leverAdapter] Layer 2 — stealth browser: ${applyUrl}`);
  let browser, resumePath;
  try {
    const stealth = await launchStealthBrowser();
    browser = stealth.browser;
    const page = stealth.page;

    // Ensure we're on the /apply page
    const applyPageUrl = applyUrl.endsWith('/apply') ? applyUrl : `${applyUrl.replace(/\/$/, '')}/apply`;
    await humanDelay(500, 1500);
    await page.goto(applyPageUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await humanDelay(800, 2000);

    // CAPTCHA check
    let captchaType = await detectCaptcha(page);
    if (captchaType) {
      console.log(`[leverAdapter] CAPTCHA detected (${captchaType}) — attempting auto-solve`);
      const solveResult = await autoSolveCaptcha(page, captchaType);
      if (!solveResult.solved) {
        await browser.close();
        return { success: false, captchaBlocked: true, error: `CAPTCHA (${captchaType}) could not be auto-solved. Manual application required.` };
      }
      await humanDelay(1000, 2000);
      captchaType = await detectCaptcha(page);
      if (captchaType) {
        await browser.close();
        return { success: false, captchaBlocked: true, error: `CAPTCHA persists after solve attempt. Manual application required.` };
      }
    }

    const { firstName, lastName } = getUserName(user);
    const fullName = `${firstName} ${lastName}`.trim();
    const email = user.onboardingData?.s1?.email || user.email || '';
    const phone = user.onboardingData?.s1?.phone || user.phone || '';
    const currentCompany = user.onboardingData?.s3?.entries?.[0]?.company || '';
    const linkedinUrl = user.onboardingData?.s1?.linkedin || user.onboardingData?.s8?.linkedinUrl || '';

    // Lever uses data-qa attributes for reliable field targeting
    const nameField = page.locator('[data-qa="name-input"], input[name="name"]').first();
    if (await nameField.count() > 0) { await humanType(nameField, fullName); await humanDelay(200, 600); }

    const emailField = page.locator('[data-qa="email-input"], input[name="email"], input[type="email"]').first();
    if (await emailField.count() > 0) { await humanType(emailField, email); await humanDelay(200, 600); }

    const phoneField = page.locator('[data-qa="phone-input"], input[name="phone"], input[type="tel"]').first();
    if (await phoneField.count() > 0) { await humanType(phoneField, phone); await humanDelay(200, 600); }

    if (currentCompany) {
      const orgField = page.locator('[data-qa="org-input"], input[name="org"]').first();
      if (await orgField.count() > 0) { await humanType(orgField, currentCompany); await humanDelay(200, 500); }
    }

    if (linkedinUrl) {
      const linkedinField = page.locator('[data-qa="linkedin-input"], input[name*="linkedin"]').first();
      if (await linkedinField.count() > 0) { await humanType(linkedinField, linkedinUrl); await humanDelay(200, 500); }
    }

    resumePath = await writeTempFile(tailoredResume, 'resume.txt');
    const resumeInput = page.locator('[data-qa="resume-input"], input[type="file"][name*="resume"]').first();
    if (await resumeInput.count() > 0) { await resumeInput.setInputFiles(resumePath); await humanDelay(500, 1200); }

    const additionalInfo = page.locator('[data-qa="additional-information"], textarea[name*="comments"], textarea[name*="cover"]').first();
    if (await additionalInfo.count() > 0) { await additionalInfo.fill(coverLetter); await humanDelay(300, 800); }

    // Custom questions
    const customCards = await page.locator('.application-question, [data-qa*="question"]').all();
    for (const card of customCards) {
      try {
        const label = await card.locator('label, .question-label').first().textContent().catch(() => '');
        const answer = answerCustomQuestion(label || '', user);
        if (!answer) continue;
        const textInput = card.locator('input[type="text"]').first();
        if (await textInput.count() > 0) { await humanType(textInput, answer); await humanDelay(150, 400); continue; }
        const textarea = card.locator('textarea').first();
        if (await textarea.count() > 0) { await textarea.fill(answer); await humanDelay(150, 400); continue; }
        const select = card.locator('select').first();
        if (await select.count() > 0) {
          const options = await select.locator('option').allTextContents();
          const match = options.find(o => o.toLowerCase().includes(answer.toLowerCase()));
          if (match) { await select.selectOption({ label: match }); await humanDelay(150, 400); }
        }
      } catch (e) { console.warn('[leverAdapter] Custom question error (non-fatal):', e.message); }
    }

    // Pre-submit CAPTCHA check
    const preSubmitCaptcha = await detectCaptcha(page);
    if (preSubmitCaptcha) {
      const solveResult = await autoSolveCaptcha(page, preSubmitCaptcha);
      if (!solveResult.solved) {
        await browser.close(); cleanupTempFile(resumePath);
        return { success: false, captchaBlocked: true, error: `Pre-submit CAPTCHA could not be solved. Manual application required.` };
      }
      await humanDelay(1000, 2000);
    }

    const submitButton = page.locator(
      '[data-qa="submit-application-button"], button[type="submit"], button:has-text("Submit Application"), button:has-text("Apply")'
    ).first();
    if (await submitButton.count() === 0) {
      await browser.close(); cleanupTempFile(resumePath);
      return { success: false, error: 'Submit button not found on Lever form.' };
    }

    await humanDelay(500, 1500);
    await submitButton.click();

    try {
      await page.waitForSelector('[data-qa="thanks-page"], .thanks-page, .confirmation', { timeout: 15000 });
    } catch {
      await page.waitForTimeout(3000);
    }

    const pageContent = await page.content();
    const confirmed = /thank you|application.*submitted|successfully.*applied|we.*received/i.test(pageContent);
    await browser.close(); cleanupTempFile(resumePath);
    console.log(`[leverAdapter] ${confirmed ? '✅' : '⚠️'} Browser apply to ${applyUrl}`);
    return { success: true, method: 'lever_browser', warning: confirmed ? undefined : 'Confirmation text not detected. Application likely submitted.' };

  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    cleanupTempFile(resumePath);
    console.error(`[leverAdapter] Browser apply error:`, err.message);
    return { success: false, error: err.message };
  }
}

// ─── Main Apply Function ──────────────────────────────────────────────────────
async function apply({ user, jobDoc, applyUrl, tailoredResume, coverLetter }) {
  console.log(`[leverAdapter] Starting two-layer apply: ${applyUrl}`);
  // Layer 1: Lever API (CAPTCHA-free)
  const apiResult = await applyViaApi({ user, jobDoc, applyUrl, tailoredResume, coverLetter });
  if (apiResult.success) return apiResult;
  console.log(`[leverAdapter] API layer failed (${apiResult.error}) — trying browser layer`);
  // Layer 2: Stealth browser with CAPTCHA solving
  const browserResult = await applyViaBrowser({ user, jobDoc, applyUrl, tailoredResume, coverLetter });
  if (browserResult.success) return browserResult;
  // Layer 3: captcha_blocked
  if (browserResult.captchaBlocked) {
    console.warn(`[leverAdapter] All layers failed — CAPTCHA blocked: ${applyUrl}`);
    return { success: false, captchaBlocked: true, error: browserResult.error || 'Application blocked by CAPTCHA. Please complete manually.' };
  }
  return { success: false, error: browserResult.error || 'All application layers failed.' };
}

export default { apply };
