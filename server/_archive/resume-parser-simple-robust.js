// // Simple robust resume parser with mammoth for DOCX
// import fs from 'fs';
// import path from 'path';
// import mammoth from 'mammoth';


// // Enhanced DOCX text extraction using mammoth
// async function extractDocxText(buffer) {
//   try {
//     console.log('DOCX buffer length:', buffer.length);

//     // Use mammoth to extract text from DOCX
//     const result = await mammoth.extractRawText({ buffer: buffer });
//     const extractedText = result.value || '';

//     console.log('Mammoth extracted text length:', extractedText.length);
//     console.log('Mammoth text preview:', extractedText.substring(0, 300));

//     if (extractedText.length > 50) {
//       return extractedText;
//     }

//     // Fallback: try manual extraction if mammoth fails
//     console.log('Mammoth extraction insufficient, trying fallback...');
//     const text = buffer.toString('utf8');

//     // Look for XML content that contains the document text
//     const xmlMatches = text.match(/<w:document[^>]*>.*?<\/w:document>/gs);
//     if (xmlMatches) {
//       console.log('Found XML document structure');
//       const xmlContent = xmlMatches[0];

//       // Extract text from w:t elements (Word text elements)
//       const textMatches = xmlContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
//       if (textMatches) {
//         const fallbackText = textMatches
//           .map(match => match.replace(/<[^>]*>/g, ''))
//           .join(' ')
//           .replace(/\s+/g, ' ')
//           .trim();

//         console.log('Fallback extracted text length:', fallbackText.length);
//         console.log('Fallback text preview:', fallbackText.substring(0, 200));
//         return fallbackText;
//       }
//     }

//     // Last resort: extract any readable text
//     const readableText = text
//       .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
//       .replace(/\s+/g, ' ')
//       .trim();

//     console.log('Last resort text length:', readableText.length);
//     console.log('Last resort text preview:', readableText.substring(0, 200));

//     return readableText;
//   } catch (error) {
//     console.error('DOCX extraction error:', error);
//     return '';
//   }
// }


// // Simple PDF text extraction (basic approach)
// function extractPdfText(buffer) {
//   try {
//     // This is a very basic PDF text extraction
//     // In production, you'd want to use a proper PDF parser
//     const text = buffer.toString('utf8');

//     // Look for text streams in PDF
//     const textMatches = text.match(/BT\s+.*?ET/gs);
//     if (textMatches) {
//       return textMatches
//         .join(' ')
//         .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
//         .replace(/\s+/g, ' ')
//         .trim();
//     }

//     // Fallback: extract any readable text
//     return text
//       .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
//       .replace(/\s+/g, ' ')
//       .trim();
//   } catch (error) {
//     console.error('PDF extraction error:', error);
//     return '';
//   }
// }


// // Enhanced email extraction with mailto: support
// function extractEmail(text) {
//   if (!text) return '';

//   // Match mailto: links first (from Word/DOCX formatting)
//   const mailto = text.match(/mailto:([^\)\s>\]]+)/i);
//   if (mailto) {
//     const email = mailto[1].trim();
//     console.log(`Found email from mailto: "${email}"`);
//     return email;
//   }

//   // Match plain email addresses
//   const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;
//   const matches = [...text.matchAll(emailPattern)];

//   for (const match of matches) {
//     const email = (match[1] || '').toLowerCase();
//     if (!email.includes('example') && !email.includes('test') && !email.includes('noreply')) {
//       console.log(`Found email: "${email}"`);
//       return email;
//     }
//   }

//   return '';
// }


// // ✅ FIX #1: Enhanced phone extraction with (678) 333-7386 format support
// function extractPhone(text) {
//   if (!text) return '';

//   // Remove extra spaces for better matching
//   const cleaned = text.replace(/\s+/g, ' ');

//   const phonePatterns = [
//     /\((\d{3})\)\s*(\d{3})-(\d{4})/g,  // ✅ (678) 333-7386
//     /\b(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})\b/g,
//     /\b(\+1[-.\s]?)?(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})\b/g
//   ];

//   for (const pattern of phonePatterns) {
//     const matches = [...cleaned.matchAll(pattern)];
//     for (const match of matches) {
//       // Reconstruct phone in standard format
//       if (match[1] && match[2] && match[3]) {
//         const phone = `(${match[1]}) ${match[2]}-${match[3]}`;
//         console.log(`Found phone: "${phone}"`);
//         return phone;
//       }
//       // Fallback: just clean what we matched
//       let phone = match[0].replace(/[^\d]/g, '');
//       if (phone.length === 10 || phone.length === 11) {
//         if (phone.length === 11 && phone.startsWith('1')) {
//           phone = phone.substring(1);
//         }
//         if (phone.length === 10) {
//           const formatted = `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`;
//           console.log(`Found phone: "${formatted}"`);
//           return formatted;
//         }
//       }
//     }
//   }

//   return '';
// }


// // Enhanced name extraction
// function extractName(text) {
//   console.log('Extracting name from text length:', text.length);
//   console.log('Text preview for name extraction:', text.substring(0, 300));

//   // Look for name-like patterns in the first part of the document
//   const lines = text.split(/\n|\r/).filter(l => l.trim()).slice(0, 15);
//   console.log('First 15 non-empty lines for name extraction:', lines.slice(0, 5));

//   for (const line of lines) {
//     const cleanLine = line.trim();
//     if (cleanLine.length > 5 && cleanLine.length < 50) {
//       // Check if it looks like a name (2-3 words, proper case)
//       const words = cleanLine.split(/\s+/);
//       if (words.length >= 2 && words.length <= 4) {
//         const allProperCase = words.every(word =>
//           word.length > 0 &&
//           /^[A-Za-z\s\.]+$/.test(word)
//         );
//         if (allProperCase &&
//           !cleanLine.includes('@') &&
//           !cleanLine.includes('http') &&
//           !cleanLine.toLowerCase().includes('phone') &&
//           !cleanLine.toLowerCase().includes('email') &&
//           !cleanLine.toLowerCase().includes('summary') &&
//           !cleanLine.toLowerCase().includes('professional')) {
//           console.log(`Found potential name: "${cleanLine}"`);
//           return cleanLine;
//         }
//       }
//     }
//   }

