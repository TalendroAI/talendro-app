// // server/vendor/affindaAdapter.js
// const API_BASE = 'https://api.affinda.com/v3'; // ← hardcode; ignore any AFFINDA_URL

// // const API_KEY = process.env.AFFINDA_API_KEY || '';
// // let ORG_ID = process.env.AFFINDA_ORG || 'GhjHNjjk'; // Your organization ID
// // let WORKSPACE_ID = process.env.AFFINDA_WORKSPACE || null;


// // Canonical names used EVERYWHERE below
// const API_KEY = process.env.AFFINDA_API_KEY || process.env.AFFINDAAPIKEY;
// let ORG_ID = process.env.AFFINDA_ORG_ID || process.env.AFFINDA_ORG || process.env.AFFINDAORG || 'GhjHNjjk';
// let WORKSPACE_ID = process.env.AFFINDA_WORKSPACE_ID || process.env.AFFINDA_WORKSPACE || process.env.AFFINDAWORKSPACE || 'pbsCNCJQ';

// console.log('[Affinda Adapter] boot env check:', {
//   AFFINDA_API_KEY: !!process.env.AFFINDA_API_KEY,
//   AFFINDAAPIKEY: !!process.env.AFFINDAAPIKEY,
//   ORG_ID,
//   WORKSPACE_ID
// });
// console.log('[Affinda Adapter] Configuration loaded:', { hasApiKey: !!API_KEY, orgId: ORG_ID, workspaceId: WORKSPACE_ID });



// function authHeaders(extra = {}) {
//   if (!API_KEY) throw new Error('AFFINDA_API_KEY missing');
//   return { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json', ...extra };
// }
// async function getJson(url) {
//   const res = await fetch(url, { headers: authHeaders() });
//   const body = await res.json().catch(() => ({}));
//   if (!res.ok) throw new Error(`[Affinda GET ${url}] ${res.status} ${JSON.stringify(body)}`);
//   return body;
// }
// const idOf = (o) => o?.identifier || o?.id || o?.uuid || null;
// const first = (a) => (Array.isArray(a) && a.length ? a[0] : null);

// async function resolveOrganizationId() {
//   if (ORG_ID) return ORG_ID;
//   const body = await getJson(`${API_BASE}/organizations`);
//   const org = first(body.results || body.data || body.items || []);
//   if (!org) throw new Error('No organizations on this key');
//   ORG_ID = idOf(org);
//   if (!ORG_ID) throw new Error('Could not resolve organization id');
//   return ORG_ID;
// }
// async function resolveWorkspaceId() {
//   // FALLBACK: Use known workspace ID directly - API listing isn't working
//   console.log(`[AFFINDA] Using known workspace ID: pbsCNCJQ`);
//   WORKSPACE_ID = 'pbsCNCJQ';
//   return WORKSPACE_ID;
// }

// async function getDocumentTypes() {
//   try {
//     const workspaceId = await resolveWorkspaceId();
//     const url = `${API_BASE}/document_types?workspace=${encodeURIComponent(workspaceId)}`;
//     console.log(`[AFFINDA] Fetching document types from:`, url);
//     const body = await getJson(url);
//     console.log(`[AFFINDA] Document types response:`, JSON.stringify(body, null, 2));

//     // FIXED: Handle direct array response
//     if (Array.isArray(body)) {
//       console.log(`[AFFINDA] Response is direct array with ${body.length} items`);
//       return body;
//     }

//     // Fallback to wrapped response
//     return body.results || body.data || body.items || [];
//     // } catch (error) {
//     //   console.log(`[AFFINDA] Error fetching document types:`, error.message);
//     //   return [];
//     // }
//   } catch (error) {
//     console.error('[Affinda] Parse error:', {
//       documentId: docId,
//       error: error.message,
//       response: error.response?.data
//     });
//     throw error;
//   }
// }

// // Rate limiting: 30 documents per minute as per Affinda recommendation
// let requestCount = 0;
// let lastResetTime = Date.now();
// const RATE_LIMIT = 30; // 30 documents per minute
// const RATE_WINDOW = 60000; // 1 minute in milliseconds

// function checkRateLimit() {
//   const now = Date.now();
//   if (now - lastResetTime >= RATE_WINDOW) {
//     requestCount = 0;
//     lastResetTime = now;
//   }

