/**
 * Ashby ATS Crawler
 *
 * Ashby provides a fully public JSON API for all job boards.
 * No authentication required.
 *
 * Job listings: POST https://api.ashbyhq.com/posting-api/job-board/{slug}
 * Response:     { jobPostings: [ { id, title, departmentName, locationName, ... } ] }
 *
 * Ashby is used heavily by high-growth startups and mid-market companies
 * across all sectors — tech, healthcare, fintech, consumer, B2B SaaS.
 */

import axios from 'axios';
import Company from '../models/Company.js';
import Job from '../models/Job.js';

const BASE_URL = 'https://api.ashbyhq.com/posting-api/job-board';
const REQUEST_TIMEOUT = 15000;
const DELAY_BETWEEN_REQUESTS = 350; // ms — be polite

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Utility: strip HTML ─────────────────────────────────────────────────────
function stripHtml(html = '') {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Utility: detect remote/hybrid ───────────────────────────────────────────
function detectRemote(location = '', title = '', description = '') {
  const text = `${location} ${title} ${description}`.toLowerCase();
  const isRemote = /\bremote\b/.test(text);
  const isHybrid = /\bhybrid\b/.test(text);
  return { remote: isRemote && !isHybrid, hybrid: isHybrid };
}

// ─── Utility: normalize employment type ──────────────────────────────────────
function normalizeEmploymentType(type = '') {
  const t = type.toLowerCase();
  if (t.includes('full')) return 'full-time';
  if (t.includes('part')) return 'part-time';
  if (t.includes('contract') || t.includes('freelance')) return 'contract';
  if (t.includes('intern')) return 'internship';
  if (t.includes('temp')) return 'temporary';
  return type || 'full-time';
}

// ─── Utility: extract keywords ───────────────────────────────────────────────
function extractKeywords(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
  const keywords = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php',
    'react', 'vue', 'angular', 'node', 'express', 'django', 'flask', 'spring',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'devops',
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis',
    'machine learning', 'deep learning', 'data science', 'analytics',
    'product management', 'project management', 'agile', 'scrum',
    'sales', 'marketing', 'finance', 'accounting', 'hr', 'recruiting',
    'design', 'ux', 'ui', 'figma',
    'healthcare', 'legal', 'compliance', 'security', 'cybersecurity',
    'remote', 'hybrid', 'onsite'
  ];
  return keywords.filter(kw => text.includes(kw));
}

// ─── Discover Ashby companies from seed list ─────────────────────────────────
export async function discoverAshbyCompanies() {
  console.log('[Ashby] Starting company discovery...');
  let discovered = 0;
  let added = 0;

  const seedSlugs = getAshbySeedSlugs();

  for (const slug of seedSlugs) {
    try {
      const response = await axios.post(
        `${BASE_URL}/${slug}`,
        {},
        {
          timeout: REQUEST_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Talendro Job Aggregator/1.0'
          }
        }
      );

      if (response.data && Array.isArray(response.data.jobPostings)) {
        discovered++;

        await Company.findOneAndUpdate(
          { slug, source: 'ashby' },
          {
            $setOnInsert: {
              name: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              slug,
              source: 'ashby',
              discoveredAt: new Date(),
              discoverySource: 'seed'
            }
          },
          { upsert: true, new: true }
        );
        added++;
      }
    } catch (err) {
      // Board doesn't exist or is private — skip silently
    }
    await sleep(DELAY_BETWEEN_REQUESTS);
  }

  console.log(`[Ashby] Discovery complete: ${discovered} verified, ${added} companies added`);
  return { discovered, added };
}

