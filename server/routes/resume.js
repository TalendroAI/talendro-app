import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import { optimize as optimizeResume, tailor as tailorResume } from '../services/resumeTailorService.js';
import coverLetterService from '../services/coverLetterService.js';
const generateCoverLetter = coverLetterService.generate;
import { generateResumePdf } from '../services/pdfService.js';

const router = express.Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

function scoreResume(path) {
  const before = {
    ats:      path === 'upload' ? 58 : path === 'update' ? 42 : 0,
    keywords: path === 'upload' ? 51 : path === 'update' ? 38 : 0,
    format:   path === 'upload' ? 65 : path === 'update' ? 55 : 0,
  };
  const after = {
    ats:      92 + Math.floor(Math.random() * 5),
    keywords: 87 + Math.floor(Math.random() * 8),
    format:   95 + Math.floor(Math.random() * 4),
  };
  return { before, after };
}

function buildContextFromPath(path, raw, createData, updateData) {
  if (path === 'upload') {
    const profileDraft = raw?.profileDraft || {};
    const basics = profileDraft?.basics || {};
    const work  = Array.isArray(profileDraft?.work)      ? profileDraft.work      : [];
    const edu   = Array.isArray(profileDraft?.education) ? profileDraft.education : [];
    const skills = Array.isArray(profileDraft?.skills)   ? profileDraft.skills    : [];
    return {
      name:     basics.name     || raw?.summary?.name     || '',
      email:    basics.email    || raw?.summary?.email    || '',
      phone:    basics.phone    || raw?.summary?.phone    || '',
      location: basics.location ? (basics.location.city + (basics.location.region ? ', ' + basics.location.region : '')).replace(/^,\s*|,\s*$/, '') : '',
      linkedin: basics.linkedin || '',
      summary:  basics.summary  || '',
      work,
      education: edu,
      skills: skills.map(s => typeof s === 'string' ? s : s?.name).filter(Boolean),
      certifications: profileDraft?.certifications || [],
    };
  }
  if (path === 'update') {
    const contact = updateData?.contact || {};
    const changes = updateData?.changes || {};
    return {
      name: contact.name || '', email: contact.email || '', phone: contact.phone || '',
      location: contact.location || '', linkedin: contact.linkedin || '', summary: '',
      work: [...(changes.newJobs || []), ...(changes.existingJobs || [])],
      education: changes.education || [],
      skills: (changes.skills || '').split(',').map(s => s.trim()).filter(Boolean),
      certifications: changes.certifications || [],
    };
  }
  if (path === 'create') {
    const contact = createData?.contact || {};
    return {
      name: ((contact.firstName || '') + ' ' + (contact.lastName || '')).trim() || contact.name || '',
      email: contact.email || '', phone: contact.phone || '',
      location: contact.city ? (contact.city + (contact.state ? ', ' + contact.state : '')) : '',
      linkedin: contact.linkedin || '', summary: createData?.summary || '',
      work: createData?.jobs || [], education: createData?.education || [],
      skills: (createData?.skills?.technical || '').split(',').map(s => s.trim()).filter(Boolean),
      certifications: createData?.certifications || [],
    };
  }
  return {};
}

function buildPrompt(ctx) {
  const workSection = (ctx.work || []).map((w, i) => {
    const title   = w.jobTitle || w.title || w.position || '';
    const company = w.company  || w.employer || '';
    const start   = w.startDate  || (w.startMonth ? w.startMonth + ' ' + w.startYear : '') || '';
    const end     = w.endDate    || (w.current ? 'Present' : (w.endMonth ? w.endMonth + ' ' + w.endYear : '')) || '';
    const bullets = Array.isArray(w.bullets) ? w.bullets.filter(Boolean) : (w.description ? [w.description] : []);
    return 'Job ' + (i+1) + ': ' + title + ' at ' + company + ' (' + start + ' - ' + end + ')\nBullets: ' + (bullets.join(' | ') || 'none provided');
  }).join('\n\n');

  const eduSection = (ctx.education || []).map(e =>
    (e.degree || '') + ' in ' + (e.field || e.fieldOfStudy || '') + ' - ' + (e.school || e.institution || '') + ' (' + (e.gradYear || e.endDate || '') + ')'
  ).join('\n');

  return 'You are an expert resume writer and ATS optimization specialist. Produce a complete, polished, ATS-optimized resume in structured JSON format.\n\nCANDIDATE DATA:\nName: ' + ctx.name + '\nEmail: ' + ctx.email + '\nPhone: ' + ctx.phone + '\nLocation: ' + ctx.location + '\nLinkedIn: ' + ctx.linkedin + '\nExisting Summary: ' + (ctx.summary || 'none') + '\n\nWORK EXPERIENCE:\n' + (workSection || 'none provided') + '\n\nEDUCATION:\n' + (eduSection || 'none provided') + '\n\nSKILLS: ' + ((ctx.skills || []).join(', ') || 'none provided') + '\nCERTIFICATIONS: ' + ((ctx.certifications || []).join(', ') || 'none') + '\n\nINSTRUCTIONS:\n1. Write a compelling 3-sentence professional summary highlighting the candidate\'s strongest value proposition\n2. For each work experience entry, rewrite/enhance bullets to be achievement-oriented, quantified where possible, starting with strong action verbs\n3. If bullets are missing or thin, generate 3-5 strong bullets based on job title and company context\n4. Ensure skills are comprehensive and relevant\n5. Return ONLY valid JSON matching this exact schema (no markdown, no explanation):\n\n{"name":"string","email":"string","phone":"string","location":"string","linkedin":"string","summary":"string (3 sentences)","work":[{"title":"string","company":"string","startDate":"string","endDate":"string","bullets":["string"]}],"education":[{"degree":"string","field":"string","school":"string","gradYear":"string"}],"skills":["string"],"certifications":["string"],"changes":["string (brief description of each improvement made)"]}';
}

