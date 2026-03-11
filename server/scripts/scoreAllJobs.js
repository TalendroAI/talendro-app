/**
 * Comprehensive scoring engine for Kenneth G. Jackson.
 * Scores ALL 8,080 jobs using weighted keyword matching.
 * No source-side filtering — all jobs scored, best rise to the top.
 */
import mongoose from 'mongoose';
import fs from 'fs';

const MONGODB_URI = 'mongodb+srv://greg_db_user:REDACTED_OLD_PASSWORD@talendrocluster.0hrgtda.mongodb.net/talendro?retryWrites=true&w=majority&appName=TalendroCluster';

// ── Kenneth's scoring profile ─────────────────────────────────────────────────
// Primary target: Senior HR/TA/People executive roles
// Secondary: Any senior executive role ($250K+) where his skills transfer
// Tertiary: Director-level HR/TA/People roles

const TITLE_SCORES = [
  // Tier 1: Exact target roles (90-100)
  { re: /\b(chro|chief\s+human\s+resources\s+officer)\b/i, score: 100 },
  { re: /\b(cpo|chief\s+people\s+officer)\b/i, score: 100 },
  { re: /\bchief\s+human\s+capital\s+officer\b/i, score: 95 },
  { re: /\bsvp[\s,]+talent\s+acquisition\b/i, score: 95 },
  { re: /\bsvp[\s,]+(human\s+resources|hr|people)\b/i, score: 95 },
  { re: /\bsenior\s+vice\s+president[\s,]+(talent|hr|people|human\s+resources)\b/i, score: 95 },
  { re: /\bvp[\s,]+talent\s+acquisition\b/i, score: 92 },
  { re: /\bvp[\s,]+(human\s+resources|hr|people)\b/i, score: 90 },
  { re: /\bvice\s+president[\s,]+(talent|hr|people|human\s+resources)\b/i, score: 90 },
  { re: /\bhead\s+of\s+(talent\s+acquisition|talent|people|hr|human\s+resources|recruiting)\b/i, score: 88 },

  // Tier 2: Director-level HR/TA (75-87)
  { re: /\bdirector[\s,]+(talent\s+acquisition|of\s+talent\s+acquisition)\b/i, score: 87 },
  { re: /\bdirector[\s,]+(human\s+resources|of\s+human\s+resources|hr)\b/i, score: 85 },
  { re: /\bdirector[\s,]+(people|of\s+people|people\s+operations)\b/i, score: 83 },
  { re: /\bdirector[\s,]+(recruiting|of\s+recruiting|talent\s+management)\b/i, score: 80 },
  { re: /\bdirector[\s,]+(workforce\s+planning|organizational\s+development|org\s+dev)\b/i, score: 78 },
  { re: /\bdirector[\s,]+(dei|diversity|employer\s+branding|employee\s+experience)\b/i, score: 76 },
  { re: /\btalent\s+acquisition\s+(director|leader|executive)\b/i, score: 82 },
  { re: /\bhuman\s+resources\s+(director|executive)\b/i, score: 80 },
  { re: /\bpeople\s+(director|executive|operations\s+director)\b/i, score: 78 },

  // Tier 3: Manager-level HR/TA (55-74)
  { re: /\btalent\s+acquisition\s+manager\b/i, score: 72 },
  { re: /\brecruiting\s+(director|manager|lead|head)\b/i, score: 70 },
  { re: /\bhuman\s+resources\s+manager\b/i, score: 68 },
  { re: /\bhr\s+(director|manager|business\s+partner)\b/i, score: 65 },
  { re: /\bpeople\s+operations\s+(manager|director|lead)\b/i, score: 65 },
  { re: /\bworkforce\s+planning\s+(director|manager)\b/i, score: 63 },
  { re: /\borganizational\s+development\s+(director|manager)\b/i, score: 62 },
  { re: /\btalent\s+management\s+(director|manager)\b/i, score: 60 },
  { re: /\bdiversity\s+(equity|and\s+inclusion)\s+(director|manager|officer)\b/i, score: 58 },
  { re: /\blearning\s+(and\s+development|&\s+development)\s+(director|manager)\b/i, score: 56 },
  { re: /\bcompensation\s+(and\s+benefits|&\s+benefits)\s+(director|manager)\b/i, score: 55 },
  { re: /\btotal\s+rewards\s+(director|manager)\b/i, score: 55 },
  { re: /\bemployee\s+experience\s+(director|manager)\b/i, score: 55 },

  // Tier 4: Broad HR/TA keywords (30-54)
  { re: /\btalent\s+acquisition\b/i, score: 50 },
  { re: /\bhuman\s+resources\b/i, score: 45 },
  { re: /\bpeople\s+operations\b/i, score: 45 },
  { re: /\bhr\s+business\s+partner\b/i, score: 42 },
  { re: /\brecruiting\b/i, score: 35 },
  { re: /\btalent\s+management\b/i, score: 35 },
  { re: /\bworkforce\b/i, score: 30 },

  // Adjacent executive roles where Kenneth's skills transfer (25-45)
  { re: /\bchief\s+of\s+staff\b/i, score: 40 },
  { re: /\bvp[\s,]+operations\b/i, score: 35 },
  { re: /\bdirector[\s,]+operations\b/i, score: 30 },
  { re: /\bvp[\s,]+strategy\b/i, score: 30 },
  { re: /\bgeneral\s+manager\b/i, score: 28 },
  { re: /\bmanaging\s+director\b/i, score: 28 },
  { re: /\bexecutive\s+director\b/i, score: 25 },
];

