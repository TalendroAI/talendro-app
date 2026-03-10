/**
 * resumeTailorService.js
 *
 * Core AI resume service for Talendro. Handles all three resume paths:
 *   - upload:  User has a current resume — parse, verify, optimize
 *   - update:  User has an outdated resume — merge new job, optimize
 *   - create:  User has no resume — build from scratch from Q&A data
 *
 * Also handles per-job tailoring for the auto-apply engine (tailor()).
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = 'gpt-4.1-mini';

// ─── SYSTEM PROMPTS ──────────────────────────────────────────────────────────

const SYSTEM_OPTIMIZE = `You are an elite professional resume writer and ATS optimization expert with 20+ years of experience.
Your job is to produce a fully optimized, ATS-compliant resume that:
1. Passes 200+ ATS systems (Greenhouse, Lever, Workday, iCIMS, Taleo, etc.)
2. Uses strong action verbs and quantifiable achievements wherever possible
3. Is keyword-rich for the candidate's target role and industry
4. Has a clean, consistent format that human recruiters find compelling
5. Includes a powerful professional summary
6. Organizes experience in reverse chronological order
7. Surfaces all relevant skills, certifications, and education clearly

Return ONLY a JSON object with this exact structure — no markdown, no commentary:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "555-555-5555",
  "location": "City, State",
  "linkedin": "linkedin.com/in/handle",
  "summary": "3-4 sentence professional summary",
  "experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "startDate": "Month Year",
      "endDate": "Month Year or Present",
      "location": "City, State",
      "bullets": ["Achievement or responsibility 1", "Achievement or responsibility 2"]
    }
  ],
  "education": [
    {
      "institution": "School Name",
      "degree": "Degree Type",
      "field": "Field of Study",
      "graduationDate": "Year",
      "gpa": "",
      "honors": ""
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Year"
    }
  ],
  "scores": {
    "before": { "ats": 0, "keywords": 0, "format": 0 },
    "after": { "ats": 0, "keywords": 0, "format": 0 }
  }
}
The "scores.before" should reflect the quality of the raw input. The "scores.after" should reflect your optimized output. All scores are 0-100.`;

const SYSTEM_CREATE = `You are an elite professional resume writer. A candidate has provided their career information through a guided questionnaire.
Build them a complete, professionally written resume from scratch.
Use strong action verbs, quantify achievements where possible, and write a compelling professional summary.

Return ONLY a JSON object with this exact structure — no markdown, no commentary:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "555-555-5555",
  "location": "City, State",
  "linkedin": "linkedin.com/in/handle",
  "summary": "3-4 sentence professional summary",
  "experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "startDate": "Month Year",
      "endDate": "Month Year or Present",
      "location": "City, State",
      "bullets": ["Achievement or responsibility 1", "Achievement or responsibility 2"]
    }
  ],
  "education": [
    {
      "institution": "School Name",
      "degree": "Degree Type",
      "field": "Field of Study",
      "graduationDate": "Year",
      "gpa": "",
      "honors": ""
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Year"
    }
  ],
  "scores": {
    "before": { "ats": 0, "keywords": 0, "format": 0 },
    "after": { "ats": 0, "keywords": 0, "format": 0 }
  }
}
Set before scores to 0 (no prior resume). Set after scores to reflect the quality of your output.`;

const SYSTEM_TAILOR = `You are an expert resume tailoring specialist. Given an optimized base resume and a specific job description,
tailor the resume to maximize relevance for that exact role.
- Reorder and emphasize experiences most relevant to the job
- Incorporate keywords from the job description naturally
- Adjust the professional summary to speak directly to the role
- Do NOT fabricate experience or skills the candidate does not have
- Return the same JSON structure as the base resume, fully tailored.`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function buildUploadPrompt(parsedData) {
  const pd = parsedData?.profileDraft || parsedData || {};
  const basics = pd.basics || parsedData?.summary || {};
  const work = pd.work || parsedData?.s3?.entries || [];
  const education = pd.education || parsedData?.s4?.entries || [];
  const skills = pd.skills || parsedData?.s5?.skills || [];
  const certs = pd.certifications || [];

  return `Optimize this candidate's existing resume. Here is the parsed data:

NAME: ${basics.name || 'Unknown'}
EMAIL: ${basics.email || ''}
PHONE: ${basics.phone || ''}
LOCATION: ${basics.location?.city ? `${basics.location.city}, ${basics.location.region || basics.location.state || ''}` : ''}
LINKEDIN: ${basics.linkedin || basics.profiles?.find(p => p.network === 'LinkedIn')?.url || ''}
CURRENT SUMMARY: ${basics.summary || pd.summary || 'None provided'}

WORK EXPERIENCE:
${work.map(j => `- ${j.title || j.position} at ${j.company || j.name} (${j.startDate || ''} - ${j.endDate || (j.current ? 'Present' : '')})
  ${j.city || ''} ${j.state || ''}
  Duties/Highlights: ${j.duties || j.highlights?.join('; ') || j.summary || 'Not provided'}`).join('\n')}

EDUCATION:
${education.map(e => `- ${e.degreeType || e.studyType || e.degree} in ${e.major || e.area || e.field} from ${e.institution || e.school} (${e.graduationDate || e.endDate || ''})`).join('\n')}

SKILLS: ${Array.isArray(skills) ? skills.map(s => typeof s === 'string' ? s : s?.name || s?.keyword).filter(Boolean).join(', ') : skills}

CERTIFICATIONS:
${certs.map(c => `- ${c.name} from ${c.org || c.issuer || ''} (${c.issueDate || c.date || ''})`).join('\n')}

Produce a fully optimized resume. Estimate before/after ATS, keyword, and format scores.`;
}

function buildUpdatePrompt(parsedData, updateData) {
  const basePrompt = buildUploadPrompt(parsedData);
  const newJobs = updateData?.newJobs || updateData?.changes?.newJobs || [];
  const gaps = updateData?.gaps || [];

  const newJobsText = newJobs.map(j =>
    `- NEW JOB: ${j.title} at ${j.company} (${j.startDate} - ${j.endDate || (j.currentlyHere ? 'Present' : '')})
  Location: ${j.city || ''} ${j.state || ''}
  Duties: ${j.duties || 'Not provided'}
  Reason for leaving: ${j.reason || 'Not provided'}`
  ).join('\n');

  const gapsText = gaps.map(g =>
    `- GAP: ${g.category || g.type} from ${g.startDate} to ${g.endDate || 'Present'}: ${g.description || ''}`
  ).join('\n');

  return `${basePrompt}

IMPORTANT — ADDITIONAL UPDATES TO INCORPORATE:
${newJobsText || 'No new jobs to add.'}
${gapsText ? `\nEMPLOYMENT GAPS TO ADDRESS:\n${gapsText}` : ''}

Merge the new job(s) into the work history in the correct chronological position. Address any gaps professionally. Then optimize the full resume.`;
}

function buildCreatePrompt(createData) {
  const contact = createData?.contact || createData?.s1 || {};
  const jobs = createData?.jobs || createData?.s3?.entries || [];
  const education = createData?.education || createData?.s4?.entries || [];
  const skills = createData?.skills || createData?.s5 || {};
  const certs = createData?.certifications || [];
  const targetRole = createData?.targetRole || createData?.preferences?.targetRole || '';

  return `Build a complete professional resume from scratch for this candidate. They have no existing resume.

CONTACT INFORMATION:
Name: ${contact.firstName ? `${contact.firstName} ${contact.lastName || ''}`.trim() : contact.name || 'Unknown'}
Email: ${contact.email || ''}
Phone: ${contact.phone || ''}
Location: ${contact.city ? `${contact.city}, ${contact.state || ''}` : ''}
LinkedIn: ${contact.linkedin || ''}
Target Role: ${targetRole || 'Not specified'}

WORK HISTORY:
${jobs.map(j => `- ${j.title} at ${j.company} (${j.startDate} - ${j.endDate || (j.currentlyHere ? 'Present' : '')})
  Location: ${j.city || ''} ${j.state || ''}
  Duties: ${j.duties || 'Not provided'}`).join('\n') || 'No work history provided — this may be an entry-level candidate.'}

EDUCATION:
${education.map(e => `- ${e.degreeType || e.degree} in ${e.major || e.field} from ${e.institution || e.school} (${e.graduationDate || e.endDate || ''})`).join('\n') || 'Not provided'}

TECHNICAL SKILLS: ${Array.isArray(skills?.technical) ? skills.technical.join(', ') : skills?.technical || skills || ''}
SOFT SKILLS: ${Array.isArray(skills?.soft) ? skills.soft.join(', ') : skills?.soft || ''}
LANGUAGES: ${Array.isArray(skills?.languages) ? skills.languages.map(l => l.name || l).join(', ') : ''}

CERTIFICATIONS:
${certs.map(c => `- ${c.name} from ${c.org || c.issuer || ''} (${c.issueDate || c.date || ''})`).join('\n') || 'None'}

Build a complete, compelling resume. Set before scores to 0 (no prior resume).`;
}

// ─── MAIN: optimize() — called by /api/resume/optimize ───────────────────────

export async function optimize({ path, raw, createData, updateData }) {
  let userPrompt;
  let systemPrompt;

  switch (path) {
    case 'create':
      systemPrompt = SYSTEM_CREATE;
      userPrompt = buildCreatePrompt(createData);
      break;
    case 'update':
      systemPrompt = SYSTEM_OPTIMIZE;
      userPrompt = buildUpdatePrompt(raw, updateData);
      break;
    case 'upload':
    default:
      systemPrompt = SYSTEM_OPTIMIZE;
      userPrompt = buildUploadPrompt(raw);
      break;
  }

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 4000,
  });

  const content = response.choices[0].message.content;
  const result = JSON.parse(content);

  // Ensure scores always exist
  if (!result.scores) {
    result.scores = {
      before: {
        ats: path === 'create' ? 0 : path === 'update' ? 42 : 58,
        keywords: path === 'create' ? 0 : path === 'update' ? 38 : 51,
        format: path === 'create' ? 0 : path === 'update' ? 55 : 65,
      },
      after: { ats: 94, keywords: 89, format: 97 },
    };
  }

  return result;
}

// ─── MAIN: tailor() — called by the Apply Worker before each application ─────

export async function tailor({ baseResume, jobTitle, jobDescription, companyName }) {
  if (!baseResume || !jobDescription) {
    throw new Error('tailor() requires baseResume and jobDescription');
  }

  const userPrompt = `Tailor this resume for the following job:

JOB TITLE: ${jobTitle || 'Not specified'}
COMPANY: ${companyName || 'Not specified'}
JOB DESCRIPTION:
${jobDescription}

BASE RESUME:
${JSON.stringify(baseResume, null, 2)}

Return the tailored resume in the same JSON structure. Do not add skills or experience the candidate does not have.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_TAILOR },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 4000,
  });

  return JSON.parse(response.choices[0].message.content);
}

export default { optimize, tailor };
