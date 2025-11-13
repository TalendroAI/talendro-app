// // server/routes/parse.js - OPTIMIZED VERSION

// import express from 'express';
// import { parseWithAffinda, affindaStatus } from '../vendor/affindaAdapter.js';
// import { mapToProfileDraft } from '../mappers/mapToProfileDraft.js';
// import { createJob, setJobStatus, getJob, getDraft, saveDraft } from '../profileDraftStore.js';
// import crypto from 'crypto';
// import { parseResumeSimpleRobust } from '../resume-parser-simple-robust.js';
// import { formatProtectionMiddleware, validateFormatIntegrity } from '../middleware/formatProtection.js';

// const router = express.Router();

// // ============================================
// // HELPER: Normalize confidence objects to scalars
// // ============================================
// function normalizeScalars(obj) {
//   if (!obj || typeof obj !== 'object') return obj;

//   const toScalar = (v) => {
//     if (v === null || v === undefined) return '';
//     if (typeof v === 'object' && 'value' in v) return v.value ?? '';
//     if (typeof v === 'boolean' || typeof v === 'number') return v;
//     return typeof v === 'string' ? v : '';
//   };

//   const out = Array.isArray(obj) ? [] : {};

//   for (const k of Object.keys(obj)) {
//     const val = obj[k];

//     if (val && typeof val === 'object' && !Array.isArray(val)) {
//       if ('value' in val) {
//         out[k] = toScalar(val);
//       } else {
//         out[k] = normalizeScalars(val);
//       }
//     } else if (Array.isArray(val)) {
//       out[k] = val.map(normalizeScalars);
//     } else {
//       out[k] = toScalar(val);
//     }
//   }

//   return out;
// }

// // ============================================
// // HELPER: Generate trace ID for debugging
// // ============================================
// function generateTraceId() {
//   return crypto.randomBytes(8).toString('hex');
// }

// // ============================================
// // HELPER: Parse multipart form data
// // ============================================
// function parseMultipartFormData(buffer, boundary) {
//   const boundaryBytes = Buffer.from(`--${boundary}`);
//   const parts = [];
//   let start = 0;

//   while (start < buffer.length) {
//     const pos = buffer.indexOf(boundaryBytes, start);
//     if (pos === -1) break;
//     if (start > 0) {
//       parts.push(buffer.slice(start, pos));
//     }
//     start = pos + boundaryBytes.length;
//   }

//   let fileName = 'resume.pdf';
//   let fileType = 'application/pdf';
//   let fileBuffer = null;

//   for (const part of parts) {
//     const partStr = part.toString('binary');

//     if (partStr.includes('name="file"')) {
//       const filenameMatch = partStr.match(/filename="([^"]+)"/);
//       if (filenameMatch) {
//         fileName = filenameMatch[1];
//       }

//       const contentTypeMatch = partStr.match(/Content-Type:\s*([^\r\n]+)/);
//       if (contentTypeMatch) {
//         fileType = contentTypeMatch[1].trim();
//       }

//       const headerEndIndex = part.indexOf(Buffer.from('\r\n\r\n'));
//       if (headerEndIndex !== -1) {
//         fileBuffer = part.slice(headerEndIndex + 4);

//         // Remove trailing CRLF
//         while (fileBuffer.length > 0 && 
//                (fileBuffer[fileBuffer.length - 1] === 0x0A || 
//                 fileBuffer[fileBuffer.length - 1] === 0x0D)) {
//           fileBuffer = fileBuffer.slice(0, -1);
//         }
//         break;
//       }
//     }
//   }

//   return { fileName, fileType, fileBuffer };
// }

// // ============================================
// // MAIN ENDPOINT: POST /api/resume/parse
// // ============================================
// router.post('/resume/parse', formatProtectionMiddleware, (req, res) => {
//   const traceId = generateTraceId();
//   const t0 = Date.now();

//   console.log(`[${traceId}] Starting resume parsing...`, new Date().toISOString());

//   // 90-second timeout as per Affinda recommendations
//   const timeout = setTimeout(() => {
//     console.error(`[${traceId}] TIMEOUT: Request exceeded 90 seconds`);
//     if (!res.headersSent) {
//       res.status(504).json({
//         error: 'Request timeout',
//         detail: 'Processing took longer than 90 seconds',
//         traceId
//       });
//     }
//   }, 90000);

