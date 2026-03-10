/**
 * routes/negotiation.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Salary Negotiation API Routes
 *
 * POST /api/negotiation/start    — Start a new coaching session (Pro + Concierge)
 * POST /api/negotiation/chat     — Conversational coaching / role-play
 * POST /api/negotiation/analyze  — One-shot offer analysis
 *
 * Plan access:
 *   Pro (pro)       — text-based role-play, single-round guidance
 *   Concierge (premium) — full multi-round coaching, employer role-play
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import negotiationService from '../services/negotiationService.js';

const router = express.Router();

// ─── Plan gate helper ─────────────────────────────────────────────────────────
const ALLOWED_PLANS = ['pro', 'premium', 'concierge'];

function isPlanAllowed(plan) {
  return ALLOWED_PLANS.includes(plan);
}

// ─── POST /api/negotiation/start ─────────────────────────────────────────────
// Initialize a new coaching session with an opening message from the coach.
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { jobTitle, companyName, offeredSalary, location, seniorityLevel } = req.body;

    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!isPlanAllowed(user.plan)) {
      return res.status(403).json({
        error: 'Salary negotiation coaching is available on Pro and Concierge plans.',
        upgradeRequired: true,
      });
    }

    const desiredSalary = user.onboardingData?.s8?.salaryMin
      ? parseInt(String(user.onboardingData.s8.salaryMin).replace(/[^0-9]/g, ''), 10)
      : undefined;

    const context = {
      jobTitle: jobTitle || user.onboardingData?.s8?.targetTitles || 'Not specified',
      companyName: companyName || 'Not specified',
      offeredSalary: offeredSalary ? parseInt(String(offeredSalary).replace(/[^0-9]/g, ''), 10) : undefined,
      desiredSalary,
      location: location || user.onboardingData?.s8?.targetLocations || 'Not specified',
      seniorityLevel: seniorityLevel || user.onboardingData?.s8?.seniority?.[0] || 'Not specified',
      tier: user.plan,
    };

    const openingMessage = await negotiationService.startSession({ context });

    return res.json({
      success: true,
      openingMessage,
      context,
      tier: user.plan,
    });
  } catch (err) {
    console.error('[negotiation/start] Error:', err.message);
    return res.status(500).json({ error: 'Failed to start negotiation session' });
  }
});

// ─── POST /api/negotiation/chat ──────────────────────────────────────────────
// Conversational salary negotiation coaching and role-play.
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { context, conversationHistory, message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!isPlanAllowed(user.plan)) {
      return res.status(403).json({
        error: 'Salary negotiation coaching is available on Pro and Concierge plans.',
        upgradeRequired: true,
      });
    }

    // Enrich context with user data
    const desiredSalary = user.onboardingData?.s8?.salaryMin
      ? parseInt(String(user.onboardingData.s8.salaryMin).replace(/[^0-9]/g, ''), 10)
      : context?.desiredSalary;

    const enrichedContext = {
      ...context,
      tier: user.plan,
      desiredSalary: desiredSalary || context?.desiredSalary,
      location: context?.location || user.onboardingData?.s8?.targetLocations,
    };

    const reply = await negotiationService.chat({
      context: enrichedContext,
      conversationHistory: conversationHistory || [],
      userMessage: message,
    });

    return res.json({ success: true, reply });
  } catch (err) {
    console.error('[negotiation/chat] Error:', err.message);
    return res.status(500).json({ error: 'Failed to process negotiation message' });
  }
});

// ─── POST /api/negotiation/analyze ──────────────────────────────────────────
// One-shot analysis of a specific job offer.
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { jobTitle, companyName, offeredSalary, location, seniorityLevel } = req.body;
    if (!offeredSalary) return res.status(400).json({ error: 'offeredSalary is required' });

    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!isPlanAllowed(user.plan)) {
      return res.status(403).json({
        error: 'Offer analysis is available on Pro and Concierge plans.',
        upgradeRequired: true,
      });
    }

    const desiredSalary = user.onboardingData?.s8?.salaryMin
      ? parseInt(String(user.onboardingData.s8.salaryMin).replace(/[^0-9]/g, ''), 10)
      : undefined;

    const context = {
      jobTitle: jobTitle || user.onboardingData?.s8?.targetTitles || 'Not specified',
      companyName: companyName || 'Not specified',
      offeredSalary: parseInt(String(offeredSalary).replace(/[^0-9]/g, ''), 10),
      desiredSalary,
      location: location || user.onboardingData?.s8?.targetLocations || 'Not specified',
      seniorityLevel: seniorityLevel || user.onboardingData?.s8?.seniority?.[0] || 'Not specified',
      tier: user.plan,
    };

    const analysis = await negotiationService.analyze({ context });

    return res.json({ success: true, analysis });
  } catch (err) {
    console.error('[negotiation/analyze] Error:', err.message);
    return res.status(500).json({ error: 'Failed to analyze offer' });
  }
});

export default router;
