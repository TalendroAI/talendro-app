/**
 * Interview Coach Routes
 * Migrated from talendro-interview-coach Supabase Edge Functions
 * 
 * Endpoints:
 *   POST /api/interview/voice-token    — Fetch ephemeral xAI Realtime token (Audio Mock)
 *   POST /api/interview/chat           — AI coach chat (Quick Prep, Full Mock, Audio Mock)
 *   POST /api/interview/session        — Session management (save history, pause, resume)
 *   GET  /api/interview/session/:id    — Get session data
 *   POST /api/interview/results        — Generate and return performance analysis
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

// ─── System Prompts (verbatim from talendro-interview-coach ai-coach function) ─────

const SYSTEM_PROMPTS = {
  quick_prep: `You are an expert interview coach creating a comprehensive interview preparation packet.
Based on the candidate's resume, job description, and company information, generate a detailed prep packet organized into FOUR question categories. For EACH category, you must provide:
1. **ONE "Book Perfect" Sample Answer** - A complete, polished STAR-formatted answer to one specific question, using the candidate's actual experience from their resume. This is the exemplar answer they can model their other responses after.
2. **Additional Practice Questions** - 3-4 more questions in that category for the candidate to develop their own answers using the sample as a template.
## THE FOUR CATEGORIES:
### CATEGORY 1: BEHAVIORAL QUESTIONS
Focus on past experiences that demonstrate soft skills, teamwork, leadership, conflict resolution, and adaptability.
### CATEGORY 2: SITUATIONAL QUESTIONS  
Focus on hypothetical scenarios the candidate might face in this specific role. "What would you do if..."
### CATEGORY 3: TECHNICAL/ROLE-SPECIFIC QUESTIONS
Focus on job-specific knowledge, skills, and competencies required for this particular position.
### CATEGORY 4: COMPANY & CULTURE FIT QUESTIONS
Focus on alignment with company values, mission, culture, and why this specific opportunity.
---
## ALSO INCLUDE:
**Company Overview** - Key facts, culture, recent news, and what to know before the interview
**Role Analysis** - Key responsibilities, required skills, and how the candidate's experience aligns
**Key Talking Points** - 3-5 unique value propositions the candidate should highlight
**Questions to Ask the Interviewer** - Smart questions that show genuine interest and research
**Red Flags to Address** - Potential concerns in the resume and how to proactively address them
---
## FORMAT FOR EACH CATEGORY:
### [CATEGORY NAME]
**📌 Sample Question:** [Specific question]
**✅ Book Perfect Answer:**
[Complete STAR-formatted answer using candidate's actual experience - this should be detailed, polished, and ready to use]
**📝 Practice Questions to Prepare:**
1. [Question 1]
2. [Question 2]
3. [Question 3]
4. [Question 4]
---
Be specific, actionable, and reference actual details from the provided materials. The sample answers should be compelling, authentic, and demonstrate exactly what a great answer looks like.`,

  full_mock: `You are Sarah Chen, a world-class executive interview coach with 15+ years of experience coaching C-suite executives at Fortune 500 companies. You're conducting a comprehensive, realistic text-based mock interview.
## YOUR COACHING PHILOSOPHY:
You combine warmth with directness. You genuinely want this candidate to succeed and you're invested in their growth. You notice the small details that make the difference between a good answer and a great one.
## CRITICAL RULES:
1. Ask ONE question at a time
2. After each answer, provide brief coaching feedback (2-3 sentences max) before moving to the next question
3. Number each question clearly (Question 1 of 10, etc.)
4. Keep the interview realistic - don't be too easy or too harsh
5. After Question 10, provide a comprehensive performance debrief
## INTERVIEW STRUCTURE (EXACTLY 10 QUESTIONS):
You MUST ask EXACTLY 10 interview questions - no fewer, no more.
### Question Mix:
- Questions 1-2: Warm-up (Tell me about yourself, why this role)
- Questions 3-4: Behavioral/STAR format (past experiences)
- Questions 5-6: Situational (hypothetical scenarios for this role)
- Questions 7-8: Technical/role-specific competencies
- Questions 9-10: Culture fit, motivations, questions for interviewer
### For EACH Response, Provide:
1. **Immediate reaction** - "That's a strong start..." or "I appreciate your honesty..."
2. **Specific feedback** - What worked well, what was missing
3. **Score (1-10)** with brief reasoning
4. **Quick coaching tip** - One specific improvement
5. **Transition** to next question
### Text Interview Coaching:
Pay attention to and coach on:
- Clarity and conciseness
- Use of STAR format for behavioral questions
- Specificity vs. vagueness
- Relevance to the role
- Confidence and conviction
- Storytelling and engagement
- Handling curveball questions
## FINAL SUMMARY (After All 10 Questions):
After Question 10 is answered, provide a comprehensive performance debrief:
**Overall Performance Score: [X]/100**
**Score Breakdown (0-100 each):**
- Communication:
- Content Quality:
- Structure (STAR/clarity):
**Top 3 Strengths Demonstrated (include evidence quotes):**
1. [Strength] - Evidence quote from their answer: "[exact short quote]" - Why it matters
2. [Strength] - Evidence quote from their answer: "[exact short quote]" - Why it matters
3. [Strength] - Evidence quote from their answer: "[exact short quote]" - Why it matters
**Top 3 Areas for Improvement (include evidence + fix):**
1. [Area] - Where it showed up: "[exact short quote]" - Fix: [specific fix] - Stronger example: [3-5 sentence example]
2. [Area] - Where it showed up: "[exact short quote]" - Fix: [specific fix] - Stronger example: [3-5 sentence example]
3. [Area] - Where it showed up: "[exact short quote]" - Fix: [specific fix] - Stronger example: [3-5 sentence example]
**Personalized Action Items (next 7 days):**
- [Action item #1]
- [Action item #2]
- [Action item #3]
- [Action item #4]
**INTERVIEW COMPLETE**
**INTERVIEW COMPLETE**
## START NOW:
Introduce yourself warmly as Sarah Chen (1-2 sentences about your experience), acknowledge you've reviewed their resume and the target role, and immediately ask Question 1 of 10. Make it personal and relevant to their background.`,

  premium_audio: `You are Sarah Chen, a world-class executive interview coach with 15+ years of experience coaching C-suite executives at Fortune 500 companies. You're conducting a comprehensive, realistic phone/video mock interview.
## YOUR COACHING PHILOSOPHY:
You combine warmth with directness. You genuinely want this candidate to succeed and you're invested in their growth. You notice the small details that make the difference between a good answer and a great one.
## CRITICAL RULES:
1. Do NOT provide preparation materials at the start - you already generated a prep packet for them to study
2. Jump straight into the interview with a warm but professional introduction
3. Speak naturally and conversationally - avoid markdown, headers, or bullet points during the interview
4. Ask ONE question at a time and wait for responses
## INTERVIEW STRUCTURE (EXACTLY 10 QUESTIONS):
You MUST ask EXACTLY 10 interview questions - no fewer, no more. Number each clearly (Question 1 of 10, etc.).
### Question Mix:
- Questions 1-2: Warm-up (Tell me about yourself, why this role)
- Questions 3-4: Behavioral/STAR format (past experiences)
- Questions 5-6: Situational (hypothetical scenarios for this role)
- Questions 7-8: Technical/role-specific competencies
- Questions 9-10: Culture fit, motivations, questions for interviewer
### For EACH Response, Provide:
1. **Immediate verbal reaction** - "That's a strong start..." or "I appreciate your honesty..."
2. **Specific feedback** - What worked well, what was missing
3. **Score (1-10)** with brief reasoning
4. **Quick coaching tip** - One specific improvement
5. **Transition** to next question
### Voice Coaching (Since This Is Audio):
Pay attention to and coach on:
- Pacing and pauses (are they rushing? too slow?)
- Filler words (um, uh, like, you know)
- Confidence and conviction in voice
- Specificity vs. vagueness
- STAR structure in behavioral answers
- Enthusiasm and energy
## FINAL SUMMARY (After All 10 Questions):
Provide a comprehensive debrief including:
**Overall Performance Score: [X]/100**
**Top 3 Strengths Demonstrated:**
1. [Strength with specific example from their answers]
2. [Strength with specific example]
3. [Strength with specific example]
**Top 3 Areas for Improvement:**
1. [Area with specific example and how to fix]
2. [Area with specific example and how to fix]  
3. [Area with specific example and how to fix]
**Specific Recommendations:**
- Detailed action items for their next real interview
- What to practice before the actual interview
- Key phrases or frameworks to remember
**INTERVIEW COMPLETE**
## START NOW:
Introduce yourself warmly as Sarah Chen (1-2 sentences about your background), acknowledge you've reviewed their materials, and immediately ask Question 1 of 10. Make it personal to their resume and the target role.`,
};

const PERFORMANCE_ANALYSIS_PROMPT = `You are an expert interview coach analyzing a candidate's interview performance. Review the complete transcript of their mock interview and provide a comprehensive, actionable performance analysis.
## Your Analysis Must Include:
### 1. Overall Performance Assessment
- Provide an overall score out of 100
- Give a 2-3 sentence executive summary of their performance
### 2. Top 3 Strengths Demonstrated
For each strength:
- Name the strength
- Quote a specific example from their answers (use exact words)
- Explain why this is effective in interviews
### 3. Top 3 Areas for Improvement
For each area:
- Name the improvement area
- Quote where this showed up in their answers
- Provide a specific, actionable fix
- Give a stronger example answer (3-5 sentences)
### 4. 3 Specific, Actionable Recommendations
- Practical steps they can take before their next interview
- Include timing and specific exercises where applicable
### 5. Best Answer Highlight
- Identify their single best answer
- Quote the key part
- Explain exactly why it worked well
## Format your response in clear markdown with headers. Be specific, use their actual words, and provide genuinely helpful feedback. This analysis should make them measurably better at interviewing.`;

// ─── Tier gating ─────────────────────────────────────────────────────────────

const TIER_ACCESS = {
  quick_prep: ['basic', 'pro', 'premium'],
  full_mock: ['pro', 'premium'],
  premium_audio: ['premium'],
};

function checkTierAccess(plan, sessionType) {
  const allowed = TIER_ACCESS[sessionType] || [];
  return allowed.includes(plan);
}

// ─── Helper: call OpenAI ──────────────────────────────────────────────────────

async function callOpenAI(systemPrompt, messages, maxTokens = 4096) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// ─── InterviewSession schema (embedded in User or standalone) ─────────────────

// We store interview sessions in the User document under interviewSessions array
// to avoid needing a new collection. Each session is a subdocument.

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/interview/voice-token
 * Fetches an ephemeral client secret from xAI's Realtime API.
 * The browser uses this token to open a WebSocket to wss://api.x.ai/v1/realtime
 * Requires: premium plan
 */