//   const chunks = [];

//   req.on('data', chunk => chunks.push(chunk));

//   req.on('end', async () => {
//     clearTimeout(timeout);

//     try {
//       const buffer = Buffer.concat(chunks);
//       const contentType = req.headers['content-type'] || '';
//       const userId = req.user?.id || 'demo-user'; // Use real auth when available

//       console.log(`[${traceId}] Received upload: ${buffer.length} bytes`);

//       // Validate multipart/form-data
//       if (!contentType.includes('multipart/form-data')) {
//         return res.status(400).json({ 
//           error: 'Expected multipart/form-data upload', 
//           traceId 
//         });
//       }

//       // Extract boundary
//       const boundary = contentType.split('boundary=')[1];
//       if (!boundary) {
//         return res.status(400).json({ 
//           error: 'No boundary found in multipart data', 
//           traceId 
//         });
//       }

//       // Parse multipart data
//       const { fileName, fileType, fileBuffer } = parseMultipartFormData(buffer, boundary);

//       if (!fileBuffer || !fileName) {
//         return res.status(400).json({ 
//           error: 'No file data found in FormData', 
//           traceId 
//         });
//       }

//       console.log(`[${traceId}] ✅ Extracted file: ${fileName} (${fileType}, ${fileBuffer.length} bytes)`);

//       // Create job
//       const fileMeta = { filename: fileName, mimetype: fileType, size: fileBuffer.length };
//       const jobId = createJob({ userId, fileMeta });
//       setJobStatus(jobId, { status: 'processing' });

//       let raw = null;
//       let parserUsed = 'unknown';

//       // ============================================
//       // PRIMARY PATH: Affinda API
//       // ============================================
//       try {
//         console.log(`[${traceId}] Attempting Affinda parser...`);
//         const status = await affindaStatus();

//         if (status.hasKey && !status.error) {
//           const result = await parseWithAffinda(fileBuffer, fileName, fileType);
//           raw = result.raw;
//           parserUsed = 'affinda';
//           console.log(`[${traceId}] ✅ Affinda parser succeeded`);
//         } else {
//           throw new Error(`Affinda not available: ${status.error || 'No API key'}`);
//         }
//       } catch (affindaError) {
//         // ============================================
//         // FALLBACK PATH: Local Universal Parser
//         // ============================================
//         console.log(`[${traceId}] ⚠️ Affinda failed: ${affindaError.message}`);
//         console.log(`[${traceId}] Falling back to local parser...`);

//         try {
//           const localResult = await parseResumeSimpleRobust(fileBuffer, fileName);

//           // Convert local parser result to Affinda-compatible format
//           const locationData = localResult.location || {};

//           raw = {
//             data: {
//               candidateName: localResult.candidateName || '',
//               email: localResult.email || '',
//               phone: localResult.phone || '',
//               location: {
//                 city: locationData.city || '',
//                 state: locationData.region || locationData.state || '',
//                 country: locationData.country || 'USA',
//                 postalCode: locationData.postalCode || ''
//               },
//               linkedin: localResult.linkedin || localResult.linkedinUrl || '',
//               linkedinUrl: localResult.linkedin || localResult.linkedinUrl || '',
//               workExperience: localResult.workExperience || localResult.work || [],
//               education: localResult.education || [],
//               skills: localResult.skills || []
//             },
//             meta: {
//               ready: true,
//               failed: false,
//               parser: 'local-universal'
//             }
//           };

//           parserUsed = 'local';
//           console.log(`[${traceId}] ✅ Local parser succeeded`);
//           console.log(`[${traceId}] Parsed:`, {
//             name: raw.data.candidateName,
//             email: raw.data.email,
//             workCount: raw.data.workExperience.length,
//             eduCount: raw.data.education.length
//           });
//         } catch (localError) {
//           console.error(`[${traceId}] ❌ Both parsers failed:`, localError.message);
//           throw new Error(`Parsing failed: ${affindaError.message}. Fallback: ${localError.message}`);
//         }
//       }

//       // ============================================
//       // UNIFIED MAPPING: Works for both sources
//       // ============================================
//       console.log(`[${traceId}] Mapping data from ${parserUsed} parser...`);
//       const { profileDraft, prefill } = mapToProfileDraft(raw);

