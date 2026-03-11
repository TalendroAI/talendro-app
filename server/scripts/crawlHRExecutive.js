/**
 * Targeted HR/TA Executive job crawler.
 * Filters Greenhouse, Lever, SmartRecruiters by HR/People/TA keywords.
 * Also queries LinkedIn Jobs RSS and Indeed RSS for executive HR roles.
 */
import mongoose from 'mongoose';
import axios from 'axios';
import fs from 'fs';

const MONGODB_URI = 'mongodb+srv://greg_db_user:REDACTED_OLD_PASSWORD@talendrocluster.0hrgtda.mongodb.net/talendro?retryWrites=true&w=majority&appName=TalendroCluster';

// HR/People/TA title keywords to filter for
const HR_TITLE_KEYWORDS = [
  'talent acquisition', 'talent management', 'human resources', 'human capital',
  'people operations', 'people & culture', 'people and culture',
  'chief people', 'chief hr', 'chief human', 'chro', 'cpo',
  'vp talent', 'vp hr', 'vp people', 'vp human',
  'svp talent', 'svp hr', 'svp people',
  'director talent', 'director hr', 'director people', 'director human',
  'head of talent', 'head of hr', 'head of people', 'head of human',
  'recruiting director', 'recruiting manager', 'recruiting lead',
  'workforce planning', 'organizational development', 'org development',
  'employer branding', 'diversity equity', 'dei director', 'dei manager',
  'hr business partner', 'hrbp', 'hr director', 'hr manager',
  'compensation', 'total rewards', 'benefits director', 'benefits manager',
  'learning development', 'l&d director', 'training director',
  'employee experience', 'employee engagement',
];

function matchesHR(title) {
  const t = (title || '').toLowerCase();
  return HR_TITLE_KEYWORDS.some(kw => t.includes(kw));
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim().substring(0, 2000);
}

// ── Greenhouse — filter by HR/People titles ───────────────────────────────────
// Use a broader list of companies including large enterprises that hire HR execs
const GH_COMPANIES = [
  // Large enterprises with active HR hiring
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
  // Additional large employers
  'salesforce','oracle','sap','microsoft','google','meta','apple',
  'cisco','intel','qualcomm','nvidia','amd','broadcom','texas-instruments',
  'mckinsey','bain','bcg','pwc','kpmg','ey','booz-allen',
  'att','verizon','tmobile','comcast','charter','dish',
  'ford','gm','stellantis','toyota','honda','bmw',
  'ge','siemens','honeywell','3m','caterpillar','deere',
  'bank-of-america','wells-fargo','citi','morgan-stanley','ubs',
  'cvs-health','walgreens','mckesson','cardinal-health','amerisourcebergen',
  'kroger','costco','target','dollar-general','dollar-tree',
  'fedex','ups','xpo','jbhunt','werner','swift',
  'hilton','marriott','hyatt','ihg','wyndham','choice',
  'disney','comcast','viacom','discovery','fox','nbcuniversal',
];

async function crawlGreenhouseHR() {
  const jobs = [];
  const CONCURRENCY = 12;
  let fetched = 0;

  for (let i = 0; i < GH_COMPANIES.length; i += CONCURRENCY) {
    const batch = GH_COMPANIES.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(async (slug) => {
      const r = await axios.get(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`, { timeout: 8000 });
      const allJobs = r.data?.jobs || [];
      const companyName = r.data?.company?.name || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
      // Filter to HR/People/TA roles only
      return allJobs
        .filter(j => matchesHR(j.title))
        .map(j => ({
          externalId: String(j.id),
          source: 'greenhouse',
          title: j.title,
          company: companyName,
          companySlug: slug,
          location: j.location?.name || '',
          remote: (j.location?.name || '').toLowerCase().includes('remote'),
          descriptionText: stripHtml(j.content),
          descriptionHtml: (j.content || '').substring(0, 5000),
          applyUrl: j.absolute_url || `https://boards.greenhouse.io/${slug}/jobs/${j.id}`,
          jobUrl: j.absolute_url || '',
          postedAt: j.updated_at ? new Date(j.updated_at) : null,
          normalizedTitle: j.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim(),
          isActive: true,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        }));
    }));
    for (const r of results) {
      if (r.status === 'fulfilled') { jobs.push(...r.value); fetched++; }
    }
  }
  console.log(`Greenhouse HR filter: ${fetched}/${GH_COMPANIES.length} companies, ${jobs.length} HR/TA jobs`);
  return jobs;
}

