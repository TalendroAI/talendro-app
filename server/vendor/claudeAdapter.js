/**
 * OpenAI Resume Parser Adapter
 * Replaces the former Claude/Anthropic adapter — same interface, OpenAI backend.
 * Uses gpt-4.1-mini for cost efficiency with no quality loss for structured extraction.
 *
 * IMPORTANT: OpenAI client is initialized lazily (on first use) so that a missing
 * OPENAI_API_KEY does NOT crash the server at startup — it only fails at call time.
 */

import OpenAI from 'openai';

// PDF.js for server-side PDF parsing
import pdf from 'pdf-parse-new';

// Mammoth for DOCX parsing
import mammoth from 'mammoth';

const MODEL = 'gpt-4.1-mini';

// Lazy client — created on first use, not at module load time
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

console.log('[OpenAI Parser] Module loaded. API Key present:', !!process.env.OPENAI_API_KEY);

/**
 * Check if OpenAI is configured
 */
export function claudeStatus() {
  return {
    hasKey: !!process.env.OPENAI_API_KEY,
    model: MODEL,
    configured: !!process.env.OPENAI_API_KEY
  };
}

/**
 * Extract text from various file formats
 */
async function extractText(buffer, filename, mimetype) {
  const fileExt = filename.split('.').pop().toLowerCase();

  try {
    // Handle PDF
    if (mimetype === 'application/pdf' || fileExt === 'pdf') {
      console.log('[OPENAI PARSER] Extracting text from PDF...');
      const data = await pdf(buffer);
      return data.text;
    }

    // Handle DOCX
    if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileExt === 'docx'
    ) {
      console.log('[OPENAI PARSER] Extracting text from DOCX...');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    // Handle DOC (older Word format)
    if (mimetype === 'application/msword' || fileExt === 'doc') {
      console.log('[OPENAI PARSER] Extracting text from DOC...');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    // Handle plain text
    if (mimetype === 'text/plain' || fileExt === 'txt') {
      console.log('[OPENAI PARSER] Reading plain text file...');
      return buffer.toString('utf-8');
    }

    throw new Error(`Unsupported file type: ${mimetype} (${fileExt})`);
  } catch (error) {
    console.error('[OPENAI PARSER] Text extraction failed:', error.message);
    throw new Error(`Failed to extract text from file: ${error.message}`);
  }
}

/**
 * Create the OpenAI prompt for resume parsing
 */
function createPrompt(resumeText) {
  return `You are an expert resume parser. Extract ALL available information from this resume and return it as a JSON object.

RESUME TEXT:

${resumeText}

Extract and return ONLY a valid JSON object with this EXACT structure. If a field is not found, use empty string "" or empty array []:

{
  "candidateName": "",
  "email": [""],
  "phoneNumber": [""],
  "location": {
    "streetAddress": "",
    "city": "",
    "state": "",
    "postalCode": "",
    "county": "",
    "country": "US"
  },
  "personalDetails": {
    "preferredFirstName": "",
    "maidenName": "",
    "previousNames": "",
    "linkedinUrl": "",
    "personalWebsite": "",
    "driversLicenseNumber": "",
    "driversLicenseState": "",
    "dateOfBirth": "",
    "ssnLast4": ""
  },
  "emergencyContact": {
    "name": "",
    "relationship": "",
    "phone": "",
    "alternatePhone": ""
  },
  "workExperience": [
    {
      "jobTitle": "",
      "organization": "",
      "location": "",
      "dates": {
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD",
        "isCurrent": false
      },
      "description": ""
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "institutionAddress": "",
      "institutionCity": "",
      "institutionState": "",
      "graduationDate": "YYYY-MM-DD",
      "attendanceStartDate": "YYYY-MM-DD",
      "gpa": "",
      "major": "",
      "completedAsOfToday": false
    }
  ],
  "residentialHistory": [
    {
      "streetAddress": "",
      "city": "",
      "state": "",
      "postalCode": "",
      "fromDate": "YYYY-MM-DD",
      "toDate": "YYYY-MM-DD",
      "isCurrent": false
    }
  ],
  "skills": [""],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": "YYYY-MM-DD"
    }
  ],
  "licenses": [
    {
      "type": "",
      "number": "",
      "state": "",
      "expiration": "YYYY-MM-DD"
    }
  ]
}

IMPORTANT INSTRUCTIONS:

1. Return ONLY the JSON object, no other text before or after
2. Use exact field names as shown above
3. For dates, use format YYYY-MM-DD (e.g., "2020-01-15")
4. For current positions/addresses, set endDate/toDate to empty string "" and isCurrent to true
5. Extract ALL work experience, education, and residential history entries
6. Look for sections labeled "PERSONAL INFORMATION", "EMERGENCY CONTACT", "RESIDENTIAL HISTORY"
7. Extract preferred first name, maiden name, previous names if mentioned
8. Extract driver's license info (number and state)
9. Extract date of birth in format YYYY-MM-DD
10. Extract last 4 digits of SSN if mentioned
11. Extract county from address if mentioned
12. Extract emergency contact information if provided
13. For residential history, extract last 7 years of addresses
14. If information is not in resume, leave as empty string "" or empty array []
15. For phone numbers, format as strings in array
16. For emails, put all email addresses found in array

Return the JSON now:`;
}

/**
 * Parse resume with OpenAI
 * Matches the signature of parseWithAffinda / original parseWithClaude
 */
export async function parseWithClaude(buffer, filename, mimetype) {
  console.log(`[OPENAI PARSER] Starting parse for: ${filename}`);

  if (!process.env.OPENAI_API_KEY) {
    console.warn('[OPENAI PARSER] No OPENAI_API_KEY configured');
    throw new Error('OpenAI not available: No API key');
  }

  try {
    // Step 1: Extract text from file
    console.log('[OPENAI PARSER] Step 1: Extracting text from file...');
    const resumeText = await extractText(buffer, filename, mimetype);
    console.log(`[OPENAI PARSER] Extracted ${resumeText.length} characters of text`);

    if (!resumeText || resumeText.trim().length < 50) {
      throw new Error('Extracted text is too short or empty');
    }

    // Step 2: Call OpenAI API (lazy init)
    console.log('[OPENAI PARSER] Step 2: Calling OpenAI API...');
    const openai = getOpenAI();
    const prompt = createPrompt(resumeText);

    const response = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume data extractor. Return ONLY valid JSON — no markdown, no explanation, no code blocks.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    console.log('[OPENAI PARSER] API response received');

    // Step 3: Extract and parse JSON from OpenAI's response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    console.log('[OPENAI PARSER] Step 3: Parsing JSON response...');

    // Clean up response (remove markdown code blocks if present)
    const cleanJson = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let parsedData;
    try {
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('[OPENAI PARSER] JSON parse error:', parseError.message);
      console.error('[OPENAI PARSER] Raw content:', content.substring(0, 500));
      throw new Error('Failed to parse OpenAI JSON response');
    }

    console.log('[OPENAI PARSER] ✅ Successfully parsed resume');
    console.log('[OPENAI PARSER] Extracted:', {
      name: parsedData.candidateName || 'N/A',
      email: parsedData.email?.[0] || 'N/A',
      phone: parsedData.phoneNumber?.[0] || 'N/A',
      workCount: parsedData.workExperience?.length || 0,
      eduCount: parsedData.education?.length || 0,
      skillsCount: parsedData.skills?.length || 0
    });

    // Return in the same format as Affinda
    return {
      raw: {
        data: parsedData,
        meta: {
          identifier: `openai-${Date.now()}`,
          ready: true,
          parser: 'gpt-4.1-mini'
        }
      }
    };

  } catch (error) {
    console.error('[OPENAI PARSER] Parse error:', error.message);
    throw error;
  }
}
