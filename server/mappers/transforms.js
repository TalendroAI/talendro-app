// /**
//  * RECURSIVE flatten: Handles Affinda's deeply nested confidence structures
//  * Supports { value: ..., confidence: ... }, arrays, objects with .raw, plain scalars
//  */
// export const flattenValue = (v) => {
//   if (!v) return '';

//   // Handle confidence objects: { value: ..., confidence: 0.9 }
//   if (typeof v === 'object' && 'value' in v) {
//     return flattenValue(v.value); // ✅ RECURSIVE call
//   }

//   // Handle objects with 'raw' property: { raw: "actual value" }
//   if (typeof v === 'object' && !Array.isArray(v) && 'raw' in v) {
//     return String(v.raw || '');
//   }

//   // Handle arrays: take first item and recurse
//   if (Array.isArray(v)) {
//     if (v.length === 0) return '';
//     return flattenValue(v[0]); // ✅ RECURSIVE call on first item
//   }

//   // Handle nested objects (like name.parsed.firstName)
//   if (typeof v === 'object' && v !== null) {
//     // Check for common nested fields
//     if (v.parsed?.raw) return String(v.parsed.raw);
//     if (v.firstName && v.familyName) return `${v.firstName} ${v.familyName}`.trim();
//     if (v.raw) return String(v.raw);

//     // Last resort: try to find any string value
//     const stringVal = Object.values(v).find(val => typeof val === 'string');
//     if (stringVal) return stringVal;

//     return '';
//   }

//   // Plain scalars: string, number, boolean
//   if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
//     return String(v);
//   }

//   return '';
// };

// /**
//  * Check if a string represents "current" or "present" employment/education
//  */
// export const isPresentLike = (s) => {
//   if (!s || typeof s !== 'string') return false;
//   return /present|current|now|ongoing|today/i.test(s.trim());
// };

// /**
//  * Normalize dates to ISO format (yyyy-MM-dd)
//  * Handles various input formats and "Present" strings
//  */
// export const normalizeDate = (s) => {
//   if (!s) return '';

//   const t = String(flattenValue(s)).trim();
//   if (!t) return '';

//   // Skip "present" strings - handled via current flag
//   if (isPresentLike(t)) return '';

//   // Already in ISO format
//   if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;

//   // yyyy-MM format -> add day
//   if (/^\d{4}-\d{2}$/.test(t)) return `${t}-01`;

//   // yyyy format -> add month and day
//   if (/^\d{4}$/.test(t)) return `${t}-01-01`;

//   // Try parsing as date
//   try {
//     const d = new Date(t);
//     if (isNaN(d.getTime())) return '';
//     return d.toISOString().split('T')[0];
//   } catch {
//     return '';
//   }
// };

// /**
//  * Strip section headers like "EDUCATION\n\nEckerd College" -> "Eckerd College"
//  * Removes leading uppercase section titles and extra whitespace
//  */
// export const stripSectionHeaders = (s) => {
//   if (!s) return '';
//   return String(s)
//     .replace(/^[A-Z][A-Z\s]*\n+/g, '') // Remove "EDUCATION\n\n"
//     .replace(/^[A-Z][A-Z\s]*:/g, '')   // Remove "EDUCATION:"
//     .trim();
// };

// /**
//  * Normalize LinkedIn URLs from various field names
//  * Only returns valid LinkedIn URLs
//  */
// export const normalizeLinkedIn = (...vals) => {
//   const first = vals.find(v => {
//     const flat = flattenValue(v);
//     return flat && String(flat).includes('linkedin');
//   });

//   if (!first) return '';

//   const u = String(flattenValue(first)).trim();

//   // Must contain linkedin.com to be valid
//   if (!/linkedin\.com/i.test(u)) return '';

//   // Add https if missing protocol
//   if (!/^https?:\/\//i.test(u)) {
//     return `https://${u}`;
//   }

//   return u;
// };

