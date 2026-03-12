/**
 * ats/stealthBrowser.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared stealth browser launcher for all ATS adapters.
 *
 * Reduces bot-detection fingerprinting by:
 *   1. Randomising the User-Agent from a pool of real Chrome versions
 *   2. Setting realistic viewport dimensions
 *   3. Overriding navigator.webdriver = false via init script
 *   4. Spoofing navigator.languages, platform, and hardwareConcurrency
 *   5. Adding human-like random delays between interactions
 *   6. Routing through a residential proxy when PROXY_URL is set
 *
 * Usage:
 *   import { launchStealthBrowser, humanDelay } from './stealthBrowser.js';
 *   const { browser, context, page } = await launchStealthBrowser();
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { chromium } from 'playwright';

// ─── User-Agent Pool ──────────────────────────────────────────────────────────
// Real Chrome UAs from Windows, Mac, and Linux — rotated per session.
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

// ─── Viewport Pool ────────────────────────────────────────────────────────────
const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
];

/**
 * Pick a random item from an array.
 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Wait a random number of milliseconds in [min, max].
 * Simulates human reaction time between interactions.
 */
export async function humanDelay(min = 300, max = 1200) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Type text into a Playwright locator character-by-character with
 * random inter-key delays to mimic human typing.
 */
export async function humanType(locator, text, { delayMin = 40, delayMax = 120 } = {}) {
  await locator.click();
  await locator.fill(''); // clear first
  for (const char of text) {
    await locator.type(char, { delay: 0 });
    await humanDelay(delayMin, delayMax);
  }
}

/**
 * Launch a stealth Chromium browser with anti-detection measures applied.
 *
 * @param {Object} [options]
 * @param {boolean} [options.headless=true]
 * @returns {Promise<{browser, context, page}>}
 */
export async function launchStealthBrowser({ headless = true } = {}) {
  const userAgent = pick(USER_AGENTS);
  const viewport  = pick(VIEWPORTS);

  // Build proxy config if PROXY_URL is set in environment
  // Format: http://user:pass@host:port  OR  http://host:port
  const proxyConfig = process.env.PROXY_URL
    ? { server: process.env.PROXY_URL }
    : undefined;

  const browser = await chromium.launch({
    headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
    ],
  });

  const context = await browser.newContext({
    userAgent,
    viewport,
    locale: 'en-US',
    timezoneId: 'America/New_York',
    ...(proxyConfig ? { proxy: proxyConfig } : {}),
    // Suppress automation flags
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  // ── Override automation-detection properties ───────────────────────────────
  await context.addInitScript(() => {
    // Hide webdriver flag
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    // Spoof plugins (real Chrome has plugins)
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    // Spoof languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
    // Spoof hardware concurrency (real machines have multiple cores)
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8,
    });
    // Remove Playwright-specific properties
    delete window.__playwright;
    delete window.__pw_manual;
  });

  const page = await context.newPage();

  // Randomise mouse movement on page load to appear more human
  page.on('load', async () => {
    try {
      const x = Math.floor(Math.random() * viewport.width * 0.8) + 50;
      const y = Math.floor(Math.random() * viewport.height * 0.6) + 50;
      await page.mouse.move(x, y);
    } catch (_) {}
  });

  return { browser, context, page };
}

/**
 * Detect whether the current page is showing a CAPTCHA challenge.
 * Returns the CAPTCHA type detected, or null if none.
 *
 * @param {import('playwright').Page} page
 * @returns {Promise<'recaptcha'|'hcaptcha'|'cloudflare'|'generic'|null>}
 */
export async function detectCaptcha(page) {
  try {
    const content = await page.content();
    const url = page.url();

    if (content.includes('grecaptcha') || content.includes('recaptcha/api.js')) {
      return 'recaptcha';
    }
    if (content.includes('hcaptcha.com') || content.includes('h-captcha')) {
      return 'hcaptcha';
    }
    if (content.includes('cf-challenge') || content.includes('cf_chl_') || url.includes('challenge')) {
      return 'cloudflare';
    }
    const title = await page.title().catch(() => '');
    if (
      title.toLowerCase().includes('captcha') ||
      title.toLowerCase().includes('access denied') ||
      title.toLowerCase().includes('just a moment') ||
      content.toLowerCase().includes('prove you are human') ||
      content.toLowerCase().includes('verify you are human')
    ) {
      return 'generic';
    }
    return null;
  } catch (_) {
    return null;
  }
}

export default { launchStealthBrowser, humanDelay, humanType, detectCaptcha };
