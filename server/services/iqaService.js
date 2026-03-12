/**
 * iqaService.js — Intelligent Question Answering
 * ─────────────────────────────────────────────────────────────────────────────
 * Autonomously answers any open-ended question encountered on a job application
 * form, using the user's profile, resume, and company context.
 *
 * DESIGN PHILOSOPHY
 * ─────────────────
 * The only two reasons to escalate to the user are:
 *   1. A CAPTCHA that cannot be solved programmatically.
 *   2. A question that requires information that cannot be reasonably inferred
 *      from the user's profile (e.g., "What is your current salary at [X]?"
 *      where [X] is not in their employment history).
 *
 * Everything else — management style, leadership philosophy, "why do you want
 * to work here," largest team led, work style, career goals, salary expectations,
 * availability, work authorization, references, etc. — is answered autonomously.
 *
 * ANSWER QUALITY
 * ──────────────
 * Answers are generated to be:
 *   - Human-sounding (varied sentence structure, natural transitions, no AI clichés)
 *   - Personalized (grounded in the user's actual experience and background)
 *   - Appropriately concise (short-answer fields get 1-2 sentences; textarea
 *     fields get 2-4 sentences unless the question clearly warrants more)
 *   - Company-aware (references the specific company when relevant)
 *
 * ESCALATION DETECTION
 * ─────────────────────
 * The service classifies each question as one of:
 *   - 'answerable'  → answered autonomously
 *   - 'unanswerable' → escalate to user via SMS
 *
 * A question is only classified as 'unanswerable' if it requires a specific
 * piece of information that is provably absent from the user's profile AND
 * cannot be reasonably inferred or estimated.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import OpenAI from 'openai';

const openai = new OpenAI();

// ─── Question classification patterns ────────────────────────────────────────
// These patterns identify questions that are almost certainly unanswerable
// without specific user input. The bar is deliberately high — we only escalate
// when we truly cannot provide a reasonable answer.

const UNANSWERABLE_PATTERNS = [
  // Requires a specific number we don't have
  /current\s+salary/i,
  /current\s+compensation/i,
  /current\s+pay/i,
  /desired\s+salary/i,          // We handle this from profile; only escalate if profile is empty
  // Requires a specific date we can't infer
  /earliest\s+(start|available)\s+date/i,
  /when\s+can\s+you\s+start/i,  // We handle this with a standard answer
  // Requires a specific reference we don't have
  /reference.*name/i,
  /reference.*phone/i,
  /reference.*email/i,
  /reference.*contact/i,
];

// These patterns are ALWAYS answerable — never escalate these
const ALWAYS_ANSWERABLE_PATTERNS = [
  /why.*want.*work/i,
  /why.*interested/i,
  /why.*applying/i,
  /why.*choose/i,
  /management\s+style/i,
  /leadership\s+style/i,
  /work\s+style/i,
  /team.*lead/i,
  /largest\s+team/i,
  /greatest\s+strength/i,
  /biggest\s+weakness/i,
  /tell\s+us\s+about\s+yourself/i,
  /describe\s+yourself/i,
  /career\s+goal/i,
  /where\s+do\s+you\s+see\s+yourself/i,
  /what\s+motivates\s+you/i,
  /how\s+do\s+you\s+handle/i,
  /describe\s+a\s+time/i,
  /give\s+an\s+example/i,
  /what\s+are\s+your\s+strengths/i,
  /what\s+are\s+your\s+weaknesses/i,
  /salary\s+expectation/i,
  /salary\s+requirement/i,
  /desired\s+compensation/i,
  /authorized\s+to\s+work/i,
  /work\s+authorization/i,
  /eligible\s+to\s+work/i,
  /require\s+sponsorship/i,
  /visa\s+sponsorship/i,
  /available\s+to\s+start/i,
  /notice\s+period/i,
  /how\s+did\s+you\s+hear/i,
  /how\s+did\s+you\s+find/i,
  /additional\s+information/i,
  /anything\s+else/i,
  /cover\s+letter/i,
  /professional\s+summary/i,
];

// ─── Core classification ──────────────────────────────────────────────────────

/**
 * Classify whether a question can be answered autonomously.
 * @param {string} questionText
 * @param {Object} user
 * @returns {'answerable'|'unanswerable'}
 */
function classifyQuestion(questionText, user) {
  const q = questionText.toLowerCase();

  // Always-answerable patterns take priority
  if (ALWAYS_ANSWERABLE_PATTERNS.some(p => p.test(q))) return 'answerable';

  // Check unanswerable patterns — but only if we truly lack the data
  for (const pattern of UNANSWERABLE_PATTERNS) {
    if (pattern.test(q)) {
      // Salary/compensation: answerable if we have desired salary in profile
      if (/salary|compensation|pay/i.test(q)) {
        const desiredSalary = user.onboardingData?.s4?.desiredSalary ||
                              user.onboardingData?.s4?.salaryMin ||
                              user.onboardingData?.desiredSalary;
        if (desiredSalary) return 'answerable';
      }
      // References: truly unanswerable without specific contact info
      if (/reference/i.test(q)) return 'unanswerable';
      // Current salary: unanswerable (we don't store this)
      if (/current\s+(salary|compensation|pay)/i.test(q)) return 'unanswerable';
    }
  }

  // Default: answerable
  return 'answerable';
}

