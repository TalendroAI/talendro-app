/**
 * negotiationService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * AI-powered salary negotiation coaching service.
 *
 * Provides context-aware negotiation guidance based on:
 *   - The user's current/desired compensation
 *   - The job's offered salary range (if known)
 *   - The role, seniority level, and location (for market data)
 *   - The stage of negotiation (single-round for Pro, multi-round for Concierge)
 *
 * This service backs two API endpoints:
 *   POST /api/negotiation/chat   — conversational coaching
 *   POST /api/negotiation/analyze — one-shot analysis of an offer
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO (Task 2.2 — AI Implementation):
 *
 *   Use the same OpenAI pattern as resumeTailorService.js.
 *   The system prompt below is fully written and ready to use.
 *   Implement the chat() and analyze() methods:
 *
 *   import OpenAI from 'openai';
 *   const openai = new OpenAI();
 *
 *   For chat():
 *     const response = await openai.chat.completions.create({
 *       model: 'gpt-4.1-mini',
 *       messages: [
 *         { role: 'system', content: buildSystemPrompt(context) },
 *         ...conversationHistory,
 *         { role: 'user', content: userMessage }
 *       ],
 *       temperature: 0.6,
 *       max_tokens: 600,
 *     });
 *     return response.choices[0].message.content.trim();
 *
 *   For analyze():
 *     Use a single-turn prompt with the ANALYZE_PROMPT template below.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Build the system prompt for the negotiation coach.
 * The context object shapes the coach's persona and knowledge.
 */
function buildSystemPrompt(context) {
  const { jobTitle, companyName, offeredSalary, desiredSalary, location, seniorityLevel, tier } = context;
  const isMultiRound = tier === 'concierge';

  return `You are an expert salary negotiation coach with 20 years of experience helping professionals maximize their compensation. You are direct, confident, and strategic.

CANDIDATE CONTEXT:
- Role: ${jobTitle || 'Not specified'} at ${companyName || 'Not specified'}
- Location: ${location || 'Not specified'}
- Seniority: ${seniorityLevel || 'Not specified'}
- Offer received: ${offeredSalary ? `$${offeredSalary.toLocaleString()}` : 'Not yet received'}
- Candidate target: ${desiredSalary ? `$${desiredSalary.toLocaleString()}` : 'Not specified'}
- Coaching mode: ${isMultiRound ? 'Multi-round (full negotiation support)' : 'Single-round (initial counter-offer guidance)'}

Your role is to coach the candidate through their negotiation. Be specific, tactical, and provide exact scripts they can use. Do not be vague. Do not hedge excessively. Help them get the best possible outcome.`;
}

const ANALYZE_PROMPT = `Analyze this job offer and provide a structured negotiation strategy.

Return your analysis in this format:
1. OFFER ASSESSMENT: Is this offer fair, below market, or above market? Why?
2. NEGOTIATION LEVERAGE: What leverage does the candidate have?
3. COUNTER-OFFER RECOMMENDATION: Exact dollar amount to counter with and why.
4. SCRIPT: Word-for-word script for the counter-offer conversation.
5. WALK-AWAY POINT: At what number should the candidate walk away?`;

/**
 * Process a conversational negotiation coaching message.
 * @param {Object} params
 * @param {Object} params.context           - Negotiation context (job, salary, tier)
 * @param {Array}  params.conversationHistory - Prior messages [{role, content}]
 * @param {string} params.userMessage       - The user's latest message
 * @returns {Promise<string>} The coach's response
 */
async function chat({ context, conversationHistory = [], userMessage }) {
  // ── TODO (Task 2.2): Replace stub with OpenAI implementation ─────────────
  console.warn('[negotiationService] STUB — chat() not yet implemented.');
  return 'Salary negotiation coaching is not yet implemented. See TODO in negotiationService.js.';
}

/**
 * Perform a one-shot analysis of a job offer.
 * @param {Object} params
 * @param {Object} params.context - Negotiation context (job, salary, tier)
 * @returns {Promise<string>} Structured negotiation analysis
 */
async function analyze({ context }) {
  // ── TODO (Task 2.2): Replace stub with OpenAI implementation ─────────────
  console.warn('[negotiationService] STUB — analyze() not yet implemented.');
  return 'Offer analysis is not yet implemented. See TODO in negotiationService.js.';
}

export default { chat, analyze, buildSystemPrompt, ANALYZE_PROMPT };