// /**
//  * Coalesce multiple values - return first non-empty
//  */
// export const coalesce = (...vals) => {
//   for (const v of vals) {
//     const flat = flattenValue(v);
//     if (flat && flat !== '') return flat;
//   }
//   return '';
// };

// /**
//  * Safe string trim
//  */
// export const safeTrim = (s) => {
//   if (!s) return '';
//   return String(flattenValue(s)).trim();
// };

// /**
//  * Deduplicate array of strings (case-insensitive)
//  */
// export const dedupeStrings = (arr) => {
//   if (!Array.isArray(arr)) return [];
//   const seen = new Set();
//   return arr.filter(item => {
//     const key = String(item || '').toLowerCase().trim();
//     if (!key || seen.has(key)) return false;
//     seen.add(key);
//     return true;
//   });
// };

// /**
//  * Extract phone number and clean format
//  */
// export const normalizePhone = (p) => {
//   if (!p) return '';
//   const phone = String(flattenValue(p)).trim();
//   // Remove common formatting but keep digits and basic separators
//   return phone.replace(/[^\d\s\-\(\)\+]/g, '').trim();
// };

// /**
//  * Array helpers that DO NOT collapse arrays
//  */
// export const getArray = (arrLike) => {
//   if (!arrLike) return [];
//   if (Array.isArray(arrLike)) return arrLike;
//   if (typeof arrLike === 'object' && Array.isArray(arrLike.value)) return arrLike.value;
//   return [];
// };

// /**
//  * Extract and flatten array items that may have confidence wrappers
//  * Unwraps exactly one level at the item boundary
//  */
// export const extractArrayItems = (arrLike) => {
//   const arr = getArray(arrLike);
//   return arr
//     .map(item => (item && typeof item === 'object' && 'value' in item) ? item.value : item)
//     .filter(Boolean);
// };

// /**
//  * Extract array of items (skills, phones, etc.) preserving list shape
//  */
// export const extractArray = (arrLike) => {
//   const arr = getArray(arrLike);
//   return arr.map(item => flattenValue(item)).filter(Boolean);
// };

// /**
//  * ✅ NEW: Parse "City, ST" (and optional ZIP) from any text line
//  * Returns { city, state, country, postalCode } or blanks if not found
//  */
// export const parseCityStateFromText = (text) => {
//   if (!text) return { city: '', state: '', country: '', postalCode: '' };
//   const s = String(text).trim();

//   // "City, ST ZIP" e.g., "Washington, DC 20001"
//   let m = s.match(/([A-Za-z .'-]+),\s*([A-Z]{2})(?:\s+(\d{5}(?:-\d{4})?))?(?!.*,[^,]*[A-Z]{2})/);
//   if (m) {
//     return {
//       city: m[1].trim(),
//       state: m[2].toUpperCase(),
//       country: '',
//       postalCode: (m[3] || '').trim()
//     };
//   }

//   // "City, ST" e.g., "McLean, VA"
//   m = s.match(/([A-Za-z .'-]+),\s*([A-Z]{2})(?!.*,[^,]*[A-Z]{2})/);
//   if (m) {
//     return {
//       city: m[1].trim(),
//       state: m[2].toUpperCase(),
//       country: '',
//       postalCode: ''
//     };
//   }

//   return { city: '', state: '', country: '', postalCode: '' };
// };

// /**
//  * Parse location object to individual components
//  * Enhanced: handles objects, one-level wrapped objects, and "City, ST 12345" strings
//  */
// export const parseLocation = (loc) => {
//   if (!loc) return { city: '', state: '', country: '', postalCode: '' };

//   // Unwrap one level for objects like { value: {...} }
//   if (typeof loc === 'object' && 'value' in loc) loc = loc.value;

//   // String fallback: use parseCityStateFromText
//   if (typeof loc === 'string') {
//     return parseCityStateFromText(loc);
//   }

//   // Object fallback (Affinda-style)
//   return {
//     city: safeTrim(loc.city || loc.locality),
//     state: safeTrim(loc.region || loc.state || loc.stateRegion),
//     country: safeTrim(loc.countryCode || loc.country),
//     postalCode: safeTrim(loc.postalCode || loc.zipCode || loc.postal)
//   };
// };

