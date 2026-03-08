/**
 * routes/dashboard.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Dashboard API Routes — serves real data from MongoDB.
 *
 * FIXED (Task 2.3): All endpoints previously returned hardcoded mock data.
 * They now query MongoDB for real user-specific data.
 *
 * The legacy /:cid parameter pattern is preserved for backward compatibility
 * with existing frontend calls, but the actual data is fetched using the
 * authenticated user's ID from the JWT token.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';

const router = express.Router();

// ─── GET /api/dashboard/stats/:cid ──────────────────────────────────────────
// Returns real application and job stats for the authenticated user.
router.get('/stats/:cid', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const [user, totalApplications, totalJobs] = await Promise.all([
      User.findById(userId).lean(),
      Application.countDocuments({ userId }),
      Job.countDocuments({ matchedUsers: userId }),
    ]);

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Build weekly application history (last 4 weeks)
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const recentApps = await Application.find({
      userId,
      appliedAt: { $gte: fourWeeksAgo },
    }).select('appliedAt').lean();

    const weeklyHistory = [0, 1, 2, 3].map(weeksAgo => {
      const weekStart = new Date(Date.now() - (weeksAgo + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(Date.now() - weeksAgo * 7 * 24 * 60 * 60 * 1000);
      const count = recentApps.filter(a => a.appliedAt >= weekStart && a.appliedAt < weekEnd).length;
      return { week: `Week ${4 - weeksAgo}`, applications: count };
    });

    // Recent activity from applications
    const recentActivity = await Application.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    const activityFeed = recentActivity.map(app => ({
      action: `Application ${app.status === 'applied' ? 'submitted' : app.status} — ${app.jobTitle || 'Job'}`,
      timestamp: (app.updatedAt || app.appliedAt || app.createdAt || new Date()).toISOString(),
    }));

    return res.json({
      jobsSearched: totalJobs,
      resumes: user.resumeData?.optimized ? 1 : 0,
      applications: totalApplications,
      agents: 1,
      history: weeklyHistory,
      recentActivity: activityFeed,
    });
  } catch (err) {
    console.error('[dashboard/stats] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// ─── GET /api/dashboard/initial-search/:cid ─────────────────────────────────
// FIXED (Task 2.3): Previously returned hardcoded mock jobs.
// Now returns the top matched jobs from MongoDB for this user.
router.get('/initial-search/:cid', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fetch top 10 highest-scoring jobs for this user
    const jobs = await Job.find({ matchedUsers: userId })
      .sort({ matchScore: -1 })
      .limit(10)
      .lean();

    // If no matched jobs yet (new user), fall back to recent jobs from the DB
    const fallbackJobs = jobs.length === 0
      ? await Job.find({}).sort({ postedDate: -1 }).limit(10).lean()
      : jobs;

    const results = fallbackJobs.map(job => ({
      id: job._id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary || 'Not specified',
      snippet: job.description ? job.description.substring(0, 150) + '...' : '',
      url: job.applyUrl || job.url,
      postedDate: job.postedDate,
      matchScore: job.matchScore || 0,
      keywords: job.skills || [],
      atsType: job.atsType || 'generic',
    }));

    return res.json({ results });
  } catch (err) {
    console.error('[dashboard/initial-search] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch initial job matches' });
  }
});

// ─── GET /api/dashboard/resumes/:cid ────────────────────────────────────────
// Returns the user's resume history.
router.get('/resumes/:cid', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resumes = [];
    if (user.resumeData?.optimized) {
      resumes.push({
        id: 'base',
        job: 'Base Resume (Optimized)',
        keywords: user.resumeData?.skills || [],
        date: user.resumeData?.optimizedAt || user.updatedAt,
        status: user.resumeData?.approved ? 'Approved' : 'Ready',
        downloadUrl: '/api/resume/download-pdf',
      });
    }

    return res.json(resumes);
  } catch (err) {
    console.error('[dashboard/resumes] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// ─── GET /api/dashboard/applications/:cid ───────────────────────────────────
// Returns the user's real application history from MongoDB.
router.get('/applications/:cid', authenticateToken, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.userId })
      .sort({ appliedAt: -1 })
      .limit(20)
      .lean();

    const formatted = applications.map(app => ({
      id: app._id,
      title: app.jobTitle || 'Unknown Role',
      company: app.companyName || 'Unknown Company',
      date: app.appliedAt || app.createdAt,
      status: app.status || 'Pending',
      resumeUsed: app.tailoredResumeSnapshot ? 'Tailored Resume' : 'Base Resume',
      notes: app.errorMessage || '',
      applyUrl: app.applyUrl,
    }));

    return res.json(formatted);
  } catch (err) {
    console.error('[dashboard/applications] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// ─── GET /api/dashboard/activities/:cid ─────────────────────────────────────
// Returns the user's activity feed from real application events.
router.get('/activities/:cid', authenticateToken, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    const activities = applications.map((app, i) => ({
      id: app._id,
      action: `Application ${app.status} — ${app.jobTitle || 'Job'} at ${app.companyName || 'Company'}`,
      date: (app.updatedAt || app.appliedAt || new Date()).toISOString().split('T')[0],
      type: 'application',
      description: app.errorMessage || `Status: ${app.status}`,
    }));

    return res.json(activities);
  } catch (err) {
    console.error('[dashboard/activities] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// ─── POST /api/dashboard/boolean-generator/:cid ─────────────────────────────
// Boolean search string generator — logic is fine, kept as-is.
router.post('/boolean-generator/:cid', (req, res) => {
  const { skills, jobTitles, locations, industries } = req.body;

  const jobTitleQuery = jobTitles?.map(t => `"${t}"`).join(' OR ') || '"software engineer" OR "developer"';
  const skillsQuery = skills?.map(s => `"${s}"`).join(' OR ') || '"Python" OR "JavaScript"';
  const locationQuery = locations?.map(l => `"${l}"`).join(' OR ') || '"remote" OR "hybrid"';
  const industryQuery = industries?.map(i => `"${i}"`).join(' OR ') || '"technology" OR "software"';

  const booleanString = `(${jobTitleQuery}) AND (${skillsQuery}) AND (${locationQuery}) AND (${industryQuery})`;

  return res.json({
    booleanString,
    searchQuery: { jobTitles, skills, locations, industries },
    generatedAt: new Date().toISOString(),
  });
});

// ─── GET /api/dashboard/resumes/download/:resumeId ──────────────────────────
// Redirect to the real PDF download endpoint.
router.get('/resumes/download/:resumeId', authenticateToken, (req, res) => {
  return res.redirect('/api/resume/download-pdf');
});

export default router;
