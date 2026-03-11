import express from 'express';
import Job from '../models/Job.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { getCrawlerStats, triggerDiscovery, triggerCrawl, triggerUSAJobs } from '../services/crawlerScheduler.js';
import {
  classifyLocation,
  classifyRarity,
  passesFreshnessGate,
  scoreJob as scoreJobNew,
  evaluateBatchForSubscriber,
  TIER_CONFIG,
} from '../services/jobScoringService.js';

const router = express.Router();

// ─── Match Score Constants ────────────────────────────────────────────────────
const SCORE_TITLE        = 35;  // Title relevance
const SCORE_SENIORITY    = 20;  // Seniority / experience level
const SCORE_ARRANGEMENT  = 15;  // Work arrangement (remote/hybrid/onsite)
const SCORE_EMP_TYPE     = 10;  // Employment type (full-time, contract, etc.)
const SCORE_SKILLS       = 10;  // Skills keyword overlap
const SCORE_LOCATION     = 5;   // Location match
const SCORE_RECENCY      = 5;   // Freshness bonus
// Total max = 100

const MATCH_THRESHOLD = 75; // Minimum score to show a job in the feed

// ─── Seniority keyword maps ───────────────────────────────────────────────────
const SENIORITY_KEYWORDS = {
  'Entry Level':  ['entry', 'junior', 'associate', 'jr', 'graduate', 'intern', 'trainee'],
  'Mid Level':    ['mid', 'intermediate', 'ii', 'iii'],
  'Senior':       ['senior', 'sr', 'experienced', 'specialist'],
  'Lead':         ['lead', 'principal', 'staff', 'tech lead', 'team lead'],
  'Manager':      ['manager', 'mgr', 'supervisor', 'head of'],
  'Director':     ['director', 'dir'],
  'VP':           ['vp', 'vice president'],
  'C-Level':      ['ceo', 'cto', 'coo', 'cfo', 'chief', 'president', 'founder'],
};

// ─── Extract seniority from a job title ──────────────────────────────────────
function inferSeniorityFromTitle(title) {
  const t = (title || '').toLowerCase();
  const matched = [];
  for (const [level, patterns] of Object.entries(SENIORITY_KEYWORDS)) {
    if (patterns.some(p => t.includes(p))) matched.push(level);
  }
  return matched.length > 0 ? matched : ['Mid Level'];
}

// ─── Normalize location string for comparison ─────────────────────────────────
function normalizeLocation(loc) {
  return (loc || '').toLowerCase().replace(/[^a-z0-9\s,]/g, '').trim();
}

// ─── Check if a user location target matches a job location ──────────────────
function locationMatches(userTargets, jobLocation, jobRemote, jobHybrid) {
  if (jobRemote) return true; // remote jobs match any location
  if (!userTargets || !jobLocation) return false;

  const targets = userTargets
    .split(/[,\n]+/)
    .map(t => normalizeLocation(t))
    .filter(Boolean);

  const jobLoc = normalizeLocation(jobLocation);

  for (const target of targets) {
    if (target.includes('remote')) continue;
    const words = target.split(/\s+/);
    if (words.some(w => w.length >= 2 && jobLoc.includes(w))) return true;
    if (jobLoc.includes(target) || target.includes(jobLoc)) return true;
  }
  return false;
}

