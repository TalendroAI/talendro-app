import express from 'express';
import jobAggregationHub from '../services/jobAggregationHub.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Search jobs across all sources
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const {
      query = '',
      location = '',
      radius = 25,
      salary = null,
      jobType = null,
      remote = false,
      page = 1,
      limit = 25
    } = req.query;

    console.log(`Job search:`, { query, location, user: req.user.email });

    const result = await jobAggregationHub.searchAll({
      query,
      location,
      radius,
      salary,
      jobType,
      remote: remote === 'true',
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Job search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search jobs',
      error: error.message
    });
  }
});

// Get active sources
router.get('/sources', authenticateToken, async (req, res) => {
  try {
    const activeServices = jobAggregationHub.activeServices;
    
    res.json({
      success: true,
      totalSources: activeServices.length,
      sources: activeServices.map(s => s.name),
      coverage: {
        aggregators: ['ZipRecruiter', 'SimplyHired', 'CareerJet', 'Google Jobs', 'Adzuna'],
        ats: ['Workday', 'SAP SuccessFactors', 'Oracle Taleo', 'iCIMS', 'Greenhouse']
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get sources'
    });
  }
});

// Get job details by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Job details endpoint - Coming soon'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get job details'
    });
  }
});

// Save job
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { jobId, source } = req.body;
    
    res.json({
      success: true,
      message: 'Job saved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save job'
    });
  }
});

export default router;
