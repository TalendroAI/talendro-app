import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['applied', 'viewed', 'phone_screen', 'interview', 'technical', 'offer', 'rejected', 'withdrawn', 'note', 'follow_up'],
    required: true
  },
  note: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const ApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Job reference (optional — may be manually added)
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  // Core job info (denormalized so it persists even if job is removed from crawler)
  jobTitle: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, default: '' },
  remote: { type: Boolean, default: false },
  hybrid: { type: Boolean, default: false },
  employmentType: { type: String, default: 'full-time' },
  salary: {
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    currency: { type: String, default: 'USD' }
  },
  // Application details
  applyUrl: { type: String, default: '' },
  jobUrl: { type: String, default: '' },
  source: { type: String, default: 'manual' }, // greenhouse, lever, manual, linkedin, indeed, etc.
  // Status tracking
  status: {
    type: String,
    enum: ['saved', 'applied', 'phone_screen', 'interview', 'technical', 'offer', 'rejected', 'withdrawn'],
    default: 'applied',
    index: true
  },
  // Key dates
  appliedAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now },
  // Activity log
  activities: [ActivitySchema],
  // Notes
  notes: { type: String, default: '' },
  // Match score at time of application
  matchScore: { type: Number, default: null },
  // Flags
  isFavorite: { type: Boolean, default: false },
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for common query patterns
ApplicationSchema.index({ userId: 1, status: 1 });
ApplicationSchema.index({ userId: 1, appliedAt: -1 });
ApplicationSchema.index({ userId: 1, lastActivityAt: -1 });
ApplicationSchema.index({ userId: 1, company: 1 });

ApplicationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.activities && this.activities.length > 0) {
    this.lastActivityAt = this.activities[this.activities.length - 1].date || new Date();
  }
  next();
});

export default mongoose.model('Application', ApplicationSchema);
