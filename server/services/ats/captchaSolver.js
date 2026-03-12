/**
 * ats/captchaSolver.js
 * ─────────────────────────────────────────────────────────────────────────────
 * CAPTCHA Solving Service for Talendro Auto-Apply.
 *
 * Strategy (in priority order):
 *   1. CapSolver API  — AI-powered, handles reCAPTCHA v2/v3, hCaptcha, Cloudflare
 *      Cost: ~$0.40–$1.00 per 1,000 solves. ~80–99% success rate.
 *      Requires: CAPSOLVER_API_KEY env var.
 *
 *   2. Human-review queue — When CAPTCHA cannot be solved automatically,
 *      the application is flagged as 'captcha_blocked' in MongoDB and the
 *      user is notified via email with a direct link to complete manually.
 *      This ensures ZERO silent failures — every blocked application is
 *      surfaced to the subscriber.
 *
 * Supported CAPTCHA types:
 *   - reCAPTCHA v2 (checkbox "I'm not a robot")
 *   - reCAPTCHA v2 Invisible
 *   - reCAPTCHA v3
 *   - hCaptcha
 *   - Cloudflare Turnstile (partial — token injection)
 *
 * NOT supported (requires human):
 *   - Image-grid puzzles with dynamic content (some enterprise reCAPTCHA)
 *   - Email verification codes (requires mailbox access)
 *   - SMS verification codes
 *   - Multi-factor authentication prompts
 * ─────────────────────────────────────────────────────────────────────────────
 */
import fetch from 'node-fetch';

const CAPSOLVER_API = 'https://api.capsolver.com';
const CAPSOLVER_KEY = process.env.CAPSOLVER_API_KEY || null;

// Timeout for CAPTCHA solving (ms) — CapSolver typically resolves in 5–30s
const SOLVE_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 3_000;

/**
 * Attempt to solve a reCAPTCHA v2 (checkbox) using CapSolver.
 *
 * @param {string} siteKey  - The data-sitekey attribute from the page
 * @param {string} pageUrl  - The URL of the page containing the CAPTCHA
 * @returns {Promise<string|null>} g-recaptcha-response token, or null on failure
 */
export async function solveRecaptchaV2(siteKey, pageUrl) {
  if (!CAPSOLVER_KEY) {
    console.warn('[captchaSolver] CAPSOLVER_API_KEY not set — cannot solve reCAPTCHA v2');
    return null;
  }
  return _solveWithCapSolver({
    type: 'ReCaptchaV2Task',
    websiteURL: pageUrl,
    websiteKey: siteKey,
  });
}

/**
 * Attempt to solve a reCAPTCHA v2 Invisible using CapSolver.
 */
export async function solveRecaptchaV2Invisible(siteKey, pageUrl) {
  if (!CAPSOLVER_KEY) {
    console.warn('[captchaSolver] CAPSOLVER_API_KEY not set — cannot solve reCAPTCHA v2 Invisible');
    return null;
  }
  return _solveWithCapSolver({
    type: 'ReCaptchaV2TaskProxyLess',
    websiteURL: pageUrl,
    websiteKey: siteKey,
    isInvisible: true,
  });
}

/**
 * Attempt to solve a reCAPTCHA v3 using CapSolver.
 *
 * @param {string} siteKey  - The reCAPTCHA v3 site key
 * @param {string} pageUrl  - The URL of the page
 * @param {string} [action] - The action name (e.g. 'submit', 'login')
 * @returns {Promise<string|null>} token or null
 */
export async function solveRecaptchaV3(siteKey, pageUrl, action = 'submit') {
  if (!CAPSOLVER_KEY) {
    console.warn('[captchaSolver] CAPSOLVER_API_KEY not set — cannot solve reCAPTCHA v3');
    return null;
  }
  return _solveWithCapSolver({
    type: 'ReCaptchaV3TaskProxyLess',
    websiteURL: pageUrl,
    websiteKey: siteKey,
    pageAction: action,
    minScore: 0.7,
  });
}

/**
 * Attempt to solve an hCaptcha using CapSolver.
 *
 * @param {string} siteKey  - The hCaptcha site key
 * @param {string} pageUrl  - The URL of the page
 * @returns {Promise<string|null>} h-captcha-response token or null
 */
export async function solveHCaptcha(siteKey, pageUrl) {
  if (!CAPSOLVER_KEY) {
    console.warn('[captchaSolver] CAPSOLVER_API_KEY not set — cannot solve hCaptcha');
    return null;
  }
  return _solveWithCapSolver({
    type: 'HCaptchaTaskProxyLess',
    websiteURL: pageUrl,
    websiteKey: siteKey,
  });
}

/**
 * Auto-detect and solve the CAPTCHA on the current page.
 * Extracts siteKey from the DOM and calls the appropriate solver.
 *
 * @param {import('playwright').Page} page
 * @param {string} captchaType - 'recaptcha' | 'hcaptcha' | 'cloudflare' | 'generic'
 * @returns {Promise<{solved: boolean, token?: string, method?: string}>}
 */
