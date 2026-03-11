/**
 * Fast crawler runner — matches the production Job model schema exactly.
 * Uses externalId+source as the unique key, strips HTML from descriptions.
 */
import mongoose from 'mongoose';
import axios from 'axios';

const MONGODB_URI = 'mongodb+srv://greg_db_user:REDACTED_OLD_PASSWORD@talendrocluster.0hrgtda.mongodb.net/talendro?retryWrites=true&w=majority&appName=TalendroCluster';

// Load the real Job model
const JobSchema = new mongoose.Schema({
  externalId: { type: String, required: true },
  source: { type: String, required: true },
  title: { type: String, required: true, index: true },
  company: { type: String, required: true, index: true },
  companySlug: { type: String, index: true },
  location: { type: String, default: '' },
  remote: { type: Boolean, default: false },
  hybrid: { type: Boolean, default: false },
  department: { type: String, default: '' },
  employmentType: { type: String, default: '' },
  experienceLevel: { type: String, default: '' },
  salary: { min: Number, max: Number, currency: { type: String, default: 'USD' }, period: { type: String, default: 'annual' } },
  descriptionText: { type: String, default: '' },
  descriptionHtml: { type: String, default: '' },
  applyUrl: { type: String, required: true },
  jobUrl: { type: String, default: '' },
  postedAt: { type: Date, default: null },
  firstSeenAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true, index: true },
  normalizedTitle: { type: String, index: true },
  keywords: [String],
}, { collection: 'jobs' });
JobSchema.index({ externalId: 1, source: 1 }, { unique: true });

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim().substring(0, 2000);
}

function normalizeTitle(t) {
  return (t || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

// ── Greenhouse ────────────────────────────────────────────────────────────────
const GH_SLUGS = [
  'airbnb','stripe','coinbase','doordash','robinhood','plaid','figma',
  'notion','airtable','brex','chime','gusto','lattice','rippling','deel',
  'anthropic','scale','datadog','pagerduty','hashicorp','confluent','databricks',
  'snowflake','cloudflare','crowdstrike','okta','auth0','hubspot','intercom',
  'twilio','segment','amplitude','mixpanel','retool','linear','loom','miro',
  'asana','clickup','superhuman','openai','cohere','weights-biases','huggingface',
  'supabase','planetscale','vercel','netlify','railway','render',
  'lyft','reddit','pinterest','dropbox','box','zoom','atlassian',
  'elastic','mongodb-inc','redis','instacart','opendoor','compass',
  'oscar-health','hims-hers','ro','cerebral','talkspace',
  'spotify','epic-games','unity-technologies',
  'lockheed-martin','raytheon-technologies','northrop-grumman',
  'general-dynamics','ibm','accenture','deloitte',
  'jpmorgan','goldman-sachs','blackrock','fidelity',
  'unitedhealth-group','anthem','aetna','cigna','humana',
  'pfizer','johnson-johnson','abbvie','merck','bristol-myers-squibb',
  'walmart','target','amazon','homedepot','lowes','bestbuy',
  'marriott','hilton','hyatt','delta','united-airlines','ups','fedex',
];

async function fetchGH(slug) {
  const r = await axios.get(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`, { timeout: 8000 });
  return (r.data?.jobs || []).slice(0, 10).map(j => ({
    externalId: String(j.id),
    source: 'greenhouse',
    title: j.title,
    company: r.data?.company?.name || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
    companySlug: slug,
    location: j.location?.name || '',
    remote: (j.location?.name || '').toLowerCase().includes('remote'),
    descriptionText: stripHtml(j.content),
    descriptionHtml: (j.content || '').substring(0, 5000),
    applyUrl: j.absolute_url || `https://boards.greenhouse.io/${slug}/jobs/${j.id}`,
    jobUrl: j.absolute_url || '',
    postedAt: j.updated_at ? new Date(j.updated_at) : null,
    normalizedTitle: normalizeTitle(j.title),
  }));
}

