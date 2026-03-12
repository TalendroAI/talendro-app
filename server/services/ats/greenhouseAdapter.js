/**
 * ats/greenhouseAdapter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Greenhouse ATS Adapter — Three-layer application strategy:
 *
 *   Layer 1 (preferred): Greenhouse Job Board API
 *     - Completely CAPTCHA-free
 *     - Submits directly to Greenhouse's backend
 *
 *   Layer 2 (fallback): Stealth browser automation
 *     - Anti-detection fingerprinting (stealthBrowser.js)
 *     - Integrated CAPTCHA solving via CapSolver (captchaSolver.js)
 *     - Human-like typing delays and mouse movement
 *
 *   Layer 3 (final fallback): captcha_blocked status
 *     - User notified via email with direct link to complete manually
 *
 * Greenhouse forms: https://boards.greenhouse.io/{company}/jobs/{id}
 * ─────────────────────────────────────────────────────────────────────────────
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { applyViaApi } from './greenhouseApiAdapter.js';
import { launchStealthBrowser, humanDelay, humanType, detectCaptcha } from './stealthBrowser.js';
import { autoSolveCaptcha } from './captchaSolver.js';
import iqaService from '../iqaService.js';

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
// Fast-path answers for structured/factual questions.
// Returns null for open-ended questions — those are handled by the IQA service.
function answerCustomQuestion(questionText, user) {
  const q = questionText.toLowerCase();
  const s1 = user.onboardingData?.s1 || {};
  const s2 = user.onboardingData?.s2 || {};
  const s8 = user.onboardingData?.s8 || {};
  if (q.includes('authorized') || q.includes('work in the us') || q.includes('eligible to work')) return s2.workAuth === 'Yes' ? 'Yes' : 'No';
  if (q.includes('sponsorship') || q.includes('visa')) return s2.sponsorNow === 'Yes' ? 'Yes' : 'No';
  if (q.includes('salary') || q.includes('compensation') || q.includes('pay')) return s8.salaryMin ? String(s8.salaryMin) : null;
  if (q.includes('start date') || q.includes('available')) return s8.startDate || null;
  if (q.includes('relocate') || q.includes('relocation')) return s8.relocate === 'Yes' ? 'Yes' : 'No';
  if (q.includes('linkedin')) return s1.linkedin || null;
  if (q.includes('website') || q.includes('portfolio')) return s1.website || null;
  if (q.includes('github')) return s1.github || null;
  if (q.includes('veteran') || q.includes('military')) return 'I am not a veteran';
  if (q.includes('disability') || q.includes('disabled')) return 'I do not wish to self-identify';
  if (q.includes('gender') || q.includes('race') || q.includes('ethnicity')) return 'I do not wish to self-identify';
  return null; // null = hand off to IQA service for open-ended questions
}

async function applyViaBrowser({ user, jobDoc, applyUrl, tailoredResume, coverLetter }) {
  console.log(`[greenhouseAdapter] Layer 2 — stealth browser: ${applyUrl}`);
  let browser, resumePath, coverLetterPath;
  try {
    const stealth = await launchStealthBrowser();
    browser = stealth.browser;
    const page = stealth.page;
    await humanDelay(500, 1500);
    await page.goto(applyUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await humanDelay(800, 2000);
    let captchaType = await detectCaptcha(page);
    if (captchaType) {
      console.log(`[greenhouseAdapter] CAPTCHA detected (${captchaType}) — attempting auto-solve`);
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
    const email = user.onboardingData?.s1?.email || user.email || '';
    const phone = user.onboardingData?.s1?.phone || user.phone || '';
    const firstNameField = page.locator('input[name="first_name"], input[id*="first_name"], input[placeholder*="First"]').first();
    if (await firstNameField.count() > 0) { await humanType(firstNameField, firstName); await humanDelay(200, 600); }
    const lastNameField = page.locator('input[name="last_name"], input[id*="last_name"], input[placeholder*="Last"]').first();
    if (await lastNameField.count() > 0) { await humanType(lastNameField, lastName); await humanDelay(200, 600); }
    const emailField = page.locator('input[name="email"], input[type="email"]').first();
    if (await emailField.count() > 0) { await humanType(emailField, email); await humanDelay(200, 600); }
    const phoneField = page.locator('input[name="phone"], input[type="tel"]').first();
    if (await phoneField.count() > 0) { await humanType(phoneField, phone); await humanDelay(200, 600); }
    const linkedinUrl = user.onboardingData?.s1?.linkedin || user.onboardingData?.s8?.linkedinUrl || '';
    if (linkedinUrl) {
      const linkedinField = page.locator('input[name*="linkedin"], input[placeholder*="LinkedIn"]').first();
      if (await linkedinField.count() > 0) { await humanType(linkedinField, linkedinUrl); await humanDelay(200, 500); }
    }
    resumePath = await writeTempFile(tailoredResume, 'resume.txt');
    const resumeInput = page.locator('input[type="file"][name*="resume"], input[type="file"][id*="resume"]').first();
    if (await resumeInput.count() > 0) { await resumeInput.setInputFiles(resumePath); await humanDelay(500, 1200); }
    const coverLetterTextarea = page.locator('textarea[name*="cover_letter"], textarea[id*="cover_letter"]').first();
    if (await coverLetterTextarea.count() > 0) {
      await coverLetterTextarea.fill(coverLetter); await humanDelay(300, 800);
    } else {
      coverLetterPath = await writeTempFile(coverLetter, 'cover_letter.txt');
      const coverLetterInput = page.locator('input[type="file"][name*="cover_letter"]').first();
      if (await coverLetterInput.count() > 0) { await coverLetterInput.setInputFiles(coverLetterPath); await humanDelay(300, 800); }
    }
    // Custom questions: fast-path for structured answers, IQA for open-ended ones.
    const customQuestions = await page.locator('.custom-question, [class*="custom_field"], [data-field]').all();
    for (const questionEl of customQuestions) {
      try {
        const label = await questionEl.locator('label').first().textContent().catch(() => '');
        const labelText = (label || '').trim();
        if (!labelText) continue;

        // Try fast-path first (work auth, salary, LinkedIn, etc.)
        let answer = answerCustomQuestion(labelText, user);

        // If fast-path returns null, use IQA for open-ended questions
        if (answer === null) {
          const iqaResult = await iqaService.answerQuestion({
            question: labelText,
            fieldType: 'textarea',
            user,
            jobDoc,
          }).catch(() => ({ classification: 'error', answer: null }));
          if (iqaResult.classification === 'answerable' && iqaResult.answer) {
            answer = iqaResult.answer;
            console.log(`[greenhouseAdapter] IQA answered: "${labelText.slice(0, 60)}"`);
          }
        }

        if (!answer) continue;

        const textInput = questionEl.locator('input[type="text"], input[type="number"]').first();
        if (await textInput.count() > 0) { await humanType(textInput, answer); await humanDelay(150, 400); continue; }
        const textarea = questionEl.locator('textarea').first();
        if (await textarea.count() > 0) { await textarea.fill(answer); await humanDelay(150, 400); continue; }
        const select = questionEl.locator('select').first();
        if (await select.count() > 0) {
          const options = await select.locator('option').allTextContents();
          const matchingOption = options.find(o => o.toLowerCase().includes(answer.toLowerCase()));
          if (matchingOption) { await select.selectOption({ label: matchingOption }); await humanDelay(150, 400); }
        }
      } catch (e) { console.warn('[greenhouseAdapter] Custom question error (non-fatal):', e.message); }
    }
    const requiredCheckboxes = await page.locator('input[type="checkbox"][required]').all();
    for (const checkbox of requiredCheckboxes) {
      const isChecked = await checkbox.isChecked();
      if (!isChecked) { await checkbox.check(); await humanDelay(100, 300); }
    }
    const preSubmitCaptcha = await detectCaptcha(page);
    if (preSubmitCaptcha) {
      const solveResult = await autoSolveCaptcha(page, preSubmitCaptcha);
      if (!solveResult.solved) {
        await browser.close(); cleanupTempFile(resumePath); cleanupTempFile(coverLetterPath);
        return { success: false, captchaBlocked: true, error: `Pre-submit CAPTCHA could not be solved. Manual application required.` };
      }
      await humanDelay(1000, 2000);
    }
    const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Submit Application"), button:has-text("Apply")').first();
    if (await submitButton.count() === 0) {
      await browser.close(); cleanupTempFile(resumePath); cleanupTempFile(coverLetterPath);
      return { success: false, error: 'Submit button not found on Greenhouse form.' };
    }
    await humanDelay(500, 1500);
    await submitButton.click();
    try { await page.waitForURL(/thank|confirm|success|submitted/i, { timeout: 15000 }); } catch { await page.waitForTimeout(3000); }
    const pageContent = await page.content();
    const confirmed = /thank you|application.*submitted|successfully.*applied|we.*received/i.test(pageContent);
    await browser.close(); cleanupTempFile(resumePath); cleanupTempFile(coverLetterPath);
    console.log(`[greenhouseAdapter] ${confirmed ? '✅' : '⚠️'} Browser apply to ${applyUrl}`);
    return { success: true, method: 'greenhouse_browser', warning: confirmed ? undefined : 'Form submitted but confirmation text not detected. Application likely submitted.' };
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    cleanupTempFile(resumePath); cleanupTempFile(coverLetterPath);
    console.error(`[greenhouseAdapter] Browser apply error:`, err.message);
    return { success: false, error: err.message };
  }
}

async function apply({ user, jobDoc, applyUrl, tailoredResume, coverLetter }) {
  console.log(`[greenhouseAdapter] Starting three-layer apply: ${applyUrl}`);
  // Layer 1: API (CAPTCHA-free)
  const apiResult = await applyViaApi({ user, jobDoc, applyUrl, tailoredResume, coverLetter });
  if (apiResult.success) return apiResult;
  console.log(`[greenhouseAdapter] API layer failed (${apiResult.error}) — trying browser layer`);
  // Layer 2: Stealth browser with CAPTCHA solving
  const browserResult = await applyViaBrowser({ user, jobDoc, applyUrl, tailoredResume, coverLetter });
  if (browserResult.success) return browserResult;
  // Layer 3: captcha_blocked — surface to user
  if (browserResult.captchaBlocked) {
    console.warn(`[greenhouseAdapter] All layers failed — CAPTCHA blocked: ${applyUrl}`);
    return { success: false, captchaBlocked: true, error: browserResult.error || 'Application blocked by CAPTCHA. Please complete manually.' };
  }
  return { success: false, error: browserResult.error || 'All application layers failed.' };
}

export default { apply };
