// SIMPLE AND RELIABLE RESUME PARSER - PRODUCTION READY

function parseResumeData(fileBuffer, filename) {
  console.log(`SIMPLE PARSER: Processing ${filename} (${fileBuffer.length} bytes)`)
  
  // Convert to text - this works for most text-based files
  let text = ''
  
  try {
    // Try UTF-8 first
    text = fileBuffer.toString('utf8')
    
    // Clean up the text - remove null bytes and control characters
    text = text.replace(/\x00/g, ' ')
                .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
                .replace(/\s+/g, ' ')
    
    console.log(`Extracted ${text.length} characters of text`)
    
    // Debug: Show first 500 characters of extracted text
    console.log('EXTRACTED TEXT SAMPLE:', text.substring(0, 500))
    
    // Extract data using simple regex patterns
    const result = {
      personalInfo: {
        name: extractName(text),
        email: extractEmail(text),
        phone: extractPhone(text),
        location: extractLocation(text)
      },
      experience: extractExperience(text),
      education: extractEducation(text)
    }
    
    console.log('EXTRACTED DATA:', result)
    return result
    
  } catch (error) {
    console.error('Text extraction failed:', error)
    return {
      personalInfo: { name: '', email: '', phone: '', location: '' },
      experience: [],
      education: []
    }
  }
}

function extractName(text) {
  // Look for name patterns at the beginning of the text
  const namePatterns = [
    /([A-Z][a-z]+\s+(?:[A-Z]\.\s*)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,  // Full names
    /([A-Z][A-Z\s\.]+[A-Z])/,  // All caps names
  ]
  
  const firstLines = text.split('\n').slice(0, 10)
  
  for (const line of firstLines) {
    const cleanLine = line.trim()
    for (const pattern of namePatterns) {
      const match = cleanLine.match(pattern)
      if (match && match[1].length >= 5 && match[1].length <= 50) {
        console.log(`Found name: "${match[1]}"`)
        return match[1].trim()
      }
    }
  }
  
  return ''
}

function extractEmail(text) {
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
  const matches = text.match(emailPattern)
  
  if (matches && matches.length > 0) {
    console.log(`Found email: "${matches[0]}"`)
    return matches[0]
  }
  
  return ''
}

function extractPhone(text) {
  const phonePatterns = [
    /(\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g,
    /(\+?1[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g,
  ]
  
  for (const pattern of phonePatterns) {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      console.log(`Found phone: "${matches[0]}"`)
      return matches[0].replace(/[^\d]/g, '').replace(/^1/, '')
    }
  }
  
  return ''
}

function extractLocation(text) {
  const locationPatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})/g,  // City, ST
    /([A-Z][a-z]+,\s*[A-Z]{2}\s*[0-9]{5})/g,          // City, ST ZIP
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][a-z]+)/g, // City, State
  ]
  
  for (const pattern of locationPatterns) {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      console.log(`Found location: "${matches[0]}"`)
      return matches[0]
    }
  }
  
  return ''
}

function extractExperience(text) {
  const experience = []
  
  // Look for job titles and companies
  const jobPatterns = [
    /(Senior\s+\w+(?:\s+\w+)*)/gi,
    /(Manager(?:\s+\w+)*)/gi,
    /(Engineer(?:\s+\w+)*)/gi,
    /(Developer(?:\s+\w+)*)/gi,
    /(Analyst(?:\s+\w+)*)/gi,
  ]
  
  for (const pattern of jobPatterns) {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach(match => {
        if (match.length > 5 && match.length < 50) {
          experience.push({
            title: match.trim(),
            company: '',
            duration: '',
            description: ''
          })
        }
      })
    }
  }
  
  console.log(`Found ${experience.length} job titles`)
  return experience.slice(0, 5) // Limit to 5 entries
}

function extractEducation(text) {
  const education = []
  
  // Look for degree patterns
  const degreePatterns = [
    /(Bachelor(?:'s)?\s+of\s+\w+(?:\s+\w+)*)/gi,
    /(Master(?:'s)?\s+of\s+\w+(?:\s+\w+)*)/gi,
    /(PhD|Ph\.D\.?|Doctor\s+of\s+Philosophy)/gi,
    /(B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?)\s+(?:in\s+)?(\w+(?:\s+\w+)*)/gi,
  ]
  
  for (const pattern of degreePatterns) {
    const matches = text.match(pattern)
    if (matches) {
      matches.forEach(match => {
        if (match.length > 3 && match.length < 80) {
          education.push({
            degree: match.trim(),
            school: '',
            year: '',
            gpa: ''
          })
        }
      })
    }
  }
  
  console.log(`Found ${education.length} degrees`)
  return education.slice(0, 3) // Limit to 3 entries
}

export {
  parseResumeData
}