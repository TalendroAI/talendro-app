/**
 * Full-breadth crawler — takes ALL jobs from ALL sources.
 * No source-side filtering. Intelligence lives in the scoring layer, not here.
 */
import mongoose from 'mongoose';
import axios from 'axios';
import fs from 'fs';

const MONGODB_URI = 'mongodb+srv://greg_db_user:REDACTED_OLD_PASSWORD@talendrocluster.0hrgtda.mongodb.net/talendro?retryWrites=true&w=majority&appName=TalendroCluster';

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim().substring(0, 2000);
}

function norm(t) {
  return (t || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

// ── Greenhouse ────────────────────────────────────────────────────────────────
const GH_SLUGS = [
  'airbnb','stripe','coinbase','doordash','robinhood','plaid','figma','notion',
  'airtable','brex','chime','gusto','lattice','rippling','deel','remote',
  'datadog','pagerduty','hashicorp','confluent','databricks','snowflake',
  'cloudflare','crowdstrike','okta','auth0','hubspot','intercom','twilio',
  'segment','amplitude','mixpanel','retool','linear','loom','miro','asana',
  'clickup','anthropic','cohere','huggingface','supabase','planetscale',
  'vercel','netlify','railway','render','lyft','reddit','pinterest',
  'dropbox','box','zoom','atlassian','elastic','mongodb','redis',
  'twitch','discord','roblox','instacart','opendoor','compass',
  'oscar-health','hims-hers','ro','cerebral','talkspace','spotify',
  'epic-games','unity-technologies','lockheed-martin','raytheon-technologies',
  'northrop-grumman','general-dynamics','ibm','accenture','deloitte',
  'jpmorgan','goldman-sachs','blackrock','fidelity','unitedhealth-group',
  'anthem','aetna','cigna','humana','pfizer','johnson-johnson','abbvie',
  'merck','walmart','target','amazon','homedepot','lowes','bestbuy',
  'marriott','hilton','hyatt','delta','united-airlines','ups','fedex',
  'salesforce','oracle','sap','microsoft','google','meta','apple',
  'cisco','intel','qualcomm','nvidia','amd','broadcom',
  'mckinsey','bain','bcg','pwc','kpmg','ey','booz-allen',
  'att','verizon','tmobile','comcast','charter',
  'ford','gm','stellantis','toyota','honda',
  'ge','siemens','honeywell','3m','caterpillar','deere',
  'bank-of-america','wells-fargo','citi','morgan-stanley',
  'cvs-health','walgreens','mckesson','cardinal-health',
  'kroger','costco','dollar-general','dollar-tree',
  'disney','viacom','discovery','fox','nbcuniversal',
  'dbt-labs','fivetran','airbyte','census','hightouch',
  'betterworks','15five','leapsome','culture-amp',
  'scale','weights-biases','openai','modal','anyscale',
];

async function crawlGreenhouse() {
  const jobs = [];
  const CONCURRENCY = 12;
  let ok = 0;
  for (let i = 0; i < GH_SLUGS.length; i += CONCURRENCY) {
    const batch = GH_SLUGS.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(async (slug) => {
      const r = await axios.get(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`, { timeout: 8000 });
      const co = r.data?.company?.name || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
      return (r.data?.jobs || []).map(j => ({
        externalId: String(j.id), source: 'greenhouse',
        title: j.title, company: co, companySlug: slug,
        location: j.location?.name || '',
        remote: (j.location?.name || '').toLowerCase().includes('remote'),
        descriptionText: stripHtml(j.content),
        descriptionHtml: (j.content || '').substring(0, 5000),
        applyUrl: j.absolute_url || `https://boards.greenhouse.io/${slug}/jobs/${j.id}`,
        jobUrl: j.absolute_url || '',
        postedAt: j.updated_at ? new Date(j.updated_at) : null,
        normalizedTitle: norm(j.title), isActive: true,
        firstSeenAt: new Date(), lastSeenAt: new Date(),
      }));
    }));
    for (const r of results) { if (r.status === 'fulfilled') { jobs.push(...r.value); ok++; } }
  }
  console.log(`Greenhouse: ${ok}/${GH_SLUGS.length} companies, ${jobs.length} jobs`);
  return jobs;
}