//       // Normalize step3 to remove confidence objects
//       if (prefill?.step3) {
//         prefill.step3 = normalizeScalars(prefill.step3);
//       }

//       // Consolidate LinkedIn URLs
//       if (prefill?.step3) {
//         const linkedinUrl = prefill.step3.linkedinUrl || 
//                            prefill.step3.linkedIn || 
//                            prefill.step3.linkedin || '';

//         prefill.step3.linkedinUrl = linkedinUrl;
//         prefill.step3.linkedIn = linkedinUrl;
//         prefill.step3.linkedin = linkedinUrl;
//       }

//       // Save draft
//       saveDraft(userId, profileDraft);
//       setJobStatus(jobId, { status: 'complete' });

//       // Validate format integrity
//       if (!validateFormatIntegrity()) {
//         console.error(`[${traceId}] FORMAT PROTECTION: Files may have been modified`);
//       }

//       console.log(`[${traceId}] ✅ Parsing completed in ${Date.now() - t0}ms using ${parserUsed} parser`);

//       // Return result
//       return res.json({
//         success: true,
//         data: {
//           jobId,
//           status: 'complete',
//           prefill,
//           profileDraft,
//           confidence: 0.9,
//           metadata: {
//             parserUsed,
//             processingTime: Date.now() - t0,
//             traceId
//           }
//         }
//       });

//     } catch (error) {
//       clearTimeout(timeout);
//       console.error(`[${traceId}] ERROR:`, error.message);
//       console.error(error.stack);

//       if (!res.headersSent) {
//         res.status(500).json({
//           error: 'Parse error',
//           detail: error.message,
//           traceId
//         });
//       }
//     }
//   });

//   req.on('error', (error) => {
//     clearTimeout(timeout);
//     console.error(`[${traceId}] REQUEST ERROR:`, error.message);

//     if (!res.headersSent) {
//       res.status(400).json({
//         error: 'Request error',
//         detail: error.message,
//         traceId
//       });
//     }
//   });
// });

// // ============================================
// // HELPER ENDPOINTS
// // ============================================

// // GET /api/resume/status/:jobId
// router.get('/resume/status/:jobId', (req, res) => {
//   const job = getJob(req.params.jobId);
//   if (!job) return res.status(404).json({ error: 'Job not found' });
//   return res.json({ status: job.status, error: job.error || null });
// });

// // GET /api/debug/env
// router.get('/debug/env', async (req, res) => {
//   const status = await affindaStatus();
//   res.json({
//     hasApiKey: status.hasKey,
//     organization: status.organization,
//     workspace: status.workspace,
//     error: status.error
//   });
// });

// // GET /api/profile/draft
// router.get('/profile/draft', (req, res) => {
//   const userId = req.user?.id || 'demo-user';
//   const draft = getDraft(userId);

//   if (!draft) {
//     return res.status(204).end(); // No content
//   }

//   res.json({ draft });
// });

// export default router;

// server/routes/parse.js - AFFINDA ONLY MODE (NO FALLBACK)

import express from 'express';
import { parseWithAffinda, affindaStatus } from '../vendor/affindaAdapter.js';
import { parseWithClaude, claudeStatus } from '../vendor/claudeAdapter.js';
import { parseWithLocal, localParserStatus } from '../vendor/localParser.js';
import mapToProfileDraft from '../mappers/mapToProfileDraft.js';
import { createJob, setJobStatus, getJob, getDraft, saveDraft } from '../profileDraftStore.js';
import crypto from 'crypto';
import { formatProtectionMiddleware, validateFormatIntegrity } from '../middleware/formatProtection.js';

const router = express.Router();

// ============================================
// HELPER: Normalize confidence objects to scalars
// ============================================
function normalizeScalars(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const toScalar = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object' && 'value' in v) return v.value ?? '';
    if (typeof v === 'boolean' || typeof v === 'number') return v;
    return typeof v === 'string' ? v : '';
  };

  const out = Array.isArray(obj) ? [] : {};

  for (const k of Object.keys(obj)) {
    const val = obj[k];

    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if ('value' in val) {
        out[k] = toScalar(val);
      } else {
        out[k] = normalizeScalars(val);
      }
    } else if (Array.isArray(val)) {
      out[k] = val.map(normalizeScalars);
    } else {
      out[k] = toScalar(val);
    }
  }

  return out;
}