// ── Lever ─────────────────────────────────────────────────────────────────────
const LV_SLUGS = [
  'netflix','lyft','reddit','pinterest','dropbox','box','zoom','slack',
  'atlassian','github','gitlab','hashicorp','elastic','mongodb','redis',
  'twitch','discord','roblox','instacart','opendoor','compass',
  'oscar-health','devoted-health','hims-hers','ro','cerebral','talkspace',
  'spotify','soundcloud','bandcamp','epic-games','unity',
  'coinbase','robinhood','chime','brex','plaid',
  'doordash','gopuff','getir','shipt',
  'airbnb','lyft','uber','grab','gojek',
  'stripe','adyen','checkout','mollie','paddle',
];

async function fetchLV(slug) {
  const r = await axios.get(`https://api.lever.co/v0/postings/${slug}?mode=json&limit=20`, { timeout: 8000 });
  return (Array.isArray(r.data) ? r.data : []).slice(0, 10).map(j => ({
    externalId: j.id,
    source: 'lever',
    title: j.text,
    company: j.company || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
    companySlug: slug,
    location: j.categories?.location || j.workplaceType || '',
    remote: (j.workplaceType || '').toLowerCase().includes('remote'),
    employmentType: j.categories?.commitment || '',
    department: j.categories?.department || '',
    descriptionText: (j.descriptionPlain || '').substring(0, 2000),
    descriptionHtml: (j.description || '').substring(0, 5000),
    applyUrl: j.hostedUrl || `https://jobs.lever.co/${slug}/${j.id}`,
    jobUrl: j.hostedUrl || '',
    postedAt: j.createdAt ? new Date(j.createdAt) : null,
    normalizedTitle: normalizeTitle(j.text),
  }));
}

// ── Ashby ─────────────────────────────────────────────────────────────────────
const ASHBY_SLUGS = [
  'openai','anthropic','mistral','cohere','perplexity','scale-ai',
  'modal','anyscale','together-ai','groq','vercel','railway','supabase',
  'neon','convex','clerk','stytch','workos','resend','retool','linear',
  'loom','notion','figma','framer','webflow','stripe','plaid','rippling',
  'deel','remote','lattice','culture-amp','greenhouse-software','lever-co',
  'ashby-hq','workable','breezy','gusto','brex','chime','mercury','ramp',
  'arc','deel','remote','oyster','papaya-global','velocity-global',
  'betterworks','15five','leapsome','lattice','culture-amp',
  'dbt-labs','fivetran','airbyte','census','hightouch',
  'amplitude','mixpanel','segment','rudderstack','june',
];

async function fetchAshby(slug) {
  const r = await axios.post(
    `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
    { includeCompensation: true },
    { timeout: 8000, headers: { 'Content-Type': 'application/json' } }
  );
  const org = r.data?.organization?.name || slug;
  return (r.data?.jobs || []).slice(0, 10).map(j => ({
    externalId: j.id,
    source: 'ashby',
    title: j.title,
    company: org,
    companySlug: slug,
    location: j.isRemote ? 'Remote' : (j.location || ''),
    remote: j.isRemote || false,
    employmentType: j.employmentType || '',
    descriptionText: stripHtml(j.descriptionHtml),
    descriptionHtml: (j.descriptionHtml || '').substring(0, 5000),
    applyUrl: j.jobUrl || `https://jobs.ashbyhq.com/${slug}/${j.id}`,
    jobUrl: j.jobUrl || '',
    postedAt: j.publishedDate ? new Date(j.publishedDate) : null,
    normalizedTitle: normalizeTitle(j.title),
    salary: j.compensation ? {
      min: j.compensation.minValue,
      max: j.compensation.maxValue,
      currency: j.compensation.currency || 'USD',
      period: j.compensation.interval || 'annual',
    } : undefined,
  }));
}

// ── SmartRecruiters ───────────────────────────────────────────────────────────
const SR_SLUGS = [
  'walmart','target','kroger','costco','amazon','homedepot','lowes',
  'bestbuy','macys','nordstrom','mcdonalds','starbucks','chipotle',
  'marriott','hilton','hyatt','delta','united','ups','fedex','dhl','xpo',
  'jpmorgan','bankofamerica','wellsfargo','citi','goldman','blackrock',
  'unitedhealth','anthem','aetna','cigna','humana','pfizer',
  'johnson-johnson','abbvie','merck','lockheed-martin','raytheon','boeing',
  'ibm','accenture','deloitte','salesforce','oracle','sap',
  'microsoft','google','meta','apple',
  'mckinsey','bain','bcg','pwc','kpmg','ey',
  'att','verizon','tmobile','comcast','charter',
  'ford','gm','stellantis','toyota','honda',
  'ge','siemens','honeywell','3m','caterpillar','deere',
];

