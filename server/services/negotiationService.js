/**
 * negotiationService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * AI-powered salary negotiation coaching service.
 *
 * Provides context-aware negotiation guidance based on:
 *   - The user's current/desired compensation
 *   - The job's offered salary range (if known)
 *   - The role, seniority level, and location (for market data)
 *   - The tier: Pro = text role-play, Concierge = full multi-round coaching
 *
 * Endpoints backed by this service:
 *   POST /api/negotiation/chat    — conversational coaching (role-play)
 *   POST /api/negotiation/analyze — one-shot offer analysis
 * ─────────────────────────────────────────────────────────────────────────────
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = 'gpt-4.1-mini';

// ─── System Prompt Builder ────────────────────────────────────────────────────

/**
 * Build the system prompt for the negotiation coach.
 * The context object shapes the coach's persona and knowledge.
 */
function buildSystemPrompt(context) {
  const { jobTitle, companyName, offeredSalary, desiredSalary, location, seniorityLevel, tier } = context;
  const isConcierge = tier === 'premium' || tier === 'concierge';

  const offerStr = offeredSalary
    ? `$${Number(offeredSalary).toLocaleString()}`
    : 'Not yet received';
  const targetStr = desiredSalary
    ? `$${Number(desiredSalary).toLocaleString()}`
    : 'Not specified';

  return `You are an elite salary negotiation coach with 20+ years of experience helping professionals maximize their compensation packages. You are direct, tactical, and confident. You provide exact scripts, not vague advice.

CANDIDATE CONTEXT:
- Role: ${jobTitle || 'Not specified'} at ${companyName || 'Not specified'}
- Location: ${location || 'Not specified'}
- Seniority: ${seniorityLevel || 'Not specified'}
- Offer received: ${offerStr}
- Candidate target: ${targetStr}
- Coaching mode: ${isConcierge ? 'Full multi-round negotiation coaching (Concierge)' : 'Initial counter-offer guidance (Pro)'}

YOUR COACHING APPROACH:
1. Always be specific — give exact dollar amounts, not ranges
2. Provide word-for-word scripts the candidate can use verbatim
3. Anticipate employer pushback and prepare the candidate for it
4. Remind the candidate that negotiating is expected and professional
5. Help them negotiate the full package: base, bonus, equity, PTO, remote work, signing bonus
${isConcierge ? `6. Guide through multiple rounds — initial counter, employer response, final negotiation
7. Help them evaluate competing offers and create leverage
8. Provide market data context (BLS, Glassdoor, Levels.fyi benchmarks)` : ''}

IMPORTANT: You are role-playing as the employer when the candidate asks you to simulate the other side. When role-playing as the employer, stay in character and respond as a real hiring manager would.

Start each response with the most important action the candidate should take right now.`;
}

// ─── Analyze Prompt ───────────────────────────────────────────────────────────

function buildAnalyzePrompt(context) {
  const { jobTitle, companyName, offeredSalary, desiredSalary, location, seniorityLevel } = context;

  return `Analyze this job offer and provide a complete negotiation strategy.

OFFER DETAILS:
- Role: ${jobTitle || 'Not specified'}
- Company: ${companyName || 'Not specified'}
- Location: ${location || 'Not specified'}
- Seniority: ${seniorityLevel || 'Not specified'}
- Offered salary: ${offeredSalary ? `$${Number(offeredSalary).toLocaleString()}` : 'Not provided'}
- Candidate target: ${desiredSalary ? `$${Number(desiredSalary).toLocaleString()}` : 'Not specified'}

Provide your analysis in this exact format:

**OFFER ASSESSMENT**
[Is this offer fair, below market, or above market? Cite specific market data or benchmarks. Be direct.]

**NEGOTIATION LEVERAGE**
[What leverage does this candidate have? What makes them valuable? What market conditions favor them?]

**COUNTER-OFFER RECOMMENDATION**
[Exact dollar amount to counter with. Justify the number. Include what other package elements to negotiate (bonus, equity, PTO, remote, signing bonus).]

**WORD-FOR-WORD SCRIPT**
[Provide the exact script for the counter-offer conversation — both email version and phone/verbal version.]

**EMPLOYER PUSHBACK RESPONSES**
[Prepare 3 likely employer objections and exact responses for each.]

**WALK-AWAY POINT**
[At what number should the candidate walk away? Why? What's the BATNA?]`;
}

// ─── chat() — Conversational Role-Play ───────────────────────────────────────

/**
 * Process a conversational negotiation coaching message.
 * @param {Object} params
 * @param {Object} params.context             - Negotiation context (job, salary, tier)
 * @param {Array}  params.conversationHistory - Prior messages [{role, content}]
 * @param {string} params.userMessage         - The user's latest message
 * @returns {Promise<string>} The coach's response
 */
async function chat({ context, conversationHistory = [], userMessage }) {
  const systemPrompt = buildSystemPrompt(context);

  // Build the messages array — system + history + new user message
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-20), // Keep last 20 turns to stay within context limits
    { role: 'user', content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.6,
    max_tokens: 700,
  });

  return response.choices[0].message.content.trim();
}

// ─── analyze() — One-Shot Offer Analysis ─────────────────────────────────────

/**
 * Perform a one-shot analysis of a job offer.
 * @param {Object} params
 * @param {Object} params.context - Negotiation context (job, salary, tier)
 * @returns {Promise<string>} Structured negotiation analysis in markdown
 */
async function analyze({ context }) {
  const systemPrompt = buildSystemPrompt(context);
  const userPrompt = buildAnalyzePrompt(context);

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 1200,
  });

  return response.choices[0].message.content.trim();
}

// ─── startSession() — Initialize a new coaching session ──────────────────────

/**
 * Generate an opening message from the coach to kick off a session.
 * Called when the user first opens the negotiation coach.
 */
async function startSession({ context }) {
  const { jobTitle, companyName, offeredSalary, desiredSalary, tier } = context;
  const isConcierge = tier === 'premium' || tier === 'concierge';

  const openingPrompt = offeredSalary
    ? `I've received an offer for ${jobTitle || 'a position'}${companyName ? ` at ${companyName}` : ''} for $${Number(offeredSalary).toLocaleString()}. My target is $${Number(desiredSalary || offeredSalary * 1.15).toLocaleString()}. How should I approach this negotiation?`
    : `I'm about to enter salary negotiations for ${jobTitle || 'a position'}${companyName ? ` at ${companyName}` : ''}. My target salary is $${Number(desiredSalary || 0).toLocaleString() || 'not yet determined'}. What should I know before we start?`;

  return chat({ context, conversationHistory: [], userMessage: openingPrompt });
}

export default { chat, analyze, startSession, buildSystemPrompt, buildAnalyzePrompt };
