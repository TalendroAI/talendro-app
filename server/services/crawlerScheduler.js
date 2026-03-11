/**
 * Crawler Scheduler
 *
 * Orchestrates all job ingestion sources on a rotating schedule:
 *
 * Sources:
 *   - Greenhouse ATS (direct API, 300+ seeded companies — startup/tech heavy)
 *   - Lever ATS (direct API, 230+ seeded companies — startup/tech heavy)
 *   - Ashby ATS (direct API, 200+ seeded companies — high-growth startups, free public API)
 *   - SmartRecruiters ATS (direct API, 200+ seeded companies — enterprise/Fortune 500, free public API)
 *   - USAJobs (federal government, free API with registration — requires USAJOBS_API_KEY)
 *   - Fantastic.jobs (175,000+ career sites via RapidAPI — requires RAPIDAPI_KEY)
 *   - JSearch / Google for Jobs (broad aggregation via RapidAPI — requires RAPIDAPI_KEY)
 *
 * Schedule:
 *   - Company discovery (all ATS sources): once per day at 2 AM
 *   - ATS crawl batch (Greenhouse + Lever + Ashby + SmartRecruiters): every 30 minutes
 *   - USAJobs ingestion: every 60 minutes (offset by 10 min)
 *   - Fantastic.jobs ingestion: every 60 minutes (offset by 15 min from ATS crawl)
 *   - JSearch ingestion: every 60 minutes (offset by 45 min from ATS crawl)
 *   - Stale job cleanup: once per day at 3 AM
 */

import cron from 'node-cron';
import pLimit from 'p-limit';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { discoverGreenhouseCompanies, crawlGreenhouseCompany } from './greenhouseCrawler.js';
import { discoverLeverCompanies, crawlLeverCompany } from './leverCrawler.js';
import { discoverAshbyCompanies, crawlAshbyCompany } from './ashbyCrawler.js';
import { discoverSmartRecruitersCompanies, crawlSmartRecruitersCompany } from './smartRecruitersCrawler.js';
import { fetchAndIngestUSAJobs } from './usajobsCrawler.js';
import { fetchAndIngestFantasticJobs } from './fantasticJobsService.js';
import { fetchAndIngestJSearchJobs } from './jsearchService.js';
import { evaluateBatchForUser, TIER_CONFIG } from './jobScoringService.js';
import emailService from './emailService.js';
import applicationQueue from './queueService.js';

const BATCH_SIZE = 50;        // companies to crawl per run
const CONCURRENCY = 3;        // max parallel requests
const STALE_HOURS = 72;       // mark jobs inactive after 72 hours of not being seen
const DELAY_MS = 400;         // ms between requests
const SCORING_CONCURRENCY = 2; // max parallel per-subscriber scoring runs

// Track rarity alert cooldowns to avoid duplicate emails (24h per user)
const rarityAlertSentAt = new Map(); // userId -> timestamp
const RARITY_ALERT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let isDiscoveryRunning = false;
let isCrawlRunning = false;
let isFantasticRunning = false;
let isJSearchRunning = false;
let isUSAJobsRunning = false;

let crawlStats = {
  lastRun: null,
  companiesCrawled: 0,
  newJobsFound: 0,
  errors: 0,
  totalActiveJobs: 0,
  sources: {
    greenhouse: { lastRun: null, newJobs: 0 },
    lever: { lastRun: null, newJobs: 0 },
    ashby: { lastRun: null, newJobs: 0 },
    smartrecruiters: { lastRun: null, newJobs: 0 },
    usajobs: { lastRun: null, newJobs: 0, skipped: false },
    fantastic: { lastRun: null, newJobs: 0, skipped: false },
    jsearch: { lastRun: null, newJobs: 0, skipped: false }
  }
};

// ─── Get crawler stats (for API endpoint) ────────────────────────────────────
export function getCrawlerStats() {
  return { ...crawlStats };
}

// ─── Per-subscriber scoring pass ─────────────────────────────────────────────
/**
 * Runs the scoring engine for every active subscriber against recently
 * discovered jobs. Dispatches rarity alert emails (max once per 24h per user)
 * when EXCEPTIONALLY_RARE roles are found.
 *
 * Tier-based freshness gates ensure:
 *   Concierge: jobs up to 90 min old
 *   Pro:       jobs up to 2 hours old
 *   Starter:   jobs up to 5 hours old
 */
let isScoringRunning = false;

