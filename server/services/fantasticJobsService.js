/**
 * Fantastic.jobs ATS Career Site Jobs Service
 *
 * Fetches jobs directly from employer career sites and ATS platforms
 * (Workday, iCIMS, Ashby, SmartRecruiters, SAP SuccessFactors, Oracle, Taleo,
 *  BambooHR, Rippling, Jobvite, and 30+ more) via the Fantastic.jobs API on RapidAPI.
 *
 * API docs: https://fantastic.jobs/api
 * RapidAPI host: fantastic-jobs.p.rapidapi.com
 *
 * Recommended usage: call fetchAndIngestJobs() on the same 30-min schedule as
 * the Greenhouse/Lever crawlers. The API refreshes hourly and discovers 95% of
 * new jobs within 3 hours of posting.
 */

import axios from 'axios';
import Job from '../models/Job.js';

const RAPIDAPI_HOST = 'fantastic-jobs.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;
const REQUEST_TIMEOUT = 30000; // 30 seconds — API can be slow on large result sets

// How many jobs to request per API call (max 100 per page)
const PAGE_SIZE = 100;

// How many pages to fetch per scheduler run (100 jobs × 10 pages = 1,000 jobs/run)
// At 30-min intervals this gives ~48,000 fresh jobs/day well within the 200K/month limit
const MAX_PAGES = 10;

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

// ─── Utility: detect remote/hybrid ──────────────────────────────────────────
function detectRemote(location = '', title = '', description = '') {
  const text = `${location} ${title} ${description}`.toLowerCase();
  const isRemote = /\bremote\b/.test(text);
  const isHybrid = /\bhybrid\b/.test(text);
  return { remote: isRemote && !isHybrid, hybrid: isHybrid };
}

// ─── Utility: normalize employment type ─────────────────────────────────────
function normalizeEmploymentType(type = '') {
  const t = (type || '').toLowerCase();
  if (t.includes('full')) return 'full-time';
  if (t.includes('part')) return 'part-time';
  if (t.includes('contract') || t.includes('freelance')) return 'contract';
  if (t.includes('intern')) return 'internship';
  if (t.includes('temp')) return 'temporary';
  return 'full-time';
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

// ─── Utility: parse salary from string ──────────────────────────────────────
function parseSalary(salaryStr = '') {
  if (!salaryStr) return { min: null, max: null, currency: 'USD', period: 'annual' };
  const nums = salaryStr.match(/[\d,]+/g);
  if (!nums || nums.length === 0) return { min: null, max: null, currency: 'USD', period: 'annual' };
  const values = nums.map(n => parseInt(n.replace(/,/g, ''), 10)).filter(n => !isNaN(n));
  const period = /hour/i.test(salaryStr) ? 'hourly' : 'annual';
  return {
    min: values[0] || null,
    max: values[1] || values[0] || null,
    currency: /£/.test(salaryStr) ? 'GBP' : /€/.test(salaryStr) ? 'EUR' : 'USD',
    period
  };
}

// ─── Normalize a Fantastic.jobs job record to our Job schema ─────────────────
function normalizeJob(job) {
  const title = job.title || '';
  const company = job.company?.name || job.company || '';
  const locationStr = job.location || '';
  const descriptionHtml = job.description_html || job.description || '';
  const descriptionText = stripHtml(descriptionHtml).substring(0, 5000);
  const { remote, hybrid } = detectRemote(locationStr, title, descriptionText);
  const keywords = extractKeywords(title, descriptionText);
  const salary = parseSalary(job.salary || '');

  // Fantastic.jobs provides the direct ATS apply URL — this is the key field
  const applyUrl = job.url || job.apply_url || job.job_url || '';
  const jobUrl = job.job_url || applyUrl;

  // Determine source sub-type from ATS platform field
  const atsSource = (job.ats || job.source || '').toLowerCase();
  let source = 'fantastic';
  if (atsSource.includes('workday')) source = 'workday';
  else if (atsSource.includes('icims')) source = 'icims';
  else if (atsSource.includes('ashby')) source = 'ashby';
  else if (atsSource.includes('smartrecruiters')) source = 'smartrecruiters';
  else if (atsSource.includes('bamboo')) source = 'bamboohr';
  else if (atsSource.includes('rippling')) source = 'rippling';
  else if (atsSource.includes('jobvite')) source = 'jobvite';
  else if (atsSource.includes('taleo')) source = 'taleo';
  else if (atsSource.includes('greenhouse')) source = 'greenhouse';
  else if (atsSource.includes('lever')) source = 'lever';

  // Use Fantastic.jobs' own job ID as externalId, prefixed with source to avoid collisions
  // with our own Greenhouse/Lever crawlers
  const externalId = `fantastic_${job.id || job.job_id || `${company}_${title}`.replace(/\s+/g, '_').toLowerCase()}`;

  let postedAt = null;
  if (job.date_posted || job.posted_at || job.created_at) {
    try { postedAt = new Date(job.date_posted || job.posted_at || job.created_at); } catch (_) {}
  }

  return {
    externalId,
    source,
    title,
    company,
    companySlug: company.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
    location: locationStr,
    locations: locationStr ? [locationStr] : [],
    remote,
    hybrid,
    department: job.department || '',
    employmentType: normalizeEmploymentType(job.employment_type || job.job_type || ''),
    salary,
    descriptionHtml,
    descriptionText,
    applyUrl,
    jobUrl,
    postedAt,
    lastSeenAt: new Date(),
    isActive: true,
    keywords,
    normalizedTitle: title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
  };
}

// ─── Fetch one page of jobs from Fantastic.jobs API ─────────────────────────
async function fetchPage(apiKey, page = 1) {
  const response = await axios.get(`${BASE_URL}/jobs`, {
    params: {
      page,
      limit: PAGE_SIZE,
      // Request only US jobs to keep volume manageable and relevant
      country: 'us',
      // Sort by newest first so we always get fresh postings
      sort: 'date_posted',
      order: 'desc'
    },
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    },
    timeout: REQUEST_TIMEOUT
  });
  return response.data;
}