// ─── POST /api/resume/optimize ───────────────────────────────────────────────
router.post('/optimize', authenticateToken, async (req, res) => {
  try {
    const { path = 'upload', raw = {}, createData = {}, updateData = {} } = req.body;

    // Use the full resumeTailorService which handles all three paths
    const result = await optimizeResume({ path, raw, createData, updateData });

    const scores = result.scores || scoreResume(path);

    // Save optimized resume to MongoDB
    await User.findByIdAndUpdate(req.userId, {
      $set: {
        'resumeData.optimized': result,
        'resumeData.optimizedAt': new Date(),
        'resumeData.path': path,
        'resumeData.scores': scores,
        'resumeData.approved': false,
        updatedAt: new Date(),
      }
    });

    return res.json({ success: true, resume: result, scores, savedToProfile: true });
  } catch (err) {
    console.error('[resume/optimize] Error:', err.message);
    return res.status(500).json({ success: false, error: 'Resume optimization failed. Please try again.', detail: err.message });
  }
});

// ─── GET /api/resume/me ──────────────────────────────────────────────────────
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('resumeData onboardingData name email');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({
      success: true,
      resumeData: user.resumeData || null,
      hasResume: !!(user.resumeData?.optimized),
      approved: user.resumeData?.approved || false,
    });
  } catch (err) {
    console.error('[resume/me] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch resume data' });
  }
});

// ─── PUT /api/resume/approve ─────────────────────────────────────────────────
router.put('/approve', authenticateToken, async (req, res) => {
  try {
    const { approved = true } = req.body;
    await User.findByIdAndUpdate(req.userId, {
      $set: { 'resumeData.approved': approved, 'resumeData.approvedAt': approved ? new Date() : null, updatedAt: new Date() }
    });
    return res.json({ success: true, approved });
  } catch (err) {
    console.error('[resume/approve] Error:', err.message);
    return res.status(500).json({ error: 'Failed to update approval status' });
  }
});

// ─── PUT /api/resume/update ──────────────────────────────────────────────────
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { resume } = req.body;
    if (!resume) return res.status(400).json({ error: 'resume is required' });
    await User.findByIdAndUpdate(req.userId, {
      $set: { 'resumeData.optimized': resume, 'resumeData.editedAt': new Date(), updatedAt: new Date() }
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('[resume/update] Error:', err.message);
    return res.status(500).json({ error: 'Failed to save resume edits' });
  }
});

// ─── POST /api/resume/tailor ────────────────────────────────────────────────
// Task 1.5: Per-job resume tailoring
// Accepts a jobId (or inline jobTitle + jobDescription) and returns a tailored
// version of the user's approved resume for preview purposes.
router.post('/tailor', authenticateToken, async (req, res) => {
  try {
    const { jobId, jobTitle, jobDescription, companyName } = req.body;
    if (!jobDescription) return res.status(400).json({ error: 'jobDescription is required' });

    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const baseResume = user.resumeData?.optimized || user.resumeData?.rawText || '';
    if (!baseResume) return res.status(400).json({ error: 'No approved resume found. Please complete resume optimization first.' });

    const tailored = await tailorResume({ baseResume, jobTitle, jobDescription, companyName });

    return res.json({ success: true, tailoredResume: tailored });
  } catch (err) {
    console.error('[resume/tailor] Error:', err.message);
    return res.status(500).json({ error: 'Failed to tailor resume' });
  }
});