// ============================================
// HELPER: Generate trace ID for debugging
// ============================================
function generateTraceId() {
  return crypto.randomBytes(8).toString('hex');
}

// ============================================
// HELPER: Parse multipart form data
// ============================================
function parseMultipartFormData(buffer, boundary) {
  const boundaryBytes = Buffer.from(`--${boundary}`);
  const parts = [];
  let start = 0;

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

    // CHANGED: Accept both 'file' and 'resume' field names
    if (partStr.includes('name="file"') || partStr.includes('name="resume"')) {
      const filenameMatch = partStr.match(/filename="([^"]+)"/);
      if (filenameMatch) {
        fileName = filenameMatch[1];
      }

      const contentTypeMatch = partStr.match(/Content-Type:\s*([^\r\n]+)/);
      if (contentTypeMatch) {
        fileType = contentTypeMatch[1].trim();
      }

      const headerEndIndex = part.indexOf(Buffer.from('\r\n\r\n'));
      if (headerEndIndex !== -1) {
        fileBuffer = part.slice(headerEndIndex + 4);

        // Remove trailing CRLF
        while (fileBuffer.length > 0 &&
          (fileBuffer[fileBuffer.length - 1] === 0x0A ||
            fileBuffer[fileBuffer.length - 1] === 0x0D)) {
          fileBuffer = fileBuffer.slice(0, -1);
        }
        break;
      }
    }
  }

  return { fileName, fileType, fileBuffer };
}