// ─── Main scoring function ────────────────────────────────────────────────────
export function scoreJobFull(job, onboarding) {
  const s8 = (onboarding || {}).s8 || {};
  const s6 = (onboarding || {}).s6 || {};

  let score = 0;
  const breakdown = {};

  // ── 1. Title match (0–35) ──────────────────────────────────────────────────
  const targetTitlesRaw = s8.targetTitles || '';
  const targetTitles = typeof targetTitlesRaw === 'string'
    ? targetTitlesRaw.split(/[,\n]+/).map(t => t.trim().toLowerCase()).filter(Boolean)
    : (Array.isArray(targetTitlesRaw) ? targetTitlesRaw.map(t => t.toLowerCase()) : []);

  const jobTitleNorm = (job.normalizedTitle || job.title || '').toLowerCase();
  let titleScore = 0;

  if (targetTitles.length > 0) {
    for (const target of targetTitles) {
      if (jobTitleNorm === target) {
        titleScore = SCORE_TITLE; break;
      }
      if (jobTitleNorm.includes(target) || target.includes(jobTitleNorm)) {
        titleScore = Math.max(titleScore, Math.round(SCORE_TITLE * 0.85));
      } else {
        const targetWords = target.split(/\s+/).filter(w => w.length > 2);
        const jobWords    = jobTitleNorm.split(/\s+/).filter(w => w.length > 2);
        const overlap     = targetWords.filter(w => jobWords.includes(w)).length;
        if (overlap > 0) {
          const ratio = overlap / Math.max(targetWords.length, 1);
          titleScore = Math.max(titleScore, Math.round(SCORE_TITLE * ratio * 0.7));
        }
      }
    }
  } else {
    titleScore = Math.round(SCORE_TITLE * 0.5); // no prefs = neutral
  }
  score += titleScore;
  breakdown.title = titleScore;

  // ── 2. Seniority match (0–20) ─────────────────────────────────────────────
  const userSeniority = Array.isArray(s8.seniority) ? s8.seniority : [];
  let seniorityScore = 0;

  if (userSeniority.length > 0) {
    const jobSeniority = inferSeniorityFromTitle(job.title);
    const levels = ['Entry Level', 'Mid Level', 'Senior', 'Lead', 'Manager', 'Director', 'VP', 'C-Level'];
    const exactMatch = userSeniority.some(us => jobSeniority.includes(us));
    const adjacentMatch = !exactMatch && userSeniority.some(us => {
      const ui = levels.indexOf(us);
      return jobSeniority.some(js => Math.abs(levels.indexOf(js) - ui) === 1);
    });

    if (exactMatch)         seniorityScore = SCORE_SENIORITY;
    else if (adjacentMatch) seniorityScore = Math.round(SCORE_SENIORITY * 0.5);
    else                    seniorityScore = Math.round(SCORE_SENIORITY * 0.3); // no signal in title
  } else {
    seniorityScore = Math.round(SCORE_SENIORITY * 0.5);
  }
  score += seniorityScore;
  breakdown.seniority = seniorityScore;

  // ── 3. Work arrangement (0–15) ────────────────────────────────────────────
  const workArrangement = Array.isArray(s8.workArrangement) ? s8.workArrangement : [];
  let arrangementScore = 0;

  if (workArrangement.length === 0 || workArrangement.includes('No Preference')) {
    arrangementScore = SCORE_ARRANGEMENT;
  } else {
    const wantRemote = workArrangement.some(w => w.toLowerCase().includes('remote'));
    const wantHybrid = workArrangement.some(w => w.toLowerCase().includes('hybrid'));
    const wantOnsite = workArrangement.some(w => w.toLowerCase().includes('on-site') || w.toLowerCase().includes('onsite'));

    if      (wantRemote && job.remote)                    arrangementScore = SCORE_ARRANGEMENT;
    else if (wantHybrid && job.hybrid)                    arrangementScore = SCORE_ARRANGEMENT;
    else if (wantOnsite && !job.remote && !job.hybrid)    arrangementScore = SCORE_ARRANGEMENT;
    else if (wantRemote && job.hybrid)                    arrangementScore = Math.round(SCORE_ARRANGEMENT * 0.6);
    else if (wantHybrid && !job.remote && !job.hybrid)    arrangementScore = Math.round(SCORE_ARRANGEMENT * 0.4);
  }
  score += arrangementScore;
  breakdown.arrangement = arrangementScore;

  // ── 4. Employment type (0–10) ─────────────────────────────────────────────
  const empType = Array.isArray(s8.empType) ? s8.empType : [];
  let empTypeScore = 0;

  if (empType.length === 0) {
    empTypeScore = SCORE_EMP_TYPE;
  } else if (job.employmentType) {
    const jobType = job.employmentType.toLowerCase();
    for (const et of empType) {
      const etL = et.toLowerCase().replace('-', ' ');
      if (jobType.replace('-', ' ').includes(etL) || etL.includes(jobType.replace('-', ' '))) {
        empTypeScore = SCORE_EMP_TYPE; break;
      }
    }
    if (empTypeScore === 0) empTypeScore = Math.round(SCORE_EMP_TYPE * 0.5);
  } else {
    empTypeScore = Math.round(SCORE_EMP_TYPE * 0.5);
  }
  score += empTypeScore;
  breakdown.empType = empTypeScore;

  // ── 5. Skills match (0–10) ────────────────────────────────────────────────
  const userSkills = [
    ...(s6.skills   || []).map(s => (typeof s === 'string' ? s : s.name || '').toLowerCase()),
    ...(s6.software || []).map(s => (typeof s === 'string' ? s : s.name || '').toLowerCase()),
  ].filter(Boolean);

  let skillsScore = 0;
  if (userSkills.length > 0) {
    const jobKeywords = (job.keywords || []).map(k => k.toLowerCase());
    const jobDesc     = (job.descriptionText || '').toLowerCase();
    const matched     = userSkills.filter(sk => jobKeywords.includes(sk) || jobDesc.includes(sk));
    const ratio       = matched.length / Math.min(userSkills.length, 10);
    skillsScore       = Math.round(SCORE_SKILLS * Math.min(ratio * 2, 1));
  } else {
    skillsScore = Math.round(SCORE_SKILLS * 0.5);
  }
  score += skillsScore;
  breakdown.skills = skillsScore;

  // ── 6. Location match (0–5) ───────────────────────────────────────────────
  const targetLocations = s8.targetLocations || '';
  let locationScore = 0;

  if (!targetLocations) {
    locationScore = SCORE_LOCATION;
  } else if (locationMatches(targetLocations, job.location, job.remote, job.hybrid)) {
    locationScore = SCORE_LOCATION;
  } else if (s8.relocate === 'Yes') {
    locationScore = Math.round(SCORE_LOCATION * 0.6);
  }
  score += locationScore;
  breakdown.location = locationScore;

  // ── 7. Recency bonus (0–5) ────────────────────────────────────────────────
  let recencyScore = 0;
  if (job.firstSeenAt) {
    const hoursOld = (Date.now() - new Date(job.firstSeenAt).getTime()) / (1000 * 60 * 60);
    if      (hoursOld <= 6)  recencyScore = SCORE_RECENCY;
    else if (hoursOld <= 24) recencyScore = Math.round(SCORE_RECENCY * 0.8);
    else if (hoursOld <= 48) recencyScore = Math.round(SCORE_RECENCY * 0.4);
  }
  score += recencyScore;
  breakdown.recency = recencyScore;

  return { score: Math.min(100, Math.round(score)), breakdown };
}