// ─── Crawl a single Ashby company's job listings ─────────────────────────────
export async function crawlAshbyCompany(company) {
  const { slug, name } = company;

  try {
    const response = await axios.post(
      `${BASE_URL}/${slug}`,
      {},
      {
        timeout: REQUEST_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Talendro Job Aggregator/1.0'
        }
      }
    );

    const postings = response.data?.jobPostings || [];
    let newJobs = 0;
    let updatedJobs = 0;

    for (const posting of postings) {
      if (!posting.isListed) continue; // skip unlisted/confidential postings

      const locationStr = posting.locationName || posting.location || '';
      const descriptionHtml = posting.descriptionHtml || posting.description || '';
      const descriptionText = stripHtml(descriptionHtml);
      const { remote, hybrid } = detectRemote(locationStr, posting.title, descriptionText);
      const keywords = extractKeywords(posting.title, descriptionText);

      const applyUrl = posting.jobUrl
        || `https://jobs.ashbyhq.com/${slug}/${posting.id}`;

      let postedAt = null;
      if (posting.publishedDate) {
        try { postedAt = new Date(posting.publishedDate); } catch (_) {}
      }

      const jobData = {
        externalId: `ashby_${posting.id}`,
        source: 'ashby',
        title: posting.title || '',
        company: name || slug,
        companySlug: slug,
        location: locationStr,
        locations: locationStr ? [locationStr] : [],
        remote,
        hybrid,
        department: posting.departmentName || '',
        employmentType: normalizeEmploymentType(posting.employmentType || ''),
        descriptionHtml,
        descriptionText: descriptionText.substring(0, 5000),
        applyUrl,
        jobUrl: applyUrl,
        postedAt,
        lastSeenAt: new Date(),
        isActive: true,
        keywords,
        normalizedTitle: (posting.title || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
      };

      const existing = await Job.findOne({ externalId: jobData.externalId, source: 'ashby' });

      if (!existing) {
        await Job.create({ ...jobData, firstSeenAt: new Date() });
        newJobs++;
      } else {
        await Job.updateOne(
          { externalId: jobData.externalId, source: 'ashby' },
          { $set: { lastSeenAt: new Date(), isActive: true, keywords } }
        );
        updatedJobs++;
      }
    }

    if (postings.length === 0) {
      await Job.updateMany(
        { companySlug: slug, source: 'ashby', isActive: true },
        { $set: { isActive: false } }
      );
    }

    await Company.updateOne(
      { slug, source: 'ashby' },
      {
        $set: {
          lastCrawledAt: new Date(),
          lastSuccessAt: new Date(),
          consecutiveFailures: 0,
          activeJobCount: postings.length,
          totalJobsFound: (company.totalJobsFound || 0) + newJobs
        }
      }
    );

    return { slug, newJobs, updatedJobs, totalJobs: postings.length };

  } catch (err) {
    await Company.updateOne(
      { slug, source: 'ashby' },
      {
        $set: { lastCrawledAt: new Date() },
        $inc: { consecutiveFailures: 1 }
      }
    );

    if (company.consecutiveFailures >= 4) {
      await Company.updateOne(
        { slug, source: 'ashby' },
        { $set: { isActive: false } }
      );
      console.log(`[Ashby] Disabled ${slug} after repeated failures`);
    }

    throw err;
  }
}

