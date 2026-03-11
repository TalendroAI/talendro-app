/**
 * jobScoringService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Production job scoring engine for Talendro.
 *
 * Talendro serves job seekers across ALL industries and roles — no domain
 * restrictions apply. Every job that passes the freshness gate is evaluated.
 *
 * Implements:
 *   1. Freshness Gate      — hard gate: posting must be within tier's max age
 *   2. Rarity Classifier   — flags exceptionally rare roles for immediate alerts
 *   3. Four-factor weighted scoring:
 *        Hard Skill Alignment     40 pts
 *        Recency & Seniority      30 pts
 *        Quantifiable Impact      20 pts
 *        Contextual Fit           10 pts
 *   4. Above/Below-the-line classification (location gate)
 *
 * Tier freshness windows (max posting age = search interval + 1 hr):
 *   Starter    — every 4 hrs  → max age 5 hrs
 *   Pro        — every 60 min → max age 2 hrs
 *   Concierge  — every 30 min → max age 90 min
 */

// ─── Rarity Tiers ─────────────────────────────────────────────────────────────
// Flags roles that appear very infrequently nationally, across all industries.
// These trigger immediate alerts regardless of match score.

const RARITY_TIERS = {
  EXCEPTIONALLY_RARE: [
    // C-suite across any function
    /\bceo\b/i,
    /chief\s+executive\s+officer/i,
    /\bcto\b/i,
    /chief\s+technology\s+officer/i,
    /\bcoo\b/i,
    /chief\s+operating\s+officer/i,
    /\bcfo\b/i,
    /chief\s+financial\s+officer/i,
    /\bcmo\b/i,
    /chief\s+marketing\s+officer/i,
    /\bcpo\b/i,
    /chief\s+product\s+officer/i,
    /\bchro\b/i,
    /chief\s+human\s+resources\s+officer/i,
    /chief\s+people\s+officer/i,
    /\bcsco\b/i,
    /chief\s+supply\s+chain\s+officer/i,
    /\bccso\b/i,
    /chief\s+customer\s+success\s+officer/i,
    /\bciso\b/i,
    /chief\s+information\s+security\s+officer/i,
    /\bcdo\b/i,
    /chief\s+data\s+officer/i,
    /\bclco\b/i,
    /chief\s+legal\s+officer/i,
    /\bgeneral\s+counsel\b/i,
    // Global heads
    /global\s+head\s+of/i,
    /head\s+of\s+global/i,
    // President / Founder
    /\bpresident\b.*(?:global|north\s+america|americas|emea|apac)/i,
    /\bfounder\b/i,
    /co-founder/i,
  ],
  RARE: [
    // EVP / SVP across any function
    /\bevp\b/i,
    /executive\s+vice\s+president/i,
    /\bsvp\b/i,
    /senior\s+vice\s+president/i,
    // VP Global / VP of [anything] at enterprise scale
    /vp.*global/i,
    /global\s+vp/i,
    // Managing Director
    /managing\s+director/i,
    // Partner (professional services)
    /\bpartner\b.*(?:law|legal|consulting|advisory|investment|private\s+equity|venture)/i,
    // Principal / Distinguished / Fellow (technical)
    /\bdistinguished\s+engineer\b/i,
    /\bfellow\b.*(?:engineer|scientist|researcher|technologist)/i,
    /\bstaff\s+engineer\b/i,
    /\bprincipal\s+engineer\b/i,
    /\bprincipal\s+scientist\b/i,
    /\bprincipal\s+architect\b/i,
  ],
};

// ─── Tier Configuration ───────────────────────────────────────────────────────

export const TIER_CONFIG = {
  starter:   { searchIntervalMs: 4 * 60 * 60 * 1000,      maxAgeMs: 5 * 60 * 60 * 1000 },
  pro:       { searchIntervalMs: 60 * 60 * 1000,           maxAgeMs: 2 * 60 * 60 * 1000 },
  concierge: { searchIntervalMs: 30 * 60 * 1000,           maxAgeMs: 90 * 60 * 1000 },
};

// ─── Rarity Classifier ────────────────────────────────────────────────────────