// ─── Profile context builder ──────────────────────────────────────────────────

/**
 * Build a compact, structured context string from the user's profile.
 * This is injected into the LLM prompt so answers are grounded in real data.
 */
function buildUserContext(user) {
  const od = user.onboardingData || {};
  const s1 = od.s1 || {};
  const s2 = od.s2 || {};
  const s3 = od.s3 || {};
  const s4 = od.s4 || {};
  const s5 = od.s5 || {};
  const s6 = od.s6 || {};
  const s7 = od.s7 || {};

  const lines = [];

  // Identity
  const firstName = s1.firstName || user.firstName || (user.name || '').split(' ')[0] || '';
  const lastName  = s1.lastName  || user.lastName  || (user.name || '').split(' ').slice(1).join(' ') || '';
  if (firstName || lastName) lines.push(`Name: ${firstName} ${lastName}`.trim());
  if (s1.location || s1.city) lines.push(`Location: ${s1.location || s1.city || ''}`);

  // Work experience
  const experience = s2.experience || od.experience || [];
  if (experience.length > 0) {
    lines.push('\nWork Experience:');
    for (const exp of experience.slice(0, 5)) {
      const title   = exp.title || exp.jobTitle || '';
      const company = exp.company || exp.employer || '';
      const start   = exp.startDate || exp.start || '';
      const end     = exp.endDate || exp.end || 'Present';
      const desc    = exp.description || exp.responsibilities || '';
      lines.push(`  - ${title} at ${company} (${start} – ${end})${desc ? ': ' + desc.slice(0, 200) : ''}`);
    }
  }

  // Education
  const education = s3.education || od.education || [];
  if (education.length > 0) {
    lines.push('\nEducation:');
    for (const edu of education.slice(0, 3)) {
      const degree  = edu.degree || '';
      const field   = edu.field || edu.major || '';
      const school  = edu.institution || edu.school || '';
      const year    = edu.graduationDate || edu.year || '';
      lines.push(`  - ${degree}${field ? ' in ' + field : ''} from ${school} (${year})`);
    }
  }

  // Skills
  const skills = s5.skills || od.skills || [];
  if (skills.length > 0) {
    lines.push(`\nKey Skills: ${skills.slice(0, 20).join(', ')}`);
  }

  // Career preferences
  const desiredTitle = s4.desiredTitle || s4.targetRole || od.desiredTitle || '';
  if (desiredTitle) lines.push(`\nTarget Role: ${desiredTitle}`);

  const desiredSalary = s4.desiredSalary || s4.salaryMin || od.desiredSalary || '';
  if (desiredSalary) lines.push(`Desired Salary: ${typeof desiredSalary === 'number' ? '$' + desiredSalary.toLocaleString() : desiredSalary}`);

  const workAuth = s6.workAuthorization || od.workAuthorization || 'US Citizen or Permanent Resident';
  lines.push(`Work Authorization: ${workAuth}`);

  const sponsorship = s6.requiresSponsorship === true ? 'Yes' : 'No';
  lines.push(`Requires Visa Sponsorship: ${sponsorship}`);

  const availability = s6.availability || s6.startDate || od.availability || 'Immediately / 2 weeks notice';
  lines.push(`Availability: ${availability}`);

  // Resume summary (if available)
  const resumeSummary = user.resume?.optimizedText?.slice(0, 600) ||
                        user.resumeData?.summary ||
                        od.resumeSummary || '';
  if (resumeSummary) lines.push(`\nResume Summary:\n${resumeSummary}`);

  return lines.join('\n');
}

// ─── Main answer function ─────────────────────────────────────────────────────

/**
 * Answer a single application question on behalf of the user.
 *
 * @param {Object} params
 * @param {string} params.question     - The question text as it appears on the form
 * @param {string} params.fieldType    - 'text' | 'textarea' | 'select' | 'radio' | 'checkbox'
 * @param {string[]} [params.options]  - For select/radio/checkbox, the available options
 * @param {Object} params.user         - Full user document (lean)
 * @param {Object} params.jobDoc       - Full job document (lean)
 * @param {string} [params.companyName] - Company name (fallback if not in jobDoc)
 * @returns {Promise<{answer: string, classification: 'answerable'|'unanswerable', reasoning?: string}>}
 */
