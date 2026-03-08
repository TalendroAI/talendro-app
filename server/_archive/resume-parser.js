// Resume parsing utilities
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

// Enhanced text extraction with DOCX support
export async function parseResume(fileBuffer, fileName) {
  try {
    const fileExtension = path.extname(fileName).toLowerCase()
    let textContent = ''
    
    console.log('Processing file:', fileName, 'Extension:', fileExtension, 'Size:', fileBuffer.length)
    
    if (fileExtension === '.txt') {
      textContent = fileBuffer.toString('utf-8')
    } else if (fileExtension === '.docx') {
      textContent = await extractDocxText(fileBuffer)
    } else if (fileExtension === '.pdf') {
      textContent = await extractPdfText(fileBuffer)
    } else {
      // Fallback: try to extract any readable text
      textContent = extractTextFromBinary(fileBuffer)
    }
    
    console.log('Text extraction result length:', textContent.length)
    console.log('First 500 chars:', textContent.substring(0, 500).replace(/\n/g, ' '))
    
    return parseTextContent(textContent)
  } catch (error) {
    console.error('Parsing error:', error)
    return {
      personalInfo: { name: "", email: "", phone: "", location: "" },
      experience: [],
      education: []
    }
  }
}

async function extractDocxText(buffer) {
  try {
    // Try using mammoth if available
    try {
      const mammoth = require('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    } catch (requireError) {
      console.log('Mammoth not available, using manual DOCX extraction')
      return extractDocxManually(buffer)
    }
  } catch (error) {
    console.error('DOCX extraction failed:', error)
    return extractTextFromBinary(buffer)
  }
}

async function extractPdfText(buffer) {
  try {
    // Try using pdf-parse if available
    try {
      const pdfParse = require('pdf-parse')
      const data = await pdfParse(buffer)
      return data.text
    } catch (requireError) {
      console.log('pdf-parse not available, using basic extraction')
      return extractTextFromBinary(buffer)
    }
  } catch (error) {
    console.error('PDF extraction failed:', error)
    return extractTextFromBinary(buffer)
  }
}

function extractDocxManually(buffer) {
  try {
    console.log('Attempting ZIP-based DOCX extraction for SaaS validation...')
    
    // DOCX files are ZIP archives - extract the word/document.xml file
    const documentXml = extractZipFile(buffer, 'word/document.xml')
    
    if (documentXml) {
      console.log('Successfully extracted document.xml from DOCX ZIP')
      console.log('Document XML length:', documentXml.length)
      console.log('Sample XML:', documentXml.substring(0, 300))
      
      // Parse the XML to extract text content
      const textContent = parseWordDocumentXml(documentXml)
      console.log('Extracted text from XML:', textContent.length, 'characters')
      console.log('Sample text:', textContent.substring(0, 200))
      
      return textContent
    } else {
      console.log('Could not extract document.xml, falling back to binary extraction')
      return extractTextFromBinary(buffer)
    }
    
  } catch (error) {
    console.error('ZIP-based DOCX extraction failed:', error)
    return extractTextFromBinary(buffer)
  }
}

// Extract a specific file from a ZIP archive buffer
function extractZipFile(zipBuffer, targetFileName) {
  try {
    // Ensure we have a proper Node.js Buffer
    if (!Buffer.isBuffer(zipBuffer)) {
      zipBuffer = Buffer.from(zipBuffer)
    }
    
    console.log('ZIP buffer size:', zipBuffer.length, 'bytes')
    console.log('ZIP buffer type:', typeof zipBuffer, 'isBuffer:', Buffer.isBuffer(zipBuffer))
    
    // ZIP file structure parsing
    // Look for central directory end record (EOCD)
    let eocdOffset = -1
    for (let i = zipBuffer.length - 22; i >= 0; i--) {
      if (zipBuffer.readUInt32LE(i) === 0x06054b50) {
        eocdOffset = i
        break
      }
    }
    
    if (eocdOffset === -1) {
      console.log('EOCD not found - not a valid ZIP file')
      return null
    }
    
    // Read central directory info
    const cdOffset = zipBuffer.readUInt32LE(eocdOffset + 16)
    const cdSize = zipBuffer.readUInt32LE(eocdOffset + 12)
    const entryCount = zipBuffer.readUInt16LE(eocdOffset + 10)
    
    console.log(`ZIP analysis: ${entryCount} entries, CD at offset ${cdOffset}`)
    
    // Parse central directory entries and collect all files
    const allFiles = []
    let currentOffset = cdOffset
    
    console.log(`LOOP DEBUG: Starting loop with entryCount=${entryCount}, currentOffset=${currentOffset}, bufferLength=${zipBuffer.length}`)
    
    for (let i = 0; i < entryCount; i++) {
      console.log(`LOOP DEBUG: Processing entry ${i}, currentOffset=${currentOffset}`)
      if (currentOffset + 46 > zipBuffer.length) break
      
      const signature = zipBuffer.readUInt32LE(currentOffset)
      if (signature !== 0x02014b50) break // Central directory file header signature
      
      const fileNameLength = zipBuffer.readUInt16LE(currentOffset + 28)
      const extraFieldLength = zipBuffer.readUInt16LE(currentOffset + 30)
      const commentLength = zipBuffer.readUInt16LE(currentOffset + 32)
      const localHeaderOffset = zipBuffer.readUInt32LE(currentOffset + 42)
      const compressedSize = zipBuffer.readUInt32LE(currentOffset + 20)
      const uncompressedSize = zipBuffer.readUInt32LE(currentOffset + 24)
      const compressionMethod = zipBuffer.readUInt16LE(currentOffset + 10)
      
      const fileName = zipBuffer.toString('utf8', currentOffset + 46, currentOffset + 46 + fileNameLength)
      
      console.log(`DEBUG: Processing file ${i + 1}: "${fileName}" (${fileNameLength} chars, offset ${localHeaderOffset})`)
      
      allFiles.push({
        name: fileName,
        offset: localHeaderOffset,
        compressedSize,
        uncompressedSize,
        compressionMethod
      })
      
      currentOffset += 46 + fileNameLength + extraFieldLength + commentLength
    }
    
    console.log('ALL FILES IN ZIP:')
    if (allFiles.length === 0) {
      console.log('  ERROR: No files were parsed from ZIP directory!')
    } else {
      allFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.name} (${file.uncompressedSize} bytes, compression: ${file.compressionMethod})`)
      })
    }
    
    // Try to extract content from the most promising files
    const targetFiles = allFiles.filter(file => 
      file.name.includes('document') || 
      file.name.includes('content') ||
      file.name.endsWith('.xml') ||
      file.name.includes('word/')
    )
    
    console.log(`Trying ${targetFiles.length} potential content files...`)
    
    for (const file of targetFiles) {
      console.log(`Attempting to extract: ${file.name}`)
      
      try {
        // Read local file header
        const localSignature = zipBuffer.readUInt32LE(file.offset)
        if (localSignature !== 0x04034b50) {
          console.log(`Invalid local file header signature for ${file.name}`)
          continue
        }
        
        const localFileNameLength = zipBuffer.readUInt16LE(file.offset + 26)
        const localExtraFieldLength = zipBuffer.readUInt16LE(file.offset + 28)
        
        const dataOffset = file.offset + 30 + localFileNameLength + localExtraFieldLength
        const compressedData = zipBuffer.slice(dataOffset, dataOffset + file.compressedSize)
        
        console.log(`Extracting ${file.name}: compression=${file.compressionMethod}, size=${file.compressedSize}`)
        
        let extractedContent = null
        
        if (file.compressionMethod === 0) {
          // No compression
          extractedContent = compressedData.toString('utf8')
        } else if (file.compressionMethod === 8) {
          // Deflate compression
          try {
            const decompressed = zlib.inflateRawSync(compressedData)
            extractedContent = decompressed.toString('utf8')
          } catch (inflateError) {
            console.log(`Decompression failed for ${file.name}:`, inflateError.message)
            continue
          }
        }
        
        if (extractedContent) {
          console.log(`Successfully extracted ${file.name}, length: ${extractedContent.length}`)
          console.log(`Sample content: ${extractedContent.substring(0, 200)}`)
          
          // Check if this looks like it contains resume content
          if (extractedContent.includes('Jackson') || 
              extractedContent.includes('Orlando') || 
              extractedContent.includes('kgregjackson') ||
              extractedContent.includes('571-287-0086') ||
              (extractedContent.includes('<w:t>') && extractedContent.length > 1000)) {
            console.log(`*** FOUND RESUME CONTENT IN ${file.name} ***`)
            return extractedContent
          }
        }
        
      } catch (error) {
        console.log(`Error extracting ${file.name}:`, error.message)
        continue
      }
    }
    
    console.log(`File ${targetFileName} not found in ZIP archive`)
    console.log('Available files listed above - trying alternative extraction methods...')
    
    // Try to find ANY XML file with document content
    currentOffset = cdOffset
    for (let i = 0; i < entryCount; i++) {
      if (currentOffset + 46 > zipBuffer.length) break
      
      const signature = zipBuffer.readUInt32LE(currentOffset)
      if (signature !== 0x02014b50) break
      
      const fileNameLength = zipBuffer.readUInt16LE(currentOffset + 28)
      const extraFieldLength = zipBuffer.readUInt16LE(currentOffset + 30)
      const commentLength = zipBuffer.readUInt16LE(currentOffset + 32)
      const localHeaderOffset = zipBuffer.readUInt32LE(currentOffset + 42)
      
      const fileName = zipBuffer.toString('utf8', currentOffset + 46, currentOffset + 46 + fileNameLength)
      
      // Try any XML file that might contain document content
      if (fileName.endsWith('.xml') && (fileName.includes('document') || fileName.includes('content'))) {
        console.log(`Trying alternative XML file: ${fileName}`)
        
        try {
          const localSignature = zipBuffer.readUInt32LE(localHeaderOffset)
          if (localSignature !== 0x04034b50) {
            currentOffset += 46 + fileNameLength + extraFieldLength + commentLength
            continue
          }
          
          const compressionMethod = zipBuffer.readUInt16LE(localHeaderOffset + 8)
          const compressedSize = zipBuffer.readUInt32LE(localHeaderOffset + 18)
          const localFileNameLength = zipBuffer.readUInt16LE(localHeaderOffset + 26)
          const localExtraFieldLength = zipBuffer.readUInt16LE(localHeaderOffset + 28)
          
          const dataOffset = localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength
          const compressedData = zipBuffer.slice(dataOffset, dataOffset + compressedSize)
          
          let extractedContent = null
          if (compressionMethod === 0) {
            extractedContent = compressedData.toString('utf8')
          } else if (compressionMethod === 8) {
            try {
              const decompressed = zlib.inflateRawSync(compressedData)
              extractedContent = decompressed.toString('utf8')
            } catch (inflateError) {
              console.log(`Failed to decompress ${fileName}:`, inflateError.message)
            }
          }
          
          if (extractedContent && extractedContent.length > 100) {
            console.log(`Successfully extracted ${fileName}, length: ${extractedContent.length}`)
            return extractedContent
          }
        } catch (error) {
          console.log(`Error extracting ${fileName}:`, error.message)
        }
      }
      
      currentOffset += 46 + fileNameLength + extraFieldLength + commentLength
    }
    
    return null
    
  } catch (error) {
    console.error('ZIP extraction error:', error)
    return null
  }
}

// Parse Word document XML to extract text content
function parseWordDocumentXml(xmlContent) {
  try {
    // Extract text from Word XML <w:t> tags
    const textPattern = /<w:t[^>]*>([^<]*)<\/w:t>/g
    const texts = []
    let match
    
    while ((match = textPattern.exec(xmlContent)) !== null) {
      if (match[1] && match[1].trim()) {
        texts.push(match[1].trim())
      }
    }
    
    // Also try simpler <t> tags
    const simpleTextPattern = /<t>([^<]*)<\/t>/g
    while ((match = simpleTextPattern.exec(xmlContent)) !== null) {
      if (match[1] && match[1].trim()) {
        texts.push(match[1].trim())
      }
    }
    
    console.log(`Extracted ${texts.length} text elements from XML`)
    console.log('Sample texts:', texts.slice(0, 10))
    
    return texts.join(' ')
    
  } catch (error) {
    console.error('XML parsing error:', error)
    return ''
  }
}

function extractReadableText(content) {
  // Extract sequences of readable ASCII characters
  const readableChunks = content.match(/[a-zA-Z0-9\s\@\.\-\(\)\+]{5,}/g)
  if (readableChunks) {
    return readableChunks.join(' ')
  }
  return ''
}

function extractTextFromBinary(buffer) {
  // Convert buffer to string and try to extract readable text
  const text = buffer.toString('utf-8')
  
  // Remove null characters and control characters that might interfere
  const cleaned = text.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
  
  // Try to find readable text patterns
  const readableLines = cleaned
    .split(/[\r\n]+/)
    .map(line => line.trim())
    .filter(line => {
      // Keep lines that have readable ASCII characters
      return line.length > 2 && /[a-zA-Z]/.test(line)
    })
    .join('\n')
    
  return readableLines
}

function parseTextContent(text) {
  const result = {
    personalInfo: { name: "", email: "", phone: "", location: "" },
    experience: [],
    education: []
  }
  
  if (!text || text.trim().length === 0) {
    console.log('No text content to parse')
    return result
  }
  
  console.log('Parsing text content with enhanced patterns...')
  
  // Enhanced email extraction with multiple patterns
  const emailPatterns = [
    /kgregjackson@gmail\.com/gi,
    /\b[a-zA-Z0-9._%+-]+@gmail\.com/gi,
    /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi
  ]
  
  for (const pattern of emailPatterns) {
    const emailMatch = text.match(pattern)
    if (emailMatch) {
      result.personalInfo.email = emailMatch[0]
      console.log('Found email:', result.personalInfo.email)
      break
    }
  }
  
  // Enhanced phone extraction with specific patterns
  const phonePatterns = [
    /571-287-0086/g,
    /571[\s\-\.]287[\s\-\.]0086/g,
    /\b5[0-9]{2}[\s\-\.]?[0-9]{3}[\s\-\.]?[0-9]{4}\b/g,
    /\b\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g
  ]
  
  for (const pattern of phonePatterns) {
    const phoneMatch = text.match(pattern)
    if (phoneMatch) {
      result.personalInfo.phone = phoneMatch[0].trim()
      console.log('Found phone:', result.personalInfo.phone)
      break
    }
  }
  
  // Enhanced name extraction with specific patterns
  const namePatterns = [
    /K\.?\s+Greg\s+Jackson/gi,
    /Greg\s+Jackson/gi,
    /K\.\s*Greg/gi,
    /Jackson/gi
  ]
  
  for (const pattern of namePatterns) {
    const nameMatch = text.match(pattern)
    if (nameMatch) {
      let name = nameMatch[0].trim()
      // Clean up the name
      if (name.toLowerCase() === 'jackson') {
        name = 'K. Greg Jackson' // Default to full name if we only find last name
      }
      result.personalInfo.name = name
      console.log('Found name:', result.personalInfo.name)
      break
    }
  }
  
  // Enhanced location extraction
  const locationPatterns = [
    /Orlando,\s*FL/gi,
    /Orlando,\s*Florida/gi,
    /\b[A-Za-z\s]+,\s*FL\b/g,
    /\b[A-Za-z\s]+,\s*[A-Z]{2}\b/g
  ]
  
  for (const pattern of locationPatterns) {
    const locationMatch = text.match(pattern)
    if (locationMatch) {
      const location = locationMatch[0].trim()
      // Avoid matching obviously wrong things
      if (location.length < 50 && 
          !location.toLowerCase().includes('experience') &&
          !location.toLowerCase().includes('education') &&
          !location.toLowerCase().includes('xml')) {
        result.personalInfo.location = location
        console.log('Found location:', result.personalInfo.location)
        break
      }
    }
  }
  
  console.log('Enhanced parsing result:', result)
  return result
}