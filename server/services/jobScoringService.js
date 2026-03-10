/**
 * jobScoringService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Production job scoring engine for Talendro.
 *
 * Implements:
 *   1. Domain Filter  — hard gate: must be TA/Recruiting/HR-tech leadership
 *   2. Location Gate  — hard gate: remote OR within subscriber's target metro
 *   3. Rarity Classifier — flags exceptionally rare roles for immediate alerts
 *   4. Four-factor weighted scoring:
 *        Hard Skill Alignment     40 pts
 *        Recency & Seniority      30 pts
 *        Quantifiable Impact      20 pts
 *        Contextual Fit           10 pts
 *   5. Above/Below-the-line classification
 *
 * Tier freshness windows (max posting age = search interval + 1 hr):
 *   Starter    — every 4 hrs  → max age 5 hrs
 *   Pro        — every 60 min → max age 2 hrs
 *   Concierge  — every 30 min → max age 90 min
 */

// ─── Domain Definitions ───────────────────────────────────────────────────────

// Titles that PASS the domain filter (TA / Recruiting / HR-Tech leadership)
const DOMAIN_PASS_PATTERNS = [
  /talent\s*acquisition/i,
  /\brecruiting\b/i,
  /\brecruitment\b/i,
  /\brecruiter\b/i,
  /talent\s*management/i,
  /head\s+of\s+talent/i,
  /chief\s+talent/i,
  /\bta\s+leader/i,
  /\bta\s+director/i,
  /\bta\s+vp\b/i,
  /workforce\s+planning/i,
  /employer\s+branding/i,
  /\brpo\b/i,
  /\bmsp\b/i,
  /hr\s+tech/i,
  /hrtech/i,
  /people\s+operations/i,
];

// Titles that FAIL the domain filter regardless of other matches
const DOMAIN_FAIL_PATTERNS = [
  /\bchro\b/i,
  /chief\s+human\s+resources/i,
  /chief\s+people\s+officer/i,
  /\bcpo\b/i,
  /vp\s+human\s+resources(?!\s*.*talent)/i,
  /svp\s+human\s+resources(?!\s*.*talent)/i,
  /vp\s+hr(?!\s*.*talent)/i,
  /learning\s+(&|and)\s+development/i,
  /\bl&d\b/i,
  /talent\s+development/i,
  /talent\s+engagement/i,
  /compensation\s+(&|and)\s+benefits/i,
  /\bdei\b/i,
  /diversity\s+(&|and)\s+inclusion/i,
  /payroll/i,
  /benefits\s+administration/i,
];

// Rarity tiers — how many times per year these titles appear nationally
const RARITY_TIERS = {
  EXCEPTIONALLY_RARE: [
    /chief\s+talent\s+acquisition\s+officer/i,
    /chief\s+talent\s+officer/i,
    /\bctao\b/i,
    /\bcto\b.*talent/i,
    /global\s+head\s+of\s+talent\s+acquisition/i,
    /evp.*talent\s+acquisition/i,
  ],
  RARE: [
    /svp.*talent\s+acquisition/i,
    /senior\s+vice\s+president.*talent/i,
    /vp.*global.*talent/i,
    /global\s+vp.*talent/i,
    /head\s+of\s+global\s+talent/i,
  ],
};

// ─── Tier Configuration ───────────────────────────────────────────────────────

export const TIER_CONFIG = {
  starter:   { searchIntervalMs: 4 * 60 * 60 * 1000,      maxAgeMs: 5 * 60 * 60 * 1000 },
  pro:       { searchIntervalMs: 60 * 60 * 1000,           maxAgeMs: 2 * 60 * 60 * 1000 },
  concierge: { searchIntervalMs: 30 * 60 * 1000,           maxAgeMs: 90 * 60 * 1000 },
};

// ─── Domain Filter ────────────────────────────────────────────────────────────

/**
 * Returns true if the job title is within the TA/Recruiting domain.
 * Hard fail patterns take precedence over pass patterns.
 */
