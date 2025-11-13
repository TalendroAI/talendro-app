import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import { JSONResumeSchema } from './json-resume-schema.js'

// Email validation regex
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

// Phone validation regex - handles various formats
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g

// Name extraction - looks for patterns in first few lines
const NAME_PATTERNS = [
  /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*$/m,
  /^([A-Z]{2,}\s+[A-Z]{2,}(?:\s+[A-Z]{2,})?)\s*$/m,
  /^([A-Z][a-z]+(?:\s[A-Z]\.)?\s[A-Z][a-z]+)\s*$/m
]

// Education degree patterns
const DEGREE_PATTERNS = [
  /(?:Bachelor|BA|BS|B\.S\.|B\.A\.|Master|MS|MA|M\.S\.|M\.A\.|PhD|Ph\.D\.|Doctorate)\s+(?:of\s+)?(?:Science\s+)?(?:Arts\s+)?(?:in\s+)?([A-Za-z\s]+)/gi,
  /(Bachelor|Master|PhD|Ph\.D\.)\s+([A-Za-z\s,]+)/gi,
  /(B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|Ph\.?D\.?)\s*(?:in\s+)?([A-Za-z\s,]+)/gi
]

// Institution patterns
const INSTITUTION_PATTERNS = [
  /University\s+of\s+[A-Za-z\s]+/gi,
  /[A-Za-z\s]+\s+University/gi,
  /[A-Za-z\s]+\s+College/gi,
  /[A-Za-z\s]+\s+Institute/gi
]

// Job title patterns
const JOB_TITLE_PATTERNS = [
  /(?:Senior|Lead|Principal|Chief|Head|Director|Manager|Analyst|Specialist|Coordinator|Assistant|Associate|VP|Vice President)\s+[A-Za-z\s]+/gi,
  /(?:Software|Data|Product|Project|Marketing|Sales|Business|Financial|Operations|Human Resources|IT|Technical)\s+(?:Engineer|Developer|Analyst|Manager|Director|Specialist|Coordinator)/gi
]

// Company patterns  
const COMPANY_PATTERNS = [
  /\b[A-Z][A-Za-z\s&,.-]+(Inc\.|LLC|Corp\.|Corporation|Company|Ltd\.?|Limited)\b/g,
  /\b[A-Z][A-Za-z\s&.-]{2,30}(?:\s+(?:Inc|LLC|Corp|Ltd)\.?)?(?=\s|$)/g
]

// Location patterns
const LOCATION_PATTERNS = [
  /([A-Za-z\s]+),\s*([A-Z]{2})\s*,?\s*(?:USA|United States)?/g,
  /([A-Za-z\s]+),\s*([A-Za-z\s]+),\s*([A-Z]{2,3})/g,
  /([A-Za-z\s]+),\s*([A-Z]{2})\s+(\d{5})/g
]

/**
 * Extract text from PDF buffer
 */
async function extractPdfText(buffer) {
  try {
    const data = await pdfParse(buffer)
    return data.text || ''
  } catch (error) {
    console.error('PDF parsing error:', error)
    return ''
  }
}

/**
 * Extract text from DOCX buffer
 */
async function extractDocxText(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return result.value || ''
  } catch (error) {
    console.error('DOCX parsing error:', error)
    return ''
  }
}

/**
 * Extract personal information from text
 */
function extractPersonalInfo(text) {
  const info = {
    name: '',
    email: '',
    phone: '',
    location: ''
  }

  // Extract email
  const emailMatches = text.match(EMAIL_REGEX)
  if (emailMatches && emailMatches.length > 0) {
    info.email = emailMatches[0]
  }

  // Extract phone
  const phoneMatches = text.match(PHONE_REGEX)
  if (phoneMatches && phoneMatches.length > 0) {
    const match = phoneMatches[0]
    info.phone = match.replace(/[\(\)\-\s\.]/g, '').replace(/^1/, '').substring(0, 10)
    info.phone = `${info.phone.substring(0, 3)}-${info.phone.substring(3, 6)}-${info.phone.substring(6, 10)}`
  }

  // Extract name from first few lines
  const lines = text.split('\n').slice(0, 10)
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (trimmedLine.length > 0 && trimmedLine.length < 50) {
      for (const pattern of NAME_PATTERNS) {
        const match = trimmedLine.match(pattern)
        if (match) {
          info.name = match[1].trim()
          break
        }
      }
      if (info.name) break
    }
  }

  // Extract location
  const locationMatches = text.match(LOCATION_PATTERNS)
  if (locationMatches && locationMatches.length > 0) {
    info.location = locationMatches[0].trim()
  }

  return info
}

/**
 * Extract work experience from text
 */
