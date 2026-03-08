/**
 * resumeTailorService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * AI-powered per-job resume tailoring service.
 *
 * Takes a user's base (optimized) resume and a specific job description,
 * and returns a version of the resume that is customized for that job.
 * The customization focuses on:
 *   - Rewriting the professional summary to mirror the job's language
 *   - Reordering skills to surface the most relevant ones first
 *   - Adjusting bullet point emphasis to highlight the most relevant experience
 *   - Ensuring keyword density matches the job description for ATS scoring
 *
 * This service is called by applyWorker.js for every application.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO (Task 1.5 — AI Implementation):
 *
 *   The OpenAI client is already installed and configured in the project.
 *   Use the following pattern to implement the tailor() method:
 *
 *   import OpenAI from 'openai';
 *   const openai = new OpenAI();
 *
 *   const response = await openai.chat.completions.create({
 *     model: 'gpt-4.1-mini',
 *     messages: [
 *       { role: 'system', content: TAILOR_SYSTEM_PROMPT },
 *       { role: 'user', content: buildUserPrompt(baseResume, jobTitle, jobDescription, companyName) }
 *     ],
 *     temperature: 0.3,
 *     max_tokens: 2000,
 *   });
 *
 *   return response.choices[0].message.content.trim();
 *
 * Also expose a POST /api/resume/tailor endpoint in server/routes/resume.js
 * so the frontend can call it directly for preview purposes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const TAILOR_SYSTEM_PROMPT = `You are an expert resume writer and ATS optimization specialist.
Your task is to take a candidate's existing resume and tailor it specifically for a target job posting.

Rules:
- Do NOT fabricate experience, skills, or achievements that are not in the original resume.
- DO rewrite the professional summary to directly address the job's requirements.
- DO reorder the skills section to surface the most relevant skills first.
- DO adjust bullet point language to use keywords from the job description where truthful.
- DO ensure the output is clean, professional, and ATS-friendly plain text.
- Return ONLY the tailored resume text. No commentary, no preamble.`;

/**
 * Build the user prompt for the tailoring request.
 */
function buildUserPrompt(baseResume, jobTitle, jobDescription, companyName) {
  return `Please tailor the following resume for the role of "${jobTitle}" at "${companyName}".

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S CURRENT RESUME:
${baseResume}

Return the tailored resume as plain text.`;
}

/**
 * Tailor a resume for a specific job.
 * @param {Object} params
 * @param {string} params.baseResume      - The user's optimized base resume text
 * @param {string} params.jobTitle        - The title of the target job
 * @param {string} params.jobDescription  - The full job description text
 * @param {string} params.companyName     - The name of the hiring company
 * @returns {Promise<string>} The tailored resume as plain text
 */
async function tailor({ baseResume, jobTitle, jobDescription, companyName }) {
  if (!baseResume || baseResume.trim().length < 50) {
    console.warn('[resumeTailorService] Base resume is empty or too short. Returning as-is.');
    return baseResume || '';
  }

  // ── TODO (Task 1.5): Replace this stub with OpenAI implementation ─────────
  // See the detailed instructions in the file header above.
  console.warn('[resumeTailorService] STUB — AI tailoring not yet implemented. Returning base resume.');
  return baseResume;
}

export default { tailor, TAILOR_SYSTEM_PROMPT, buildUserPrompt };