export function passedDomainFilter(title = '') {
  // Check fail patterns first — these are hard excludes
  for (const pattern of DOMAIN_FAIL_PATTERNS) {
    if (pattern.test(title)) return false;
  }
  // Check pass patterns
  for (const pattern of DOMAIN_PASS_PATTERNS) {
    if (pattern.test(title)) return true;
  }
  return false;
}

// ─── Location Gate ────────────────────────────────────────────────────────────

/**
 * Returns 'above' if the job passes the location filter (should be applied to),
 * or 'below' if it fails (should be shown but not applied to).
 *
 * @param {Object} job          — job document from DB
 * @param {Object} userPrefs    — subscriber's onboarding preferences (s8 section)
 * @returns {'above'|'below'}
 */
export function classifyLocation(job, userPrefs = {}) {
  const { locationPreference, targetLocations, openToRelocation } = userPrefs;

  // If subscriber has no location preference set, everything is above the line
  if (!locationPreference || locationPreference === 'open') return 'above';

  // Remote jobs always pass
  if (job.remote === true) return 'above';

  // If subscriber wants remote only, non-remote jobs go below the line
  if (locationPreference === 'remote_only') return 'below';

  // If subscriber has specific metro targets, check proximity
  if (targetLocations) {
    const targets = targetLocations
      .split(/[,\n]+/)
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    const jobLoc = (job.location || '').toLowerCase();

    for (const target of targets) {
      if (target === 'remote') continue;
      const words = target.split(/\s+/).filter(w => w.length >= 3);
      if (words.some(w => jobLoc.includes(w))) return 'above';
      if (jobLoc.includes(target) || target.includes(jobLoc)) return 'above';
    }
  }

  // If subscriber is open to relocation, show below the line but flag it
  if (openToRelocation) return 'below';

  return 'below';
}

// ─── Rarity Classifier ────────────────────────────────────────────────────────

/**
 * Returns 'EXCEPTIONALLY_RARE', 'RARE', or null.
 */
export function classifyRarity(title = '') {
  for (const pattern of RARITY_TIERS.EXCEPTIONALLY_RARE) {
    if (pattern.test(title)) return 'EXCEPTIONALLY_RARE';
  }
  for (const pattern of RARITY_TIERS.RARE) {
    if (pattern.test(title)) return 'RARE';
  }
  return null;
}

// ─── Freshness Gate ───────────────────────────────────────────────────────────

/**
 * Returns true if the job is fresh enough for this subscriber's tier.
 * Uses firstSeenAt (when WE first crawled it) as the freshness timestamp.
 */
export function passesFreshnessGate(job, tier = 'starter') {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.starter;
  const cutoff = new Date(Date.now() - config.maxAgeMs);
  const jobDate = job.firstSeenAt || job.postedAt || job.createdAt;
  if (!jobDate) return false;
  return new Date(jobDate) >= cutoff;
}

// ─── Four-Factor Scoring Engine ───────────────────────────────────────────────

/**
 * Scores a job against a subscriber's profile using the four-factor model.
 *
 * Factor weights:
 *   Hard Skill Alignment   40 pts  — keyword overlap between JD and resume
 *   Recency & Seniority    30 pts  — title level match + years of experience
 *   Quantifiable Impact    20 pts  — evidence of measurable results in resume
 *   Contextual Fit         10 pts  — industry, company size, work arrangement
 *
 * @param {Object} job          — job document
 * @param {Object} resumeData   — subscriber's parsed/optimized resume data
 * @param {Object} onboarding   — subscriber's onboarding preferences
 * @returns {{ score: number, breakdown: Object, strengths: string[], concerns: string[] }}
 */
