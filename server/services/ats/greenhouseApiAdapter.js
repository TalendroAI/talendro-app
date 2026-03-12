/**
 * ats/greenhouseApiAdapter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Greenhouse API Adapter — CAPTCHA-Free Application Submission.
 *
 * Greenhouse exposes a public Job Board API that allows submitting applications
 * programmatically WITHOUT requiring browser automation or CAPTCHA solving.
 *
 * API endpoint:
 *   POST https://boards-api.greenhouse.io/v1/boards/{company_slug}/jobs/{job_id}
 *
 * This is the PREFERRED path for all Greenhouse jobs because:
 *   - Zero CAPTCHA exposure
 *   - 100% reliable (no browser rendering issues)
 *   - Faster (no headless browser overhead)
 *   - Officially supported by Greenhouse
 *
 * Fallback: If the API submission fails (e.g., the job requires custom fields
 * not supported by the API), the greenhouseAdapter.js browser-based path is used.
 *
 * Reference: https://developers.greenhouse.io/job-board.html
 * ─────────────────────────────────────────────────────────────────────────────
 */
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Extract the Greenhouse company slug and job ID from an apply URL.
 *
 * Supported URL formats:
 *   https://boards.greenhouse.io/{slug}/jobs/{id}
 *   https://job-boards.greenhouse.io/{slug}/jobs/{id}
 *   https://{company}.greenhouse.io/jobs/{id}
 *
 * @param {string} applyUrl
 * @returns {{ slug: string, jobId: string } | null}
 */
export function parseGreenhouseUrl(applyUrl) {
  try {
    const url = new URL(applyUrl);

    // boards.greenhouse.io/{slug}/jobs/{id}
    const boardsMatch = url.pathname.match(/^\/([^/]+)\/jobs\/(\d+)/);
    if (boardsMatch && (url.hostname.includes('greenhouse.io'))) {
      return { slug: boardsMatch[1], jobId: boardsMatch[2] };
    }

    // {company}.greenhouse.io/jobs/{id}
    const subdomain = url.hostname.split('.')[0];
    const subdomainMatch = url.pathname.match(/^\/jobs\/(\d+)/);
    if (subdomainMatch && url.hostname.endsWith('greenhouse.io') && subdomain !== 'boards') {
      return { slug: subdomain, jobId: subdomainMatch[1] };
    }

    return null;
  } catch (_) {
    return null;
  }
}

/**
 * Fetch the job detail from the Greenhouse API to get the list of required
 * questions and the correct form structure.
 *
 * @param {string} slug
 * @param {string} jobId
 * @returns {Promise<Object|null>} Job detail object or null on failure
 */
export async function fetchGreenhouseJobDetail(slug, jobId) {
  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs/${jobId}?questions=true`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      timeout: 15000,
    });
    if (!res.ok) {
      console.warn(`[greenhouseApiAdapter] Job detail fetch failed: ${res.status} for ${slug}/${jobId}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn('[greenhouseApiAdapter] fetchGreenhouseJobDetail error:', err.message);
    return null;
  }
}

/**
 * Submit a job application via the Greenhouse Job Board API.
 *
 * @param {Object} params
 * @param {Object} params.user           - Full user document from MongoDB
 * @param {Object} params.jobDoc         - Full job document from MongoDB
 * @param {string} params.applyUrl       - Direct URL to the Greenhouse application form
 * @param {string} params.tailoredResume - AI-tailored resume text for this job
 * @param {string} params.coverLetter    - AI-generated cover letter for this job
 * @returns {Promise<{success: boolean, error?: string, method?: string}>}
 */
