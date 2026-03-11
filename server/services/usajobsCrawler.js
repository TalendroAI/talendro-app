/**
 * USAJobs Crawler
 *
 * USAJobs is the official federal government job board — free API with registration.
 * Covers all federal civilian positions across every agency and department.
 * The US federal government is one of the largest employers in the country.
 *
 * API docs:  https://developer.usajobs.gov/
 * Base URL:  https://data.usajobs.gov/api/search
 * Auth:      Requires free API key (register at https://developer.usajobs.gov/APIRequest/Index)
 * Env vars:  USAJOBS_API_KEY, USAJOBS_USER_AGENT (your email address)
 *
 * Strategy: Run broad searches across major occupational categories to ensure
 * comprehensive coverage of federal employment opportunities.
 */

import axios from 'axios';
import Job from '../models/Job.js';

const BASE_URL = 'https://data.usajobs.gov/api/search';
const REQUEST_TIMEOUT = 20000;

// Broad occupational series to search — covers the full federal workforce
const SEARCH_CATEGORIES = [
  // Professional & Administrative
  'information technology',
  'program analyst',
  'management analyst',
  'human resources',
  'financial management',
  'contracting',
  'logistics',
  'public affairs',
  'attorney',
  'paralegal',
  // Healthcare
  'nurse',
  'physician',
  'pharmacist',
  'medical officer',
  'health scientist',
  'social worker',
  'psychologist',
  'physical therapist',
  // Science & Engineering
  'engineer',
  'scientist',
  'biologist',
  'chemist',
  'physicist',
  'geologist',
  'environmental protection',
  'agriculture',
  // Law Enforcement & Security
  'law enforcement',
  'border patrol',
  'customs',
  'security',
  'intelligence',
  'investigator',
  // Trades & Technical
  'electrician',
  'plumber',
  'HVAC',
  'mechanic',
  'maintenance',
  'construction',
  // Administrative Support
  'administrative assistant',
  'secretary',
  'clerk',
  'budget analyst',
  'grants management',
];

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
  const isRemote = /\bremote\b|\btelework\b/.test(text);
  const isHybrid = /\bhybrid\b/.test(text);
  return { remote: isRemote && !isHybrid, hybrid: isHybrid };
}

// ─── Utility: extract keywords ───────────────────────────────────────────────
function extractKeywords(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
  const keywords = [
    'information technology', 'cybersecurity', 'data analysis', 'program management',
    'financial management', 'contracting', 'human resources', 'logistics', 'engineering',
    'healthcare', 'nursing', 'medical', 'legal', 'attorney', 'law enforcement',
    'intelligence', 'security', 'science', 'research', 'policy', 'communications',
    'remote', 'telework', 'hybrid'
  ];
  return keywords.filter(kw => text.includes(kw));
}

// ─── Normalize a USAJobs posting to our Job schema ───────────────────────────
function normalizeJob(posting) {
  const matched = posting.MatchedObjectDescriptor;
  if (!matched) return null;

  const title = matched.PositionTitle || '';
  const company = matched.OrganizationName || matched.DepartmentName || 'US Federal Government';
  const locationStr = matched.PositionLocationDisplay || '';
  const descriptionText = stripHtml(matched.UserArea?.Details?.JobSummary || '').substring(0, 5000);
  const { remote, hybrid } = detectRemote(locationStr, title, descriptionText);
  const keywords = extractKeywords(title, descriptionText);

  const applyUrl = matched.ApplyURI?.[0] || matched.PositionURI || '';
  const jobUrl = matched.PositionURI || applyUrl;

  const externalId = `usajobs_${matched.PositionID || matched.MatchedObjectId}`;

  let postedAt = null;
  if (matched.PublicationStartDate) {
    try { postedAt = new Date(matched.PublicationStartDate); } catch (_) {}
  }

  // Parse salary
  const salaryMin = matched.PositionRemuneration?.[0]?.MinimumRange
    ? parseFloat(matched.PositionRemuneration[0].MinimumRange)
    : null;
  const salaryMax = matched.PositionRemuneration?.[0]?.MaximumRange
    ? parseFloat(matched.PositionRemuneration[0].MaximumRange)
    : null;
  const salaryPeriod = matched.PositionRemuneration?.[0]?.RateIntervalCode === 'PA' ? 'annual' : 'hourly';

  return {
    externalId,
    source: 'usajobs',
    title,
    company,
    companySlug: company.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
    location: locationStr,
    locations: locationStr ? [locationStr] : [],
    remote,
    hybrid,
    department: matched.DepartmentName || '',
    employmentType: 'full-time', // most federal jobs are full-time
    salary: {
      min: salaryMin,
      max: salaryMax,
      currency: 'USD',
      period: salaryPeriod
    },
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

// ─── Main ingestion function ──────────────────────────────────────────────────
export async function fetchAndIngestUSAJobs() {
  const apiKey = process.env.USAJOBS_API_KEY;
  const userAgent = process.env.USAJOBS_USER_AGENT;

  if (!apiKey || !userAgent) {
    console.log('[USAJobs] USAJOBS_API_KEY or USAJOBS_USER_AGENT not set — skipping');
    return { newJobs: 0, updatedJobs: 0, errors: 0, skipped: true };
  }

  console.log(`[USAJobs] Starting ingestion for ${SEARCH_CATEGORIES.length} categories...`);

  let newJobs = 0;
  let updatedJobs = 0;
  let errors = 0;
  let totalFetched = 0;

  for (const keyword of SEARCH_CATEGORIES) {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          Keyword: keyword,
          CountrySubDivisionCode: 'US', // US only
          ResultsPerPage: 25,
          SortField: 'DatePosted',
          SortDirection: 'Descending',
          DatePosted: 1, // last 1 day
        },
        headers: {
          'Authorization-Key': apiKey,
          'User-Agent': userAgent,
          'Host': 'data.usajobs.gov'
        },
        timeout: REQUEST_TIMEOUT
      });

      const searchResult = response.data?.SearchResult;
      const items = searchResult?.SearchResultItems || [];
      totalFetched += items.length;

      for (const item of items) {
        try {
          const jobData = normalizeJob(item);
          if (!jobData || !jobData.applyUrl || !jobData.title) continue;

          const existing = await Job.findOne({ externalId: jobData.externalId, source: 'usajobs' });

          if (!existing) {
            await Job.create({ ...jobData, firstSeenAt: new Date() });
            newJobs++;
          } else {
            await Job.updateOne(
              { externalId: jobData.externalId, source: 'usajobs' },
              { $set: { lastSeenAt: new Date(), isActive: true, keywords: jobData.keywords } }
            );
            updatedJobs++;
          }
        } catch (err) {
          if (err.code !== 11000) {
            console.error('[USAJobs] Job upsert error:', err.message);
            errors++;
          }
        }
      }

      // Respect rate limits — USAJobs allows ~5 req/sec
      await new Promise(r => setTimeout(r, 300));

    } catch (err) {
      console.error(`[USAJobs] Category "${keyword}" error:`, err.message);
      errors++;
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`[USAJobs] Complete: ${totalFetched} fetched, ${newJobs} new, ${updatedJobs} updated, ${errors} errors`);
  return { newJobs, updatedJobs, errors, totalFetched };
}
