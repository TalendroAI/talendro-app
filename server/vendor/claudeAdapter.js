/**
 * Claude AI Resume Parser Adapter
 * Mirrors the structure of affindaAdapter.js but uses Claude 3.5 Sonnet
 */

const ANTHROPIC_API_KEY = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

console.log('[Claude Adapter] API Key check:', { hasKey: !!ANTHROPIC_API_KEY, keyLength: ANTHROPIC_API_KEY?.length });

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const MODEL = 'claude-sonnet-4-20250514';

// PDF.js for server-side PDF parsing
import pdf from 'pdf-parse-new';

// Mammoth for DOCX parsing
import mammoth from 'mammoth';

/**
 * Check if Claude is configured
 * Reads environment variables at call-time to ensure latest values
 */
export function claudeStatus() {
  // Re-read environment at call-time for safety
  const liveKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  return {
    hasKey: !!liveKey,
    model: MODEL,
    configured: !!liveKey
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
      console.log('[CLAUDE] Extracting text from PDF...');
      const data = await pdf(buffer);
      return data.text;
    }
    
    // Handle DOCX
    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileExt === 'docx') {
      console.log('[CLAUDE] Extracting text from DOCX...');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    
    // Handle DOC (older Word format)
    if (mimetype === 'application/msword' || fileExt === 'doc') {
      console.log('[CLAUDE] Extracting text from DOC...');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    
    // Handle plain text
    if (mimetype === 'text/plain' || fileExt === 'txt') {
      console.log('[CLAUDE] Reading plain text file...');
      return buffer.toString('utf-8');
    }
    
    throw new Error(`Unsupported file type: ${mimetype} (${fileExt})`);
  } catch (error) {
    console.error('[CLAUDE] Text extraction failed:', error.message);
    throw new Error(`Failed to extract text from file: ${error.message}`);
  }
}

/**
 * Create the Claude API prompt for resume parsing
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
 * Parse resume with Claude AI
 * Matches the signature of parseWithAffinda
 */
export async function parseWithClaude(buffer, filename, mimetype) {
  console.log(`[CLAUDE] Starting parse for: ${filename}`);
  
  // Re-read environment at call-time for safety
  const liveKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
  
  // Check if Claude is configured
  if (!liveKey) {
    console.warn(`[CLAUDE] No API key configured`);
    throw new Error('Claude not available: No API key');
  }
  
  try {
    // Step 1: Extract text from file
    console.log('[CLAUDE] Step 1: Extracting text from file...');
    const resumeText = await extractText(buffer, filename, mimetype);
    console.log(`[CLAUDE] Extracted ${resumeText.length} characters of text`);
    
    if (!resumeText || resumeText.trim().length < 50) {
      throw new Error('Extracted text is too short or empty');
    }
    
    // Step 2: Call Claude API
    console.log('[CLAUDE] Step 2: Calling Claude API...');
    const prompt = createPrompt(resumeText);
    
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': liveKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorMsg = errorBody.error?.message || JSON.stringify(errorBody);
      console.error('[CLAUDE] API error:', response.status, errorMsg);
      throw new Error(`Claude API error: ${response.status} - ${errorMsg}`);
    }
    
    const result = await response.json();
    console.log('[CLAUDE] API response received');
    
    // Step 3: Extract and parse JSON from Claude's response
    const content = result.content?.[0]?.text;
    if (!content) {
      throw new Error('No content in Claude response');
    }
    
    console.log('[CLAUDE] Step 3: Parsing JSON response...');
    
    // Clean up response (remove markdown code blocks if present)
    const cleanJson = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('[CLAUDE] JSON parse error:', parseError.message);
      console.error('[CLAUDE] Raw content:', content.substring(0, 500));
      throw new Error('Failed to parse Claude JSON response');
    }
    
    console.log('[CLAUDE] ✅ Successfully parsed resume');
    console.log('[CLAUDE] Extracted:', {
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
          identifier: `claude-${Date.now()}`,
          ready: true,
          parser: 'claude-3.5-sonnet'
        }
      }
    };
    
  } catch (error) {
    console.error('[CLAUDE] Parse error:', error.message);
    throw error;
  }
}

