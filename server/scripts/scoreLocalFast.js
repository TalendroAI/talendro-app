/**
 * Fast local keyword scoring — no API calls, instant results.
 * Scores all jobs against Kenneth's profile using weighted keyword matching.
 */
import mongoose from 'mongoose';
import fs from 'fs';

const MONGODB_URI = 'mongodb+srv://greg_db_user:REDACTED_OLD_PASSWORD@talendrocluster.0hrgtda.mongodb.net/talendro?retryWrites=true&w=majority&appName=TalendroCluster';

// Kenneth's profile scoring weights
const TARGET_TITLES = [
  { pattern: /chief\s+(human\s+resources|people|hr)\s+officer|chro|cpo/i, weight: 100 },
  { pattern: /svp\s+(talent|human\s+resources|people|hr)|senior\s+vice\s+president\s+(talent|hr|people)/i, weight: 95 },
  { pattern: /vp\s+(talent\s+acquisition|human\s+resources|people|recruiting)|vice\s+president\s+(talent|hr|people)/i, weight: 90 },
  { pattern: /head\s+of\s+(talent\s+acquisition|people|hr|recruiting|human\s+resources)/i, weight: 88 },
  { pattern: /director\s+(talent\s+acquisition|of\s+talent|people|hr|human\s+resources|recruiting)/i, weight: 80 },
  { pattern: /talent\s+acquisition\s+(director|leader|executive|manager|partner)/i, weight: 75 },
  { pattern: /human\s+resources\s+(director|executive|manager|business\s+partner)/i, weight: 72 },
  { pattern: /people\s+(director|executive|operations\s+director|operations\s+vp)/i, weight: 70 },
  { pattern: /workforce\s+planning\s+(director|manager|lead)/i, weight: 68 },
  { pattern: /talent\s+management\s+(director|vp|head)/i, weight: 65 },
  { pattern: /recruiting\s+(director|manager|lead|head)/i, weight: 62 },
  { pattern: /hr\s+(director|manager|business\s+partner|executive)/i, weight: 60 },
  { pattern: /organizational\s+(development|effectiveness)\s+(director|vp|head)/i, weight: 58 },
  { pattern: /diversity\s+(equity|inclusion|and\s+inclusion)\s+(director|vp|head|officer)/i, weight: 55 },
  { pattern: /employer\s+branding\s+(director|manager|lead)/i, weight: 50 },
  { pattern: /talent\s+acquisition/i, weight: 45 },
  { pattern: /human\s+resources/i, weight: 35 },
  { pattern: /people\s+operations/i, weight: 35 },
  { pattern: /recruiting|talent\s+management/i, weight: 25 },
];

const SENIORITY_KEYWORDS = {
  executive: { pattern: /\bchief\b|\bcpo\b|\bchro\b|\bceo\b|\bcoo\b|\bcto\b|\bcfo\b/i, bonus: 20 },
  svp: { pattern: /\bsvp\b|\bsenior vice president\b/i, bonus: 18 },
  vp: { pattern: /\bvp\b|\bvice president\b/i, bonus: 15 },
  head: { pattern: /\bhead of\b/i, bonus: 12 },
  director: { pattern: /\bdirector\b/i, bonus: 8 },
  senior_manager: { pattern: /\bsenior manager\b|\bsr\.\s*manager\b/i, bonus: 4 },
  manager: { pattern: /\bmanager\b/i, bonus: 2 },
};

const REMOTE_BONUS = 10;
const LOCATION_KEYWORDS = ['remote', 'orlando', 'atlanta', 'new york', 'dallas', 'chicago', 'nationwide', 'anywhere'];

const POSITIVE_KEYWORDS = [
  'talent acquisition', 'recruiting', 'human resources', 'people operations',
  'workforce planning', 'employer branding', 'dei', 'diversity', 'equity', 'inclusion',
  'rpo', 'msp', 'shared services', 'coe', 'center of excellence',
  'workday', 'successfactors', 'taleo', 'jobvite', 'ats',
  'executive recruiting', 'leadership hiring', 'organizational development',
  'change management', 'talent management', 'performance management',
  'compensation', 'total rewards', 'benefits', 'hris',
  'ai', 'artificial intelligence', 'hr technology', 'hr tech',
  'budget management', 'team leadership', 'people analytics',
];

const NEGATIVE_KEYWORDS = [
  'intern', 'internship', 'entry level', 'entry-level', 'junior', 'associate',
  'coordinator', 'assistant', 'specialist', 'analyst',
  'software engineer', 'developer', 'programmer', 'devops', 'sre',
  'account executive', 'sales representative', 'account manager',
  'customer success', 'customer support', 'customer service',
  'marketing manager', 'content writer', 'graphic designer',
  'financial analyst', 'accountant', 'bookkeeper',
  'nurse', 'physician', 'doctor', 'pharmacist', 'therapist',
  'teacher', 'professor', 'instructor',
  'driver', 'warehouse', 'logistics coordinator',
];