async function runSubscriberScoringPass() {
  if (isScoringRunning) {
    console.log('[Scheduler] Subscriber scoring already running, skipping');
    return;
  }
  isScoringRunning = true;
  console.log('[Scheduler] Starting per-subscriber scoring pass...');
  const startTime = Date.now();
  let usersScored = 0;
  let totalRarityAlerts = 0;

  try {
    const subscribers = await User.find({
      plan: { $in: ['starter', 'pro', 'concierge'] },
      isActive: { $ne: false },
    }).lean();

    if (subscribers.length === 0) {
      console.log('[Scheduler] No active subscribers to score');
      return;
    }

    // Use the most generous lookback (concierge) so all tiers see recent jobs
    const lookbackMs = TIER_CONFIG.concierge.maxAgeMs;
    const lookbackCutoff = new Date(Date.now() - lookbackMs);

    const recentJobs = await Job.find({
      isActive: true,
      firstSeenAt: { $gte: lookbackCutoff },
    }).lean();

    if (recentJobs.length === 0) {
      console.log('[Scheduler] No new jobs in lookback window — skipping scoring pass');
      return;
    }

    console.log(`[Scheduler] Scoring ${recentJobs.length} recent jobs for ${subscribers.length} subscribers...`);

    const limiter = pLimit(SCORING_CONCURRENCY);
    const tasks = subscribers.map(user =>
      limiter(async () => {
        try {
          const result = await evaluateBatchForUser(recentJobs, user);
          usersScored++;

          // ── Auto-Apply: enqueue above-the-line jobs that should auto-apply ──
          if (process.env.ENABLE_AUTO_APPLY === 'true' && result.aboveLine && result.aboveLine.length > 0) {
            for (const match of result.aboveLine) {
              if (!match.shouldAutoApply) continue;
              const jobDoc = match.job;
              const applyUrl = jobDoc.applyUrl || jobDoc.jobUrl;
              if (!applyUrl) continue;
              // Derive atsType from job source
              const sourceToAts = { greenhouse: 'greenhouse', lever: 'lever' };
              const atsType = sourceToAts[jobDoc.source] || 'generic';
              applicationQueue.enqueue({
                userId: String(user._id),
                jobId:  String(jobDoc._id),
                atsType,
                applyUrl,
                matchScore: match.score,
              });
            }
          }

          if (result.rarityAlerts && result.rarityAlerts.length > 0 && user.email) {
            const lastSent = rarityAlertSentAt.get(String(user._id)) || 0;
            if (Date.now() - lastSent > RARITY_ALERT_COOLDOWN_MS) {
              const topAlert = result.rarityAlerts[0];
              const job = topAlert.job || topAlert;
              try {
                await emailService.sendRareRoleAlert({
                  to: user.email,
                  name: user.name || 'there',
                  title: job.title,
                  company: job.company,
                  location: job.location,
                  salary: job.salary,
                  postedAgo: 'just now',
                  jobUrl: job.jobUrl || job.applyUrl || '#',
                  rarity: 'exceptionally_rare',
                });
                rarityAlertSentAt.set(String(user._id), Date.now());
                totalRarityAlerts++;
                console.log(`[Scheduler] Rarity alert sent to ${user.email}: ${job.title} @ ${job.company}`);
              } catch (emailErr) {
                console.error(`[Scheduler] Rarity alert email failed for ${user.email}:`, emailErr.message);
              }
            }
          }
        } catch (err) {
          console.error(`[Scheduler] Scoring error for user ${user._id}:`, err.message);
        }
      })
    );

    await Promise.all(tasks);
    console.log(`[Scheduler] Scoring pass complete: ${usersScored} users, ${totalRarityAlerts} rarity alerts sent (${Date.now() - startTime}ms)`);
  } catch (err) {
    console.error('[Scheduler] Subscriber scoring pass error:', err.message);
  } finally {
    isScoringRunning = false;
  }
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
    const [ghResult, lvResult, ashbyResult, srResult] = await Promise.allSettled([
      discoverGreenhouseCompanies(),
      discoverLeverCompanies(),
      discoverAshbyCompanies(),
      discoverSmartRecruitersCompanies()
    ]);

    const ghAdded = ghResult.status === 'fulfilled' ? ghResult.value.added : 0;
    const lvAdded = lvResult.status === 'fulfilled' ? lvResult.value.added : 0;
    const ashbyAdded = ashbyResult.status === 'fulfilled' ? ashbyResult.value.added : 0;
    const srAdded = srResult.status === 'fulfilled' ? srResult.value.added : 0;

    console.log(`[Scheduler] Discovery complete: +${ghAdded} Greenhouse, +${lvAdded} Lever, +${ashbyAdded} Ashby, +${srAdded} SmartRecruiters companies`);
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
          } else if (company.source === 'ashby') {
            result = await crawlAshbyCompany(company);
          } else if (company.source === 'smartrecruiters') {
            result = await crawlSmartRecruitersCompany(company);
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

// ─── Run USAJobs ingestion ───────────────────────────────────────────────────
async function runUSAJobsIngestion() {
  if (isUSAJobsRunning) {
    console.log('[Scheduler] USAJobs ingestion already running, skipping');
    return;
  }
  isUSAJobsRunning = true;
  console.log('[Scheduler] Starting USAJobs ingestion...');

  try {
    const result = await fetchAndIngestUSAJobs();
    crawlStats.sources.usajobs = {
      lastRun: new Date(),
      newJobs: result.newJobs,
      skipped: result.skipped || false
    };
    if (!result.skipped) {
      crawlStats.totalActiveJobs = await Job.countDocuments({ isActive: true });
    }
  } catch (err) {
    console.error('[Scheduler] USAJobs ingestion error:', err.message);
  } finally {
    isUSAJobsRunning = false;
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

// ─── Weekly digest sender ───────────────────────────────────────────────────────────
async function sendWeeklyDigestToAllSubscribers() {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const subscribers = await User.find({
      subscriptionStatus: 'active',
      email: { $exists: true, $ne: '' },
    }).select('email name plan stats').lean();

    console.log(`[Scheduler] Sending weekly digest to ${subscribers.length} active subscribers`);
    let sent = 0;
    let failed = 0;

    for (const user of subscribers) {
      try {
        // Count applications submitted in the past 7 days
        const Application = (await import('../models/Application.js')).default;
        const applicationsThisWeek = await Application.countDocuments({
          userId: user._id,
          appliedAt: { $gte: oneWeekAgo },
        });

        // Top job matches from the past week
        const topJobs = await Job.find({
          isActive: true,
          postedAt: { $gte: oneWeekAgo },
        }).sort({ score: -1 }).limit(5).lean();

        const topMatches = topJobs.map(j => ({
          title: j.title,
          company: j.company,
          score: j.score || 80,
          url: j.applyUrl || '',
        }));

        await emailService.sendWeeklyDigest({
          toEmail: user.email,
          userName: user.name || user.email.split('@')[0],
          plan: user.plan || 'pro',
          applicationsThisWeek,
          jobsDiscovered: user.stats?.totalJobsDiscovered || 0,
          topMatches,
        });
        sent++;
      } catch (userErr) {
        console.error(`[Scheduler] Weekly digest failed for ${user.email}:`, userErr.message);
        failed++;
      }
    }
    console.log(`[Scheduler] Weekly digest complete: ${sent} sent, ${failed} failed`);
  } catch (err) {
    console.error('[Scheduler] Weekly digest batch error:', err.message);
  }
}

// ─── Initialize the scheduler ───────────────────────────────────────────────────────────
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

  // USAJobs ingestion every 60 minutes, offset by 10 min
  cron.schedule('10 * * * *', () => {
    console.log('[Scheduler] USAJobs ingestion triggered');
    runUSAJobsIngestion();
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

  // Per-subscriber scoring pass every 15 minutes
  // Ensures Concierge subscribers see new jobs within 15 min of discovery
  cron.schedule('*/15 * * * *', () => {
    console.log('[Scheduler] 15-minute subscriber scoring pass triggered');
    runSubscriberScoringPass();
  });

  // Weekly digest email — every Monday at 8 AM
  cron.schedule('0 8 * * 1', () => {
    console.log('[Scheduler] Weekly digest email triggered');
    sendWeeklyDigestToAllSubscribers();
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

  // USAJobs startup ingestion — 3 minutes after server start
  setTimeout(async () => {
    try {
      console.log('[Scheduler] Running startup USAJobs ingestion...');
      await runUSAJobsIngestion();
    } catch (err) {
      console.error('[Scheduler] Startup USAJobs ingestion error:', err.message);
    }
  }, 180000);

  // JSearch startup ingestion — 5 minutes after server start
  setTimeout(async () => {
    try {
      console.log('[Scheduler] Running startup JSearch ingestion...');
      await runJSearchIngestion();
    } catch (err) {
      console.error('[Scheduler] Startup JSearch ingestion error:', err.message);
    }
  }, 300000);

  console.log('[Scheduler] Crawler scheduler initialized — sources: Greenhouse, Lever, Ashby, SmartRecruiters, USAJobs, Fantastic.jobs, JSearch');
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

export async function triggerUSAJobs() {
  return runUSAJobsIngestion();
}

export async function triggerScoringPass() {
  return runSubscriberScoringPass();
}
