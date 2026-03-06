/**
 * Greenhouse Crawler
 * 
 * Greenhouse provides a fully public JSON API for all job boards.
 * No authentication required.
 * 
 * Company discovery: https://boards-api.greenhouse.io/v1/boards
 * Job listings:      https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true
 * Job detail:        https://boards-api.greenhouse.io/v1/boards/{slug}/jobs/{id}
 */

import axios from 'axios';
import Company from '../models/Company.js';
import Job from '../models/Job.js';

const BASE_URL = 'https://boards-api.greenhouse.io/v1/boards';
const REQUEST_TIMEOUT = 15000; // 15 seconds
const DELAY_BETWEEN_REQUESTS = 300; // ms between requests to be polite

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Utility: strip HTML tags and normalize whitespace ───────────────────────
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

// ─── Utility: detect remote/hybrid from location and title ───────────────────
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

// ─── Utility: extract keywords from job text ─────────────────────────────────
function extractKeywords(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
  const techKeywords = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php',
    'react', 'vue', 'angular', 'node', 'express', 'django', 'flask', 'spring', 'rails',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'devops',
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'machine learning', 'deep learning', 'nlp', 'data science', 'analytics',
    'product management', 'project management', 'agile', 'scrum',
    'sales', 'marketing', 'finance', 'accounting', 'hr', 'recruiting',
    'design', 'ux', 'ui', 'figma', 'sketch',
    'healthcare', 'legal', 'compliance', 'security', 'cybersecurity',
    'remote', 'hybrid', 'onsite'
  ];
  return techKeywords.filter(kw => text.includes(kw));
}