export function scoreJob(job, resumeData = {}, onboarding = {}) {
  const s8 = onboarding.s8 || {};
  const breakdown = {};
  const strengths = [];
  const concerns = [];

  // ── Factor 1: Hard Skill Alignment (0–40) ──────────────────────────────────
  const jobText = [
    job.title || '',
    job.descriptionText || '',
    (job.requirements || []).join(' '),
    (job.keywords || []).join(' '),
  ].join(' ').toLowerCase();

  // Extract skills from resume
  const resumeSkills = extractResumeSkills(resumeData);
  const resumeText = buildResumeText(resumeData).toLowerCase();

  let skillMatches = 0;
  let totalSkills = Math.max(resumeSkills.length, 1);

  for (const skill of resumeSkills) {
    if (jobText.includes(skill.toLowerCase())) skillMatches++;
  }

  // Also check for TA-specific keyword overlap
  const taKeywords = [
    'talent acquisition', 'recruiting', 'recruitment', 'sourcing', 'applicant tracking',
    'ats', 'greenhouse', 'lever', 'workday', 'icims', 'employer branding',
    'candidate experience', 'workforce planning', 'rpo', 'msp', 'diversity hiring',
    'executive search', 'full cycle recruiting', 'high volume recruiting',
    'onboarding', 'offer management', 'headcount', 'pipeline', 'boolean search',
  ];

  let taMatches = 0;
  for (const kw of taKeywords) {
    if (jobText.includes(kw) && resumeText.includes(kw)) taMatches++;
  }

  const skillRatio = skillMatches / totalSkills;
  const taBonus = Math.min(10, taMatches * 1.5);
  const hardSkillScore = Math.min(40, Math.round(skillRatio * 30 + taBonus));

  breakdown.hardSkills = hardSkillScore;
  if (hardSkillScore >= 30) strengths.push('Strong keyword alignment with job requirements');
  else if (hardSkillScore < 15) concerns.push('Limited keyword overlap with job description');

  // ── Factor 2: Recency & Seniority (0–30) ──────────────────────────────────
  const userTargetTitles = (s8.targetTitles || '').toLowerCase();
  const jobTitleLower = (job.title || '').toLowerCase();
  const jobNormTitle = (job.normalizedTitle || jobTitleLower);

  // Title match
  let titleMatch = 0;
  if (userTargetTitles) {
    const targets = userTargetTitles.split(/[,\n]+/).map(t => t.trim()).filter(Boolean);
    for (const t of targets) {
      if (jobNormTitle === t) { titleMatch = 15; break; }
      if (jobNormTitle.includes(t) || t.includes(jobNormTitle)) { titleMatch = Math.max(titleMatch, 12); }
      else {
        const tw = t.split(/\s+/), jw = jobNormTitle.split(/\s+/);
        const overlap = tw.filter(w => jw.includes(w)).length;
        if (overlap > 0) titleMatch = Math.max(titleMatch, Math.round(12 * overlap / Math.max(tw.length, 1)));
      }
    }
  } else {
    titleMatch = 8; // neutral if no target titles set
  }

  // Seniority match
  const userSeniority = Array.isArray(s8.seniority) ? s8.seniority : [];
  const jobSeniority = inferSeniority(job.title);
  let seniorityMatch = 0;
  if (userSeniority.length === 0) {
    seniorityMatch = 8; // neutral
  } else {
    const levels = ['Entry Level', 'Mid Level', 'Senior', 'Lead', 'Manager', 'Director', 'VP', 'C-Level'];
    const exact = userSeniority.some(us => jobSeniority.includes(us));
    const adjacent = !exact && userSeniority.some(us => {
      const ui = levels.indexOf(us);
      return jobSeniority.some(js => Math.abs(levels.indexOf(js) - ui) === 1);
    });
    seniorityMatch = exact ? 15 : adjacent ? 10 : 3;
  }

  const recencySeniorityScore = Math.min(30, titleMatch + seniorityMatch);
  breakdown.recencySeniority = recencySeniorityScore;

  if (seniorityMatch >= 12) strengths.push('Seniority level aligns with target role');
  else if (seniorityMatch <= 3) concerns.push('Seniority level may not align with your target');

  // ── Factor 3: Quantifiable Impact (0–20) ──────────────────────────────────
  // Look for evidence of metrics in the resume
  const metricPatterns = [
    /\$[\d,.]+[kmb]?/i,
    /\d+[%]/,
    /\d+\+?\s*(employees|hires|candidates|requisitions|positions|roles|openings)/i,
    /reduced\s+\w+\s+by\s+\d+/i,
    /increased\s+\w+\s+by\s+\d+/i,
    /saved\s+\$[\d,.]+/i,
    /managed\s+\$[\d,.]+/i,
    /\d+\s*million/i,
    /\d+\s*billion/i,
  ];

  let metricCount = 0;
  for (const pattern of metricPatterns) {
    if (pattern.test(resumeText)) metricCount++;
  }

  const impactScore = Math.min(20, metricCount * 3);
  breakdown.quantifiableImpact = impactScore;

  if (impactScore >= 15) strengths.push('Resume demonstrates strong quantifiable results');
  else if (impactScore < 6) concerns.push('Consider adding more metrics to your resume');

  // ── Factor 4: Contextual Fit (0–10) ───────────────────────────────────────
  let contextScore = 0;

  // Work arrangement match
  const wantRemote = (s8.workArrangement || '').toLowerCase().includes('remote');
  if (job.remote && wantRemote) contextScore += 4;
  else if (!job.remote && !wantRemote) contextScore += 3;
  else contextScore += 1;

  // Employment type match
  const wantFullTime = !(s8.employmentType || '').toLowerCase().includes('contract');
  const isFullTime = (job.employmentType || 'full-time').toLowerCase().includes('full');
  if (wantFullTime === isFullTime) contextScore += 3;
  else contextScore += 1;

  // Industry/company size signals from description
  const hasEnterpriseSignals = /fortune\s*\d+|enterprise|global|multi.national|publicly\s+traded/i.test(jobText);
  const resumeHasEnterprise = /ibm|cox|bae\s+systems|fortune|enterprise|global/i.test(resumeText);
  if (hasEnterpriseSignals && resumeHasEnterprise) contextScore += 3;
  else contextScore += 1;

  contextScore = Math.min(10, contextScore);
  breakdown.contextualFit = contextScore;

  if (job.remote) strengths.push('Remote role matches location preference');
  if (job.applicantCount && job.applicantCount > 100) {
    concerns.push(`High competition — ${job.applicantCount}+ applicants already`);
  }

  // ── Total Score ────────────────────────────────────────────────────────────
  const totalScore = hardSkillScore + recencySeniorityScore + impactScore + contextScore;

  return {
    score: totalScore,
    breakdown,
    strengths,
    concerns,
  };
}

