/**
 * TALENDRO JOB AGGREGATION HUB
 * Multi-source job integration system
 */

import axios from 'axios';

// ============================================
// BASE JOB AGGREGATION SERVICE
// ============================================

class JobAggregationHub {
  constructor() {
    this.sources = {
      // Job Aggregators
      zipRecruiter: new ZipRecruiterService(),
      simplyHired: new SimplyHiredService(),
      careerJet: new CareerJetService(),
      googleJobs: new GoogleJobsService(),
      adzuna: new AdzunaService(),
      
      // ATS Platforms
      workday: new WorkdayService(),
      successFactors: new SuccessFactorsService(),
      taleo: new TaleoService(),
      icims: new ICIMSService(),
      greenhouse: new GreenhouseService()
    };
    
    this.activeServices = this.getActiveServices();
  }

  getActiveServices() {
    const active = [];
    for (const [name, service] of Object.entries(this.sources)) {
      if (service.isConfigured()) {
        active.push({ name, service });
      }
    }
    return active;
  }

  async searchAll(params) {
    const {
      query = '',
      location = '',
      radius = 25,
      page = 1,
      limit = 25
    } = params;

    console.log(`Searching ${this.activeServices.length} job sources...`);

    const searchPromises = this.activeServices.map(({ name, service }) => 
      this.searchSource(name, service, params)
    );

    const results = await Promise.allSettled(searchPromises);
    return this.processResults(results, page, limit);
  }

  async searchSource(name, service, params) {
    try {
      const jobs = await service.searchJobs(params);
      console.log(`✓ ${name}: Found ${jobs.length} jobs`);
      return { source: name, jobs, success: true };
    } catch (error) {
      console.error(`✗ ${name}: ${error.message}`);
      return { source: name, jobs: [], success: false, error: error.message };
    }
  }

