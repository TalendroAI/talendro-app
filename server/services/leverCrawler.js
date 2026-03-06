/**
 * Lever Crawler
 * 
 * Lever provides a fully public JSON API for all job postings.
 * No authentication required.
 * 
 * Job listings: https://api.lever.co/v0/postings/{company}?mode=json
 * Job detail:   https://api.lever.co/v0/postings/{company}/{id}
 * 
 * The `createdAt` field in Lever's API is a Unix timestamp in milliseconds
 * and is the actual creation time — not refreshed on repost.
 */

import axios from 'axios';
import Company from '../models/Company.js';
import Job from '../models/Job.js';

const BASE_URL = 'https://api.lever.co/v0/postings';
const REQUEST_TIMEOUT = 15000;
const DELAY_BETWEEN_REQUESTS = 300;

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
function normalizeCommitment(commitment = '') {
  const c = commitment.toLowerCase();
  if (c.includes('full')) return 'full-time';
  if (c.includes('part')) return 'part-time';
  if (c.includes('contract') || c.includes('freelance')) return 'contract';
  if (c.includes('intern')) return 'internship';
  if (c.includes('temp')) return 'temporary';
  return commitment || 'full-time';
}

// ─── Utility: extract keywords ───────────────────────────────────────────────
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

// ─── Discover Lever companies ─────────────────────────────────────────────────
export async function discoverLeverCompanies() {
  console.log('[Lever] Starting company discovery...');
  let discovered = 0;
  let added = 0;

  const seedSlugs = getLeverSeedSlugs();

  for (const slug of seedSlugs) {
    try {
      // Verify the board exists by fetching with limit=1
      const response = await axios.get(`${BASE_URL}/${slug}`, {
        params: { mode: 'json', limit: 1 },
        timeout: REQUEST_TIMEOUT,
        headers: { 'User-Agent': 'Talendro Job Aggregator/1.0' }
      });

      if (Array.isArray(response.data)) {
        discovered++;

        // Try to get company name from first posting
        const companyName = response.data[0]?.company || slug;

        await Company.findOneAndUpdate(
          { slug, source: 'lever' },
          {
            $setOnInsert: {
              name: companyName,
              slug,
              source: 'lever',
              discoveredAt: new Date(),
              discoverySource: 'directory'
            }
          },
          { upsert: true, new: true }
        );

        added++;
      }
    } catch (err) {
      // Board doesn't exist — skip
    }
    await sleep(DELAY_BETWEEN_REQUESTS);
  }

  console.log(`[Lever] Discovery complete: ${discovered} verified, ${added} new companies added`);
  return { discovered, added };
}