export async function applyViaApi({ user, jobDoc, applyUrl, tailoredResume, coverLetter }) {
  const parsed = parseGreenhouseUrl(applyUrl);
  if (!parsed) {
    return { success: false, error: 'Could not parse Greenhouse URL for API submission' };
  }

  const { slug, jobId } = parsed;
  console.log(`[greenhouseApiAdapter] Attempting API apply: ${slug}/jobs/${jobId}`);

  // ── Fetch job questions to build the correct form ─────────────────────────
  const jobDetail = await fetchGreenhouseJobDetail(slug, jobId);
  if (!jobDetail) {
    return { success: false, error: 'Could not fetch job detail from Greenhouse API' };
  }

  // ── Build the multipart form ───────────────────────────────────────────────
  const s1 = user.onboardingData?.s1 || {};
  const s2 = user.onboardingData?.s2 || {};
  const s8 = user.onboardingData?.s8 || {};

  const firstName = s1.firstName || user.firstName || (user.name || '').split(' ')[0] || '';
  const lastName  = s1.lastName  || user.lastName  || (user.name || '').split(' ').slice(1).join(' ') || '';
  const email     = s1.email     || user.email     || '';
  const phone     = s1.phone     || user.phone     || '';
  const linkedin  = s1.linkedin  || s8.linkedinUrl || '';
  const website   = s1.website   || '';

  // Write resume to temp file
  const tmpDir = os.tmpdir();
  const resumeFilePath = path.join(tmpDir, `talendro_${Date.now()}_resume.txt`);
  fs.writeFileSync(resumeFilePath, tailoredResume, 'utf8');

  const form = new FormData();
  form.append('first_name', firstName);
  form.append('last_name', lastName);
  form.append('email', email);
  form.append('phone', phone);
  if (linkedin) form.append('linkedin_profile', linkedin);
  if (website)  form.append('website', website);

  // Attach resume as file
  form.append('resume', fs.createReadStream(resumeFilePath), {
    filename: `${firstName}_${lastName}_Resume.txt`,
    contentType: 'text/plain',
  });

  // Cover letter as text (Greenhouse accepts cover_letter as text field)
  form.append('cover_letter', coverLetter);

  // ── Answer standard questions from the job's question list ────────────────
  const questions = jobDetail.questions || [];
  for (const q of questions) {
    const label = (q.label || '').toLowerCase();
    const fieldName = q.name || q.fields?.[0]?.name;
    if (!fieldName) continue;

    // Skip fields we've already filled
    if (['first_name','last_name','email','phone','resume','cover_letter'].includes(fieldName)) continue;

    let answer = null;

    if (label.includes('authorized') || label.includes('work in the us') || label.includes('eligible to work')) {
      answer = s2.workAuth === 'Yes' ? 'Yes' : 'No';
    } else if (label.includes('sponsorship') || label.includes('visa')) {
      answer = s2.sponsorNow === 'Yes' ? 'Yes' : 'No';
    } else if (label.includes('salary') || label.includes('compensation') || label.includes('pay')) {
      answer = s8.salaryMin || '';
    } else if (label.includes('start date') || label.includes('available')) {
      answer = s8.startDate || '';
    } else if (label.includes('relocate') || label.includes('relocation')) {
      answer = s8.relocate === 'Yes' ? 'Yes' : 'No';
    } else if (label.includes('linkedin')) {
      answer = linkedin;
    } else if (label.includes('website') || label.includes('portfolio')) {
      answer = website;
    } else if (label.includes('github')) {
      answer = s1.github || '';
    } else if (label.includes('veteran') || label.includes('military')) {
      answer = 'I am not a veteran';
    } else if (label.includes('disability') || label.includes('disabled')) {
      answer = 'I do not wish to self-identify';
    } else if (label.includes('gender') || label.includes('race') || label.includes('ethnicity')) {
      answer = 'I do not wish to self-identify';
    }

    if (answer) {
      form.append(fieldName, answer);
    }
  }

  // ── Submit the form ────────────────────────────────────────────────────────
  try {
    const submitUrl = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs/${jobId}`;
    const res = await fetch(submitUrl, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
      timeout: 30000,
    });

    // Clean up temp file
    try { fs.unlinkSync(resumeFilePath); } catch (_) {}

    if (res.ok || res.status === 201 || res.status === 200) {
      console.log(`[greenhouseApiAdapter] ✅ API application submitted: ${slug}/jobs/${jobId}`);
      return { success: true, method: 'greenhouse_api' };
    }

    const body = await res.text().catch(() => '');
    console.warn(`[greenhouseApiAdapter] API submission returned ${res.status}: ${body.slice(0, 200)}`);

    // 422 = validation error (missing required fields) — fall through to browser
    if (res.status === 422) {
      return { success: false, error: `Greenhouse API validation error (${res.status}) — falling back to browser`, fallback: true };
    }

    return { success: false, error: `Greenhouse API returned ${res.status}` };

  } catch (err) {
    try { fs.unlinkSync(resumeFilePath); } catch (_) {}
    console.error('[greenhouseApiAdapter] Submission error:', err.message);
    return { success: false, error: err.message, fallback: true };
  }
}

export default { parseGreenhouseUrl, fetchGreenhouseJobDetail, applyViaApi };
