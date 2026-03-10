/**
 * linkedinService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * LinkedIn Profile Optimization Service.
 * Available exclusively to Concierge (premium) subscribers.
 *
 * Two paths:
 *   1. URL Provided  → Scrape the public profile, analyze it against the
 *                      user's optimized resume and target roles, then deliver
 *                      a full section-by-section rewrite with instructions.
 *   2. No URL        → Build a complete LinkedIn profile from scratch using
 *                      the user's resume data and target roles.
 *
 * Deliverable in both cases: a structured document returned to the
 * Document Delivery screen.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import puppeteer from 'puppeteer';
import OpenAI from 'openai';

const openai = new OpenAI();

// ─── System Prompts ───────────────────────────────────────────────────────────

const REWRITE_SYSTEM_PROMPT = `You are a senior LinkedIn profile strategist and personal branding expert.
You have been given a user's existing LinkedIn profile content and their professionally optimized resume.
Your job is to produce a complete, section-by-section rewrite of their LinkedIn profile that:
- Aligns tightly with their target roles and industries
- Uses strong, keyword-rich language that ranks well in LinkedIn search
- Tells a compelling career narrative
- Is written in first person, professional but human tone
- Maximizes recruiter engagement

Return a JSON object with this exact structure:
{
  "path": "rewrite",
  "headline": {
    "current": "<their current headline>",
    "rewritten": "<your new headline — max 220 characters>",
    "rationale": "<why this headline is stronger>"
  },
  "about": {
    "current": "<their current about section>",
    "rewritten": "<your new about section — 3-5 paragraphs, ~2000 characters>",
    "rationale": "<key improvements made>"
  },
  "experience": [
    {
      "company": "<company name>",
      "title": "<job title>",
      "current_bullets": ["<bullet 1>", "<bullet 2>"],
      "rewritten_bullets": ["<improved bullet 1>", "<improved bullet 2>"],
      "rationale": "<what was improved and why>"
    }
  ],
  "skills": {
    "recommended": ["<skill 1>", "<skill 2>", "...up to 20 skills"],
    "rationale": "<why these skills matter for their target roles>"
  },
  "instructions": "<Step-by-step instructions for the user on how to apply these changes in LinkedIn>"
}`;

const BUILD_SYSTEM_PROMPT = `You are a senior LinkedIn profile strategist and personal branding expert.
You have been given a user's professionally optimized resume and their target roles.
Your job is to build a complete, ready-to-use LinkedIn profile from scratch that:
- Tells a compelling career narrative based on their work history
- Uses strong, keyword-rich language that ranks well in LinkedIn search
- Is written in first person, professional but human tone
- Is optimized for the specific roles they are targeting
- Maximizes recruiter engagement

Return a JSON object with this exact structure:
{
  "path": "build",
  "headline": {
    "text": "<compelling headline — max 220 characters>",
    "rationale": "<why this headline works>"
  },
  "about": {
    "text": "<full about section — 3-5 paragraphs, ~2000 characters>",
    "rationale": "<the narrative strategy used>"
  },
  "experience": [
    {
      "company": "<company name>",
      "title": "<job title>",
      "dates": "<start – end dates>",
      "bullets": ["<bullet 1>", "<bullet 2>", "<bullet 3>"],
      "rationale": "<approach used for this role>"
    }
  ],
  "skills": {
    "recommended": ["<skill 1>", "<skill 2>", "...up to 20 skills"],
    "rationale": "<why these skills matter for their target roles>"
  },
  "setup_guide": "<Step-by-step guide for creating a new LinkedIn account and populating it with this content>"
}`;

// ─── Profile Scraper ──────────────────────────────────────────────────────────

/**
 * Scrape a public LinkedIn profile URL using Puppeteer.
 * Returns a structured text representation of the profile content.
 * Note: LinkedIn aggressively blocks scrapers. This implementation uses
 * a best-effort approach. If scraping fails, the caller should fall back
 * to the build-from-scratch path.
 *
 * @param {string} url - The public LinkedIn profile URL
 * @returns {Promise<Object>} { success, profileText, sections }
 */
async function scrapeProfile(url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ],
    });

    const page = await browser.newPage();

    // Set realistic browser headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    // Navigate to the profile
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Check if we hit a login wall
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/authwall')) {
      await browser.close();
      return {
        success: false,
        reason: 'login_wall',
        profileText: null,
        sections: null,
      };
    }

    // Extract profile content
    const profileData = await page.evaluate(() => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.innerText.trim() : '';
      };

      const getAll = (selector) => {
        return Array.from(document.querySelectorAll(selector)).map(el => el.innerText.trim()).filter(Boolean);
      };

      // Headline
      const headline = getText('h2.top-card-layout__headline') ||
                       getText('.pv-text-details__left-panel h2') ||
                       getText('[data-generated-suggestion-target] h2') || '';

      // About section
      const about = getText('.pv-shared-text-with-see-more span[aria-hidden="true"]') ||
                    getText('.core-section-container__content .pv-about__summary-text') || '';

      // Experience entries
      const experienceItems = getAll('.experience-section .pv-entity__summary-info') ||
                              getAll('[data-field="experience_company_logo"] .pv-entity__summary-info');

      // Full page text as fallback
      const bodyText = document.body.innerText;

      return {
        headline,
        about,
        experienceItems,
        bodyText: bodyText.substring(0, 8000), // cap at 8k chars
      };
    });

    await browser.close();

    // Build a structured text representation
    const profileText = [
      `HEADLINE: ${profileData.headline || '(not found)'}`,
      '',
      `ABOUT: ${profileData.about || '(not found)'}`,
      '',
      `EXPERIENCE:`,
      ...(profileData.experienceItems.length > 0
        ? profileData.experienceItems
        : ['(experience details not extracted — using full page text)']),
      '',
      `FULL PAGE TEXT (for context):`,
      profileData.bodyText,
    ].join('\n');

    return {
      success: true,
      profileText,
      sections: {
        headline: profileData.headline,
        about: profileData.about,
        experience: profileData.experienceItems,
      },
    };
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error('[linkedinService.scrapeProfile] Scrape error:', err.message);
    return {
      success: false,
      reason: 'scrape_error',
      error: err.message,
      profileText: null,
      sections: null,
    };
  }
}

