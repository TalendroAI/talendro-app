/**
 * routes/dashboard.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Dashboard API Routes — all endpoints serve live MongoDB data.
 *
 * Endpoints:
 *   GET  /api/dashboard/stats/:cid           — enriched stat cards
 *   GET  /api/dashboard/job-matches/:cid     — above/below-the-line job summary
 *   GET  /api/dashboard/applications/:cid    — recent applications with match scores
 *   GET  /api/dashboard/activities/:cid      — activity feed
 *   GET  /api/dashboard/search-status/:cid   — crawler engine status
 *   GET  /api/dashboard/resumes/:cid         — resume history
 *   GET  /api/dashboard/initial-search/:cid  — legacy: top matched jobs
 *   POST /api/dashboard/boolean-generator/:cid — boolean search string
 * ─────────────────────────────────────────────────────────────────────────────
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import {
  classifyLocation,
  classifyRarity,
  passesFreshnessGate,
  scoreJob,
  TIER_CONFIG,
} from '../services/jobScoringService.js';

const router = express.Router();

// ─── Plan name normalization ──────────────────────────────────────────────────
function normalizePlan(plan) {
  if (!plan) return 'starter';
  const p = plan.toLowerCase();
  if (p === 'premium' || p === 'concierge') return 'concierge';
  if (p === 'pro') return 'pro';
  return 'starter';
}

// ─── GET /api/dashboard/stats/:cid ──────────────────────────────────────────
router.get('/stats/:cid', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const [user, totalApplications] = await Promise.all([
      User.findById(userId).lean(),
      Application.countDocuments({ userId }),
    ]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tier = normalizePlan(user.plan);
    const tierConfig = TIER_CONFIG[tier];

    const tailoredCount = await Application.countDocuments({
      userId,
      tailoredResumeSnapshot: { $exists: true, $ne: null },
    });

    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const recentApps = await Application.find({
      userId,
      appliedAt: { $gte: fourWeeksAgo },
    }).select('appliedAt matchScore').lean();

    const weeklyHistory = [0, 1, 2, 3].map(weeksAgo => {
      const weekStart = new Date(Date.now() - (weeksAgo + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd   = new Date(Date.now() - weeksAgo * 7 * 24 * 60 * 60 * 1000);
      const count = recentApps.filter(a => a.appliedAt >= weekStart && a.appliedAt < weekEnd).length;
      return { week: `Week ${4 - weeksAgo}`, applications: count };
    });

    const scoredApps = recentApps.filter(a => a.matchScore != null);
    const avgMatchScore = scoredApps.length > 0
      ? Math.round(scoredApps.reduce((sum, a) => sum + a.matchScore, 0) / scoredApps.length)
      : null;

    const lastSearchRun = user.stats?.lastJobSearchRun || null;
    const nextSearchAt = lastSearchRun && tierConfig
      ? new Date(new Date(lastSearchRun).getTime() + tierConfig.searchIntervalMs).toISOString()
      : null;

    const recentActivity = await Application.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    const activityFeed = recentActivity.map(app => ({
      id: app._id,
      action: `Application ${app.status === 'applied' ? 'submitted' : app.status} — ${app.jobTitle || 'Job'} at ${app.company || 'Company'}`,
      timestamp: (app.updatedAt || app.appliedAt || app.createdAt || new Date()).toISOString(),
      type: 'application',
      status: app.status,
    }));

    return res.json({
      jobsSearched: user.stats?.totalJobsDiscovered || 0,
      resumesTailored: tailoredCount || totalApplications,
      applicationsSubmitted: totalApplications,
      avgMatchScore,
      tier,
      plan: user.plan,
      searchIntervalMinutes: Math.round(tierConfig.searchIntervalMs / 60000),
      maxJobAgeMinutes: Math.round(tierConfig.maxAgeMs / 60000),
      lastSearchRun,
      nextSearchAt,
      history: weeklyHistory,
      recentActivity: activityFeed,
      // Legacy fields for backward compat
      jobsSearched: user.stats?.totalJobsDiscovered || 0,
      resumes: user.resumeData?.optimized ? 1 : 0,
      applications: totalApplications,
      agents: 1,
    });
  } catch (err) {
    console.error('[dashboard/stats] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// ─── GET /api/dashboard/job-matches/:cid ────────────────────────────────────
router.get('/job-matches/:cid', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tier = normalizePlan(user.plan);
    const onboarding = user.onboardingData || {};
    const s8 = onboarding.s8 || {};
    const resumeData = user.resumeData || {};

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentJobs = await Job.find({
      isActive: true,
      firstSeenAt: { $gte: cutoff },
    }).limit(200).lean();

    const aboveLine = [];
    const belowLine = [];
    const filtered = [];
    let freshnessFiltered = 0;

    for (const job of recentJobs) {
      if (!passesFreshnessGate(job, tier)) {
        freshnessFiltered++;
        filtered.push({
          id: job._id,
          title: job.title,
          company: job.company,
          filterReason: 'freshness',
          filterLabel: 'Posting too old for your tier',
        });
        continue;
      }

      const { score, breakdown, strengths, concerns } = scoreJob(job, resumeData, onboarding);
      const locationLine = classifyLocation(job, s8);
      const rarity = classifyRarity(job.title);

      const tags = [];
      if (job.remote) tags.push({ label: 'Remote', color: 'green' });
      else if (job.hybrid) tags.push({ label: 'Hybrid', color: 'amber' });
      if (rarity === 'EXCEPTIONALLY_RARE') tags.push({ label: '⚡ Exceptionally Rare', color: 'red' });
      else if (rarity === 'RARE') tags.push({ label: '⭐ Rare Role', color: 'amber' });

      const jobResult = {
        id: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        remote: job.remote,
        hybrid: job.hybrid,
        salary: job.salary,
        applyUrl: job.applyUrl,
        jobUrl: job.jobUrl,
        firstSeenAt: job.firstSeenAt,
        postedAt: job.postedAt,
        source: job.source,
        score,
        breakdown,
        strengths,
        concerns,
        tags,
        rarity,
        locationLine,
      };

      if (locationLine === 'above') aboveLine.push(jobResult);
      else belowLine.push(jobResult);
    }

    aboveLine.sort((a, b) => b.score - a.score);
    belowLine.sort((a, b) => b.score - a.score);

    const rarityAlerts = [...aboveLine, ...belowLine].filter(j => j.rarity === 'EXCEPTIONALLY_RARE');

    return res.json({
      stats: {
        total: recentJobs.length,
        aboveLineCount: aboveLine.length,
        belowLineCount: belowLine.length,
        filteredCount: filtered.length,
        freshnessFiltered,
        rarityAlertCount: rarityAlerts.length,
      },
      aboveLine: aboveLine.slice(0, 5),
      belowLine: belowLine.slice(0, 5),
      filtered: filtered.slice(0, 5),
      rarityAlerts: rarityAlerts.slice(0, 3),
    });
  } catch (err) {
    console.error('[dashboard/job-matches] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch job matches' });
  }
});

// ─── GET /api/dashboard/applications/:cid ───────────────────────────────────
router.get('/applications/:cid', authenticateToken, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.userId })
      .sort({ appliedAt: -1 })
      .limit(20)
      .lean();

    const formatted = applications.map(app => ({
      id: app._id,
      title: app.jobTitle || 'Unknown Role',
      company: app.company || app.companyName || 'Unknown Company',
      location: app.location || '',
      remote: app.remote || false,
      date: app.appliedAt || app.createdAt,
      status: app.status || 'applied',
      matchScore: app.matchScore || null,
      resumeUsed: app.tailoredResumeSnapshot ? 'Tailored Resume' : 'Base Resume',
      source: app.source || 'manual',
      applyUrl: app.applyUrl || '',
      notes: app.notes || '',
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('[dashboard/applications] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// ─── GET /api/dashboard/activities/:cid ─────────────────────────────────────
router.get('/activities/:cid', authenticateToken, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .limit(15)
      .lean();

    const activities = applications.map(app => ({
      id: app._id,
      action: `Application ${app.status === 'applied' ? 'submitted' : app.status}`,
      detail: `${app.jobTitle || 'Job'} at ${app.company || 'Company'}`,
      date: (app.updatedAt || app.appliedAt || app.createdAt || new Date()).toISOString(),
      type: 'application',
      status: app.status,
      matchScore: app.matchScore,
    }));

    return res.json(activities);
  } catch (err) {
    console.error('[dashboard/activities] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// ─── GET /api/dashboard/search-status/:cid ──────────────────────────────────
router.get('/search-status/:cid', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tier = normalizePlan(user.plan);
    const tierConfig = TIER_CONFIG[tier];

    const lastSearchRun = user.stats?.lastJobSearchRun || null;
    const nextSearchAt = lastSearchRun
      ? new Date(new Date(lastSearchRun).getTime() + tierConfig.searchIntervalMs).toISOString()
      : null;

    const isSearchActive = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentJobCount = await Job.countDocuments({
      isActive: true,
      firstSeenAt: { $gte: last24h },
    });

    return res.json({
      status: isSearchActive ? 'active' : 'paused',
      tier,
      searchIntervalMinutes: Math.round(tierConfig.searchIntervalMs / 60000),
      maxJobAgeMinutes: Math.round(tierConfig.maxAgeMs / 60000),
      lastSearchRun,
      nextSearchAt,
      jobsDiscoveredLast24h: recentJobCount,
      totalJobsDiscovered: user.stats?.totalJobsDiscovered || 0,
      sources: ['Greenhouse', 'Lever', 'Workday', 'iCIMS', 'Ashby'],
    });
  } catch (err) {
    console.error('[dashboard/search-status] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch search status' });
  }
});

// ─── GET /api/dashboard/resumes/:cid ────────────────────────────────────────
router.get('/resumes/:cid', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resumes = [];
    if (user.resumeData?.optimized) {
      resumes.push({
        id: 'base',
        job: 'Base Resume (Optimized)',
        keywords: user.resumeData?.skills || [],
        date: user.resumeData?.optimizedAt || user.updatedAt,
        status: user.resumeData?.approved ? 'Approved' : 'Ready',
        downloadUrl: '/api/resume/download-pdf',
      });
    }

    const tailoredApps = await Application.find({
      userId: req.userId,
      tailoredResumeSnapshot: { $exists: true, $ne: null },
    }).select('jobTitle company appliedAt').sort({ appliedAt: -1 }).limit(10).lean();

    for (const app of tailoredApps) {
      resumes.push({
        id: app._id,
        job: `${app.jobTitle || 'Job'} at ${app.company || 'Company'}`,
        date: app.appliedAt,
        status: 'Tailored',
        downloadUrl: `/api/resume/tailored/${app._id}`,
      });
    }

    return res.json(resumes);
  } catch (err) {
    console.error('[dashboard/resumes] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// ─── GET /api/dashboard/initial-search/:cid ─────────────────────────────────
router.get('/initial-search/:cid', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tier = normalizePlan(user.plan);
    const onboarding = user.onboardingData || {};
    const resumeData = user.resumeData || {};

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentJobs = await Job.find({
      isActive: true,
      firstSeenAt: { $gte: cutoff },
    }).limit(100).lean();

    const scored = [];
    for (const job of recentJobs) {
      if (!passesFreshnessGate(job, tier)) continue;
      const { score } = scoreJob(job, resumeData, onboarding);
      const locationLine = classifyLocation(job, onboarding.s8 || {});
      if (locationLine === 'above' && score >= 50) scored.push({ job, score });
    }

    scored.sort((a, b) => b.score - a.score);

    const results = scored.slice(0, 10).map(({ job, score }) => ({
      id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary || 'Not specified',
      snippet: job.descriptionText ? job.descriptionText.substring(0, 150) + '...' : '',
      url: job.applyUrl || job.jobUrl,
      postedDate: job.postedAt || job.firstSeenAt,
      matchScore: score,
      keywords: job.keywords || [],
      atsType: job.source || 'generic',
      rarity: classifyRarity(job.title),
    }));

    if (results.length === 0) {
      const fallback = await Job.find({ isActive: true }).sort({ firstSeenAt: -1 }).limit(10).lean();
      return res.json({
        results: fallback.map(job => ({
          id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          salary: 'Not specified',
          snippet: job.descriptionText ? job.descriptionText.substring(0, 150) + '...' : '',
          url: job.applyUrl || job.jobUrl,
          postedDate: job.postedAt || job.firstSeenAt,
          matchScore: 0,
          keywords: job.keywords || [],
          atsType: job.source || 'generic',
          rarity: classifyRarity(job.title),
        })),
      });
    }

    return res.json({ results });
  } catch (err) {
    console.error('[dashboard/initial-search] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch initial job matches' });
  }
});

// ─── POST /api/dashboard/boolean-generator/:cid ─────────────────────────────
router.post('/boolean-generator/:cid', (req, res) => {
  const { skills, jobTitles, locations, industries } = req.body;
  const jobTitleQuery = jobTitles?.map(t => `"${t}"`).join(' OR ') || '"talent acquisition" OR "recruiting"';
  const skillsQuery   = skills?.map(s => `"${s}"`).join(' OR ') || '"ATS" OR "Greenhouse" OR "Lever"';
  const locationQuery = locations?.map(l => `"${l}"`).join(' OR ') || '"remote" OR "hybrid"';
  const industryQuery = industries?.map(i => `"${i}"`).join(' OR ') || '"technology" OR "healthcare"';
  const booleanString = `(${jobTitleQuery}) AND (${skillsQuery}) AND (${locationQuery}) AND (${industryQuery})`;
  return res.json({
    booleanString,
    searchQuery: { jobTitles, skills, locations, industries },
    generatedAt: new Date().toISOString(),
  });
});

// ─── GET /api/dashboard/resumes/download/:resumeId ──────────────────────────
router.get('/resumes/download/:resumeId', authenticateToken, (req, res) => {
  return res.redirect('/api/resume/download-pdf');
});

export default router;
