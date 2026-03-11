/**
 * SmartRecruiters ATS Crawler
 *
 * SmartRecruiters provides a fully public REST API for job listings.
 * No authentication required.
 *
 * Company jobs:  GET https://api.smartrecruiters.com/v1/companies/{slug}/postings
 * Job detail:    GET https://api.smartrecruiters.com/v1/companies/{slug}/postings/{id}
 *
 * SmartRecruiters is used by large enterprises and Fortune 500 companies
 * across all sectors — retail, manufacturing, logistics, healthcare, finance.
 * It covers a very different employer profile than Greenhouse/Lever (which skew startup).
 */

import axios from 'axios';
import Company from '../models/Company.js';
import Job from '../models/Job.js';

const BASE_URL = 'https://api.smartrecruiters.com/v1/companies';
const REQUEST_TIMEOUT = 15000;
const DELAY_BETWEEN_REQUESTS = 400; // ms — SmartRecruiters rate limits are strict

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
  const t = (type || '').toLowerCase();
  if (t.includes('full') || t === 'permanent') return 'full-time';
  if (t.includes('part')) return 'part-time';
  if (t.includes('contract') || t.includes('freelance') || t === 'temporary') return 'contract';
  if (t.includes('intern')) return 'internship';
  return 'full-time';
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

// ─── Discover SmartRecruiters companies from seed list ───────────────────────
export async function discoverSmartRecruitersCompanies() {
  console.log('[SmartRecruiters] Starting company discovery...');
  let discovered = 0;
  let added = 0;

  const seedSlugs = getSmartRecruitersSeedSlugs();

  for (const slug of seedSlugs) {
    try {
      const response = await axios.get(`${BASE_URL}/${slug}/postings`, {
        params: { limit: 1 },
        timeout: REQUEST_TIMEOUT,
        headers: { 'User-Agent': 'Talendro Job Aggregator/1.0' }
      });

      if (response.status === 200) {
        discovered++;

        await Company.findOneAndUpdate(
          { slug, source: 'smartrecruiters' },
          {
            $setOnInsert: {
              name: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              slug,
              source: 'smartrecruiters',
              discoveredAt: new Date(),
              discoverySource: 'seed'
            }
          },
          { upsert: true, new: true }
        );
        added++;
      }
    } catch (err) {
      // Company not on SmartRecruiters or board is private — skip
    }
    await sleep(DELAY_BETWEEN_REQUESTS);
  }

  console.log(`[SmartRecruiters] Discovery complete: ${discovered} verified, ${added} companies added`);
  return { discovered, added };
}