// ─── Crawl a single Lever company ────────────────────────────────────────────
export async function crawlLeverCompany(company) {
  const { slug, name } = company;

  try {
    const response = await axios.get(`${BASE_URL}/${slug}`, {
      params: { mode: 'json', limit: 250 },
      timeout: REQUEST_TIMEOUT,
      headers: { 'User-Agent': 'Talendro Job Aggregator/1.0' }
    });

    const postings = Array.isArray(response.data) ? response.data : [];
    let newJobs = 0;
    let updatedJobs = 0;

    for (const posting of postings) {
      // Build description from Lever's structured content
      const descriptionHtml = [
        posting.descriptionPlain || posting.description || '',
        ...(posting.lists || []).map(l => `<h3>${l.text}</h3><ul>${(l.content || '').split('●').filter(Boolean).map(i => `<li>${i.trim()}</li>`).join('')}</ul>`),
        posting.additionalPlain || posting.additional || ''
      ].join('\n');

      const descriptionText = stripHtml(descriptionHtml);
      const locationStr = posting.categories?.location || posting.workplaceType || '';
      const { remote, hybrid } = detectRemote(locationStr, posting.text, descriptionText);
      const keywords = extractKeywords(posting.text, descriptionText);

      // Lever's createdAt is milliseconds since epoch — this is the REAL post date
      const postedAt = posting.createdAt ? new Date(posting.createdAt) : null;

      const applyUrl = posting.applyUrl || `https://jobs.lever.co/${slug}/${posting.id}`;
      const jobUrl = `https://jobs.lever.co/${slug}/${posting.id}`;

      const jobData = {
        externalId: posting.id,
        source: 'lever',
        title: posting.text || '',
        company: name || posting.company || slug,
        companySlug: slug,
        location: locationStr,
        locations: locationStr ? [locationStr] : [],
        remote,
        hybrid,
        department: posting.categories?.department || posting.categories?.team || '',
        team: posting.categories?.team || '',
        employmentType: normalizeCommitment(posting.categories?.commitment || ''),
        descriptionHtml,
        descriptionText: descriptionText.substring(0, 5000),
        applyUrl,
        jobUrl,
        postedAt,
        lastSeenAt: new Date(),
        isActive: true,
        keywords,
        normalizedTitle: (posting.text || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
      };

      const existing = await Job.findOne({ externalId: posting.id, source: 'lever' });

      if (!existing) {
        await Job.create({ ...jobData, firstSeenAt: new Date() });
        newJobs++;
      } else {
        await Job.updateOne(
          { externalId: posting.id, source: 'lever' },
          { $set: { lastSeenAt: new Date(), isActive: true, keywords } }
        );
        updatedJobs++;
      }
    }

    if (postings.length === 0) {
      await Job.updateMany(
        { companySlug: slug, source: 'lever', isActive: true },
        { $set: { isActive: false } }
      );
    }

    await Company.updateOne(
      { slug, source: 'lever' },
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
      { slug, source: 'lever' },
      {
        $set: { lastCrawledAt: new Date() },
        $inc: { consecutiveFailures: 1 }
      }
    );

    if ((company.consecutiveFailures || 0) >= 4) {
      await Company.updateOne(
        { slug, source: 'lever' },
        { $set: { isActive: false } }
      );
      console.log(`[Lever] Disabled ${slug} after repeated failures`);
    }

    throw err;
  }
}

// ─── Seed list of known Lever company slugs ───────────────────────────────────
function getLeverSeedSlugs() {
  return [
    // Tech
    'vercel', 'supabase', 'planetscale', 'railway', 'render',
    'linear', 'loom', 'miro', 'retool', 'webflow',
    'figma', 'framer', 'sketch', 'invision', 'zeplin',
    'intercom', 'drift', 'freshdesk', 'zendesk', 'helpscout',
    'segment', 'rudderstack', 'heap', 'fullstory', 'hotjar',
    'sentry', 'rollbar', 'bugsnag', 'logrocket', 'datadog',
    'newrelic', 'dynatrace', 'appdynamics', 'instana', 'lightstep',
    'launchdarkly', 'split', 'optimizely', 'vwo', 'ab-tasty',
    'contentful', 'sanity', 'storyblok', 'prismic', 'dato',
    'algolia', 'elasticsearch', 'typesense', 'meilisearch',
    'auth0', 'okta', 'onelogin', 'jumpcloud', 'duo',
    'hashicorp', 'pulumi', 'ansible', 'chef', 'puppet',
    'grafana', 'prometheus', 'influxdata', 'timescale',
    'confluent', 'redpanda', 'materialize', 'rockset',
    'dbt', 'fivetran', 'airbyte', 'stitch', 'matillion',
    'looker', 'mode', 'metabase', 'redash', 'superset',
    'hex', 'deepnote', 'observable', 'evidence',
    // Fintech
    'mercury', 'ramp', 'brex', 'divvy', 'expensify',
    'gusto', 'rippling', 'deel', 'remote', 'papaya',
    'carta', 'angellist', 'equityzen', 'forge', 'nasdaq-private',
    'plaid', 'yodlee', 'finicity', 'mx', 'akoya',
    'stripe', 'adyen', 'checkout', 'braintree', 'recurly',
    // Healthcare
    'hims', 'ro', 'done', 'cerebral', 'brightside',
    'carbon-health', 'one-medical', 'forward', 'iora', 'oak-street',
    'nuvation', 'tempus', 'flatiron', 'veracyte', 'guardant',
    // E-commerce & Consumer
    'glossier', 'allbirds', 'warby-parker', 'casper', 'tuft-needle',
    'peloton', 'mirror', 'tonal', 'hydrow', 'echelon',
    'stitch-fix', 'trunk-club', 'rent-the-runway', 'le-tote',
    'faire', 'handshake', 'angi', 'thumbtack', 'taskrabbit',
    // Real Estate
    'opendoor', 'offerpad', 'knock', 'orchard', 'homeward',
    'compass', 'side', 'real', 'exp', 'fathom',
    'lofty', 'follow-up-boss', 'kvcore', 'boomtown', 'sierra',
    // Media & Content
    'substack', 'ghost', 'medium', 'wordpress', 'squarespace',
    'canva', 'adobe', 'shutterstock', 'getty', 'unsplash',
    'buzzfeed', 'vox', 'axios', 'the-information', 'morning-brew',
    // Logistics
    'flexport', 'shipbob', 'shipmonk', 'whiplash', 'deliverr',
    'project44', 'fourkites', 'macropoint', 'samsara', 'motive',
    // HR & Recruiting
    'lever', 'greenhouse', 'workable', 'breezy', 'recruitee',
    'lattice', 'culture-amp', '15five', 'betterworks', 'leapsome',
    'bonusly', 'kazoo', 'workhuman', 'o.c.-tanner',
    // Security
    'lacework', 'orca', 'wiz', 'prisma', 'aqua',
    'snyk', 'veracode', 'checkmarx', 'sonarqube', 'semgrep',
    'drata', 'vanta', 'secureframe', 'tugboat-logic', 'hyperproof',
    // AI/ML Startups
    'cohere', 'ai21', 'aleph-alpha', 'mistral', 'together',
    'replicate', 'banana', 'modal', 'beam', 'runpod',
    'labelbox', 'scale', 'appen', 'defined', 'surge',
    // Climate & Energy
    'climateai', 'pachama', 'terrawatch', 'watershed', 'patch',
    'arcadia', 'octopus-energy', 'stem', 'fluence', 'powin',
    'rivian', 'lucid', 'fisker', 'canoo', 'arrival',
    // Government & Defense
    'anduril', 'palantir', 'shield-ai', 'primer', 'sievert',
    // Misc Growth Stage
    'notion', 'coda', 'roam', 'obsidian', 'craft',
    'superhuman', 'hey', 'front', 'missive', 'spark',
    'cal', 'calendly', 'doodle', 'when2meet', 'lettucemeet',
    'luma', 'eventbrite', 'hopin', 'airmeet', 'run-the-world',
  ];
}
