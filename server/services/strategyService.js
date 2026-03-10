/**
 * strategyService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Weekly AI Career Strategy Session Service.
 * Available exclusively to Concierge subscribers.
 *
 * Provides a personalized, data-driven career strategy session based on:
 *   - The user's application activity over the past week
 *   - Their response rates and pipeline health
 *   - Market trends for their target roles
 *   - Specific tactical recommendations for the coming week
 * ─────────────────────────────────────────────────────────────────────────────
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = 'gpt-4.1-mini';

// ─── System Prompt ────────────────────────────────────────────────────────────

const STRATEGY_SYSTEM_PROMPT = `You are a world-class career strategist and executive coach with deep expertise in the modern job market, hiring processes, and career acceleration. You are conducting a weekly strategy session for a job seeker using the Talendro autonomous job application platform.

You have access to their real application data, response rates, and pipeline status. Your role is to:

1. Assess the health of their job search pipeline honestly and directly
2. Identify what is working and what is not — with specific evidence from their data
3. Provide exactly 3 tactical recommendations for the coming week, each with a specific action and expected outcome
4. Give a realistic timeline assessment based on their current trajectory
5. Identify any red flags (low response rate, narrow target list, weak application volume) and address them directly

FORMATTING RULES:
- Use clear section headers with **bold**
- Be specific — reference their actual numbers
- Do not be generic or vague
- Do not pad with encouragement unless it is earned by the data
- Keep the total brief to 600-800 words
- End with a single "This Week's Priority" — the one most important thing they should do`;

// ─── Session Prompt Builder ───────────────────────────────────────────────────

function buildSessionPrompt(context) {
  const {
    userName, targetTitles, targetLocations, targetIndustries,
    weeklyApplications, totalApplications, responseRate,
    interviewsScheduled, offersReceived, weekNumber,
    recentApplications, plan,
  } = context;

  const titleList = Array.isArray(targetTitles) ? targetTitles.join(', ') : (targetTitles || 'Not specified');
  const locationList = Array.isArray(targetLocations) ? targetLocations.join(', ') : (targetLocations || 'Not specified');

  let recentAppsText = '';
  if (recentApplications?.length) {
    recentAppsText = `\nRECENT APPLICATIONS (last 5):\n${recentApplications.map(a => `- ${a.title || 'Unknown'} at ${a.company || 'Unknown'} — ${a.status || 'applied'}`).join('\n')}`;
  }

  return `Conduct Week ${weekNumber || '?'} strategy session for ${userName || 'this candidate'}.

CANDIDATE PROFILE:
- Target roles: ${titleList}
- Target locations: ${locationList}
- Target industries: ${Array.isArray(targetIndustries) ? targetIndustries.join(', ') : (targetIndustries || 'Not specified')}
- Plan: Concierge

PIPELINE DATA (past 7 days):
- Applications submitted this week: ${weeklyApplications || 0}
- Total applications to date: ${totalApplications || 0}
- Response rate: ${responseRate !== null && responseRate !== undefined ? `${responseRate}%` : 'Unknown (insufficient data)'}
- Interviews scheduled: ${interviewsScheduled || 0}
- Offers received: ${offersReceived || 0}
- Weeks on platform: ${weekNumber || 'Unknown'}
${recentAppsText}

Please provide the full strategy session brief now. Be direct, data-driven, and specific.`;
}

// ─── generateSession() ────────────────────────────────────────────────────────

/**
 * Generate a weekly strategy session brief.
 * @param {Object} params
 * @param {Object} params.user  - Full user document from MongoDB
 * @param {Object} params.stats - Application stats for the past week
 * @returns {Promise<string>} The strategy session brief as markdown text
 */
async function generateSession({ user, stats }) {
  const onboarding = user.onboardingData || {};

  const context = {
    userName: user.firstName || onboarding.s1?.firstName || 'Candidate',
    targetTitles: onboarding.s8?.targetTitles || user.preferences?.targetTitles || [],
    targetLocations: onboarding.s8?.targetLocations || user.preferences?.location || [],
    targetIndustries: onboarding.s8?.targetIndustries || user.preferences?.targetIndustries || [],
    weeklyApplications: stats?.weeklyApplications || 0,
    totalApplications: stats?.totalApplications || user.stats?.totalApplications || 0,
    responseRate: stats?.responseRate ?? null,
    interviewsScheduled: stats?.interviewsScheduled || 0,
    offersReceived: stats?.offersReceived || 0,
    weekNumber: stats?.weekNumber || null,
    recentApplications: stats?.recentApplications || [],
    plan: user.plan,
  };

  const userPrompt = buildSessionPrompt(context);

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: STRATEGY_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.5,
    max_tokens: 1200,
  });

  return response.choices[0].message.content.trim();
}

// ─── chat() — Conversational Follow-Up ───────────────────────────────────────

/**
 * Process a conversational follow-up message during a strategy session.
 * @param {Object} params
 * @param {string} params.sessionBrief        - The generated session brief (for context)
 * @param {Array}  params.conversationHistory - Prior messages [{role, content}]
 * @param {string} params.userMessage         - The user's follow-up question
 * @returns {Promise<string>} The coach's response
 */
async function chat({ sessionBrief, conversationHistory = [], userMessage }) {
  const systemWithContext = sessionBrief
    ? `${STRATEGY_SYSTEM_PROMPT}\n\nCONTEXT — This week's strategy brief that was already delivered:\n\n${sessionBrief.slice(0, 1500)}\n\nThe candidate is now asking follow-up questions. Answer specifically and helpfully, referencing the brief where relevant.`
    : STRATEGY_SYSTEM_PROMPT;

  const messages = [
    { role: 'system', content: systemWithContext },
    ...conversationHistory.slice(-16),
    { role: 'user', content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.5,
    max_tokens: 700,
  });

  return response.choices[0].message.content.trim();
}

export default { generateSession, chat, STRATEGY_SYSTEM_PROMPT, buildSessionPrompt };
