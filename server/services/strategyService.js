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
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO (Task 3.3 — AI Implementation):
 *
 *   Use the same OpenAI pattern as other services.
 *   The system prompt and context builder are fully written below.
 *   Implement the generateSession() method:
 *
 *   import OpenAI from 'openai';
 *   const openai = new OpenAI();
 *
 *   const response = await openai.chat.completions.create({
 *     model: 'gpt-4.1-mini',
 *     messages: [
 *       { role: 'system', content: STRATEGY_SYSTEM_PROMPT },
 *       { role: 'user', content: buildSessionPrompt(context) }
 *     ],
 *     temperature: 0.5,
 *     max_tokens: 1500,
 *   });
 *   return response.choices[0].message.content.trim();
 *
 *   Also implement the chat() method for the conversational follow-up
 *   that allows users to ask questions after receiving their session brief.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const STRATEGY_SYSTEM_PROMPT = `You are a world-class career strategist and executive coach.
Your role is to conduct a weekly strategy session for a job seeker using the Talendro platform.

You have access to their application data, response rates, and pipeline status.
Your job is to:
1. Assess the health of their job search pipeline honestly.
2. Identify what is working and what is not.
3. Provide 3 specific, actionable tactical recommendations for the coming week.
4. Give them a motivational but realistic assessment of their timeline.

Be direct, specific, and data-driven. Reference their actual numbers. Do not be generic.`;

/**
 * Build the context prompt for a strategy session.
 */
function buildSessionPrompt(context) {
  const {
    userName, targetTitles, weeklyApplications, totalApplications,
    responseRate, interviewsScheduled, offersReceived, weekNumber
  } = context;

  return `Conduct a Week ${weekNumber || '?'} strategy session for ${userName || 'this candidate'}.

PIPELINE DATA (past 7 days):
- Applications submitted this week: ${weeklyApplications || 0}
- Total applications to date: ${totalApplications || 0}
- Response rate: ${responseRate ? `${responseRate}%` : 'Unknown'}
- Interviews scheduled: ${interviewsScheduled || 0}
- Offers received: ${offersReceived || 0}
- Target roles: ${Array.isArray(targetTitles) ? targetTitles.join(', ') : (targetTitles || 'Not specified')}

Please provide the full strategy session brief now.`;
}

/**
 * Generate a weekly strategy session brief.
 * @param {Object} params
 * @param {Object} params.user        - Full user document from MongoDB
 * @param {Object} params.stats       - Application stats for the past week
 * @returns {Promise<string>} The strategy session brief as text
 */
async function generateSession({ user, stats }) {
  const context = {
    userName: user.firstName || 'Candidate',
    targetTitles: user.preferences?.targetTitles || user.jobPreferences?.targetTitles || [],
    weeklyApplications: stats?.weeklyApplications || 0,
    totalApplications: user.stats?.totalApplications || 0,
    responseRate: stats?.responseRate || null,
    interviewsScheduled: stats?.interviewsScheduled || 0,
    offersReceived: stats?.offersReceived || 0,
    weekNumber: stats?.weekNumber || null,
  };

  // ── TODO (Task 3.3): Replace stub with OpenAI implementation ─────────────
  // See the detailed instructions in the file header above.
  console.warn('[strategyService] STUB — generateSession() not yet implemented.');
  return 'Weekly strategy session is not yet implemented. See TODO in strategyService.js.';
}

/**
 * Process a conversational follow-up message during a strategy session.
 * @param {Object} params
 * @param {string} params.sessionBrief      - The generated session brief (for context)
 * @param {Array}  params.conversationHistory - Prior messages [{role, content}]
 * @param {string} params.userMessage       - The user's follow-up question
 * @returns {Promise<string>} The coach's response
 */
async function chat({ sessionBrief, conversationHistory = [], userMessage }) {
  // ── TODO (Task 3.3): Replace stub with OpenAI implementation ─────────────
  console.warn('[strategyService] STUB — chat() not yet implemented.');
  return 'Strategy session chat is not yet implemented. See TODO in strategyService.js.';
}

export default { generateSession, chat, STRATEGY_SYSTEM_PROMPT, buildSessionPrompt };
