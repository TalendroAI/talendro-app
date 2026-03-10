/**
 * routes/linkedin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * LinkedIn Profile Optimization API Routes
 * Available exclusively to Concierge (premium) subscribers.
 *
 * POST /api/linkedin/optimize
 *   Accepts an optional LinkedIn profile URL.
 *   - URL provided  → scrapes profile, performs gap analysis, returns rewrite
 *   - No URL        → builds a complete profile from scratch using resume data
 *
 * GET  /api/linkedin/last-result
 *   Returns the user's most recently generated LinkedIn optimization document.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import linkedinService from '../services/linkedinService.js';

const router = express.Router();

// ─── POST /api/linkedin/optimize ─────────────────────────────────────────────
// Generate a LinkedIn profile optimization or build-from-scratch document.
// Concierge (premium) subscribers only.
router.post('/optimize', authenticateToken, async (req, res) => {
  try {
    const { linkedinUrl } = req.body;

    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Plan gate: Concierge (premium) only
    if (user.plan !== 'premium') {
      return res.status(403).json({
        error: 'LinkedIn profile optimization is a Concierge-level feature. Upgrade to Concierge to unlock this service.',
        upgradeRequired: true,
      });
    }

    // Require resume data
    if (!user.resumeData || (!user.resumeData.optimized && !user.resumeData.plainText)) {
      return res.status(400).json({
        error: 'No resume data found. Please complete the resume optimization step before requesting LinkedIn optimization.',
      });
    }

    const targetRoles = (
      user.onboardingData?.targetTitles ||
      user.preferences?.targetTitles ||
      user.jobPreferences?.targetTitles ||
      []
    );

    const result = await linkedinService.generateOptimization({
      linkedinUrl: linkedinUrl || null,
      user,
      targetRoles,
    });

    // Persist the result
    await User.findByIdAndUpdate(req.userId, {
      $set: {
        'linkedinOptimization.lastResult': result,
        'linkedinOptimization.generatedAt': new Date(),
        'linkedinOptimization.linkedinUrl': linkedinUrl || null,
      },
    });

    return res.json({ success: true, result });
  } catch (err) {
    console.error('[linkedin/optimize] Error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to generate LinkedIn optimization' });
  }
});

// ─── GET /api/linkedin/last-result ───────────────────────────────────────────
// Retrieve the user's most recently generated LinkedIn optimization document.
router.get('/last-result', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = user.linkedinOptimization?.lastResult || null;
    const generatedAt = user.linkedinOptimization?.generatedAt || null;

    return res.json({ success: true, result, generatedAt });
  } catch (err) {
    console.error('[linkedin/last-result] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch LinkedIn optimization result' });
  }
});

export default router;
