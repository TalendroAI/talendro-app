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
    phone: {
        type: String,
        trim: true
    },
    stripeCustomerId: {
        type: String,
        required: true,
        index: true
    },
    stripeSubscriptionId: {
        type: String,
        required: true,
        index: true
    },
    plan: {
        type: String,
        enum: ['basic', 'pro', 'premium'],
        required: true
    },
    subscriptionStatus: {
        type: String,
        enum: ['trialing', 'active', 'past_due', 'canceled', 'canceling', 'incomplete', 'incomplete_expired', 'unpaid'],
        default: 'active'
    },
    lastPaymentDate: {
        type: Date
    },
    lastPaymentAmount: {
        type: Number
    },
    paymentFailedAt: {
        type: Date
    },
    subscriptionEndedAt: {
        type: Date
    },
    onboardingData: {
        step1: mongoose.Schema.Types.Mixed,
        step2: mongoose.Schema.Types.Mixed,
        step3: mongoose.Schema.Types.Mixed,
        step4: mongoose.Schema.Types.Mixed
    },
    stats: {
        totalApplications: { type: Number, default: 0 },
        applicationsThisMonth: { type: Number, default: 0 },
        lastJobSearchRun: Date,
        totalJobsDiscovered: { type: Number, default: 0 },
        matchRate: { type: Number, default: 0 }
    },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
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