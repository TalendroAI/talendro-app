/**
 * linkedinService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * LinkedIn Profile Optimization Service.
 * Available exclusively to Concierge subscribers.
 *
 * Analyzes a user's LinkedIn profile and provides AI-generated recommendations
 * for improvement across key sections: headline, about, experience, skills,
 * and overall profile completeness.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO (Task 3.1 — Implementation):
 *
 *   STEP 1 — Profile Scraping:
 *   LinkedIn blocks automated scraping. The recommended approach is to ask the
 *   user to paste their profile content directly into the UI (text export).
 *   An alternative is to use the LinkedIn API (requires OAuth app approval).
 *   A third option is a third-party service like Proxycurl (paid API).
 *
 *   Recommended for MVP: Ask user to paste their profile text.
 *   The UI component (LinkedInOptimizer.js) should have a large textarea
 *   where the user pastes their full LinkedIn profile text export.
 *
 *   STEP 2 — AI Analysis:
 *   import OpenAI from 'openai';
 *   const openai = new OpenAI();
 *
 *   const response = await openai.chat.completions.create({
 *     model: 'gpt-4.1-mini',
 *     messages: [
 *       { role: 'system', content: LINKEDIN_SYSTEM_PROMPT },
 *       { role: 'user', content: buildAnalysisPrompt(profileText, user, targetRoles) }
 *     ],
 *     temperature: 0.4,
 *     max_tokens: 2000,
 *   });
 *   return JSON.parse(response.choices[0].message.content);
 * ─────────────────────────────────────────────────────────────────────────────
 */

const LINKEDIN_SYSTEM_PROMPT = `You are a LinkedIn profile optimization expert and personal branding specialist.
Your task is to analyze a LinkedIn profile and provide specific, actionable recommendations.

Return your analysis as a JSON object with this exact structure:
{
  "overallScore": <number 0-100>,
  "headline": {
    "current": "<current headline text>",
    "score": <number 0-100>,
    "recommendation": "<specific rewrite recommendation>",
    "suggestedHeadline": "<your suggested headline>"
  },
  "about": {
    "score": <number 0-100>,
    "issues": ["<issue 1>", "<issue 2>"],
    "suggestedRewrite": "<your suggested about section>"
  },
  "experience": {
    "score": <number 0-100>,
    "issues": ["<issue 1>", "<issue 2>"],
    "bulletImprovements": [{ "original": "...", "improved": "..." }]
  },
  "skills": {
    "score": <number 0-100>,
    "missingSkills": ["<skill 1>", "<skill 2>"],
    "recommendation": "<skills section recommendation>"
  },
  "keywordGaps": ["<keyword 1>", "<keyword 2>"],
  "priorityActions": ["<action 1>", "<action 2>", "<action 3>"]
}`;

function buildAnalysisPrompt(profileText, user, targetRoles) {
  const roles = Array.isArray(targetRoles) ? targetRoles.join(', ') : (targetRoles || 'Not specified');
  return `Analyze this LinkedIn profile for a candidate targeting: ${roles}

LINKEDIN PROFILE TEXT:
${profileText}

CANDIDATE'S RESUME (for cross-reference):
${user.resumeData?.optimized || 'Not available'}

Provide your full analysis as JSON.`;
}

/**
 * Analyze a LinkedIn profile and return optimization recommendations.
 * @param {Object} params
 * @param {string} params.profileText - The user's LinkedIn profile as pasted text
 * @param {Object} params.user        - Full user document from MongoDB
 * @param {Array}  params.targetRoles - Array of target job titles
 * @returns {Promise<Object>} Structured analysis object
 */
async function analyze({ profileText, user, targetRoles }) {
  if (!profileText || profileText.trim().length < 100) {
    throw new Error('Profile text is too short. Please paste your full LinkedIn profile.');
  }

  // ── TODO (Task 3.1): Replace stub with OpenAI implementation ─────────────
  // See the detailed instructions in the file header above.
  console.warn('[linkedinService] STUB — LinkedIn analysis not yet implemented.');
  return {
    overallScore: 0,
    headline: { current: '', score: 0, recommendation: 'Not yet implemented', suggestedHeadline: '' },
    about: { score: 0, issues: [], suggestedRewrite: '' },
    experience: { score: 0, issues: [], bulletImprovements: [] },
    skills: { score: 0, missingSkills: [], recommendation: '' },
    keywordGaps: [],
    priorityActions: ['LinkedIn optimization is not yet implemented. See linkedinService.js.'],
  };
}

export default { analyze, LINKEDIN_SYSTEM_PROMPT, buildAnalysisPrompt };
