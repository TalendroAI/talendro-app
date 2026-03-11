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

// ─── POST /api/negotiation/voice-token ──────────────────────────────────────
// Fetches an ephemeral xAI Realtime client secret for voice salary negotiation
// role-play. Concierge plan only.
router.post('/voice-token', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('plan email');
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.plan !== 'concierge' && user.plan !== 'premium') {
      return res.status(403).json({
        error: 'Voice salary negotiation role-play requires the Concierge plan.',
        upgrade_required: true,
        required_plan: 'concierge',
      });
    }

    const XAI_API_KEY = process.env.XAI_API_KEY;
    if (!XAI_API_KEY) {
      console.error('[negotiation/voice-token] XAI_API_KEY not configured');
      return res.status(500).json({ error: 'Voice service not configured' });
    }

    console.log('[negotiation/voice-token] Requesting ephemeral token for user:', user.email);
    const response = await fetch('https://api.x.ai/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expires_after: { seconds: 300 } }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[negotiation/voice-token] xAI API error:', response.status, errorText);
      return res.status(502).json({ error: `Failed to get voice token: ${response.status}` });
    }

    const data = await response.json();
    const clientSecret = data?.value || data?.client_secret?.value;
    if (!clientSecret) {
      console.error('[negotiation/voice-token] Unexpected response shape:', JSON.stringify(data));
      return res.status(502).json({ error: 'No client secret in response' });
    }

    const expiresAt = data?.expires_at || data?.client_secret?.expires_at;
    console.log('[negotiation/voice-token] Token received, expires_at:', expiresAt);
    return res.json({ token: clientSecret, expires_at: expiresAt });
  } catch (error) {
    console.error('[negotiation/voice-token] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
