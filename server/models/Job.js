import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  // Unique identifier combining source + external ID
  externalId: { type: String, required: true },
  source: { type: String, required: true, enum: ['greenhouse', 'lever', 'workday', 'icims', 'taleo', 'successfactors', 'fantastic', 'jsearch', 'usajobs', 'ziprecruiter', 'google', 'ashby', 'smartrecruiters', 'bamboohr', 'rippling', 'jobvite', 'other'] },

  // Compound unique index: one record per job per source
  // externalId + source must be unique

  // Core job data
  title: { type: String, required: true, index: true },
  company: { type: String, required: true, index: true },
  companySlug: { type: String, index: true }, // e.g. "acme-corp" for Greenhouse board slug
  location: { type: String, default: '' },
  locations: [String], // multiple locations if listed
  remote: { type: Boolean, default: false },
  hybrid: { type: Boolean, default: false },

  // Job details
  department: { type: String, default: '' },
  team: { type: String, default: '' },
  employmentType: { type: String, default: '' }, // full-time, part-time, contract, internship
  experienceLevel: { type: String, default: '' }, // entry, mid, senior, director, vp, c-level
  salary: {
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    currency: { type: String, default: 'USD' },
    period: { type: String, default: 'annual' } // annual, hourly
  },

  // Content
  descriptionText: { type: String, default: '' }, // plain text version
  descriptionHtml: { type: String, default: '' }, // HTML version
  requirements: [String], // extracted requirements list
  benefits: [String],     // extracted benefits list

  // URLs
  applyUrl: { type: String, required: true },
  jobUrl: { type: String, default: '' }, // public listing URL

  // Timestamps — the most critical fields for freshness
  postedAt: { type: Date, default: null },       // when employer posted it
  firstSeenAt: { type: Date, default: Date.now }, // when WE first crawled it
  lastSeenAt: { type: Date, default: Date.now },  // last time we confirmed it's still live
  updatedAt: { type: Date, default: Date.now },

  // Status
  isActive: { type: Boolean, default: true, index: true },
  isFilled: { type: Boolean, default: false },

  // Matching metadata (computed)
  keywords: [String], // extracted keywords for matching
  normalizedTitle: { type: String, index: true }, // lowercased, cleaned title for matching
});

// Compound unique index: one record per job per source
JobSchema.index({ externalId: 1, source: 1 }, { unique: true });

// Indexes for the most common query patterns
JobSchema.index({ firstSeenAt: -1 });       // newest first feed
JobSchema.index({ isActive: 1, firstSeenAt: -1 }); // active jobs newest first
JobSchema.index({ company: 1, isActive: 1 });
JobSchema.index({ normalizedTitle: 1, isActive: 1 });
JobSchema.index({ remote: 1, isActive: 1, firstSeenAt: -1 });

// Text index for full-text search
JobSchema.index({
  title: 'text',
  company: 'text',
  descriptionText: 'text',
  keywords: 'text'
}, {
  weights: { title: 10, company: 5, keywords: 3, descriptionText: 1 },
  name: 'job_text_index'
});

JobSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.normalizedTitle = this.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  next();
});

export default mongoose.model('Job', JobSchema);
