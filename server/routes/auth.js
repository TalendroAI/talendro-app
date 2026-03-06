import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../utils/email.js';

const router = express.Router();

function makeToken(userId, email) {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'talendro_dev_secret_change_in_prod',
    { expiresIn: '30d' }
  );
}

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

// POST /api/auth/register
// Handles two cases:
//   1. Brand new user (no record in MongoDB yet)
//   2. Placeholder user created by Stripe webhook (passwordHash === 'PENDING_REGISTRATION')
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, stripeCustomerId, stripeSubscriptionId, plan } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!isMongoConnected()) return res.status(503).json({ error: 'Database unavailable. Please try again.' });

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });

    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    if (existing && existing.passwordHash === 'PENDING_REGISTRATION') {
      // Webhook created a placeholder — complete the registration by setting the password
      existing.passwordHash = passwordHash;
      if (name) existing.name = name;
      // Only overwrite Stripe fields if they were still pending
      if (stripeCustomerId && existing.stripeCustomerId === 'pending') existing.stripeCustomerId = stripeCustomerId;
      if (stripeSubscriptionId && existing.stripeSubscriptionId === 'pending') existing.stripeSubscriptionId = stripeSubscriptionId;
      if (plan && existing.plan !== plan) existing.plan = plan;
      existing.updatedAt = new Date();
      await existing.save();
      user = existing;
      console.log(`[auth/register] Completed registration for placeholder user: ${normalizedEmail}`);
    } else if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    } else {
      // Completely new user
      user = new User({
        email: normalizedEmail,
        name: name || email.split('@')[0],
        passwordHash,
        stripeCustomerId: stripeCustomerId || 'pending',
        stripeSubscriptionId: stripeSubscriptionId || 'pending',
        plan: plan || 'pro',
        subscriptionStatus: 'active',
        onboardingProgress: { step: 0, completedAt: null },
      });
      // Generate email verification token
      const verifyToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationToken = verifyToken;
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save();
      console.log(`[auth/register] New user created: ${normalizedEmail}`);
      // Send verification email (fire-and-forget — don't block registration)
      sendVerificationEmail(user, verifyToken).catch(e => console.error('[auth/register] Failed to send verification email:', e));
    }
    const token = makeToken(user._id.toString(), user.email);
    res.status(201).json({
      success: true, token,
      user: { id: user._id, email: user.email, name: user.name, plan: user.plan, subscriptionStatus: user.subscriptionStatus, onboardingProgress: user.onboardingProgress }
    });
  } catch (err) {
    console.error('[auth/register]', err);
    if (err.code === 11000) return res.status(409).json({ error: 'An account with this email already exists.' });
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (!isMongoConnected()) return res.status(503).json({ error: 'Database unavailable. Please try again.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    // Placeholder user created by webhook — they haven't set a password yet
    if (user.passwordHash === 'PENDING_REGISTRATION') {
      return res.status(403).json({ error: 'Please complete your account setup. Check your email for the account creation link, or go to the Create Account page.' });
    }

    if (!user.passwordHash) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    user.lastLoginAt = new Date();
    await user.save();

    const token = makeToken(user._id.toString(), user.email);
    res.json({
      success: true, token,
      user: { id: user._id, email: user.email, name: user.name, plan: user.plan, subscriptionStatus: user.subscriptionStatus, onboardingProgress: user.onboardingProgress, onboardingData: user.onboardingData }
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ error: 'Database unavailable.' });
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        onboardingProgress: user.onboardingProgress,
        onboardingData: user.onboardingData,
        isEmailVerified: user.isEmailVerified,
        stats: user.stats,
        createdAt: user.createdAt,
        currentPeriodEnd: user.currentPeriodEnd,
      }
    });
  } catch (err) {
    console.error('[auth/me]', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/auth/progress
router.put('/progress', authenticateToken, async (req, res) => {
  try {
    const { step, formData } = req.body;
    if (!isMongoConnected()) return res.status(503).json({ error: 'Database unavailable.' });
    const update = { 'onboardingProgress.step': step, updatedAt: new Date() };
    if (formData) update['onboardingData'] = formData;
    await User.findByIdAndUpdate(req.userId, { $set: update });
    res.json({ success: true });
  } catch (err) {
    console.error('[auth/progress]', err);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// PUT /api/auth/resume
// Saves parsed resume data to the user's MongoDB record
router.put('/resume', authenticateToken, async (req, res) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) return res.status(400).json({ error: 'resumeData is required' });
    if (!isMongoConnected()) return res.status(503).json({ error: 'Database unavailable.' });
    await User.findByIdAndUpdate(req.userId, { $set: { resumeData, updatedAt: new Date() } });
    res.json({ success: true });
  } catch (err) {
    console.error('[auth/resume]', err);
    res.status(500).json({ error: 'Failed to save resume data' });
  }
});

// PUT /api/auth/profile
// Updates account info or onboarding data sections from the Profile page
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { section, data } = req.body;
    if (!section || !data) return res.status(400).json({ error: 'section and data are required' });
    if (!isMongoConnected()) return res.status(503).json({ error: 'Database unavailable.' });

    let update = { updatedAt: new Date() };

    if (section === 'account') {
      if (data.name) update.name = data.name.trim();
      if (data.email) {
        const emailLower = data.email.toLowerCase().trim();
        const existing = await User.findOne({ email: emailLower, _id: { $ne: req.userId } });
        if (existing) return res.status(400).json({ error: 'That email address is already in use.' });
        update.email = emailLower;
      }
    } else if (section === 'personal') {
      // Merge each field individually so we don't overwrite unrelated s1 fields
      Object.keys(data).forEach(key => { update[`onboardingData.s1.${key}`] = data[key]; });
      if (data.firstName || data.lastName) {
        update.name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
      }
    } else if (section === 'preferences') {
      Object.keys(data).forEach(key => { update[`onboardingData.s8.${key}`] = data[key]; });
    } else {
      return res.status(400).json({ error: `Unknown section: ${section}` });
    }

    await User.findByIdAndUpdate(req.userId, { $set: update });
    res.json({ success: true });
  } catch (err) {
    console.error('[auth/profile]', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/auth/verify-email?token=...
// Verifies the user's email address and redirects to the app
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.redirect('/app/dashboard?verified=error&reason=missing_token');
    if (!isMongoConnected()) return res.redirect('/app/dashboard?verified=error&reason=db_unavailable');
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });
    if (!user) return res.redirect('/app/dashboard?verified=error&reason=invalid_or_expired');
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
    console.log(`[auth/verify-email] Email verified for: ${user.email}`);
    // Send welcome email (fire-and-forget)
    sendWelcomeEmail(user).catch(e => console.error('[auth/verify-email] Failed to send welcome email:', e));
    res.redirect('/app/dashboard?verified=success');
  } catch (err) {
    console.error('[auth/verify-email]', err);
    res.redirect('/app/dashboard?verified=error&reason=server_error');
  }
});