async function fetchSR(slug) {
  const r = await axios.get(
    `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=20`,
    { timeout: 8000 }
  );
  return (r.data?.content || []).slice(0, 10).map(j => ({
    externalId: j.id,
    source: 'smartrecruiters',
    title: j.name,
    company: j.company?.name || slug,
    companySlug: slug,
    location: j.location ? `${j.location.city || ''}, ${j.location.country || ''}`.replace(/^,\s*|,\s*$/g, '').trim() : '',
    remote: (j.workplace?.wfhPolicy || '').toLowerCase().includes('remote'),
    employmentType: j.typeOfEmployment?.label || '',
    department: j.department?.label || '',
    descriptionText: stripHtml(j.jobAd?.sections?.jobDescription?.text || ''),
    descriptionHtml: (j.jobAd?.sections?.jobDescription?.text || '').substring(0, 5000),
    applyUrl: j.ref || `https://jobs.smartrecruiters.com/${slug}/${j.id}`,
    jobUrl: j.ref || '',
    postedAt: j.releasedDate ? new Date(j.releasedDate) : null,
    normalizedTitle: normalizeTitle(j.name),
  }));
}

// ── USAJobs ───────────────────────────────────────────────────────────────────
const USA_QUERIES = [
  'Chief Human Resources Officer', 'Chief People Officer',
  'Vice President Human Resources', 'Director Talent Acquisition',
  'Human Resources Director', 'Talent Acquisition Manager',
  'Recruiting Director', 'Workforce Planning Director',
  'HR Executive', 'People Operations Director',
  'Human Capital Officer', 'HR Manager',
  'Talent Management Director', 'Organizational Development',
  'Diversity Equity Inclusion Director',
];

async function fetchUSAJobs() {
  const jobs = [];
  for (const kw of USA_QUERIES) {
    try {
      const r = await axios.get('https://data.usajobs.gov/api/search', {
        params: { Keyword: kw, ResultsPerPage: 15, WhoMayApply: 'All' },
        headers: {
          'Authorization-Key': '1/uUejqExPITAT5FHsAbUdBKlfluDr6WE8QKQ6eHJ/w=',
          'User-Agent': 'kgregjackson@gmail.com',
          'Host': 'data.usajobs.gov',
        },
        timeout: 10000,
      });
      for (const item of (r.data?.SearchResult?.SearchResultItems || [])) {
        const p = item.MatchedObjectDescriptor;
        jobs.push({
          externalId: p.PositionID,
          source: 'usajobs',
          title: p.PositionTitle,
          company: p.OrganizationName,
          companySlug: p.DepartmentName?.toLowerCase().replace(/\s+/g, '-') || 'federal',
          location: p.PositionLocationDisplay || 'Washington, DC',
          remote: (p.PositionLocationDisplay || '').toLowerCase().includes('remote'),
          employmentType: p.PositionSchedule?.[0]?.Name || 'Full-Time',
          descriptionText: (p.UserArea?.Details?.JobSummary || '').substring(0, 2000),
          descriptionHtml: '',
          applyUrl: p.ApplyURI?.[0] || p.PositionURI,
          jobUrl: p.PositionURI || '',
          postedAt: p.PublicationStartDate ? new Date(p.PublicationStartDate) : null,
          normalizedTitle: normalizeTitle(p.PositionTitle),
          salary: {
            min: parseFloat(p.PositionRemuneration?.[0]?.MinimumRange) || undefined,
            max: parseFloat(p.PositionRemuneration?.[0]?.MaximumRange) || undefined,
            currency: 'USD',
            period: (p.PositionRemuneration?.[0]?.RateIntervalCode || 'PA') === 'PA' ? 'annual' : 'hourly',
          },
        });
      }
    } catch (e) { /* skip */ }
  }
  return jobs;
}