// ============================================
// MAIN ENDPOINT: POST /api/resume/parse
// ============================================
router.post('/resume/parse', formatProtectionMiddleware, (req, res) => {
  const traceId = generateTraceId();
  const t0 = Date.now();

  console.log(`[${traceId}] Starting resume parsing...`, new Date().toISOString());

  // 90-second timeout as per Affinda recommendations
  const timeout = setTimeout(() => {
    console.error(`[${traceId}] TIMEOUT: Request exceeded 90 seconds`);
    if (!res.headersSent) {
      res.status(504).json({
        success: false,
        error: 'Request timeout',
        detail: 'Processing took longer than 90 seconds',
        traceId
      });
    }
  }, 90000);

  const chunks = [];

  req.on('data', chunk => chunks.push(chunk));

  req.on('end', async () => {
    clearTimeout(timeout);

    try {
      const buffer = Buffer.concat(chunks);
      const contentType = req.headers['content-type'] || '';
      const userId = req.user?.id || 'demo-user'; // Use real auth when available

      console.log(`[${traceId}] Received upload: ${buffer.length} bytes`);

      // Validate multipart/form-data
      if (!contentType.includes('multipart/form-data')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid content type',
          detail: 'Expected multipart/form-data upload',
          traceId
        });
      }

      // Extract boundary
      const boundary = contentType.split('boundary=')[1];
      if (!boundary) {
        return res.status(400).json({
          success: false,
          error: 'Invalid multipart data',
          detail: 'No boundary found in multipart data',
          traceId
        });
      }

      // Parse multipart data
      const { fileName, fileType, fileBuffer } = parseMultipartFormData(buffer, boundary);

      if (!fileBuffer || !fileName) {
        return res.status(400).json({
          success: false,
          error: 'Missing file data',
          detail: 'No file data found in FormData',
          traceId
        });
      }

      console.log(`[${traceId}] ✅ Extracted file: ${fileName} (${fileType}, ${fileBuffer.length} bytes)`);

      // Create job
      const fileMeta = { filename: fileName, mimetype: fileType, size: fileBuffer.length };
      const jobId = createJob({ userId, fileMeta });
      setJobStatus(jobId, { status: 'processing' });

      let raw = null;


      // // ============================================
      // // AFFINDA ONLY - NO FALLBACK MODE
      // // ============================================
      // try {
      //   console.log(`[${traceId}] Starting Affinda parse (no fallback mode)...`);

      //   // Check Affinda status first
      //   const status = await affindaStatus();
      //   console.log(`[${traceId}] Affinda status:`, {
      //     hasKey: status.hasKey,
      //     organization: status.organization,
      //     workspace: status.workspace,
      //     hasError: !!status.error
      //   });

      //   if (!status.hasKey) {
      //     throw new Error('Affinda API key not configured in environment variables');
      //   }

      //   if (status.error) {
      //     throw new Error(`Affinda service error: ${status.error}`);
      //   }

      //   // Parse with Affinda
      //   console.log(`[${traceId}] Calling Affinda API...`);
      //   const result = await parseWithAffinda(fileBuffer, fileName, fileType);
      //   raw = result.raw;

      //   console.log(`[${traceId}] ✅ Affinda parser succeeded`);
      //   console.log(`[${traceId}] Response structure:`, {
      //     hasData: !!raw.data,
      //     hasMeta: !!raw.meta,
      //     dataKeys: raw.data ? Object.keys(raw.data) : []
      //   });

      //   if (raw.data) {
      //     console.log(`[${traceId}] Extracted fields:`, {
      //       name: raw.data.name?.raw || raw.data.candidateName || 'N/A',
      //       email: raw.data.emails?.[0] || raw.data.email || 'N/A',
      //       phone: raw.data.phoneNumbers?.[0] || raw.data.phone || 'N/A',
      //       workCount: raw.data.workExperience?.length || 0,
      //       eduCount: raw.data.education?.length || 0,
      //       skillsCount: raw.data.skills?.length || 0
      //     });
      //   }

      // } catch (affindaError) {
      //   console.error(`[${traceId}] ❌ Affinda parsing failed:`, affindaError.message);
      //   console.error(`[${traceId}] Error stack:`, affindaError.stack);

      //   // Update job status to failed
      //   setJobStatus(jobId, {
      //     status: 'failed',
      //     error: affindaError.message
      //   });

      //   // Determine error type and provide appropriate response
      //   let statusCode = 500;
      //   let errorMessage = 'Affinda parsing failed';
      //   let suggestion = 'Please try again or contact support';

      //   const errorDetail = affindaError.message.toLowerCase();

      //   if (errorDetail.includes('no_parsing_credits') || errorDetail.includes('credits')) {
      //     statusCode = 402; // Payment Required
      //     errorMessage = 'Parsing credits exhausted';
      //     suggestion = 'Your Affinda credits have expired. Please contact sales@affinda.com or use a trial account';
      //   } else if (errorDetail.includes('api key') || errorDetail.includes('unauthorized')) {
      //     statusCode = 401;
      //     errorMessage = 'Affinda authentication failed';
      //     suggestion = 'Please check your Affinda API key configuration';
      //   } else if (errorDetail.includes('timeout')) {
      //     statusCode = 504;
      //     errorMessage = 'Affinda request timeout';
      //     suggestion = 'The parsing request took too long. Please try again';
      //   } else if (errorDetail.includes('rate limit')) {
      //     statusCode = 429;
      //     errorMessage = 'Affinda rate limit exceeded';
      //     suggestion = 'Too many requests. Please wait a moment and try again';
      //   }

      //   return res.status(statusCode).json({
      //     success: false,
      //     error: errorMessage,
      //     detail: affindaError.message,
      //     suggestion,
      //     traceId,
      //     jobId,
      //     metadata: {
      //       parserUsed: 'affinda',
      //       fallbackAvailable: false,
      //       processingTime: Date.now() - t0
      //     }
      //   });
      // }





      // ============================================
      // AFFINDA WITH LOCAL FALLBACK MODE
      // ============================================


      let parserUsed = 'unknown';

      try {
        console.log(`[${traceId}] Starting Claude parse with local fallback...`);

        // Check Claude status first
        const status = await claudeStatus();
        console.log(`[${traceId}] Claude status:`, {
          hasKey: status.hasKey,
          model: status.model,
          configured: status.configured
        });

        // Strategy 1: No Claude key configured → use local immediately
        if (!status.hasKey) {
          console.log(`[${traceId}] ⚠️  Claude not configured, using local parser`);

          try {
            const result = await parseWithLocal(fileBuffer, fileName, fileType);
            raw = result.raw;
            parserUsed = 'local';

            console.log(`[${traceId}] ✅ Local parser succeeded`);
            console.log(`[${traceId}] Extracted:`, {
              name: raw.data?.candidateName || 'N/A',
              email: raw.data?.email?.[0] || 'N/A',
              phone: raw.data?.phoneNumber?.[0] || 'N/A',
              skillsCount: raw.data?.skills?.length || 0
            });
          } catch (localError) {
            console.error(`[${traceId}] ❌ Local parser failed:`, localError.message);
            throw new Error(`Local parser failed: ${localError.message}`);
          }
        }
        // Strategy 2: Claude configured → try Claude first, fallback to local on failure
        else {
          try {
            console.log(`[${traceId}] Calling Claude API...`);
            const result = await parseWithClaude(fileBuffer, fileName, fileType);
            raw = result.raw;
            parserUsed = 'claude';

            console.log(`[${traceId}] ✅ Claude parser succeeded`);
            console.log(`[${traceId}] Response structure:`, {
              hasData: !!raw.data,
              hasMeta: !!raw.meta,
              dataKeys: raw.data ? Object.keys(raw.data) : []
            });

            if (raw.data) {
              console.log(`[${traceId}] Extracted fields:`, {
                name: raw.data.candidateName?.[0]?.raw || raw.data.name?.raw || 'N/A',
                email: raw.data.email?.[0] || 'N/A',
                phone: raw.data.phoneNumber?.[0] || 'N/A',
                workCount: raw.data.workExperience?.length || 0,
                eduCount: raw.data.education?.length || 0,
                skillsCount: raw.data.skills?.length || 0
              });
            }
          } catch (affindaError) {
            // Determine if fallback is appropriate
            const errorDetail = affindaError.message.toLowerCase();
            const shouldFallback =
              errorDetail.includes('timeout') ||
              errorDetail.includes('network') ||
              errorDetail.includes('econnrefused') ||
              errorDetail.includes('rate limit') ||
              affindaError.code === 'ECONNRESET';

            if (shouldFallback) {
              console.warn(`[${traceId}] ⚠️  Claude failed (recoverable), falling back to local parser`);
              console.warn(`[${traceId}] Claude error:`, affindaError.message);

              try {
                const result = await parseWithLocal(fileBuffer, fileName, fileType);
                raw = result.raw;
                parserUsed = 'local-fallback';

                console.log(`[${traceId}] ✅ Local fallback parser succeeded`);
                console.log(`[${traceId}] Extracted with fallback:`, {
                  name: raw.data?.candidateName || 'N/A',
                  email: raw.data?.email?.[0] || 'N/A',
                  skillsCount: raw.data?.skills?.length || 0
                });
              } catch (localError) {
                console.error(`[${traceId}] ❌ Local fallback also failed:`, localError.message);
                throw new Error(`Both parsers failed. Claude: ${affindaError.message}, Local: ${localError.message}`);
              }
              } else {
              // Critical Claude errors (auth, credits) should not fallback
              console.error(`[${traceId}] ❌ Claude parsing failed (non-recoverable):`, affindaError.message);

              // Update job status
              setJobStatus(jobId, {
                status: 'failed',
                error: affindaError.message
              });

              // Determine error type and response
              let statusCode = 500;
              let errorMessage = 'Claude parsing failed';
              let suggestion = 'Please try again or contact support';

              if (errorDetail.includes('api key') || errorDetail.includes('unauthorized')) {
                statusCode = 401;
                errorMessage = 'Claude authentication failed';
                suggestion = 'Please check your Claude API key configuration';
              } else if (errorDetail.includes('invalid') && errorDetail.includes('file')) {
                statusCode = 400;
                errorMessage = 'Invalid file format';
                suggestion = 'Please upload a valid PDF, DOCX, DOC, or TXT file';
              }

              return res.status(statusCode).json({
                success: false,
                error: errorMessage,
                detail: affindaError.message,
                suggestion,
                traceId,
                jobId,
                metadata: {
                  parserUsed: 'claude',
                  fallbackAttempted: false,
                  processingTime: Date.now() - t0
                }
              });
            }
          }
        }
      } catch (error) {
        // Critical error - all parsing strategies failed
        console.error(`[${traceId}] ❌ All parsers failed:`, error.message);
        console.error(`[${traceId}] Stack trace:`, error.stack);

        setJobStatus(jobId, {
          status: 'failed',
          error: error.message
        });

        return res.status(500).json({
          success: false,
          error: 'Parsing failed',
          detail: error.message,
          suggestion: 'Both Claude and local parsers failed. Please check the file format and try again',
          traceId,
          jobId,
          metadata: {
            parserUsed,
            allParsersFailed: true,
            processingTime: Date.now() - t0
          }
        });
      }





      // ============================================
      // DATA MAPPING AND NORMALIZATION
      // ============================================
      console.log(`[${traceId}] Mapping data from ${parserUsed} parser...`);
      const { profileDraft, prefill } = mapToProfileDraft(raw);

      // Add referralSource to step1
      if (prefill?.step1) {
        prefill.step1.referralSource = 'linkedin';
      }

      // Normalize step3 to remove confidence objects
      if (prefill?.step3) {
        prefill.step3 = normalizeScalars(prefill.step3);
      }

      // Consolidate LinkedIn URLs
      if (prefill?.step3) {
        const linkedinUrl = prefill.step3.linkedinUrl ||
          prefill.step3.linkedIn ||
          prefill.step3.linkedin || '';

        prefill.step3.linkedinUrl = linkedinUrl;
        prefill.step3.linkedIn = linkedinUrl;
        prefill.step3.linkedin = linkedinUrl;
      }

      // Build step2 prefill (Personal Information for Onb3)
      if (!prefill.step2) {
        const basics = profileDraft?.basics || {};
        const data = raw?.data || {};
        const personalDetails = data.personalDetails || {};
        const emergencyContact = data.emergencyContact || {};
        const location = data.location || basics.location || {};
        const residentialHistory = data.residentialHistory || [];
        
        // Handle Claude's format where email/phoneNumber are arrays
        const email = Array.isArray(data.email) ? data.email[0] : data.email;
        const phone = Array.isArray(data.phoneNumber) ? data.phoneNumber[0] : data.phoneNumber;
        
        prefill.step2 = {
          // Contact Information
          fullLegalName: basics.fullLegalName || basics.name || data.candidateName || '',
          preferredFirstName: personalDetails.preferredFirstName || basics.firstName || '',
          maidenName: personalDetails.maidenName || '',
          previousNames: personalDetails.previousNames || '',
          email: email || basics.email || '',
          phone: phone || basics.phone || '',
          linkedinUrl: personalDetails.linkedinUrl || basics.linkedinUrl || '',
          website: personalDetails.personalWebsite || basics.website || '',
          
          // Current Address
          streetAddress: location.streetAddress || basics.streetAddress || '',
          city: location.city || basics.city || '',
          state: location.state || basics.state || '',
          postalCode: location.postalCode || basics.postalCode || '',
          county: location.county || basics.county || '',
          country: location.country || basics.country || 'US',
          
          // Emergency Contact
          emergencyName: emergencyContact.name || '',
          emergencyRelationship: emergencyContact.relationship || '',
          emergencyPhone: emergencyContact.phone || '',
          emergencyPhoneAlt: emergencyContact.alternatePhone || '',
          
          // Sensitive Personal Information
          dlNumber: personalDetails.driversLicenseNumber || '',
          dlState: personalDetails.driversLicenseState || '',
          dateOfBirth: personalDetails.dateOfBirth || '',
          ssnLast4: personalDetails.ssnLast4 || '',
          
          // Residential History
          residentialHistory: residentialHistory.map(res => ({
            streetAddress: res.streetAddress || '',
            city: res.city || '',
            state: res.state || '',
            postalCode: res.postalCode || '',
            fromDate: res.fromDate || '',
            toDate: res.toDate || '',
            current: res.isCurrent || false
          }))
        };
      }

      // Build step4 prefill (Professional Information - work history, licenses, certifications, references)
      if (!prefill.step4) {
        const data = raw?.data || {};
        prefill.step4 = {
          workHistory: profileDraft?.work || data.workExperience || data.work || data.workHistory || [],
          licenses: data.licenses || [],
          certifications: data.certifications || [],
          references: data.references || []
        };
      }

      // ============================================
      // ✅ BUILD SUMMARY FOR TEST SCRIPT
      // ============================================
      const basics = profileDraft?.basics || {};
      const workArr = Array.isArray(profileDraft?.work) ? profileDraft.work : [];
      const eduArr = Array.isArray(profileDraft?.education) ? profileDraft.education : [];
      const skillArr = Array.isArray(profileDraft?.skills) ? profileDraft.skills : [];

      const summary = {
        name: basics.name || basics.legalName || 'N/A',
        email: basics.email || 'N/A',
        phone: basics.phone || 'N/A',
        location: (() => {
          const loc = basics.location || {};
          const parts = [
            loc.city || basics.city,
            loc.region || loc.state || basics.region || basics.stateRegion,
            loc.country || basics.country
          ].filter(Boolean);
          return parts.join(', ') || 'N/A';
        })(),
        skills: skillArr.map(s => {
          if (typeof s === 'string') return s;
          return s?.name || s?.skill || '';
        }).filter(Boolean),
        education: eduArr.map(e => ({
          degree: e?.highestDegree || e?.studyType || e?.degree || 'N/A',
          institution: e?.institutionName || e?.institution || 'N/A',
          startDate: e?.attendanceStartDate || '',
          graduationDate: e?.graduationDate || '',
          major: e?.majorFieldOfStudy || e?.area || ''
        })),
        workExperience: workArr.map(w => ({
          title: w?.jobTitle || w?.position || 'N/A',
          company: w?.companyName || w?.name || 'N/A',
          description: w?.description || w?.summary || '',
          startDate: w?.startDate || '',
          endDate: w?.endDate || '',
          location: w?.location || ''
        }))
      };

      console.log(`[${traceId}] Summary created:`, {
        name: summary.name,
        email: summary.email,
        skillsCount: summary.skills.length,
        educationCount: summary.education.length,
        workCount: summary.workExperience.length
      });

      // Save draft
      saveDraft(userId, profileDraft);
      setJobStatus(jobId, { status: 'complete' });

      // Validate format integrity
      if (!validateFormatIntegrity()) {
        console.error(`[${traceId}] FORMAT PROTECTION: Files may have been modified`);
      }

      const processingTime = Date.now() - t0;
      console.log(`[${traceId}] ✅ Parsing completed in ${processingTime}ms using ${parserUsed} parser`);

      // Return successful result with summary
      return res.json({
        success: true,
        data: {
          jobId,
          status: 'complete',
          summary,          // ← CRITICAL: Summary object for test compatibility
          prefill,
          profileDraft,
          confidence: 0.95
        },
        metadata: {
          parserUsed,
          fallbackUsed: false,
          processingTime,
          traceId,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      clearTimeout(timeout);
      console.error(`[${traceId}] ❌ CRITICAL ERROR:`, error.message);
      console.error(`[${traceId}] Stack trace:`, error.stack);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          detail: error.message,
          traceId,
          metadata: {
            processingTime: Date.now() - t0
          }
        });
      }
    }
  });

  req.on('error', (error) => {
    clearTimeout(timeout);
    console.error(`[${traceId}] ❌ REQUEST ERROR:`, error.message);

    if (!res.headersSent) {
      res.status(400).json({
        success: false,
        error: 'Request error',
        detail: error.message,
        traceId
      });
    }
  });
});