//   if (requestCount >= RATE_LIMIT) {
//     const waitTime = RATE_WINDOW - (now - lastResetTime);
//     throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
//   }

//   requestCount++;
// }

// // Exponential backoff retry logic
// async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       return await fn();
//     } catch (error) {
//       if (attempt === maxRetries) {
//         throw error;
//       }

//       // Check if it's a rate limit error
//       if (error.message.includes('Rate limit') || error.status === 429) {
//         const delay = baseDelay * Math.pow(2, attempt - 1);
//         console.log(`[AFFINDA] Rate limited, waiting ${delay}ms before retry ${attempt}/${maxRetries}`);
//         await new Promise(resolve => setTimeout(resolve, delay));
//         continue;
//       }

//       // For other errors, use shorter delay
//       const delay = baseDelay * attempt;
//       console.log(`[AFFINDA] Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
// }

// export async function parseWithAffinda(buffer, filename, mimetype) {
//   console.log(`[AFFINDA] Starting parse - checking workspace and document types...`);

//   // Check rate limit before proceeding
//   checkRateLimit();

//   return await retryWithBackoff(async () => {
//     const workspaceId = await resolveWorkspaceId();
//     console.log(`[AFFINDA] Resolved workspace ID:`, workspaceId);

//     // Get available document types to find the resume parser
//     const documentTypes = await getDocumentTypes();
//     console.log(`[AFFINDA] Got ${documentTypes.length} document types for selection`);
//     let resumeDocumentType = null;

//     if (documentTypes.length > 0) {
//       console.log(`[AFFINDA] Searching through ${documentTypes.length} document types...`);

//       // Look for "Resume Parser" specifically
//       for (const dt of documentTypes) {
//         console.log(`[AFFINDA] Checking document type: "${dt.name}" (${dt.identifier})`);
//         if (dt.name && dt.name.toLowerCase().includes('resume parser')) {
//           resumeDocumentType = dt;
//           console.log(`[AFFINDA] ✅ FOUND Resume Parser!`);
//           break;
//         }
//       }

//       if (!resumeDocumentType) {
//         console.log(`[AFFINDA] Resume Parser not found, looking for any resume type...`);
//         // Fallback to any resume-related type
//         for (const dt of documentTypes) {
//           if (dt.name && dt.name.toLowerCase().includes('resume')) {
//             resumeDocumentType = dt;
//             console.log(`[AFFINDA] ✅ FOUND fallback resume type: ${dt.name}`);
//             break;
//           }
//         }
//       }

//       if (resumeDocumentType) {
//         console.log(`[AFFINDA] Selected document type:`, resumeDocumentType.name, `ID:`, resumeDocumentType.identifier);
//       } else {
//         console.log(`[AFFINDA] No resume document type found, using first available:`, documentTypes[0].name);
//         resumeDocumentType = documentTypes[0];
//       }
//     }

//     const fd = new FormData(); // Node 18+: global FormData/Blob
//     fd.append('file', new Blob([buffer], { type: mimetype }), filename);

//     // Only add workspace if we have one
//     if (workspaceId) {
//       fd.append('workspace', workspaceId);
//     }

//     // Add document type if found
//     if (resumeDocumentType) {
//       const docTypeId = resumeDocumentType.identifier;
//       console.log(`[AFFINDA] Using document type ID:`, docTypeId);
//       fd.append('documentType', docTypeId);
//     } else {
//       console.log(`[AFFINDA] WARNING: No document type found - parsing may not work`);
//       console.log(`[AFFINDA] documentTypes array length:`, documentTypes.length);
//       console.log(`[AFFINDA] documentTypes content:`, documentTypes);
//     }

//     fd.append('wait', 'true');

//     const url = `${API_BASE}/documents`;
//     const res = await fetch(url, { method: 'POST', headers: authHeaders(), body: fd });

//     const body = await res.json().catch(() => ({}));
//     if (!res.ok) {
//       const msg = body?.errors?.length ? JSON.stringify(body.errors) : JSON.stringify(body);
//       throw new Error(`[Affinda POST ${url}] ${res.status} ${msg}`);
//     }

