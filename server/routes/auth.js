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
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, stripeCustomerId, stripeSubscriptionId, plan } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!isMongoConnected()) return res.status(503).json({ error: 'Database unavailable. Please try again.' });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = new User({
      email: email.toLowerCase().trim(),
      name: name || email.split('@')[0],
      passwordHash,
      stripeCustomerId: stripeCustomerId || 'pending',
      stripeSubscriptionId: stripeSubscriptionId || 'pending',
      plan: plan || 'pro',
      subscriptionStatus: 'active',
      onboardingProgress: { step: 0, completedAt: null },
    });
    await user.save();

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
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid email or password' });

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

export default router;
