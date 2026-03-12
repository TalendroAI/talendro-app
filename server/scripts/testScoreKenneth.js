/**
 * testScoreKenneth.js
 * Scores all jobs in the DB against Kenneth's actual target titles
 * using the corrected scoring engine (title match as primary gate).
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI;

// ─── Kenneth's actual profile ───────────────────────────────────────────────
const KENNETH_PROFILE = {
  targetTitles: 'VP Talent Acquisition, SVP Talent Acquisition, Head of Talent Acquisition, VP Recruiting, Director Talent Acquisition, Delivery Executive RPO, Vice President Talent Acquisition, Head of Recruiting, VP of Talent Acquisition, Director of Talent Acquisition',
  seniority: ['VP', 'Director', 'C-Level'],
  workArrangement: ['Remote', 'Hybrid', 'No Preference'],
  empType: ['Full-Time'],
  salaryMin: 175000,
  targetIndustries: 'Staffing, RPO, MSP, Healthcare, Financial Services, Technology, Government',
  skills: ['Talent Acquisition', 'Recruiting', 'RPO', 'MSP', 'Workforce Planning', 'Employer Branding', 'ATS', 'HRIS', 'Workday', 'Taleo', 'Executive Recruiting', 'Diversity Recruiting', 'Vendor Management', 'SLA Management', 'P&L', 'Team Leadership'],
  location: { state: 'GA', city: 'Atlanta', openToRemote: true },
};

// ─── Scoring Engine (mirrors production jobScoringService.js logic) ──────────
function normalizeTitle(t) {
  return (t || '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreTitleMatch(jobTitle, targetTitlesStr) {
  if (!targetTitlesStr || !targetTitlesStr.trim()) return { score: 8, label: 'No targets set' };

  const targets = targetTitlesStr.split(',').map(t => normalizeTitle(t)).filter(Boolean);
  const jt = normalizeTitle(jobTitle);

  // Exact match
  if (targets.some(t => t === jt)) return { score: 30, label: 'Exact title match' };

  // Strong match — job title contains target or target contains job title
  if (targets.some(t => jt.includes(t) || t.includes(jt))) return { score: 24, label: 'Strong title match' };

  // Partial match — at least 2 meaningful keywords in common
  const jtWords = new Set(jt.split(' ').filter(w => w.length > 3));
  const bestPartial = targets.reduce((best, t) => {
    const tWords = t.split(' ').filter(w => w.length > 3);
    const shared = tWords.filter(w => jtWords.has(w)).length;
    return Math.max(best, shared);
  }, 0);
  if (bestPartial >= 2) return { score: 16, label: 'Partial title match' };
  if (bestPartial === 1) return { score: 8, label: 'Weak title match' };

  // No match — hard cap applies
  return { score: 0, label: 'No title match', hardCap: 49 };
}

function scoreKeywords(jobText, skills) {
  const text = (jobText || '').toLowerCase();
  let matched = 0;
  const matchedSkills = [];
  for (const skill of skills) {
    if (text.includes(skill.toLowerCase())) {
      matched++;
      matchedSkills.push(skill);
    }
  }
  const ratio = matched / skills.length;
  return {
    score: Math.round(ratio * 25),
    matched: matchedSkills,
    total: skills.length,
  };
}

function scoreSeniority(jobTitle, targetSeniority) {
  const jt = (jobTitle || '').toLowerCase();
  const seniorityMap = {
    'VP': ['vp', 'vice president', 'svp', 'evp'],
    'Director': ['director'],
    'C-Level': ['chief', 'ceo', 'coo', 'cto', 'cfo', 'chro', 'cpo'],
    'Manager': ['manager', 'managing'],
    'Lead': ['lead', 'principal'],
    'Senior': ['senior', 'sr.', 'sr '],
    'Mid Level': [],
    'Entry Level': ['junior', 'jr.', 'associate', 'entry'],
  };
  for (const level of targetSeniority) {
    const keywords = seniorityMap[level] || [];
    if (keywords.some(k => jt.includes(k))) return 15;
  }
  return 0;
}

function scoreRemote(jobText, workArrangement) {
  const text = (jobText || '').toLowerCase();
  if (workArrangement.includes('No Preference')) return 10;
  if (workArrangement.includes('Remote') && text.includes('remote')) return 10;
  if (workArrangement.includes('Hybrid') && text.includes('hybrid')) return 10;
  if (workArrangement.includes('On-Site') && !text.includes('remote')) return 10;
  return 5;
}

function scoreSalary(jobSalaryMin, targetMin) {
  if (!jobSalaryMin) return 10; // unknown — give benefit of doubt
  if (jobSalaryMin >= targetMin) return 20;
  if (jobSalaryMin >= targetMin * 0.85) return 12;
  if (jobSalaryMin >= targetMin * 0.70) return 6;
  return 0;
}

function scoreJob(job, profile) {
  const jobText = `${job.title || ''} ${job.description || ''} ${job.company || ''}`;

  const titleResult = scoreTitleMatch(job.title, profile.targetTitles);
  const keywordResult = scoreKeywords(jobText, profile.skills);
  const seniorityScore = scoreSeniority(job.title, profile.seniority);
  const remoteScore = scoreRemote(jobText, profile.workArrangement);
  const salaryScore = scoreSalary(job.salaryMin || job.salary_min, profile.salaryMin);

  let total = titleResult.score + keywordResult.score + seniorityScore + remoteScore + salaryScore;

  // Hard cap when title does not match and targets are set
  if (titleResult.hardCap !== undefined) {
    total = Math.min(total, titleResult.hardCap);
  }

  total = Math.min(100, Math.max(0, total));

  let tier, color;
  if (total >= 85) { tier = 'Excellent'; color = '#10b981'; }
  else if (total >= 70) { tier = 'Strong'; color = '#3b82f6'; }
  else if (total >= 55) { tier = 'Good'; color = '#8b5cf6'; }
  else if (total >= 40) { tier = 'Possible'; color = '#f59e0b'; }
  else { tier = 'Low Match'; color = '#9ca3af'; }

  return {
    score: total,
    tier,
    color,
    titleMatch: titleResult.label,
    matchedSkills: keywordResult.matched,
    breakdown: {
      title: titleResult.score,
      keywords: keywordResult.score,
      seniority: seniorityScore,
      remote: remoteScore,
      salary: salaryScore,
    },
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const jobsCol = db.collection('jobs');

  const totalJobs = await jobsCol.countDocuments();
  console.log(`Total jobs in DB: ${totalJobs}`);

  // Fetch all jobs (in batches to avoid memory issues)
  const BATCH = 500;
  let skip = 0;
  const results = [];

  while (skip < totalJobs) {
    const batch = await jobsCol.find({}).skip(skip).limit(BATCH).toArray();
    for (const job of batch) {
      const scored = scoreJob(job, KENNETH_PROFILE);
      if (scored.score >= 40) { // Only keep Possible and above
        results.push({
          id: job._id?.toString(),
          title: job.title,
          company: job.company,
          location: job.location || job.city || '',
          source: job.source,
          applyUrl: job.applyUrl || job.url || job.jobUrl || '',
          postedAt: job.postedAt || job.firstSeenAt,
          salaryMin: job.salaryMin || job.salary_min,
          salaryMax: job.salaryMax || job.salary_max,
          score: scored.score,
          tier: scored.tier,
          color: scored.color,
          titleMatch: scored.titleMatch,
          matchedSkills: scored.matchedSkills,
          breakdown: scored.breakdown,
        });
      }
    }
    skip += BATCH;
    process.stdout.write(`\rScored ${Math.min(skip, totalJobs)}/${totalJobs} jobs...`);
  }

  console.log(`\nJobs scoring >= 40: ${results.length}`);

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Summary by tier
  const tiers = { Excellent: 0, Strong: 0, Good: 0, Possible: 0 };
  for (const r of results) if (tiers[r.tier] !== undefined) tiers[r.tier]++;

  console.log('\n=== RESULTS BY TIER ===');
  for (const [tier, count] of Object.entries(tiers)) {
    console.log(`  ${tier}: ${count}`);
  }

  console.log('\n=== TOP 20 MATCHES ===');
  for (const r of results.slice(0, 20)) {
    console.log(`[${r.score}] ${r.tier} | ${r.title} @ ${r.company} | ${r.titleMatch} | Skills: ${r.matchedSkills.slice(0,4).join(', ')}`);
  }

  // Save full results
  writeFileSync('/home/ubuntu/kenneth_scored_correct.json', JSON.stringify({ 
    profile: KENNETH_PROFILE,
    totalJobsInDB: totalJobs,
    totalMatches: results.length,
    tiers,
    jobs: results 
  }, null, 2));

  console.log('\nSaved to /home/ubuntu/kenneth_scored_correct.json');
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
