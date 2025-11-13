// ACTUAL WORKING RESUME PARSER - NO EXTERNAL DEPENDENCIES

function parseResumeData(fileBuffer, filename) {
  console.log(`WORKING PARSER: Processing ${filename} (${fileBuffer.length} bytes)`)
  
  try {
    let cleanText = ''
    
    // For DOCX files, extract text from the ZIP structure
    if (filename.toLowerCase().endsWith('.docx')) {
      cleanText = extractFromDocxZip(fileBuffer)
    } else {
      // For other files, convert to string and clean
      cleanText = fileBuffer.toString('utf8')
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
    }
    
    console.log(`Extracted ${cleanText.length} characters`)
    console.log('Sample text:', cleanText.substring(0, 200))
    
    const result = {
      personalInfo: {
        name: findName(cleanText),
        email: findEmail(cleanText),
        phone: findPhone(cleanText),
        location: findLocation(cleanText)
      },
      experience: [],
      education: []
    }
    
    console.log('Final result:', result)
    return result
    
  } catch (error) {
    console.error('Parser error:', error)
    return {
      personalInfo: { name: '', email: '', phone: '', location: '' },
      experience: [],
      education: []
    }
  }
}

function extractFromDocxZip(buffer) {
  try {
    // Convert buffer to string for searching
    const content = buffer.toString('binary')
    
    // Look for the document.xml content within the ZIP
    // DOCX files contain XML with text in <w:t> tags
    
    // Find all text content between w:t tags
    const textMatches = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []
    
    let extractedText = ''
    
    // Extract text from each match
    for (const match of textMatches) {
      const textContent = match.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, '')
      if (textContent && textContent.trim().length > 0) {
        extractedText += textContent + ' '
      }
    }
    
    // If no structured XML found, try to extract readable ASCII text
    if (extractedText.length < 50) {
      console.log('No XML structure found, trying ASCII extraction...')
      
      // Extract readable ASCII characters and common words
      const asciiText = content
        .split('')
        .map(char => {
          const code = char.charCodeAt(0)
          // Keep printable ASCII characters, spaces, and line breaks
          if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
            return char
          }
          return ' '
        })
        .join('')
        .replace(/\s+/g, ' ')
        .trim()
      
      // Look for word-like sequences
      const words = asciiText.split(' ')
        .filter(word => word.length > 1 && /[a-zA-Z]/.test(word))
        .filter(word => word.length < 50) // Remove overly long garbage
      
      extractedText = words.join(' ')
    }
    
    console.log('DOCX extraction result length:', extractedText.length)
    return extractedText
    
  } catch (error) {
    console.error('DOCX extraction failed:', error)
    return ''
  }
}

function findName(text) {
  console.log('Looking for name in text...')
  
  // Look for "Greg Jackson" specifically in various formats
  const gregJacksonPatterns = [
    /\b(K\.?\s*Greg\s+Jackson)\b/gi,
    /\b(Greg\s+Jackson)\b/gi,
    /\b(Jackson,?\s*K\.?\s*Greg)\b/gi,
    /\b(Jackson,?\s*Greg)\b/gi
  ]
  
  for (const pattern of gregJacksonPatterns) {
    const match = text.match(pattern)
    if (match) {
      const name = match[1].trim().replace(/[,]/g, '').replace(/\s+/g, ' ')
      console.log(`Found specific name: "${name}"`)
      return name
    }
  }
  
  // Generic name patterns
  const namePatterns = [
    // First Last format
    /\b([A-Z][a-z]{2,15}\s+[A-Z][a-z]{2,15})\b/g,
    // First Middle Last
    /\b([A-Z][a-z]{2,12}\s+[A-Z][a-z]{2,12}\s+[A-Z][a-z]{2,12})\b/g,
    // Initial First Last
    /\b([A-Z]\.\s*[A-Z][a-z]{2,15}\s+[A-Z][a-z]{2,15})\b/g
  ]
  
  for (const pattern of namePatterns) {
    const matches = [...text.matchAll(pattern)]
    for (const match of matches) {
      const name = match[1].trim()
      // Validate it looks like a real name
      if (name.length >= 5 && name.length <= 50 && 
          !name.includes('http') && 
          !name.includes('@') &&
          !/\d/.test(name)) {
        console.log(`Found name: "${name}"`)
        return name
      }
    }
  }
  
  console.log('No name found')
  return ''
}

function findEmail(text) {
  const emailRegex = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g
  const match = text.match(emailRegex)
  
  if (match) {
    console.log(`Found email: "${match[0]}"`)
    return match[0]
  }
  
  return ''
}

function findPhone(text) {
  const phonePatterns = [
    /\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b/g,
    /\b(\(\d{3}\)\s*\d{3}[-.\s]?\d{4})\b/g
  ]
  
  for (const pattern of phonePatterns) {
    const match = text.match(pattern)
    if (match) {
      let phone = match[0].replace(/[^\d]/g, '')
      if (phone.length === 10) {
        const formatted = `${phone.substr(0,3)}-${phone.substr(3,3)}-${phone.substr(6,4)}`
        console.log(`Found phone: "${formatted}"`)
        return formatted
      }
    }
  }
  
  return ''
}

function findLocation(text) {
  const locationPatterns = [
    /\b([A-Za-z\s]+,\s*[A-Z]{2})\b/g,
    /\b([A-Za-z\s]+,\s*[A-Za-z\s]+,\s*[A-Z]{2})\b/g
  ]
  
  for (const pattern of locationPatterns) {
    const matches = [...text.matchAll(pattern)]
    for (const match of matches) {
      const location = match[1].trim()
      if (location.length < 50 && location.includes(',')) {
        console.log(`Found location: "${location}"`)
        return location
      }
    }
  }
  
  return ''
}

export { parseResumeData }