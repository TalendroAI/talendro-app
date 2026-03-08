/**
 * coverLetterService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * AI-powered cover letter generation service.
 *
 * Generates a professional, personalized cover letter for each job application.
 * The letter is written in first person, addresses the specific role and company,
 * and draws from the user's profile and tailored resume to highlight the most
 * relevant experience.
 *
 * This service is called by applyWorker.js for every application.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO (Task 1.6 — AI Implementation):
 *
 *   Use the same OpenAI pattern as resumeTailorService.js:
 *
 *   import OpenAI from 'openai';
 *   const openai = new OpenAI();
 *
 *   const response = await openai.chat.completions.create({
 *     model: 'gpt-4.1-mini',
 *     messages: [
 *       { role: 'system', content: COVER_LETTER_SYSTEM_PROMPT },
 *       { role: 'user', content: buildUserPrompt(user, jobDoc, tailoredResume) }
 *     ],
 *     temperature: 0.5,
 *     max_tokens: 800,
 *   });
 *
 *   return response.choices[0].message.content.trim();
 *
 * Also expose a POST /api/resume/generate-cover-letter endpoint in
 * server/routes/resume.js so the frontend can call it for preview purposes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const COVER_LETTER_SYSTEM_PROMPT = `You are an expert career coach and professional writer.
Your task is to write a compelling, concise cover letter for a job application.

Rules:
- Write in first person from the candidate's perspective.
- Keep the letter to 3 short paragraphs (opening, value proposition, closing).
- Address the specific company and role by name.
- Do NOT use generic phrases like "I am writing to apply for..." or "To Whom It May Concern".
- Do NOT fabricate experience or skills not present in the resume.
- Return ONLY the cover letter text. No subject line, no date, no address block.`;

/**
 * Build the user prompt for cover letter generation.
 */
function buildUserPrompt(user, jobDoc, tailoredResume) {
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'the candidate';
  return `Write a cover letter for ${name} applying for the role of "${jobDoc.title}" at "${jobDoc.company}".

JOB DESCRIPTION:
${jobDoc.description}

CANDIDATE'S TAILORED RESUME:
${tailoredResume}

Write the cover letter now.`;
}

/**
 * Generate a cover letter for a specific job application.
 * @param {Object} params
 * @param {Object} params.user           - Full user document from MongoDB
 * @param {Object} params.jobDoc         - Full job document from MongoDB
 * @param {string} params.tailoredResume - The already-tailored resume for this job
 * @returns {Promise<string>} The cover letter as plain text
 */
async function generate({ user, jobDoc, tailoredResume }) {
  // ── TODO (Task 1.6): Replace this stub with OpenAI implementation ─────────
  // See the detailed instructions in the file header above.
  console.warn('[coverLetterService] STUB — AI cover letter generation not yet implemented.');
  return `Dear Hiring Team,\n\nI am excited to apply for the ${jobDoc.title} role at ${jobDoc.company}.\n\n[Cover letter generation not yet implemented — see coverLetterService.js]\n\nSincerely,\n${user.firstName || 'Applicant'}`;
}

export default { generate, COVER_LETTER_SYSTEM_PROMPT, buildUserPrompt };