// ── Lever ─────────────────────────────────────────────────────────────────────
const LV_SLUGS = [
  'netflix','lyft','reddit','pinterest','dropbox','box','zoom','slack',
  'atlassian','github','gitlab','hashicorp','elastic','mongodb','redis',
  'twitch','discord','roblox','instacart','opendoor','compass',
  'oscar-health','devoted-health','hims-hers','ro','cerebral','talkspace',
  'spotify','soundcloud','epic-games','unity','coinbase','robinhood',
  'chime','brex','plaid','doordash','gopuff','airbnb','uber','grab',
  'stripe','adyen','checkout','mollie','paddle','rippling','deel',
  'remote','oyster','papaya-global','lattice','culture-amp','leapsome',
  'betterworks','15five','greenhouse-software','lever-co','workable',
  'gusto','mercury','ramp','arc','dbt-labs','fivetran','airbyte',
  'amplitude','mixpanel','segment','notion','figma','framer','webflow',
  'salesforce','oracle','ibm','accenture','deloitte','mckinsey','bain',
  'walmart','target','amazon','homedepot','lowes','bestbuy',
  'marriott','hilton','hyatt','delta','united','ups','fedex',
  'jpmorgan','goldmansachs','blackrock','fidelity',
  'unitedhealth','anthem','aetna','cigna','humana',
  'pfizer','jnj','abbvie','merck',
  'lockheed','raytheon','boeing','northrop',
  'att','verizon','tmobile','comcast',
  'ford','gm','toyota','honda',
  'ge','siemens','honeywell','3m','caterpillar',
];

async function crawlLever() {
  const jobs = [];
  const CONCURRENCY = 12;
  let ok = 0;
  for (let i = 0; i < LV_SLUGS.length; i += CONCURRENCY) {
    const batch = LV_SLUGS.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(async (slug) => {
      const r = await axios.get(`https://api.lever.co/v0/postings/${slug}?mode=json&limit=50`, { timeout: 8000 });
      return (Array.isArray(r.data) ? r.data : []).map(j => ({
        externalId: j.id, source: 'lever',
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
        normalizedTitle: norm(j.text), isActive: true,
        firstSeenAt: new Date(), lastSeenAt: new Date(),
      }));
    }));
    for (const r of results) { if (r.status === 'fulfilled') { jobs.push(...r.value); ok++; } }
  }
  console.log(`Lever: ${ok}/${LV_SLUGS.length} companies, ${jobs.length} jobs`);
  return jobs;
}

// ── Ashby ─────────────────────────────────────────────────────────────────────
const ASHBY_SLUGS = [
  'openai','anthropic','mistral','cohere','perplexity','scale-ai',
  'modal','anyscale','together-ai','groq','vercel','railway','supabase',
  'neon','convex','clerk','stytch','workos','resend','retool','linear',
  'loom','notion','figma','framer','webflow','stripe','plaid','rippling',
  'deel','remote','lattice','culture-amp','greenhouse-software','lever-co',
  'ashby-hq','workable','breezy','gusto','brex','chime','mercury','ramp',
  'arc','oyster','papaya-global','velocity-global','betterworks','15five',
  'leapsome','dbt-labs','fivetran','airbyte','census','hightouch',
  'amplitude','mixpanel','segment','rudderstack','june',
  'walmart','target','amazon','homedepot','bestbuy','macys','nordstrom',
  'mcdonalds','starbucks','chipotle','marriott','hilton','hyatt',
  'delta','united','ups','fedex','jpmorgan','bankofamerica','wellsfargo',
  'citi','goldman','unitedhealth','pfizer','jnj','merck',
  'ibm','accenture','deloitte','salesforce','oracle','microsoft','google','meta',
];

