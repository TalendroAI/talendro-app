/**
 * JSearch Service — Google for Jobs via RapidAPI
 *
 * JSearch pulls from Google's job index which aggregates LinkedIn, Indeed,
 * Glassdoor, ZipRecruiter, and thousands of company career sites. It covers
 * postings that don't appear on any single ATS platform — particularly
 * smaller companies, government roles, and non-tech sectors.
 *
 * API docs: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 * RapidAPI host: jsearch.p.rapidapi.com
 *
 * Strategy: Run targeted searches for each of the subscriber's target job titles
 * rather than a generic crawl. This keeps request volume low and relevance high.
 * Called from the crawler scheduler alongside Greenhouse/Lever/Fantastic.
 */

import axios from 'axios';
import Job from '../models/Job.js';

const RAPIDAPI_HOST = 'jsearch.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;
const REQUEST_TIMEOUT = 20000;

// Search queries to run on each scheduler cycle.
// Covers the full breadth of the US workforce — not just white-collar tech.
// Rotated across scheduler cycles to stay within RapidAPI rate limits.
const DEFAULT_SEARCH_QUERIES = [
  // ── Technology & Engineering ─────────────────────────────────────────────
  'software engineer',
  'product manager',
  'data scientist',
  'DevOps engineer',
  'cybersecurity analyst',
  'cloud architect',
  'machine learning engineer',
  'QA engineer',
  'IT support specialist',
  'network engineer',
  'database administrator',
  'UX designer',
  'web developer',
  'mobile developer',
  'systems administrator',
  // ── Business, Finance & Operations ──────────────────────────────────────
  'financial analyst',
  'accountant',
  'operations manager',
  'project manager',
  'business analyst',
  'supply chain manager',
  'logistics coordinator',
  'procurement specialist',
  'compliance officer',
  'risk analyst',
  'controller',
  'CFO',
  'COO',
  // ── Sales, Marketing & Customer Success ─────────────────────────────────
  'sales manager',
  'account executive',
  'sales representative',
  'marketing manager',
  'digital marketing specialist',
  'content manager',
  'social media manager',
  'customer success manager',
  'customer service representative',
  'inside sales',
  'business development manager',
  // ── Healthcare & Life Sciences ───────────────────────────────────────────
  'registered nurse',
  'nurse practitioner',
  'physician assistant',
  'medical assistant',
  'physical therapist',
  'occupational therapist',
  'radiologic technologist',
  'pharmacy technician',
  'healthcare administrator',
  'clinical research coordinator',
  'medical coder',
  'home health aide',
  'dental hygienist',
  // ── Education & Social Services ──────────────────────────────────────────
  'teacher',
  'school counselor',
  'instructional designer',
  'social worker',
  'case manager',
  'childcare worker',
  'special education teacher',
  'curriculum developer',
  // ── Skilled Trades & Technical ───────────────────────────────────────────
  'electrician',
  'HVAC technician',
  'plumber',
  'welder',
  'automotive technician',
  'maintenance technician',
  'construction project manager',
  'civil engineer',
  'mechanical engineer',
  'electrical engineer',
  'quality control inspector',
  'manufacturing engineer',
  'CNC machinist',
  // ── Government, Legal & Nonprofit ───────────────────────────────────────
  'government analyst',
  'paralegal',
  'attorney',
  'policy analyst',
  'grant writer',
  'program coordinator nonprofit',
  'public health analyst',
  // ── Logistics, Warehouse & Transportation ───────────────────────────────
  'warehouse manager',
  'logistics manager',
  'fleet manager',
  'dispatcher',
  'inventory specialist',
  // ── Human Resources & Recruiting ─────────────────────────────────────────
  'human resources manager',
  'recruiter',
  'talent acquisition specialist',
  'HR business partner',
  'compensation analyst',
  'training and development manager',
  // ── Executive & Leadership ───────────────────────────────────────────────
  'CEO',
  'VP of Engineering',
  'VP of Sales',
  'VP of Marketing',
  'VP of Operations',
  'Chief Marketing Officer',
  'Chief Technology Officer',
  'Chief Human Resources Officer',
  'General Manager',
  'Director of Finance',
  'Director of Operations',
];

// Results per query (max 10 per JSearch page)
const RESULTS_PER_QUERY = 10;

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
  if (t.includes('full') || t === 'fulltime') return 'full-time';
  if (t.includes('part') || t === 'parttime') return 'part-time';
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