//     // FIXED: Get the document identifier and fetch the extracted data
//     const docId = body.meta?.identifier;
//     if (!docId) {
//       throw new Error('No document identifier returned from Affinda');
//     }

//     console.log(`[AFFINDA] Document processed: ${docId}, fetching extracted data...`);

//     // Fetch the extracted resume data
//     const dataUrl = `${API_BASE}/documents/${docId}`;
//     const dataRes = await fetch(dataUrl, { headers: authHeaders() });
//     const extractedData = await dataRes.json().catch(() => ({}));

//     console.log(`[AFFINDA] Second API call status:`, dataRes.status);
//     console.log(`[AFFINDA] Extracted data keys:`, Object.keys(extractedData));
//     console.log(`[AFFINDA] Has data section:`, !!extractedData.data);
//     if (extractedData.data) {
//       console.log(`[AFFINDA] Data section keys:`, Object.keys(extractedData.data));
//     }

//     // DEBUG: Check processing status in meta
//     if (extractedData.meta) {
//       console.log(`[AFFINDA] Document ready:`, extractedData.meta.ready);
//       console.log(`[AFFINDA] Document failed:`, extractedData.meta.failed);
//       console.log(`[AFFINDA] Processing complete:`, extractedData.meta.ready && !extractedData.meta.failed);
//     }

//     // If data is empty but document is ready, try the resume-specific endpoint
//     if (extractedData.data && Object.keys(extractedData.data).length === 0 && extractedData.meta?.ready) {
//       console.log(`[AFFINDA] Data empty but document ready, trying resume endpoint...`);
//       const resumeUrl = `${API_BASE}/resumes/${docId}`;
//       const resumeRes = await fetch(resumeUrl, { headers: authHeaders() });

//       console.log(`[AFFINDA] Resume endpoint status:`, resumeRes.status);
//       if (resumeRes.ok) {
//         const resumeData = await resumeRes.json().catch(() => ({}));
//         console.log(`[AFFINDA] Resume data full response:`, JSON.stringify(resumeData).substring(0, 1000));
//         console.log(`[AFFINDA] Resume data keys:`, Object.keys(resumeData));
//         if (resumeData.data) {
//           console.log(`[AFFINDA] Resume data section keys:`, Object.keys(resumeData.data));
//           if (Object.keys(resumeData.data).length > 0) {
//             console.log(`[AFFINDA] SUCCESS! Found resume data in resume endpoint!`);
//             return { raw: resumeData };
//           }
//         }
//       } else {
//         const errorData = await resumeRes.json().catch(() => ({}));
//         console.log(`[AFFINDA] Resume endpoint error:`, JSON.stringify(errorData));
//       }
//     }

//     if (!dataRes.ok) {
//       const msg = extractedData?.errors?.length ? JSON.stringify(extractedData.errors) : JSON.stringify(extractedData);
//       throw new Error(`[Affinda GET ${dataUrl}] ${dataRes.status} ${msg}`);
//     }

//     return { raw: extractedData };
//   });
// }

// export async function affindaStatus() {
//   try {
//     const org = await resolveOrganizationId();
//     const ws = await resolveWorkspaceId();
//     return { hasKey: !!API_KEY, organization: org, workspace: ws, error: null };
//   } catch (e) {
//     return { hasKey: !!API_KEY, organization: ORG_ID, workspace: WORKSPACE_ID, error: String(e.message || e) };
//   }
// }


// server/vendor/affindaAdapter.js
const API_BASE = 'https://api.affinda.com/v3';

// Canonical names used EVERYWHERE below
const API_KEY = process.env.AFFINDA_API_KEY || process.env.AFFINDAAPIKEY;
let ORG_ID = process.env.AFFINDA_ORG_ID || process.env.AFFINDA_ORG || process.env.AFFINDAORG || 'GhjHNjjk';
let WORKSPACE_ID = process.env.AFFINDA_WORKSPACE_ID || process.env.AFFINDA_WORKSPACE || process.env.AFFINDAWORKSPACE || 'pbsCNCJQ';

console.log('[Affinda Adapter] boot env check:', {
  AFFINDA_API_KEY: !!process.env.AFFINDA_API_KEY,
  AFFINDAAPIKEY: !!process.env.AFFINDAAPIKEY,
  ORG_ID,
  WORKSPACE_ID
});
console.log('[Affinda Adapter] Configuration loaded:', { hasApiKey: !!API_KEY, orgId: ORG_ID, workspaceId: WORKSPACE_ID });