async function crawlAshby() {
  const jobs = [];
  const CONCURRENCY = 12;
  let ok = 0;
  for (let i = 0; i < ASHBY_SLUGS.length; i += CONCURRENCY) {
    const batch = ASHBY_SLUGS.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(async (slug) => {
      const r = await axios.post(
        `https://api.ashbyhq.com/posting-api/job-board/${slug}`,
        { includeCompensation: true },
        { timeout: 8000, headers: { 'Content-Type': 'application/json' } }
      );
      const org = r.data?.organization?.name || slug;
      return (r.data?.jobs || []).map(j => ({
        externalId: j.id, source: 'ashby',
        title: j.title, company: org, companySlug: slug,
        location: j.isRemote ? 'Remote' : (j.location || ''),
        remote: j.isRemote || false,
        employmentType: j.employmentType || '',
        descriptionText: stripHtml(j.descriptionHtml),
        descriptionHtml: (j.descriptionHtml || '').substring(0, 5000),
        applyUrl: j.jobUrl || `https://jobs.ashbyhq.com/${slug}/${j.id}`,
        jobUrl: j.jobUrl || '',
        postedAt: j.publishedDate ? new Date(j.publishedDate) : null,
        normalizedTitle: norm(j.title), isActive: true,
        firstSeenAt: new Date(), lastSeenAt: new Date(),
        salary: j.compensation ? {
          min: j.compensation.minValue, max: j.compensation.maxValue,
          currency: j.compensation.currency || 'USD',
          period: j.compensation.interval || 'annual',
        } : undefined,
      }));
    }));
    for (const r of results) { if (r.status === 'fulfilled') { jobs.push(...r.value); ok++; } }
  }
  console.log(`Ashby: ${ok}/${ASHBY_SLUGS.length} companies, ${jobs.length} jobs`);
  return jobs;
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
  'microsoft','google','meta','apple','att','verizon','tmobile','comcast',
  'ford','gm','ge','siemens','honeywell','3m','caterpillar','deere',
  'mckinsey','bain','bcg','pwc','kpmg','ey',
  'bank-of-america','wells-fargo','morgan-stanley','ubs',
  'cvs-health','walgreens','mckesson','cardinal-health',
  'kroger','dollar-general','dollar-tree',
  'disney','comcast','viacom','discovery','fox',
  'fedex','ups','xpo','jbhunt','werner',
];

async function crawlSmartRecruiters() {
  const jobs = [];
  const CONCURRENCY = 12;
  let ok = 0;
  for (let i = 0; i < SR_SLUGS.length; i += CONCURRENCY) {
    const batch = SR_SLUGS.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(async (slug) => {
      const r = await axios.get(
        `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=50`,
        { timeout: 8000 }
      );
      return (r.data?.content || []).map(j => ({
        externalId: j.id, source: 'smartrecruiters',
        title: j.name, company: j.company?.name || slug, companySlug: slug,
        location: j.location ? `${j.location.city || ''}, ${j.location.country || ''}`.replace(/^,\s*|,\s*$/g, '').trim() : '',
        remote: (j.workplace?.wfhPolicy || '').toLowerCase().includes('remote'),
        employmentType: j.typeOfEmployment?.label || '',
        department: j.department?.label || '',
        descriptionText: stripHtml(j.jobAd?.sections?.jobDescription?.text || ''),
        descriptionHtml: (j.jobAd?.sections?.jobDescription?.text || '').substring(0, 5000),
        applyUrl: j.ref || `https://jobs.smartrecruiters.com/${slug}/${j.id}`,
        jobUrl: j.ref || '',
        postedAt: j.releasedDate ? new Date(j.releasedDate) : null,
        normalizedTitle: norm(j.name), isActive: true,
        firstSeenAt: new Date(), lastSeenAt: new Date(),
      }));
    }));
    for (const r of results) { if (r.status === 'fulfilled') { jobs.push(...r.value); ok++; } }
  }
  console.log(`SmartRecruiters: ${ok}/${SR_SLUGS.length} companies, ${jobs.length} jobs`);
  return jobs;
}

// ── USAJobs — broad queries covering all federal job functions ─────────────────
const USA_QUERIES = [
  // HR/People/TA
  'Chief Human Resources Officer', 'Chief People Officer', 'Chief Human Capital Officer',
  'Vice President Human Resources', 'Director Talent Acquisition', 'HR Director',
  'Talent Acquisition Manager', 'Recruiting Director', 'Workforce Planning',
  'Human Resources Manager', 'HR Manager', 'Talent Management',
  'Organizational Development', 'Diversity Equity Inclusion',
  'Employer Branding', 'Learning Development Director',
  // Finance/Accounting
  'Chief Financial Officer', 'VP Finance', 'Finance Director',
  'Controller', 'Financial Planning Analysis', 'Treasury Director',
  // Operations/Strategy
  'Chief Operating Officer', 'VP Operations', 'Operations Director',
  'Strategy Director', 'Business Development Director',
  // Technology/IT
  'Chief Information Officer', 'Chief Technology Officer', 'VP Engineering',
  'IT Director', 'Technology Director',
  // Marketing/Communications
  'Chief Marketing Officer', 'VP Marketing', 'Marketing Director',
  'Communications Director', 'Brand Director',
  // Legal/Compliance
  'General Counsel', 'Chief Compliance Officer', 'Legal Director',
  // Healthcare
  'Chief Medical Officer', 'Chief Nursing Officer', 'Healthcare Director',
  // Education/Training
  'Training Director', 'Education Director', 'Instructional Design',
  // General executive
  'Executive Director', 'Program Director', 'Deputy Director',
  'Senior Director', 'Managing Director',
];