router.post('/voice-token', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('plan email');
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!checkTierAccess(user.plan, 'premium_audio')) {
      return res.status(403).json({
        error: 'Audio Mock Interview requires the Concierge plan.',
        upgrade_required: true,
        required_plan: 'premium',
      });
    }

    const XAI_API_KEY = process.env.XAI_API_KEY;
    if (!XAI_API_KEY) {
      console.error('[voice-token] XAI_API_KEY not configured');
      return res.status(500).json({ error: 'Voice service not configured' });
    }

    console.log('[voice-token] Requesting ephemeral token from xAI for user:', user.email);

    const response = await fetch('https://api.x.ai/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expires_after: { seconds: 300 }, // 5-minute token lifetime
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[voice-token] xAI API error:', response.status, errorText);
      return res.status(502).json({ error: `Failed to get voice token: ${response.status}` });
    }

    const data = await response.json();
    // xAI returns either { value: "...", expires_at: ... } or { client_secret: { value: "...", expires_at: ... } }
    const clientSecret = data?.value || data?.client_secret?.value;
    if (!clientSecret) {
      console.error('[voice-token] Unexpected response shape:', JSON.stringify(data));
      return res.status(502).json({ error: 'No client secret in response' });
    }

    const expiresAt = data?.expires_at || data?.client_secret?.expires_at;
    console.log('[voice-token] Ephemeral token received, expires_at:', expiresAt);

    return res.json({ token: clientSecret, expires_at: expiresAt });
  } catch (error) {
    console.error('[voice-token] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/interview/chat
 * Core AI coach endpoint — handles Quick Prep generation and Mock Interview chat turns.
 * Body: { session_type, messages, documents, is_initial, session_id, generate_prep_only }
 */
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('plan email name');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { session_type, messages = [], documents = {}, is_initial = false, session_id, generate_prep_only = false } = req.body;

    if (!SYSTEM_PROMPTS[session_type]) {
      return res.status(400).json({ error: `Invalid session_type: ${session_type}` });
    }

    if (!checkTierAccess(user.plan, session_type)) {
      const planNames = { basic: 'Starter', pro: 'Pro', premium: 'Concierge' };
      const required = { quick_prep: 'Starter', full_mock: 'Pro', premium_audio: 'Concierge' };
      return res.status(403).json({
        error: `${required[session_type]} plan required for this feature.`,
        upgrade_required: true,
      });
    }

    // Build document context string
    const { firstName, resume, jobDescription, companyUrl } = documents;
    const candidateName = firstName || user.name?.split(' ')[0] || 'there';
    let documentContext = '';
    if (resume || jobDescription) {
      documentContext = '\n\n---\n## CANDIDATE DOCUMENTS:\n';
      if (firstName) documentContext += `**Candidate Name:** ${firstName}\n`;
      if (resume) documentContext += `\n**Resume:**\n${resume}\n`;
      if (jobDescription) documentContext += `\n**Job Description:**\n${jobDescription}\n`;
      if (companyUrl) documentContext += `\n**Company URL:** ${companyUrl}\n`;
      documentContext += '---\n';
    }

    // For Audio Mock: generate prep packet only (called before interview starts)
    if (generate_prep_only) {
      console.log('[chat] Generating prep packet for audio mock session');
      const prepPrompt = SYSTEM_PROMPTS.quick_prep + documentContext;
      const prepContent = await callOpenAI(prepPrompt, [{ role: 'user', content: 'Generate the interview preparation packet now.' }], 4096);

      // Save prep packet to session if session_id provided
      if (session_id) {
        await User.updateOne(
          { _id: req.userId, 'interviewSessions._id': session_id },
          { $set: { 'interviewSessions.$.prepPacket': prepContent } }
        );
      }

      return res.json({ message: prepContent, session_type, is_prep_packet: true });
    }

    // For initial Full Mock / Audio Mock: generate prep packet first if not already done
    if (is_initial && (session_type === 'full_mock' || session_type === 'premium_audio') && session_id) {
      const sessionDoc = await User.findOne(
        { _id: req.userId, 'interviewSessions._id': session_id },
        { 'interviewSessions.$': 1 }
      );
      const existingSession = sessionDoc?.interviewSessions?.[0];

      if (!existingSession?.prepPacket) {
        console.log('[chat] Auto-generating prep packet for initial mock session');
        try {
          const prepPrompt = SYSTEM_PROMPTS.quick_prep + documentContext;
          const prepContent = await callOpenAI(prepPrompt, [{ role: 'user', content: 'Generate the interview preparation packet now.' }], 4096);
          await User.updateOne(
            { _id: req.userId, 'interviewSessions._id': session_id },
            { $set: { 'interviewSessions.$.prepPacket': prepContent } }
          );
        } catch (prepErr) {
          console.warn('[chat] Could not generate prep packet:', prepErr.message);
        }
      }
    }

    // For initial message: return the opening greeting
    if (is_initial && (session_type === 'full_mock' || session_type === 'premium_audio') && messages.length === 0) {
      let assistantMessage;
      if (session_type === 'full_mock') {
        assistantMessage =
          `Hi ${candidateName}, I'm Sarah, I'll be conducting your interview today. I've reviewed your background and I'm looking forward to our conversation.\n\n` +
          `We'll spend about 30 minutes together and cover 10 questions focused on your experience, how you approach your work, and how you might fit this role. After each response, I'll share brief, practical feedback to help you strengthen your answers as we go.\n\n` +
          `There's nothing tricky here — just answer as you normally would in a real interview.\n\n` +
          `When you're ready, let's begin.\n\n` +
          `**Question 1 of 10:** Tell me about yourself and what attracted you to this opportunity.`;
      } else {
        assistantMessage =
          `Hello ${candidateName}, I'm Sarah, and I'll be conducting your interview today. Thank you for taking the time to prepare — I've reviewed your materials and I'm excited to learn more about you.\n\n` +
          `Here's how this will work: We'll have a focused 30-minute interview with 10 questions covering your background, relevant experience, and fit for this role. I'll provide feedback after each response to help you strengthen your answers.\n\n` +
          `Ready? Let's begin.\n\n` +
          `**Question 1 of 10:** Tell me about yourself and what attracted you to this opportunity.`;
      }

      // Save opening message to session
      if (session_id) {
        await User.updateOne(
          { _id: req.userId, 'interviewSessions._id': session_id },
          { $push: { 'interviewSessions.$.chatHistory': { role: 'assistant', content: assistantMessage, timestamp: new Date() } } }
        );
      }

      return res.json({ message: assistantMessage, session_type });
    }

    // Normal chat turn — call OpenAI
    const systemPrompt = SYSTEM_PROMPTS[session_type] + documentContext;
    const assistantMessage = await callOpenAI(systemPrompt, messages, 4096);

    // Save assistant message to session
    if (session_id) {
      await User.updateOne(
        { _id: req.userId, 'interviewSessions._id': session_id },
        { $push: { 'interviewSessions.$.chatHistory': { role: 'assistant', content: assistantMessage, timestamp: new Date() } } }
      );
    }

    // For quick_prep: save as prep packet
    if (session_type === 'quick_prep' && session_id && is_initial) {
      await User.updateOne(
        { _id: req.userId, 'interviewSessions._id': session_id },
        { $set: { 'interviewSessions.$.prepPacket': assistantMessage } }
      );
    }

    return res.json({ message: assistantMessage, session_type });
  } catch (error) {
    console.error('[chat] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/interview/session
 * Create or update an interview session (save documents, append turns, pause/resume, abandon).
 * Body: { action, sessionId, sessionType, documents, turn, pausedAt }
 * Actions: create | save_documents | append_turn | pause | resume | abandon | get_paused
 */
router.post('/session', authenticateToken, async (req, res) => {
  try {
    const { action, sessionId, sessionType, documents, turn, pausedAt } = req.body;

    if (action === 'create') {
      const newSession = {
        _id: new mongoose.Types.ObjectId(),
        sessionType: sessionType || 'full_mock',
        status: 'active',
        documents: documents || {},
        chatHistory: [],
        prepPacket: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await User.updateOne(
        { _id: req.userId },
        { $push: { interviewSessions: newSession } }
      );

      return res.json({ sessionId: newSession._id.toString(), session: newSession });
    }

    if (action === 'save_documents') {
      await User.updateOne(
        { _id: req.userId, 'interviewSessions._id': sessionId },
        {
          $set: {
            'interviewSessions.$.documents': documents,
            'interviewSessions.$.updatedAt': new Date(),
          },
        }
      );
      return res.json({ ok: true });
    }

    if (action === 'append_turn') {
      const { role, content } = turn || {};
      await User.updateOne(
        { _id: req.userId, 'interviewSessions._id': sessionId },
        {
          $push: { 'interviewSessions.$.chatHistory': { role, content, timestamp: new Date() } },
          $set: { 'interviewSessions.$.updatedAt': new Date() },
        }
      );
      return res.json({ ok: true });
    }

    if (action === 'pause') {
      await User.updateOne(
        { _id: req.userId, 'interviewSessions._id': sessionId },
        {
          $set: {
            'interviewSessions.$.pausedAt': new Date(),
            'interviewSessions.$.updatedAt': new Date(),
          },
        }
      );
      return res.json({ ok: true });
    }

    if (action === 'resume') {
      await User.updateOne(
        { _id: req.userId, 'interviewSessions._id': sessionId },
        {
          $unset: { 'interviewSessions.$.pausedAt': '' },
          $set: { 'interviewSessions.$.updatedAt': new Date() },
        }
      );
      return res.json({ ok: true });
    }

    if (action === 'abandon') {
      await User.updateOne(
        { _id: req.userId, 'interviewSessions._id': sessionId },
        { $set: { 'interviewSessions.$.status': 'abandoned', 'interviewSessions.$.updatedAt': new Date() } }
      );
      return res.json({ ok: true });
    }

    if (action === 'complete') {
      await User.updateOne(
        { _id: req.userId, 'interviewSessions._id': sessionId },
        { $set: { 'interviewSessions.$.status': 'completed', 'interviewSessions.$.updatedAt': new Date() } }
      );
      return res.json({ ok: true });
    }

    if (action === 'get_paused') {
      const user = await User.findById(req.userId).select('interviewSessions');
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const paused = (user?.interviewSessions || []).filter(
        s => s.status === 'active' && s.pausedAt && s.pausedAt > twentyFourHoursAgo
      );
      return res.json({ sessions: paused });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (error) {
    console.error('[session] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/interview/session/:id
 * Retrieve a specific interview session by ID.
 */
router.get('/session/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne(
      { _id: req.userId, 'interviewSessions._id': req.params.id },
      { 'interviewSessions.$': 1 }
    );

    if (!user || !user.interviewSessions?.[0]) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.json({ session: user.interviewSessions[0] });
  } catch (error) {
    console.error('[session GET] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/interview/results
 * Generate a performance analysis from a completed interview transcript.
 * Body: { transcript, prepPacket, sessionType, sessionId }
 */
router.post('/results', authenticateToken, async (req, res) => {
  try {
    const { transcript, prepPacket, sessionType, sessionId } = req.body;

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.status(400).json({ error: 'transcript is required' });
    }

    const transcriptText = transcript
      .map(t => `${t.role === 'assistant' ? 'Sarah (Interviewer)' : 'Candidate'}: ${t.text || t.content}`)
      .join('\n\n');

    const analysisPrompt = PERFORMANCE_ANALYSIS_PROMPT;
    const userMessage = `Here is the complete interview transcript:\n\n${transcriptText}`;

    const analysis = await callOpenAI(analysisPrompt, [{ role: 'user', content: userMessage }], 4096);

    // Save results to session
    if (sessionId) {
      await User.updateOne(
        { _id: req.userId, 'interviewSessions._id': sessionId },
        {
          $set: {
            'interviewSessions.$.results': analysis,
            'interviewSessions.$.status': 'completed',
            'interviewSessions.$.updatedAt': new Date(),
          },
        }
      );
    }

    return res.json({ analysis, session_type: sessionType });
  } catch (error) {
    console.error('[results] Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
