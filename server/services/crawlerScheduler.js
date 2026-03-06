/**
 * Crawler Scheduler
 *
 * Orchestrates all job ingestion sources on a rotating schedule:
 *
 * Sources:
 *   - Greenhouse ATS (direct API, 225 seeded companies)
 *   - Lever ATS (direct API, 230 seeded companies)
 *   - Fantastic.jobs (175,000+ career sites via RapidAPI — requires RAPIDAPI_KEY)
 *   - JSearch / Google for Jobs (broad aggregation via RapidAPI — requires RAPIDAPI_KEY)
 *
 * Schedule:
 *   - Company discovery (Greenhouse + Lever): once per day at 2 AM
 *   - ATS crawl batch (Greenhouse + Lever): every 30 minutes
 *   - Fantastic.jobs ingestion: every 60 minutes (offset by 15 min from ATS crawl)
 *   - JSearch ingestion: every 60 minutes (offset by 45 min from ATS crawl)
 *   - Stale job cleanup: once per day at 3 AM
 */

import cron from 'node-cron';
import pLimit from 'p-limit';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import { discoverGreenhouseCompanies, crawlGreenhouseCompany } from './greenhouseCrawler.js';
import { discoverLeverCompanies, crawlLeverCompany } from './leverCrawler.js';
import { fetchAndIngestFantasticJobs } from './fantasticJobsService.js';
import { fetchAndIngestJSearchJobs } from './jsearchService.js';

const BATCH_SIZE = 50;        // companies to crawl per run
const CONCURRENCY = 3;        // max parallel requests
const STALE_HOURS = 72;       // mark jobs inactive after 72 hours of not being seen
const DELAY_MS = 400;         // ms between requests

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let isDiscoveryRunning = false;
let isCrawlRunning = false;
let isFantasticRunning = false;
let isJSearchRunning = false;

let crawlStats = {
  lastRun: null,
  companiesCrawled: 0,
  newJobsFound: 0,
  errors: 0,
  totalActiveJobs: 0,
  sources: {
    greenhouse: { lastRun: null, newJobs: 0 },
    lever: { lastRun: null, newJobs: 0 },
    fantastic: { lastRun: null, newJobs: 0, skipped: false },
    jsearch: { lastRun: null, newJobs: 0, skipped: false }
  }
};

// ─── Get crawler stats (for API endpoint) ────────────────────────────────────
export function getCrawlerStats() {
  return { ...crawlStats };
}

// ─── Run company discovery (Greenhouse + Lever) ───────────────────────────────
async function runDiscovery() {
  if (isDiscoveryRunning) {
    console.log('[Scheduler] Discovery already running, skipping');
    return;
  }
  isDiscoveryRunning = true;
  console.log('[Scheduler] Starting company discovery...');

  try {
    const [ghResult, lvResult] = await Promise.allSettled([
      discoverGreenhouseCompanies(),
      discoverLeverCompanies()
    ]);

    const ghAdded = ghResult.status === 'fulfilled' ? ghResult.value.added : 0;
    const lvAdded = lvResult.status === 'fulfilled' ? lvResult.value.added : 0;

    console.log(`[Scheduler] Discovery complete: +${ghAdded} Greenhouse, +${lvAdded} Lever companies`);
  } catch (err) {
    console.error('[Scheduler] Discovery error:', err.message);
  } finally {
    isDiscoveryRunning = false;
  }
}

// ─── Run a batch of Greenhouse + Lever crawls ─────────────────────────────────
async function runCrawlBatch() {
  if (isCrawlRunning) {
    console.log('[Scheduler] ATS crawl already running, skipping');
    return;
  }
  isCrawlRunning = true;
  const startTime = Date.now();
  let newJobs = 0;
  let errors = 0;
  let crawled = 0;

  try {
    const companies = await Company.find({
      isActive: true,
      $or: [
        { lastCrawledAt: null },
        { lastCrawledAt: { $lt: new Date(Date.now() - 25 * 60 * 1000) } }
      ]
    })
      .sort({ priority: -1, lastCrawledAt: 1 })
      .limit(BATCH_SIZE)
      .lean();

    if (companies.length === 0) {
      console.log('[Scheduler] No companies due for crawl');
      isCrawlRunning = false;
      return;
    }

    console.log(`[Scheduler] Crawling ${companies.length} companies...`);

    const limit = pLimit(CONCURRENCY);

    const tasks = companies.map(company =>
      limit(async () => {
        try {
          let result;
          if (company.source === 'greenhouse') {
            result = await crawlGreenhouseCompany(company);
          } else if (company.source === 'lever') {
            result = await crawlLeverCompany(company);
          }

          if (result) {
            newJobs += result.newJobs || 0;
            crawled++;
          }
        } catch (err) {
          errors++;
        }
        await sleep(DELAY_MS);
      })
    );

    await Promise.all(tasks);

    const totalActive = await Job.countDocuments({ isActive: true });
    crawlStats = {
      ...crawlStats,
      lastRun: new Date(),
      companiesCrawled: crawled,
      newJobsFound: newJobs,
      errors,
      totalActiveJobs: totalActive,
      durationMs: Date.now() - startTime
    };

    console.log(`[Scheduler] ATS crawl complete: ${crawled} companies, ${newJobs} new jobs, ${errors} errors (${Date.now() - startTime}ms)`);

  } catch (err) {
    console.error('[Scheduler] Crawl batch error:', err.message);
  } finally {
    isCrawlRunning = false;
  }
}

