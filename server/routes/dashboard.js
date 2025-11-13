// server/routes/dashboard.js
import express from "express";
const router = express.Router();

// Stats endpoint
router.get("/stats/:cid", (req, res) => {
  const { cid } = req.params;
  res.json({
    jobsSearched: 124,
    resumes: 12,
    applications: 38,
    agents: 3,
    history: [
      { week: "Week 1", applications: 5 },
      { week: "Week 2", applications: 10 },
      { week: "Week 3", applications: 15 },
      { week: "Week 4", applications: 8 }
    ],
    recentActivity: [
      { action: "New job matches found", timestamp: new Date().toISOString() },
      { action: "Resume customized for Acme Corp", timestamp: new Date(Date.now() - 3600000).toISOString() },
      { action: "Application submitted to Beta Inc", timestamp: new Date(Date.now() - 7200000).toISOString() }
    ]
  });
});

// Initial search results
router.get("/initial-search/:cid", (req, res) => {
  const { cid } = req.params;
  res.json({
    results: [
      {
        id: 1,
        title: "Senior Software Engineer",
        company: "Acme Corp",
        location: "Remote",
        salary: "$120,000 - $150,000",
        snippet: "Looking for Python + React developer with 5+ years experience...",
        url: "https://careers.acme.com/job/123",
        postedDate: "2025-09-25",
        matchScore: 95,
        keywords: ["Python", "React", "AWS", "Docker"]
      },
      {
        id: 2,
        title: "Backend Developer",
        company: "Beta Inc",
        location: "NYC, NY",
        salary: "$100,000 - $130,000",
        snippet: "Java, Spring Boot, cloud experience required...",
        url: "https://jobs.beta.com/456",
        postedDate: "2025-09-24",
        matchScore: 88,
        keywords: ["Java", "Spring Boot", "Microservices", "Kubernetes"]
      },
      {
        id: 3,
        title: "Full Stack Developer",
        company: "Gamma LLC",
        location: "San Francisco, CA",
        salary: "$110,000 - $140,000",
        snippet: "Node.js, React, TypeScript, MongoDB experience...",
        url: "https://gamma.com/careers/789",
        postedDate: "2025-09-23",
        matchScore: 92,
        keywords: ["Node.js", "React", "TypeScript", "MongoDB"]
      },
      {
        id: 4,
        title: "DevOps Engineer",
        company: "Delta Systems",
        location: "Austin, TX",
        salary: "$115,000 - $145,000",
        snippet: "AWS, Terraform, CI/CD pipeline experience...",
        url: "https://delta.com/jobs/101",
        postedDate: "2025-09-22",
        matchScore: 85,
        keywords: ["AWS", "Terraform", "Docker", "Jenkins"]
      }
    ]
  });
});

// Resumes endpoint
router.get("/resumes/:cid", (req, res) => {
  const { cid } = req.params;
  res.json([
    { 
      id: 1, 
      job: "Software Engineer at Acme Corp", 
      keywords: ["Python", "React", "AWS"], 
      date: "2025-09-15",
      status: "Ready",
      downloadUrl: "/api/resumes/download/1"
    },
    { 
      id: 2, 
      job: "Backend Developer at Beta Inc", 
      keywords: ["Java", "Spring Boot", "Microservices"], 
      date: "2025-09-16",
      status: "Ready",
      downloadUrl: "/api/resumes/download/2"
    },
    { 
      id: 3, 
      job: "Full Stack Developer at Gamma LLC", 
      keywords: ["Node.js", "React", "TypeScript"], 
      date: "2025-09-17",
      status: "Processing",
      downloadUrl: null
    }
  ]);
});

