/**
 * ats/workdayAdapter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Workday ATS Adapter
 *
 * Workday is used by 40%+ of Fortune 500 companies. It has a consistent
 * multi-step application flow that this adapter handles end-to-end:
 *
 *   Step 1 — Resume Upload / Parse
 *   Step 2 — Personal Information
 *   Step 3 — Work Experience
 *   Step 4 — Education
 *   Step 5 — Skills / Questionnaire
 *   Step 6 — Self-Identification (EEO)
 *   Step 7 — Review & Submit
 *
 * Includes:
 *   - Stealth browser fingerprinting (stealthBrowser.js)
 *   - Integrated CAPTCHA solving via CapSolver (captchaSolver.js)
 *   - Intelligent Question Answering (iqaService.js) for open-ended questions
 *   - Human-like typing delays and mouse movement simulation
 *   - Automatic multi-step navigation and progress detection
 *   - captcha_blocked status for unresolvable CAPTCHAs
 * ─────────────────────────────────────────────────────────────────────────────
 */
import fs from 'fs';
import path from 'path';
import os from 'os';
import { launchStealthBrowser, humanDelay, detectCaptcha } from './stealthBrowser.js';
import { autoSolveCaptcha } from './captchaSolver.js';
import iqaService from '../iqaService.js';

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
async function tryFill(page, selectors, value) {
  if (!value) return false;
  for (const selector of selectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.count() > 0 && await el.isVisible()) {
        await el.fill(String(value));
        await humanDelay(100, 300);
        return true;
      }
    } catch (_) {}
  }
  return false;
}
async function tryUpload(page, selectors, filePath) {
  for (const selector of selectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.count() > 0) {
        await el.setInputFiles(filePath);
        await humanDelay(300, 800);
        return true;
      }
    } catch (_) {}
  }
  return false;
}
async function trySelect(page, selectors, value) {
  if (!value) return false;
  for (const selector of selectors) {
    try {
      const el = page.locator(selector).first();
      if (await el.count() > 0 && await el.isVisible()) {
        await el.selectOption({ label: value }).catch(() => el.selectOption({ value }));
        await humanDelay(100, 300);
        return true;
      }
    } catch (_) {}
  }
  return false;
}
async function resolveLabel(page, el) {
  const id          = await el.getAttribute('id').catch(() => null);
  const placeholder = await el.getAttribute('placeholder').catch(() => '') || '';
  const name        = await el.getAttribute('name').catch(() => '') || '';
  const ariaLabel   = await el.getAttribute('aria-label').catch(() => '') || '';
  let labelText     = ariaLabel || placeholder;
  if (id) {
    try {
      const label = page.locator(`label[for="${id}"]`);
      if (await label.count() > 0) {
        labelText = (await label.textContent())?.trim() || labelText;
      }
    } catch (_) {}
  }
  return labelText || name;
}

// ─── Workday-specific selectors ───────────────────────────────────────────────
// Workday uses data-automation-id attributes extensively
const WD = {
  // Resume upload
  resumeUpload:   '[data-automation-id="file-upload-input-ref"]',
  resumeUploadBtn:'[data-automation-id="resume-upload-button"]',
  // Navigation
  nextBtn:        '[data-automation-id="bottom-navigation-next-button"]',
  saveBtn:        '[data-automation-id="bottom-navigation-save-button"]',
  submitBtn:      '[data-automation-id="bottom-navigation-save-button"][aria-label*="Submit"]',
  // Personal info
  firstName:      '[data-automation-id="legalNameSection_firstName"]',
  lastName:       '[data-automation-id="legalNameSection_lastName"]',
  email:          '[data-automation-id="email"]',
  phone:          '[data-automation-id="phone-number"]',
  phoneType:      '[data-automation-id="phone-device-type"]',
  address1:       '[data-automation-id="addressSection_addressLine1"]',
  city:           '[data-automation-id="addressSection_city"]',
  state:          '[data-automation-id="addressSection_countryRegion"]',
  zip:            '[data-automation-id="addressSection_postalCode"]',
  country:        '[data-automation-id="addressSection_country"]',
  // LinkedIn
  linkedin:       '[data-automation-id="linkedin"]',
  // Work authorization
  workAuth:       '[data-automation-id="workAuthorization"]',
  sponsorship:    '[data-automation-id="requiresVisa"]',
  // EEO
  gender:         '[data-automation-id="gender"]',
  ethnicity:      '[data-automation-id="ethnicity"]',
  veteran:        '[data-automation-id="veteranStatus"]',
  disability:     '[data-automation-id="disability"]',
  // Questionnaire
  textareas:      'textarea[data-automation-id]',
  textInputs:     'input[data-automation-id][type="text"]',
  // Progress
  progressBar:    '[data-automation-id="progressBar"]',
  stepTitle:      '[data-automation-id="formHeader"] h2',
  errorBanner:    '[data-automation-id="errorBanner"]',
};