//   // If we still haven't found anything, look for common name patterns
//   const namePatterns = [
//     /^([A-Z][a-z]+\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/m,
//     /^([A-Z]\.\s*[A-Z][a-z]+\s+[A-Z][a-z]+)\s*$/m
//   ];

//   for (const pattern of namePatterns) {
//     const match = text.match(pattern);
//     if (match) {
//       const name = (match[1] || '').trim();
//       if (name.length >= 5 && name.length <= 30) {
//         console.log(`Found name via pattern: "${name}"`);
//         return name;
//       }
//     }
//   }

//   console.log('No name found');
//   return '';
// }


// // ✅ FIX #2: Enhanced location extraction - skips first line and filters out names
// function extractLocation(text) {
//   const lines = text.split(/\n|\r/).map(l => l.trim()).filter(l => l);

//   // Skip the first line (name)
//   const searchLines = lines.slice(1).join('\n');

//   const locationPatterns = [
//     /\b([A-Za-z\s]+),\s*([A-Z]{2})\b/g,  // City, ST format
//     /\b(Oviedo|McLean|Orlando|Tampa|Miami|Atlanta),?\s*(FL|VA|GA|TX|CA|NY)\b/gi
//   ];

//   for (const pattern of locationPatterns) {
//     const matches = [...searchLines.matchAll(pattern)];
//     for (const match of matches) {
//       const city = match[1].trim();
//       const state = match[2] ? match[2].trim().toUpperCase() : '';

//       // Skip if city is an email domain or looks like a name
//       if (city.length >= 3 && city.length <= 30 && !/[@\.]/.test(city) &&
//         !/(JACKSON|SIMONE)/i.test(city)) {
//         console.log(`Found location: "${city}, ${state}"`);
//         return {
//           full: `${city}, ${state}`,
//           city: city,
//           state: state,
//           country: 'USA'
//         };
//       }
//     }
//   }

//   return { full: '', city: '', state: '', country: 'USA' };
// }



// // ✅ ENHANCED: Work experience extraction with section header guards and date normalization
// function extractWorkExperience(text) {
//   const experience = [];
//   const lines = text.split(/\n|\r/).map(l => l.trim()).filter(l => l);

//   let inExperienceSection = false;
//   let currentJob = null;

//   // Helpers
//   const pushCurrent = () => {
//     if (currentJob && currentJob.company && currentJob.jobTitle) {
//       // Clean up description
//       currentJob.description = currentJob.description.trim();
//       experience.push(currentJob);
//       console.log(`    ✅ Saved job: ${currentJob.jobTitle} at ${currentJob.company}`);
//     }
//     currentJob = null;
//   };

//   const normalizeSeasonOrMonthYear = (s) => {
//     if (!s) return '';
//     const season = s.toLowerCase().match(/(spring|summer|fall|autumn|winter)\s+(\d{4})/i);
//     if (season) {
//       const m = { spring: '03', summer: '06', fall: '09', autumn: '09', winter: '12' }[season[1].toLowerCase()];
//       return `${season[2]}-${m}-01`;
//     }
//     // Try Date
//     const d = new Date(s);
//     if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
//     // Fallback if only year
//     const year = s.match(/\b(\d{4})\b/);
//     if (year) return `${year[1]}-01-01`;
//     return '';
//   };

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];

//     // Section start
//     if (/^(EXPERIENCE|WORK HISTORY|EMPLOYMENT|PROFESSIONAL EXPERIENCE)$/i.test(line)) {
//       inExperienceSection = true;
//       console.log('✅ Found EXPERIENCE section at line', i);
//       continue;
//     }

//     // Stop at major sections
//     if (inExperienceSection && /^(EDUCATION|SKILLS|CERTIFICATIONS|AWARDS)$/i.test(line)) {
//       pushCurrent();
//       console.log(`⚠️ Stopping at major section: ${line}`);
//       break;
//     }

//     // ✅ NEW: Stop description accumulation at subsections like SERVICE LEARNING, INVOLVEMENT
//     if (inExperienceSection && /^(SERVICE( LEARNING)?|INVOLVEMENT|LEADERSHIP|VOLUNTEER)$/i.test(line)) {
//       pushCurrent();
//       console.log(`⚠️ Stopping at subsection: ${line}`);
//       continue;
//     }

//     if (!inExperienceSection) continue;
//     if (line.length < 4) continue;

//     console.log(`  [Line ${i}] Processing: "${line.substring(0, 80)}..."`);

//     // Pattern A: Compact single-line job
//     // Example: Shoe Station, Oviedo, FL Store Associate - Part-time, June 2024 – Present
//     const compactMatch = line.match(/^([A-Za-z0-9&'().\s\-]+),\s*([A-Za-z\.\s]+),\s*([A-Z]{2})\s+([^,]+),\s+(.+?)$/);
//     if (compactMatch) {
//       pushCurrent(); // close previous

//       const company = compactMatch[1].trim();
//       const jobTitle = compactMatch[4].trim();
//       const dateStr = compactMatch[5].trim();

//       // Dates: Month Year – Present | Month Year – Month Year | Month Year
//       let start = '', end = null, current = false;
//       const range = dateStr.match(/([\w]+\s+\d{4})\s*[–—-]\s*(Present|Current|[\w]+\s+\d{4})/i);
//       if (range) {
//         start = normalizeSeasonOrMonthYear(range[1]);
//         const right = range[2];
//         current = /present|current/i.test(right);
//         end = current ? null : normalizeSeasonOrMonthYear(right);
//       } else {
//         start = normalizeSeasonOrMonthYear(dateStr);
//         current = false;
//         end = '';
//       }

//       currentJob = {
//         company,
//         jobTitle,
//         startDate: start,
//         endDate: end,
//         current,
//         description: ''
//       };
//       console.log(`    🏢 COMPACT JOB: ${jobTitle} @ ${company} (${start} → ${current ? 'Present' : (end || '')})`);
//       continue;
//     }

