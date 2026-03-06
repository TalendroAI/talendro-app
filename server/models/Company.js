import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
  // Identity
  name: { type: String, required: true },
  slug: { type: String, required: true }, // ATS board slug (e.g. "stripe" for boards.greenhouse.io/stripe)
  source: { type: String, required: true, enum: ['greenhouse', 'lever', 'workday', 'icims'] },

  // Metadata
  industry: { type: String, default: '' },
  size: { type: String, default: '' }, // startup, small, medium, large, enterprise
  website: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  location: { type: String, default: '' }, // HQ location

  // Crawl state
  isActive: { type: Boolean, default: true },
  lastCrawledAt: { type: Date, default: null },
  lastSuccessAt: { type: Date, default: null },
  consecutiveFailures: { type: Number, default: 0 },
  totalJobsFound: { type: Number, default: 0 },
  activeJobCount: { type: Number, default: 0 },

  // Crawl priority (higher = crawl more often)
  // Based on: company size, historical job volume, user interest
  priority: { type: Number, default: 5, min: 1, max: 10 },

  // Discovery metadata
  discoveredAt: { type: Date, default: Date.now },
  discoverySource: { type: String, default: 'directory' }, // directory, manual, user_request
});

// Compound unique index: one record per company per ATS
CompanySchema.index({ slug: 1, source: 1 }, { unique: true });
CompanySchema.index({ isActive: 1, lastCrawledAt: 1 }); // for picking next company to crawl
CompanySchema.index({ source: 1, isActive: 1 });
CompanySchema.index({ priority: -1, lastCrawledAt: 1 }); // priority crawl queue

export default mongoose.model('Company', CompanySchema);
