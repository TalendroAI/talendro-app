import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  stripeCustomerId: {
    type: String,
    default: 'pending',
    index: true
  },
  stripeSubscriptionId: {
    type: String,
    default: 'pending',
    index: true
  },
  plan: {
    type: String,
    enum: ['basic', 'pro', 'premium'],
    default: 'pro'
  },
  subscriptionStatus: {
    type: String,
    enum: ['trialing', 'active', 'past_due', 'canceled', 'canceling', 'incomplete', 'incomplete_expired', 'unpaid'],
    default: 'active'
  },
  // Onboarding progress tracking
  onboardingProgress: {
    step: { type: Number, default: 0 },
    completedAt: { type: Date, default: null }
  },
  // Full onboarding form data (all 11 steps)
  onboardingData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Parsed resume data stored for re-use
  resumeData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  trialEndsAt: { type: Date },
  currentPeriodEnd: { type: Date },
  lastPaymentDate: { type: Date },
  lastPaymentAmount: { type: Number },
  paymentFailedAt: { type: Date },
  subscriptionEndedAt: { type: Date },
  stats: {
    totalApplications: { type: Number, default: 0 },
    applicationsThisMonth: { type: Number, default: 0 },
    lastJobSearchRun: Date,
    totalJobsDiscovered: { type: Number, default: 0 },
    matchRate: { type: Number, default: 0 }
  },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },
  isPhoneVerified: { type: Boolean, default: false },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: true },
    weeklyReport: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLoginAt: Date
});

UserSchema.index({ email: 1 });
UserSchema.index({ stripeCustomerId: 1 });
UserSchema.index({ stripeSubscriptionId: 1 });
UserSchema.index({ subscriptionStatus: 1 });
UserSchema.index({ createdAt: -1 });

UserSchema.methods.canApplyToJobs = function() {
  if (this.plan === 'pro' || this.plan === 'premium') return true;
  if (this.plan === 'basic') return this.stats.applicationsThisMonth < 50;
  return false;
};

UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('User', UserSchema);