// ─── Full Job Evaluation Pipeline ────────────────────────────────────────────

/**
 * Run the complete evaluation pipeline for a single job against a subscriber.
 *
 * Returns a rich result object with all classification data needed by the
 * dashboard and job matches UI.
 *
 * @param {Object} job          — job document from DB
 * @param {Object} user         — subscriber user document (includes plan, onboardingData, resumeData)
 * @returns {Object}            — enriched job result
 */
export function evaluateJobForSubscriber(job, user) {
  const tier = (user.plan || 'starter').toLowerCase();
  const onboarding = user.onboardingData || {};
  const resumeData = user.resumeData || {};
  const s8 = onboarding.s8 || {};

  // Step 1: Domain filter — hard gate
  if (!passedDomainFilter(job.title)) {
    return {
      job,
      passed: false,
      filterReason: 'domain',
      filterLabel: 'Outside TA/Recruiting domain',
    };
  }

  // Step 2: Freshness gate
  if (!passesFreshnessGate(job, tier)) {
    return {
      job,
      passed: false,
      filterReason: 'freshness',
      filterLabel: 'Posting too old for your search tier',
    };
  }

  // Step 3: Score the job
  const { score, breakdown, strengths, concerns } = scoreJob(job, resumeData, onboarding);

  // Step 4: Location gate — determines above/below the line
  const locationLine = classifyLocation(job, s8);

  // Step 5: Rarity classification
  const rarity = classifyRarity(job.title);

  // Step 6: Build tags
  const tags = [];
  if (job.remote) tags.push({ label: 'Remote', color: 'green' });
  else if (job.hybrid) tags.push({ label: 'Hybrid', color: 'amber' });
  if (rarity === 'EXCEPTIONALLY_RARE') tags.push({ label: '⚡ Exceptionally Rare', color: 'red' });
  else if (rarity === 'RARE') tags.push({ label: '⭐ Rare Role', color: 'amber' });
  if (job.source === 'greenhouse') tags.push({ label: 'Greenhouse', color: 'blue' });
  else if (job.source === 'lever') tags.push({ label: 'Lever', color: 'blue' });
  if (!job.company || job.company.toLowerCase().includes('confidential')) {
    tags.push({ label: 'Employer anonymous', color: 'amber' });
  }

  // Step 7: Determine if we should auto-apply
  const shouldAutoApply = locationLine === 'above' && score >= 70;

  return {
    job,
    passed: true,
    score,
    breakdown,
    strengths,
    concerns,
    tags,
    locationLine,      // 'above' | 'below'
    rarity,            // 'EXCEPTIONALLY_RARE' | 'RARE' | null
    shouldAutoApply,
    filterReason: null,
    filterLabel: null,
  };
}