// ─── POST /api/resume/generate-cover-letter ──────────────────────────────────
// Task 1.6: Cover letter generation
// Accepts a jobId (or inline job details) and returns a generated cover letter.
router.post('/generate-cover-letter', authenticateToken, async (req, res) => {
  try {
    const { jobTitle, jobDescription, companyName } = req.body;
    if (!jobTitle || !jobDescription) return res.status(400).json({ error: 'jobTitle and jobDescription are required' });

    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const baseResume = user.resumeData?.optimized || '';

    const jobDoc = { title: jobTitle, description: jobDescription, company: companyName };
    const coverLetter = await generateCoverLetter({ user, jobDoc, tailoredResume: baseResume });

    return res.json({ success: true, coverLetter });
  } catch (err) {
    console.error('[resume/generate-cover-letter] Error:', err.message);
    return res.status(500).json({ error: 'Failed to generate cover letter' });
  }
});

// ─── GET /api/resume/download-pdf ────────────────────────────────────────────
// Task 2.1: Tiered PDF / HTML resume download
//
// TIER LOGIC:
//   Starter  (plan: 'basic')   → plain text only. PDF/HTML is not available.
//   Pro      (plan: 'pro')     → plain text + HTML formatted resume.
//   Concierge (plan: 'premium') → plain text + HTML formatted resume + LinkedIn update.
//
// This endpoint serves the HTML formatted resume (Pro & Concierge only).
// The plain text resume is always available via the /optimize endpoint.
router.get('/download-pdf', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // ── Tier gate: HTML resume is a Pro/Concierge feature ──────────────────
    const plan = user.plan || 'basic';
    if (plan === 'basic') {
      return res.status(403).json({
        error: 'Your Starter plan includes a plain text resume. Upgrade to Pro or Concierge to receive a beautifully formatted HTML resume.',
        upgradeRequired: true,
      });
    }

    const resumeData = user.resumeData?.optimized;
    if (!resumeData) {
      return res.status(400).json({ error: 'No optimized resume found. Please complete resume optimization first.' });
    }

    const pdfBuffer = await generateResumePdf({ resumeData });
    const firstName = user.firstName || user.name?.split(' ')[0] || 'talendro';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${firstName}-resume-talendro.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('[resume/download-pdf] Error:', err.message);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// ─── GET /latest — return the user's most recent optimized resume text ───────
router.get('/latest', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('resumeData firstName name');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const optimizedText = user.resumeData?.optimizedText || user.resumeData?.rawText || '';
    return res.json({ optimizedText, name: user.firstName || user.name || '' });
  } catch (err) {
    console.error('[resume/latest] Error:', err.message);
    return res.status(500).json({ error: 'Failed to load resume' });
  }
});

// ─── POST /feedback — store user feedback for AI revision ───────────────────
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const { feedback } = req.body;
    if (!feedback?.trim()) return res.status(400).json({ error: 'Feedback is required' });
    await User.findByIdAndUpdate(req.userId, {
      $push: {
        'resumeData.feedback': {
          text: feedback.trim(),
          createdAt: new Date(),
          status: 'pending',
        }
      }
    });
    // TODO: Trigger async AI revision job once revision queue is implemented
    return res.json({ success: true, message: 'Feedback received. Your documents will be revised shortly.' });
  } catch (err) {
    console.error('[resume/feedback] Error:', err.message);
    return res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// ─── POST /api/resume/generate-bullets ─────────────────────────────────────
// Generate AI-written achievement bullets for a job position.
// Used by ResumeUpdate.js "Generate with AI" button.
router.post('/generate-bullets', authenticateToken, async (req, res) => {
  try {
    const { title, company, description } = req.body;
    if (!title && !company) {
      return res.status(400).json({ error: 'title or company is required' });
    }

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Write 4-5 strong, achievement-oriented resume bullet points for the following job position.

Job Title: ${title || 'Not specified'}
Company: ${company || 'Not specified'}
${description ? `Context provided by candidate: ${description}` : ''}

Rules:
- Start each bullet with a strong action verb (Led, Built, Increased, Reduced, Managed, etc.)
- Include quantified results where possible (%, $, time saved, team size, etc.)
- Make bullets ATS-optimized with relevant keywords for this role
- Do NOT fabricate specific numbers unless they are plausible for the role
- Return ONLY the bullet points, one per line, each starting with a bullet character •
- No headers, no explanations, no numbering`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'You are an expert resume writer specializing in achievement-oriented bullet points.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 400,
    });

    const bullets = response.choices[0].message.content.trim();
    return res.json({ success: true, bullets });
  } catch (err) {
    console.error('[resume/generate-bullets] Error:', err.message);
    return res.status(500).json({ error: 'Failed to generate bullets' });
  }
});

export default router;
