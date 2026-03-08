/**
 * routes/negotiation.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Salary Negotiation API Routes
 *
 * POST /api/negotiation/chat    — Conversational coaching (Pro + Concierge)
 * POST /api/negotiation/analyze — One-shot offer analysis (Pro + Concierge)
 *
 * TODO (Task 2.2): Wire negotiationService into both endpoints below.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import negotiationService from '../services/negotiationService.js';

const router = express.Router();

// ─── POST /api/negotiation/chat ──────────────────────────────────────────────
// Conversational salary negotiation coaching.
// Available to Pro and Concierge subscribers.
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { context, conversationHistory, message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Plan gate: only Pro and Concierge subscribers can access this feature
    const allowedPlans = ['pro', 'premium', 'concierge'];
    if (!allowedPlans.includes(user.plan)) {
      return res.status(403).json({ error: 'Salary negotiation coaching is available on Pro and Concierge plans.' });
    }

    // Enrich context with user data
    const enrichedContext = {
      ...context,
      tier: user.plan,
      desiredSalary: context?.desiredSalary || user.preferences?.desiredSalary,
      location: context?.location || user.preferences?.location,
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
// Available to Pro and Concierge subscribers.
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { jobTitle, companyName, offeredSalary, location, seniorityLevel } = req.body;
    if (!offeredSalary) return res.status(400).json({ error: 'offeredSalary is required' });

    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const allowedPlans = ['pro', 'premium', 'concierge'];
    if (!allowedPlans.includes(user.plan)) {
      return res.status(403).json({ error: 'Offer analysis is available on Pro and Concierge plans.' });
    }

    const context = {
      jobTitle,
      companyName,
      offeredSalary,
      location: location || user.preferences?.location,
      seniorityLevel,
      desiredSalary: user.preferences?.desiredSalary,
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