// ─── Run Fantastic.jobs ingestion ────────────────────────────────────────────
async function runFantasticIngestion() {
  if (isFantasticRunning) {
    console.log('[Scheduler] Fantastic.jobs ingestion already running, skipping');
    return;
  }
  isFantasticRunning = true;
  console.log('[Scheduler] Starting Fantastic.jobs ingestion...');

  try {
    const result = await fetchAndIngestFantasticJobs();
    crawlStats.sources.fantastic = {
      lastRun: new Date(),
      newJobs: result.newJobs,
      skipped: result.skipped || false
    };
    if (!result.skipped) {
      crawlStats.totalActiveJobs = await Job.countDocuments({ isActive: true });
    }
  } catch (err) {
    console.error('[Scheduler] Fantastic.jobs ingestion error:', err.message);
  } finally {
    isFantasticRunning = false;
  }
}

// ─── Run JSearch ingestion ────────────────────────────────────────────────────
async function runJSearchIngestion() {
  if (isJSearchRunning) {
    console.log('[Scheduler] JSearch ingestion already running, skipping');
    return;
  }
  isJSearchRunning = true;
  console.log('[Scheduler] Starting JSearch ingestion...');

  try {
    const result = await fetchAndIngestJSearchJobs();
    crawlStats.sources.jsearch = {
      lastRun: new Date(),
      newJobs: result.newJobs,
      skipped: result.skipped || false
    };
    if (!result.skipped) {
      crawlStats.totalActiveJobs = await Job.countDocuments({ isActive: true });
    }
  } catch (err) {
    console.error('[Scheduler] JSearch ingestion error:', err.message);
  } finally {
    isJSearchRunning = false;
  }
}

// ─── Mark stale jobs as inactive ─────────────────────────────────────────────
async function cleanupStaleJobs() {
  const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);

  try {
    const result = await Job.updateMany(
      { isActive: true, lastSeenAt: { $lt: cutoff } },
      { $set: { isActive: false } }
    );
    console.log(`[Scheduler] Stale cleanup: marked ${result.modifiedCount} jobs as inactive`);
  } catch (err) {
    console.error('[Scheduler] Stale cleanup error:', err.message);
  }
}

// ─── Initialize the scheduler ─────────────────────────────────────────────────
export function initCrawlerScheduler() {
  console.log('[Scheduler] Initializing crawler scheduler...');

  // Company discovery once per day at 2 AM
  cron.schedule('0 2 * * *', () => {
    console.log('[Scheduler] Daily company discovery triggered');
    runDiscovery();
  });

  // Greenhouse + Lever ATS crawl every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    console.log('[Scheduler] 30-minute ATS crawl triggered');
    runCrawlBatch();
  });

  // Fantastic.jobs ingestion every 60 minutes, offset by 15 min
  cron.schedule('15 * * * *', () => {
    console.log('[Scheduler] Fantastic.jobs ingestion triggered');
    runFantasticIngestion();
  });

  // JSearch ingestion every 60 minutes, offset by 45 min
  cron.schedule('45 * * * *', () => {
    console.log('[Scheduler] JSearch ingestion triggered');
    runJSearchIngestion();
  });

  // Stale job cleanup once per day at 3 AM
  cron.schedule('0 3 * * *', () => {
    console.log('[Scheduler] Daily stale job cleanup triggered');
    cleanupStaleJobs();
  });

  // Startup sequence — stagger to avoid hammering everything at once
  setTimeout(async () => {
    try {
      const companyCount = await Company.countDocuments({ isActive: true });
      console.log(`[Scheduler] Startup: ${companyCount} companies in DB`);

      if (companyCount === 0) {
        console.log('[Scheduler] No companies found — running initial discovery...');
        await runDiscovery();
      }

      // Run ATS crawl first
      console.log('[Scheduler] Running initial ATS crawl batch...');
      await runCrawlBatch();

    } catch (err) {
      console.error('[Scheduler] Startup ATS crawl skipped — MongoDB not ready:', err.message);
    }
  }, 30000);

  // Fantastic.jobs startup ingestion — 2 minutes after server start
  setTimeout(async () => {
    try {
      console.log('[Scheduler] Running startup Fantastic.jobs ingestion...');
      await runFantasticIngestion();
    } catch (err) {
      console.error('[Scheduler] Startup Fantastic.jobs ingestion error:', err.message);
    }
  }, 120000);

  // JSearch startup ingestion — 4 minutes after server start
  setTimeout(async () => {
    try {
      console.log('[Scheduler] Running startup JSearch ingestion...');
      await runJSearchIngestion();
    } catch (err) {
      console.error('[Scheduler] Startup JSearch ingestion error:', err.message);
    }
  }, 240000);

  console.log('[Scheduler] Crawler scheduler initialized — sources: Greenhouse, Lever, Fantastic.jobs, JSearch');
}

// ─── Manual trigger endpoints (for admin use) ─────────────────────────────────
export async function triggerDiscovery() {
  return runDiscovery();
}

export async function triggerCrawl() {
  return runCrawlBatch();
}

export async function triggerCleanup() {
  return cleanupStaleJobs();
}

export async function triggerFantastic() {
  return runFantasticIngestion();
}

export async function triggerJSearch() {
  return runJSearchIngestion();
}
