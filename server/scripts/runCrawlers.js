/**
 * Standalone crawler runner — triggers all job source crawlers and
 * saves discovered jobs to MongoDB production database.
 */
import mongoose from 'mongoose';
import axios from 'axios';

const MONGODB_URI = 'mongodb+srv://greg_db_user:REDACTED_OLD_PASSWORD@talendrocluster.0hrgtda.mongodb.net/talendro?retryWrites=true&w=majority&appName=TalendroCluster';

// ── Job schema (mirrors the app's Job model) ──────────────────────────────────
const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  description: String,
  applyUrl: String,
  source: String,
  sourceId: String,
  postedAt: Date,
  crawledAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  remote: Boolean,
  employmentType: String,
  seniority: String,
  salary: {
    min: Number,
    max: Number,
    currency: String,
    period: String,
  },
}, { collection: 'jobs' });

// ── Greenhouse crawler ────────────────────────────────────────────────────────
const GREENHOUSE_COMPANIES = [
  'airbnb','stripe','coinbase','doordash','robinhood','plaid','figma','notion',
  'airtable','brex','chime','gusto','lattice','rippling','deel','remote',
  'greenhouse','lever','workday','servicenow','zendesk','hubspot','intercom',
  'twilio','sendgrid','segment','amplitude','mixpanel','datadog','pagerduty',
  'hashicorp','confluent','databricks','snowflake','dbt','fivetran','airbyte',
  'census','hightouch','retool','linear','loom','miro','figma','canva',
  'asana','monday','clickup','notion','coda','roam','obsidian','craft',
  'superhuman','hey','fastmail','protonmail','tutanota','skiff','anytype',
  'anthropic','openai','cohere','ai21labs','stability','midjourney','runway',
  'scale','labelbox','snorkel','weights-biases','huggingface','replicate',
  'modal','banana','beam','fly','railway','render','vercel','netlify',
  'supabase','planetscale','neon','turso','convex','fauna','upstash',
  'cloudflare','fastly','akamai','imperva','crowdstrike','sentinelone',
  'okta','auth0','ping','sailpoint','cyberark','beyondtrust','thycotic',
];

async function crawlGreenhouse() {
  const jobs = [];
  let fetched = 0;
  for (const company of GREENHOUSE_COMPANIES.slice(0, 40)) {
    try {
      const res = await axios.get(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`, { timeout: 8000 });
      const raw = res.data?.jobs || [];
      for (const j of raw.slice(0, 10)) {
        jobs.push({
          title: j.title,
          company: company.charAt(0).toUpperCase() + company.slice(1),
          location: j.location?.name || 'Remote',
          description: j.content ? j.content.replace(/<[^>]+>/g, '').substring(0, 2000) : '',
          applyUrl: j.absolute_url || `https://boards.greenhouse.io/${company}/jobs/${j.id}`,
          source: 'greenhouse',
          sourceId: `greenhouse_${company}_${j.id}`,
          postedAt: j.updated_at ? new Date(j.updated_at) : new Date(),
          remote: (j.location?.name || '').toLowerCase().includes('remote'),
        });
      }
      fetched++;
    } catch (e) {
      // Company not on Greenhouse or rate limited — skip
    }
  }
  console.log(`Greenhouse: fetched from ${fetched} companies, ${jobs.length} jobs`);
  return jobs;
}

// ── Lever crawler ─────────────────────────────────────────────────────────────
const LEVER_COMPANIES = [
  'netflix','lyft','reddit','pinterest','dropbox','box','zoom','slack',
  'atlassian','github','gitlab','hashicorp','elastic','mongodb','redis',
  'neo4j','influxdata','cockroachdb','yugabyte','citus','timescale',
  'cloudinary','imgix','fastly','cloudflare','akamai','limelight',
  'twitch','discord','roblox','epic-games','unity','ea','activision',
  'spotify','soundcloud','bandcamp','beatport','mixcloud','audiomack',
  'instacart','shipt','gopuff','getir','gorillas','flink','jokr',
  'opendoor','offerpad','knock','orchard','homeward','flyhomes',
  'compass','redfin','zillow','trulia','realtor','homes','homesnap',
  'oscar-health','devoted-health','bright-health','clover-health',
  'hims-hers','ro','cerebral','done','ahead','brightside','talkspace',
];