// ── Batch fetch helper ────────────────────────────────────────────────────────
async function batchFetch(slugs, fn, label) {
  const CONCURRENCY = 10;
  const jobs = [];
  let ok = 0;
  for (let i = 0; i < slugs.length; i += CONCURRENCY) {
    const batch = slugs.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(s => fn(s)));
    for (const r of results) {
      if (r.status === 'fulfilled') { jobs.push(...r.value); ok++; }
    }
  }
  console.log(`${label}: ${ok}/${slugs.length} companies responded, ${jobs.length} jobs`);
  return jobs;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const Job = mongoose.model('Job', JobSchema);

  console.log('Running all crawlers in parallel...\n');
  const t0 = Date.now();

  const [ghJobs, lvJobs, ashbyJobs, srJobs, usaJobs] = await Promise.all([
    batchFetch(GH_SLUGS, fetchGH, 'Greenhouse'),
    batchFetch(LV_SLUGS, fetchLV, 'Lever'),
    batchFetch(ASHBY_SLUGS, fetchAshby, 'Ashby'),
    batchFetch(SR_SLUGS, fetchSR, 'SmartRecruiters'),
    fetchUSAJobs().then(j => { console.log(`USAJobs: ${j.length} jobs`); return j; }),
  ]);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const allJobs = [...ghJobs, ...lvJobs, ...ashbyJobs, ...srJobs, ...usaJobs];
  console.log(`\nCrawl completed in ${elapsed}s`);
  console.log(`Total raw jobs: ${allJobs.length}`);

  // Deduplicate by externalId+source
  const seen = new Set();
  const unique = allJobs.filter(j => {
    const key = `${j.source}::${j.externalId}`;
    if (!j.externalId || seen.has(key)) return false;
    seen.add(key); return true;
  });
  console.log(`Unique jobs: ${unique.length}`);

  // Clear and bulk insert
  await Job.deleteMany({});
  let inserted = 0;
  for (let i = 0; i < unique.length; i += 200) {
    const chunk = unique.slice(i, i + 200);
    try {
      const res = await Job.insertMany(chunk, { ordered: false });
      inserted += res.length;
    } catch (e) {
      inserted += (e.result?.nInserted || 0);
    }
  }

  const endCount = await Job.countDocuments({});
  const breakdown = await Job.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]);

  console.log(`\n=== CRAWL RESULTS ===`);
  console.log(`Jobs inserted: ${inserted}`);
  console.log(`Total in DB: ${endCount}`);
  console.log('\nBy source:');
  breakdown.sort((a, b) => b.count - a.count).forEach(s => console.log(`  ${s._id}: ${s.count}`));

  // Find top matches for Kenneth (TA/HR/People executive roles)
  const topJobs = await Job.find({
    $or: [
      { normalizedTitle: { $regex: /chief human resources|chief people|vp talent|vice president talent|svp talent|head of talent|head of people|director talent|director of talent|director of people|vp human resources|vice president human resources|vp people|people operations/i } },
      { normalizedTitle: { $regex: /talent acquisition|human resources director|hr director|people director|recruiting director|workforce planning/i } },
    ]
  }).sort({ postedAt: -1 }).limit(30).lean();

  console.log(`\nTop matching jobs for Kenneth (${topJobs.length} found):`);
  topJobs.forEach(j => {
    const sal = j.salary?.min ? ` | $${Math.round(j.salary.min/1000)}k-$${Math.round((j.salary.max||j.salary.min)/1000)}k` : '';
    console.log(`  [${j.source.toUpperCase()}] ${j.title} @ ${j.company} — ${j.location || 'Remote'}${sal}`);
  });

  // Save results for dashboard generation
  const dashboardData = {
    totalJobs: endCount,
    bySource: Object.fromEntries(breakdown.map(s => [s._id, s.count])),
    topMatches: topJobs.map(j => ({
      id: j._id,
      title: j.title,
      company: j.company,
      location: j.location || 'Remote',
      source: j.source,
      applyUrl: j.applyUrl,
      postedAt: j.postedAt,
      remote: j.remote,
      salary: j.salary,
      description: j.descriptionText?.substring(0, 300),
    })),
  };

  import('fs').then(fs => {
    fs.writeFileSync('/home/ubuntu/crawler_results.json', JSON.stringify(dashboardData, null, 2));
    console.log('\nResults saved to /home/ubuntu/crawler_results.json');
  });

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
