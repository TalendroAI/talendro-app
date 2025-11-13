// --- Affinda response mapper with comprehensive field mapping ---

// Helper functions for data processing
const isArr = (x) => Array.isArray(x);
const arrify = (x) => (Array.isArray(x) ? x : (x == null ? [] : [x]));
const first = (xs) => (Array.isArray(xs) && xs.length ? xs[0] : null);
const toBool = (x) => Boolean(x && x !== 'false' && x !== '0');

// Very small "coalesce path" helper (dot paths, no bracket syntax)
function pick(o, paths) {
  for (const p of paths) {
    try {
      const v = p.split('.').reduce((a, k) => (a ? a[k] : undefined), o);
      if (v != null && v !== '') return v;
    } catch { /* ignore */ }
  }
  return null;
}

// Confidence scoring
const confidence = {
  high: (score) => ({ confidence: score }),
  med: (score) => ({ confidence: score }),
  low: (score) => ({ confidence: score })
};

// Value wrapper with confidence
function wrapVal(value, confidenceObj) {
  if (value == null || value === '') return null;
  return { value, ...confidenceObj };
}

// Split text into lines
function splitLines(text) {
  if (!text) return [];
  return text.toString().split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

// Normalize date to YYYY-MM format
function normDate(dateStr) {
  if (!dateStr) return null;
  const str = dateStr.toString().trim();
  if (str.match(/^\d{4}-\d{2}-\d{2}$/)) return str.slice(0, 7); // YYYY-MM-DD -> YYYY-MM
  if (str.match(/^\d{4}-\d{2}$/)) return str; // YYYY-MM
  if (str.match(/^\d{4}$/)) return str; // YYYY
  return str; // Pass through other formats
}

// Fallback extractors using regex patterns
function fallbackEmail(data) {
  const text = JSON.stringify(data);
  const match = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return match ? match[1] : '';
}

function fallbackPhone(data) {
  const text = JSON.stringify(data);
  const match = text.match(/(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/);
  return match ? match[1] : '';
}

function normalizeAffindaStandard(raw) {
  if (!raw || typeof raw !== 'object') return null;

  // Handle both direct response and nested data structures  
  const d = raw?.data || raw;
  if (!d || typeof d !== 'object') return null;

  // Normalize collections helper - handles both arrays and object-with-numeric-keys
  const norm = (x) => Array.isArray(x) ? x : Object.values(x || {}).filter(item => item && typeof item === 'object');

  let firstName = '';
  let lastName = '';

  // === NAME === (Unified mapping: parsed → listItem → direct → fallback)
  const nameList = norm(d?.candidateName?.listItem || d?.candidateName || []);
  const nameObj = first(nameList) || {};
  
  firstName = nameObj?.parsed?.firstName?.parsed || 
              nameObj?.firstName || 
              nameObj?.givenName || 
              d?.firstName || '';
              
  lastName = (nameObj?.parsed?.familyName?.parsed || 
              nameObj?.familyName || 
              nameObj?.surname || 
              d?.lastName || '').replace(/[,\s]+$/, '');

  // Fallback to full name parsing if needed
  if (!firstName && !lastName) {
    const full = d?.name || d?.fullName || null;
    if (full) {
      const parts = full.toString().trim().split(/\s+/);
      if (parts.length >= 2) {
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      } else if (parts.length === 1) {
        firstName = parts[0];
      }
    }
  }
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null;
  
  // === EMAIL === (Unified: listItem.value → listItem → array → fallback)
  const emails = d?.email?.listItem || d?.emails || d?.contactInfo?.emails || [];
  const emailFirst = first(emails);
  const email = (emailFirst?.value || emailFirst || '').toString().trim() || fallbackEmail(d);

  // === PHONE === (Extract from actual Affinda structure)
  // Try multiple possible phone data locations from Affinda
  const phones = d?.phoneNumber?.listItem || 
                 d?.phoneNumbers || 
                 d?.contactInfo?.phones || 
                 d?.phoneNumber || // Try direct phoneNumber array
                 [];
  
  const phoneFirst = first(phones);
  
  let phone = '';
  
  // Primary extraction from phone data
  if (phoneFirst) {
    // Try different field names from Affinda response
    phone = phoneFirst?.parsed?.formattedNumber || 
            phoneFirst?.parsed?.rawText ||
            phoneFirst?.formattedNumber || 
            phoneFirst?.rawText || 
            phoneFirst?.raw || 
            phoneFirst?.parsed || 
            phoneFirst?.value || 
            '';
    
    // If we got a parsed object, extract the formatted number
    if (typeof phone === 'object' && phone) {
      phone = phone.formattedNumber || phone.rawText || phone.formatted || phone.raw || phone.parsed || phone.value || '';
    }
    
    phone = phone.toString().trim();
    
    // Filter out non-phone data (IDs, etc.) - phone should contain digits/dashes/parens
    if (phone && !/[\d\s\-\(\)\+\.]{7,}/.test(phone)) {
      phone = '';
    }
  }
  
  // If no phone found, try fallback
  if (!phone) {
    phone = fallbackPhone(d) || '';
  }
  
  // Clean duplicated values
  phone = phone.split(/\s+/).filter((val, idx, arr) => arr.indexOf(val) === idx).join(' ').trim();
  
  // === LOCATION === (Unified: parsed → direct → fallback)
  const loc = d?.location || d?.address || d?.contactInfo?.address || {};
  const addressLine = loc?.parsed?.formatted || loc?.formatted || pick(loc, ['address','line1','street']) || null;
  const city = loc?.parsed?.city || loc?.city || null;
  const region = loc?.parsed?.state || loc?.parsed?.stateCode || loc?.state || loc?.stateCode || null;
  const postalCode = loc?.parsed?.postalCode || loc?.postalCode || loc?.zip || null;
  const countryCode = loc?.parsed?.countryCode || loc?.countryCode || loc?.country || null;

  // === OTHER BASICS ===
  const dob = d?.dateOfBirth || d?.dob || d?.birthDate || null;
  
  // === LINKEDIN === (Filter social media for LinkedIn)
  const socials = d?.socialMedia?.listItem || d?.socialProfiles || d?.social || [];
  const linkedinProfile = socials.find(s => 
    (s?.name || s?.platform || '').toLowerCase().includes('linkedin') ||
    (s?.url || '').toLowerCase().includes('linkedin')
  );
  
  let linkedin = linkedinProfile?.url || null;
  
  // If no full URL, try to construct from website data
  if (!linkedin) {
    const websites = d?.website?.listItem || d?.website || [];
    const linkedinDomain = websites.find(w => 
      (w?.raw || '').toLowerCase().includes('linkedin.com')
    );
    const linkedinHandle = websites.find(w => 
      !(w?.raw || '').includes('.') && (w?.raw || '').length > 3
    );
    
    if (linkedinDomain && linkedinHandle) {
      linkedin = `https://linkedin.com/in/${linkedinHandle.raw}`;
    }
  }

  // === WORK EXPERIENCE === (Unified: parsed → workExperienceDates → direct → fallback)
  const workItems = norm(d?.workExperience?.listItem || d?.workExperience || d?.experience || d?.positions || []);
  
  const work = workItems.map((w, idx) => {
    // Company
    const company = w?.parsed?.workExperienceOrganization || 
                    w?.workExperienceOrganization || 
                    w?.organization || 
                    w?.company || 
                    w?.employer || null;
    
    // Position  
    const position = w?.parsed?.workExperienceJobTitle || 
                     w?.workExperienceJobTitle || 
                     w?.jobTitle || 
                     w?.position || null;

    // Start Date (parsed → workExperienceDates → direct → dates)
    const startRaw = w?.parsed?.workExperienceStartDate?.parsed || 
                     w?.workExperienceDates?.start?.date ||
                     w?.startDate || 
                     w?.dates?.start || 
                     w?.start || null;
    
    // End Date + Current Status
    const endRaw = w?.parsed?.workExperienceEndDate?.parsed || 
                   w?.workExperienceDates?.end?.date ||
                   w?.endDate || 
                   w?.dates?.end || 
                   w?.end || null;
                   
    const isCurrent = toBool(w?.workExperienceDates?.end?.isCurrent || 
                            w?.parsed?.isCurrent || 
                            w?.isCurrent || 
                            w?.current);

    const startDate = normDate(startRaw);
    const endDate = isCurrent ? null : normDate(endRaw);

    // Location
    const wloc = w?.parsed?.workExperienceLocation?.parsed || 
                 w?.workExperienceLocation?.formatted || 
                 w?.location?.formatted || 
                 w?.location || null;
    
    // Description
    const desc = w?.parsed?.workExperienceDescription?.parsed || 
                 w?.workExperienceDescription || 
                 w?.description || '';
    
    // Employment Type
    const type = w?.parsed?.workExperienceType?.value || 
                 w?.workExperienceType?.value || 
                 w?.employmentType || null;

    return {
      company: wrapVal(company, confidence.high(0.9)),
      position: wrapVal(position, confidence.high(0.85)),
      startDate: wrapVal(startDate, startDate ? confidence.med(0.7) : confidence.low(0.3)),
      endDate: wrapVal(endDate, endDate ? confidence.med(0.7) : confidence.low(0.3)),
      location: wloc,
      type,
      isCurrent,
      highlights: splitLines(desc).slice(0, 8)
    };
  }).filter(x => x.company || x.position);

  // Sort work items by most recent first (current jobs, then by end/start date)
  work.sort((a, b) => {
    // Current jobs first
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    
    // Then by end date (most recent first), fall back to start date
    const aDate = a.endDate?.value || a.startDate?.value || '1900-01-01';
    const bDate = b.endDate?.value || b.startDate?.value || '1900-01-01';
    
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  // === EDUCATION === (Unified: parsed → educationDates → direct → fallback)
  const eduItems = norm(d?.education?.listItem || d?.education || d?.educationHistory || []);
  
  const education = eduItems.map((e, idx) => {
    // Institution
    const institution = e?.parsed?.educationOrganization || 
                        e?.educationOrganization || 
                        e?.organization || 
                        e?.institution || 
                        e?.school || null;
    
    // Degree/Study Type
    const studyType = e?.parsed?.educationAccreditation || 
                      e?.educationAccreditation || 
                      e?.educationLevel?.value || 
                      e?.degree || 
                      e?.qualification || 
                      e?.studyType || null;

    // Major/Area of Study  
    const majorsArr = e?.parsed?.educationMajor?.listItem || 
                      e?.educationMajor?.listItem || 
                      e?.majors || [];
    const area = first(majorsArr) || e?.area || e?.fieldOfStudy || null;

    // Dates (parsed → educationDates → direct → dates)
    const startRaw = e?.parsed?.educationStartDate?.parsed || 
                     e?.educationDates?.start?.date ||
                     e?.startDate || 
                     e?.dates?.start || 
                     e?.start || null;
                     
    const endRaw = e?.parsed?.educationEndDate?.parsed || 
                   e?.educationDates?.end?.date ||
                   e?.endDate || 
                   e?.dates?.end || 
                   e?.end || null;

    const startDate = normDate(startRaw);
    const endDate = normDate(endRaw);

    // GPA/Score
    const score = e?.educationGrade?.educationGradeScore || 
                  e?.score || 
                  e?.grade || 
                  e?.gpa || null;
    
    // Location
    const eloc = e?.educationLocation?.formatted || 
                 e?.location?.formatted || 
                 e?.location || null;

    return {
      institution: wrapVal(institution, confidence.high(0.85)),
      studyType: wrapVal(studyType, confidence.med(0.65)),
      area: wrapVal(area, confidence.med(0.65)),
      startDate: wrapVal(startDate, startDate ? confidence.med(0.6) : confidence.low(0.3)),
      endDate: wrapVal(endDate, endDate ? confidence.med(0.6) : confidence.low(0.3)),
      score,
      location: eloc
    };
  }).filter(x => x.institution || x.studyType || x.area);

  // === SKILLS === (Unified: parsed → listItem → array → fallback)
  const skillItems = norm(d?.skill?.listItem || d?.skill || d?.skills || []);
  
  const skills = skillItems
    .map(s => (s?.parsed?.skillName || s?.name || s?.value || s || '').toString().trim())
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i) // deduplicate
    .slice(0, 30)
    .map(name => ({ name, level: null, keywords: [] }));

  // === KEYWORDS === (Optional - if keywordSet exists)
  const keywordItems = norm(d?.keywordSet?.listItem || d?.keywordSet || []);
  const keywords = keywordItems
    .map(k => (k?.name || k?.value || k || '').toString().trim())
    .filter(Boolean);

  // === CURRENT JOB TITLE === (Use most recent sorted work item - ignore Affinda's currentJobTitle)
  let currentJobTitle = null;
  
  // ALWAYS use the most recent work item position instead of Affinda's currentJobTitle
  // This fixes issues where Affinda picks the wrong position as "current"
  if (work.length > 0) {
    // After sorting, work[0] should be the most recent job
    const mostRecentWork = work[0];
    
    // Extract the actual string value from the position object
    const positionObj = mostRecentWork?.position?.value;
    currentJobTitle = (typeof positionObj === 'object') 
      ? (positionObj?.parsed || positionObj?.raw || null)
      : (positionObj || null);
    
    console.log(`[JOB TITLE DEBUG] Extracted from work[0]: "${currentJobTitle}" (from ${typeof positionObj === 'object' ? 'object' : 'string'})`);
  } else {
    console.log(`[JOB TITLE DEBUG] No work experience found, will use Affinda fallback`);
  }
  
  // Only fall back to Affinda's field if no work experience found
  if (!currentJobTitle && d?.currentJobTitle) {
    if (typeof d.currentJobTitle === 'object') {
      currentJobTitle = d.currentJobTitle.parsed || d.currentJobTitle.raw || null;
    } else {
      currentJobTitle = d.currentJobTitle;
    }
    // Using Affinda's currentJobTitle as fallback
  }

  return {
    basics: {
      name: wrapVal(fullName, confidence.high(0.95)),
      email: wrapVal(email, confidence.high(0.9)),
      phone: wrapVal(phone, confidence.med(0.7)),
      dob: dob ? wrapVal(normDate(dob), confidence.low(0.4)) : null,
      linkedin: wrapVal(linkedin, confidence.med(0.6)),
      location: {
        address: wrapVal(addressLine, confidence.med(0.6)),
        city: wrapVal(city, confidence.med(0.6)),
        region: wrapVal(region, confidence.med(0.6)),
        postalCode: wrapVal(postalCode, confidence.med(0.6)),
        countryCode: wrapVal(countryCode, confidence.med(0.6))
      }
    },
    work,
    education,
    skills,
    keywords,
    currentJobTitle: wrapVal(currentJobTitle, confidence.high(0.9))
  };
}

// ---------- Prefill generator for Steps 3 / 5 / 6 ----------
function derivePrefill(draft) {
  const linkedInRaw = draft.basics.linkedin?.value || '';
  
  // Debug the job title extraction in derivePrefill
  console.log(`[DERIVEPREFILL DEBUG] draft.currentJobTitle:`, draft.currentJobTitle);
  console.log(`[DERIVEPREFILL DEBUG] draft.work[0]?.position:`, draft.work?.[0]?.position);
  
  // Force use work[0] position first, then fallback to currentJobTitle
  const workPosition = draft.work?.[0]?.position?.value;
  let currentTitleRaw = '';
  
  if (workPosition) {
    if (typeof workPosition === 'object') {
      currentTitleRaw = workPosition.parsed || workPosition.raw || '';
    } else {
      currentTitleRaw = workPosition || '';
    }
  } else if (draft.currentJobTitle?.value) {
    if (typeof draft.currentJobTitle.value === 'object') {
      currentTitleRaw = draft.currentJobTitle.value.parsed || draft.currentJobTitle.value.raw || '';
    } else {
      currentTitleRaw = draft.currentJobTitle.value || '';
    }
  }
                          
  console.log(`[DERIVEPREFILL DEBUG] Final currentTitleRaw: "${currentTitleRaw}"`);

  const step3 = {
    fullLegalName: draft.basics.name?.value || '',
    email: draft.basics.email?.value || '',
    phone: draft.basics.phone?.value || '',
    physicalAddress: [
      draft.basics.location?.city?.value,
      draft.basics.location?.region?.value,
      draft.basics.location?.countryCode?.value
    ].filter(Boolean).join(', '),
    
    // LinkedIn field name synonyms (backwards compatible)
    linkedIn: linkedInRaw,
    linkedin: linkedInRaw,
    linkedinUrl: linkedInRaw,
    
    // Current title field name synonyms (backwards compatible)
    currentJobTitle: currentTitleRaw,
    currentTitle: currentTitleRaw
  };

  const step5 = draft.education.map(e => ({
    institution: e.institution?.value || '',
    location: e.location || '',
    dates: `${e.startDate?.value || ''} - ${e.endDate?.value || ''}`.replace(/-\s*$/, '').trim(),
    degree: e.studyType?.value || '',
    major: e.area?.value || '',
    gpa: e.score || ''
  }));

  const step6 = draft.work.map(w => ({
    companyName: w.company?.value || '',
    companyAddress: '',
    jobTitle: w.position?.value || '',
    datesEmployed: `${w.startDate?.value || ''} - ${w.endDate?.value || 'Present'}`.replace(/-\s*$/, '').trim(),
    supervisorName: '',
    supervisorTitle: '',
    okToContact: '',
    startingSalary: '',
    endingSalary: '',
    reasonForLeaving: '',
    highlights: w.highlights || []
  }));

  return { step3, step5, step6 };
}

// Main mapping function that combines all the logic
function mapToProfileDraft(rawResponse) {
  const profileDraft = normalizeAffindaStandard(rawResponse);
  if (!profileDraft) return null;
  
  const prefill = derivePrefill(profileDraft);
  return { profileDraft, prefill };
}

export { mapToProfileDraft, normalizeAffindaStandard, derivePrefill };