// ─── Check if user has enough onboarding data to apply threshold ──────────────
function hasOnboardingData(onboarding) {
  const s8 = (onboarding || {}).s8 || {};
  return !!(s8.targetTitles || (s8.seniority && s8.seniority.length) ||
            (s8.empType && s8.empType.length) || (s8.workArrangement && s8.workArrangement.length));
}

// ─── GET /api/jobs/feed — personalized, threshold-filtered job feed ───────────
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1, limit = 25,
      remote, hybrid, onsite, empType, postedWithin, search, company,
      showAll
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit) || 25);

    // Build base DB filter
    const filter = { isActive: true };
    const arrangementFilters = [];
    if (remote === 'true')  arrangementFilters.push({ remote: true });
    if (hybrid === 'true')  arrangementFilters.push({ hybrid: true });
    if (onsite === 'true')  arrangementFilters.push({ remote: false, hybrid: false });
    if (arrangementFilters.length > 0) filter.$or = arrangementFilters;
    if (empType)       filter.employmentType = { $regex: empType, $options: 'i' };
    if (postedWithin)  filter.firstSeenAt    = { $gte: new Date(Date.now() - parseInt(postedWithin) * 60 * 60 * 1000) };
    if (company)       filter.company        = { $regex: company, $options: 'i' };
    if (search)        filter.$text          = { $search: search };

    // Load user's full onboarding data
    const user = await User.findById(req.user.userId).select('onboardingData').lean();
    const onboarding    = user?.onboardingData || {};
    const s8            = onboarding.s8 || {};
    const userHasPrefs  = hasOnboardingData(onboarding);

    // Pre-filter at DB level by title (efficiency — reduces candidate pool)
    if (!search && s8.targetTitles) {
      const titles = typeof s8.targetTitles === 'string'
        ? s8.targetTitles.split(/[,\n]+/).map(t => t.trim()).filter(Boolean)
        : (Array.isArray(s8.targetTitles) ? s8.targetTitles : []);

      if (titles.length > 0) {
        const titleRegexes = titles.map(t => ({
          normalizedTitle: { $regex: t.toLowerCase().replace(/[^a-z0-9\s]/g, ''), $options: 'i' }
        }));
        if (filter.$or) {
          filter.$and = [{ $or: filter.$or }, { $or: titleRegexes }];
          delete filter.$or;
        } else {
          filter.$or = titleRegexes;
        }
      }
    }

    // Fetch a larger candidate pool to account for threshold filtering
    const candidateLimit = userHasPrefs ? Math.min(limitNum * 8, 500) : limitNum;

    const candidates = await Job.find(filter)
      .sort({ firstSeenAt: -1 })
      .limit(candidateLimit)
      .select('-descriptionHtml -__v')
      .lean();

    // Score every candidate against the full user profile
    const scored = candidates.map(job => {
      const { score, breakdown } = scoreJobFull(job, onboarding);
      return { ...job, matchScore: score, scoreBreakdown: breakdown };
    });

    // Apply 75% threshold (only when user has onboarding prefs)
    const threshold = (userHasPrefs && showAll !== 'true') ? MATCH_THRESHOLD : 0;
    const filtered  = scored.filter(j => j.matchScore >= threshold);

    // Sort: recency bucket first, then by match score within bucket
    filtered.sort((a, b) => {
      const aHours  = (Date.now() - new Date(a.firstSeenAt).getTime()) / (1000 * 60 * 60);
      const bHours  = (Date.now() - new Date(b.firstSeenAt).getTime()) / (1000 * 60 * 60);
      const aBucket = aHours <= 24 ? 0 : aHours <= 48 ? 1 : 2;
      const bBucket = bHours <= 24 ? 0 : bHours <= 48 ? 1 : 2;
      if (aBucket !== bBucket) return aBucket - bBucket;
      return b.matchScore - a.matchScore;
    });

    // Paginate in memory
    const total     = filtered.length;
    const skip      = (pageNum - 1) * limitNum;
    const pageJobs  = filtered.slice(skip, skip + limitNum);

    res.json({
      success: true,
      jobs: pageJobs,
      meta: {
        thresholdApplied: threshold,
        userHasPrefs,
        candidatesEvaluated: candidates.length,
        passedThreshold: filtered.length
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: skip + pageJobs.length < total
      }
    });
  } catch (err) {
    console.error('[Jobs] Feed error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch job feed' });
  }
});