// ─── Main ingestion function — call from crawler scheduler ───────────────────
export async function fetchAndIngestFantasticJobs() {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.log('[FantasticJobs] RAPIDAPI_KEY not set — skipping');
    return { newJobs: 0, updatedJobs: 0, errors: 0, skipped: true };
  }

  console.log('[FantasticJobs] Starting ingestion...');
  let newJobs = 0;
  let updatedJobs = 0;
  let errors = 0;
  let totalFetched = 0;

  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      let data;
      try {
        data = await fetchPage(apiKey, page);
      } catch (err) {
        console.error(`[FantasticJobs] Page ${page} fetch error:`, err.message);
        errors++;
        break;
      }

      const jobs = data?.jobs || data?.data || data?.results || [];
      if (!jobs.length) {
        console.log(`[FantasticJobs] No jobs on page ${page} — stopping`);
        break;
      }

      totalFetched += jobs.length;

      for (const rawJob of jobs) {
        try {
          const jobData = normalizeJob(rawJob);
          if (!jobData.applyUrl || !jobData.title || !jobData.company) continue;

          const existing = await Job.findOne({
            externalId: jobData.externalId,
            source: jobData.source
          });

          if (!existing) {
            await Job.create({ ...jobData, firstSeenAt: new Date() });
            newJobs++;
          } else {
            await Job.updateOne(
              { externalId: jobData.externalId, source: jobData.source },
              { $set: { lastSeenAt: new Date(), isActive: true, keywords: jobData.keywords } }
            );
            updatedJobs++;
          }
        } catch (err) {
          // Skip duplicate key errors silently; log others
          if (err.code !== 11000) {
            console.error('[FantasticJobs] Job upsert error:', err.message);
            errors++;
          }
        }
      }

      console.log(`[FantasticJobs] Page ${page}: ${jobs.length} fetched, ${newJobs} new so far`);

      // Respect rate limits — small delay between pages
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (err) {
    console.error('[FantasticJobs] Ingestion error:', err.message);
    errors++;
  }

  console.log(`[FantasticJobs] Complete: ${totalFetched} fetched, ${newJobs} new, ${updatedJobs} updated, ${errors} errors`);
  return { newJobs, updatedJobs, errors, totalFetched };
}