  processResults(results, page, limit) {
    const allJobs = [];
    const sourceStats = {};

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.success) {
        const { source, jobs } = result.value;
        allJobs.push(...jobs);
        sourceStats[source] = jobs.length;
      } else if (result.status === 'fulfilled') {
        sourceStats[result.value.source] = 0;
      }
    });

    const uniqueJobs = this.deduplicateJobs(allJobs);
    const sortedJobs = this.sortJobs(uniqueJobs);
    const startIndex = (page - 1) * limit;
    const paginatedJobs = sortedJobs.slice(startIndex, startIndex + limit);

    return {
      jobs: paginatedJobs,
      totalResults: uniqueJobs.length,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: sortedJobs.length > startIndex + limit,
      sources: sourceStats,
      activeSources: this.activeServices.length
    };
  }

  deduplicateJobs(jobs) {
    const seen = new Map();
    return jobs.filter(job => {
      const key = `${job.company}-${job.title}-${job.location}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });
  }

  sortJobs(jobs) {
    return jobs.sort((a, b) => {
      if (a.verified && !b.verified) return -1;
      if (!a.verified && b.verified) return 1;
      return new Date(b.datePosted) - new Date(a.datePosted);
    });
  }
}

// ============================================
// JOB SERVICES
// ============================================

class ZipRecruiterService {
  constructor() {
    this.apiKey = process.env.ZIPRECRUITER_API_KEY;
    this.baseURL = 'https://api.ziprecruiter.com/jobs/v1';
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async searchJobs(params) {
    const response = await axios.get(this.baseURL, {
      params: {
        api_key: this.apiKey,
        search: params.query,
        location: params.location,
        radius_miles: params.radius,
        days_ago: 30,
        jobs_per_page: 100
      }
    });

    return response.data.jobs.map(job => ({
      externalId: job.id,
      title: job.name,
      company: job.hiring_company.name,
      location: job.location,
      description: job.snippet,
      url: job.url,
      datePosted: job.posted_time,
      source: 'ZipRecruiter',
      salary: job.salary_interval ? `${job.salary_min} - ${job.salary_max}` : null,
      jobType: job.employment_type,
      verified: true
    }));
  }
}

class CareerJetService {
  constructor() {
    this.affiliateId = process.env.CAREERJET_AFFILIATE_ID;
    this.baseURL = 'http://public.api.careerjet.net/search';
  }

  isConfigured() {
    return !!this.affiliateId;
  }

  async searchJobs(params) {
    const response = await axios.get(this.baseURL, {
      params: {
        affid: this.affiliateId,
        locale_code: 'en_US',
        keywords: params.query,
        location: params.location,
        pagesize: 99,
        page: 1
      }
    });

    return response.data.jobs.map(job => ({
      externalId: job.url,
      title: job.title,
      company: job.company,
      location: job.locations,
      description: job.description,
      url: job.url,
      datePosted: job.date,
      source: 'CareerJet',
      salary: job.salary
    }));
  }
}

class AdzunaService {
  constructor() {
    this.appId = process.env.ADZUNA_APP_ID;
    this.apiKey = process.env.ADZUNA_API_KEY;
    this.baseURL = 'https://api.adzuna.com/v1/api/jobs/us/search/1';
  }

  isConfigured() {
    return !!(this.appId && this.apiKey);
  }

  async searchJobs(params) {
    const response = await axios.get(this.baseURL, {
      params: {
        app_id: this.appId,
        app_key: this.apiKey,
        what: params.query,
        where: params.location,
        distance: params.radius,
        results_per_page: 50
      }
    });

    return response.data.results.map(job => ({
      externalId: job.id,
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      description: job.description,
      url: job.redirect_url,
      datePosted: job.created,
      source: 'Adzuna',
      salary: job.salary_min && job.salary_max 
        ? `$${job.salary_min} - $${job.salary_max}` 
        : null
    }));
  }
}

// ============================================
// ADDITIONAL AGGREGATORS
// ============================================

class SimplyHiredService {
  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY;
    this.baseURL = 'https://simply-hired.p.rapidapi.com';
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async searchJobs(params) {
    const response = await axios.get(`${this.baseURL}/search`, {
      params: {
        q: params.query,
        l: params.location,
        pn: 1
      },
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': 'simply-hired.p.rapidapi.com'
      }
    });

    return response.data.results.map(job => ({
      externalId: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      url: job.url,
      datePosted: job.date,
      source: 'SimplyHired',
      salary: job.salary,
      jobType: job.type
    }));
  }
}

class GoogleJobsService {
  constructor() {
    this.apiKey = process.env.SERPAPI_KEY;
    this.baseURL = 'https://serpapi.com/search';
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async searchJobs(params) {
    const response = await axios.get(this.baseURL, {
      params: {
        engine: 'google_jobs',
        q: params.query,
        location: params.location,
        api_key: this.apiKey
      }
    });

    return response.data.jobs_results.map(job => ({
      externalId: job.job_id,
      title: job.title,
      company: job.company_name,
      location: job.location,
      description: job.description,
      url: job.share_url,
      datePosted: job.detected_extensions?.posted_at,
      source: 'Google Jobs',
      salary: job.detected_extensions?.salary,
      jobType: job.detected_extensions?.schedule_type,
      via: job.via
    }));
  }
}

// ============================================
// ATS PLATFORM SERVICES
// ============================================

class WorkdayService {
  constructor() {
    this.enabled = process.env.WORKDAY_ENABLED === 'true';
  }

  isConfigured() {
    return this.enabled;
  }

  async searchJobs(params) {
    // Placeholder for future Workday XML feed parser
    return [];
  }
}

class SuccessFactorsService {
  constructor() {
    this.enabled = process.env.SAP_SF_ENABLED === 'true';
  }

  isConfigured() {
    return this.enabled;
  }

  async searchJobs(params) {
    // Placeholder for future SAP SuccessFactors parser
    return [];
  }
}

class TaleoService {
  constructor() {
    this.enabled = process.env.TALEO_ENABLED === 'true';
  }

  isConfigured() {
    return this.enabled;
  }

  async searchJobs(params) {
    // Placeholder for future Oracle Taleo RSS parser
    return [];
  }
}

class ICIMSService {
  constructor() {
    this.enabled = process.env.ICIMS_ENABLED === 'true';
  }

  isConfigured() {
    return this.enabled;
  }

  async searchJobs(params) {
    // Placeholder for future iCIMS parser
    return [];
  }
}

class GreenhouseService {
  constructor() {
    this.apiKey = process.env.GREENHOUSE_API_KEY;
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async searchJobs(params) {
    // Placeholder for future Greenhouse API integration
    return [];
  }
}

export default new JobAggregationHub();