// ─── Crawl a single SmartRecruiters company's job listings ───────────────────
export async function crawlSmartRecruitersCompany(company) {
  const { slug, name } = company;

  try {
    // Fetch all postings (paginated, max 100 per page)
    let allPostings = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const response = await axios.get(`${BASE_URL}/${slug}/postings`, {
        params: { limit, offset, status: 'PUBLIC' },
        timeout: REQUEST_TIMEOUT,
        headers: { 'User-Agent': 'Talendro Job Aggregator/1.0' }
      });

      const postings = response.data?.content || [];
      allPostings = allPostings.concat(postings);

      if (postings.length < limit) break; // no more pages
      offset += limit;
      await sleep(200);
    }

    let newJobs = 0;
    let updatedJobs = 0;

    for (const posting of allPostings) {
      const locationStr = [
        posting.location?.city,
        posting.location?.region,
        posting.location?.country
      ].filter(Boolean).join(', ');

      const descriptionHtml = posting.jobAd?.sections?.jobDescription?.text || '';
      const descriptionText = stripHtml(descriptionHtml);
      const { remote, hybrid } = detectRemote(locationStr, posting.name, descriptionText);
      const keywords = extractKeywords(posting.name, descriptionText);

      const applyUrl = `https://jobs.smartrecruiters.com/${slug}/${posting.id}`;

      let postedAt = null;
      if (posting.releasedDate) {
        try { postedAt = new Date(posting.releasedDate); } catch (_) {}
      }

      const jobData = {
        externalId: `sr_${posting.id}`,
        source: 'smartrecruiters',
        title: posting.name || '',
        company: name || slug,
        companySlug: slug,
        location: locationStr,
        locations: locationStr ? [locationStr] : [],
        remote,
        hybrid,
        department: posting.department?.label || '',
        employmentType: normalizeEmploymentType(posting.typeOfEmployment?.label || ''),
        descriptionHtml,
        descriptionText: descriptionText.substring(0, 5000),
        applyUrl,
        jobUrl: applyUrl,
        postedAt,
        lastSeenAt: new Date(),
        isActive: true,
        keywords,
        normalizedTitle: (posting.name || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
      };

      const existing = await Job.findOne({ externalId: jobData.externalId, source: 'smartrecruiters' });

      if (!existing) {
        await Job.create({ ...jobData, firstSeenAt: new Date() });
        newJobs++;
      } else {
        await Job.updateOne(
          { externalId: jobData.externalId, source: 'smartrecruiters' },
          { $set: { lastSeenAt: new Date(), isActive: true, keywords } }
        );
        updatedJobs++;
      }
    }

    if (allPostings.length === 0) {
      await Job.updateMany(
        { companySlug: slug, source: 'smartrecruiters', isActive: true },
        { $set: { isActive: false } }
      );
    }

    await Company.updateOne(
      { slug, source: 'smartrecruiters' },
      {
        $set: {
          lastCrawledAt: new Date(),
          lastSuccessAt: new Date(),
          consecutiveFailures: 0,
          activeJobCount: allPostings.length,
          totalJobsFound: (company.totalJobsFound || 0) + newJobs
        }
      }
    );

    return { slug, newJobs, updatedJobs, totalJobs: allPostings.length };

  } catch (err) {
    await Company.updateOne(
      { slug, source: 'smartrecruiters' },
      {
        $set: { lastCrawledAt: new Date() },
        $inc: { consecutiveFailures: 1 }
      }
    );

    if (company.consecutiveFailures >= 4) {
      await Company.updateOne(
        { slug, source: 'smartrecruiters' },
        { $set: { isActive: false } }
      );
      console.log(`[SmartRecruiters] Disabled ${slug} after repeated failures`);
    }

    throw err;
  }
}