// ─── Utility: parse salary from JSearch salary object ───────────────────────
function parseSalary(job) {
  const min = job.job_min_salary || null;
  const max = job.job_max_salary || null;
  const period = job.job_salary_period === 'HOUR' ? 'hourly' : 'annual';
  const currency = job.job_salary_currency || 'USD';
  return { min, max, currency, period };
}

// ─── Normalize a JSearch job record to our Job schema ───────────────────────
function normalizeJob(job) {
  const title = job.job_title || '';
  const company = job.employer_name || '';
  const locationStr = [job.job_city, job.job_state, job.job_country]
    .filter(Boolean).join(', ');
  const descriptionText = (job.job_description || '').substring(0, 5000);
  const { remote, hybrid } = detectRemote(locationStr, title, descriptionText);
  const keywords = extractKeywords(title, descriptionText);
  const salary = parseSalary(job);

  // JSearch provides the direct apply link (often the employer's ATS URL)
  const applyUrl = job.job_apply_link || job.job_url || '';
  const jobUrl = job.job_url || applyUrl;

  // Use JSearch's job_id as externalId
  const externalId = `jsearch_${job.job_id || `${company}_${title}`.replace(/\s+/g, '_').toLowerCase()}`;

  let postedAt = null;
  if (job.job_posted_at_timestamp) {
    try { postedAt = new Date(job.job_posted_at_timestamp * 1000); } catch (_) {}
  } else if (job.job_posted_at_datetime_utc) {
    try { postedAt = new Date(job.job_posted_at_datetime_utc); } catch (_) {}
  }

  return {
    externalId,
    source: 'jsearch',
    title,
    company,
    companySlug: company.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
    location: locationStr,
    locations: locationStr ? [locationStr] : [],
    remote: job.job_is_remote || remote,
    hybrid,
    department: '',
    employmentType: normalizeEmploymentType(job.job_employment_type || ''),
    salary,
    descriptionHtml: '',
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

// ─── Fetch jobs for a single search query ───────────────────────────────────
async function searchQuery(apiKey, query, page = 1) {
  const response = await axios.get(`${BASE_URL}/search`, {
    params: {
      query: `${query} United States`,
      page,
      num_pages: 1,
      date_posted: 'today', // Only fresh postings
      country: 'us',
      language: 'en'
    },
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    },
    timeout: REQUEST_TIMEOUT
  });
  return response.data?.data || [];
}

// ─── Main ingestion function — call from crawler scheduler ───────────────────
export async function fetchAndIngestJSearchJobs(customQueries = null) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.log('[JSearch] RAPIDAPI_KEY not set — skipping');
    return { newJobs: 0, updatedJobs: 0, errors: 0, skipped: true };
  }

  const queries = customQueries || DEFAULT_SEARCH_QUERIES;
  console.log(`[JSearch] Starting ingestion for ${queries.length} queries...`);

  let newJobs = 0;
  let updatedJobs = 0;
  let errors = 0;
  let totalFetched = 0;

  for (const query of queries) {
    try {
      const jobs = await searchQuery(apiKey, query);
      totalFetched += jobs.length;

      for (const rawJob of jobs) {
        try {
          const jobData = normalizeJob(rawJob);
          if (!jobData.applyUrl || !jobData.title || !jobData.company) continue;

          const existing = await Job.findOne({
            externalId: jobData.externalId,
            source: 'jsearch'
          });

          if (!existing) {
            await Job.create({ ...jobData, firstSeenAt: new Date() });
            newJobs++;
          } else {
            await Job.updateOne(
              { externalId: jobData.externalId, source: 'jsearch' },
              { $set: { lastSeenAt: new Date(), isActive: true, keywords: jobData.keywords } }
            );
            updatedJobs++;
          }
        } catch (err) {
          if (err.code !== 11000) {
            console.error('[JSearch] Job upsert error:', err.message);
            errors++;
          }
        }
      }

      // Respect rate limits — 5 req/sec on Pro plan
      await new Promise(r => setTimeout(r, 250));

    } catch (err) {
      console.error(`[JSearch] Query "${query}" error:`, err.message);
      errors++;
      // Continue with next query rather than aborting
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`[JSearch] Complete: ${totalFetched} fetched, ${newJobs} new, ${updatedJobs} updated, ${errors} errors`);
  return { newJobs, updatedJobs, errors, totalFetched };
}
