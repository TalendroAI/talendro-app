/**
 * routes/admin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Operator Admin API — protected by ADMIN_SECRET_KEY header.
 *
 * Endpoints:
 *   GET  /api/admin/health          — service health check
 *   GET  /api/admin/stats           — platform-wide stats
 *   GET  /api/admin/users           — paginated user list with plan/status
 *   GET  /api/admin/applications    — recent applications across all users
 *   GET  /api/admin/queue           — auto-apply queue health
 *   GET  /api/admin/errors          — recent application errors
 *   POST /api/admin/user/:id/reset-quota — reset a user's monthly quota
 *   POST /api/admin/user/:id/set-plan   — change a user's plan
 *
 * Authentication: All routes require the `x-admin-key` header to match
 * the ADMIN_SECRET_KEY environment variable. Never expose this key publicly.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import express from 'express';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import applicationQueue from '../services/queueService.js';

const router = express.Router();

// ─── Admin Authentication Middleware ─────────────────────────────────────────
function requireAdminKey(req, res, next) {
  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (!adminKey) {
    return res.status(503).json({ error: 'Admin panel not configured — ADMIN_SECRET_KEY not set' });
  }
  const provided = req.headers['x-admin-key'] || req.query.key;
  if (!provided || provided !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized — invalid or missing admin key' });
  }
  next();
}
router.use(requireAdminKey);

// ─── GET /api/admin/health ────────────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    const queueStats = await applicationQueue.getStats();
    const mongoOk = await User.findOne().select('_id').lean().then(() => true).catch(() => false);
    res.json({
      ok: true,
      timestamp: new Date().toISOString(),
      mongo: mongoOk ? 'connected' : 'error',
      queue: queueStats,
      env: {
        openai:    !!process.env.OPENAI_API_KEY,
        stripe:    !!process.env.STRIPE_SECRET_KEY,
        twilio:    !!process.env.TWILIO_ACCOUNT_SID,
        capsolver: !!process.env.CAPSOLVER_API_KEY,
        redis:     !!process.env.REDIS_URL,
        resend:    !!process.env.RESEND_API_KEY,
        autoApply: process.env.ENABLE_AUTO_APPLY === 'true',
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7d  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeSubscribers,
      starterUsers,
      proUsers,
      conciergeUsers,
      totalApplications,
      applicationsThisMonth,
      applicationsLast24h,
      successfulApplications,
      captchaBlocked,
      errorApplications,
      totalJobs,
      jobsLast7d,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ subscriptionStatus: 'active' }),
      User.countDocuments({ plan: 'starter' }),
      User.countDocuments({ plan: 'pro' }),
      User.countDocuments({ plan: 'concierge' }),
      Application.countDocuments(),
      Application.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Application.countDocuments({ createdAt: { $gte: last24h } }),
      Application.countDocuments({ status: 'applied' }),
      Application.countDocuments({ status: 'captcha_blocked' }),
      Application.countDocuments({ status: 'error' }),
      Job.countDocuments(),
      Job.countDocuments({ createdAt: { $gte: last7d } }),
    ]);

    const successRate = totalApplications > 0
      ? Math.round((successfulApplications / totalApplications) * 100)
      : 0;

    res.json({
      users: { total: totalUsers, activeSubscribers, starter: starterUsers, pro: proUsers, concierge: conciergeUsers },
      applications: {
        total: totalApplications,
        thisMonth: applicationsThisMonth,
        last24h: applicationsLast24h,
        successful: successfulApplications,
        captchaBlocked,
        errors: errorApplications,
        successRate: `${successRate}%`,
      },
      jobs: { total: totalJobs, addedLast7d: jobsLast7d },
      queue: await applicationQueue.getStats(),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '25', 10));
    const skip  = (page - 1) * limit;
    const plan  = req.query.plan;
    const status = req.query.status;

    const filter = {};
    if (plan)   filter.plan = plan;
    if (status) filter.subscriptionStatus = status;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('email plan subscriptionStatus createdAt stats onboardingData.s1.firstName onboardingData.s1.lastName stripeCustomerId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      users: users.map(u => ({
        id: u._id,
        email: u.email,
        name: `${u.onboardingData?.s1?.firstName || ''} ${u.onboardingData?.s1?.lastName || ''}`.trim() || 'N/A',
        plan: u.plan || 'starter',
        status: u.subscriptionStatus || 'unknown',
        applicationsThisMonth: u.stats?.applicationsThisMonth || 0,
        totalApplications: u.stats?.totalApplications || 0,
        joinedAt: u.createdAt,
        stripeCustomerId: u.stripeCustomerId || null,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/applications ─────────────────────────────────────────────
router.get('/applications', async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page   || '1', 10));
    const limit  = Math.min(100, parseInt(req.query.limit || '50', 10));
    const skip   = (page - 1) * limit;
    const status = req.query.status;
    const userId = req.query.userId;

    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'email plan')
        .populate('jobId', 'title company location atsType')
        .lean(),
      Application.countDocuments(filter),
    ]);

    res.json({
      applications: applications.map(a => ({
        id: a._id,
        user: a.userId ? { id: a.userId._id, email: a.userId.email, plan: a.userId.plan } : null,
        job: a.jobId ? { id: a.jobId._id, title: a.jobId.title, company: a.jobId.company, location: a.jobId.location, atsType: a.jobId.atsType } : null,
        status: a.status,
        atsType: a.atsType,
        appliedAt: a.appliedAt,
        errorMessage: a.errorMessage,
        updatedAt: a.updatedAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/queue ─────────────────────────────────────────────────────
router.get('/queue', async (req, res) => {
  try {
    const stats = await applicationQueue.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/errors ────────────────────────────────────────────────────
router.get('/errors', async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
    const errors = await Application.find({
      status: { $in: ['error', 'captcha_blocked', 'quota_blocked'] },
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate('userId', 'email plan')
      .populate('jobId', 'title company atsType')
      .lean();

    res.json({
      errors: errors.map(e => ({
        id: e._id,
        user: e.userId ? { email: e.userId.email, plan: e.userId.plan } : null,
        job: e.jobId ? { title: e.jobId.title, company: e.jobId.company, atsType: e.jobId.atsType } : null,
        status: e.status,
        errorMessage: e.errorMessage,
        applyUrl: e.applyUrl,
        updatedAt: e.updatedAt,
      })),
      total: errors.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/admin/user/:id/reset-quota ────────────────────────────────────
router.post('/user/:id/reset-quota', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 'stats.applicationsThisMonth': 0 },
      { new: true }
    ).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true, message: `Monthly quota reset for ${user.email}`, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/admin/user/:id/set-plan ───────────────────────────────────────
router.post('/user/:id/set-plan', async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['starter', 'pro', 'concierge'].includes(plan)) {
      return res.status(400).json({ error: 'Invalid plan. Must be starter, pro, or concierge.' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { plan, updatedAt: new Date() },
      { new: true }
    ).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ ok: true, message: `Plan updated to ${plan} for ${user.email}`, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