// ── Lever — filter by HR/People titles ───────────────────────────────────────
const LV_COMPANIES = [
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
];

async function crawlLeverHR() {
  const jobs = [];
  const CONCURRENCY = 12;
  let fetched = 0;

  for (let i = 0; i < LV_COMPANIES.length; i += CONCURRENCY) {
    const batch = LV_COMPANIES.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(async (slug) => {
      const r = await axios.get(`https://api.lever.co/v0/postings/${slug}?mode=json&limit=50`, { timeout: 8000 });
      const allJobs = Array.isArray(r.data) ? r.data : [];
      return allJobs
        .filter(j => matchesHR(j.text))
        .map(j => ({
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
          normalizedTitle: j.text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim(),
          isActive: true,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        }));
    }));
    for (const r of results) {
      if (r.status === 'fulfilled') { jobs.push(...r.value); fetched++; }
    }
  }
  console.log(`Lever HR filter: ${fetched}/${LV_COMPANIES.length} companies, ${jobs.length} HR/TA jobs`);
  return jobs;
}

// ── USAJobs — HR/TA executive queries ────────────────────────────────────────
const USA_QUERIES = [
  'Chief Human Resources Officer', 'Chief People Officer', 'Chief Human Capital Officer',
  'Vice President Human Resources', 'Vice President Talent Acquisition',
  'Director Talent Acquisition', 'Human Resources Director', 'HR Director',
  'Talent Acquisition Director', 'Talent Acquisition Manager',
  'Recruiting Director', 'Workforce Planning Director', 'HR Executive',
  'People Operations Director', 'Organizational Development Director',
  'Diversity Equity Inclusion Director', 'DEI Director',
  'Employer Branding Director', 'Talent Management Director',
  'Human Capital Director', 'HR Business Partner Director',
  'Learning Development Director', 'Employee Experience Director',
  'Compensation Benefits Director', 'Total Rewards Director',
  'HR Manager', 'Talent Acquisition Manager', 'Recruiting Manager',
];