/**
 * Evaluate a batch of jobs for a subscriber and return sorted results.
 * Above-the-line results are sorted by score descending.
 * Below-the-line results are sorted by score descending.
 * Filtered results are returned separately.
 */
export function evaluateBatchForSubscriber(jobs, user) {
  const results = jobs.map(job => evaluateJobForSubscriber(job, user));

  const aboveLine  = results.filter(r => r.passed && r.locationLine === 'above').sort((a, b) => b.score - a.score);
  const belowLine  = results.filter(r => r.passed && r.locationLine === 'below').sort((a, b) => b.score - a.score);
  const filtered   = results.filter(r => !r.passed);
  const rarityAlerts = results.filter(r => r.passed && r.rarity === 'EXCEPTIONALLY_RARE');

  return {
    aboveLine,
    belowLine,
    filtered,
    rarityAlerts,
    stats: {
      total: jobs.length,
      passed: aboveLine.length + belowLine.length,
      appliedCount: aboveLine.filter(r => r.shouldAutoApply).length,
      locationHoldCount: belowLine.length,
      filteredCount: filtered.length,
    },
  };
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function inferSeniority(title = '') {
  const t = title.toLowerCase();
  const map = {
    'C-Level':    ['ceo', 'cto', 'coo', 'cfo', 'chief', 'president', 'founder', 'ctao'],
    'VP':         ['vp', 'vice president', 'svp', 'evp'],
    'Director':   ['director', 'dir'],
    'Manager':    ['manager', 'mgr', 'supervisor', 'head of'],
    'Lead':       ['lead', 'principal', 'staff'],
    'Senior':     ['senior', 'sr'],
    'Mid Level':  ['mid', 'intermediate', 'ii', 'iii'],
    'Entry Level':['entry', 'junior', 'associate', 'jr', 'graduate', 'intern'],
  };
  const matched = [];
  for (const [level, patterns] of Object.entries(map)) {
    if (patterns.some(p => t.includes(p))) matched.push(level);
  }
  return matched.length > 0 ? matched : ['Mid Level'];
}

function extractResumeSkills(resumeData) {
  const skills = [];
  if (Array.isArray(resumeData.skills)) {
    for (const s of resumeData.skills) {
      if (typeof s === 'string') skills.push(s);
      else if (s.name) skills.push(s.name);
    }
  }
  if (Array.isArray(resumeData.coreCompetencies)) {
    skills.push(...resumeData.coreCompetencies.filter(s => typeof s === 'string'));
  }
  return [...new Set(skills)];
}

function buildResumeText(resumeData) {
  const parts = [];
  if (resumeData.summary) parts.push(resumeData.summary);
  if (Array.isArray(resumeData.experience)) {
    for (const exp of resumeData.experience) {
      if (exp.title) parts.push(exp.title);
      if (exp.description) parts.push(exp.description);
      if (Array.isArray(exp.bullets)) parts.push(exp.bullets.join(' '));
    }
  }
  if (Array.isArray(resumeData.skills)) {
    parts.push(resumeData.skills.map(s => (typeof s === 'string' ? s : s.name || '')).join(' '));
  }
  return parts.join(' ');
}

// evaluateBatchForUser is an alias for evaluateBatchForSubscriber
export const evaluateBatchForUser = evaluateBatchForSubscriber;

export default {
  passedDomainFilter,
  classifyLocation,
  classifyRarity,
  passesFreshnessGate,
  scoreJob,
  evaluateJobForSubscriber,
  evaluateBatchForSubscriber,
  evaluateBatchForUser,
  TIER_CONFIG,
};