// Seniority multiplier applied to base title score
const SENIORITY_BOOST = [
  { re: /\bchief\b|\bcpo\b|\bchro\b/i, mult: 1.0 },
  { re: /\bsvp\b|\bsenior\s+vice\s+president\b/i, mult: 0.98 },
  { re: /\bvp\b|\bvice\s+president\b/i, mult: 0.95 },
  { re: /\bhead\s+of\b/i, mult: 0.92 },
  { re: /\bdirector\b/i, mult: 0.88 },
  { re: /\bsenior\s+manager\b|\bsr\.\s*manager\b/i, mult: 0.75 },
  { re: /\bmanager\b/i, mult: 0.65 },
  { re: /\bspecialist\b|\bcoordinator\b|\bassistant\b|\banalyst\b/i, mult: 0.3 },
  { re: /\bintern\b|\binternship\b|\bentry.level\b|\bjunior\b/i, mult: 0.1 },
];

// Keywords in description that boost score (HR/TA context signals)
const DESC_BOOST_KEYWORDS = [
  'talent acquisition', 'talent management', 'human resources', 'people operations',
  'workforce planning', 'employer branding', 'diversity equity', 'dei',
  'rpo', 'msp', 'shared services', 'center of excellence', 'coe',
  'workday', 'successfactors', 'taleo', 'jobvite', 'ats', 'hris',
  'executive recruiting', 'leadership hiring', 'organizational development',
  'change management', 'performance management', 'compensation', 'total rewards',
  'ai in hr', 'hr technology', 'people analytics', 'employee experience',
  'learning and development', 'benefits', 'onboarding', 'offboarding',
  'budget management', 'team leadership', 'strategic hr',
];

// Hard negatives — these roles are clearly not a fit
const HARD_NEGATIVE = [
  /\bsoftware\s+engineer\b/i, /\bfull.?stack\b/i, /\bfrontend\b/i, /\bbackend\b/i,
  /\bdevops\b/i, /\bsre\b/i, /\bdata\s+engineer\b/i, /\bml\s+engineer\b/i,
  /\baccount\s+executive\b/i, /\bsales\s+representative\b/i, /\bsales\s+development\s+rep\b/i,
  /\bcustomer\s+success\s+manager\b/i, /\bcustomer\s+support\b/i,
  /\bnurse\b/i, /\bphysician\b/i, /\bdoctor\b/i, /\bpharmacist\b/i,
  /\bteacher\b/i, /\bprofessor\b/i,
  /\bwarehouse\b/i, /\bdriver\b/i, /\bforklift\b/i,
  /\bgraphic\s+designer\b/i, /\bcontent\s+writer\b/i, /\bcopywriter\b/i,
  /\baccountant\b/i, /\bbookkeeper\b/i,
];

// Location preferences
const PREFERRED_LOCATIONS = ['remote', 'orlando', 'atlanta', 'new york', 'dallas', 'chicago', 'nationwide', 'anywhere', 'us'];