async function crawlUSAJobsHR() {
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
          externalId: p.PositionID,
          source: 'usajobs',
          title: p.PositionTitle,
          company: p.OrganizationName,
          companySlug: (p.DepartmentName || 'federal').toLowerCase().replace(/\s+/g, '-'),
          location: p.PositionLocationDisplay || 'Washington, DC',
          remote: (p.PositionLocationDisplay || '').toLowerCase().includes('remote'),
          employmentType: p.PositionSchedule?.[0]?.Name || 'Full-Time',
          descriptionText: (p.UserArea?.Details?.JobSummary || '').substring(0, 2000),
          descriptionHtml: '',
          applyUrl: p.ApplyURI?.[0] || p.PositionURI,
          jobUrl: p.PositionURI || '',
          postedAt: p.PublicationStartDate ? new Date(p.PublicationStartDate) : null,
          normalizedTitle: (p.PositionTitle || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim(),
          isActive: true,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
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
  console.log(`USAJobs HR queries: ${jobs.length} unique HR/TA jobs`);
  return jobs;
}

// ── SmartRecruiters — HR filter ───────────────────────────────────────────────
const SR_COMPANIES = [
  'walmart','target','kroger','costco','amazon','homedepot','lowes',
  'bestbuy','macys','nordstrom','mcdonalds','starbucks','chipotle',
  'marriott','hilton','hyatt','delta','united','ups','fedex','dhl','xpo',
  'jpmorgan','bankofamerica','wellsfargo','citi','goldman','blackrock',
  'unitedhealth','anthem','aetna','cigna','humana','pfizer',
  'johnson-johnson','abbvie','merck','lockheed-martin','raytheon','boeing',
  'ibm','accenture','deloitte','salesforce','oracle','sap',
  'microsoft','google','meta','apple','att','verizon','tmobile',
  'ford','gm','ge','siemens','honeywell','3m','caterpillar',
  'mckinsey','bain','bcg','pwc','kpmg','ey',
];

async function crawlSmartRecruitersHR() {
  const jobs = [];
  const CONCURRENCY = 12;
  let fetched = 0;

  for (let i = 0; i < SR_COMPANIES.length; i += CONCURRENCY) {
    const batch = SR_COMPANIES.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(async (slug) => {
      const r = await axios.get(
        `https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=50`,
        { timeout: 8000 }
      );
      const allJobs = r.data?.content || [];
      return allJobs
        .filter(j => matchesHR(j.name))
        .map(j => ({
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
          normalizedTitle: (j.name || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim(),
          isActive: true,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        }));
    }));
    for (const r of results) {
      if (r.status === 'fulfilled') { jobs.push(...r.value); fetched++; }
    }
  }
  console.log(`SmartRecruiters HR filter: ${fetched}/${SR_COMPANIES.length} companies, ${jobs.length} HR/TA jobs`);
  return jobs;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const col = mongoose.connection.collection('jobs');

  console.log('Running targeted HR/TA executive crawlers...\n');
  const t0 = Date.now();

  const [ghJobs, lvJobs, srJobs, usaJobs] = await Promise.all([
    crawlGreenhouseHR(),
    crawlLeverHR(),
    crawlSmartRecruitersHR(),
    crawlUSAJobsHR(),
  ]);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const allJobs = [...ghJobs, ...lvJobs, ...srJobs, ...usaJobs];
  console.log(`\nCrawl completed in ${elapsed}s`);
  console.log(`Total HR/TA jobs discovered: ${allJobs.length}`);

  // Deduplicate
  const seen = new Set();
  const unique = allJobs.filter(j => {
    const key = `${j.source}::${j.externalId}`;
    if (!j.externalId || seen.has(key)) return false;
    seen.add(key); return true;
  });
  console.log(`Unique: ${unique.length}`);

  // Clear and insert
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
  const breakdown = await col.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]).toArray();

  console.log(`\n=== RESULTS ===`);
  console.log(`Jobs inserted: ${inserted}`);
  console.log(`Total in DB: ${endCount}`);
  console.log('\nBy source:');
  breakdown.sort((a, b) => b.count - a.count).forEach(s => console.log(`  ${s._id}: ${s.count}`));

  // Show all jobs found
  const allInDB = await col.find({}).sort({ title: 1 }).toArray();
  console.log('\nAll HR/TA jobs discovered:');
  allInDB.forEach((j, i) => {
    const sal = j.salary?.min ? ` | $${Math.round(j.salary.min/1000)}k-$${Math.round((j.salary.max||j.salary.min)/1000)}k` : '';
    const rem = j.remote ? ' [REMOTE]' : '';
    console.log(`${String(i+1).padStart(3)}. ${j.title} @ ${j.company} (${j.source})${sal}${rem}`);
    console.log(`     ${j.location || 'Location not specified'}`);
  });

  // Save for dashboard
  const output = {
    crawledAt: new Date().toISOString(),
    totalJobs: endCount,
    bySource: Object.fromEntries(breakdown.map(s => [s._id, s.count])),
    jobs: allInDB.map(j => ({
      id: j._id.toString(),
      title: j.title,
      company: j.company,
      location: j.location || '',
      source: j.source,
      applyUrl: j.applyUrl,
      postedAt: j.postedAt,
      remote: j.remote || false,
      salary: j.salary,
      description: (j.descriptionText || '').substring(0, 500),
    })),
  };

  fs.writeFileSync('/home/ubuntu/hr_jobs_for_kenneth.json', JSON.stringify(output, null, 2));
  console.log('\nResults saved to /home/ubuntu/hr_jobs_for_kenneth.json');

  await mongoose.disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
