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
 * ─────────────────────────────────────────────────────────────────────────────
 */

import applicationQueue from './queueService.js';
import { tailor as tailorResume } from './resumeTailorService.js';
import coverLetterService from './coverLetterService.js';
import emailService from './emailService.js';
import smsService from './smsService.js';
import portalPasswordService from './portalPasswordService.js';
import { getAdapterForAts } from './ats/index.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';

// ─── Plan limits (Master Tier Table — locked 2026-03-10) ──────────────────────────────────────────────────────────────────
const PLAN_MONTHLY_LIMITS = {
  starter:    50,
  pro:       200,
  concierge: Infinity,  // Unlimited
};

/**
 * Check whether a user can still apply to jobs this month.
 * Returns { allowed: boolean, reason?: string }
 */
function checkQuota(user) {
  const plan = user.plan || 'starter';
  const limit = PLAN_MONTHLY_LIMITS[plan] ?? 50;
  const used  = user.stats?.applicationsThisMonth ?? 0;

  if (used >= limit) {
    return {
      allowed: false,
      reason: `Monthly application limit reached (${used}/${limit} for ${plan} plan).`,
    };
  }
  return { allowed: true };
}

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
    await Application.findOneAndUpdate(
      { userId: job.userId, jobId: job.jobId },
      { status: 'error', errorMessage: 'Max retry attempts exceeded', updatedAt: new Date() }
    ).catch(() => {});

    // Notify user of failure
    try {
      const user = await User.findById(job.userId).lean();
      const jobDoc = await Job.findById(job.jobId).lean();
      if (user?.email && jobDoc) {
        await emailService.sendApplicationFailed({
          toEmail: user.email,
          userName: user.onboardingData?.s1?.firstName || user.firstName || 'there',
          jobTitle: jobDoc.title,
          companyName: jobDoc.company,
        }).catch(() => {});
      }
    } catch (e) {}
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
  const quota = checkQuota(user);
  if (!quota.allowed) {
    console.warn(`[applyWorker] Quota exceeded for user ${userId}: ${quota.reason}`);
    // Record as quota-blocked so the user can see it in their dashboard
    await Application.findOneAndUpdate(
      { userId, jobId },
      {
        userId, jobId, status: 'quota_blocked',
        errorMessage: quota.reason,
        atsType, applyUrl,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    // Send a single quota warning email (only once per billing cycle)
    const lastWarning = user.stats?.lastQuotaWarningAt;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    if (!lastWarning || new Date(lastWarning).getTime() < oneDayAgo) {
      await emailService.sendQuotaWarning({
        toEmail: user.email,
        userName: user.onboardingData?.s1?.firstName || user.firstName || 'there',
        plan: user.plan || 'starter',
        used: user.stats?.applicationsThisMonth ?? 0,
        limit: PLAN_MONTHLY_LIMITS[user.plan || 'starter'],
      }).catch(() => {});
      await User.findByIdAndUpdate(userId, { 'stats.lastQuotaWarningAt': new Date() });
    }
    return;
  }

  // ── Step 3: Tailor resume for this specific job ───────────────────────────
  const baseResume = user.resume?.optimizedText || user.resume?.rawText || '';
  let tailoredResume;
  try {
    tailoredResume = await tailorResume({
      baseResume,
      jobTitle: jobDoc.title,
      jobDescription: jobDoc.description,
      companyName: jobDoc.company,
    });
    // Convert to plain text if it came back as JSON
    if (typeof tailoredResume === 'object') {
      tailoredResume = formatResumeAsText(tailoredResume);
    }
  } catch (err) {
    console.error('[applyWorker] Resume tailoring failed:', err.message);
    tailoredResume = baseResume; // Fall back to base resume
  }

  // ── Step 4: Generate cover letter ────────────────────────────────────────
  let coverLetter;
  try {
    coverLetter = await coverLetterService.generate({ user, jobDoc, tailoredResume });
  } catch (err) {
    console.error('[applyWorker] Cover letter generation failed:', err.message);
    coverLetter = `Dear Hiring Manager,\n\nI am excited to apply for the ${jobDoc.title} position at ${jobDoc.company}. My experience aligns well with your requirements and I look forward to discussing how I can contribute to your team.\n\nBest regards,\n${user.onboardingData?.s1?.firstName || user.firstName || 'Applicant'}`;
  }

  // ── Step 5: Route to ATS adapter ─────────────────────────────────────────
  const adapter = getAdapterForAts(atsType);
  const result = await adapter.apply({
    user,
    jobDoc,
    applyUrl,
    tailoredResume,
    coverLetter,
  });

  // ── Step 5b: Handle CAPTCHA-blocked applications ────────────────────────
  // When all adapter layers fail due to CAPTCHA, record the block and notify
  // the user via SMS with their portal credentials so they can complete the
  // application themselves in under two minutes.
  // This ensures zero silent failures — every blocked application is surfaced.
  if (!result.success && result.captchaBlocked) {
    console.warn(`[applyWorker] CAPTCHA blocked — recording and notifying user via SMS: ${applyUrl}`);
    await Application.findOneAndUpdate(
      { userId, jobId },
      {
        userId, jobId,
        status: 'captcha_blocked',
        errorMessage: result.error || 'Application blocked by CAPTCHA. Please complete manually.',
        tailoredResumeSnapshot: tailoredResume,
        coverLetterSnapshot: coverLetter,
        atsType, applyUrl,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    // Retrieve (or generate) the user's portal password
    const portalPassword = await portalPasswordService.getOrCreate(userId).catch(() => null);
    // Notify user via SMS with credentials and direct link
    const userPhone = user.onboardingData?.s1?.phone || user.onboardingData?.phone || user.phone || null;
    const userName = user.onboardingData?.s1?.firstName || user.firstName || 'there';
    await smsService.sendCaptchaBlockedSms({
      toPhone: userPhone,
      userName,
      jobTitle: jobDoc.title,
      companyName: jobDoc.company,
      applyUrl,
      portalEmail: user.email,
      portalPassword,
    }).catch(err => console.warn('[applyWorker] CAPTCHA blocked SMS failed (non-fatal):', err.message));
    return;
  }

  // ── Step 6: Record application in MongoDB ────────────────────────────────
  await Application.findOneAndUpdate(
    { userId, jobId },
    {
      userId,
      jobId,
      status: result.success ? 'applied' : 'error',
      appliedAt: result.success ? new Date() : undefined,
      errorMessage: result.error || undefined,
      warning: result.warning || undefined,
      tailoredResumeSnapshot: tailoredResume,
      coverLetterSnapshot: coverLetter,
      atsType,
      applyUrl,
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  // ── Step 7: Increment user's monthly application count ───────────────────
  if (result.success) {
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.applicationsThisMonth': 1, 'stats.totalApplications': 1 },
    });

    // ── Step 8: Send email notification ──────────────────────────────────
    await emailService.sendApplicationConfirmation({
      toEmail: user.email,
      userName: user.onboardingData?.s1?.firstName || user.firstName || 'there',
      jobTitle: jobDoc.title,
      companyName: jobDoc.company,
      applyUrl,
      appliedAt: new Date(),
    }).catch(err => console.warn('[applyWorker] Email failed (non-fatal):', err.message));

    // ── Step 8b: Send SMS for Rare / Exceptionally Rare roles ────────────
    // These alerts fire regardless of normal notification preferences.
    const rarity = jobDoc.rarity; // 'common' | 'rare' | 'exceptionally_rare'
    const userPhone = user.onboardingData?.phone || user.phone || null;
    const dashboardUrl = `${process.env.FRONTEND_URL || 'https://talendro.com'}/app/jobs`;
    const userName = user.onboardingData?.s1?.firstName || user.firstName || 'there';
    const postedAgo = jobDoc.postedAgo || 'recently';

    if (rarity === 'exceptionally_rare') {
      // Email alert
      await emailService.sendRareRoleAlert({
        toEmail: user.email,
        userName,
        jobTitle: jobDoc.title,
        companyName: jobDoc.company,
        location: jobDoc.location || 'Location not specified',
        salary: jobDoc.salary || null,
        postedAgo,
        jobUrl: applyUrl,
        rarity: 'exceptionally_rare',
        locationPassed: true,
      }).catch(err => console.warn('[applyWorker] Rare role email failed:', err.message));

      // SMS alert — highest urgency
      if (userPhone) {
        await smsService.sendExceptionalRoleAlert({
          toPhone: userPhone,
          userName,
          jobTitle: jobDoc.title,
          companyName: jobDoc.company,
          location: jobDoc.location || 'Location not specified',
          postedAgo,
          dashboardUrl,
          applied: true,
        }).catch(err => console.warn('[applyWorker] Rare role SMS failed:', err.message));
      }
    } else if (rarity === 'rare') {
      // Email alert only for Rare (no SMS — avoid over-alerting)
      await emailService.sendRareRoleAlert({
        toEmail: user.email,
        userName,
        jobTitle: jobDoc.title,
        companyName: jobDoc.company,
        location: jobDoc.location || 'Location not specified',
        salary: jobDoc.salary || null,
        postedAgo,
        jobUrl: applyUrl,
        rarity: 'rare',
        locationPassed: true,
      }).catch(err => console.warn('[applyWorker] Rare role email failed:', err.message));
    }

    console.log(`[applyWorker] ✅ Successfully applied to ${jobDoc.title} at ${jobDoc.company} for user ${userId}`);
  } else {
    console.error(`[applyWorker] ❌ Application failed for job ${jobId}:`, result.error);
  }
}

/**
 * Convert a structured resume JSON object to plain text for form submission.
 */
function formatResumeAsText(resume) {
  if (!resume || typeof resume !== 'object') return String(resume || '');

  const lines = [];

  if (resume.name) lines.push(resume.name.toUpperCase());
  const contact = [resume.email, resume.phone, resume.location, resume.linkedin].filter(Boolean).join(' | ');
  if (contact) lines.push(contact);
  lines.push('');

  if (resume.summary) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push(resume.summary);
    lines.push('');
  }

  if (resume.experience?.length) {
    lines.push('EXPERIENCE');
    for (const exp of resume.experience) {
      lines.push(`${exp.title} — ${exp.company} | ${exp.location || ''} | ${exp.startDate} – ${exp.endDate || 'Present'}`);
      if (exp.bullets?.length) {
        for (const b of exp.bullets) lines.push(`• ${b}`);
      }
      lines.push('');
    }
  }

  if (resume.education?.length) {
    lines.push('EDUCATION');
    for (const edu of resume.education) {
      lines.push(`${edu.degree} in ${edu.field} — ${edu.institution} (${edu.graduationDate || ''})`);
      if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
    }
    lines.push('');
  }

  if (resume.skills?.length) {
    lines.push('SKILLS');
    lines.push(resume.skills.join(', '));
    lines.push('');
  }

  if (resume.certifications?.length) {
    lines.push('CERTIFICATIONS');
    for (const cert of resume.certifications) {
      lines.push(`${cert.name} — ${cert.issuer || ''} (${cert.date || ''})`);
    }
  }

  return lines.join('\n');
}
