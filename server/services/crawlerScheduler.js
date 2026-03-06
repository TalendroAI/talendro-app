/**
 * Crawler Scheduler
 * 
 * Orchestrates the ATS crawlers on a rotating schedule:
 * - Company discovery: runs once per day
 * - Job crawling: runs every 30 minutes, processing a batch of companies
 * - Stale job cleanup: runs once per day, marks jobs not seen in 48h as inactive
 * 
 * Rate limiting: max 5 concurrent requests, 300ms delay between each.
 * This keeps us well within polite usage limits for both Greenhouse and Lever.
 */

import cron from 'node-cron';
import pLimit from 'p-limit';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import { discoverGreenhouseCompanies, crawlGreenhouseCompany } from './greenhouseCrawler.js';
import { discoverLeverCompanies, crawlLeverCompany } from './leverCrawler.js';

const BATCH_SIZE = 50;        // companies to crawl per run
const CONCURRENCY = 3;        // max parallel requests
const STALE_HOURS = 72;       // mark jobs inactive after 72 hours of not being seen
const DELAY_MS = 400;         // ms between requests

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let isDiscoveryRunning = false;
let isCrawlRunning = false;
let crawlStats = {
  lastRun: null,
  companiesCrawled: 0,
  newJobsFound: 0,
  errors: 0,
  totalActiveJobs: 0
};

// ─── Get crawler stats (for API endpoint) ────────────────────────────────────
export function getCrawlerStats() {
  return { ...crawlStats };
}

// ─── Run company discovery ────────────────────────────────────────────────────
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

// ─── Run a batch of job crawls ────────────────────────────────────────────────
async function runCrawlBatch() {
  if (isCrawlRunning) {
    console.log('[Scheduler] Crawl already running, skipping');
    return;
  }
  isCrawlRunning = true;
  const startTime = Date.now();
  let newJobs = 0;
  let errors = 0;
  let crawled = 0;

  try {
    // Pick the next batch of companies to crawl:
    // Priority: companies that haven't been crawled recently, ordered by priority desc
    const companies = await Company.find({
      isActive: true,
      $or: [
        { lastCrawledAt: null },
        { lastCrawledAt: { $lt: new Date(Date.now() - 25 * 60 * 1000) } } // not crawled in last 25 min
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
          // Individual company errors are already logged in the crawlers
        }
        await sleep(DELAY_MS);
      })
    );

    await Promise.all(tasks);

    // Update stats
    const totalActive = await Job.countDocuments({ isActive: true });
    crawlStats = {
      lastRun: new Date(),
      companiesCrawled: crawled,
      newJobsFound: newJobs,
      errors,
      totalActiveJobs: totalActive,
      durationMs: Date.now() - startTime
    };

    console.log(`[Scheduler] Crawl complete: ${crawled} companies, ${newJobs} new jobs, ${errors} errors (${Date.now() - startTime}ms)`);

  } catch (err) {
    console.error('[Scheduler] Crawl batch error:', err.message);
  } finally {
    isCrawlRunning = false;
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

  // Run company discovery once per day at 2 AM
  cron.schedule('0 2 * * *', () => {
    console.log('[Scheduler] Daily company discovery triggered');
    runDiscovery();
  });

  // Run job crawl every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    console.log('[Scheduler] 30-minute crawl triggered');
    runCrawlBatch();
  });

  // Run stale job cleanup once per day at 3 AM
  cron.schedule('0 3 * * *', () => {
    console.log('[Scheduler] Daily stale job cleanup triggered');
    cleanupStaleJobs();
  });

  // Run an initial crawl on startup (after a 30-second delay to let DB connect)
  setTimeout(async () => {
    try {
      const companyCount = await Company.countDocuments({ isActive: true });
      console.log(`[Scheduler] Startup: ${companyCount} companies in DB`);

      if (companyCount === 0) {
        // First run — discover companies first, then crawl
        console.log('[Scheduler] No companies found — running initial discovery...');
        await runDiscovery();
      }

      // Run initial crawl
      console.log('[Scheduler] Running initial crawl batch...');
      await runCrawlBatch();
    } catch (err) {
      console.error('[Scheduler] Startup crawl skipped — MongoDB not ready:', err.message);
    }
  }, 30000);

  console.log('[Scheduler] Crawler scheduler initialized');
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
