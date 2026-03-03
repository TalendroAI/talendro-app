import express from 'express';
import OpenAI from 'openai';

const router = express.Router();
const MODEL = 'gpt-4.1-mini';

// Lazy client — initialized on first use, not at module load time
let _openai = null;
function getOpenAI() {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI not available: OPENAI_API_KEY environment variable is not set');
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

/**
 * POST /api/ai/generate-search-string
 * Generate Boolean search string via backend proxy
 */
router.post('/generate-search-string', async (req, res) => {
  try {
    const { profileData } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not configured on server');
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured on server'
      });
    }

    console.log('=== Generating Boolean Search String ===');
    console.log('Profile:', profileData.personalInfo?.fullLegalName);

    const openai = getOpenAI();
    const prompt = createBooleanPrompt(profileData);

    const response = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: 'You are an expert recruiter. Return ONLY valid JSON — no markdown, no explanation, no code blocks.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    let result = response.choices[0].message.content.trim();

    // Clean markdown if present
    result = result
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const searchString = JSON.parse(result);

    console.log('✓ Boolean search string generated');

    res.json({
      success: true,
      searchString: searchString
    });

  } catch (error) {
    console.error('Error generating search string:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create prompt for Boolean search string generation
 */
function createBooleanPrompt(profileData) {
  const workHistory = profileData.workHistory?.slice(0, 3).map((job, idx) =>
    `${idx + 1}. ${job.title || job.position} at ${job.company || job.name} (${job.startDate || job.start} - ${job.current ? 'Present' : (job.endDate || job.end)})\n   ${job.responsibilities?.substring(0, 250) || 'No description'}...`
  ).join('\n') || 'No work history';

  const education = profileData.education?.map((edu, idx) =>
    `${idx + 1}. ${edu.degreeType || edu.degree} in ${edu.fieldOfStudy || edu.field} from ${edu.institution || edu.school} (${edu.graduationDate || 'N/A'})`
  ).join('\n') || 'No education';

  const skills = profileData.skills?.join(', ') || 'No skills listed';

  return `You are an expert recruiter creating Boolean search strings for job aggregator platforms (Indeed, LinkedIn, ZipRecruiter, Glassdoor, Monster).

Generate an optimized Boolean search string based on this candidate profile:

PERSONAL INFORMATION:
- Name: ${profileData.personalInfo?.fullLegalName || 'Not provided'}
- Location: ${profileData.personalInfo?.city}, ${profileData.personalInfo?.state}

PROFESSIONAL PREFERENCES:
- Desired salary: ${profileData.professionalInfo?.desiredSalary || 'Not specified'}
- Work arrangement: ${profileData.professionalInfo?.workArrangement?.join(', ') || 'Any'}
- Willing to relocate: ${profileData.professionalInfo?.willingToRelocate || 'Unknown'}
- Travel: ${profileData.professionalInfo?.travelPercentage || 'Not specified'}

WORK HISTORY:
${workHistory}

EDUCATION:
${education}

SKILLS:
${skills}

LICENSES: ${profileData.licenses?.length || 0}
CERTIFICATIONS: ${profileData.certifications?.length || 0}

INSTRUCTIONS:
Create a Boolean search string that will find jobs matching this profile with a 75%+ match rate.
Focus on positions appropriate for someone with this experience level.

Return ONLY valid JSON (no markdown, no extra text):

{
  "booleanString": "complete Boolean search string with proper AND/OR/NOT operators",
  "explanation": "2-3 sentences explaining the search strategy",
  "estimatedMatchCount": "hundreds or thousands",
  "searchPlatforms": ["Indeed", "LinkedIn", "ZipRecruiter", "Glassdoor", "Monster"],
  "jobTitles": ["5-8 specific target job titles appropriate for experience level"],
  "keySkills": ["8-12 key skills and technologies from profile"],
  "location": "location search parameters",
  "salaryRange": "if applicable",
  "workArrangement": "remote/hybrid/onsite preferences",
  "seniorityLevel": "entry/mid/senior based on experience"
}`;
}

export default router;
