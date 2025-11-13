/**
 * Local Fallback Resume Parser
 * Uses: pdf-parse (PDF), mammoth (DOCX), textract (DOC/TXT)
 */
// At the top of localParser.js
import pdfParse from 'pdf-parse-new';

import fs from 'fs';
// import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import textract from 'textract';
import { promisify } from 'util';

const textractAsync = promisify(textract.fromBufferWithMime);

/**
 * Extract text from various file formats
 */
async function extractText(fileBuffer, fileName, mimeType) {
  const ext = fileName.split('.').pop().toLowerCase();
  
  try {
    // PDF extraction
    if (ext === 'pdf' || mimeType?.includes('pdf')) {
      console.log('[LocalParser] Extracting PDF...');
      const data = await pdfParse(fileBuffer);
      return data.text;
    }
    
    // DOCX extraction
    if (ext === 'docx' || mimeType?.includes('wordprocessingml')) {
      console.log('[LocalParser] Extracting DOCX...');
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    }
    
    // DOC, TXT, RTF (using textract)
    if (['doc', 'txt', 'rtf'].includes(ext)) {
      console.log('[LocalParser] Extracting with textract...');
      const text = await textractAsync(fileBuffer, mimeType || 'text/plain');
      return text;
    }
    
    throw new Error(`Unsupported file format: ${ext}`);
  } catch (error) {
    console.error('[LocalParser] Text extraction failed:', error.message);
    throw error;
  }
}

/**
 * Parse resume text using regex patterns
 */
function parseResumeText(text) {
  console.log('[LocalParser] Parsing extracted text...');
  
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  // Extract name (usually first non-empty line)
  const name = lines[0] || 'N/A';
  
  // Extract email
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  const email = emailMatch ? emailMatch[1] : '';
  
  // Extract phone
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : '';
  
  // Extract location (City, State pattern)
  const locationMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b/);
  const location = locationMatch ? `${locationMatch[1]}, ${locationMatch[2]}` : '';
  
  // Extract LinkedIn
  const linkedinMatch = text.match(/(?:linkedin\.com\/in\/)([\w-]+)/i);
  const linkedin = linkedinMatch ? `https://www.linkedin.com/in/${linkedinMatch[1]}` : '';
  
  // Extract skills (look for "SKILLS" section)
  const skills = extractSection(text, 'SKILLS', /^[A-Z\s]+:?$/);
  
  // Extract education
  const education = extractEducation(text);
  
  // Extract work experience
  const workExperience = extractWorkExperience(text);
  
  return {
    name,
    email,
    phone,
    location,
    linkedin,
    skills: skills.slice(0, 20),
    education,
    workExperience
  };
}

/**
 * Extract section content by header
 */
function extractSection(text, sectionName, headerPattern) {
  const lines = text.split(/\r?\n/);
  const sectionIndex = lines.findIndex(l => 
    l.trim().toUpperCase().includes(sectionName)
  );
  
  if (sectionIndex === -1) return [];
  
  const sectionContent = [];
  let i = sectionIndex + 1;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Stop at next section header
    if (headerPattern.test(line) && i > sectionIndex + 1) break;
    
    if (line) {
      // Split by common delimiters
      const items = line.split(/[,;•·]/);
      sectionContent.push(...items.map(s => s.trim()).filter(Boolean));
    }
    i++;
  }
  
  return sectionContent;
}

/**
 * Extract education entries
 */