//     // Pattern B: Two-line job (company on one line, title+dates next)
//     const companyLocMatch = line.match(/^([A-Za-z0-9&'().\s\-]+),\s*([A-Za-z\.\s]+),\s*([A-Z]{2})$/);
//     if (companyLocMatch) {
//       pushCurrent(); // save previous job
//       currentJob = {
//         company: companyLocMatch[1].trim(),
//         jobTitle: '',
//         startDate: '',
//         endDate: '',
//         current: false,
//         description: ''
//       };
//       console.log(`    🏢 NEW COMPANY: "${currentJob.company}"`);
//       continue;
//     }

//     // Title + Dates line for Pattern B
//     if (currentJob && !currentJob.jobTitle) {
//       const titleDates = line.match(/^([^,]+),\s*(.+)$/);
//       if (titleDates) {
//         currentJob.jobTitle = titleDates[1].trim();
//         const dateStr = titleDates[2].trim();

//         let start = '', end = null, current = false;
//         const range = dateStr.match(/([\w]+\s+\d{4})\s*[–—-]\s*(Present|Current|[\w]+\s+\d{4})/i);
//         if (range) {
//           start = normalizeSeasonOrMonthYear(range[1]);
//           const right = range[2];
//           current = /present|current/i.test(right);
//           end = current ? null : normalizeSeasonOrMonthYear(right);
//         } else {
//           start = normalizeSeasonOrMonthYear(dateStr);
//           current = false;
//           end = '';
//         }

//         currentJob.startDate = start;
//         currentJob.endDate = end;
//         currentJob.current = current;

//         console.log(`    💼 TITLE: "${currentJob.jobTitle}" (${start} → ${current ? 'Present' : (end || '')})`);
//         continue;
//       }
//     }

//     // ✅ IMPROVED: Bullets / free text enrich description (with guards)
//     if (currentJob && currentJob.jobTitle) {
//       // Skip all-caps section headers
//       if (/^[A-Z\s]{5,}$/.test(line)) {
//         console.log(`    ⚠️ Skipping all-caps header: "${line}"`);
//         continue;
//       }
      
//       if (/^[•\-·]/.test(line)) {
//         const clean = line.replace(/^[•\-·]\s*/, '').trim();
//         currentJob.description += clean + ' ';
//       } else if (/^[A-Z]/.test(line) && line.length < 200) {
//         // Only add short descriptive lines, not section headers
//         currentJob.description += line.trim() + ' ';
//       }
//     }
//   }

//   // Save last job if any
//   pushCurrent();

//   console.log(`📊 Total extracted work experiences: ${experience.length}`);
//   experience.forEach((job, idx) => {
//     console.log(`  Job ${idx + 1}: ${job.company} - ${job.jobTitle} (${job.startDate || 'no date'})`);
//   });

//   return experience;
// }



// // Enhanced education extraction
// // ✅ COMPLETE REWRITE: extractEducation for compact single-line format
// function extractEducation(text) {
//   const education = [];
//   const lines = text.split(/\n|\r/).map(l => l.trim()).filter(l => l);
  
//   let inEducationSection = false;
  
//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];
    
//     // Detect EDUCATION section
//     if (/^(EDUCATION|ACADEMIC|QUALIFICATIONS)$/i.test(line)) {
//       inEducationSection = true;
//       console.log('✅ Found EDUCATION section');
//       continue;
//     }
    
//     // Stop at next major section
//     if (inEducationSection && /^(EXPERIENCE|SKILLS|CERTIFICATIONS|PROJECTS|INVOLVEMENT|SERVICE)$/i.test(line)) {
//       console.log(`⚠️ Stopping education parsing at section: ${line}`);
//       break;
//     }
    
//     if (inEducationSection && line.length > 15) {
//       // Pattern: "Eckerd College, St. Petersburg, FL BA, Marketing & Communications, 2024"
//       // Format: Institution, City, ST Degree, Major, Year
//       const compactMatch = line.match(/^([A-Za-z\s&]+),\s*([A-Za-z\s\.]+),\s*([A-Z]{2})\s+(B\.?A\.?|B\.?S\.?|M\.?A\.?|M\.?S\.?|MBA|AA|A\.?S\.?|PhD),?\s*([^,]+),\s*(\d{4})$/i);
      
//       if (compactMatch) {
//         const institution = compactMatch[1].trim();
//         const city = compactMatch[2].trim();
//         const state = compactMatch[3].trim();
//         const degree = compactMatch[4].trim();
//         const major = compactMatch[5].trim();
//         const year = compactMatch[6].trim();
        
//         education.push({
//           institution: institution,
//           city: city,
//           state: state,
//           studyType: degree,
//           area: major,
//           dates: year,
//           score: '',
//           startDate: '',
//           endDate: year
//         });
        
//         console.log(`✅ Found education: ${degree} ${major} from ${institution}, ${city}, ${state} (${year})`);
//         continue;
//       }
      
//       // Alternative Pattern: Institution with location on one line, degree info on next
//       const institutionMatch = line.match(/^([A-Za-z\s&]+),\s*([A-Za-z\s]+),\s*([A-Z]{2})$/);
      
//       if (institutionMatch) {
//         const institution = institutionMatch[1].trim();
//         const city = institutionMatch[2].trim();
//         const state = institutionMatch[3].trim();
        
//         // Look ahead for degree info
//         const nextLine = lines[i + 1] || '';
//         const degreeMatch = nextLine.match(/^(Bachelor|Master|MBA|Associate|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.|A\.A\.|A\.S\.)\s*(?:of\s+)?(?:Science\s+)?(?:Arts\s+)?(?:in\s+)?([A-Za-z\s,&]+)/i);
        
//         let degree = '';
//         let major = '';
//         let dates = '';
//         let gpa = '';
        
//         if (degreeMatch) {
//           degree = degreeMatch[1].trim();
//           major = degreeMatch[2] ? degreeMatch[2].trim() : '';
          
//           // Look for dates on next line
//           const datesLine = lines[i + 2] || '';
//           const dateMatch = datesLine.match(/(\d{4})\s*[-–—]\s*(\d{4}|Present|Current)/i);
//           if (dateMatch) {
//             dates = datesLine.trim();
//           }
          