// /**
//  * Extract email from Affinda's structures
//  */
// export const extractEmail = (emailData) => {
//   if (!emailData) return '';

//   // Avoid collapsing arrays; if array, return first usable
//   if (Array.isArray(emailData)) {
//     const first = emailData[0];
//     if (!first) return '';
//     if (typeof first === 'string') return first;
//     if (first.email) return String(first.email);
//     if (first.address) return String(first.address);
//     if (first.value) return String(first.value);
//     return flattenValue(first);
//   }

//   // If wrapped or scalar, flatten then interpret
//   const flattened = flattenValue(emailData);

//   if (Array.isArray(flattened)) {
//     const first = flattened[0];
//     if (!first) return '';
//     if (typeof first === 'string') return first;
//     if (first.email) return String(first.email);
//     if (first.address) return String(first.address);
//     if (first.value) return String(first.value);
//     return flattenValue(first);
//   }

//   if (typeof flattened === 'string') return flattened;

//   if (flattened?.email) return String(flattened.email);
//   if (flattened?.address) return String(flattened.address);

//   return '';
// };

// /**
//  * ✅ FIX 4: Enhanced name extraction with structured first/last name support
//  * Handles Affinda's various name field structures
//  */
// export const extractName = (data) => {
//   // Try standard coalesce first
//   let name = coalesce(
//     data?.candidateName?.[0]?.raw,
//     data?.name?.value?.[0]?.raw,
//     data?.name?.[0]?.raw,
//     data?.name?.raw,
//     data?.fullName,
//     data?.candidateName
//   );

//   // Compose from first/last if raw is missing
//   if (!name && data?.name) {
//     const firstName = data.name.first || data.name.firstName || data.name.givenName;
//     const lastName = data.name.last || data.name.lastName || data.name.familyName;
//     if (firstName || lastName) {
//       name = [firstName, lastName].filter(Boolean).join(' ');
//       console.log('[Transform] Extracted name from first/last:', name);
//     }
//   }

//   // Check for nested parsed structure
//   if (!name && data?.name?.parsed) {
//     const fn = data.name.parsed.firstName || data.name.parsed.givenName;
//     const ln = data.name.parsed.familyName || data.name.parsed.lastName;
//     if (fn || ln) {
//       name = [fn, ln].filter(Boolean).join(' ');
//       console.log('[Transform] Extracted name from parsed:', name);
//     }
//   }

//   console.log('[Transform] Final extracted name:', name || 'N/A');
//   return name || '';
// };

// /**
//  * ✅ FIX 5: Enhanced skills extraction with relaxed filtering
//  * Avoids over-pruning while keeping noise low
//  */
// export const extractSkills = (skillsData) => {
//   console.log('[extractSkills] Input type:', typeof skillsData, 'isArray:', Array.isArray(skillsData));
  
//   let skillNames = [];

//   if (Array.isArray(skillsData)) {
//     skillNames = skillsData.map(s => {
//       if (typeof s === 'string') {
//         return s.replace(/[,;]/g, '').trim();
//       }
//       const name = safeTrim(coalesce(s.name, s.skill, s.value, s));
//       return name.replace(/[,;]/g, '').trim();
//     });
//   } else if (typeof skillsData === 'string') {
//     skillNames = skillsData.split(/[,;]/).map(s => s.trim());
//   }

//   console.log('[extractSkills] Raw extracted:', skillNames.length, 'skills');

//   // ✅ UPDATED: Relaxed filtering logic
//   const cleaned = dedupeStrings(skillNames)
//     .filter(s => {
//       if (!s || s.length < 2) return false;
//       // Keep short tech tokens (C, R, Go, JS, C#, etc.)
//       if (s.length === 2 && /^[A-Z]{1,2}$/i.test(s)) return true;
//       if (s.length === 3 && /^[A-Z]{2,3}$/i.test(s)) return true; // SQL, AWS, API, etc.
//       // Remove obvious section headers only
//       if (/^\s*(skills?|technical skills?|core competencies)\s*$/i.test(s)) return false;
//       return true;
//     })
//     .slice(0, 50); // Allow more headroom before UI caps

