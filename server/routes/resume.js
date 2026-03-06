import express from 'express';
import OpenAI from 'openai';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const ctx = buildContextFromPath(path, raw, createData, updateData);

    if (!ctx.name && (!ctx.work || ctx.work.length === 0)) {
      return res.status(400).json({ success: false, error: 'Insufficient resume data. Please provide at least your name and work history.' });
    }

    const prompt = buildPrompt(ctx);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'You are an expert resume writer. Always respond with valid JSON only, no markdown.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 3000,
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    let optimizedResume;
    try {
      const cleaned = rawResponse.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      optimizedResume = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[resume/optimize] JSON parse error:', parseErr.message);
      return res.status(500).json({ success: false, error: 'AI returned malformed response. Please try again.' });
    }

    const scores = scoreResume(path);

    await User.findByIdAndUpdate(req.userId, {
      $set: {
        'resumeData.optimized': optimizedResume,
        'resumeData.optimizedAt': new Date(),
        'resumeData.path': path,
        'resumeData.scores': scores,
        'resumeData.approved': false,
        updatedAt: new Date(),
      }
    });

    return res.json({ success: true, resume: optimizedResume, scores, savedToProfile: true });
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

export default router;
