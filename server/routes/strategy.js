/**
 * routes/strategy.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Weekly AI Career Strategy Session API Routes
 *
 * POST /api/strategy/session  — Generate a weekly strategy brief
 * POST /api/strategy/chat     — Conversational follow-up during a session
 * GET  /api/strategy/history  — Retrieve past session briefs
 *
 * Concierge plan only.
 * TODO (Task 3.3): Wire strategyService into the endpoints below.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import Application from '../models/Application.js';
import strategyService from '../services/strategyService.js';

const router = express.Router();

// ─── POST /api/strategy/session ─────────────────────────────────────────────
// Generate a new weekly strategy session brief.
// Concierge plan only.
router.post('/session', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.plan !== 'concierge') {
      return res.status(403).json({ error: 'Weekly strategy sessions are available on the Concierge plan.' });
    }

    // Gather application stats for the past 7 days
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [weeklyApps, totalApps, interviews, offers] = await Promise.all([
      Application.countDocuments({ userId: req.userId, appliedAt: { $gte: oneWeekAgo } }),
      Application.countDocuments({ userId: req.userId }),
      Application.countDocuments({ userId: req.userId, status: 'interview' }),
      Application.countDocuments({ userId: req.userId, status: 'offer' }),
    ]);

    const responseRate = totalApps > 0
      ? Math.round(((interviews + offers) / totalApps) * 100)
      : null;

    const stats = {
      weeklyApplications: weeklyApps,
      totalApplications: totalApps,
      responseRate,
      interviewsScheduled: interviews,
      offersReceived: offers,
      weekNumber: Math.ceil((Date.now() - new Date(user.createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000)),
    };

    const brief = await strategyService.generateSession({ user, stats });

    // Save session to user's history
    await User.findByIdAndUpdate(req.userId, {
      $push: {
        'strategyHistory': {
          brief,
          stats,
          generatedAt: new Date(),
        }
      }
    });

    return res.json({ success: true, brief, stats });
  } catch (err) {
    console.error('[strategy/session] Error:', err.message);
    return res.status(500).json({ error: 'Failed to generate strategy session' });
  }
});

// ─── POST /api/strategy/chat ─────────────────────────────────────────────────
// Conversational follow-up during a strategy session.
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { sessionBrief, conversationHistory, message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.plan !== 'concierge') {
      return res.status(403).json({ error: 'Strategy session chat is available on the Concierge plan.' });
    }

    const reply = await strategyService.chat({
      sessionBrief: sessionBrief || '',
      conversationHistory: conversationHistory || [],
      userMessage: message,
    });

    return res.json({ success: true, reply });
  } catch (err) {
    console.error('[strategy/chat] Error:', err.message);
    return res.status(500).json({ error: 'Failed to process strategy message' });
  }
});

// ─── GET /api/strategy/history ───────────────────────────────────────────────
// Retrieve the user's past strategy session briefs.
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('strategyHistory').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const history = (user.strategyHistory || []).slice(-10).reverse(); // last 10, newest first
    return res.json({ success: true, history });
  } catch (err) {
    console.error('[strategy/history] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch strategy history' });
  }
});

export default router;