//   console.log('[extractSkills] After dedupe/filter:', cleaned.length, 'skills');
//   return cleaned;
// };

// /**
//  * ✅ FIX 6: Extract work bullets from raw text when structured data is missing
//  * Fallback to raw text parsing for bullet points
//  */
// export const extractWorkDescription = (workItem) => {
//   let description = safeTrim(
//     workItem.parsed?.workExperienceDescription?.raw || 
//     workItem.parsed?.workExperienceDescription?.parsed ||
//     workItem.jobDescription || 
//     workItem.description || 
//     workItem.summary
//   );

//   // ✅ NEW: If description is missing or has no bullets, extract from raw text
//   if (!description || (description.match(/•/g)?.length || 0) < 1) {
//     const rawText = String(workItem?.raw || '');
//     const firstBullet = rawText.indexOf('•');
    
//     if (firstBullet !== -1) {
//       const bullets = rawText
//         .substring(firstBullet)
//         .split('•')
//         .map(b => b.replace(/\s+/g, ' ').trim())
//         .filter(Boolean);
      
//       if (bullets.length > 0) {
//         description = bullets.join(' • ');
//         console.log('[Transform] Extracted', bullets.length, 'bullets from raw text');
//       }
//     }
//   }

//   return description;
// };

// /**
//  * ✅ FIX 7: Extract education with institution/degree fallback from raw text
//  * Parses text when structured data is incomplete
//  */
// export const extractEducationFields = (eduItem) => {
//   let degree = safeTrim(
//     eduItem.parsed?.educationAccreditation?.raw ||
//     eduItem.parsed?.educationAccreditation?.parsed?.education ||
//     eduItem.accreditation?.education ||
//     eduItem.studyType ||
//     eduItem.degree
//   );

//   let institution = safeTrim(
//     eduItem.parsed?.educationOrganization?.raw ||
//     eduItem.parsed?.educationOrganization?.parsed ||
//     eduItem.organization?.name ||
//     eduItem.institution ||
//     eduItem.school
//   );

//   // ✅ NEW: If either degree or institution missing, parse from raw lines
//   if (!degree || !institution) {
//     const lines = String(flattenValue(eduItem?.raw || ''))
//       .split(/\r?\n/)
//       .map(s => s.trim())
//       .filter(Boolean);
    
//     const instLine = lines.find(l => /(university|college|institute|school)/i.test(l));
//     if (!institution && instLine) {
//       institution = stripSectionHeaders(instLine);
//       console.log('[Transform] Fallback institution:', institution);
//     }
    
//     const degLine = lines.find(l => /(bachelor|master|ph\.?d|associate|diploma)/i.test(l));
//     if (!degree && degLine) {
//       degree = stripSectionHeaders(degLine.replace(/[,;]/g, ''));
//       console.log('[Transform] Fallback degree:', degree);
//     }
//   }

//   return { degree, institution };
// };


/**
 * transforms.js - Data transformation utilities
 */

export const flattenValue = (v) => {
  if (!v) return '';

  if (typeof v === 'object' && 'value' in v) {
    return flattenValue(v.value);
  }

  if (typeof v === 'object' && !Array.isArray(v) && 'raw' in v) {
    return String(v.raw || '');
  }

  if (Array.isArray(v)) {
    if (v.length === 0) return '';
    return flattenValue(v[0]);
  }

  if (typeof v === 'object' && v !== null) {
    if (v.parsed?.raw) return String(v.parsed.raw);
    if (v.firstName && v.familyName) return `${v.firstName} ${v.familyName}`.trim();
    if (v.raw) return String(v.raw);

    const stringVal = Object.values(v).find(val => typeof val === 'string');
    if (stringVal) return stringVal;

    return '';
  }

  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return String(v);
  }

  return '';
};

