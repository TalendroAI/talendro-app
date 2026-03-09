/**
 * routes/linkedin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * LinkedIn Profile Optimization API Routes
 *
 * POST /api/linkedin/analyze — Analyze and score a LinkedIn profile
 *
 * Concierge plan only.
 * TODO (Task 3.1): Wire linkedinService into the endpoint below.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import linkedinService from '../services/linkedinService.js';

const router = express.Router();

// ─── POST /api/linkedin/analyze ─────────────────────────────────────────────
// Analyze a user's LinkedIn profile and return optimization recommendations.
// Available to Concierge subscribers only.
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { profileText } = req.body;
    if (!profileText) return res.status(400).json({ error: 'profileText is required. Please paste your full LinkedIn profile.' });

    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Plan gate: Concierge (premium) only
    // TIER LOGIC:
    //   Starter  (plan: 'basic')   → no LinkedIn optimization
    //   Pro      (plan: 'pro')     → no LinkedIn optimization
    //   Concierge (plan: 'premium') → full LinkedIn profile review + update
    if (user.plan !== 'premium') {
      return res.status(403).json({
        error: 'LinkedIn profile optimization is a Concierge-level feature. Upgrade to Concierge to unlock this service.',
        upgradeRequired: true,
      });
    }

    const targetRoles = user.preferences?.targetTitles || user.jobPreferences?.targetTitles || [];

    const analysis = await linkedinService.analyze({ profileText, user, targetRoles });

    // Save the analysis result to the user's record for future reference
    await User.findByIdAndUpdate(req.userId, {
      $set: {
        'linkedinOptimization.lastAnalysis': analysis,
        'linkedinOptimization.analyzedAt': new Date(),
      }
    });

    return res.json({ success: true, analysis });
  } catch (err) {
    console.error('[linkedin/analyze] Error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to analyze LinkedIn profile' });
  }
});

// ─── GET /api/linkedin/last-analysis ────────────────────────────────────────
// Retrieve the user's most recent LinkedIn analysis.
router.get('/last-analysis', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const analysis = user.linkedinOptimization?.lastAnalysis || null;
    const analyzedAt = user.linkedinOptimization?.analyzedAt || null;

    return res.json({ success: true, analysis, analyzedAt });
  } catch (err) {
    console.error('[linkedin/last-analysis] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch LinkedIn analysis' });
  }
});

export default router;
