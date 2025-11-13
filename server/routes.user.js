import express from 'express'
import User from './models/User.js'
import { authenticateToken } from './middleware/auth.js'

const router = express.Router()

// Get current user data (protected route)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // User is attached to req by authenticateToken middleware
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't send sensitive data to frontend
    const userData = {
      name: user.name,
      email: user.email,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt,
      stats: user.stats,
      createdAt: user.createdAt
    };
    
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Get subscription details (protected route)
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    // User is attached to req by authenticateToken middleware
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      plan: user.plan,
      status: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Mock user data endpoints
router.get('/agents', (req, res) => {
  res.json([
    { id: 1, name: "AI Agent Alpha", status: "active", applications: 12 },
    { id: 2, name: "AI Agent Beta", status: "active", applications: 8 },
    { id: 3, name: "AI Agent Gamma", status: "paused", applications: 15 }
  ])
})

router.get('/jobs', (req, res) => {
  res.json([
    { id: 1, title: "Senior Software Engineer", company: "TechCorp", location: "San Francisco, CA", status: "applied", date: "2024-09-01" },
    { id: 2, title: "Lead Developer", company: "StartupCo", location: "New York, NY", status: "interview", date: "2024-09-03" },
    { id: 3, title: "Engineering Manager", company: "BigTech", location: "Seattle, WA", status: "pending", date: "2024-09-05" }
  ])
})

router.get('/resumes', (req, res) => {
  res.json([
    { id: 1, name: "Resume - Software Engineer", optimized: true, date: "2024-09-01" },
    { id: 2, name: "Resume - Full Stack Developer", optimized: true, date: "2024-09-02" },
    { id: 3, name: "Resume - Technical Lead", optimized: false, date: "2024-09-04" }
  ])
})

router.get('/applications', (req, res) => {
  res.json([
    { id: 1, jobTitle: "Senior Software Engineer", company: "TechCorp", status: "submitted", date: "2024-09-01" },
    { id: 2, jobTitle: "Lead Developer", company: "StartupCo", status: "reviewed", date: "2024-09-03" },
    { id: 3, jobTitle: "Engineering Manager", company: "BigTech", status: "pending", date: "2024-09-05" }
  ])
})

// File access endpoints
router.get('/files/resume', (req, res) => {
  // Mock file download - in real implementation, serve actual file
  res.json({ 
    message: "Original uploaded resume", 
    filename: "john_doe_resume.pdf",
    downloadUrl: "/api/user/download/resume"
  })
})

router.get('/files/application', (req, res) => {
  // Mock compiled application file
  res.json({ 
    message: "Originally completed application", 
    filename: "john_doe_application.pdf",
    downloadUrl: "/api/user/download/application"
  })
})

export default router