//           // Look for GPA
//           const gpaLine = lines[i + 3] || '';
//           const gpaMatch = gpaLine.match(/GPA:\s*([0-9.]+)/i);
//           if (gpaMatch) {
//             gpa = gpaMatch[1];
//           }
//         }
        
//         education.push({
//           institution: institution,
//           city: city,
//           state: state,
//           studyType: degree,
//           area: major,
//           dates: dates,
//           score: gpa,
//           startDate: '',
//           endDate: ''
//         });
        
//         console.log(`✅ Found education: ${degree} ${major} from ${institution}, ${city}, ${state}`);
//       }
//     }
//   }
  
//   console.log(`📊 Extracted ${education.length} education entries`);
//   return education;
// }



// // Enhanced LinkedIn extraction with space handling
// function extractLinkedIn(text) {
//   // Look for LinkedIn URLs with or without spaces before slashes
//   const linkedinPatterns = [
//     /linkedin\.com\/in\/[a-zA-Z0-9\-]+/gi,
//     /linkedin\.com\s*\/\s*in\s*\/\s*[a-zA-Z0-9\-]+/gi
//   ];

//   for (const pattern of linkedinPatterns) {
//     const matches = [...text.matchAll(pattern)];
//     for (const match of matches) {
//       // Clean up any spaces
//       const cleanedUrl = match[0].replace(/\s+/g, '');
//       if (cleanedUrl.includes('linkedin.com/in/')) {
//         return `https://${cleanedUrl}`;
//       }
//     }
//   }

//   return '';
// }


// // Enhanced skills extraction
// function extractSkills(text) {
//   const skillPatterns = [
//     /\b(JavaScript|Python|Java|React|Node\.js|SQL|AWS|Azure|Docker|Kubernetes|Git|HTML|CSS|TypeScript|Angular|Vue|MongoDB|PostgreSQL|MySQL|Redis|GraphQL|REST|API|Microservices|DevOps|CI\/CD|Jenkins|Linux|Windows|MacOS|Agile|Scrum|JIRA|Confluence|Slack|Microsoft Office|Excel|PowerPoint|Word|Outlook|Salesforce|HubSpot|Google Analytics|SEO|SEM|Social Media|Content Marketing|Digital Marketing|Project Management|Leadership|Communication|Problem Solving|Analytical|Creative|Teamwork|Time Management|Customer Service|Sales|Business Development|Strategy|Operations|Finance|Accounting|HR|Recruiting|Training|Mentoring|Public Speaking|Presentation|Writing|Research|Data Analysis|Statistics|Machine Learning|AI|Artificial Intelligence|Blockchain|Cryptocurrency|Cybersecurity|Network Security|Cloud Computing|Virtualization|Automation|Robotics|IoT|Mobile Development|iOS|Android|Swift|Kotlin|Flutter|React Native|Xamarin|Unity|Game Development|Web Development|Frontend|Backend|Full Stack|UI\/UX|Design|Photoshop|Illustrator|Sketch|Figma|InVision|Adobe Creative Suite|Video Editing|Premiere|After Effects|Final Cut Pro|Motion Graphics|3D Modeling|Blender|Maya|Cinema 4D|Photography|Videography|Content Creation|Blogging|Copywriting|Technical Writing|Documentation|Translation|Languages|Spanish|French|German|Chinese|Japanese|Korean|Portuguese|Italian|Russian|Arabic|Hindi|Mandarin|Cantonese|English|Bilingual|Multilingual)\b/gi
//   ];

//   const skills = new Set();
//   for (const pattern of skillPatterns) {
//     const matches = [...text.matchAll(pattern)];
//     for (const match of matches) {
//       skills.add(match[0]);
//     }
//   }

//   return Array.from(skills).slice(0, 20); // Limit to 20 skills
// }


// // Main parsing function - RETURNS CORRECT STRUCTURE
// export async function parseResumeSimpleRobust(buffer, fileName) {
//   console.log(`SIMPLE ROBUST PARSER: Processing ${fileName} (${buffer.length} bytes)`);

//   let rawText = '';

//   try {
//     // Determine file type and extract text
//     const fileExt = fileName.toLowerCase().split('.').pop();

//     if (fileExt === 'pdf') {
//       rawText = extractPdfText(buffer);
//     } else if (fileExt === 'docx') {
//       rawText = await extractDocxText(buffer);
//     } else if (fileExt === 'txt') {
//       rawText = buffer.toString('utf8');
//     } else {
//       // Fallback: try to extract any readable text
//       rawText = buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
//     }


//     console.log(`Extracted ${rawText.length} characters of text`);

//     if (rawText.length < 50) {
//       throw new Error('Insufficient text extracted from resume');
//     }


//     // Extract structured data
//     const name = extractName(rawText);
//     const email = extractEmail(rawText);
//     const phone = extractPhone(rawText);
//     const location = extractLocation(rawText);
//     const linkedin = extractLinkedIn(rawText);
//     const workExperience = extractWorkExperience(rawText);
//     const education = extractEducation(rawText);
//     const skills = extractSkills(rawText);


//     console.log(`Extraction complete:`);
//     console.log(`  Name: ${name}`);
//     console.log(`  Email: ${email}`);
//     console.log(`  Phone: ${phone}`);
//     console.log(`  Location: ${location.full}`);
//     console.log(`  Work entries: ${workExperience.length}`);
//     console.log(`  Education entries: ${education.length}`);
//     console.log(`  Skills: ${skills.length}`);


//     // Return structure that matches what mapToProfileDraft expects
//     return {
//       candidateName: name,
//       email: email,
//       phone: phone,
//       location: {
//         city: location.city,
//         state: location.state,
//         country: location.country
//       },
//       linkedin: linkedin,
//       linkedinUrl: linkedin,
//       workExperience: workExperience,
//       education: education,
//       skills: skills
//     };


//   } catch (error) {
//     console.error('SIMPLE ROBUST PARSER ERROR:', error);
//     throw error; // Let the caller handle the error
//   }
// }