async function crawlUSAJobs() {
  const jobs = [];
  const seen = new Set();
  for (const kw of USA_QUERIES) {
    try {
      const r = await axios.get('https://data.usajobs.gov/api/search', {
        params: { Keyword: kw, ResultsPerPage: 25, WhoMayApply: 'All' },
        headers: {
          'Authorization-Key': '1/uUejqExPITAT5FHsAbUdBKlfluDr6WE8QKQ6eHJ/w=',
          'User-Agent': 'kgregjackson@gmail.com',
          'Host': 'data.usajobs.gov',
        },
        timeout: 10000,
      });
      for (const item of (r.data?.SearchResult?.SearchResultItems || [])) {
        const p = item.MatchedObjectDescriptor;
        if (seen.has(p.PositionID)) continue;
        seen.add(p.PositionID);
        jobs.push({
          externalId: p.PositionID, source: 'usajobs',
          title: p.PositionTitle, company: p.OrganizationName,
          companySlug: (p.DepartmentName || 'federal').toLowerCase().replace(/\s+/g, '-'),
          location: p.PositionLocationDisplay || 'Washington, DC',
          remote: (p.PositionLocationDisplay || '').toLowerCase().includes('remote'),
          employmentType: p.PositionSchedule?.[0]?.Name || 'Full-Time',
          descriptionText: (p.UserArea?.Details?.JobSummary || '').substring(0, 2000),
          descriptionHtml: '',
          applyUrl: p.ApplyURI?.[0] || p.PositionURI,
          jobUrl: p.PositionURI || '',
          postedAt: p.PublicationStartDate ? new Date(p.PublicationStartDate) : null,
          normalizedTitle: norm(p.PositionTitle), isActive: true,
          firstSeenAt: new Date(), lastSeenAt: new Date(),
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
  console.log(`USAJobs: ${jobs.length} unique jobs across all functions`);
  return jobs;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB\n');
  const col = mongoose.connection.collection('jobs');

  console.log('Crawling ALL sources — no source-side filtering...\n');
  const t0 = Date.now();

  const [ghJobs, lvJobs, ashbyJobs, srJobs, usaJobs] = await Promise.all([
    crawlGreenhouse(),
    crawlLever(),
    crawlAshby(),
    crawlSmartRecruiters(),
    crawlUSAJobs(),
  ]);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const allJobs = [...ghJobs, ...lvJobs, ...ashbyJobs, ...srJobs, ...usaJobs];
  console.log(`\nCrawl completed in ${elapsed}s`);
  console.log(`Total raw jobs: ${allJobs.length}`);

  // Deduplicate by source+externalId
  const seen = new Set();
  const unique = allJobs.filter(j => {
    const key = `${j.source}::${j.externalId}`;
    if (!j.externalId || seen.has(key)) return false;
    seen.add(key); return true;
  });
  console.log(`Unique jobs: ${unique.length}`);

  // Clear and bulk insert
  await col.deleteMany({});
  let inserted = 0;
  for (let i = 0; i < unique.length; i += 200) {
    const chunk = unique.slice(i, i + 200);
    try {
      const res = await col.insertMany(chunk, { ordered: false });
      inserted += res.insertedCount;
    } catch (e) {
      inserted += (e.result?.nInserted || 0);
    }
  }

  const endCount = await col.countDocuments({});
  const breakdown = await col.aggregate([{ '$group': { _id: '$source', count: { '$sum': 1 } } }]).toArray();

  console.log(`\n=== CRAWL RESULTS ===`);
  console.log(`Jobs inserted: ${inserted}`);
  console.log(`Total in DB: ${endCount}`);
  console.log('\nBy source:');
  breakdown.sort((a, b) => b.count - a.count).forEach(s => console.log(`  ${s._id}: ${s.count}`));

  // Save summary
  const summary = {
    crawledAt: new Date().toISOString(),
    totalJobs: endCount,
    bySource: Object.fromEntries(breakdown.map(s => [s._id, s.count])),
  };
  fs.writeFileSync('/home/ubuntu/crawl_summary.json', JSON.stringify(summary, null, 2));
  console.log('\nSummary saved to /home/ubuntu/crawl_summary.json');

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(e => { console.error(e.message); process.exit(1); });