// ─── GET /api/jobs/search — keyword search (no threshold, but scored) ─────────
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, location, remote, page = 1, limit = 25, postedWithin } = req.query;
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit) || 25);
    const skip     = (pageNum - 1) * limitNum;

    const filter = { isActive: true };
    if (q)                 filter.$text    = { $search: q };
    if (remote === 'true') filter.remote   = true;
    if (location)          filter.location = { $regex: location, $options: 'i' };
    if (postedWithin)      filter.firstSeenAt = { $gte: new Date(Date.now() - parseInt(postedWithin) * 60 * 60 * 1000) };

    const sortOptions   = q ? { score: { $meta: 'textScore' }, firstSeenAt: -1 } : { firstSeenAt: -1 };
    const selectOptions = q ? { score: { $meta: 'textScore' } } : {};

    const user = await User.findById(req.user.userId).select('onboardingData').lean();
    const onboarding = user?.onboardingData || {};

    const [jobs, total] = await Promise.all([
      Job.find(filter, selectOptions).sort(sortOptions).skip(skip).limit(limitNum).select('-descriptionHtml -__v').lean(),
      Job.countDocuments(filter)
    ]);

    const scored = jobs.map(job => {
      const { score, breakdown } = scoreJobFull(job, onboarding);
      return { ...job, matchScore: score, scoreBreakdown: breakdown };
    });

    res.json({
      success: true,
      jobs: scored,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (err) {
    console.error('[Jobs] Search error:', err);
    res.status(500).json({ success: false, message: 'Failed to search jobs' });
  }
});