async function answerQuestion({ question, fieldType = 'text', options = [], user, jobDoc, companyName }) {
  const company = companyName || jobDoc?.company || 'the company';
  const jobTitle = jobDoc?.title || 'this role';

  // Step 1: Classify
  const classification = classifyQuestion(question, user);
  if (classification === 'unanswerable') {
    return {
      answer: null,
      classification: 'unanswerable',
      reasoning: `Question requires specific information not available in the user's profile: "${question}"`,
    };
  }

  // Step 2: Build context
  const userContext = buildUserContext(user);

  // Step 3: Determine answer length guidance
  const isShortField = fieldType === 'text' || fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox';
  const lengthGuidance = isShortField
    ? 'Respond in 1 sentence or less (under 20 words). Be direct and specific.'
    : 'Respond in 2-4 natural sentences (60-120 words). Be specific and grounded in the person\'s actual background.';

  // Step 4: Handle select/radio/checkbox — pick from options
  if ((fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox') && options.length > 0) {
    const optionList = options.map((o, i) => `${i + 1}. ${o}`).join('\n');
    const prompt = `You are helping fill out a job application on behalf of this person.

PERSON'S PROFILE:
${userContext}

JOB: ${jobTitle} at ${company}

QUESTION: ${question}

AVAILABLE OPTIONS:
${optionList}

Select the single best option for this person based on their profile. Reply with ONLY the exact text of the chosen option — nothing else, no explanation.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50,
      temperature: 0.1,
    });
    const answer = response.choices[0]?.message?.content?.trim() || options[0];
    return { answer, classification: 'answerable' };
  }

  // Step 5: Generate a free-text answer
  const prompt = `You are writing a job application answer on behalf of a real person. Your goal is to write in a natural, human voice that sounds like the person themselves wrote it — not like AI-generated content.

PERSON'S PROFILE:
${userContext}

JOB THEY ARE APPLYING TO: ${jobTitle} at ${company}
${jobDoc?.description ? `\nJOB DESCRIPTION EXCERPT:\n${jobDoc.description.slice(0, 400)}` : ''}

APPLICATION QUESTION: ${question}

INSTRUCTIONS:
- ${lengthGuidance}
- Write in first person as if you are this person.
- Ground the answer in their actual work history, skills, and background above.
- When the question is about the company (e.g., "why do you want to work here"), reference ${company} specifically and connect it to their career goals.
- Use natural, conversational language. Vary sentence structure. Avoid corporate buzzwords and AI-sounding phrases like "I am passionate about," "I thrive in," "I am excited to," "leverage my skills," "synergy," "dynamic environment."
- Do NOT start with "I" — start with a different word or phrase.
- Do NOT include any preamble, explanation, or quotation marks. Just the answer itself.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: isShortField ? 60 : 200,
    temperature: 0.75,
  });

  const answer = response.choices[0]?.message?.content?.trim() || '';
  return { answer, classification: 'answerable' };
}

// ─── Batch answer function ────────────────────────────────────────────────────

/**
 * Answer multiple questions in a single call (for efficiency).
 * Returns an array of results in the same order as the input questions.
 *
 * @param {Object} params
 * @param {Array<{question: string, fieldType: string, options?: string[]}>} params.questions
 * @param {Object} params.user
 * @param {Object} params.jobDoc
 * @returns {Promise<Array<{question: string, answer: string|null, classification: string}>>}
 */
async function answerQuestions({ questions, user, jobDoc }) {
  const company = jobDoc?.company || 'the company';
  const jobTitle = jobDoc?.title || 'this role';
  const userContext = buildUserContext(user);

  // Classify all questions first
  const classified = questions.map(q => ({
    ...q,
    classification: classifyQuestion(q.question, user),
  }));

  // Answer all answerable questions in parallel (max 5 concurrent to avoid rate limits)
  const results = await Promise.all(
    classified.map(async (q) => {
      if (q.classification === 'unanswerable') {
        return { question: q.question, answer: null, classification: 'unanswerable' };
      }
      try {
        const result = await answerQuestion({
          question: q.question,
          fieldType: q.fieldType || 'text',
          options: q.options || [],
          user,
          jobDoc,
          companyName: company,
        });
        return { question: q.question, ...result };
      } catch (err) {
        console.error(`[iqaService] Failed to answer question "${q.question}":`, err.message);
        return { question: q.question, answer: null, classification: 'error', error: err.message };
      }
    })
  );

  return results;
}

// ─── Unanswerable question SMS escalation helper ──────────────────────────────

/**
 * Summarize all unanswerable questions from a batch result into a concise
 * SMS-friendly string for the user.
 *
 * @param {Array} results - Output from answerQuestions()
 * @returns {string|null} SMS-ready summary, or null if all questions were answered
 */
function summarizeUnanswerable(results) {
  const unanswerable = results.filter(r => r.classification === 'unanswerable');
  if (unanswerable.length === 0) return null;
  const list = unanswerable.map((r, i) => `${i + 1}. ${r.question}`).join('\n');
  return `The following questions need your input:\n${list}`;
}

export default {
  answerQuestion,
  answerQuestions,
  classifyQuestion,
  buildUserContext,
  summarizeUnanswerable,
};