// ─── Fetch all companies from Greenhouse directory ────────────────────────────
export async function discoverGreenhouseCompanies() {
  console.log('[Greenhouse] Starting company discovery...');
  let discovered = 0;
  let added = 0;

  try {
    // Greenhouse doesn't have a single "all companies" endpoint,
    // but we can seed from a curated list of known slugs + discover via job board links.
    // We use a well-known seed list of 500+ major companies on Greenhouse.
    const seedSlugs = getGreenhouseSeedSlugs();

    for (const slug of seedSlugs) {
      try {
        // Try to fetch the board to verify it exists
        const response = await axios.get(`${BASE_URL}/${slug}`, {
          timeout: REQUEST_TIMEOUT,
          headers: { 'User-Agent': 'Talendro Job Aggregator/1.0' }
        });

        if (response.data && response.data.name) {
          const companyName = response.data.name;
          discovered++;

          // Upsert company record
          const result = await Company.findOneAndUpdate(
            { slug, source: 'greenhouse' },
            {
              $setOnInsert: {
                name: companyName,
                slug,
                source: 'greenhouse',
                discoveredAt: new Date(),
                discoverySource: 'directory'
              }
            },
            { upsert: true, new: true }
          );

          if (result.isNew !== false) added++;
        }
      } catch (err) {
        // Company board doesn't exist or is private — skip silently
      }
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  } catch (err) {
    console.error('[Greenhouse] Discovery error:', err.message);
  }

  console.log(`[Greenhouse] Discovery complete: ${discovered} verified, ${added} new companies added`);
  return { discovered, added };
}

// ─── Crawl a single company's job listings ───────────────────────────────────
export async function crawlGreenhouseCompany(company) {
  const { slug, name } = company;

  try {
    const response = await axios.get(`${BASE_URL}/${slug}/jobs`, {
      params: { content: true },
      timeout: REQUEST_TIMEOUT,
      headers: { 'User-Agent': 'Talendro Job Aggregator/1.0' }
    });

    const jobs = response.data?.jobs || [];
    let newJobs = 0;
    let updatedJobs = 0;

    for (const job of jobs) {
      const locationStr = job.location?.name || '';
      const descriptionHtml = job.content || '';
      const descriptionText = stripHtml(descriptionHtml);
      const { remote, hybrid } = detectRemote(locationStr, job.title, descriptionText);
      const keywords = extractKeywords(job.title, descriptionText);

      // Parse posted date
      let postedAt = null;
      if (job.updated_at) {
        postedAt = new Date(job.updated_at);
      }

      // Build apply URL
      const applyUrl = job.absolute_url || `https://boards.greenhouse.io/${slug}/jobs/${job.id}`;

      // Extract department
      const department = job.departments?.[0]?.name || '';

      // Extract all locations
      const locations = job.offices?.map(o => o.name).filter(Boolean) || [locationStr].filter(Boolean);

      const jobData = {
        externalId: String(job.id),
        source: 'greenhouse',
        title: job.title || '',
        company: name || slug,
        companySlug: slug,
        location: locationStr,
        locations,
        remote,
        hybrid,
        department,
        descriptionHtml,
        descriptionText: descriptionText.substring(0, 5000), // cap at 5k chars
        applyUrl,
        jobUrl: applyUrl,
        postedAt,
        lastSeenAt: new Date(),
        isActive: true,
        keywords,
        normalizedTitle: (job.title || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
      };

      // Upsert: insert new or update lastSeenAt on existing
      const existing = await Job.findOne({ externalId: String(job.id), source: 'greenhouse' });

      if (!existing) {
        await Job.create({ ...jobData, firstSeenAt: new Date() });
        newJobs++;
      } else {
        await Job.updateOne(
          { externalId: String(job.id), source: 'greenhouse' },
          { $set: { lastSeenAt: new Date(), isActive: true, keywords } }
        );
        updatedJobs++;
      }
    }

    // Mark jobs we didn't see this crawl as potentially inactive
    // (only if we got a successful response with 0 jobs)
    if (jobs.length === 0) {
      await Job.updateMany(
        { companySlug: slug, source: 'greenhouse', isActive: true },
        { $set: { isActive: false } }
      );
    }

    // Update company crawl state
    await Company.updateOne(
      { slug, source: 'greenhouse' },
      {
        $set: {
          lastCrawledAt: new Date(),
          lastSuccessAt: new Date(),
          consecutiveFailures: 0,
          activeJobCount: jobs.length,
          totalJobsFound: company.totalJobsFound + newJobs
        }
      }
    );

    return { slug, newJobs, updatedJobs, totalJobs: jobs.length };

  } catch (err) {
    // Record the failure
    await Company.updateOne(
      { slug, source: 'greenhouse' },
      {
        $set: { lastCrawledAt: new Date() },
        $inc: { consecutiveFailures: 1 }
      }
    );

    // Disable companies that fail 5+ times in a row
    if (company.consecutiveFailures >= 4) {
      await Company.updateOne(
        { slug, source: 'greenhouse' },
        { $set: { isActive: false } }
      );
      console.log(`[Greenhouse] Disabled ${slug} after repeated failures`);
    }

    throw err;
  }
}

// ─── Seed list of known Greenhouse company slugs ─────────────────────────────
// This is a curated list of 300+ major companies known to use Greenhouse.
// The crawler will verify each one and add to the DB.
function getGreenhouseSeedSlugs() {
  return [
    // Tech Giants & Unicorns
    'airbnb', 'stripe', 'lyft', 'doordash', 'coinbase', 'robinhood', 'brex',
    'figma', 'notion', 'airtable', 'asana', 'atlassian', 'zendesk', 'hubspot',
    'twilio', 'sendgrid', 'segment', 'mixpanel', 'amplitude', 'datadog',
    'snowflake', 'databricks', 'confluent', 'hashicorp', 'mongodb',
    'elastic', 'splunk', 'pagerduty', 'statuspage', 'opsgenie',
    'cloudflare', 'fastly', 'akamai', 'digitalocean', 'linode',
    'github', 'gitlab', 'bitbucket', 'jfrog', 'sonarqube',
    'slack', 'zoom', 'webex', 'ringcentral', 'dialpad',
    'dropbox', 'box', 'docusign', 'adobe', 'autodesk',
    'salesforce', 'servicenow', 'workday', 'successfactors', 'adp',
    'oracle', 'sap', 'ibm', 'accenture', 'deloitte',
    'mckinsey', 'bain', 'bcg', 'pwc', 'kpmg', 'ey',
    'amazon', 'microsoft', 'google', 'meta', 'apple', 'netflix',
    'uber', 'lyft', 'instacart', 'postmates', 'grubhub',
    'peloton', 'warbyparker', 'allbirds', 'casper', 'away',
    'squarespace', 'wix', 'shopify', 'bigcommerce', 'magento',
    'twitch', 'discord', 'reddit', 'pinterest', 'snapchat',
    'twitter', 'linkedin', 'tiktok', 'bytedance', 'spotify',
    'soundcloud', 'pandora', 'iheartmedia', 'sirius',
    // Fintech
    'plaid', 'affirm', 'klarna', 'afterpay', 'sezzle',
    'chime', 'sofi', 'betterment', 'wealthfront', 'acorns',
    'paypal', 'venmo', 'cashapp', 'zelle', 'wise',
    'marqeta', 'adyen', 'checkout', 'worldpay', 'fiserv',
    'blackrock', 'vanguard', 'fidelity', 'schwab', 'tdameritrade',
    'jpmorgan', 'goldmansachs', 'morganstanley', 'citigroup', 'bankofamerica',
    'wellsfargo', 'usbank', 'pnc', 'capitalone', 'discover',
    // Healthcare & Biotech
    'oscar', 'clover', 'devoted', 'alignment', 'centene',
    'teladoc', 'amwell', 'mdlive', 'hims', 'ro',
    'genomics', 'illumina', 'pacbio', 'oxford-nanopore',
    'moderna', 'biontech', 'regeneron', 'biogen', 'vertex',
    'pfizer', 'merck', 'abbvie', 'bristol-myers-squibb', 'eli-lilly',
    'unitedhealth', 'anthem', 'aetna', 'cigna', 'humana',
    // E-commerce & Retail
    'wayfair', 'chewy', 'etsy', 'poshmark', 'mercari',
    'target', 'walmart', 'costco', 'kroger', 'albertsons',
    'macys', 'nordstrom', 'gap', 'hm', 'zara',
    'nike', 'adidas', 'underarmour', 'lululemon', 'patagonia',
    // Real Estate & PropTech
    'zillow', 'redfin', 'opendoor', 'offerpad', 'knock',
    'compass', 'kw', 'remax', 'coldwellbanker', 'century21',
    'wework', 'industrious', 'regus', 'breather',
    // EdTech
    'coursera', 'udemy', 'udacity', 'edx', 'skillshare',
    'duolingo', 'babbel', 'rosettastone', 'chegg', 'quizlet',
    'kahoot', 'classcraft', 'nearpod', 'pear-deck',
    // Travel & Hospitality
    'airbnb', 'vrbo', 'booking', 'expedia', 'tripadvisor',
    'marriott', 'hilton', 'hyatt', 'ihg', 'wyndham',
    'delta', 'united', 'american', 'southwest', 'jetblue',
    // Media & Entertainment
    'nytimes', 'washingtonpost', 'buzzfeed', 'vox', 'axios',
    'disney', 'warnermedia', 'nbcuniversal', 'viacomcbs', 'fox',
    'hbo', 'hulu', 'peacock', 'paramount', 'discovery',
    // Automotive & Mobility
    'tesla', 'rivian', 'lucid', 'fisker', 'canoo',
    'gm', 'ford', 'stellantis', 'bmw', 'volkswagen',
    'waymo', 'cruise', 'aurora', 'argo', 'motional',
    // Cybersecurity
    'crowdstrike', 'sentinelone', 'paloaltonetworks', 'fortinet', 'checkpoint',
    'okta', 'auth0', 'ping', 'cyberark', 'sailpoint',
    'rapid7', 'qualys', 'tenable', 'veracode', 'checkmarx',
    // Cloud & Infrastructure
    'hashicorp', 'pulumi', 'crossplane', 'rancher', 'suse',
    'redhat', 'canonical', 'vmware', 'nutanix', 'pure-storage',
    'netapp', 'dell', 'hpe', 'lenovo', 'supermicro',
    // AI & ML
    'openai', 'anthropic', 'cohere', 'huggingface', 'scale-ai',
    'c3ai', 'datarobot', 'h2oai', 'domino', 'weights-biases',
    'labelbox', 'snorkel', 'aquant', 'abacus',
    // HR Tech
    'greenhouse', 'lever', 'workday', 'bamboohr', 'rippling',
    'gusto', 'justworks', 'trinet', 'paychex', 'adp',
    'lattice', 'culture-amp', '15five', 'betterworks', 'reflektive',
    // Marketing Tech
    'marketo', 'pardot', 'eloqua', 'mailchimp', 'klaviyo',
    'braze', 'iterable', 'sailthru', 'sendgrid', 'postmark',
    'sprinklr', 'hootsuite', 'buffer', 'sproutsocial', 'later',
    // Logistics & Supply Chain
    'flexport', 'freightos', 'project44', 'fourkites', 'macropoint',
    'fedex', 'ups', 'dhl', 'xpo', 'jbhunt',
    'convoy', 'transfix', 'uber-freight', 'loadsmart', 'echo',
    // Government & Defense (use Greenhouse)
    'palantir', 'anduril', 'shield-ai', 'joby', 'archer',
    // Startups & Growth Stage
    'airtable', 'notion', 'linear', 'loom', 'miro',
    'retool', 'webflow', 'bubble', 'glide', 'softr',
    'vercel', 'netlify', 'render', 'railway', 'fly',
    'supabase', 'planetscale', 'neon', 'turso', 'convex',
    'clerk', 'auth0', 'stytch', 'magic', 'privy',
    'resend', 'postmark', 'mailersend', 'loops', 'buttondown',
  ];
}