async function crawlLever() {
  const jobs = [];
  let fetched = 0;
  for (const company of LEVER_COMPANIES.slice(0, 40)) {
    try {
      const res = await axios.get(`https://api.lever.co/v0/postings/${company}?mode=json&limit=20`, { timeout: 8000 });
      const raw = Array.isArray(res.data) ? res.data : [];
      for (const j of raw.slice(0, 10)) {
        jobs.push({
          title: j.text,
          company: j.company || company.charAt(0).toUpperCase() + company.slice(1).replace(/-/g, ' '),
          location: j.categories?.location || j.workplaceType || 'Remote',
          description: j.descriptionPlain ? j.descriptionPlain.substring(0, 2000) : '',
          applyUrl: j.hostedUrl || `https://jobs.lever.co/${company}/${j.id}`,
          source: 'lever',
          sourceId: `lever_${company}_${j.id}`,
          postedAt: j.createdAt ? new Date(j.createdAt) : new Date(),
          remote: (j.workplaceType || '').toLowerCase().includes('remote'),
          employmentType: j.categories?.commitment,
        });
      }
      fetched++;
    } catch (e) {
      // Skip
    }
  }
  console.log(`Lever: fetched from ${fetched} companies, ${jobs.length} jobs`);
  return jobs;
}

// ── Ashby crawler ─────────────────────────────────────────────────────────────
const ASHBY_COMPANIES = [
  'openai','anthropic','mistral','cohere','perplexity','character',
  'scale-ai','labelbox','weights-biases','hugging-face','replicate',
  'modal','anyscale','together-ai','fireworks-ai','groq','cerebras',
  'vercel','railway','fly-io','render','supabase','planetscale',
  'neon','turso','convex','upstash','clerk','stytch','workos',
  'resend','loops','customer-io','braze','iterable','klaviyo',
  'retool','airplane','appsmith','tooljet','budibase','baserow',
  'linear','height','shortcut','jira-alternative','plane','huly',
  'loom','tella','descript','riverside','squadcast','zencastr',
  'notion','coda','anytype','craft','obsidian-publish','logseq',
  'figma','penpot','framer','webflow','bubble','glide','adalo',
  'stripe','braintree','adyen','checkout','mollie','paddle',
  'plaid','finicity','mx','yodlee','akoya','truelayer',
  'rippling','deel','remote','oyster','papaya-global','velocity',
  'lattice','culture-amp','leapsome','betterworks','15five',
  'greenhouse-software','lever-co','ashby-hq','workable','breezy',
];

async function crawlAshby() {
  const jobs = [];
  let fetched = 0;
  for (const company of ASHBY_COMPANIES.slice(0, 50)) {
    try {
      const res = await axios.post(
        `https://api.ashbyhq.com/posting-api/job-board/${company}`,
        { includeCompensation: true },
        { timeout: 8000, headers: { 'Content-Type': 'application/json' } }
      );
      const raw = res.data?.jobs || [];
      for (const j of raw.slice(0, 10)) {
        jobs.push({
          title: j.title,
          company: res.data?.organization?.name || company,
          location: j.isRemote ? 'Remote' : (j.location || 'Remote'),
          description: j.descriptionHtml ? j.descriptionHtml.replace(/<[^>]+>/g, '').substring(0, 2000) : '',
          applyUrl: j.jobUrl || `https://jobs.ashbyhq.com/${company}/${j.id}`,
          source: 'ashby',
          sourceId: `ashby_${company}_${j.id}`,
          postedAt: j.publishedDate ? new Date(j.publishedDate) : new Date(),
          remote: j.isRemote || false,
          employmentType: j.employmentType,
          salary: j.compensation ? {
            min: j.compensation.minValue,
            max: j.compensation.maxValue,
            currency: j.compensation.currency,
            period: j.compensation.interval,
          } : undefined,
        });
      }
      fetched++;
    } catch (e) {
      // Skip
    }
  }
  console.log(`Ashby: fetched from ${fetched} companies, ${jobs.length} jobs`);
  return jobs;
}