// POST /api/auth/resend-verification
// Resends the verification email for the authenticated user
router.post('/resend-verification', authenticateToken, async (req, res) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ error: 'Database unavailable.' });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isEmailVerified) return res.status(400).json({ error: 'Email is already verified' });
    // Rate limit: only allow resend every 2 minutes
    if (user.emailVerificationExpires && user.emailVerificationExpires > new Date(Date.now() - 2 * 60 * 1000)) {
      return res.status(429).json({ error: 'Please wait 2 minutes before requesting another verification email.' });
    }
    const verifyToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = verifyToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
    await sendVerificationEmail(user, verifyToken);
    res.json({ success: true, message: 'Verification email sent.' });
  } catch (err) {
    console.error('[auth/resend-verification]', err);
    res.status(500).json({ error: 'Failed to send verification email.' });
  }
});

// GET /api/auth/stats — real-time dashboard stats computed from live DB queries
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (!isMongoConnected()) return res.status(503).json({ error: 'Database unavailable.' });
    const userId = new mongoose.Types.ObjectId(req.userId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [statusBreakdown, applicationsThisMonth, totalJobsDiscovered] = await Promise.all([
      Application.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Application.countDocuments({ userId, appliedAt: { $gte: startOfMonth } }),
      Job.countDocuments({ isActive: true })
    ]);

    const summary = {};
    let totalApplications = 0;
    statusBreakdown.forEach(s => {
      summary[s._id] = s.count;
      totalApplications += s.count;
    });

    const interviews = (summary.interview || 0) + (summary.phone_screen || 0) + (summary.technical || 0);
    const offers = summary.offer || 0;
    const matchRate = totalApplications > 0 ? Math.round((interviews / totalApplications) * 100) : 0;

    // Update stored stats on user document for quick access
    await User.findByIdAndUpdate(req.userId, {
      $set: {
        'stats.totalApplications': totalApplications,
        'stats.applicationsThisMonth': applicationsThisMonth,
        'stats.totalJobsDiscovered': totalJobsDiscovered,
        'stats.matchRate': matchRate,
        updatedAt: now
      }
    });

    res.json({
      success: true,
      stats: {
        totalApplications,
        applicationsThisMonth,
        totalJobsDiscovered,
        matchRate,
        interviews,
        offers,
        statusBreakdown: summary
      }
    });
  } catch (err) {
    console.error('[auth/stats]', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
