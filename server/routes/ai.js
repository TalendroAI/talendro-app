import express from 'express';

const router = express.Router();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

/**
 * POST /api/ai/generate-search-string
 * Generate Boolean search string via backend proxy
 */
router.post('/generate-search-string', async (req, res) => {
  try {
    const { profileData } = req.body;
    
    if (!ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY not configured on server');
      return res.status(500).json({
        success: false,
        error: 'Anthropic API key not configured on server'
      });
    }
    
    console.log('=== Generating Boolean Search String ===');
    console.log('Profile:', profileData.personalInfo?.fullLegalName);
    
    // Create prompt
    const prompt = createBooleanPrompt(profileData);
    
    // Call Anthropic API from backend (no CORS issues)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API Error:', errorData);
      return res.status(response.status).json({
        success: false,
        error: errorData.error?.message || 'API request failed'
      });
    }
    
    const data = await response.json();
    let result = data.content[0].text.trim();
    
    // Clean markdown
    if (result.startsWith('```json')) {
      result = result.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
    } else if (result.startsWith('```')) {
      result = result.replace(/```\n?/g, '').trim();
    }
    
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
 * Create prompt for Claude
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
Focus on entry to mid-level positions appropriate for someone with this experience level.

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