export async function autoSolveCaptcha(page, captchaType) {
  const pageUrl = page.url();

  try {
    if (captchaType === 'recaptcha') {
      // Extract siteKey from DOM
      const siteKey = await page.evaluate(() => {
        const el = document.querySelector('[data-sitekey]');
        return el ? el.getAttribute('data-sitekey') : null;
      });

      if (!siteKey) {
        console.warn('[captchaSolver] reCAPTCHA siteKey not found in DOM');
        return { solved: false };
      }

      // Try v3 first (invisible, higher score), then v2 invisible, then v2 checkbox
      let token = await solveRecaptchaV3(siteKey, pageUrl);
      let method = 'recaptcha_v3';

      if (!token) {
        token = await solveRecaptchaV2Invisible(siteKey, pageUrl);
        method = 'recaptcha_v2_invisible';
      }
      if (!token) {
        token = await solveRecaptchaV2(siteKey, pageUrl);
        method = 'recaptcha_v2';
      }

      if (!token) return { solved: false };

      // Inject the token into the page
      await page.evaluate((t) => {
        // Standard reCAPTCHA response field
        const responseField = document.getElementById('g-recaptcha-response');
        if (responseField) {
          responseField.value = t;
          responseField.style.display = 'block';
        }
        // Also try hidden fields
        document.querySelectorAll('[name="g-recaptcha-response"]').forEach(el => {
          el.value = t;
        });
        // Trigger any onSuccess callbacks registered by the page
        if (typeof window.___grecaptcha_cfg !== 'undefined') {
          try {
            const clients = window.___grecaptcha_cfg.clients;
            if (clients) {
              Object.values(clients).forEach(client => {
                if (client && client.callback) client.callback(t);
              });
            }
          } catch (_) {}
        }
      }, token);

      console.log(`[captchaSolver] ✅ reCAPTCHA solved via ${method}`);
      return { solved: true, token, method };
    }

    if (captchaType === 'hcaptcha') {
      const siteKey = await page.evaluate(() => {
        const el = document.querySelector('[data-sitekey]') ||
                   document.querySelector('.h-captcha[data-sitekey]');
        return el ? el.getAttribute('data-sitekey') : null;
      });

      if (!siteKey) {
        console.warn('[captchaSolver] hCaptcha siteKey not found in DOM');
        return { solved: false };
      }

      const token = await solveHCaptcha(siteKey, pageUrl);
      if (!token) return { solved: false };

      // Inject hCaptcha response
      await page.evaluate((t) => {
        const responseField = document.querySelector('[name="h-captcha-response"]');
        if (responseField) responseField.value = t;
        // Trigger hCaptcha callback
        if (typeof window.hcaptcha !== 'undefined') {
          try { window.hcaptcha.execute(); } catch (_) {}
        }
      }, token);

      console.log('[captchaSolver] ✅ hCaptcha solved');
      return { solved: true, token, method: 'hcaptcha' };
    }

    // Cloudflare and generic CAPTCHAs — cannot be solved programmatically
    console.warn(`[captchaSolver] CAPTCHA type "${captchaType}" cannot be auto-solved`);
    return { solved: false };

  } catch (err) {
    console.error('[captchaSolver] Error during CAPTCHA solving:', err.message);
    return { solved: false };
  }
}

// ─── Internal CapSolver API Client ────────────────────────────────────────────

async function _solveWithCapSolver(taskPayload) {
  try {
    // Step 1: Create task
    const createRes = await fetch(`${CAPSOLVER_API}/createTask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientKey: CAPSOLVER_KEY,
        task: taskPayload,
      }),
    });
    const createData = await createRes.json();

    if (createData.errorId !== 0) {
      console.error('[captchaSolver] CapSolver createTask error:', createData.errorDescription);
      return null;
    }

    const taskId = createData.taskId;
    const deadline = Date.now() + SOLVE_TIMEOUT_MS;

    // Step 2: Poll for result
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));

      const resultRes = await fetch(`${CAPSOLVER_API}/getTaskResult`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientKey: CAPSOLVER_KEY,
          taskId,
        }),
      });
      const resultData = await resultRes.json();

      if (resultData.status === 'ready') {
        const token = resultData.solution?.gRecaptchaResponse ||
                      resultData.solution?.token ||
                      resultData.solution?.gRecaptchaResponseMD5;
        if (token) {
          console.log(`[captchaSolver] CapSolver solved task ${taskId}`);
          return token;
        }
        console.warn('[captchaSolver] CapSolver returned ready but no token found');
        return null;
      }

      if (resultData.status === 'failed' || resultData.errorId !== 0) {
        console.error('[captchaSolver] CapSolver task failed:', resultData.errorDescription);
        return null;
      }
      // status === 'processing' — keep polling
    }

    console.warn('[captchaSolver] CapSolver solve timeout exceeded');
    return null;

  } catch (err) {
    console.error('[captchaSolver] CapSolver API error:', err.message);
    return null;
  }
}

export default {
  solveRecaptchaV2,
  solveRecaptchaV2Invisible,
  solveRecaptchaV3,
  solveHCaptcha,
  autoSolveCaptcha,
};