function extractWorkExperience(text) {
  const experiences = []
  
  // Look for job titles
  const titleMatches = [...text.matchAll(JOB_TITLE_PATTERNS)]
  const companyMatches = [...text.matchAll(COMPANY_PATTERNS)]
  
  // Simple extraction - pair titles with nearby companies
  for (let i = 0; i < Math.min(titleMatches.length, 3); i++) {
    const title = titleMatches[i][0].trim()
    let company = ''
    
    // Find nearest company mention
    if (i < companyMatches.length) {
      company = companyMatches[i][0].trim()
    }
    
    if (title && title.length > 3) {
      experiences.push({
        position: title,
        name: company,
        startDate: '',
        endDate: '',
        summary: '',
        highlights: []
      })
    }
  }

  return experiences
}

/**
 * Extract education from text
 */
function extractEducation(text) {
  const education = []
  
  const degreeMatches = [...text.matchAll(DEGREE_PATTERNS[0])]
  const institutionMatches = [...text.matchAll(INSTITUTION_PATTERNS[0])]
  
  for (let i = 0; i < Math.min(degreeMatches.length, institutionMatches.length, 2); i++) {
    const degree = degreeMatches[i] ? degreeMatches[i][0].trim() : ''
    const institution = institutionMatches[i] ? institutionMatches[i][0].trim() : ''
    
    if (degree || institution) {
      education.push({
        institution: institution,
        studyType: degree,
        area: '',
        startDate: '',
        endDate: '',
        score: ''
      })
    }
  }

  return education
}

/**
 * Calculate confidence scores
 */
function calculateConfidence(jsonResume) {
  let basicScore = 0
  let workScore = 0  
  let educationScore = 0

  // Basics scoring
  if (jsonResume.basics) {
    if (jsonResume.basics.name) basicScore += 0.4
    if (jsonResume.basics.email) basicScore += 0.3
    if (jsonResume.basics.phone) basicScore += 0.2
    if (jsonResume.basics.location?.city) basicScore += 0.1
  }

  // Work experience scoring
  if (jsonResume.work && jsonResume.work.length > 0) {
    workScore = Math.min(jsonResume.work.length * 0.4, 1.0)
  }

  // Education scoring
  if (jsonResume.education && jsonResume.education.length > 0) {
    educationScore = Math.min(jsonResume.education.length * 0.5, 1.0)
  }

  const overall = (basicScore + workScore + educationScore) / 3

  return {
    overall,
    basics: basicScore,
    work: workScore,
    education: educationScore
  }
}

/**
 * Main parsing function
 */
export async function parseResumeRobust(buffer, fileName) {
  console.log(`ROBUST PARSER: Processing ${fileName} (${buffer.length} bytes)`)
  
  let rawText = ''
  
  try {
    // Determine file type and extract text
    const fileExt = fileName.toLowerCase().split('.').pop()
    
    if (fileExt === 'pdf') {
      rawText = await extractPdfText(buffer)
    } else if (fileExt === 'docx') {
      rawText = await extractDocxText(buffer) 
    } else {
      throw new Error(`Unsupported file type: ${fileExt}`)
    }

    console.log(`Extracted ${rawText.length} characters of text`)
    
    if (rawText.length < 50) {
      throw new Error('Insufficient text extracted from resume')
    }

    // Extract structured data
    const personalInfo = extractPersonalInfo(rawText)
    const workExperience = extractWorkExperience(rawText)
    const education = extractEducation(rawText)

    console.log(`Found personal info:`, personalInfo)
    console.log(`Found ${workExperience.length} work experiences`)
    console.log(`Found ${education.length} education entries`)

    // Build JSON Resume structure
    const jsonResume = {
      basics: {
        name: personalInfo.name,
        email: personalInfo.email,
        phone: personalInfo.phone,
        location: {
          city: personalInfo.location.split(',')[0]?.trim() || '',
          region: personalInfo.location.split(',')[1]?.trim() || ''
        }
      },
      work: workExperience,
      education: education,
      skills: []
    }

    // Calculate confidence scores
    const confidence = calculateConfidence(jsonResume)
    jsonResume.confidence = confidence

    // Validate with schema
    const validatedResume = JSONResumeSchema.parse(jsonResume)
    
    console.log('ROBUST PARSER: Successfully parsed resume')
    return validatedResume

  } catch (error) {
    console.error('ROBUST PARSER ERROR:', error)
    
    // Return minimal structure if parsing fails
    return {
      basics: {
        name: '',
        email: '',
        phone: '',
        location: { city: '', region: '' }
      },
      work: [],
      education: [],
      skills: [],
      confidence: {
        overall: 0,
        basics: 0,
        work: 0,
        education: 0
      }
    }
  }
}