// ── SmartRecruiters crawler ───────────────────────────────────────────────────
const SMARTRECRUITERS_COMPANIES = [
  'walmart','target','kroger','costco','amazon','homedepot','lowes',
  'bestbuy','macys','nordstrom','gap','hm','zara','uniqlo','primark',
  'mcdonalds','starbucks','chipotle','yum','dominos','subway','dunkin',
  'marriott','hilton','hyatt','ihg','wyndham','choice','bestwestern',
  'delta','united','american-airlines','southwest','jetblue','spirit',
  'ups','fedex','dhl','xpo','jbhunt','werner','swift','knight',
  'jpmorgan','bankofamerica','wellsfargo','citi','goldman','morgan-stanley',
  'blackrock','vanguard','fidelity','schwab','td-ameritrade','etrade',
  'unitedhealth','anthem','aetna','cigna','humana','centene','molina',
  'hca','tenet','community-health','ardent','lifepoint','prime',
  'pfizer','johnson-johnson','abbvie','merck','bristol-myers','eli-lilly',
  'lockheed-martin','raytheon','northrop-grumman','general-dynamics','boeing',
  'ibm','accenture','deloitte','pwc','kpmg','ey','mckinsey','bain','bcg',
  'salesforce','oracle','sap','microsoft','google','meta','apple','amazon',
];

async function crawlSmartRecruiters() {
  const jobs = [];
  let fetched = 0;
  for (const company of SMARTRECRUITERS_COMPANIES.slice(0, 40)) {
    try {
      const res = await axios.get(
        `https://api.smartrecruiters.com/v1/companies/${company}/postings?limit=20`,
        { timeout: 8000, headers: { 'X-SmartToken': '' } }
      );
      const raw = res.data?.content || [];
      for (const j of raw.slice(0, 10)) {
        jobs.push({
          title: j.name,
          company: j.company?.name || company,
          location: j.location ? `${j.location.city || ''}, ${j.location.country || ''}`.trim().replace(/^,\s*|,\s*$/, '') : 'Remote',
          description: j.jobAd?.sections?.jobDescription?.text ? j.jobAd.sections.jobDescription.text.substring(0, 2000) : '',
          applyUrl: j.ref || `https://jobs.smartrecruiters.com/${company}/${j.id}`,
          source: 'smartrecruiters',
          sourceId: `sr_${company}_${j.id}`,
          postedAt: j.releasedDate ? new Date(j.releasedDate) : new Date(),
          remote: (j.workplace?.wfhPolicy || '').toLowerCase().includes('remote'),
          employmentType: j.typeOfEmployment?.label,
        });
      }
      fetched++;
    } catch (e) {
      // Skip
    }
  }
  console.log(`SmartRecruiters: fetched from ${fetched} companies, ${jobs.length} jobs`);
  return jobs;
}

// ── USAJobs crawler ───────────────────────────────────────────────────────────
const USAJOBS_API_KEY = '1/uUejqExPITAT5FHsAbUdBKlfluDr6WE8QKQ6eHJ/w=';
const USAJOBS_USER_AGENT = 'kgregjackson@gmail.com';

const USAJOBS_QUERIES = [
  'Chief Human Resources Officer', 'Chief People Officer',
  'Vice President Talent Acquisition', 'Director Talent Acquisition',
  'VP Human Resources', 'Human Resources Director',
  'Talent Acquisition Manager', 'Recruiting Director',
  'HR Strategy', 'Workforce Planning',
];

async function crawlUSAJobs() {
  const jobs = [];
  for (const keyword of USAJOBS_QUERIES.slice(0, 5)) {
    try {
      const res = await axios.get('https://data.usajobs.gov/api/search', {
        params: { Keyword: keyword, ResultsPerPage: 10, WhoMayApply: 'All' },
        headers: {
          'Authorization-Key': USAJOBS_API_KEY,
          'User-Agent': USAJOBS_USER_AGENT,
          'Host': 'data.usajobs.gov',
        },
        timeout: 10000,
      });
      const items = res.data?.SearchResult?.SearchResultItems || [];
      for (const item of items) {
        const pos = item.MatchedObjectDescriptor;
        jobs.push({
          title: pos.PositionTitle,
          company: pos.OrganizationName,
          location: pos.PositionLocationDisplay || 'Washington, DC',
          description: pos.UserArea?.Details?.JobSummary?.substring(0, 2000) || '',
          applyUrl: pos.ApplyURI?.[0] || pos.PositionURI,
          source: 'usajobs',
          sourceId: `usajobs_${pos.PositionID}`,
          postedAt: pos.PublicationStartDate ? new Date(pos.PublicationStartDate) : new Date(),
          remote: (pos.PositionLocationDisplay || '').toLowerCase().includes('remote'),
          employmentType: pos.PositionSchedule?.[0]?.Name,
          salary: {
            min: parseFloat(pos.PositionRemuneration?.[0]?.MinimumRange) || undefined,
            max: parseFloat(pos.PositionRemuneration?.[0]?.MaximumRange) || undefined,
            currency: 'USD',
            period: pos.PositionRemuneration?.[0]?.RateIntervalCode,
          },
        });
      }
    } catch (e) {
      console.log(`USAJobs query "${keyword}" failed: ${e.message}`);
    }
  }
  console.log(`USAJobs: ${jobs.length} jobs`);
  return jobs;
}

