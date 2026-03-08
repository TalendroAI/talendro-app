// DOCX text extractor using ZIP structure
import { createReadStream } from 'fs';
import { createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { createWriteStream as createWriteStreamSync } from 'fs';

// Simple ZIP file reader for DOCX files
export async function extractDocxText(buffer) {
  let tempFile = null;
  
  try {
    // Create a temporary file to work with the buffer
    tempFile = join(tmpdir(), `docx-${Date.now()}.docx`);
    
    // Write buffer to temporary file
    await new Promise((resolve, reject) => {
      const writeStream = createWriteStreamSync(tempFile);
      writeStream.write(buffer);
      writeStream.end();
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    
    // Try to extract text using a simple approach
    const text = await extractTextFromDocxFile(tempFile);
    
    return text;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    
    // Fallback: try to extract text directly from buffer
    return extractTextFromBuffer(buffer);
  } finally {
    // Clean up temporary file
    if (tempFile) {
      try {
        await unlink(tempFile);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }
    }
  }
}

// Extract text directly from buffer (fallback method)
function extractTextFromBuffer(buffer) {
  try {
    const text = buffer.toString('utf8');
    console.log('Buffer text preview:', text.substring(0, 500));
    
    // Look for XML content patterns
    const xmlPatterns = [
      /<w:t[^>]*>([^<]*)<\/w:t>/g,
      /<w:document[^>]*>.*?<\/w:document>/gs,
      /<w:body[^>]*>.*?<\/w:body>/gs
    ];
    
    let extractedText = '';
    
    for (const pattern of xmlPatterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        console.log(`Found ${matches.length} matches with pattern`);
        extractedText = matches
          .map(match => match[1] || match[0])
          .join(' ')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (extractedText.length > 50) {
          console.log('Extracted text length:', extractedText.length);
          console.log('Extracted text preview:', extractedText.substring(0, 200));
          return extractedText;
        }
      }
    }
    
    // If no XML patterns found, try to extract readable text
    const readableText = text
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('Fallback readable text length:', readableText.length);
    console.log('Fallback text preview:', readableText.substring(0, 200));
    
    return readableText;
  } catch (error) {
    console.error('Buffer extraction error:', error);
    return '';
  }
}

// Extract text from DOCX file (placeholder for future ZIP implementation)
async function extractTextFromDocxFile(filePath) {
  // This would require a proper ZIP library
  // For now, we'll use the buffer method
  const fs = await import('fs');
  const buffer = fs.readFileSync(filePath);
  return extractTextFromBuffer(buffer);
}

