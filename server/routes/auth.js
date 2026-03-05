import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

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
      await user.save();
      console.log(`[auth/register] New user created: ${normalizedEmail}`);
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
      user: { id: user._id, email: user.email, name: user.name, plan: user.plan, subscriptionStatus: user.subscriptionStatus, onboardingProgress: user.onboardingProgress, onboardingData: user.onboardingData }
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

export default router;