// Applications endpoint
router.get("/applications/:cid", (req, res) => {
  const { cid } = req.params;
  res.json([
    { 
      id: 1, 
      title: "Senior Software Engineer", 
      company: "Acme Corp", 
      date: "2025-09-15",
      status: "Submitted",
      resumeUsed: "Resume #1",
      notes: "Applied via company website"
    },
    { 
      id: 2, 
      title: "Backend Developer", 
      company: "Beta Inc", 
      date: "2025-09-16",
      status: "Under Review",
      resumeUsed: "Resume #2",
      notes: "Application under review by HR"
    },
    { 
      id: 3, 
      title: "Full Stack Developer", 
      company: "Gamma LLC", 
      date: "2025-09-17",
      status: "Interview Scheduled",
      resumeUsed: "Resume #3",
      notes: "Phone interview scheduled for next week"
    }
  ]);
});

// Activities endpoint
router.get("/activities/:cid", (req, res) => {
  const { cid } = req.params;
  res.json([
    { 
      id: 1, 
      action: "Boolean search agent created", 
      date: "2025-09-14",
      type: "system",
      description: "New search agent configured for software engineering roles"
    },
    { 
      id: 2, 
      action: "Application submitted for Acme Corp", 
      date: "2025-09-15",
      type: "application",
      description: "Senior Software Engineer position at Acme Corp"
    },
    { 
      id: 3, 
      action: "Resume customized for Beta Inc", 
      date: "2025-09-16",
      type: "resume",
      description: "Resume tailored for Backend Developer role"
    },
    { 
      id: 4, 
      action: "New job matches found", 
      date: "2025-09-17",
      type: "search",
      description: "4 new matching positions discovered"
    }
  ]);
});

// Boolean search generator
router.post("/boolean-generator/:cid", (req, res) => {
  const { cid } = req.params;
  const { skills, jobTitles, locations, industries } = req.body;
  
  // Generate Boolean search string
  const jobTitleQuery = jobTitles?.map(title => `"${title}"`).join(' OR ') || '"software engineer" OR "developer"';
  const skillsQuery = skills?.map(skill => `"${skill}"`).join(' OR ') || '"Python" OR "Java"';
  const locationQuery = locations?.map(loc => `"${loc}"`).join(' OR ') || '"remote" OR "hybrid"';
  const industryQuery = industries?.map(industry => `"${industry}"`).join(' OR ') || '"technology" OR "software"';
  
  const booleanString = `(${jobTitleQuery}) AND (${skillsQuery}) AND (${locationQuery}) AND (${industryQuery})`;
  
  res.json({
    booleanString,
    searchQuery: {
      jobTitles: jobTitles || ["software engineer", "developer"],
      skills: skills || ["Python", "Java"],
      locations: locations || ["remote", "hybrid"],
      industries: industries || ["technology", "software"]
    },
    generatedAt: new Date().toISOString(),
    cid
  });
});

// Job search execution
router.post("/execute-search/:cid", async (req, res) => {
  const { cid } = req.params;
  const { booleanString } = req.body;
  
  // Simulate job search execution
  const mockResults = [
    {
      id: Math.random().toString(36).substr(2, 9),
      title: "Software Engineer",
      company: "TechCorp",
      location: "Remote",
      url: "https://techcorp.com/jobs/123",
      postedDate: new Date().toISOString(),
      source: "Company Website"
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      title: "Full Stack Developer",
      company: "StartupXYZ",
      location: "San Francisco, CA",
      url: "https://startupxyz.com/careers/456",
      postedDate: new Date().toISOString(),
      source: "LinkedIn"
    }
  ];
  
  res.json({
    searchId: Math.random().toString(36).substr(2, 9),
    results: mockResults,
    totalFound: mockResults.length,
    executedAt: new Date().toISOString(),
    booleanString
  });
});

// Resume download
router.get("/resumes/download/:resumeId", (req, res) => {
  const { resumeId } = req.params;
  // In a real implementation, this would serve the actual resume file
  res.json({
    message: `Resume ${resumeId} download initiated`,
    downloadUrl: `/api/dashboard/resumes/download/${resumeId}/file`
  });
});

export default router;