// ─── Path 1: Rewrite Existing Profile ────────────────────────────────────────

/**
 * Scrape a user's LinkedIn profile and generate a full rewrite.
 * @param {Object} params
 * @param {string} params.linkedinUrl - The user's public LinkedIn profile URL
 * @param {Object} params.user        - Full user document from MongoDB
 * @param {Array}  params.targetRoles - Array of target job titles
 * @returns {Promise<Object>} Rewrite document
 */
async function rewriteProfile({ linkedinUrl, user, targetRoles }) {
  // Step 1: Scrape the profile
  const scraped = await scrapeProfile(linkedinUrl);

  let profileText;
  let scrapingNote = '';

  if (!scraped.success) {
    // LinkedIn blocked us — fall back to building from scratch with a note
    console.warn(`[linkedinService] Profile scrape failed (${scraped.reason}). Falling back to build-from-scratch.`);
    scrapingNote = `Note: We were unable to automatically access your LinkedIn profile (LinkedIn restricts automated access). ` +
                   `We have built a complete profile for you from scratch based on your resume. ` +
                   `You can use this to update your existing profile section by section.`;
    return buildFromScratch({ user, targetRoles, note: scrapingNote });
  }

  profileText = scraped.profileText;

  // Step 2: Build the AI prompt
  const resumeText = user.resumeData?.optimized ||
                     user.resumeData?.plainText ||
                     JSON.stringify(user.resumeData || {});
  const roles = Array.isArray(targetRoles) ? targetRoles.join(', ') : (targetRoles || 'Not specified');

  const userPrompt = `
USER'S TARGET ROLES: ${roles}

USER'S OPTIMIZED RESUME:
${resumeText}

USER'S CURRENT LINKEDIN PROFILE:
${profileText}

Analyze the LinkedIn profile against the resume and target roles.
Identify every section that is weak, outdated, or misaligned.
Then produce a complete, section-by-section rewrite.
Return as JSON per the schema in your instructions.
`.trim();

  // Step 3: Call OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: REWRITE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content);
  result.generatedAt = new Date().toISOString();
  result.linkedinUrl = linkedinUrl;
  if (scrapingNote) result.scrapingNote = scrapingNote;

  return result;
}

// ─── Path 2: Build From Scratch ───────────────────────────────────────────────

/**
 * Generate a complete LinkedIn profile from scratch using resume data.
 * Used when the user has no LinkedIn profile or when scraping fails.
 * @param {Object} params
 * @param {Object} params.user        - Full user document from MongoDB
 * @param {Array}  params.targetRoles - Array of target job titles
 * @param {string} [params.note]      - Optional note to include in the result
 * @returns {Promise<Object>} New profile document
 */
async function buildFromScratch({ user, targetRoles, note }) {
  const resumeText = user.resumeData?.optimized ||
                     user.resumeData?.plainText ||
                     JSON.stringify(user.resumeData || {});
  const roles = Array.isArray(targetRoles) ? targetRoles.join(', ') : (targetRoles || 'Not specified');
  const userName = user.name || 'the candidate';

  const userPrompt = `
USER'S NAME: ${userName}
USER'S TARGET ROLES: ${roles}

USER'S OPTIMIZED RESUME:
${resumeText}

Build a complete, compelling LinkedIn profile from scratch for this person.
Every section should be polished, keyword-rich, and tailored to their target roles.
Include a step-by-step setup guide for creating a new LinkedIn account.
Return as JSON per the schema in your instructions.
`.trim();

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: BUILD_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content);
  result.generatedAt = new Date().toISOString();
  if (note) result.note = note;

  return result;
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Generate LinkedIn optimization for a Concierge subscriber.
 * Routes to rewrite or build-from-scratch based on whether a URL was provided.
 *
 * @param {Object} params
 * @param {string|null} params.linkedinUrl - Optional LinkedIn profile URL
 * @param {Object}      params.user        - Full user document from MongoDB
 * @param {Array}       params.targetRoles - Array of target job titles
 * @returns {Promise<Object>} LinkedIn optimization document
 */
async function generateOptimization({ linkedinUrl, user, targetRoles }) {
  if (linkedinUrl && linkedinUrl.trim()) {
    // Validate URL format
    const normalizedUrl = linkedinUrl.trim();
    if (!normalizedUrl.includes('linkedin.com/in/')) {
      throw new Error('Please provide a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/yourname)');
    }
    return rewriteProfile({ linkedinUrl: normalizedUrl, user, targetRoles });
  } else {
    return buildFromScratch({ user, targetRoles });
  }
}

export default {
  generateOptimization,
  rewriteProfile,
  buildFromScratch,
  scrapeProfile,
};
