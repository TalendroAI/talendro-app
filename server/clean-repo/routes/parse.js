// server/routes/parse.js (ES modules) - Using existing FormData parsing

import express from 'express';
import { parseWithAffinda } from '../vendor/affindaAdapter.js';
import { mapToProfileDraft } from '../mappers/mapToProfileDraft.js';
import {
  createJob, setJobStatus, getJob,
  getDraft, saveDraft
} from '../profileDraftStore.js';
import crypto from 'crypto';

const router = express.Router();

// Generate trace ID for debugging
function generateTraceId() {
  return crypto.randomBytes(8).toString('hex');
}

// POST /api/resume/parse (using existing FormData parsing - no multer needed)
router.post('/resume/parse', (req, res) => {
  const traceId = generateTraceId();
  const t0 = Date.now();
  
  console.log('[parse] start', new Date().toISOString());
  console.log(`[${traceId}] AFFINDA PARSER: Starting resume parsing...`);
  
  // Set response timeout to prevent hanging
  const timeout = setTimeout(() => {
    console.error(`[${traceId}] TIMEOUT: Request exceeded 30 seconds`);
    if (!res.headersSent) {
      res.status(504).json({ 
        error: 'Request timeout', 
        detail: 'Processing took longer than 30 seconds',
        traceId 
      });
    }
  }, 30000);
  
  const chunks = [];
  
  req.on('data', chunk => {
    chunks.push(chunk);
  });
  
  req.on('end', async () => {
    clearTimeout(timeout); // Clear timeout since we got the data
    
    try {
      const buffer = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || '';
      const userId = 'demo-user'; // Replace with your auth user
      
      console.log(`[${traceId}] Received upload: ${buffer.length} bytes, Content-Type: ${contentType}`);
      
      if (!contentType.includes('multipart/form-data')) {
        console.log(`[${traceId}] ERROR: Expected multipart/form-data but got: ${contentType}`);
        return res.status(400).json({ error: 'Expected multipart/form-data upload', traceId });
      }
      
      // Extract boundary from content-type header
      const boundary = contentType.split('boundary=')[1];
      if (!boundary) {
        console.log(`[${traceId}] ERROR: No boundary found in content-type`);
        return res.status(400).json({ error: 'No boundary found in multipart data', traceId });
      }
      
      console.log(`[${traceId}] Processing multipart data with boundary: ${boundary.substring(0, 20)}...`);
      
      // Handle multipart data (reusing existing logic)
      const boundaryBytes = Buffer.from(`--${boundary}`);
      const parts = [];
      let start = 0;
      
      // Find all boundary positions
      while (start < buffer.length) {
        const pos = buffer.indexOf(boundaryBytes, start);
        if (pos === -1) break;
        
        if (start > 0) {
          parts.push(buffer.slice(start, pos));
        }
        start = pos + boundaryBytes.length;
      }
      
      let fileName = 'resume.pdf';
      let fileType = 'application/pdf';
      let fileBuffer = null;
      
      for (const part of parts) {
        const partStr = part.toString('binary');
        
        if (partStr.includes('name="file"')) {
          // Extract filename from Content-Disposition header
          const filenameMatch = partStr.match(/filename="([^"]+)"/);
          if (filenameMatch) {
            fileName = filenameMatch[1];
          }
          
          // Extract content type
          const contentTypeMatch = partStr.match(/Content-Type:\s*([^\r\n]+)/);
          if (contentTypeMatch) {
            fileType = contentTypeMatch[1].trim();
          }
          
          // Find the start of file data (after double CRLF)
          const headerEndIndex = part.indexOf(Buffer.from('\r\n\r\n'));
          if (headerEndIndex !== -1) {
            fileBuffer = part.slice(headerEndIndex + 4);
            
            // Remove any trailing CRLF
            while (fileBuffer.length > 0 && (fileBuffer[fileBuffer.length - 1] === 0x0A || fileBuffer[fileBuffer.length - 1] === 0x0D)) {
              fileBuffer = fileBuffer.slice(0, -1);
            }
            break;
          }
        }
      }
      
      if (!fileBuffer || !fileName) {
        console.log(`[${traceId}] ERROR: Failed to extract file from FormData (fileName: ${fileName}, bufferSize: ${fileBuffer ? fileBuffer.length : 0})`);
        return res.status(400).json({ error: 'No file data found in FormData', traceId });
      }
      
      console.log(`[${traceId}] ✅ Extracted file: ${fileName} (${fileType}, ${fileBuffer.length} bytes)`);
      console.log(`[${traceId}] Processing with Affinda parser...`);
      
      const fileMeta = { filename: fileName, mimetype: fileType, size: fileBuffer.length };
      const jobId = createJob({ userId, fileMeta });
      setJobStatus(jobId, { status: 'processing' });

      // Check Affinda status first
      const status = await (await import('../vendor/affindaAdapter.js')).affindaStatus();
      console.log(`[${traceId}] Affinda status:`, status);

      // 1) Vendor parse (Affinda or stub)
      const { raw } = await parseWithAffinda(fileBuffer, fileName, fileType);
      
      // DEBUG: Check if we now have the extracted data
      console.log(`[${traceId}] EXTRACTED DATA KEYS:`, Object.keys(raw.data || {}));
      if (raw.data && Object.keys(raw.data).length > 0) {
        console.log(`[${traceId}] SUCCESS - Found resume data!`);
        if (raw.data.candidateName) console.log(`[${traceId}] NAME:`, raw.data.candidateName);
        if (raw.data.email) console.log(`[${traceId}] EMAIL:`, raw.data.email);
        if (raw.data.location) console.log(`[${traceId}] LOCATION:`, JSON.stringify(raw.data.location));
        if (raw.data.website) console.log(`[${traceId}] WEBSITES:`, JSON.stringify(raw.data.website));
        // DEBUG: Show raw LinkedIn data structure
        console.log(`[${traceId}] RAW DATA KEYS:`, Object.keys(raw.data || {}));
        if (raw.data.socialMedia) console.log(`[${traceId}] SOCIAL MEDIA:`, JSON.stringify(raw.data.socialMedia));
        if (raw.data.social) console.log(`[${traceId}] SOCIAL:`, JSON.stringify(raw.data.social));
        if (raw.data.workExperience) console.log(`[${traceId}] WORK EXP:`, raw.data.workExperience.length, 'entries');
      }

      // 2) Map to our ProfileDraft & Prefill
      const existing = getDraft(userId);
      const { profileDraft, prefill } = mapToProfileDraft(raw);
      saveDraft(userId, profileDraft);

      setJobStatus(jobId, { status: 'complete' });

      console.log(`[${traceId}] ✅ Affinda parser completed in ${Date.now() - t0}ms`);
      console.log(`[${traceId}] Successfully parsed resume for user ${userId}:`, {
        basics: { name: profileDraft.basics.name?.value, email: profileDraft.basics.email?.value },
        workCount: profileDraft.work.length,
        educationCount: profileDraft.education.length,
        skillsCount: profileDraft.skills.length
      });

      // 3) Return result to client (compatible with existing frontend)
      // Convert our structured data back to the format your frontend expects
      const legacyData = {
        personalInfo: {
          name: profileDraft.basics.name?.value || '',
          email: profileDraft.basics.email?.value || '',
          phone: profileDraft.basics.phone?.value || '',
          location: [
            profileDraft.basics.location?.address?.value,
            profileDraft.basics.location?.city?.value,
            profileDraft.basics.location?.region?.value,
            profileDraft.basics.location?.postalCode?.value
          ].filter(Boolean).join(', ')
        },
        experience: profileDraft.work.map(w => ({
          company: w.company?.value || '',
          position: w.position?.value || '',
          startDate: w.startDate?.value || '',
          endDate: w.endDate?.value || '',
          highlights: w.highlights || []
        })),
        education: profileDraft.education.map(e => ({
          institution: e.institution?.value || '',
          studyType: e.studyType?.value || '',
          area: e.area?.value || '',
          startDate: e.startDate?.value || '',
          endDate: e.endDate?.value || '',
          score: e.score || ''
        })),
        skills: profileDraft.skills.map(s => s.name || s).filter(Boolean)
      };

      const result = {
        success: true,
        data: {
          jobId,
          status: 'complete',
          prefill,                   // Pre-fill data for Steps 3-6
          profileDraft,              // New structured format for future use
          confidence: 0.9            // Default high confidence
        }
      };

      console.log('[parse] resp.shape', {
        hasData: !!result?.data,
        hasPrefill: !!result?.data?.prefill,
        hasProfile: !!result?.data?.profileDraft
      });
      
      // DEBUG: Show what's in prefill
      if (prefill) {
        console.log(`[${traceId}] PREFILL STEP3:`, JSON.stringify(prefill.step3, null, 2));
      }

      return res.json(result);
      
    } catch (error) {
      clearTimeout(timeout);
      console.error(`[${traceId}] ERROR:`, error.message);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Parse error', 
          detail: error.message, 
          traceId 
        });
      }
    }
  });
  
  req.on('error', (error) => {
    clearTimeout(timeout);
    console.error(`[${traceId}] REQUEST ERROR:`, error.message);
    if (!res.headersSent) {
      res.status(400).json({ 
        error: 'Request error', 
        detail: error.message, 
        traceId 
      });
    }
  });
});

// GET /api/resume/status/:jobId
router.get('/resume/status/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  return res.json({ status: job.status, error: job.error || null });
});

// GET /api/profile/draft - fallback endpoint for Step 3
router.get('/profile/draft', (req, res) => {
  const userId = 'demo-user'; // Replace with your auth user
  const draft = getDraft(userId);
  if (!draft) {
    return res.status(204).end(); // No content; don't force clients to create blanks
  }
  res.json({ draft });
});

export default router;