/**
 * Returns 'EXCEPTIONALLY_RARE', 'RARE', or null.
 * Works across all industries — no domain restriction.
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
 * Works for any industry and role — scoring is driven entirely by the
 * subscriber's own resume and target preferences, not by domain whitelists.
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
  const totalSkills = Math.max(resumeSkills.length, 1);

  for (const skill of resumeSkills) {
    if (jobText.includes(skill.toLowerCase())) skillMatches++;
  }

  const skillRatio = skillMatches / totalSkills;

  // Bonus: count how many of the job's own keywords appear in the resume
  // (industry-agnostic — uses the job's actual keywords, not a hardcoded list)
  const jobKeywords = (job.keywords || []).map(k => k.toLowerCase());
  let jobKwMatches = 0;
  for (const kw of jobKeywords) {
    if (resumeText.includes(kw)) jobKwMatches++;
  }
  const jobKwBonus = Math.min(10, jobKeywords.length > 0
    ? Math.round((jobKwMatches / jobKeywords.length) * 10)
    : 0);

  const hardSkillScore = Math.min(40, Math.round(skillRatio * 30 + jobKwBonus));

  breakdown.hardSkills = hardSkillScore;
  if (hardSkillScore >= 30) strengths.push('Strong keyword alignment with job requirements');
  else if (hardSkillScore < 15) concerns.push('Limited keyword overlap with job description');

  // ── Factor 2: Title Match & Seniority (0–30) ───────────────────────
  //
  // TITLE MATCH IS THE PRIMARY GATE.
  //
  // When a subscriber has stated target titles, the job title MUST match one of them
  // (exactly or closely) for the job to be considered a genuine match.
  //
  // Scoring tiers:
  //   Exact match (e.g. "VP Talent Acquisition" == "VP Talent Acquisition"):  30 pts
  //   Strong match (job title contains or is contained by a target):          24 pts
  //   Partial match (shared key words, e.g. "Talent Acquisition" in both):   16 pts
  //   No match when targets are set:                                           0 pts  ← HARD CAP
  //   No targets set (subscriber hasn’t specified):                           8 pts (neutral)
  //
  // A hard cap is applied to the TOTAL score when there is no title match:
  //   If the subscriber has target titles and the job matches none of them,
  //   the total score is capped at 49 (below the 50-point “Good” threshold).
  //   This prevents keyword-rich but wrong-function roles from scoring “Excellent”.

  const userTargetTitles = (s8.targetTitles || '').toLowerCase();
  const jobTitleLower = (job.title || '').toLowerCase();
  const jobNormTitle = (job.normalizedTitle || jobTitleLower);

  let titleMatch = 0;
  let titleMatchFound = false;

  if (userTargetTitles) {
    const targets = userTargetTitles.split(/[,\n]+/).map(t => t.trim()).filter(Boolean);
    for (const t of targets) {
      if (jobNormTitle === t) {
        titleMatch = 30; titleMatchFound = true; break;          // exact match
      }
      if (jobNormTitle.includes(t) || t.includes(jobNormTitle)) {
        titleMatch = Math.max(titleMatch, 24); titleMatchFound = true; // strong match
      } else {
        const tw = t.split(/\s+/).filter(w => w.length > 2);   // ignore short words
        const jw = jobNormTitle.split(/\s+/);
        const overlap = tw.filter(w => jw.includes(w)).length;
        if (overlap > 0) {
          const partialScore = Math.round(16 * overlap / Math.max(tw.length, 1));
          if (partialScore > titleMatch) {
            titleMatch = partialScore;
            titleMatchFound = true;
          }
        }
      }
    }
    // If no target title matched at all, titleMatch stays 0
    if (!titleMatchFound) {
      concerns.push('Job title does not match your stated target roles');
    } else if (titleMatch >= 24) {
      strengths.push('Job title closely matches your target role');
    } else if (titleMatch >= 16) {
      strengths.push('Job title partially aligns with your target role');
    }
  } else {
    titleMatch = 8; // neutral — subscriber hasn’t set target titles yet
    titleMatchFound = true;
  }

  // Seniority match (0–15 pts, used only when title matched or no targets set)
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

  // Title match is the dominant signal; seniority is a secondary modifier.
  // Cap the combined factor at 30 pts.
  const recencySeniorityScore = Math.min(30, titleMatch + (titleMatchFound ? seniorityMatch : 0));
  breakdown.recencySeniority = recencySeniorityScore;
  breakdown.titleMatchFound = titleMatchFound;

  if (seniorityMatch >= 12 && titleMatchFound) strengths.push('Seniority level aligns with target role');
  else if (seniorityMatch <= 3 && titleMatchFound) concerns.push('Seniority level may not align with your target');

  // ── Factor 3: Quantifiable Impact (0–20) ──────────────────────────────────
  // Look for evidence of metrics in the resume
  const metricPatterns = [
    /\$[\d,.]+[kmb]?/i,
    /\d+[%]/,
    /\d+\+?\s*(employees|hires|candidates|requisitions|positions|roles|openings|users|customers|clients|accounts|projects|products)/i,
    /reduced\s+\w+\s+by\s+\d+/i,
    /increased\s+\w+\s+by\s+\d+/i,
    /saved\s+\$[\d,.]+/i,
    /managed\s+\$[\d,.]+/i,
    /\d+\s*million/i,
    /\d+\s*billion/i,
    /grew\s+\w+\s+(?:by\s+)?\d+/i,
    /delivered\s+\w+\s+(?:in\s+)?\d+/i,
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
  const resumeHasEnterprise = /fortune|enterprise|global|publicly\s+traded|nasdaq|nyse/i.test(resumeText);
  if (hasEnterpriseSignals && resumeHasEnterprise) contextScore += 3;
  else contextScore += 1;

  contextScore = Math.min(10, contextScore);
  breakdown.contextualFit = contextScore;

  if (job.remote) strengths.push('Remote role matches location preference');
  if (job.applicantCount && job.applicantCount > 100) {
    concerns.push(`High competition — ${job.applicantCount}+ applicants already`);
  }
  // ── Total Score ────────────────────────────────────────────────────────────────────────
  let totalScore = hardSkillScore + recencySeniorityScore + impactScore + contextScore;

  // HARD CAP: If the subscriber has stated target titles and the job title matched
  // none of them, cap the total score at 49 regardless of keyword overlap.
  // This prevents wrong-function roles (e.g. CHRO for a TA executive) from
  // appearing as “Good”, “Strong”, or “Excellent” matches.
  // Score bands: Excellent ≥ 80, Strong ≥ 65, Good ≥ 50, Possible ≥ 35, Poor < 35
  if (userTargetTitles && !titleMatchFound) {
    totalScore = Math.min(totalScore, 49);
    breakdown.titleCapApplied = true;
  }

  return {
    score: totalScore,
    breakdown,
    strengths,
    concerns,
  };
}

// ─── Full Job Evaluation Pipeline ─────────────────────────────────────────────

/**
 * Run the complete evaluation pipeline for a single job against a subscriber.
 *
 * No domain restriction — all industries and roles are evaluated.
 * Only gates are: freshness (tier-based) and location (subscriber preference).
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

  // Step 1: Freshness gate — only hard gate
  if (!passesFreshnessGate(job, tier)) {
    return {
      job,
      passed: false,
      filterReason: 'freshness',
      filterLabel: 'Posting too old for your search tier',
    };
  }

  // Step 2: Score the job
  const { score, breakdown, strengths, concerns } = scoreJob(job, resumeData, onboarding);

  // Step 3: Location gate — determines above/below the line
  const locationLine = classifyLocation(job, s8);

  // Step 4: Rarity classification (all industries)
  const rarity = classifyRarity(job.title);

  // Step 5: Build tags
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

  // Step 6: Determine if we should auto-apply
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

  const aboveLine    = results.filter(r => r.passed && r.locationLine === 'above').sort((a, b) => b.score - a.score);
  const belowLine    = results.filter(r => r.passed && r.locationLine === 'below').sort((a, b) => b.score - a.score);
  const filtered     = results.filter(r => !r.passed);
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
    'C-Level':    ['ceo', 'cto', 'coo', 'cfo', 'cmo', 'cpo', 'chro', 'ciso', 'cdo', 'chief', 'president', 'founder', 'general counsel'],
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
  classifyLocation,
  classifyRarity,
  passesFreshnessGate,
  scoreJob,
  evaluateJobForSubscriber,
  evaluateBatchForSubscriber,
  evaluateBatchForUser,
  TIER_CONFIG,
};