// ── JSearch (RapidAPI) ────────────────────────────────────────────────────────
// We'll use direct HTTP calls since we have the key from the server env
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

const JSEARCH_QUERIES = [
  'Chief Human Resources Officer remote',
  'Chief People Officer remote',
  'VP Talent Acquisition remote',
  'VP Human Resources remote',
  'SVP Talent Acquisition',
  'Head of People Operations remote',
  'Director Talent Acquisition remote',
  'HR Executive remote',
  'People Operations VP remote',
  'Talent Acquisition Leader remote',
];

async function crawlJSearch() {
  if (!RAPIDAPI_KEY) {
    console.log('JSearch: No RAPIDAPI_KEY set — skipping');
    return [];
  }
  const jobs = [];
  for (const query of JSEARCH_QUERIES.slice(0, 5)) {
    try {
      const res = await axios.get('https://jsearch.p.rapidapi.com/search', {
        params: { query, num_pages: 1, date_posted: 'today' },
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
        timeout: 10000,
      });
      const raw = res.data?.data || [];
      for (const j of raw) {
        jobs.push({
          title: j.job_title,
          company: j.employer_name,
          location: j.job_city ? `${j.job_city}, ${j.job_state || j.job_country}` : (j.job_is_remote ? 'Remote' : j.job_country),
          description: j.job_description?.substring(0, 2000) || '',
          applyUrl: j.job_apply_link || j.job_google_link,
          source: 'jsearch',
          sourceId: `jsearch_${j.job_id}`,
          postedAt: j.job_posted_at_datetime_utc ? new Date(j.job_posted_at_datetime_utc) : new Date(),
          remote: j.job_is_remote || false,
          employmentType: j.job_employment_type,
          salary: (j.job_min_salary || j.job_max_salary) ? {
            min: j.job_min_salary,
            max: j.job_max_salary,
            currency: j.job_salary_currency || 'USD',
            period: j.job_salary_period,
          } : undefined,
        });
      }
    } catch (e) {
      console.log(`JSearch query "${query}" failed: ${e.message}`);
    }
  }
  console.log(`JSearch: ${jobs.length} jobs`);
  return jobs;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const Job = mongoose.model('Job', jobSchema);

  const startCount = await Job.countDocuments({});
  console.log(`Jobs in DB before crawl: ${startCount}\n`);

  // Run all crawlers in parallel
  const [ghJobs, lvJobs, ashbyJobs, srJobs, usaJobs, jsearchJobs] = await Promise.all([
    crawlGreenhouse(),
    crawlLever(),
    crawlAshby(),
    crawlSmartRecruiters(),
    crawlUSAJobs(),
    crawlJSearch(),
  ]);

  const allJobs = [...ghJobs, ...lvJobs, ...ashbyJobs, ...srJobs, ...usaJobs, ...jsearchJobs];
  console.log(`\nTotal raw jobs discovered: ${allJobs.length}`);

  // Deduplicate by sourceId
  const seen = new Set();
  const unique = allJobs.filter(j => {
    if (!j.sourceId || seen.has(j.sourceId)) return false;
    seen.add(j.sourceId);
    return true;
  });
  console.log(`After deduplication: ${unique.length} unique jobs`);

  // Upsert into MongoDB
  let inserted = 0;
  let skipped = 0;
  for (const job of unique) {
    try {
      const result = await Job.updateOne(
        { sourceId: job.sourceId },
        { $setOnInsert: job },
        { upsert: true }
      );
      if (result.upsertedCount > 0) inserted++;
      else skipped++;
    } catch (e) {
      // Skip duplicates
    }
  }

  const endCount = await Job.countDocuments({});
  console.log(`\n=== CRAWL RESULTS ===`);
  console.log(`New jobs inserted: ${inserted}`);
  console.log(`Already existed (skipped): ${skipped}`);
  console.log(`Total jobs in DB now: ${endCount}`);

  // Source breakdown
  const breakdown = await Job.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]);
  console.log('\nJobs by source:');
  breakdown.sort((a, b) => b.count - a.count).forEach(s => {
    console.log(`  ${s._id}: ${s.count}`);
  });

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