// ─── GET /api/jobs/stats/overview ─────────────────────────────────────────────
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const [totalActive, addedLast24h, remoteCount, greenhouseCount, leverCount, companyCount] = await Promise.all([
      Job.countDocuments({ isActive: true }),
      Job.countDocuments({ isActive: true, firstSeenAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Job.countDocuments({ isActive: true, remote: true }),
      Job.countDocuments({ isActive: true, source: 'greenhouse' }),
      Job.countDocuments({ isActive: true, source: 'lever' }),
      Company.countDocuments({ isActive: true })
    ]);
    res.json({
      success: true,
      stats: {
        totalActiveJobs: totalActive,
        newLast24h: addedLast24h,
        remoteJobs: remoteCount,
        bySource: { greenhouse: greenhouseCount, lever: leverCount },
        companiesTracked: companyCount,
        matchThreshold: MATCH_THRESHOLD,
        crawler: getCrawlerStats()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get stats' });
  }
});

// ─── GET /api/jobs/:id — full job detail with score ───────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const user = await User.findById(req.user.userId).select('onboardingData').lean();
    const { score, breakdown } = scoreJobFull(job, user?.onboardingData || {});

    res.json({ success: true, job: { ...job, matchScore: score, scoreBreakdown: breakdown } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get job details' });
  }
});

// ─── POST /api/jobs/admin/trigger-crawl ───────────────────────────────────────
router.post('/admin/trigger-crawl', authenticateToken, async (req, res) => {
  triggerCrawl();
  res.json({ success: true, message: 'Crawl triggered' });
});

// ─── POST /api/jobs/admin/trigger-discovery ───────────────────────────────────
router.post('/admin/trigger-discovery', authenticateToken, async (req, res) => {
  triggerDiscovery();
  res.json({ success: true, message: 'Discovery triggered' });
});

// ─── POST /api/jobs/admin/trigger-usajobs ────────────────────────────────────
router.post('/admin/trigger-usajobs', authenticateToken, async (req, res) => {
  triggerUSAJobs();
  res.json({ success: true, message: 'USAJobs ingestion triggered' });
});


// ─── GET /api/jobs/matches — full above/below-the-line job matches ─────────────
// This is the primary endpoint for the JobMatches page.
router.get('/matches', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit) || 50);

    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const tier = (() => {
      const p = (user.plan || 'starter').toLowerCase();
      if (p === 'concierge') return 'concierge';
      if (p === 'pro') return 'pro';
      return 'starter';
    })();

    const tierConfig = TIER_CONFIG[tier];
    const cutoff = new Date(Date.now() - tierConfig.maxAgeMs);

    const recentJobs = await Job.find({
      isActive: true,
      firstSeenAt: { $gte: cutoff },
    }).limit(500).select('-descriptionHtml -__v').lean();

    const { aboveLine, belowLine, filtered, rarityAlerts, stats } = evaluateBatchForSubscriber(recentJobs, user);

    // Paginate above-the-line
    const skip = (pageNum - 1) * limitNum;
    const pagedAbove = aboveLine.slice(skip, skip + limitNum);

    return res.json({
      success: true,
      stats,
      aboveLine: pagedAbove,
      belowLine: belowLine.slice(0, 20),
      filtered: filtered.slice(0, 20),
      rarityAlerts: rarityAlerts.slice(0, 5),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: aboveLine.length,
        pages: Math.ceil(aboveLine.length / limitNum),
        hasMore: skip + pagedAbove.length < aboveLine.length,
      },
    });
  } catch (err) {
    console.error('[Jobs] Matches error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch job matches' });
  }
});

export default router;