// ============================================
// HELPER ENDPOINTS
// ============================================

// GET /api/resume/status/:jobId
router.get('/resume/status/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }

  return res.json({
    success: true,
    jobId: req.params.jobId,
    status: job.status,
    error: job.error || null,
    timestamp: job.timestamp || null
  });
});

// GET /api/debug/env
router.get('/debug/env', async (req, res) => {
  try {
    const status = await claudeStatus();
    res.json({
      success: true,
      claude: {
        hasApiKey: status.hasKey,
        model: status.model || 'Not configured',
        configured: status.configured || false,
        status: status.hasKey && status.configured ? 'operational' : 'unavailable'
      },
      parser: {
        mode: 'claude-only',
        fallbackEnabled: false
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch environment status',
      detail: error.message
    });
  }
});

// GET /api/profile/draft
router.get('/profile/draft', (req, res) => {
  const userId = req.user?.id || 'demo-user';
  const draft = getDraft(userId);

  if (!draft) {
    return res.status(204).end(); // No content
  }

  res.json({
    success: true,
    draft,
    userId
  });
});

// GET /api/resume/parser-info
router.get('/resume/parser-info', (req, res) => {
  res.json({
    success: true,
    parser: {
      mode: 'claude-only',
      fallbackEnabled: false,
      description: 'Using Claude API exclusively for resume parsing'
    },
    features: {
      formats: ['PDF', 'DOCX', 'DOC', 'RTF', 'TXT'],
      maxFileSize: '10MB',
      timeout: '90 seconds'
    }
  });
});

export default router;