function scoreJob(job) {
  const title = (job.title || '');
  const titleLower = title.toLowerCase();
  const desc = (job.descriptionText || '').toLowerCase();
  const location = (job.location || '').toLowerCase();

  // Hard negative check
  for (const neg of HARD_NEGATIVE) {
    if (neg.test(titleLower)) return { score: 5, tier: 'poor', reason: 'Role type mismatch' };
  }

  // Title score
  let titleScore = 0;
  for (const t of TITLE_SCORES) {
    if (t.re.test(titleLower)) {
      titleScore = Math.max(titleScore, t.score);
    }
  }

  // Seniority multiplier
  let senMult = 0.5; // default for unmatched
  for (const s of SENIORITY_BOOST) {
    if (s.re.test(titleLower)) { senMult = s.mult; break; }
  }

  // Apply seniority multiplier only to non-exact-match scores
  let baseScore = titleScore;
  if (titleScore < 80) baseScore = Math.round(titleScore * senMult);

  // Description keyword bonus (up to 15 points)
  let descBonus = 0;
  let descMatches = 0;
  for (const kw of DESC_BOOST_KEYWORDS) {
    if (desc.includes(kw)) descMatches++;
  }
  descBonus = Math.min(15, descMatches * 1.5);

  // Remote/location bonus
  let locationBonus = 0;
  if (job.remote || location.includes('remote')) locationBonus = 8;
  else {
    for (const loc of PREFERRED_LOCATIONS) {
      if (location.includes(loc)) { locationBonus = 4; break; }
    }
  }

  // Salary bonus (if data available and appropriate for executive level)
  let salaryBonus = 0;
  if (job.salary?.min) {
    const period = (job.salary.period || 'annual').toLowerCase();
    const annualMin = period.includes('hour') ? job.salary.min * 2080 : job.salary.min;
    if (annualMin >= 250000) salaryBonus = 10;
    else if (annualMin >= 150000) salaryBonus = 6;
    else if (annualMin >= 100000) salaryBonus = 3;
    else if (annualMin < 40000 && annualMin > 0) salaryBonus = -15; // Too low
  }

  let finalScore = Math.round(baseScore + descBonus + locationBonus + salaryBonus);
  finalScore = Math.max(0, Math.min(100, finalScore));

  let tier;
  if (finalScore >= 80) tier = 'excellent';
  else if (finalScore >= 65) tier = 'strong';
  else if (finalScore >= 50) tier = 'good';
  else if (finalScore >= 35) tier = 'fair';
  else tier = 'poor';

  // Build reason string
  const reasons = [];
  if (titleScore >= 80) reasons.push('Excellent title match');
  else if (titleScore >= 65) reasons.push('Strong title match');
  else if (titleScore >= 50) reasons.push('Good title match');
  else if (titleScore >= 35) reasons.push('Partial title match');
  if (descMatches >= 3) reasons.push(`${descMatches} HR/TA keywords in description`);
  if (job.remote || location.includes('remote')) reasons.push('Remote');
  if (job.salary?.min && job.salary.min >= 150000) {
    const period = (job.salary.period || 'annual').toLowerCase();
    const annualMin = period.includes('hour') ? job.salary.min * 2080 : job.salary.min;
    reasons.push(`$${Math.round(annualMin/1000)}k+`);
  }

  const reason = reasons.length > 0 ? reasons.join(' · ') : 'Low relevance';

  return { score: finalScore, tier, reason };
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const col = mongoose.connection.collection('jobs');
  const jobs = await col.find({ isActive: true }).toArray();
  console.log(`Scoring ${jobs.length} jobs...\n`);

  const t0 = Date.now();
  const scored = jobs.map(job => {
    const { score, tier, reason } = scoreJob(job);
    return {
      id: job._id.toString(),
      title: job.title,
      company: job.company,
      location: job.location || '',
      source: job.source,
      applyUrl: job.applyUrl,
      postedAt: job.postedAt,
      remote: job.remote || false,
      salary: job.salary,
      department: job.department || '',
      descriptionSnippet: (job.descriptionText || '').substring(0, 300),
      score, tier, reason,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(2);

  const excellent = scored.filter(j => j.tier === 'excellent').length;
  const strong = scored.filter(j => j.tier === 'strong').length;
  const good = scored.filter(j => j.tier === 'good').length;
  const fair = scored.filter(j => j.tier === 'fair').length;
  const poor = scored.filter(j => j.tier === 'poor').length;

  console.log(`Scored ${jobs.length} jobs in ${elapsed}s\n`);
  console.log('=== SCORING SUMMARY ===');
  console.log(`Excellent (80-100): ${excellent}`);
  console.log(`Strong   (65-79):  ${strong}`);
  console.log(`Good     (50-64):  ${good}`);
  console.log(`Fair     (35-49):  ${fair}`);
  console.log(`Poor     (<35):    ${poor}`);

  // Source breakdown of top 100
  const top100BySource = {};
  scored.slice(0, 100).forEach(j => {
    top100BySource[j.source] = (top100BySource[j.source] || 0) + 1;
  });

  console.log('\nTop 50 matches for Kenneth:');
  scored.slice(0, 50).forEach((j, i) => {
    const sal = j.salary?.min ? ` | $${Math.round(j.salary.min/1000)}k-$${Math.round((j.salary.max||j.salary.min)/1000)}k` : '';
    const rem = j.remote ? ' [REMOTE]' : '';
    console.log(`${String(i+1).padStart(2)}. [${j.score}] ${j.title} @ ${j.company} (${j.source})${sal}${rem}`);
    console.log(`    ${j.location || 'Location not specified'} | ${j.reason}`);
  });

  console.log('\nTop 100 by source:', JSON.stringify(top100BySource));

  // All-source breakdown
  const bySource = {};
  jobs.forEach(j => { bySource[j.source] = (bySource[j.source] || 0) + 1; });

  const output = {
    scoredAt: new Date().toISOString(),
    totalJobs: jobs.length,
    summary: { excellent, strong, good, fair, poor },
    bySource,
    top100BySource,
    topMatches: scored.slice(0, 100),
    allScored: scored,
  };

  fs.writeFileSync('/home/ubuntu/kenneth_scored_jobs.json', JSON.stringify(output, null, 2));
  console.log('\nFull results saved to /home/ubuntu/kenneth_scored_jobs.json');

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