function extractEducation(text) {
  const education = [];
  const eduPattern = /(Bachelor|Master|PhD|Associate|Diploma|BS|BA|MS|MA)/gi;
  const lines = text.split(/\r?\n/).map(l => l.trim());
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (eduPattern.test(line)) {
      const degree = line.match(/(Bachelor[^,\n]*|Master[^,\n]*|PhD[^,\n]*|BS[^,\n]*|BA[^,\n]*|MS[^,\n]*)/i)?.[0] || line;
      
      // Look for institution in next 2 lines
      let institution = '';
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        if (/(University|College|Institute|School)/i.test(lines[j])) {
          institution = lines[j];
          break;
        }
      }
      
      // Look for dates
      const dateMatch = line.match(/(\d{4})\s*[-–]\s*(\d{4}|Present)/i);
      const startDate = dateMatch ? `${dateMatch[1]}-01-01` : '';
      const graduationDate = dateMatch && dateMatch[2] !== 'Present' ? `${dateMatch[2]}-01-01` : '';
      
      // Extract major from "in Computer Science" pattern
      const majorMatch = line.match(/\s+in\s+([A-Z][a-zA-Z\s&]+?)(?=\s*(?:University|College|\d{4}|$))/i);
      const major = majorMatch ? majorMatch[1].trim() : '';
      
      education.push({
        degree,
        institution,
        startDate,
        graduationDate,
        major
      });
    }
  }
  
  return education;
}

/**
 * Extract work experience
 */
function extractWorkExperience(text) {
  const work = [];
  const lines = text.split(/\r?\n/).map(l => l.trim());
  
  // Look for date ranges indicating work experience
  const datePattern = /(\d{4}|[A-Z][a-z]{2,8})\s+\d{4}\s*[-–]\s*(Present|\d{4}|[A-Z][a-z]{2,8}\s+\d{4})/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (datePattern.test(line)) {
      const dateMatch = line.match(datePattern);
      
      // Extract title (usually before or after company)
      let title = '';
      let company = '';
      
      // Look backward for title/company
      for (let j = Math.max(0, i - 2); j < i; j++) {
        if (lines[j] && !/(EXPERIENCE|EDUCATION|SKILLS)/i.test(lines[j])) {
          if (!title) title = lines[j];
          else if (!company) company = lines[j];
        }
      }
      
      // Extract dates
      const startDate = dateMatch[1].match(/\d{4}/) ? 
        `${dateMatch[1].match(/\d{4}/)[0]}-01-01` : '';
      const endDate = /Present/i.test(dateMatch[2]) ? '' : 
        (dateMatch[2].match(/\d{4}/) ? `${dateMatch[2].match(/\d{4}/)[0]}-01-01` : '');
      
      // Extract description (bullets after this line)
      const description = [];
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        if (datePattern.test(lines[j])) break;
        if (lines[j].startsWith('•') || lines[j].startsWith('-')) {
          description.push(lines[j]);
        }
      }
      
      work.push({
        title: title || 'N/A',
        company: company || 'N/A',
        description: description.join('\n'),
        startDate,
        endDate: endDate || null,
        location: ''
      });
    }
  }
  
  return work;
}

/**
 * Main export: Parse with local fallback
 */
export async function parseWithLocal(fileBuffer, fileName, mimeType) {
  console.log('[LocalParser] Starting local parsing...');
  const startTime = Date.now();
  
  try {
    // Step 1: Extract text
    const text = await extractText(fileBuffer, fileName, mimeType);
    console.log(`[LocalParser] Extracted ${text.length} characters`);
    
    // Step 2: Parse text into structured data
    const parsed = parseResumeText(text);
    
    const processingTime = Date.now() - startTime;
    console.log(`[LocalParser] Parsing completed in ${processingTime}ms`);
    
    return {
      raw: {
        data: {
          candidateName: parsed.name,
          email: [parsed.email],
          phoneNumber: [parsed.phone],
          location: parsed.location,
          linkedin: parsed.linkedin,
          skills: parsed.skills.map(s => ({ name: s })),
          education: parsed.education,
          workExperience: parsed.workExperience,
          rawText: text
        },
        meta: {
          parser: 'local',
          processingTime
        }
      },
      confidence: 0.7 // Lower confidence for local parsing
    };
  } catch (error) {
    console.error('[LocalParser] Parsing failed:', error.message);
    throw error;
  }
}

export function localParserStatus() {
  return {
    available: true,
    parser: 'local',
    libraries: ['pdf-parse', 'mammoth', 'textract']
  };
}
