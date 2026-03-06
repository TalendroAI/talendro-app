import express from 'express';
import Application from '../models/Application.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/applications — list all applications for the authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, search, sort = 'recent', page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { jobTitle: regex },
        { company: regex },
        { location: regex }
      ];
    }

    const sortMap = {
      recent: { appliedAt: -1 },
      activity: { lastActivityAt: -1 },
      company: { company: 1 },
      title: { jobTitle: 1 }
    };
    const sortOrder = sortMap[sort] || { appliedAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Application.countDocuments(query);
    const applications = await Application.find(query)
      .sort(sortOrder)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Build status summary counts
    const statusCounts = await Application.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const summary = { all: total };
    statusCounts.forEach(s => { summary[s._id] = s.count; });

    res.json({
      applications,
      summary,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('GET /api/applications error:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET /api/applications/:id — get a single application
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, userId: req.user._id });
    if (!app) return res.status(404).json({ error: 'Application not found' });
    res.json({ application: app });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// POST /api/applications — create a new application
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      jobId, jobTitle, company, location, remote, hybrid, employmentType,
      salary, applyUrl, jobUrl, source, status, appliedAt, notes, matchScore
    } = req.body;

    if (!jobTitle || !company) {
      return res.status(400).json({ error: 'jobTitle and company are required' });
    }

    const application = new Application({
      userId: req.user._id,
      jobId: jobId || null,
      jobTitle,
      company,
      location: location || '',
      remote: remote || false,
      hybrid: hybrid || false,
      employmentType: employmentType || 'full-time',
      salary: salary || {},
      applyUrl: applyUrl || '',
      jobUrl: jobUrl || '',
      source: source || 'manual',
      status: status || 'applied',
      appliedAt: appliedAt ? new Date(appliedAt) : new Date(),
      notes: notes || '',
      matchScore: matchScore || null,
      activities: [{
        type: 'applied',
        note: `Applied to ${jobTitle} at ${company}`,
        date: appliedAt ? new Date(appliedAt) : new Date()
      }]
    });

    await application.save();

    // Update user stats
    await req.user.constructor.findByIdAndUpdate(req.user._id, {
      $inc: {
        'stats.totalApplications': 1,
        'stats.applicationsThisMonth': 1
      }
    });

    res.status(201).json({ application });
  } catch (err) {
    console.error('POST /api/applications error:', err);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// PATCH /api/applications/:id — update status, notes, or other fields
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, userId: req.user._id });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const { status, notes, isFavorite, jobTitle, company, location, salary } = req.body;

    if (status && status !== app.status) {
      app.status = status;
      // Add activity entry for status change
      const activityTypeMap = {
        phone_screen: 'phone_screen',
        interview: 'interview',
        technical: 'technical',
        offer: 'offer',
        rejected: 'rejected',
        withdrawn: 'withdrawn'
      };
      const actType = activityTypeMap[status] || 'note';
      app.activities.push({
        type: actType,
        note: `Status updated to: ${status.replace(/_/g, ' ')}`,
        date: new Date()
      });
    }

    if (notes !== undefined) app.notes = notes;
    if (isFavorite !== undefined) app.isFavorite = isFavorite;
    if (jobTitle) app.jobTitle = jobTitle;
    if (company) app.company = company;
    if (location !== undefined) app.location = location;
    if (salary) app.salary = { ...app.salary, ...salary };

    await app.save();
    res.json({ application: app });
  } catch (err) {
    console.error('PATCH /api/applications error:', err);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// POST /api/applications/:id/activity — add an activity/note to an application
router.post('/:id/activity', requireAuth, async (req, res) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, userId: req.user._id });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const { type, note, date } = req.body;
    if (!type) return res.status(400).json({ error: 'Activity type is required' });

    app.activities.push({
      type,
      note: note || '',
      date: date ? new Date(date) : new Date()
    });

    await app.save();
    res.json({ application: app });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add activity' });
  }
});

// DELETE /api/applications/:id — delete an application
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const app = await Application.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    // Decrement user stats
    await req.user.constructor.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalApplications': -1 }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// GET /api/applications/stats/summary — get application statistics
router.get('/stats/summary', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const [statusBreakdown, recentActivity, monthlyTrend] = await Promise.all([
      // Status breakdown
      Application.aggregate([
        { $match: { userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Last 5 activities across all applications
      Application.aggregate([
        { $match: { userId } },
        { $unwind: '$activities' },
        { $sort: { 'activities.date': -1 } },
        { $limit: 5 },
        { $project: { jobTitle: 1, company: 1, activity: '$activities' } }
      ]),
      // Applications per month (last 6 months)
      Application.aggregate([
        { $match: { userId, appliedAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
        { $group: {
          _id: { year: { $year: '$appliedAt' }, month: { $month: '$appliedAt' } },
          count: { $sum: 1 }
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    const summary = {};
    statusBreakdown.forEach(s => { summary[s._id] = s.count; });

    res.json({ summary, recentActivity, monthlyTrend });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
