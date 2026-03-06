import express from 'express';
import Job from '../models/Job.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { getCrawlerStats, triggerDiscovery, triggerCrawl } from '../services/crawlerScheduler.js';

const router = express.Router();

// Helper: build match score for a job vs user preferences
function scoreJob(job, userPrefs) {
  let score = 0;
  const { targetTitles = [], workArrangement = [], empType = [] } = userPrefs;

  // Title match (0-40 points)
  if (targetTitles.length > 0) {
    const jobTitleLower = (job.normalizedTitle || job.title || '').toLowerCase();
    for (const title of targetTitles) {
      const titleLower = title.toLowerCase();
      if (jobTitleLower === titleLower) { score += 40; break; }
      if (jobTitleLower.includes(titleLower) || titleLower.includes(jobTitleLower)) { score += 25; break; }
      const words = titleLower.split(/\s+/);
      const jobWords = jobTitleLower.split(/\s+/);
      const overlap = words.filter(w => jobWords.includes(w)).length;
      if (overlap > 0) { score += Math.min(15, overlap * 5); break; }
    }
  }

  // Work arrangement match (0-20 points)
  if (workArrangement.length > 0) {
    const wantRemote = workArrangement.some(w => w.toLowerCase().includes("remote"));
    const wantHybrid = workArrangement.some(w => w.toLowerCase().includes("hybrid"));
    const wantOnsite = workArrangement.some(w => w.toLowerCase().includes("on-site") || w.toLowerCase().includes("onsite"));
    if (wantRemote && job.remote) score += 20;
    else if (wantHybrid && job.hybrid) score += 20;
    else if (wantOnsite && !job.remote && !job.hybrid) score += 20;
    else if (wantRemote && job.hybrid) score += 10;
  }

  // Employment type match (0-15 points)
  if (empType.length > 0 && job.employmentType) {
    const jobType = job.employmentType.toLowerCase();
    for (const et of empType) {
      if (jobType.includes(et.toLowerCase()) || et.toLowerCase().includes(jobType)) {
        score += 15; break;
      }
    }
  }

  // Recency bonus (0-25 points)
  if (job.firstSeenAt) {
    const hoursOld = (Date.now() - new Date(job.firstSeenAt).getTime()) / (1000 * 60 * 60);
    if (hoursOld <= 2) score += 25;
    else if (hoursOld <= 6) score += 20;
    else if (hoursOld <= 12) score += 15;
    else if (hoursOld <= 24) score += 10;
    else if (hoursOld <= 48) score += 5;
  }

  return Math.min(100, score);
}

// GET /api/jobs/feed - personalized job feed
router.get("/feed", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 25, remote, hybrid, onsite, empType, postedWithin, search, company } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit) || 25);
    const skip = (pageNum - 1) * limitNum;

    const filter = { isActive: true };
    const arrangementFilters = [];
    if (remote === "true") arrangementFilters.push({ remote: true });
    if (hybrid === "true") arrangementFilters.push({ hybrid: true });
    if (onsite === "true") arrangementFilters.push({ remote: false, hybrid: false });
    if (arrangementFilters.length > 0) filter.$or = arrangementFilters;
    if (empType) filter.employmentType = { $regex: empType, $options: "i" };
    if (postedWithin) filter.firstSeenAt = { $gte: new Date(Date.now() - parseInt(postedWithin) * 60 * 60 * 1000) };
    if (company) filter.company = { $regex: company, $options: "i" };
    if (search) filter.$text = { $search: search };

    const user = await User.findById(req.user.userId).select("onboardingData").lean();
    const userPrefs = user?.onboardingData?.s8 || {};

    if (!search && userPrefs.targetTitles && userPrefs.targetTitles.length > 0) {
      const titleRegexes = userPrefs.targetTitles.map(t => ({
        normalizedTitle: { $regex: t.toLowerCase().replace(/[^a-z0-9\s]/g, ""), $options: "i" }
      }));
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: titleRegexes }];
        delete filter.$or;
      } else {
        filter.$or = titleRegexes;
      }
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter).sort({ firstSeenAt: -1 }).skip(skip).limit(limitNum).select("-descriptionHtml -__v").lean(),
      Job.countDocuments(filter)
    ]);

    const scoredJobs = jobs.map(job => ({ ...job, matchScore: scoreJob(job, userPrefs) }));
    scoredJobs.sort((a, b) => {
      const aHours = (Date.now() - new Date(a.firstSeenAt).getTime()) / (1000 * 60 * 60);
      const bHours = (Date.now() - new Date(b.firstSeenAt).getTime()) / (1000 * 60 * 60);
      const aBucket = aHours <= 24 ? 0 : aHours <= 48 ? 1 : 2;
      const bBucket = bHours <= 24 ? 0 : bHours <= 48 ? 1 : 2;
      if (aBucket !== bBucket) return aBucket - bBucket;
      return b.matchScore - a.matchScore;
    });

    res.json({ success: true, jobs: scoredJobs, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum), hasMore: skip + jobs.length < total } });
  } catch (err) {
    console.error("[Jobs] Feed error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch job feed" });
  }
});

// GET /api/jobs/search - keyword search
router.get("/search", authenticateToken, async (req, res) => {
  try {
    const { q, location, remote, page = 1, limit = 25, postedWithin } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit) || 25);
    const skip = (pageNum - 1) * limitNum;

    const filter = { isActive: true };
    if (q) filter.$text = { $search: q };
    if (remote === "true") filter.remote = true;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (postedWithin) filter.firstSeenAt = { $gte: new Date(Date.now() - parseInt(postedWithin) * 60 * 60 * 1000) };

    const sortOptions = q ? { score: { $meta: "textScore" }, firstSeenAt: -1 } : { firstSeenAt: -1 };
    const selectOptions = q ? { score: { $meta: "textScore" } } : {};

    const [jobs, total] = await Promise.all([
      Job.find(filter, selectOptions).sort(sortOptions).skip(skip).limit(limitNum).select("-descriptionHtml -__v").lean(),
      Job.countDocuments(filter)
    ]);

    res.json({ success: true, jobs, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
  } catch (err) {
    console.error("[Jobs] Search error:", err);
    res.status(500).json({ success: false, message: "Failed to search jobs" });
  }
});

// GET /api/jobs/stats/overview
router.get("/stats/overview", authenticateToken, async (req, res) => {
  try {
    const [totalActive, addedLast24h, remoteCount, greenhouseCount, leverCount, companyCount] = await Promise.all([
      Job.countDocuments({ isActive: true }),
      Job.countDocuments({ isActive: true, firstSeenAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Job.countDocuments({ isActive: true, remote: true }),
      Job.countDocuments({ isActive: true, source: "greenhouse" }),
      Job.countDocuments({ isActive: true, source: "lever" }),
      Company.countDocuments({ isActive: true })
    ]);
    res.json({ success: true, stats: { totalActiveJobs: totalActive, newLast24h: addedLast24h, remoteJobs: remoteCount, bySource: { greenhouse: greenhouseCount, lever: leverCount }, companiesTracked: companyCount, crawler: getCrawlerStats() } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to get stats" });
  }
});

// GET /api/jobs/:id - full job details
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to get job details" });
  }
});

// POST /api/jobs/admin/trigger-crawl
router.post("/admin/trigger-crawl", authenticateToken, async (req, res) => {
  triggerCrawl();
  res.json({ success: true, message: "Crawl triggered" });
});

// POST /api/jobs/admin/trigger-discovery
router.post("/admin/trigger-discovery", authenticateToken, async (req, res) => {
  triggerDiscovery();
  res.json({ success: true, message: "Discovery triggered" });
});

export default router;
