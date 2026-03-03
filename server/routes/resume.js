import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
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

// Parse resume endpoint
router.post('/parse', authenticateToken, async (req, res) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: 'No resume text provided'
      });
    }

    const openai = getOpenAI();

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
          content: `Extract information from this resume and return ONLY valid JSON:

${resumeText}

Return this exact structure:

{
  "personalInfo": {
    "fullLegalName": "",
    "email": "",
    "phone": "",
    "linkedinUrl": "",
    "city": "",
    "state": "",
    "zipCode": ""
  },
  "workHistory": [
    {
      "company": "",
      "title": "",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or Present",
      "current": false
    }
  ],
  "education": [
    {
      "school": "",
      "degree": "",
      "field": "",
      "graduationDate": "YYYY-MM"
    }
  ],
  "skills": []
}

Return ONLY the JSON object, no other text.`
        }
      ]
    });

    const responseText = response.choices[0].message.content;
    const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsedData = JSON.parse(cleanJson);

    res.json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    console.error('Resume parsing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to parse resume',
      error: error.message
    });
  }
});

export default router;
