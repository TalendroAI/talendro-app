import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

    // Call Claude to parse resume
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
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
      }]
    });

    const responseText = message.content[0].text;
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



