/**
 * Score all jobs in MongoDB against Kenneth's profile using GPT-4.1-mini.
 * Saves scored results to /home/ubuntu/kenneth_scored_jobs.json
 */
import mongoose from 'mongoose';
import OpenAI from 'openai';
import fs from 'fs';

const MONGODB_URI = 'mongodb+srv://greg_db_user:REDACTED_OLD_PASSWORD@talendrocluster.0hrgtda.mongodb.net/talendro?retryWrites=true&w=majority&appName=TalendroCluster';

// Use the sandbox's pre-configured Manus proxy (not the app's key)
const client = new OpenAI();
// client is auto-configured with OPENAI_API_KEY and OPENAI_BASE_URL from env

const KENNETH_PROFILE = `
Name: Kenneth G. Jackson
Target Roles: Chief Human Resources Officer, Chief People Officer, SVP/VP Talent Acquisition, VP Human Resources, VP People & Culture, Head of Talent Acquisition, Head of People Operations, Director Talent Acquisition
Location Preferences: Remote (strongly preferred), Orlando FL, Atlanta GA, New York NY, Dallas TX, Chicago IL
Years of Experience: 20+
Salary Target: $250,000 - $600,000
Open to Remote: Yes

Key Experience:
- Verizon (VP Talent Acquisition): Led 300+ member global TA org, 135K+ employees, $45M budget, 12,000+ annual hires
- Cox Enterprises (VP TA Shared Services): Built COE from scratch, 200 members, scaled from 6.5K to 18K+ annual hires, $31M budget
- BAE Systems (Director TA Shared Services): 124-person team, $16M+ budget, 5,200+ annual hires, 100 facilities
- B.E. Smith (Interim VP TA), TSYS (Director TA), Premier Staffing Solutions (Manager RPO)
- Currently: Founder & CEO of Talendro (AI-powered career tech platform)

Core Skills: Talent Acquisition, Executive Recruiting, HR Strategy, Shared Services, RPO/MSP, Employer Branding, DEI, Workforce Planning, AI in HR, Budget Management ($16M-$45M), Large Team Leadership (100-300+ people), Organizational Transformation

Technology: Workday, SuccessFactors, TALEO, Jobvite, watsonx, Paradox/Olivia, HireVue, EMSI, Talismatic

Education: BS Psychology, magna cum laude, Excelsior College
`;

async function scoreJob(job) {
  const prompt = `You are a senior executive recruiter evaluating job fit.

CANDIDATE PROFILE:
${KENNETH_PROFILE}

JOB TO EVALUATE:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location || 'Not specified'}
Employment Type: ${job.employmentType || 'Not specified'}
Description: ${(job.descriptionText || '').substring(0, 800)}

Score this job on a scale of 0-100 for fit with this candidate. Consider:
- Title alignment (is this a role they'd be qualified for and interested in?)
- Seniority match (VP/SVP/C-suite/Director level preferred)
- Remote/location fit
- Industry relevance
- Compensation potential

Return ONLY a JSON object with these exact fields:
{
  "score": <number 0-100>,
  "tier": <"excellent" if 80+, "strong" if 65-79, "good" if 50-64, "fair" if 35-49, "poor" if below 35>,
  "reason": <one sentence explaining the score>
}`;

  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 150,
    });
    const text = res.choices[0].message.content.trim();
    const json = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
    return json;
  } catch (e) {
    return { score: 0, tier: 'poor', reason: 'Scoring failed' };
  }
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const col = mongoose.connection.collection('jobs');
  const jobs = await col.find({ isActive: true }).toArray();
  console.log(`Scoring ${jobs.length} jobs...\n`);

  const scored = [];
  const BATCH = 10; // 10 concurrent scoring requests
  
  for (let i = 0; i < jobs.length; i += BATCH) {
    const batch = jobs.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(async (job) => {
      const scoring = await scoreJob(job);
      return {
        id: job._id,
        title: job.title,
        company: job.company,
        location: job.location || 'Remote',
        source: job.source,
        applyUrl: job.applyUrl,
        postedAt: job.postedAt,
        remote: job.remote,
        salary: job.salary,
        descriptionText: (job.descriptionText || '').substring(0, 400),
        score: scoring.score,
        tier: scoring.tier,
        reason: scoring.reason,
      };
    }));
    scored.push(...results);
    
    const done = Math.min(i + BATCH, jobs.length);
    if (done % 50 === 0 || done === jobs.length) {
      console.log(`Scored ${done}/${jobs.length} jobs...`);
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Summary stats
  const excellent = scored.filter(j => j.tier === 'excellent').length;
  const strong = scored.filter(j => j.tier === 'strong').length;
  const good = scored.filter(j => j.tier === 'good').length;
  const fair = scored.filter(j => j.tier === 'fair').length;
  const poor = scored.filter(j => j.tier === 'poor').length;

  console.log('\n=== SCORING RESULTS ===');
  console.log(`Excellent (80+): ${excellent}`);
  console.log(`Strong (65-79): ${strong}`);
  console.log(`Good (50-64): ${good}`);
  console.log(`Fair (35-49): ${fair}`);
  console.log(`Poor (<35): ${poor}`);

  console.log('\nTop 20 matches:');
  scored.slice(0, 20).forEach((j, i) => {
    const sal = j.salary?.min ? ` | $${Math.round(j.salary.min/1000)}k` : '';
    console.log(`${i+1}. [${j.score}] ${j.title} @ ${j.company} (${j.source})${sal}`);
    console.log(`   ${j.reason}`);
  });

  // Save full results
  const output = {
    scoredAt: new Date().toISOString(),
    totalJobs: jobs.length,
    summary: { excellent, strong, good, fair, poor },
    topMatches: scored.slice(0, 50),
    allScored: scored,
  };

  fs.writeFileSync('/home/ubuntu/kenneth_scored_jobs.json', JSON.stringify(output, null, 2));
  console.log('\nFull results saved to /home/ubuntu/kenneth_scored_jobs.json');

  await mongoose.disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