function scoreJob(job) {
  const title = (job.title || '').toLowerCase();
  const desc = (job.descriptionText || '').toLowerCase();
  const location = (job.location || '').toLowerCase();
  const combined = `${title} ${desc}`;

  let score = 0;
  let reasons = [];

  // 1. Title match (most important — up to 100 points)
  let titleScore = 0;
  for (const t of TARGET_TITLES) {
    if (t.pattern.test(title)) {
      titleScore = Math.max(titleScore, t.weight);
    }
  }
  score += titleScore;
  if (titleScore >= 80) reasons.push('Excellent title match');
  else if (titleScore >= 60) reasons.push('Strong title match');
  else if (titleScore >= 40) reasons.push('Relevant title');

  // 2. Seniority bonus (up to 20 points)
  let seniorityBonus = 0;
  for (const [level, cfg] of Object.entries(SENIORITY_KEYWORDS)) {
    if (cfg.pattern.test(title)) {
      seniorityBonus = Math.max(seniorityBonus, cfg.bonus);
    }
  }
  score += seniorityBonus;

  // 3. Negative keyword penalty
  let negativePenalty = 0;
  for (const kw of NEGATIVE_KEYWORDS) {
    if (title.includes(kw)) {
      negativePenalty = Math.max(negativePenalty, 60);
      break;
    }
  }
  score -= negativePenalty;

  // 4. Positive keyword matches in description (up to 15 points)
  let posMatches = 0;
  for (const kw of POSITIVE_KEYWORDS) {
    if (combined.includes(kw)) posMatches++;
  }
  const descBonus = Math.min(15, posMatches * 2);
  score += descBonus;

  // 5. Remote/location bonus
  if (job.remote || location.includes('remote')) {
    score += REMOTE_BONUS;
    reasons.push('Remote');
  } else {
    for (const loc of LOCATION_KEYWORDS) {
      if (location.includes(loc)) {
        score += 5;
        break;
      }
    }
  }

  // 6. Salary range check (if salary data available)
  if (job.salary?.min) {
    const minSal = job.salary.min;
    const period = (job.salary.period || 'annual').toLowerCase();
    const annualMin = period.includes('hour') ? minSal * 2080 : minSal;
    if (annualMin >= 200000) {
      score += 10;
      reasons.push(`Salary $${Math.round(annualMin/1000)}k+`);
    } else if (annualMin >= 100000) {
      score += 5;
    } else if (annualMin < 50000 && annualMin > 0) {
      score -= 20; // Too low for Kenneth
    }
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, Math.round(score)));

  let tier;
  if (score >= 80) tier = 'excellent';
  else if (score >= 65) tier = 'strong';
  else if (score >= 50) tier = 'good';
  else if (score >= 35) tier = 'fair';
  else tier = 'poor';

  const reason = reasons.length > 0 ? reasons.join(' · ') : (score > 0 ? 'Partial keyword match' : 'Low relevance');

  return { score, tier, reason };
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const col = mongoose.connection.collection('jobs');
  const jobs = await col.find({ isActive: true }).toArray();
  console.log(`Scoring ${jobs.length} jobs locally...\n`);

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
      descriptionText: (job.descriptionText || '').substring(0, 400),
      score,
      tier,
      reason,
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
  console.log('=== SCORING RESULTS ===');
  console.log(`Excellent (80+): ${excellent}`);
  console.log(`Strong (65-79): ${strong}`);
  console.log(`Good (50-64): ${good}`);
  console.log(`Fair (35-49): ${fair}`);
  console.log(`Poor (<35): ${poor}`);

  console.log('\nTop 30 matches for Kenneth:');
  scored.slice(0, 30).forEach((j, i) => {
    const sal = j.salary?.min ? ` | $${Math.round(j.salary.min/1000)}k-$${Math.round((j.salary.max||j.salary.min)/1000)}k` : '';
    const rem = j.remote ? ' 🌐' : '';
    console.log(`${String(i+1).padStart(2)}. [${j.score}] ${j.title} @ ${j.company} (${j.source})${sal}${rem}`);
    console.log(`    ${j.location || 'Location not specified'} | ${j.reason}`);
  });

  // Source breakdown for top matches
  const topBySource = {};
  scored.slice(0, 100).forEach(j => {
    topBySource[j.source] = (topBySource[j.source] || 0) + 1;
  });
  console.log('\nTop 100 matches by source:', JSON.stringify(topBySource));

  const output = {
    scoredAt: new Date().toISOString(),
    totalJobs: jobs.length,
    summary: { excellent, strong, good, fair, poor },
    bySource: {},
    topMatches: scored.slice(0, 50),
    allScored: scored,
  };

  // Source breakdown of all jobs
  jobs.forEach(j => { output.bySource[j.source] = (output.bySource[j.source] || 0) + 1; });

  fs.writeFileSync('/home/ubuntu/kenneth_scored_jobs.json', JSON.stringify(output, null, 2));
  console.log('\nFull results saved to /home/ubuntu/kenneth_scored_jobs.json');

  await mongoose.disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
