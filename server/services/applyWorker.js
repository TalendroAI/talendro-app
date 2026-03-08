/**
 * applyWorker.js
 * ─────────────────────────────────────────────────────────────────────────────
 * The core Auto-Apply Worker. Listens to the applicationQueue and processes
 * each job by:
 *   1. Fetching the user's profile and the job details from MongoDB
 *   2. Checking the user's application quota
 *   3. Calling resumeTailorService to generate a tailored resume
 *   4. Calling coverLetterService to generate a cover letter
 *   5. Routing to the correct ATS adapter (Greenhouse, Lever, etc.)
 *   6. Recording the application result in MongoDB
 *   7. Sending an email notification to the user
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO (Task 1.2 — Core Logic):
 *   - Uncomment and implement the Playwright browser automation block below.
 *   - Install Playwright: npm install playwright
 *   - Ensure the Render deployment has Playwright system deps (see Dockerfile).
 *
 * TODO (Task 1.7 — Email):
 *   - Wire emailService.sendApplicationConfirmation() after successful apply.
 *
 * TODO (Task 1.8 — Quota):
 *   - Call user.canApplyToJobs() before processing and increment the counter
 *     on success via User.findByIdAndUpdate({ $inc: { 'stats.applicationsThisMonth': 1 } }).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import applicationQueue from './queueService.js';
import resumeTailorService from './resumeTailorService.js';
import coverLetterService from './coverLetterService.js';
import emailService from './emailService.js';
import { getAdapterForAts } from './ats/index.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';

/**
 * Start the worker. Call this once from server/index.js.
 */
export function startApplyWorker() {
  console.log('[applyWorker] Worker started. Listening for jobs...');

  applicationQueue.on('job', async (job, done) => {
    console.log(`[applyWorker] Processing job ${job.id}`);
    try {
      await processJob(job);
      done();
    } catch (err) {
      console.error(`[applyWorker] Error on job ${job.id}:`, err.message);
      applicationQueue.retry(job);
      done();
    }
  });

  applicationQueue.on('job:failed', async (job) => {
    console.error(`[applyWorker] Job permanently failed: ${job.id}`);
    // TODO: Update application record status to 'failed' in MongoDB
    await Application.findOneAndUpdate(
      { userId: job.userId, jobId: job.jobId },
      { status: 'error', errorMessage: 'Max retry attempts exceeded' }
    ).catch(() => {});
  });
}

/**
 * Core processing logic for a single application job.
 */
async function processJob(job) {
  const { userId, jobId, atsType, applyUrl } = job;

  // ── Step 1: Fetch user and job from DB ────────────────────────────────────
  const [user, jobDoc] = await Promise.all([
    User.findById(userId).lean(),
    Job.findById(jobId).lean(),
  ]);

  if (!user) throw new Error(`User ${userId} not found`);
  if (!jobDoc) throw new Error(`Job ${jobId} not found`);

  // ── Step 2: Check quota ───────────────────────────────────────────────────
  // TODO (Task 1.8): Replace stub with real canApplyToJobs() check
  const canApply = true; // STUB — replace with: user.canApplyToJobs()
  if (!canApply) {
    console.warn(`[applyWorker] User ${userId} has reached their application quota. Skipping.`);
    return;
  }

  // ── Step 3: Tailor resume for this specific job ───────────────────────────
  // TODO (Task 1.5): resumeTailorService is scaffolded — implement the AI call
  const tailoredResume = await resumeTailorService.tailor({
    baseResume: user.resume?.optimizedText || user.resume?.rawText || '',
    jobTitle: jobDoc.title,
    jobDescription: jobDoc.description,
    companyName: jobDoc.company,
  });

  // ── Step 4: Generate cover letter ────────────────────────────────────────
  // TODO (Task 1.6): coverLetterService is scaffolded — implement the AI call
  const coverLetter = await coverLetterService.generate({
    user,
    jobDoc,
    tailoredResume,
  });

  // ── Step 5: Route to ATS adapter ─────────────────────────────────────────
  // TODO (Task 1.3 / 1.4): ATS adapters are scaffolded — implement Playwright logic
  const adapter = getAdapterForAts(atsType);
  const result = await adapter.apply({
    user,
    jobDoc,
    applyUrl,
    tailoredResume,
    coverLetter,
  });

  // ── Step 6: Record application in MongoDB ────────────────────────────────
  await Application.findOneAndUpdate(
    { userId, jobId },
    {
      userId,
      jobId,
      status: result.success ? 'applied' : 'error',
      appliedAt: result.success ? new Date() : undefined,
      errorMessage: result.error || undefined,
      tailoredResumeSnapshot: tailoredResume,
      coverLetterSnapshot: coverLetter,
      atsType,
      applyUrl,
    },
    { upsert: true, new: true }
  );

  // ── Step 7: Increment user's monthly application count ───────────────────
  if (result.success) {
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.applicationsThisMonth': 1, 'stats.totalApplications': 1 },
    });

    // ── Step 8: Send email notification ──────────────────────────────────
    // TODO (Task 1.7): emailService is scaffolded — implement the send logic
    await emailService.sendApplicationConfirmation({
      toEmail: user.email,
      userName: user.firstName || user.name || 'there',
      jobTitle: jobDoc.title,
      companyName: jobDoc.company,
      appliedAt: new Date(),
    }).catch(err => console.warn('[applyWorker] Email failed (non-fatal):', err.message));

    console.log(`[applyWorker] ✅ Successfully applied to ${jobDoc.title} at ${jobDoc.company} for user ${userId}`);
  } else {
    console.error(`[applyWorker] ❌ Application failed for job ${jobId}:`, result.error);
  }
}