// ============================================
// UNIVERSAL RESUME PARSER - Handles All Common Formats
// ============================================
// Supports: Single-line, Multi-line, Traditional, Modern, ATS-friendly formats

import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';


// Enhanced DOCX text extraction using mammoth
async function extractDocxText(buffer) {
  try {
    console.log('DOCX buffer length:', buffer.length);
    
    const result = await mammoth.extractRawText({ buffer: buffer });
    const extractedText = result.value || '';
    
    console.log('Mammoth extracted text length:', extractedText.length);
    
    if (extractedText.length > 50) {
      return extractedText;
    }
    
    // Fallback: manual extraction
    const text = buffer.toString('utf8');
    const xmlMatches = text.match(/<w:document[^>]*>.*?<\/w:document>/gs);
    if (xmlMatches) {
      const xmlContent = xmlMatches[0];
      const textMatches = xmlContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      if (textMatches) {
        return textMatches
          .map(match => match.replace(/<[^>]*>/g, ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }
    
    return text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return '';
  }
}


// Simple PDF text extraction
function extractPdfText(buffer) {
  try {
    const text = buffer.toString('utf8');
    const textMatches = text.match(/BT\s+.*?ET/gs);
    if (textMatches) {
      return textMatches
        .join(' ')
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    return text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
}


// Email extraction with mailto support
function extractEmail(text) {
  if (!text) return '';
  
  const mailto = text.match(/mailto:([^\)\s>\]]+)/i);
  if (mailto) {
    console.log(`Found email from mailto: "${mailto[1].trim()}"`);
    return mailto[1].trim();
  }
  
  const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;
  const matches = [...text.matchAll(emailPattern)];
  
  for (const match of matches) {
    const email = (match[1] || '').toLowerCase();
    if (!email.includes('example') && !email.includes('test') && !email.includes('noreply')) {
      console.log(`Found email: "${email}"`);
      return email;
    }
  }
  
  return '';
}


// Phone extraction - supports multiple formats
function extractPhone(text) {
  if (!text) return '';
  
  const cleaned = text.replace(/\s+/g, ' ');
  
  const phonePatterns = [
    /\((\d{3})\)\s*(\d{3})-(\d{4})/g,           // (571) 287-0086
    /\((\d{3})\)\s*\d{3}-\d{4}/g,               // (571)287-0086
    /\d{3}-\d{3}-\d{4}/g,                         // 571-287-0086
    /\b(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})\b/g,
    /\b(\+1[-.\s]?)?(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})\b/g
  ];
  
  for (const pattern of phonePatterns) {
    const matches = [...cleaned.matchAll(pattern)];
    for (const match of matches) {
      if (match[1] && match[2] && match[3]) {
        const phone = `(${match[1]}) ${match[2]}-${match[3]}`;
        console.log(`Found phone: "${phone}"`);
        return phone;
      }
      let phone = match[0].replace(/[^\d]/g, '');
      if (phone.length === 10 || phone.length === 11) {
        if (phone.length === 11 && phone.startsWith('1')) {
          phone = phone.substring(1);
        }
        if (phone.length === 10) {
          const formatted = `(${phone.substring(0,3)}) ${phone.substring(3,6)}-${phone.substring(6)}`;
          console.log(`Found phone: "${formatted}"`);
          return formatted;
        }
      }
    }
  }
  
  return '';
}


// Name extraction
function extractName(text) {
  const lines = text.split(/\n|\r/).filter(l => l.trim()).slice(0, 15);
  
  for (const line of lines) {
    const cleanLine = line.trim();
    if (cleanLine.length > 5 && cleanLine.length < 50) {
      const words = cleanLine.split(/\s+/);
      if (words.length >= 2 && words.length <= 4) {
        const allProperCase = words.every(word => 
          word.length > 0 && /^[A-Za-z\s\.]+$/.test(word)
        );
        if (allProperCase && 
            !cleanLine.includes('@') && 
            !cleanLine.includes('http') && 
            !cleanLine.toLowerCase().includes('phone') && 
            !cleanLine.toLowerCase().includes('email') &&
            !cleanLine.toLowerCase().includes('summary') &&
            !cleanLine.toLowerCase().includes('professional')) {
          console.log(`Found name: "${cleanLine}"`);
          return cleanLine;
        }
      }
    }
  }
  
  return '';
}


// Location extraction
function extractLocation(text) {
  const lines = text.split(/\n|\r/).map(l => l.trim()).filter(l => l);
  const searchLines = lines.slice(1).join('\n');
  
  const locationPatterns = [
    /\b([A-Za-z\s]+),\s*([A-Z]{2})\b/g,
    /\b(McLean|Oviedo|Orlando|Washington|Tampa|Miami|Atlanta|Boston|New York|Los Angeles|Chicago|Seattle|Denver|Austin),?\s*(VA|FL|DC|GA|TX|CA|NY|IL|WA|CO)\b/gi
  ];
  
  for (const pattern of locationPatterns) {
    const matches = [...searchLines.matchAll(pattern)];
    for (const match of matches) {
      const city = match[1].trim();
      const state = match[2] ? match[2].trim().toUpperCase() : '';
      
      if (city.length >= 3 && city.length <= 30 && !/[@\.]/.test(city)) {
        console.log(`Found location: "${city}, ${state}"`);
        return {
          full: `${city}, ${state}`,
          city: city,
          state: state,
          country: 'USA'
        };
      }
    }
  }
  
  return { full: '', city: '', state: '', country: 'USA' };
}


// ============================================
// UNIVERSAL WORK EXPERIENCE EXTRACTION
// Handles ALL common formats
// ============================================
function extractWorkExperience(text) {
  const experience = [];
  const lines = text.split(/\n|\r/).map(l => l.trim()).filter(l => l);

  let inExperienceSection = false;
  let currentJob = null;

  const pushCurrent = () => {
    if (currentJob && currentJob.company && currentJob.jobTitle) {
      currentJob.description = currentJob.description.trim();
      experience.push(currentJob);
      console.log(`    ✅ Saved job: ${currentJob.jobTitle} at ${currentJob.company}`);
    }
    currentJob = null;
  };

  const normalizeDate = (s) => {
    if (!s) return '';
    
    // Handle "Present" or "Current"
    if (/present|current/i.test(s)) return null;
    
    // Handle seasons: Spring 2024, Fall 2023, etc.
    const season = s.toLowerCase().match(/(spring|summer|fall|autumn|winter)\s+(\d{4})/i);
    if (season) {
      const m = { spring: '03', summer: '06', fall: '09', autumn: '09', winter: '12' }[season[1].toLowerCase()];
      return `${season[2]}-${m}-01`;
    }
    
    // Handle month names: January 2024, Jan 2024, etc.
    const monthNames = {
      january: '01', jan: '01', february: '02', feb: '02', march: '03', mar: '03',
      april: '04', apr: '04', may: '05', june: '06', jun: '06',
      july: '07', jul: '07', august: '08', aug: '08', september: '09', sep: '09', sept: '09',
      october: '10', oct: '10', november: '11', nov: '11', december: '12', dec: '12'
    };
    
    for (const [name, num] of Object.entries(monthNames)) {
      const regex = new RegExp(`${name}\\s+(\\d{4})`, 'i');
      const match = s.match(regex);
      if (match) {
        return `${match[1]}-${num}-01`;
      }
    }
    
    // Try Date parsing
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    }
    
    // Fallback: extract year only
    const year = s.match(/\b(\d{4})\b/);
    if (year) return `${year[1]}-01-01`;
    
    return '';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect EXPERIENCE section
    if (/^(EXPERIENCE|WORK HISTORY|EMPLOYMENT|PROFESSIONAL EXPERIENCE|WORK EXPERIENCE)$/i.test(line)) {
      inExperienceSection = true;
      console.log('✅ Found EXPERIENCE section at line', i);
      continue;
    }

    // Stop at major sections
    if (inExperienceSection && /^(EDUCATION|SKILLS|CERTIFICATIONS|AWARDS|PROJECTS|VOLUNTEER|SERVICE)$/i.test(line)) {
      pushCurrent();
      console.log(`⚠️ Stopping at section: ${line}`);
      break;
    }

    if (!inExperienceSection || line.length < 4) continue;

    // ============================================
    // PATTERN A: Compact single-line format
    // Example: "Shoe Station, Oviedo, FL Store Associate - Part-time, June 2024 – Present"
    // ============================================
    const compactMatch = line.match(/^([A-Za-z0-9&'().\s\-]+),\s*([A-Za-z\.\s]+),\s*([A-Z]{2})\s+([^,]+),\s+(.+?)$/);
    if (compactMatch) {
      pushCurrent();

      const company = compactMatch[1].trim();
      const jobTitle = compactMatch[4].trim();
      const dateStr = compactMatch[5].trim();

      let start = '', end = null, current = false;
      const range = dateStr.match(/([\w]+\s+\d{4})\s*[–—-]\s*(Present|Current|[\w]+\s+\d{4})/i);
      if (range) {
        start = normalizeDate(range[1]);
        const right = range[2];
        current = /present|current/i.test(right);
        end = current ? null : normalizeDate(right);
      } else {
        start = normalizeDate(dateStr);
        current = false;
        end = '';
      }

      currentJob = {
        company,
        jobTitle,
        startDate: start,
        endDate: end,
        current,
        description: ''
      };
      console.log(`    🏢 COMPACT: ${jobTitle} @ ${company}`);
      continue;
    }

    // ============================================
    // PATTERN B: Two-line format (company + location on one, title + dates next)
    // Example:
    //   "Shoe Station, Oviedo, FL"
    //   "Store Associate - Part-time, June 2024 – Present"
    // ============================================
    const companyLocMatch = line.match(/^([A-Za-z0-9&'().\s\-]+),\s*([A-Za-z\.\s]+),\s*([A-Z]{2})$/);
    if (companyLocMatch) {
      pushCurrent();
      currentJob = {
        company: companyLocMatch[1].trim(),
        jobTitle: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      };
      console.log(`    🏢 NEW COMPANY: "${currentJob.company}"`);
      continue;
    }

    // Title + Dates line for Pattern B
    if (currentJob && !currentJob.jobTitle) {
      const titleDates = line.match(/^([^,]+),\s*(.+)$/);
      if (titleDates) {
        currentJob.jobTitle = titleDates[1].trim();
        const dateStr = titleDates[2].trim();

        let start = '', end = null, current = false;
        const range = dateStr.match(/([\w]+\s+\d{4})\s*[–—-]\s*(Present|Current|[\w]+\s+\d{4})/i);
        if (range) {
          start = normalizeDate(range[1]);
          const right = range[2];
          current = /present|current/i.test(right);
          end = current ? null : normalizeDate(right);
        } else {
          start = normalizeDate(dateStr);
          current = false;
          end = '';
        }

        currentJob.startDate = start;
        currentJob.endDate = end;
        currentJob.current = current;

        console.log(`    💼 TITLE: "${currentJob.jobTitle}"`);
        continue;
      }
    }

    // ============================================
    // PATTERN C: Traditional multi-line format (K. Greg Jackson style)
    // Line 1: Job Title
    // Line 2: Company Name
    // Line 3: City, State
    // Line 4: Date Range
    // ============================================
    if (!currentJob && line.length > 5 && line.length < 100) {
      const nextLine1 = lines[i + 1] || '';
      const nextLine2 = lines[i + 2] || '';
      const nextLine3 = lines[i + 3] || '';
      
      // Check if this looks like a job title (not a section header)
      if (!/^[A-Z\s]{10,}$/.test(line) && !/(EDUCATION|SKILLS|PROFILE|SUMMARY)/i.test(line)) {
        // Check if line 3 is a location
        const locMatch = nextLine2.match(/^([A-Za-z\s]+),\s*([A-Z]{2})$/);
        
        if (locMatch && nextLine3.match(/\d{4}/)) {
          pushCurrent();
          
          const jobTitle = line.trim();
          const company = nextLine1.trim();
          const city = locMatch[1].trim();
          const state = locMatch[2].trim();
          const dateStr = nextLine3.trim();
          
          // Parse dates
          let start = '', end = null, current = false;
          const range = dateStr.match(/(\d{4})\s*[–—-]\s*(Present|Current|\d{4})/i);
          if (range) {
            start = normalizeDate(range[1]);
            const right = range[2];
            current = /present|current/i.test(right);
            end = current ? null : normalizeDate(right);
          }
          
          currentJob = {
            company,
            jobTitle,
            startDate: start,
            endDate: end,
            current,
            description: ''
          };
          
          console.log(`    🏢 TRADITIONAL: ${jobTitle} @ ${company} (${city}, ${state})`);
          i += 3; // Skip the next 3 lines
          continue;
        }
      }
    }

    // ============================================
    // PATTERN D: Description lines (bullets and paragraphs)
    // ============================================
    if (currentJob && currentJob.jobTitle) {
      // Skip all-caps section headers
      if (/^[A-Z\s]{5,}$/.test(line) && !/(Inc|LLC|Ltd)/i.test(line)) {
        console.log(`    ⚠️ Skipping header: "${line}"`);
        continue;
      }
      
      // Add bullet points
      if (/^[•\-·]/.test(line)) {
        const clean = line.replace(/^[•\-·]\s*/, '').trim();
        currentJob.description += clean + ' ';
      } 
      // Add paragraph lines (but not too long)
      else if (/^[A-Z]/.test(line) && line.length < 500) {
        currentJob.description += line.trim() + ' ';
      }
    }
  }

  pushCurrent();

  console.log(`📊 Total work experiences: ${experience.length}`);
  return experience;
}


// ============================================
// UNIVERSAL EDUCATION EXTRACTION
// Handles ALL common formats
// ============================================
function extractEducation(text) {
  const education = [];
  const lines = text.split(/\n|\r/).map(l => l.trim()).filter(l => l);
  
  let inEducationSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect EDUCATION section
    if (/^(EDUCATION|ACADEMIC|QUALIFICATIONS|ACADEMIC BACKGROUND)$/i.test(line)) {
      inEducationSection = true;
      console.log('✅ Found EDUCATION section');
      continue;
    }
    
    // Stop at next section
    if (inEducationSection && /^(EXPERIENCE|SKILLS|CERTIFICATIONS|PROJECTS|INVOLVEMENT|SERVICE|VOLUNTEER|WORK)$/i.test(line)) {
      console.log(`⚠️ Stopping education at: ${line}`);
      break;
    }
    
    if (!inEducationSection || line.length < 10) continue;
    
    // ============================================
    // PATTERN A: Compact single-line format
    // Example: "Eckerd College, St. Petersburg, FL BA, Marketing & Communications, 2024"
    // ============================================
    const compactMatch = line.match(/^([A-Za-z\s&]+),\s*([A-Za-z\s\.]+),\s*([A-Z]{2})\s+(B\.?A\.?|B\.?S\.?|M\.?A\.?|M\.?S\.?|MBA|AA|A\.?S\.?|PhD),?\s*([^,]+),\s*(\d{4})$/i);
    
    if (compactMatch) {
      education.push({
        institution: compactMatch[1].trim(),
        city: compactMatch[2].trim(),
        state: compactMatch[3].trim(),
        studyType: compactMatch[4].trim(),
        area: compactMatch[5].trim(),
        dates: compactMatch[6].trim(),
        score: '',
        startDate: '',
        endDate: compactMatch[6].trim()
      });
      
      console.log(`✅ COMPACT: ${compactMatch[4]} ${compactMatch[5]} from ${compactMatch[1]}`);
      continue;
    }
    
    // ============================================
    // PATTERN B: Traditional multi-line format (K. Greg Jackson style)
    // Line 1: Degree and Major
    // Line 2: Institution
    // Line 3: Date range
    // Line 4 (optional): GPA
    // ============================================
    const degreeMatch = line.match(/^(Bachelor|Master|Associate|B\.S\.|M\.S\.|B\.A\.|M\.A\.|PhD|MBA|AA|A\.S\.)\s+of\s+(\w+)\s+in\s+(.+)$/i);
    
    if (degreeMatch) {
      const degree = degreeMatch[1].trim();
      const major = degreeMatch[3].trim();
      
      const nextLine = lines[i + 1] || '';
      const datesLine = lines[i + 2] || '';
      const gpaLine = lines[i + 3] || '';
      
      const dateMatch = datesLine.match(/(\d{4})\s*[-–—]\s*(\d{4})/);
      const gpaMatch = gpaLine.match(/GPA:\s*([0-9.]+)/i);
      
      education.push({
        institution: nextLine.trim(),
        city: '',
        state: '',
        studyType: degree,
        area: major,
        dates: datesLine.trim(),
        score: gpaMatch ? gpaMatch[1] : '',
        startDate: dateMatch ? dateMatch[1] : '',
        endDate: dateMatch ? dateMatch[2] : ''
      });
      
      console.log(`✅ TRADITIONAL: ${degree} ${major} from ${nextLine.trim()}`);
      i += 2; // Skip processed lines
      continue;
    }
    
    // ============================================
    // PATTERN C: Institution-first format
    // Line 1: "Institution Name, City, ST"
    // Line 2: Degree info
    // ============================================
    const institutionMatch = line.match(/^([A-Za-z\s&]+),\s*([A-Za-z\s]+),\s*([A-Z]{2})$/);
    
    if (institutionMatch) {
      const institution = institutionMatch[1].trim();
      const city = institutionMatch[2].trim();
      const state = institutionMatch[3].trim();
      
      const nextLine = lines[i + 1] || '';
      const degreeInfo = nextLine.match(/^(Bachelor|Master|MBA|Associate|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.|A\.A\.|A\.S\.)\s*(?:of\s+)?(?:Science\s+)?(?:Arts\s+)?(?:in\s+)?([A-Za-z\s,&]+)/i);
      
      if (degreeInfo) {
        const datesLine = lines[i + 2] || '';
        const gpaLine = lines[i + 3] || '';
        
        const dateMatch = datesLine.match(/(\d{4})\s*[-–—]\s*(\d{4}|Present|Current)/i);
        const gpaMatch = gpaLine.match(/GPA:\s*([0-9.]+)/i);
        
        education.push({
          institution,
          city,
          state,
          studyType: degreeInfo[1].trim(),
          area: degreeInfo[2] ? degreeInfo[2].trim() : '',
          dates: datesLine.trim(),
          score: gpaMatch ? gpaMatch[1] : '',
          startDate: dateMatch ? dateMatch[1] : '',
          endDate: dateMatch && dateMatch[2] ? dateMatch[2] : ''
        });
        
        console.log(`✅ INSTITUTION-FIRST: ${degreeInfo[1]} from ${institution}`);
      }
    }
  }
  
  console.log(`📊 Extracted ${education.length} education entries`);
  return education;
}


// LinkedIn extraction
function extractLinkedIn(text) {
  const linkedinPatterns = [
    /linkedin\.com\/in\/[a-zA-Z0-9\-]+/gi,
    /linkedin\.com\s*\/\s*in\s*\/\s*[a-zA-Z0-9\-]+/gi
  ];
  
  for (const pattern of linkedinPatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const cleanedUrl = match[0].replace(/\s+/g, '');
      if (cleanedUrl.includes('linkedin.com/in/')) {
        return `https://${cleanedUrl}`;
      }
    }
  }
  
  return '';
}


// Skills extraction - expanded list
function extractSkills(text) {
  const skillPatterns = [
    /\b(JavaScript|Python|Java|React|Node\.js|SQL|AWS|Azure|Docker|Kubernetes|Git|HTML|CSS|TypeScript|Angular|Vue|MongoDB|PostgreSQL|MySQL|Redis|GraphQL|REST|API|Microservices|DevOps|CI\/CD|Jenkins|Linux|Windows|MacOS|Agile|Scrum|JIRA|Confluence|Slack|Microsoft Office|Excel|PowerPoint|Word|Outlook|Salesforce|HubSpot|Google Analytics|SEO|SEM|Social Media|Content Marketing|Digital Marketing|Project Management|Leadership|Communication|Problem Solving|Analytical|Creative|Teamwork|Time Management|Customer Service|Sales|Business Development|Strategy|Operations|Finance|Accounting|HR|Recruiting|Training|Mentoring|Public Speaking|Presentation|Writing|Research|Data Analysis|Statistics|Machine Learning|AI|Artificial Intelligence|Blockchain|Cryptocurrency|Cybersecurity|Network Security|Cloud Computing|Virtualization|Automation|Robotics|IoT|Mobile Development|iOS|Android|Swift|Kotlin|Flutter|React Native|Xamarin|Unity|Game Development|Web Development|Frontend|Backend|Full Stack|UI\/UX|Design|Photoshop|Illustrator|Sketch|Figma|InVision|Adobe Creative Suite|Video Editing|Premiere|After Effects|Final Cut Pro|Motion Graphics|3D Modeling|Blender|Maya|Cinema 4D|Photography|Videography|Content Creation|Blogging|Copywriting|Technical Writing|Documentation|Translation|Languages|Spanish|French|German|Chinese|Japanese|Korean|Portuguese|Italian|Russian|Arabic|Hindi|Mandarin|Cantonese|English|Bilingual|Multilingual|Django|Flask|Spring|Express|FastAPI|TensorFlow|PyTorch|Keras|Pandas|NumPy|Scikit-learn|OpenCV|NLTK|Spark|Hadoop|Kafka|RabbitMQ|Elasticsearch|Terraform|Ansible|CloudFormation|Bash|Shell|PowerShell|Perl|Ruby|Rails|PHP|Laravel|.NET|C#|C\+\+|Rust|Go|Scala|R|MATLAB|SAS|Tableau|Power BI|Looker|Qlik|ETL|Data Warehousing|Data Engineering|Data Science|Business Intelligence|Visualization|Reporting|Analytics|Testing|QA|Selenium|Jest|Mocha|Cypress|JUnit|PyTest|TDD|BDD)\b/gi
  ];
  
  const skills = new Set();
  for (const pattern of skillPatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      skills.add(match[0]);
    }
  }
  
  return Array.from(skills).slice(0, 20);
}


// Main parsing function
export async function parseResumeSimpleRobust(buffer, fileName) {
  console.log(`UNIVERSAL PARSER: Processing ${fileName} (${buffer.length} bytes)`);
  
  let rawText = '';
  
  try {
    const fileExt = fileName.toLowerCase().split('.').pop();
    
    if (fileExt === 'pdf') {
      rawText = extractPdfText(buffer);
    } else if (fileExt === 'docx') {
      rawText = await extractDocxText(buffer);
    } else if (fileExt === 'txt') {
      rawText = buffer.toString('utf8');
    } else {
      rawText = buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    }

    console.log(`Extracted ${rawText.length} characters of text`);
    
    if (rawText.length < 50) {
      throw new Error('Insufficient text extracted from resume');
    }

    const name = extractName(rawText);
    const email = extractEmail(rawText);
    const phone = extractPhone(rawText);
    const location = extractLocation(rawText);
    const linkedin = extractLinkedIn(rawText);
    const workExperience = extractWorkExperience(rawText);
    const education = extractEducation(rawText);
    const skills = extractSkills(rawText);

    console.log(`Extraction complete:`);
    console.log(`  Name: ${name}`);
    console.log(`  Email: ${email}`);
    console.log(`  Phone: ${phone}`);
    console.log(`  Location: ${location.full}`);
    console.log(`  Work entries: ${workExperience.length}`);
    console.log(`  Education entries: ${education.length}`);
    console.log(`  Skills: ${skills.length}`);

    return {
      candidateName: name,
      email: email,
      phone: phone,
      location: {
        city: location.city,
        state: location.state,
        country: location.country
      },
      linkedin: linkedin,
      linkedinUrl: linkedin,
      workExperience: workExperience,
      education: education,
      skills: skills
    };

  } catch (error) {
    console.error('UNIVERSAL PARSER ERROR:', error);
    throw error;
  }
}