// ─── Seed list of known SmartRecruiters company slugs ────────────────────────
// SmartRecruiters skews toward large enterprises, retail, logistics, healthcare,
// and manufacturing — complementing Greenhouse/Lever's startup coverage.
function getSmartRecruitersSeedSlugs() {
  return [
    // ── Retail & Consumer ──────────────────────────────────────────────────
    'IKEA', 'Lidl', 'Aldi', 'Carrefour', 'Decathlon',
    'HM', 'Zara', 'Primark', 'Uniqlo', 'Gap',
    'Target', 'Walmart', 'Costco', 'BestBuy', 'HomeDepot',
    'Lowes', 'TJX', 'Marshalls', 'TJMaxx', 'Ross',
    'Macys', 'Nordstrom', 'Bloomingdales', 'Saks', 'Neiman-Marcus',
    'Nike', 'Adidas', 'UnderArmour', 'Lululemon', 'Columbia',
    'Starbucks', 'McDonalds', 'YumBrands', 'RestaurantBrands', 'Chipotle',
    // ── Healthcare & Life Sciences ─────────────────────────────────────────
    'UnitedHealth', 'Anthem', 'Aetna', 'Cigna', 'Humana',
    'CVSHealth', 'Walgreens', 'RiteAid', 'Rite-Aid', 'Albertsons',
    'HCA-Healthcare', 'Tenet-Healthcare', 'CommonSpirit', 'Ascension', 'Trinity-Health',
    'Mayo-Clinic', 'Cleveland-Clinic', 'Johns-Hopkins', 'Mass-General', 'UCSF',
    'Pfizer', 'Merck', 'AbbVie', 'BristolMyersSquibb', 'EliLilly',
    'JohnsonJohnson', 'Roche', 'Novartis', 'AstraZeneca', 'GSK',
    'Medtronic', 'Abbott', 'Becton-Dickinson', 'Stryker', 'Zimmer-Biomet',
    // ── Financial Services & Insurance ────────────────────────────────────
    'JPMorgan', 'BankOfAmerica', 'WellsFargo', 'Citigroup', 'USBank',
    'PNC', 'Truist', 'KeyBank', 'Regions', 'Fifth-Third',
    'GoldmanSachs', 'MorganStanley', 'Merrill', 'UBS', 'Credit-Suisse',
    'Blackrock', 'Vanguard', 'Fidelity', 'Schwab', 'TDAmeritrade',
    'StateStreet', 'BNY-Mellon', 'Northern-Trust', 'Invesco', 'Franklin-Templeton',
    'Allstate', 'Progressive', 'StateFarm', 'Nationwide', 'Liberty-Mutual',
    'Travelers', 'Hartford', 'Chubb', 'AIG', 'Zurich',
    'Visa', 'Mastercard', 'AmericanExpress', 'Discover', 'CapitalOne',
    // ── Technology & Consulting ────────────────────────────────────────────
    'IBM', 'Accenture', 'Deloitte', 'PwC', 'KPMG',
    'EY', 'McKinsey', 'Bain', 'BCG', 'Oliver-Wyman',
    'Cognizant', 'Infosys', 'Wipro', 'TCS', 'HCL',
    'Capgemini', 'CGI', 'DXC', 'Unisys', 'Leidos',
    'SAIC', 'Booz-Allen', 'CACI', 'ManTech', 'Peraton',
    'Microsoft', 'Oracle', 'SAP', 'Salesforce', 'ServiceNow',
    'Workday', 'ADP', 'Paychex', 'Ceridian', 'UKG',
    // ── Logistics, Transportation & Manufacturing ──────────────────────────
    'UPS', 'FedEx', 'DHL', 'USPS', 'XPO',
    'JBHunt', 'Werner', 'Schneider', 'Swift', 'Knight',
    'Amazon-Logistics', 'Ryder', 'Penske', 'Ceva', 'Geodis',
    'GM', 'Ford', 'Stellantis', 'Toyota', 'Honda',
    'Boeing', 'Airbus', 'Lockheed-Martin', 'Northrop-Grumman', 'Raytheon',
    'GE', 'Honeywell', 'Emerson', '3M', 'Parker-Hannifin',
    'Caterpillar', 'Deere', 'CNH-Industrial', 'AGCO', 'Kubota',
    'Dow', 'BASF', 'DuPont', 'Eastman', 'Celanese',
    // ── Energy & Utilities ────────────────────────────────────────────────
    'ExxonMobil', 'Chevron', 'ConocoPhillips', 'Phillips66', 'Valero',
    'Shell', 'BP', 'TotalEnergies', 'Equinor', 'Eni',
    'Duke-Energy', 'Dominion', 'Southern-Company', 'Exelon', 'NextEra',
    'Xcel-Energy', 'Entergy', 'PPL', 'Eversource', 'Avangrid',
    // ── Media, Telecom & Entertainment ────────────────────────────────────
    'Comcast', 'AT&T', 'Verizon', 'T-Mobile', 'Charter',
    'Disney', 'Warner-Bros', 'Paramount', 'NBCUniversal', 'Fox',
    'Spotify', 'Warner-Music', 'Sony-Music', 'Universal-Music', 'Live-Nation',
    // ── Real Estate & Construction ────────────────────────────────────────
    'CBRE', 'JLL', 'Cushman-Wakefield', 'Colliers', 'Newmark',
    'Prologis', 'Equinix', 'DigitalRealty', 'Iron-Mountain', 'Public-Storage',
    'DR-Horton', 'Lennar', 'PulteGroup', 'NVR', 'Toll-Brothers',
    'Turner-Construction', 'Bechtel', 'Fluor', 'Jacobs', 'AECOM',
    // ── Education & Government Adjacent ───────────────────────────────────
    'Pearson', 'McGraw-Hill', 'Cengage', 'Houghton-Mifflin', 'Scholastic',
    'Grand-Canyon-University', 'University-of-Phoenix', 'Strayer', 'Capella', 'Walden',
  ];
}