function authHeaders(extra = {}) {
  if (!API_KEY) throw new Error('AFFINDA_API_KEY missing');
  return { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json', ...extra };
}

async function getJson(url) {
  const res = await fetch(url, { headers: authHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`[Affinda GET ${url}] ${res.status} ${JSON.stringify(body)}`);
  return body;
}

const idOf = (o) => o?.identifier || o?.id || o?.uuid || null;
const first = (a) => (Array.isArray(a) && a.length ? a[0] : null);

async function resolveOrganizationId() {
  if (ORG_ID) return ORG_ID;
  const body = await getJson(`${API_BASE}/organizations`);
  const org = first(body.results || body.data || body.items || []);
  if (!org) throw new Error('No organizations on this key');
  ORG_ID = idOf(org);
  if (!ORG_ID) throw new Error('Could not resolve organization id');
  return ORG_ID;
}

async function resolveWorkspaceId() {
  console.log(`[AFFINDA] Using known workspace ID: ${WORKSPACE_ID}`);
  return WORKSPACE_ID;
}

async function getDocumentTypes() {
  try {
    const workspaceId = await resolveWorkspaceId();
    const url = `${API_BASE}/document_types?workspace=${encodeURIComponent(workspaceId)}`;
    console.log(`[AFFINDA] Fetching document types from:`, url);
    const body = await getJson(url);

    // Handle direct array response
    if (Array.isArray(body)) {
      console.log(`[AFFINDA] Response is direct array with ${body.length} items`);
      return body;
    }

    // Fallback to wrapped response
    return body.results || body.data || body.items || [];
  } catch (error) {
    console.error('[Affinda] getDocumentTypes error:', {
      error: error.message
    });
    throw error;
  }
}

// Rate limiting: 30 documents per minute
let requestCount = 0;
let lastResetTime = Date.now();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60000;

function checkRateLimit() {
  const now = Date.now();
  if (now - lastResetTime >= RATE_WINDOW) {
    requestCount = 0;
    lastResetTime = now;
  }

  if (requestCount >= RATE_LIMIT) {
    const waitTime = RATE_WINDOW - (now - lastResetTime);
    throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
  }

  requestCount++;
}

// Exponential backoff retry logic
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Check if it's a rate limit error
      if (error.message.includes('Rate limit') || error.status === 429) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`[AFFINDA] Rate limited, waiting ${delay}ms before retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // For other errors, use shorter delay
      const delay = baseDelay * attempt;
      console.log(`[AFFINDA] Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function parseWithAffinda(buffer, filename, mimetype) {
  console.log(`[AFFINDA] Starting parse - checking workspace and document types...`);

  // Re-read environment at call-time for safety
  const liveKey = process.env.AFFINDA_API_KEY || process.env.AFFINDAAPIKEY;
  if (!liveKey) {
    console.warn(`[AFFINDA] No API key at call-time`);
    throw new Error('Affinda not available: No API key');
  }

  checkRateLimit();

  return await retryWithBackoff(async () => {
    const workspaceId = await resolveWorkspaceId();
    console.log(`[AFFINDA] Resolved workspace ID:`, workspaceId);

    // Get available document types to find the resume parser
    const documentTypes = await getDocumentTypes();
    console.log(`[AFFINDA] Got ${documentTypes.length} document types for selection`);
    let resumeDocumentType = null;

    if (documentTypes.length > 0) {
      console.log(`[AFFINDA] Searching through ${documentTypes.length} document types...`);

      // Look for "Resume Parser" specifically
      for (const dt of documentTypes) {
        console.log(`[AFFINDA] Checking document type: "${dt.name}" (${dt.identifier})`);
        if (dt.name && dt.name.toLowerCase().includes('resume parser')) {
          resumeDocumentType = dt;
          console.log(`[AFFINDA] ✅ FOUND Resume Parser!`);
          break;
        }
      }

      if (!resumeDocumentType) {
        console.log(`[AFFINDA] Resume Parser not found, looking for any resume type...`);
        // Fallback to any resume-related type
        for (const dt of documentTypes) {
          if (dt.name && dt.name.toLowerCase().includes('resume')) {
            resumeDocumentType = dt;
            console.log(`[AFFINDA] ✅ FOUND fallback resume type: ${dt.name}`);
            break;
          }
        }
      }

      if (resumeDocumentType) {
        console.log(`[AFFINDA] Selected document type:`, resumeDocumentType.name, `ID:`, resumeDocumentType.identifier);
      } else if (documentTypes.length > 0) {
        console.log(`[AFFINDA] No resume document type found, using first available:`, documentTypes[0].name);
        resumeDocumentType = documentTypes[0];
      }
    }

    const fd = new FormData();
    fd.append('file', new Blob([buffer], { type: mimetype }), filename);

    // Only add workspace if we have one
    if (workspaceId) {
      fd.append('workspace', workspaceId);
    }

    // Add document type if found
    if (resumeDocumentType) {
      const docTypeId = resumeDocumentType.identifier;
      console.log(`[AFFINDA] Using document type ID:`, docTypeId);
      fd.append('documentType', docTypeId);
    } else {
      console.log(`[AFFINDA] WARNING: No document type found - parsing may not work`);
    }

    fd.append('wait', 'true');

    const url = `${API_BASE}/documents`;
    // Use live key in headers
    const headers = { Authorization: `Bearer ${liveKey}`, Accept: 'application/json' };
    const res = await fetch(url, { method: 'POST', headers, body: fd });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = body?.errors?.length ? JSON.stringify(body.errors) : JSON.stringify(body);
      throw new Error(`[Affinda POST ${url}] ${res.status} ${msg}`);
    }

    // Get the document identifier
    const docId = body.meta?.identifier;
    if (!docId) {
      throw new Error('No document identifier returned from Affinda');
    }

    console.log(`[AFFINDA] Document processed: ${docId}, fetching extracted data...`);

    // Fetch the extracted resume data
    const dataUrl = `${API_BASE}/documents/${docId}`;
    const dataRes = await fetch(dataUrl, { headers });
    const extractedData = await dataRes.json().catch(() => ({}));

    console.log(`[AFFINDA] Second API call status:`, dataRes.status);
    console.log(`[AFFINDA] Extracted data keys:`, Object.keys(extractedData));
    console.log(`[AFFINDA] Has data section:`, !!extractedData.data);
    if (extractedData.data) {
      console.log(`[AFFINDA] Data section keys:`, Object.keys(extractedData.data));
    }

    // If data is empty but document is ready, try the resume-specific endpoint
    if (extractedData.data && Object.keys(extractedData.data).length === 0 && extractedData.meta?.ready) {
      console.log(`[AFFINDA] Data empty but document ready, trying resume endpoint...`);
      const resumeUrl = `${API_BASE}/resumes/${docId}`;
      const resumeRes = await fetch(resumeUrl, { headers });

      console.log(`[AFFINDA] Resume endpoint status:`, resumeRes.status);
      if (resumeRes.ok) {
        const resumeData = await resumeRes.json().catch(() => ({}));
        console.log(`[AFFINDA] Resume data keys:`, Object.keys(resumeData));
        if (resumeData.data && Object.keys(resumeData.data).length > 0) {
          console.log(`[AFFINDA] SUCCESS! Found resume data in resume endpoint!`);
          return { raw: resumeData };
        }
      } else {
        const errorData = await resumeRes.json().catch(() => ({}));
        console.log(`[AFFINDA] Resume endpoint error:`, JSON.stringify(errorData));
      }
    }

    if (!dataRes.ok) {
      const msg = extractedData?.errors?.length ? JSON.stringify(extractedData.errors) : JSON.stringify(extractedData);
      throw new Error(`[Affinda GET ${dataUrl}] ${dataRes.status} ${msg}`);
    }

    return { raw: extractedData };
  });
}

export async function affindaStatus() {
  try {
    const org = await resolveOrganizationId();
    const ws = await resolveWorkspaceId();
    return { hasKey: !!API_KEY, organization: org, workspace: ws, error: null };
  } catch (e) {
    return { hasKey: !!API_KEY, organization: ORG_ID, workspace: WORKSPACE_ID, error: String(e.message || e) };
  }
}