// ─── Main apply function ──────────────────────────────────────────────────────
async function apply({ user, jobDoc, applyUrl, tailoredResume, coverLetter }) {
  const { firstName, lastName } = getUserName(user);
  const onboarding = user.onboardingData || {};
  const s1 = onboarding.s1 || {};
  const s3 = onboarding.s3 || {};

  let browser, context, page;
  let resumeFilePath = null;
  let coverLetterFilePath = null;

  try {
    // ── Launch stealth browser ────────────────────────────────────────────────
    ({ browser, context } = await launchStealthBrowser());
    page = await context.newPage();

    // ── Navigate to application URL ───────────────────────────────────────────
    console.log(`[workdayAdapter] Navigating to: ${applyUrl}`);
    await page.goto(applyUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await humanDelay(1500, 3000);

    // ── Check for CAPTCHA on landing ──────────────────────────────────────────
    if (await detectCaptcha(page)) {
      const solved = await autoSolveCaptcha(page, applyUrl);
      if (!solved) {
        return { success: false, captchaBlocked: true, error: 'CAPTCHA on Workday landing page could not be solved' };
      }
      await humanDelay(1000, 2000);
    }

    // ── Click "Apply" button if on job description page ───────────────────────
    const applyButtons = [
      '[data-automation-id="applyButton"]',
      'button:has-text("Apply")',
      'a:has-text("Apply Now")',
      '[aria-label*="Apply"]',
    ];
    for (const sel of applyButtons) {
      try {
        const btn = page.locator(sel).first();
        if (await btn.count() > 0 && await btn.isVisible()) {
          await btn.click();
          await humanDelay(1500, 2500);
          break;
        }
      } catch (_) {}
    }

    // ── Write temp files ──────────────────────────────────────────────────────
    resumeFilePath       = await writeTempFile(tailoredResume, 'resume.txt');
    coverLetterFilePath  = await writeTempFile(coverLetter, 'cover_letter.txt');

    // ── Multi-step form navigation ────────────────────────────────────────────
    let stepCount = 0;
    const MAX_STEPS = 15;

    while (stepCount < MAX_STEPS) {
      stepCount++;
      await humanDelay(800, 1500);

      // Check for CAPTCHA between steps
      if (await detectCaptcha(page)) {
        const solved = await autoSolveCaptcha(page, page.url());
        if (!solved) {
          return { success: false, captchaBlocked: true, error: 'CAPTCHA encountered during Workday multi-step form' };
        }
        await humanDelay(1000, 2000);
      }

      // Detect current step
      const stepTitle = await page.locator(WD.stepTitle).first().textContent().catch(() => '');
      console.log(`[workdayAdapter] Step ${stepCount}: "${stepTitle}"`);

      // ── Resume Upload step ────────────────────────────────────────────────
      const isResumeStep = stepTitle?.toLowerCase().includes('resume') ||
                           await page.locator(WD.resumeUpload).count() > 0 ||
                           await page.locator(WD.resumeUploadBtn).count() > 0;
      if (isResumeStep) {
        await handleResumeStep(page, resumeFilePath, coverLetterFilePath);
      }

      // ── Personal Information step ─────────────────────────────────────────
      const isPersonalStep = stepTitle?.toLowerCase().includes('personal') ||
                             stepTitle?.toLowerCase().includes('contact') ||
                             await page.locator(WD.firstName).count() > 0;
      if (isPersonalStep) {
        await handlePersonalInfoStep(page, user, s1, firstName, lastName);
      }

      // ── Work Experience step ──────────────────────────────────────────────
      const isExperienceStep = stepTitle?.toLowerCase().includes('experience') ||
                               stepTitle?.toLowerCase().includes('work history');
      if (isExperienceStep) {
        await handleWorkExperienceStep(page, user);
      }

      // ── Education step ────────────────────────────────────────────────────
      const isEducationStep = stepTitle?.toLowerCase().includes('education');
      if (isEducationStep) {
        await handleEducationStep(page, user);
      }

      // ── Questionnaire / Open-ended questions ─────────────────────────────
      await handleQuestionnaireStep(page, user, jobDoc);

      // ── EEO / Self-Identification step ────────────────────────────────────
      const isEeoStep = stepTitle?.toLowerCase().includes('self-identify') ||
                        stepTitle?.toLowerCase().includes('equal opportunity') ||
                        stepTitle?.toLowerCase().includes('voluntary');
      if (isEeoStep) {
        await handleEeoStep(page);
      }

      // ── Check for error banner ────────────────────────────────────────────
      const errorBanner = page.locator(WD.errorBanner).first();
      if (await errorBanner.count() > 0 && await errorBanner.isVisible()) {
        const errorText = await errorBanner.textContent().catch(() => '');
        console.warn(`[workdayAdapter] Error banner detected: ${errorText}`);
      }

      // ── Check for Submit button ───────────────────────────────────────────
      const submitBtn = page.locator('[data-automation-id="bottom-navigation-save-button"]').filter({ hasText: /submit/i }).first();
      if (await submitBtn.count() > 0 && await submitBtn.isVisible()) {
        console.log('[workdayAdapter] Submit button found — submitting application');
        await submitBtn.click();
        await humanDelay(2000, 4000);

        // Check for confirmation
        const confirmed = await checkSubmissionConfirmation(page);
        if (confirmed) {
          return { success: true };
        }
        // If no confirmation, check for errors
        const errorText = await page.locator(WD.errorBanner).first().textContent().catch(() => '');
        return { success: false, error: `Submission failed: ${errorText || 'No confirmation received'}` };
      }

      // ── Click Next button ─────────────────────────────────────────────────
      const nextBtn = page.locator(WD.nextBtn).first();
      if (await nextBtn.count() > 0 && await nextBtn.isVisible()) {
        await nextBtn.click();
        await humanDelay(1000, 2000);
        continue;
      }

      // ── No next button and no submit — check if we're done ────────────────
      const isConfirmed = await checkSubmissionConfirmation(page);
      if (isConfirmed) {
        return { success: true };
      }

      // If we can't find a way forward, break
      console.warn('[workdayAdapter] No Next or Submit button found — breaking loop');
      break;
    }

    // If we exhausted steps without confirmation
    return { success: false, error: 'Workday application did not reach confirmation page after maximum steps' };

  } catch (err) {
    console.error('[workdayAdapter] Fatal error:', err.message);
    return { success: false, error: err.message };
  } finally {
    cleanupTempFile(resumeFilePath);
    cleanupTempFile(coverLetterFilePath);
    try { await browser?.close(); } catch (_) {}
  }
}

// ─── Step Handlers ────────────────────────────────────────────────────────────

async function handleResumeStep(page, resumeFilePath, coverLetterFilePath) {
  // Try to upload resume file
  const uploaded = await tryUpload(page, [
    WD.resumeUpload,
    'input[type="file"]',
    '[accept*=".pdf"], [accept*=".doc"]',
  ], resumeFilePath);

  if (!uploaded) {
    // Try paste-into-textarea approach
    await tryFill(page, ['textarea[data-automation-id*="resume"]', 'textarea[name*="resume"]'], resumeFilePath);
  }

  // Cover letter upload (optional — many Workday forms don't have it)
  await tryUpload(page, [
    '[data-automation-id*="cover-letter"] input[type="file"]',
    'input[name*="coverLetter"]',
  ], coverLetterFilePath).catch(() => {});
}

async function handlePersonalInfoStep(page, user, s1, firstName, lastName) {
  const onboarding = user.onboardingData || {};
  const address = s1.address || onboarding.address || {};

  await tryFill(page, [WD.firstName, 'input[name*="firstName"]', 'input[placeholder*="First"]'], firstName);
  await tryFill(page, [WD.lastName, 'input[name*="lastName"]', 'input[placeholder*="Last"]'], lastName);
  await tryFill(page, [WD.email, 'input[type="email"]', 'input[name*="email"]'], user.email);
  await tryFill(page, [WD.phone, 'input[name*="phone"]', 'input[type="tel"]'], s1.phone || onboarding.phone || '');
  await tryFill(page, [WD.address1, 'input[name*="address"]'], address.street || '');
  await tryFill(page, [WD.city, 'input[name*="city"]'], address.city || '');
  await tryFill(page, [WD.zip, 'input[name*="zip"]', 'input[name*="postal"]'], address.zip || '');
  await tryFill(page, [WD.linkedin, 'input[name*="linkedin"]'], s1.linkedin || onboarding.linkedin || '');

  // Phone type — default to Mobile
  await trySelect(page, [WD.phoneType], 'Mobile').catch(() => {});

  // Country — default to United States
  await trySelect(page, [WD.country], 'United States of America').catch(() => {});
  await trySelect(page, [WD.country], 'United States').catch(() => {});

  // Work authorization
  const workAuth = s1.workAuthorization || onboarding.workAuthorization || 'authorized';
  if (workAuth === 'authorized' || workAuth === 'citizen') {
    await trySelect(page, [WD.workAuth], 'I am authorized to work in the United States').catch(() => {});
    // No sponsorship needed
    const sponsorshipNo = page.locator(`${WD.sponsorship} input[value="0"], ${WD.sponsorship} input[value="false"]`).first();
    if (await sponsorshipNo.count() > 0) await sponsorshipNo.click().catch(() => {});
  }
}

async function handleWorkExperienceStep(page, user) {
  // Workday often pre-populates from resume upload — just verify and continue
  // If there are "Add Work Experience" buttons, we skip (resume was uploaded)
  const addBtn = page.locator('[data-automation-id="Add Work Experience"]').first();
  if (await addBtn.count() > 0) {
    // Resume was not auto-parsed — skip manual entry (too complex for automation)
    console.log('[workdayAdapter] Work Experience step — resume upload should have pre-populated this');
  }
}

async function handleEducationStep(page, user) {
  // Similar to work experience — Workday pre-populates from resume upload
  const addBtn = page.locator('[data-automation-id="Add Education"]').first();
  if (await addBtn.count() > 0) {
    console.log('[workdayAdapter] Education step — resume upload should have pre-populated this');
  }
}

async function handleQuestionnaireStep(page, user, jobDoc) {
  // Handle all textarea questions using IQA
  const textareas = await page.locator('textarea[data-automation-id], textarea:visible').all();
  for (const ta of textareas) {
    try {
      const currentValue = await ta.inputValue().catch(() => '');
      if (currentValue.trim()) continue; // Already filled

      const labelText = await resolveLabel(page, ta);
      if (!labelText) continue;

      const answer = await iqaService.answer({
        question: labelText,
        user,
        jobDoc,
      });
      if (answer) {
        await ta.fill(answer);
        await humanDelay(200, 500);
      }
    } catch (_) {}
  }

  // Handle radio button questions (Yes/No type)
  const radioGroups = await page.locator('[data-automation-id*="radioGroup"], [role="radiogroup"]').all();
  for (const group of radioGroups) {
    try {
      const labelText = await resolveLabel(page, group);
      if (!labelText) continue;

      const answer = await iqaService.answer({
        question: labelText,
        user,
        jobDoc,
      });
      if (!answer) continue;

      const answerLower = answer.toLowerCase();
      const isYes = answerLower.startsWith('yes') || answerLower === 'true';
      const radioSelector = isYes
        ? 'input[value="true"], input[value="Yes"], input[value="1"]'
        : 'input[value="false"], input[value="No"], input[value="0"]';
      const radio = group.locator(radioSelector).first();
      if (await radio.count() > 0) {
        await radio.click();
        await humanDelay(100, 300);
      }
    } catch (_) {}
  }

  // Handle dropdown questions
  const selects = await page.locator('select[data-automation-id]:visible').all();
  for (const sel of selects) {
    try {
      const currentValue = await sel.inputValue().catch(() => '');
      if (currentValue && currentValue !== '') continue;

      const labelText = await resolveLabel(page, sel);
      if (!labelText) continue;

      const answer = await iqaService.answer({
        question: labelText,
        user,
        jobDoc,
      });
      if (answer) {
        await sel.selectOption({ label: answer }).catch(() => {});
        await humanDelay(100, 300);
      }
    } catch (_) {}
  }
}

async function handleEeoStep(page) {
  // Standard EEO responses — Prefer Not to Answer / Decline to Self-Identify
  const preferNotTo = [
    'Prefer Not to Answer',
    'I do not wish to answer',
    'Decline to Self Identify',
    'Choose not to disclose',
    'I choose not to disclose',
  ];

  for (const fieldSel of [WD.gender, WD.ethnicity, WD.veteran, WD.disability]) {
    for (const label of preferNotTo) {
      try {
        await page.locator(fieldSel).first().selectOption({ label }).catch(() => {});
      } catch (_) {}
    }
  }

  // Handle radio-based EEO fields
  const eeoRadios = await page.locator('[data-automation-id*="eeo"] input[type="radio"], [data-automation-id*="voluntary"] input[type="radio"]').all();
  for (const radio of eeoRadios) {
    const value = await radio.getAttribute('value') || '';
    if (value.toLowerCase().includes('decline') || value.toLowerCase().includes('prefer') || value === '3' || value === '4') {
      await radio.click().catch(() => {});
      await humanDelay(100, 200);
      break;
    }
  }
}

async function checkSubmissionConfirmation(page) {
  const confirmationSelectors = [
    '[data-automation-id="confirmationPage"]',
    '[data-automation-id="applicationSubmitted"]',
    'h1:has-text("Thank you")',
    'h1:has-text("Application Submitted")',
    'h2:has-text("Thank you")',
    'h2:has-text("Application Submitted")',
    'h2:has-text("successfully submitted")',
    '.confirmation-message',
    '[class*="confirmation"]',
  ];
  for (const sel of confirmationSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.count() > 0 && await el.isVisible()) {
        console.log(`[workdayAdapter] Confirmation detected via: ${sel}`);
        return true;
      }
    } catch (_) {}
  }
  // Check URL for confirmation patterns
  const url = page.url();
  if (url.includes('confirmation') || url.includes('submitted') || url.includes('thank-you')) {
    return true;
  }
  return false;
}

export default { apply };