export const isPresentLike = (s) => {
  if (!s || typeof s !== 'string') return false;
  return /present|current|now|ongoing|today/i.test(s.trim());
};

export const normalizeDate = (s) => {
  if (!s) return '';

  const t = String(flattenValue(s)).trim();
  if (!t) return '';

  if (isPresentLike(t)) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  if (/^\d{4}-\d{2}$/.test(t)) return `${t}-01`;
  if (/^\d{4}$/.test(t)) return `${t}-01-01`;

  try {
    const d = new Date(t);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

export const stripSectionHeaders = (s) => {
  if (!s) return '';
  return String(s)
    .replace(/^[A-Z][A-Z\s]*\n+/g, '')
    .replace(/^[A-Z][A-Z\s]*:/g, '')
    .trim();
};

export const normalizeLinkedIn = (...vals) => {
  const candidate = vals
    .map(flattenValue)
    .find(v => v && String(v).toLowerCase().includes('linkedin'));
  
  if (!candidate) return '';
  
  let u = String(candidate)
    .replace(/\s+/g, '')
    .replace(/\\/g, '/');
  
  if (!/^https?:\/\//i.test(u)) {
    u = 'https://' + u;
  }
  
  if (!/linkedin\.com\//i.test(u)) {
    u = u.replace(/linkedin\.com(?!\/)/i, 'linkedin.com/');
  }
  
  if (!/linkedin\.com\/in\//i.test(u)) {
    u = u.replace(/linkedin\.com\//i, 'linkedin.com/in/');
  }
  
  console.log('[normalizeLinkedIn] Normalized:', u);
  return u;
};

export const coalesce = (...vals) => {
  for (const v of vals) {
    const flat = flattenValue(v);
    if (flat && flat !== '') return flat;
  }
  return '';
};

export const safeTrim = (s) => {
  if (!s) return '';
  return String(flattenValue(s)).trim();
};

export const dedupeStrings = (arr) => {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr.filter(item => {
    const key = String(item || '').toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const normalizePhone = (p) => {
  if (!p) return '';
  const phone = String(flattenValue(p)).trim();
  return phone.replace(/[^\d\s\-\(\)\+]/g, '').trim();
};

export const getArray = (arrLike) => {
  if (!arrLike) return [];
  if (Array.isArray(arrLike)) return arrLike;
  if (typeof arrLike === 'object' && Array.isArray(arrLike.value)) return arrLike.value;
  return [];
};

export const extractArrayItems = (arrLike) => {
  const arr = getArray(arrLike);
  return arr
    .map(item => (item && typeof item === 'object' && 'value' in item) ? item.value : item)
    .filter(Boolean);
};

export const extractArray = (arrLike) => {
  const arr = getArray(arrLike);
  return arr.map(item => flattenValue(item)).filter(Boolean);
};

export const parseLocationFromHeader = (rawText) => {
  if (!rawText) return null;
  
  const lines = String(rawText).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const header = lines[0] || '';
  
  const beforeSeparator = header.split(/[·•]/)[0].trim();
  
  const parts = beforeSeparator.split(',').map(s => s.trim()).filter(Boolean);
  
  if (parts.length >= 2) {
    const [city, region, ...rest] = parts;
    const postal = rest.find(p => /^\d{4,6}$/.test(p)) || '';
    
    console.log('[parseLocationFromHeader] Extracted:', { city, region, postal });
    
    return {
      city: city || '',
      state: region || '',
      region: region || '',
      postalCode: postal,
      country: ''
    };
  }
  
  return null;
};

export const parseCityStateFromText = (text) => {
  if (!text) return { city: '', state: '', country: '', postalCode: '' };
  const s = String(text).trim();

  let m = s.match(/([A-Za-z .'-]+),\s*([A-Z]{2})(?:\s+(\d{5}(?:-\d{4})?))?(?!.*,[^,]*[A-Z]{2})/);
  if (m) {
    return {
      city: m[1].trim(),
      state: m[2].toUpperCase(),
      country: '',
      postalCode: (m[3] || '').trim()
    };
  }

  m = s.match(/([A-Za-z .'-]+),\s*([A-Z]{2})(?!.*,[^,]*[A-Z]{2})/);
  if (m) {
    return {
      city: m[1].trim(),
      state: m[2].toUpperCase(),
      country: '',
      postalCode: ''
    };
  }

  return { city: '', state: '', country: '', postalCode: '' };
};

export const parseLocation = (loc) => {
  if (!loc) return { city: '', state: '', country: '', postalCode: '' };

  if (typeof loc === 'object' && 'value' in loc) loc = loc.value;

  if (typeof loc === 'string') {
    return parseCityStateFromText(loc);
  }

  return {
    city: safeTrim(loc.city || loc.locality),
    state: safeTrim(loc.region || loc.state || loc.stateRegion),
    country: safeTrim(loc.countryCode || loc.country),
    postalCode: safeTrim(loc.postalCode || loc.zipCode || loc.postal)
  };
};

export const extractEmail = (emailData) => {
  if (!emailData) return '';

  if (Array.isArray(emailData)) {
    const first = emailData[0];
    if (!first) return '';
    if (typeof first === 'string') return first;
    if (first.email) return String(first.email);
    if (first.address) return String(first.address);
    if (first.value) return String(first.value);
    return flattenValue(first);
  }

  const flattened = flattenValue(emailData);

  if (Array.isArray(flattened)) {
    const first = flattened[0];
    if (!first) return '';
    if (typeof first === 'string') return first;
    if (first.email) return String(first.email);
    if (first.address) return String(first.address);
    if (first.value) return String(first.value);
    return flattenValue(first);
  }

  if (typeof flattened === 'string') return flattened;

  if (flattened?.email) return String(flattened.email);
  if (flattened?.address) return String(flattened.address);

  return '';
};

export const extractName = (data) => {
  let name = coalesce(
    data?.candidateName?.[0]?.raw,
    data?.name?.value?.[0]?.raw,
    data?.name?.[0]?.raw,
    data?.name?.raw,
    data?.fullName,
    data?.candidateName
  );

  if (!name && data?.name) {
    const firstName = data.name.first || data.name.firstName || data.name.givenName;
    const lastName = data.name.last || data.name.lastName || data.name.familyName;
    if (firstName || lastName) {
      name = [firstName, lastName].filter(Boolean).join(' ');
      console.log('[extractName] Composed from first/last:', name);
    }
  }

  if (!name && data?.name?.parsed) {
    const fn = data.name.parsed.firstName || data.name.parsed.givenName;
    const ln = data.name.parsed.familyName || data.name.parsed.lastName;
    if (fn || ln) {
      name = [fn, ln].filter(Boolean).join(' ');
      console.log('[extractName] Extracted from parsed:', name);
    }
  }

  console.log('[extractName] Final name:', name || 'N/A');
  return name || '';
};

export const extractSkills = (skillsData) => {
  console.log('[extractSkills] Input type:', typeof skillsData, 'isArray:', Array.isArray(skillsData));
  
  const TECH_WHITELIST = new Set([
    'c', 'c#', 'c++', 'r', 'go', 'sql', 'html', 'css', 'js', 'ts', 
    'python', 'pandas', 'numpy', 'matplotlib', 'seaborn', 'git', 
    'visual studio', 'jupyter', 'asp.net core', 'sql server', 
    'node.js', 'react', 'django', 'flask', 'docker', 'kubernetes'
  ]);
  
  const NOISE_WORDS = new Set([
    'solutions', 'systems', 'projects', 'server', 'operations', 
    'software', 'data', 'driven', 'scalable', 'complex', 'analysis'
  ]);
  
  let skillNames = [];

  if (Array.isArray(skillsData)) {
    skillNames = skillsData.map(s => {
      if (typeof s === 'string') {
        return s.replace(/^[()\s]+|[()\s]+$/g, '').replace(/[,\.\/]+$/g, '').trim();
      }
      const name = safeTrim(coalesce(s.name, s.skill, s.value, s));
      return name.replace(/^[()\s]+|[()\s]+$/g, '').replace(/[,\.\/]+$/g, '').trim();
    });
  } else if (typeof skillsData === 'string') {
    skillNames = skillsData.split(/[,;]/).map(s => s.trim());
  }

  console.log('[extractSkills] Raw extracted:', skillNames.length, 'skills');

  const cleaned = dedupeStrings(skillNames)
    .filter(s => {
      if (!s) return false;
      
      const low = s.toLowerCase();
      
      if (TECH_WHITELIST.has(low)) return true;
      if (NOISE_WORDS.has(low)) return false;
      if (/^\s*(skills?|technical skills?|core competencies)\s*$/i.test(s)) return false;
      if (s.length === 1 && /^[A-Za-z]$/.test(s)) return true;
      if (s.length <= 3 && /^[A-Za-z0-9#+.-]+$/.test(s)) return true;
      
      return s.length >= 3;
    })
    .slice(0, 50);

  console.log('[extractSkills] After dedupe/filter:', cleaned.length, 'skills');
  return cleaned;
};

export const extractWorkDescription = (workItem) => {
  let description = safeTrim(
    workItem.parsed?.workExperienceDescription?.raw || 
    workItem.parsed?.workExperienceDescription?.parsed ||
    workItem.jobDescription || 
    workItem.description || 
    workItem.summary
  );

  if ((!description || description.split(/[•-]/).length <= 2) && workItem.raw) {
    const rawText = String(workItem.raw).replace(/\r/g, '');
    
    const bullets = rawText
      .split(/\n[-•]\s*/g)
      .map(b => b.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(1);
    
    if (bullets.length > 0) {
      description = bullets.map(b => `• ${b}`).join('\n');
      console.log('[extractWorkDescription] Extracted', bullets.length, 'bullets from raw text');
    }
  }

  return description;
};

export const extractEducationFields = (eduItem) => {
  let degree = safeTrim(
    eduItem.parsed?.educationAccreditation?.raw ||
    eduItem.parsed?.educationAccreditation?.parsed?.education ||
    eduItem.accreditation?.education ||
    eduItem.studyType ||
    eduItem.degree
  );

  let institution = safeTrim(
    eduItem.parsed?.educationOrganization?.raw ||
    eduItem.parsed?.educationOrganization?.parsed ||
    eduItem.organization?.name ||
    eduItem.institution ||
    eduItem.school
  );

  let major = safeTrim(
    eduItem.parsed?.educationAccreditation?.parsed?.educationLevel ||
    eduItem.accreditation?.educationLevel ||
    eduItem.area ||
    eduItem.fieldOfStudy ||
    eduItem.major
  );

  if (!major && degree) {
    const degLower = degree.toLowerCase();
    const candidates = [
      'computer science', 'software engineering', 'information technology',
      'data science', 'mathematics', 'statistics', 'business administration',
      'electrical engineering', 'mechanical engineering'
    ];
    
    const hit = candidates.find(x => degLower.includes(x));
    if (hit) {
      major = hit.replace(/\b\w/g, m => m.toUpperCase());
      console.log('[extractEducationFields] Inferred major from degree:', major);
    }
  }

  if (!degree || !institution) {
    const lines = String(flattenValue(eduItem?.raw || ''))
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);
    
    const instLine = lines.find(l => /(university|college|institute|school)/i.test(l));
    if (!institution && instLine) {
      institution = stripSectionHeaders(instLine);
      console.log('[extractEducationFields] Fallback institution:', institution);
    }
    
    const degLine = lines.find(l => /(bachelor|master|ph\.?d|associate|diploma)/i.test(l));
    if (!degree && degLine) {
      degree = stripSectionHeaders(degLine.replace(/[,;]/g, ''));
      console.log('[extractEducationFields] Fallback degree:', degree);
    }
  }

  return { degree, institution, major };
};