// ─── Seed list of known Ashby company slugs ───────────────────────────────────
// Ashby is used by high-growth companies across all sectors.
// Slug format: lowercase company name with hyphens (e.g., "linear-app")
function getAshbySeedSlugs() {
  return [
    // ── High-Growth Tech & SaaS ────────────────────────────────────────────
    'linear', 'vercel', 'planetscale', 'railway', 'render',
    'supabase', 'neon', 'turso', 'upstash', 'convex',
    'retool', 'airplane', 'appsmith', 'budibase', 'tooljet',
    'dbt-labs', 'airbyte', 'fivetran', 'hightouch', 'census',
    'hex', 'mode', 'sigma', 'preset', 'metabase',
    'posthog', 'june', 'mixpanel', 'amplitude', 'heap',
    'clerk', 'stytch', 'ory', 'frontegg', 'workos',
    'resend', 'loops', 'customer-io', 'braze', 'iterable',
    'loom', 'grain', 'fireflies', 'otter', 'rev',
    'miro', 'mural', 'figma', 'framer', 'webflow',
    'notion', 'coda', 'craft', 'anytype', 'capacities',
    'linear-app', 'height', 'plane', 'clickup', 'monday',
    'rippling', 'deel', 'remote', 'oyster', 'papaya-global',
    'lattice', 'culture-amp', 'leapsome', '15five', 'betterworks',
    'ramp', 'brex', 'mercury', 'relay', 'found',
    'gusto', 'justworks', 'bamboohr', 'namely', 'paychex',
    'checkr', 'sterling', 'hireright', 'accurate', 'first-advantage',
    'greenhouse', 'lever', 'ashby', 'workable', 'recruitee',
    'gem', 'beamery', 'phenom', 'eightfold', 'seekout',
    'gong', 'chorus', 'clari', 'outreach', 'salesloft',
    'apollo', 'zoominfo', 'lusha', 'hunter', 'clearbit',
    'hubspot', 'pipedrive', 'close', 'copper', 'affinity',
    'intercom', 'zendesk', 'freshdesk', 'helpscout', 'front',
    'pagerduty', 'opsgenie', 'victorops', 'statuspage', 'incident-io',
    'datadog', 'newrelic', 'dynatrace', 'grafana', 'honeycomb',
    'sentry', 'rollbar', 'bugsnag', 'logrocket', 'fullstory',
    'snyk', 'sonarqube', 'veracode', 'checkmarx', 'lacework',
    'orca-security', 'wiz', 'prisma-cloud', 'crowdstrike', 'sentinelone',
    // ── Healthcare & Life Sciences ─────────────────────────────────────────
    'cityblock', 'devoted-health', 'virta-health', 'noom', 'hims-hers',
    'cerebral', 'brightside', 'spring-health', 'lyra-health', 'modern-health',
    'ro', 'hims', 'keeps', 'forhims', 'nurx',
    'carbon-health', 'one-medical', 'forward', 'parsley-health', 'galileo',
    'flatiron-health', 'tempus', 'veracyte', 'guardant', 'exact-sciences',
    'natera', 'invitae', 'color', 'helix', 'ancestry',
    'doximity', 'zocdoc', 'healthgrades', 'vitals', 'webmd',
    'athenahealth', 'epic', 'cerner', 'meditech', 'allscripts',
    'veeva', 'iqvia', 'covance', 'labcorp', 'quest',
    'teladoc', 'amwell', 'mdlive', 'doctor-on-demand', '98point6',
    // ── Fintech & Financial Services ──────────────────────────────────────
    'stripe', 'plaid', 'marqeta', 'adyen', 'checkout',
    'chime', 'sofi', 'dave', 'current', 'varo',
    'robinhood', 'webull', 'public', 'moomoo', 'tastytrade',
    'betterment', 'wealthfront', 'acorns', 'stash', 'ellevest',
    'affirm', 'klarna', 'afterpay', 'sezzle', 'zip',
    'blend', 'better', 'loansnap', 'homepoint', 'pennymac',
    'opendoor', 'offerpad', 'knock', 'orchard', 'homeward',
    'coinbase', 'gemini', 'kraken', 'binance-us', 'ftx',
    'chainalysis', 'elliptic', 'cipher-trace', 'merkle-science', 'coinfirm',
    // ── E-commerce, Consumer & Retail ─────────────────────────────────────
    'faire', 'ankorstore', 'orderchamp', 'mable', 'abound',
    'glossier', 'allbirds', 'casper', 'away', 'warby-parker',
    'peloton', 'mirror', 'tonal', 'hydrow', 'tempo',
    'stitch-fix', 'trunk-club', 'mm-lafleur', 'eloquii', 'torrid',
    'thredUp', 'poshmark', 'mercari', 'depop', 'vestiaire',
    'doordash', 'instacart', 'gopuff', 'gorillas', 'getir',
    // ── Education & Workforce ─────────────────────────────────────────────
    'coursera', 'udemy', 'udacity', 'pluralsight', 'oreilly',
    'duolingo', 'babbel', 'busuu', 'pimsleur', 'rosetta-stone',
    'chegg', 'quizlet', 'khan-academy', 'brilliant', 'masterclass',
    'lambda-school', 'general-assembly', 'flatiron-school', 'springboard', 'thinkful',
    'handshake', 'riipen', 'forage', 'virtual-internships', 'parker-dewey',
    // ── Climate, Energy & Infrastructure ──────────────────────────────────
    'tesla', 'rivian', 'lucid', 'fisker', 'canoo',
    'sunrun', 'sunnova', 'sunpower', 'vivint-solar', 'momentum-solar',
    'enphase', 'solaredge', 'sma', 'fronius', 'huawei-solar',
    'nextera', 'orsted', 'avangrid', 'pattern-energy', 'invenergy',
    'bloom-energy', 'plug-power', 'ballard', 'fuelcell', 'ceres',
    'climeworks', 'carbon-engineering', 'heirloom', 'charm-industrial', 'verdox',
    // ── Logistics, Supply Chain & Manufacturing ────────────────────────────
    'flexport', 'freightos', 'forto', 'sennder', 'transfix',
    'project44', 'fourkites', 'macropoint', 'descartes', 'e2open',
    'nuvei', 'shipbob', 'shipmonk', 'deliverr', 'whiplash',
    '6river', 'locus-robotics', 'fetch-robotics', 'boston-dynamics', 'agility-robotics',
    // ── Media, Entertainment & Gaming ─────────────────────────────────────
    'spotify', 'soundcloud', 'bandcamp', 'distrokid', 'tunecore',
    'twitch', 'kick', 'rumble', 'odysee', 'youtube',
    'riot-games', 'epic-games', 'unity', 'roblox', 'niantic',
    'netflix', 'hulu', 'peacock', 'paramount', 'discovery',
    // ── Real Estate & PropTech ────────────────────────────────────────────
    'zillow', 'redfin', 'realtor', 'homes', 'trulia',
    'compass', 'side', 'exp-realty', 'real', 'fathom',
    'opendoor', 'offerpad', 'knock', 'homeward', 'orchard',
    'airbnb', 'vrbo', 'vacasa', 'evolve', 'turnkey',
    'wework', 'industrious', 'regus', 'knotel', 'convene',
    // ── Government & Public Sector Adjacent ───────────────────────────────
    'palantir', 'anduril', 'shield-ai', 'sievert', 'govini',
    'leidos', 'saic', 'booz-allen', 'mitre', 'rand',
    'deloitte-government', 'accenture-federal', 'ibm-federal', 'cgifederal', 'peraton',
  ];
}
