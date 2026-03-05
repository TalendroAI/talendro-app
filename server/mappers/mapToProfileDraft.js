
// // ============================================
// // MAP TO PROFILE DRAFT - Enhanced with Robust Text Parsing
// // ============================================

// import {
//   flattenValue,
//   normalizeDate,
//   stripSectionHeaders,
//   normalizeLinkedIn,
//   isPresentLike,
//   coalesce,
//   safeTrim,
//   dedupeStrings,
//   normalizePhone,
//   parseLocation,
//   extractEmail,
//   extractArray,
//   extractArrayItems,
//   getArray,
//   parseCityStateFromText,
//   // ✅ ADD THESE NEW IMPORTS:
//   parseLocationFromHeader,
//   extractName,
//   extractSkills,
//   extractWorkDescription,
//   extractEducationFields
// } from './transforms.js';

// // ============================================
// // ✅ NEW: ENHANCED TEXT PARSING HELPERS
// // ============================================

// /**
//  * Find the last date range in text (handles multiple date patterns)
//  * Returns { start, end, index } or null
//  */
// function lastDateRange(text) {
//   const re = /(\d{4})\s*-\s*(Present|\d{4})/gi;
//   let m, last = null;
//   while ((m = re.exec(text)) !== null) last = m;
//   return last ? {
//     start: `${last[1]}-01-01`,
//     end: /present/i.test(last[2]) ? '' : `${last[2]}-01-01`,
//     index: last.index
//   } : null;
// }

// /**
//  * ✅ ROBUST: Parse work entry from free text
//  * Handles: "Senior Software Engineer TechCorp Solutions McLean, VA 2020 - Present • Led team..."
//  */
// function parseWorkFromText(block) {
//   if (!block) return null;

//   const raw = String(block).replace(/\s+/g, ' ').trim();

//   // Split by bullet to separate description
//   const parts = raw.split(' • ');
//   const head = parts[0];
//   const desc = parts.slice(1).join(' • ').trim();

//   // Extract date range (last occurrence)
//   const dr = lastDateRange(head);
//   let beforeDates = head, startDate = '', endDate = '', current = false;

//   if (dr) {
//     startDate = dr.start;
//     endDate = dr.end;
//     current = !dr.end;
//     beforeDates = head.slice(0, dr.index).trim();
//   }

//   // Extract location (last "City, ST" before dates)
//   const locRe = /([A-Za-z .'-]+,\s*[A-Z]{2})(?=(?:\s+\d{4}\s*-\s*(?:Present|\d{4}))|$)/;
//   let locationText = '';
//   const locMatch = beforeDates.match(locRe);

//   if (locMatch) {
//     locationText = locMatch[1].trim();
//     beforeDates = beforeDates.slice(0, locMatch.index).trim();
//   }

//   // Split title and company using organization hints
//   const tokens = beforeDates.split(' ').filter(Boolean);
//   const orgHints = new Set([
//     'Inc', 'LLC', 'Ltd', 'Labs', 'Solutions', 'Corp', 'Corporation',
//     'Company', 'Technologies', 'Systems', 'Group', 'Innovations'
//   ]);

//   let splitIdx = -1;

//   // Find last token that matches organization hint
//   for (let i = tokens.length - 1; i >= 0; i--) {
//     const clean = tokens[i].replace(/[^\w]/g, '');
//     if (orgHints.has(clean)) {
//       splitIdx = i - 1;
//       break;
//     }
//   }

//   let companyName = '', jobTitle = beforeDates;

//   if (splitIdx >= 0) {
//     // Split at organization hint
//     companyName = tokens.slice(splitIdx + 1).join(' ');
//     jobTitle = tokens.slice(0, splitIdx + 1).join(' ');
//   } else if (tokens.length >= 4) {
//     // Heuristic: last 2 words = company
//     companyName = tokens.slice(-2).join(' ');
//     jobTitle = tokens.slice(0, -2).join(' ');
//   } else if (tokens.length >= 3) {
//     // Heuristic: last 1 word = company
//     companyName = tokens.slice(-1).join(' ');
//     jobTitle = tokens.slice(0, -1).join(' ');
//   }

//   return {
//     companyName: companyName.trim(),
//     jobTitle: jobTitle.trim(),
//     startDate,
//     endDate,
//     current,
//     locationText,
//     desc
//   };
// }

// /**
//  * Main mapping function from raw Affinda data to application format
//  */
// export function mapToProfileDraft(raw) {
//   if (!raw || !raw.data) {
//     console.warn('[Mapper] No raw data provided');
//     return buildEmptyResponse();
//   }

//   const data = raw.data;
//   console.log('[Mapper] Processing Affinda response');
//   console.log('[Mapper] Available fields:', Object.keys(data));

//   // Near "Raw array lengths" region - REPLACE existing code with:
//   const educationRaw = Array.isArray(data?.education)
//     ? data.education
//     : Array.isArray(data?.educations)
//       ? data.educations
//       : [];

//   const workRaw = Array.isArray(data?.workExperience)
//     ? data.workExperience
//     : Array.isArray(data?.work)
//       ? data.work
//       : Array.isArray(data?.workHistory)
//         ? data.workHistory
//         : [];

//   const skillsRaw = Array.isArray(data?.skills)
//     ? data.skills
//     : Array.isArray(data?.skill)
//       ? data.skill
//       : [];

//   console.log('[Mapper] Array lengths:', {
//     education: educationRaw.length,
//     work: workRaw.length,
//     skills: skillsRaw.length
//   });


//   const education = extractEducation(educationRaw);
//   const work = extractWork(workRaw);
//   const skills = extractSkills(skillsRaw);

//   console.log('[Mapper] Extracted counts:', {
//     education: education.length,
//     work: work.length,
//     skills: skills.length
//   });

//   // ✅ FIXED: Compute years AFTER work is extracted
//   const preferredYears = Number(flattenValue(data.totalYearsExperience)) || calculateYearsExperience(work);
//   const currentJob = work[0] || {};

//   // Extract basics with computed values
//   const basics = extractBasics(data, preferredYears, currentJob);

//   // Build prefill structures for each step
//   const prefill = {
//     step1: buildStep1Prefill(basics, work, skills),
//     step3: buildStep3Prefill(basics, education, work),
//     step5: buildStep5Education(education),
//     step6: buildStep6Work(work)
//   };

//   // Build profileDraft
//   const profileDraft = {
//     basics: {
//       name: basics.fullLegalName,
//       email: basics.email,
//       phone: basics.phone,
//       location: {
//         city: basics.city,
//         region: basics.stateRegion,
//         postalCode: basics.postalCode,
//         country: basics.country
//       },
//       linkedin: basics.linkedinUrl
//     },
//     work: work,
//     education: education,
//     skills: skills,
//     keywords: [],
//     currentJobTitle: basics.currentJobTitle
//   };

//   return {
//     prefill,
//     profileDraft,
//     confidence: raw.confidence || 0.9
//   };
// }

// // ============================================
// // EXTRACTION FUNCTIONS
// // ============================================

// // function extractBasics(data, yearsExperience, currentJob) {
// //   console.log('[extractBasics] Input data keys:', Object.keys(data));

// //   // Handle BOTH newer and older name formats
// //   const name = coalesce(
// //     data.candidateName?.[0]?.raw,
// //     data.name?.value?.[0]?.raw,
// //     data.name?.[0]?.raw,
// //     data.name?.raw,
// //     (data.name?.first && data.name?.last) ? `${data.name.first} ${data.name.last}` : '',
// //     data.fullName,
// //     data.candidateName
// //   );

// //   console.log('[extractBasics] Extracted name:', name);

// //   // Email and phone (singular/plural compatibility)
// //   const email = extractEmail(data.email || data.emails);
// //   const phoneArray = extractArray(data.phoneNumber || data.phoneNumbers);
// //   const phone = normalizePhone(phoneArray[0] || '');

// //   console.log('[extractBasics] Extracted email:', email, 'phone:', phone);

// //   // Location with rawText fallback
// //   let location = parseLocation(data.location);

// //   // Fallback 1: try header lines from rawText if still empty
// //   if (!location.city && !location.state && data.rawText) {
// //     const headerLine = String(data.rawText)
// //       .split(/\r?\n/)
// //       .map(s => s.trim())
// //       .filter(Boolean)
// //       .slice(0, 6)
// //       .find(l => /,\s*[A-Z]{2}\b/.test(l));

// //     if (headerLine) {
// //       const fromHeader = parseCityStateFromText(headerLine);
// //       if (fromHeader.city || fromHeader.state) {
// //         location = fromHeader;
// //         console.log('[extractBasics] Location from rawText header:', location);
// //       }
// //     }
// //   }

// //   // Fallback 2: borrow from first work block if still empty
// //   if (!location.city && !location.state && currentJob.location) {
// //     const locAlt = parseCityStateFromText(currentJob.location);
// //     if (locAlt.city || locAlt.state) {
// //       location = locAlt;
// //       console.log('[extractBasics] Location from first work entry:', location);
// //     }
// //   }

// //   console.log('[extractBasics] Final location:', location);

// //   // Websites / social links
// //   const socialArray = extractArray(
// //     data.website || data.websites || data.social || []
// //   );

// //   const linkedinUrl = normalizeLinkedIn(
// //     data.linkedin,
// //     data.linkedinUrl,
// //     ...socialArray
// //   );

// //   const website = socialArray
// //     .filter(s => !/linkedin/i.test(String(s)))
// //     .find(Boolean) || '';

// //   // Use current job from extracted work
// //   const currentJobTitle = safeTrim(currentJob.jobTitle || '');
// //   const currentEmployer = safeTrim(currentJob.companyName || '');

// //   console.log('[extractBasics] Years experience:', yearsExperience, '(from API:', flattenValue(data.totalYearsExperience), ')');

// //   return {
// //     fullLegalName: safeTrim(name),
// //     email,
// //     phone,
// //     city: location.city,
// //     stateRegion: location.state,
// //     country: location.country,
// //     postalCode: location.postalCode,
// //     linkedinUrl,
// //     website,
// //     currentJobTitle,
// //     currentEmployer,
// //     yearsExperience
// //   };
// // }


// function extractBasics(data, yearsExperience, currentJob) {
//   console.log('[extractBasics] Input data keys:', Object.keys(data));

//   const name = extractName(data); // Use enhanced extraction

//   const email = extractEmail(data.email || data.emails);
//   const phoneArray = extractArray(data.phoneNumber || data.phoneNumbers);
//   const phone = normalizePhone(phoneArray[0] || '');

//   // ✅ Try international header parsing first
//   let location = parseLocationFromHeader(data.rawText) || parseLocation(data.location);

//   // Fallback 2: borrow from first work block
//   if (!location.city && !location.state && currentJob.location) {
//     const locAlt = parseCityStateFromText(currentJob.location);
//     if (locAlt.city || locAlt.state) {
//       location = locAlt;
//       console.log('[extractBasics] Location from first work entry:', location);
//     }
//   }

//   console.log('[extractBasics] Final location:', location);

//   // Websites / social links
//   const socialArray = extractArray(
//     data.website || data.websites || data.social || []
//   );

//   const linkedinUrl = normalizeLinkedIn(
//     data.linkedin,
//     data.linkedinUrl,
//     ...socialArray
//   );

//   const website = socialArray
//     .filter(s => !/linkedin/i.test(String(s)))
//     .find(Boolean) || '';

//   const currentJobTitle = safeTrim(currentJob.jobTitle || '');
//   const currentEmployer = safeTrim(currentJob.companyName || '');

//   console.log('[extractBasics] Years experience:', yearsExperience);

//   return {
//     fullLegalName: safeTrim(name),
//     email,
//     phone,
//     city: location.city,
//     stateRegion: location.state,
//     country: location.country,
//     postalCode: location.postalCode,
//     linkedinUrl,
//     website,
//     currentJobTitle,
//     currentEmployer,
//     yearsExperience
//   };
// }




// // function extractEducation(eduArray) {
// //   if (!Array.isArray(eduArray)) return [];

// //   console.log('[extractEducation] Processing', eduArray.length, 'entries');

// //   return eduArray.map((e, idx) => {
// //     console.log(`[extractEducation] Entry ${idx}:`, {
// //       hasParsed: !!e.parsed,
// //       hasRaw: !!e.raw
// //     });

// //     const parsed = e.parsed || {};
// //     const organizationObj = parsed.educationOrganization || {};
// //     const accreditationObj = parsed.educationAccreditation || {};
// //     const datesObj = parsed.educationDates || {};
// //     const locationObj = parsed.educationLocation || {};
// //     const gradeObj = parsed.educationGrade || {};

// //     const dates = (e.dates && typeof e.dates === 'object' && 'value' in e.dates)
// //       ? e.dates.value
// //       : (e.dates || {});

// //     const accreditation = (e.accreditation && typeof e.accreditation === 'object' && 'value' in e.accreditation)
// //       ? e.accreditation.value
// //       : (e.accreditation || {});

// //     let institution = stripSectionHeaders(safeTrim(
// //       organizationObj.raw ||
// //       organizationObj.parsed ||
// //       e.organization?.name ||
// //       e.organization?.raw ||
// //       e.organization ||
// //       e.institution ||
// //       e.school ||
// //       e.institutionName
// //     ));

// //     const datesData = datesObj.parsed || {};
// //     let start = coalesce(
// //       datesData.start?.date,
// //       datesData.start?.year ? `${datesData.start.year}-01-01` : '',
// //       dates.startDate,
// //       dates.start,
// //       e.startDate
// //     );

// //     let end = coalesce(
// //       datesData.end?.date,
// //       datesData.end?.year ? `${datesData.end.year}-01-01` : '',
// //       dates.completionDate,
// //       dates.endDate,
// //       dates.end,
// //       e.endDate,
// //       e.graduationDate
// //     );

// //     let gpa = safeTrim(
// //       gradeObj.raw ||
// //       gradeObj.parsed ||
// //       e.grade?.value ||
// //       e.grade ||
// //       e.gpa ||
// //       e.score
// //     );

// //     if (gpa && gpa.toLowerCase().startsWith('gpa:')) {
// //       gpa = gpa.replace(/^gpa:\s*/i, '').trim();
// //     }

// //     let degree = safeTrim(
// //       accreditationObj.raw ||
// //       accreditationObj.parsed?.education ||
// //       accreditationObj.parsed?.educationLevel ||
// //       accreditation.education ||
// //       e.studyType ||
// //       e.degree ||
// //       e.educationLevel ||
// //       e.degreeType
// //     );

// //     let major = safeTrim(
// //       accreditationObj.parsed?.educationLevel ||
// //       accreditationObj.parsed?.inputStr ||
// //       accreditation.educationLevel ||
// //       e.area ||
// //       e.fieldOfStudy ||
// //       e.major ||
// //       e.field
// //     );

// //     if (major && /^[a-zA-Z0-9]{8}$/.test(major)) {
// //       console.log(`[extractEducation] Entry ${idx} filtering out field ID from major:`, major);
// //       major = '';
// //     }

// //     console.log(`[extractEducation] Entry ${idx} extracted:`, {
// //       institution,
// //       degree,
// //       major,
// //       gpa,
// //       start,
// //       end
// //     });

// //     const hasStructuredData = !!(institution && (start || end || degree || major || gpa));
// //     const needsTextParsing = !hasStructuredData ||
// //       (institution && /\d{4}\s*-\s*\d{4}/.test(institution)) ||
// //       !major;

// //     if (needsTextParsing && e.raw) {
// //       console.log(`[extractEducation] Entry ${idx} parsing from raw text`);

// //       const rawText = String(flattenValue(e.raw));
// //       const lines = rawText
// //         .split(/\r?\n/)
// //         .map(s => s.trim())
// //         .filter(Boolean);

// //       console.log(`[extractEducation] Entry ${idx} lines:`, lines);

// //       if (lines.length >= 2) {
// //         if (!degree || /\d{4}/.test(degree)) {
// //           const degreeLine = lines[0];
// //           degree = degreeLine.replace(/\d{4}\s*-\s*\d{4}/g, '').replace(/GPA.*$/i, '').trim();
// //         }

// //         if (!institution || /\d{4}/.test(institution)) {
// //           institution = stripSectionHeaders(lines[1]);
// //         }
// //       }

// //       if (!start || !end) {
// //         const dateLine = lines.find(l => /\b\d{4}\b\s*-\s*(Present|\d{4})/i.test(l));
// //         if (dateLine) {
// //           const m = dateLine.match(/(\d{4})\s*-\s*(Present|\d{4})/i);
// //           if (m) {
// //             start = `${m[1]}-01-01`;
// //             end = m[2].toLowerCase() === 'present' ? '' : `${m[2]}-01-01`;
// //           }
// //         }
// //       }

// //       if (!gpa || gpa.length < 2) {
// //         const gpaLine = lines.find(l => /GPA\s*:/i.test(l));
// //         if (gpaLine) {
// //           const mg = gpaLine.match(/GPA\s*:\s*([0-9.\/]+)/i);
// //           if (mg) gpa = mg[1];
// //         }
// //       }

// //       // After all other text parsing (GPA, dates, institution), add this:

// //       // ✅ FINAL ATTEMPT: Extract major if still empty
// //       if (!major && e.raw) {
// //         const rawText = String(flattenValue(e.raw));

// //         // Search for common patterns:
// //         // "Bachelor of Science in Computer Science"
// //         // "BS in Computer Science"
// //         // "Bachelor in Computer Science"
// //         const patterns = [
// //           /(?:Bachelor|Master|Associate)[^•\n]*?\s+in\s+([A-Za-z][A-Za-z\s&-]+?)(?=\s*(?:University|College|Institute|\d{4}|GPA|•|\n|$))/i,
// //           /\b(?:BS|BA|MS|MA|PhD)\s+in\s+([A-Za-z][A-Za-z\s&-]+?)(?=\s*(?:University|College|Institute|\d{4}|GPA|•|\n|$))/i,
// //           /\s+in\s+([A-Za-z][A-Za-z\s&-]{5,})(?=\s*(?:University|College|Institute|\d{4}|GPA|•|\n))/i
// //         ];

// //         for (const pattern of patterns) {
// //           const match = rawText.match(pattern);
// //           if (match && match[1]) {
// //             major = match[1].trim();
// //             break;
// //           }
// //         }

// //         // Clean up the extracted major
// //         if (major) {
// //           // Remove trailing institution names if captured
// //           major = major.split(/\s+(?:University|College|Institute|School)/i)[0].trim();
// //           // Remove any trailing years
// //           major = major.replace(/\s*\d{4}.*$/g, '').trim();
// //         }
// //       }

// //     }


// //     const isCurrent = isPresentLike(end) || e.current === true;

// //     const locationData = locationObj.parsed || locationObj.raw || e.location;
// //     let eduLocation;

// //     if (locationData && typeof locationData === 'object' && locationData.city) {
// //       eduLocation = {
// //         city: locationData.city || '',
// //         state: locationData.stateCode || locationData.state || '',
// //         country: locationData.countryCode || locationData.country || '',
// //         postalCode: locationData.postalCode || ''
// //       };
// //     } else {
// //       eduLocation = parseLocation(locationData);
// //     }

// //     return {
// //       institutionName: institution,
// //       majorFieldOfStudy: major,
// //       highestDegree: degree,
// //       gpa,
// //       institutionCity: eduLocation.city,
// //       institutionState: eduLocation.state,
// //       institutionAddress: safeTrim(eduLocation.address),
// //       attendanceStartDate: normalizeDate(start),
// //       graduationDate: isCurrent ? '' : normalizeDate(end),
// //       current: isCurrent
// //     };
// //   }).filter(e => e.institutionName);
// // }





// // /**
// //  * ✅ ENHANCED: Extract work with robust text parsing fallback
// //  */
// // function extractWork(workArray) {
// //   if (!Array.isArray(workArray)) return [];

// //   console.log('[extractWork] Processing', workArray.length, 'entries');

// //   return workArray.map((w, idx) => {
// //     console.log(`[extractWork] Entry ${idx}:`, {
// //       hasParsed: !!w.parsed,
// //       hasRaw: !!w.raw

// //     });

// //     if (organization && w.raw) {
// //       const cleanedHeader = String(w.raw).replace(DATE_RANGE_RE, '').replace(/\s{2,}/g, ' ').trim();
// //       const withoutLocation = cleanedHeader.replace(workLocation.city || '', '').replace(/\s{2,}/g, ' ').trim();
// //       // Extract company from remaining text
// //       organization = withoutLocation.split(/\n/)[0].replace(jobTitle, '').replace(/\s{2,}/g, ' ').trim() || organization;
// //     }


// //     // ✅ Extract from w.parsed.workExperience* fields
// //     const parsed = w.parsed || {};

// //     // Extract nested structured fields from Affinda's format
// //     const jobTitleObj = parsed.workExperienceJobTitle || {};
// //     const organizationObj = parsed.workExperienceOrganization || {};
// //     const datesObj = parsed.workExperienceDates || {};
// //     const locationObj = parsed.workExperienceLocation || {};
// //     const descriptionObj = parsed.workExperienceDescription || {};

// //     // Organization
// //     let organization = safeTrim(
// //       organizationObj.raw ||
// //       organizationObj.parsed ||
// //       w.organization?.name ||
// //       w.organization?.raw ||
// //       w.organization ||
// //       w.company?.name ||
// //       w.company ||
// //       w.companyName
// //     );

// //     // Job Title
// //     let jobTitle = safeTrim(
// //       jobTitleObj.raw ||
// //       jobTitleObj.parsed ||
// //       w.jobTitle?.name ||
// //       w.jobTitle?.raw ||
// //       w.jobTitle ||
// //       w.position ||
// //       w.title ||
// //       w.role
// //     );

// //     // Dates - extract from nested parsed object
// //     const datesData = datesObj.parsed || {};
// //     let start = coalesce(
// //       datesData.start?.date,
// //       datesData.start?.year ? `${datesData.start.year}-01-01` : '',
// //       w.startDate,
// //       w.fromDate
// //     );

// //     let end = coalesce(
// //       datesData.end?.date,
// //       datesData.end?.year ? `${datesData.end.year}-01-01` : '',
// //       w.endDate,
// //       w.toDate
// //     );

// //     let current = datesData.end?.isCurrent === false ? false :
// //       (isPresentLike(end) || w.current === true || datesData.end?.isCurrent === true);

// //     // Location - extract from nested parsed object
// //     const locationData = locationObj.parsed || locationObj.raw || w.location;
// //     let workLocation;

// //     if (locationData && typeof locationData === 'object' && locationData.city) {
// //       // Affinda's parsed location format
// //       workLocation = {
// //         city: locationData.city || '',
// //         state: locationData.stateCode || locationData.state || '',
// //         country: locationData.countryCode || locationData.country || '',
// //         postalCode: locationData.postalCode || ''
// //       };
// //     } else {
// //       workLocation = parseLocation(locationData);
// //     }

// //     // ✅ ENHANCED: Extract ALL bullets from raw text
// //     let description = '';

// //     // First try structured description
// //     description = safeTrim(
// //       descriptionObj.raw ||
// //       descriptionObj.parsed ||
// //       w.jobDescription ||
// //       w.description ||
// //       w.summary
// //     );

// //     // If description is missing or only has one bullet, extract ALL from raw
// //     if ((!description || description.split('•').length <= 2) && w.raw) {
// //       const rawText = String(w.raw);

// //       // Find the position of the first bullet
// //       const firstBulletIndex = rawText.indexOf('•');

// //       if (firstBulletIndex !== -1) {
// //         // Extract everything after the first bullet
// //         const bulletSection = rawText.substring(firstBulletIndex);

// //         // Split by bullet and clean each entry
// //         const bullets = bulletSection
// //           .split('•')
// //           .slice(1) // Skip empty first element
// //           .map(b => {
// //             // Remove multiple spaces, newlines, and trim
// //             return b.replace(/\s+/g, ' ').trim();
// //           })
// //           .filter(Boolean)
// //           .map(b => `• ${b}`);

// //         if (bullets.length > 0) {
// //           description = bullets.join('\n');
// //         }
// //       }
// //     }

// //     console.log(`[extractWork] Entry ${idx} extracted:`, {
// //       organization,
// //       jobTitle,
// //       start,
// //       end,
// //       current,
// //       location: workLocation,
// //       descriptionLength: description.length,
// //       bulletCount: (description.match(/•/g) || []).length
// //     });

// //     // ✅ FALLBACK: Only parse from raw text if ALL structured fields are empty
// //     const hasStructuredData = !!(organization && jobTitle && (start || end));

// //     if (!hasStructuredData && w.raw) {
// //       console.log(`[extractWork] Entry ${idx} using text parser fallback`);

// //       const parsedText = parseWorkFromText(w.raw);

// //       if (parsedText) {
// //         if (!organization && parsedText.companyName) organization = parsedText.companyName;
// //         if (!jobTitle && parsedText.jobTitle) jobTitle = parsedText.jobTitle;
// //         if (!start && parsedText.startDate) start = parsedText.startDate;
// //         if (!end && parsedText.endDate !== undefined) end = parsedText.endDate;
// //         if (!current && parsedText.current) current = parsedText.current;

// //         if ((!workLocation.city && !workLocation.state) && parsedText.locationText) {
// //           workLocation = parseCityStateFromText(parsedText.locationText);
// //         }

// //         if (!description && parsedText.desc) {
// //           description = parsedText.desc;
// //         }
// //       }
// //     }

// //     return {
// //       companyName: organization,
// //       jobTitle: jobTitle,
// //       startDate: normalizeDate(start),
// //       endDate: current ? null : normalizeDate(end),
// //       current,
// //       description,
// //       location: `${workLocation.city}${workLocation.state ? ', ' + workLocation.state : ''}`.trim()
// //     };
// //   }).filter(w => w.companyName || w.jobTitle);
// // }


// /**
//  * ✅ ENHANCED: Extract education with robust major field parsing
//  */
// function extractEducation(eduArray) {
//   if (!Array.isArray(eduArray)) return [];

//   console.log('[extractEducation] Processing', eduArray.length, 'entries');

//   return eduArray.map((e, idx) => {
//     console.log(`[extractEducation] Entry ${idx}:`, {
//       hasParsed: !!e.parsed,
//       hasRaw: !!e.raw
//     });

//     const parsed = e.parsed || {};
//     const organizationObj = parsed.educationOrganization || {};
//     const accreditationObj = parsed.educationAccreditation || {};
//     const datesObj = parsed.educationDates || {};
//     const locationObj = parsed.educationLocation || {};
//     const gradeObj = parsed.educationGrade || {};

//     const dates = (e.dates && typeof e.dates === 'object' && 'value' in e.dates)
//       ? e.dates.value
//       : (e.dates || {});

//     const accreditation = (e.accreditation && typeof e.accreditation === 'object' && 'value' in e.accreditation)
//       ? e.accreditation.value
//       : (e.accreditation || {});

//     let institution = stripSectionHeaders(safeTrim(
//       organizationObj.raw ||
//       organizationObj.parsed ||
//       e.organization?.name ||
//       e.organization?.raw ||
//       e.organization ||
//       e.institution ||
//       e.school ||
//       e.institutionName
//     ));

//     const datesData = datesObj.parsed || {};
//     let start = coalesce(
//       datesData.start?.date,
//       datesData.start?.year ? `${datesData.start.year}-01-01` : '',
//       dates.startDate,
//       dates.start,
//       e.startDate
//     );

//     let end = coalesce(
//       datesData.end?.date,
//       datesData.end?.year ? `${datesData.end.year}-01-01` : '',
//       dates.completionDate,
//       dates.endDate,
//       dates.end,
//       e.endDate,
//       e.graduationDate
//     );

//     let gpa = safeTrim(
//       gradeObj.raw ||
//       gradeObj.parsed ||
//       e.grade?.value ||
//       e.grade ||
//       e.gpa ||
//       e.score
//     );

//     if (gpa && gpa.toLowerCase().startsWith('gpa:')) {
//       gpa = gpa.replace(/^gpa:\s*/i, '').trim();
//     }

//     let degree = safeTrim(
//       accreditationObj.raw ||
//       accreditationObj.parsed?.education ||
//       accreditationObj.parsed?.educationLevel ||
//       accreditation.education ||
//       e.studyType ||
//       e.degree ||
//       e.educationLevel ||
//       e.degreeType
//     );

//     let major = safeTrim(
//       accreditationObj.parsed?.educationLevel ||
//       accreditationObj.parsed?.inputStr ||
//       accreditation.educationLevel ||
//       e.area ||
//       e.fieldOfStudy ||
//       e.major ||
//       e.field
//     );

//     if (major && /^[a-zA-Z0-9]{8}$/.test(major)) {
//       console.log(`[extractEducation] Entry ${idx} filtering out field ID from major:`, major);
//       major = '';
//     }

//     console.log(`[extractEducation] Entry ${idx} extracted:`, {
//       institution,
//       degree,
//       major,
//       gpa,
//       start,
//       end
//     });

//     const hasStructuredData = !!(institution && (start || end || degree || major || gpa));
//     const needsTextParsing = !hasStructuredData ||
//       (institution && /\d{4}\s*-\s*\d{4}/.test(institution)) ||
//       !major;

//     if (needsTextParsing && e.raw) {
//       console.log(`[extractEducation] Entry ${idx} parsing from raw text`);

//       const rawText = String(flattenValue(e.raw));
//       const lines = rawText
//         .split(/\r?\n/)
//         .map(s => s.trim())
//         .filter(Boolean);

//       console.log(`[extractEducation] Entry ${idx} lines:`, lines);

//       if (lines.length >= 2) {
//         if (!degree || /\d{4}/.test(degree)) {
//           const degreeLine = lines[0];
//           degree = degreeLine.replace(/\d{4}\s*-\s*\d{4}/g, '').replace(/GPA.*$/i, '').trim();
//         }

//         if (!institution || /\d{4}/.test(institution)) {
//           institution = stripSectionHeaders(lines[1]);
//         }
//       }

//       if (!start || !end) {
//         const dateLine = lines.find(l => /\b\d{4}\b\s*-\s*(Present|\d{4})/i.test(l));
//         if (dateLine) {
//           const m = dateLine.match(/(\d{4})\s*-\s*(Present|\d{4})/i);
//           if (m) {
//             start = `${m[1]}-01-01`;
//             end = m[2].toLowerCase() === 'present' ? '' : `${m[2]}-01-01`;
//           }
//         }
//       }

//       if (!gpa || gpa.length < 2) {
//         const gpaLine = lines.find(l => /GPA\s*:/i.test(l));
//         if (gpaLine) {
//           const mg = gpaLine.match(/GPA\s*:\s*([0-9.\/]+)/i);
//           if (mg) gpa = mg[1];
//         }
//       }

//       // ✅ ENHANCED: Extract major field of study with multiple pattern matching
//       if (!major && e.raw) {
//         const rawText = String(flattenValue(e.raw));

//         // Search for common major patterns
//         const patterns = [
//           // "Bachelor of Science in Computer Science"
//           /(?:Bachelor|Master|Associate)[^•\n]*?\s+in\s+([A-Za-z][A-Za-z\s&-]+?)(?=\s*(?:University|College|Institute|\d{4}|GPA|•|\n|$))/i,
//           // "BS in Computer Science" or "BA in Economics"
//           /\b(?:BS|BA|MS|MA|PhD|BBA|MBA|BSc|MSc)\s+in\s+([A-Za-z][A-Za-z\s&-]+?)(?=\s*(?:University|College|Institute|\d{4}|GPA|•|\n|$))/i,
//           // "in Computer Science" (fallback pattern)
//           /\s+in\s+([A-Za-z][A-Za-z\s&-]{5,})(?=\s*(?:University|College|Institute|\d{4}|GPA|•|\n))/i
//         ];

//         for (const pattern of patterns) {
//           const match = rawText.match(pattern);
//           if (match && match[1]) {
//             major = match[1].trim();
//             console.log(`[extractEducation] Entry ${idx} extracted major from pattern:`, major);
//             break;
//           }
//         }

//         // Clean up the extracted major
//         if (major) {
//           // Remove trailing institution names if captured
//           major = major.split(/\s+(?:University|College|Institute|School)/i)[0].trim();
//           // Remove any trailing years
//           major = major.replace(/\s*\d{4}.*$/g, '').trim();
//           // Remove common trailing words
//           major = major.replace(/\s*(?:degree|program|studies)$/i, '').trim();
//         }
//       }
//     }

//     const isCurrent = isPresentLike(end) || e.current === true;

//     const locationData = locationObj.parsed || locationObj.raw || e.location;
//     let eduLocation;

//     if (locationData && typeof locationData === 'object' && locationData.city) {
//       eduLocation = {
//         city: locationData.city || '',
//         state: locationData.stateCode || locationData.state || '',
//         country: locationData.countryCode || locationData.country || '',
//         postalCode: locationData.postalCode || ''
//       };
//     } else {
//       eduLocation = parseLocation(locationData);
//     }

//     return {
//       institutionName: institution,
//       majorFieldOfStudy: major, // ✅ Now properly populated
//       highestDegree: degree,
//       gpa,
//       institutionCity: eduLocation.city,
//       institutionState: eduLocation.state,
//       institutionAddress: safeTrim(eduLocation.address),
//       attendanceStartDate: normalizeDate(start),
//       graduationDate: isCurrent ? '' : normalizeDate(end),
//       current: isCurrent
//     };
//   }).filter(e => e.institutionName);
// }



// ============================================
// MAP TO PROFILE DRAFT - Enhanced with Robust Text Parsing
// ============================================

import {
  flattenValue,
  normalizeDate,
  stripSectionHeaders,
  normalizeLinkedIn,
  isPresentLike,
  coalesce,
  safeTrim,
  dedupeStrings,
  normalizePhone,
  parseLocation,
  extractEmail,
  extractArray,
  extractArrayItems,
  getArray,
  parseCityStateFromText,
  parseLocationFromHeader,
  extractName,
  extractSkills,
  extractWorkDescription,
  extractEducationFields
} from './transforms.js';

// ============================================
// ENHANCED TEXT PARSING HELPERS
// ============================================

/**
 * Find the last date range in text
 */
function lastDateRange(text) {
  const re = /(\d{4})\s*-\s*(Present|\d{4})/gi;
  let m, last = null;
  while ((m = re.exec(text)) !== null) last = m;
  return last ? {
    start: `${last[1]}-01-01`,
    end: /present/i.test(last[2]) ? '' : `${last[2]}-01-01`,
    index: last.index
  } : null;
}

/**
 * Parse work entry from free text
 */
function parseWorkFromText(block) {
  if (!block) return null;

  const raw = String(block).replace(/\s+/g, ' ').trim();
  const parts = raw.split(' • ');
  const head = parts[0];
  const desc = parts.slice(1).join(' • ').trim();

  const dr = lastDateRange(head);
  let beforeDates = head, startDate = '', endDate = '', current = false;

  if (dr) {
    startDate = dr.start;
    endDate = dr.end;
    current = !dr.end;
    beforeDates = head.slice(0, dr.index).trim();
  }

  const locRe = /([A-Za-z .'-]+,\s*[A-Z]{2})(?=(?:\s+\d{4}\s*-\s*(?:Present|\d{4}))|$)/;
  let locationText = '';
  const locMatch = beforeDates.match(locRe);

  if (locMatch) {
    locationText = locMatch[1].trim();
    beforeDates = beforeDates.slice(0, locMatch.index).trim();
  }

  const tokens = beforeDates.split(' ').filter(Boolean);
  const orgHints = new Set([
    'Inc', 'LLC', 'Ltd', 'Labs', 'Solutions', 'Corp', 'Corporation',
    'Company', 'Technologies', 'Systems', 'Group', 'Innovations'
  ]);

  let splitIdx = -1;

  for (let i = tokens.length - 1; i >= 0; i--) {
    const clean = tokens[i].replace(/[^\w]/g, '');
    if (orgHints.has(clean)) {
      splitIdx = i - 1;
      break;
    }
  }

  let companyName = '', jobTitle = beforeDates;

  if (splitIdx >= 0) {
    companyName = tokens.slice(splitIdx + 1).join(' ');
    jobTitle = tokens.slice(0, splitIdx + 1).join(' ');
  } else if (tokens.length >= 4) {
    companyName = tokens.slice(-2).join(' ');
    jobTitle = tokens.slice(0, -2).join(' ');
  } else if (tokens.length >= 3) {
    companyName = tokens.slice(-1).join(' ');
    jobTitle = tokens.slice(0, -1).join(' ');
  }

  return {
    companyName: companyName.trim(),
    jobTitle: jobTitle.trim(),
    startDate,
    endDate,
    current,
    locationText,
    desc
  };
}

// ============================================
// MAIN MAPPING FUNCTION
// ============================================

export function mapToProfileDraft(raw) {
  if (!raw || !raw.data) {
    console.warn('[Mapper] No raw data provided');
    return buildEmptyResponse();
  }

  const data = raw.data;
  console.log('[Mapper] Processing Affinda response');
  console.log('[Mapper] Available fields:', Object.keys(data));

  const educationRaw = Array.isArray(data?.education)
    ? data.education
    : Array.isArray(data?.educations)
      ? data.educations
      : [];

  const workRaw = Array.isArray(data?.workExperience)
    ? data.workExperience
    : Array.isArray(data?.work)
      ? data.work
      : Array.isArray(data?.workHistory)
        ? data.workHistory
        : [];

  const skillsRaw = Array.isArray(data?.skills)
    ? data.skills
    : Array.isArray(data?.skill)
      ? data.skill
      : [];

  console.log('[Mapper] Array lengths:', {
    education: educationRaw.length,
    work: workRaw.length,
    skills: skillsRaw.length
  });

  const education = extractEducation(educationRaw);
  const work = extractWork(workRaw);
  
  // ✅ Call imported extractSkills and map to objects
  const skillNames = extractSkills(skillsRaw);
  const skills = skillNames.map(name => ({
    name: name,
    level: null,
    keywords: []
  }));

  console.log('[Mapper] Extracted counts:', {
    education: education.length,
    work: work.length,
    skills: skills.length
  });

  const preferredYears = Number(flattenValue(data.totalYearsExperience)) || calculateYearsExperience(work);
  const currentJob = work[0] || {};

  const basics = extractBasics(data, preferredYears, currentJob);

  const prefill = {
    step1: buildStep1Prefill(basics, work, skills),
    step3: buildStep3Prefill(basics, education, work),
    step5: buildStep5Education(education),
    step6: buildStep6Work(work)
  };

  const profileDraft = {
    basics: {
      name: basics.fullLegalName,
      email: basics.email,
      phone: basics.phone,
      location: {
        city: basics.city,
        region: basics.stateRegion,
        postalCode: basics.postalCode,
        country: basics.country
      },
      linkedin: basics.linkedinUrl
    },
    work: work,
    education: education,
    skills: skills,
    keywords: [],
    currentJobTitle: basics.currentJobTitle
  };

  return {
    prefill,
    profileDraft,
    confidence: raw.confidence || 0.9
  };
}

// ============================================
// EXTRACTION FUNCTIONS
// ============================================

function extractBasics(data, yearsExperience, currentJob) {
  console.log('[extractBasics] Input data keys:', Object.keys(data));

  const name = extractName(data);

  const email = extractEmail(data.email || data.emails);
  const phoneArray = extractArray(data.phoneNumber || data.phoneNumbers);
  const phone = normalizePhone(phoneArray[0] || '');

  let location = parseLocationFromHeader(data.rawText) || parseLocation(data.location);

  if (!location.city && !location.state && currentJob.location) {
    const locAlt = parseCityStateFromText(currentJob.location);
    if (locAlt.city || locAlt.state) {
      location = locAlt;
      console.log('[extractBasics] Location from first work entry:', location);
    }
  }

  console.log('[extractBasics] Final location:', location);

  const socialArray = extractArray(
    data.website || data.websites || data.social || []
  );

  const linkedinUrl = normalizeLinkedIn(
    data.personalDetails?.linkedinUrl,
    data.linkedin,
    data.linkedinUrl,
    ...socialArray
  );

  const website = socialArray
    .filter(s => !/linkedin/i.test(String(s)))
    .find(Boolean) || '';

  const currentJobTitle = safeTrim(currentJob.jobTitle || '');
  const currentEmployer = safeTrim(currentJob.companyName || '');

  console.log('[extractBasics] Years experience:', yearsExperience);

  return {
    fullLegalName: safeTrim(name),
    email,
    phone,
    city: location.city,
    stateRegion: location.state,
    country: location.country,
    postalCode: location.postalCode,
    linkedinUrl,
    website,
    currentJobTitle,
    currentEmployer,
    yearsExperience
  };
}

function extractEducation(eduArray) {
  if (!Array.isArray(eduArray)) return [];

  console.log('[extractEducation] Processing', eduArray.length, 'entries');

  return eduArray.map((e, idx) => {
    console.log(`[extractEducation] Entry ${idx}:`, {
      hasParsed: !!e.parsed,
      hasRaw: !!e.raw
    });

    const parsed = e.parsed || {};
    const organizationObj = parsed.educationOrganization || {};
    const accreditationObj = parsed.educationAccreditation || {};
    const datesObj = parsed.educationDates || {};
    const locationObj = parsed.educationLocation || {};
    const gradeObj = parsed.educationGrade || {};

    const dates = (e.dates && typeof e.dates === 'object' && 'value' in e.dates)
      ? e.dates.value
      : (e.dates || {});

    const accreditation = (e.accreditation && typeof e.accreditation === 'object' && 'value' in e.accreditation)
      ? e.accreditation.value
      : (e.accreditation || {});

    let institution = stripSectionHeaders(safeTrim(
      organizationObj.raw ||
      organizationObj.parsed ||
      e.organization?.name ||
      e.organization?.raw ||
      e.organization ||
      e.institution ||
      e.school ||
      e.institutionName
    ));

    const datesData = datesObj.parsed || {};
    let start = coalesce(
      datesData.start?.date,
      datesData.start?.year ? `${datesData.start.year}-01-01` : '',
      dates.startDate,
      dates.start,
      e.startDate
    );

    let end = coalesce(
      datesData.end?.date,
      datesData.end?.year ? `${datesData.end.year}-01-01` : '',
      dates.completionDate,
      dates.endDate,
      dates.end,
      e.endDate,
      e.graduationDate
    );

    let gpa = safeTrim(
      gradeObj.raw ||
      gradeObj.parsed ||
      e.grade?.value ||
      e.grade ||
      e.gpa ||
      e.score
    );

    if (gpa && gpa.toLowerCase().startsWith('gpa:')) {
      gpa = gpa.replace(/^gpa:\s*/i, '').trim();
    }

    let degree = safeTrim(
      accreditationObj.raw ||
      accreditationObj.parsed?.education ||
      accreditationObj.parsed?.educationLevel ||
      accreditation.education ||
      e.studyType ||
      e.degree ||
      e.educationLevel ||
      e.degreeType
    );

    let major = safeTrim(
      accreditationObj.parsed?.educationLevel ||
      accreditationObj.parsed?.inputStr ||
      accreditation.educationLevel ||
      e.area ||
      e.fieldOfStudy ||
      e.major ||
      e.field
    );

    if (major && /^[a-zA-Z0-9]{8}$/.test(major)) {
      console.log(`[extractEducation] Entry ${idx} filtering out field ID from major:`, major);
      major = '';
    }

    console.log(`[extractEducation] Entry ${idx} extracted:`, {
      institution,
      degree,
      major,
      gpa,
      start,
      end
    });

    const hasStructuredData = !!(institution && (start || end || degree || major || gpa));
    const needsTextParsing = !hasStructuredData ||
      (institution && /\d{4}\s*-\s*\d{4}/.test(institution)) ||
      !major;

    if (needsTextParsing && e.raw) {
      console.log(`[extractEducation] Entry ${idx} parsing from raw text`);

      const rawText = String(flattenValue(e.raw));
      const lines = rawText
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean);

      console.log(`[extractEducation] Entry ${idx} lines:`, lines);

      if (lines.length >= 2) {
        if (!degree || /\d{4}/.test(degree)) {
          const degreeLine = lines[0];
          degree = degreeLine.replace(/\d{4}\s*-\s*\d{4}/g, '').replace(/GPA.*$/i, '').trim();
        }

        if (!institution || /\d{4}/.test(institution)) {
          institution = stripSectionHeaders(lines[1]);
        }
      }

      if (!start || !end) {
        const dateLine = lines.find(l => /\b\d{4}\b\s*-\s*(Present|\d{4})/i.test(l));
        if (dateLine) {
          const m = dateLine.match(/(\d{4})\s*-\s*(Present|\d{4})/i);
          if (m) {
            start = `${m[1]}-01-01`;
            end = m[2].toLowerCase() === 'present' ? '' : `${m[2]}-01-01`;
          }
        }
      }

      if (!gpa || gpa.length < 2) {
        const gpaLine = lines.find(l => /GPA\s*:/i.test(l));
        if (gpaLine) {
          const mg = gpaLine.match(/GPA\s*:\s*([0-9.\/]+)/i);
          if (mg) gpa = mg[1];
        }
      }

      if (!major && e.raw) {
        const rawText = String(flattenValue(e.raw));

        const patterns = [
          /(?:Bachelor|Master|Associate)[^•\n]*?\s+in\s+([A-Za-z][A-Za-z\s&-]+?)(?=\s*(?:University|College|Institute|\d{4}|GPA|•|\n|$))/i,
          /\b(?:BS|BA|MS|MA|PhD|BBA|MBA|BSc|MSc)\s+in\s+([A-Za-z][A-Za-z\s&-]+?)(?=\s*(?:University|College|Institute|\d{4}|GPA|•|\n|$))/i,
          /\s+in\s+([A-Za-z][A-Za-z\s&-]{5,})(?=\s*(?:University|College|Institute|\d{4}|GPA|•|\n))/i
        ];

        for (const pattern of patterns) {
          const match = rawText.match(pattern);
          if (match && match[1]) {
            major = match[1].trim();
            console.log(`[extractEducation] Entry ${idx} extracted major from pattern:`, major);
            break;
          }
        }

        if (major) {
          major = major.split(/\s+(?:University|College|Institute|School)/i)[0].trim();
          major = major.replace(/\s*\d{4}.*$/g, '').trim();
          major = major.replace(/\s*(?:degree|program|studies)$/i, '').trim();
        }
      }
    }

    const isCurrent = isPresentLike(end) || e.current === true;

    const locationData = locationObj.parsed || locationObj.raw || e.location;
    let eduLocation;

    if (locationData && typeof locationData === 'object' && locationData.city) {
      eduLocation = {
        city: locationData.city || '',
        state: locationData.stateCode || locationData.state || '',
        country: locationData.countryCode || locationData.country || '',
        postalCode: locationData.postalCode || ''
      };
    } else {
      eduLocation = parseLocation(locationData);
    }

    return {
      institutionName: institution,
      majorFieldOfStudy: major,
      highestDegree: degree,
      gpa,
      institutionCity: eduLocation.city,
      institutionState: eduLocation.state,
      institutionAddress: safeTrim(eduLocation.address),
      attendanceStartDate: normalizeDate(start),
      graduationDate: isCurrent ? '' : normalizeDate(end),
      current: isCurrent
    };
  }).filter(e => e.institutionName);
}

/**
 * ✅ COMPLETE: Extract work experience with enhanced bullet extraction
 */
function extractWork(workArray) {
  if (!Array.isArray(workArray)) return [];

  console.log('[extractWork] Processing', workArray.length, 'entries');

  const DATE_RANGE_RE = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*(?:-|to|–|—)\s*(Present|\d{4})\b/gi;

  return workArray.map((w, idx) => {
    console.log(`[extractWork] Entry ${idx}:`, {
      hasParsed: !!w.parsed,
      hasRaw: !!w.raw
    });

    const parsed = w.parsed || {};

    const jobTitleObj = parsed.workExperienceJobTitle || {};
    const organizationObj = parsed.workExperienceOrganization || {};
    const datesObj = parsed.workExperienceDates || {};
    const locationObj = parsed.workExperienceLocation || {};
    const descriptionObj = parsed.workExperienceDescription || {};

    let organization = safeTrim(
      organizationObj.raw ||
      organizationObj.parsed ||
      w.organization?.name ||
      w.organization?.raw ||
      w.organization ||
      w.company?.name ||
      w.company ||
      w.companyName
    );

    let jobTitle = safeTrim(
      jobTitleObj.raw ||
      jobTitleObj.parsed ||
      w.jobTitle?.name ||
      w.jobTitle?.raw ||
      w.jobTitle ||
      w.position ||
      w.title ||
      w.role
    );

    const datesData = datesObj.parsed || {};
    // Support OpenAI flat dates object: w.dates.startDate / w.dates.endDate / w.dates.isCurrent
    const wDates = (w.dates && typeof w.dates === 'object') ? w.dates : {};
    let start = coalesce(
      datesData.start?.date,
      datesData.start?.year ? `${datesData.start.year}-01-01` : '',
      wDates.startDate,
      w.startDate,
      w.fromDate
    );

    let end = coalesce(
      datesData.end?.date,
      datesData.end?.year ? `${datesData.end.year}-01-01` : '',
      wDates.isCurrent ? '' : wDates.endDate,
      w.endDate,
      w.toDate
    );

    let current = wDates.isCurrent === true ? true :
      (datesData.end?.isCurrent === false ? false :
      (isPresentLike(end) || w.current === true || datesData.end?.isCurrent === true));

    const locationData = locationObj.parsed || locationObj.raw || w.location;
    let workLocation;

    if (locationData && typeof locationData === 'object' && locationData.city) {
      workLocation = {
        city: locationData.city || '',
        state: locationData.stateCode || locationData.state || '',
        country: locationData.countryCode || locationData.country || '',
        postalCode: locationData.postalCode || ''
      };
    } else {
      workLocation = parseLocation(locationData);
    }

    let description = safeTrim(
      descriptionObj.raw ||
      descriptionObj.parsed ||
      w.jobDescription ||
      w.description ||
      w.summary
    );

    if ((!description || description.split(/[•-]/).length <= 2) && w.raw) {
      const rawText = String(w.raw).replace(/\r/g, '');
      
      const bullets = rawText
        .split(/\n[-•]\s*/g)
        .map(b => b.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(1);
      
      if (bullets.length > 0) {
        description = bullets.map(b => `• ${b}`).join('\n');
        console.log(`[extractWork] Entry ${idx} extracted ${bullets.length} bullets from raw text`);
      }
    }

    // ✅ Clean company name by removing dates and locations
    if (organization && w.raw) {
      const cleanedHeader = String(w.raw).replace(DATE_RANGE_RE, '').replace(/\s{2,}/g, ' ').trim();
      const withoutLocation = cleanedHeader.replace(workLocation.city || '', '').replace(/\s{2,}/g, ' ').trim();
      const firstLine = withoutLocation.split(/\n/)[0];
      const companyFromHeader = firstLine.replace(jobTitle, '').replace(/\s{2,}/g, ' ').trim();
      if (companyFromHeader && companyFromHeader.length > 2) {
        organization = companyFromHeader;
      }
    }

    console.log(`[extractWork] Entry ${idx} extracted:`, {
      organization,
      jobTitle,
      start,
      end,
      current,
      location: workLocation,
      descriptionLength: description.length,
      bulletCount: (description.match(/•/g) || []).length
    });

    const hasStructuredData = !!(organization && jobTitle && (start || end));

    if (!hasStructuredData && w.raw) {
      console.log(`[extractWork] Entry ${idx} using text parser fallback`);

      const parsedText = parseWorkFromText(w.raw);

      if (parsedText) {
        if (!organization && parsedText.companyName) organization = parsedText.companyName;
        if (!jobTitle && parsedText.jobTitle) jobTitle = parsedText.jobTitle;
        if (!start && parsedText.startDate) start = parsedText.startDate;
        if (!end && parsedText.endDate !== undefined) end = parsedText.endDate;
        if (!current && parsedText.current) current = parsedText.current;

        if ((!workLocation.city && !workLocation.state) && parsedText.locationText) {
          workLocation = parseCityStateFromText(parsedText.locationText);
        }

        if (!description && parsedText.desc) {
          description = parsedText.desc;
        }
      }
    }

    return {
      companyName: organization,
      jobTitle: jobTitle,
      startDate: normalizeDate(start),
      endDate: current ? null : normalizeDate(end),
      current,
      description,
      location: `${workLocation.city}${workLocation.state ? ', ' + workLocation.state : ''}`.trim()
    };
  }).filter(w => w.companyName || w.jobTitle);
}

// ============================================
// PREFILL BUILDERS
// ============================================

function buildStep1Prefill(basics, work, skills) {
  return {
    fullLegalName: basics.fullLegalName,
    email: basics.email,
    phone: basics.phone,
    linkedinUrl: basics.linkedinUrl,
    website: basics.website,
    city: basics.city,
    stateRegion: basics.stateRegion,
    country: basics.country,
    currentJobTitle: basics.currentJobTitle,
    currentEmployer: basics.currentEmployer,
    yearsExperience: String(basics.yearsExperience || '0'),
    coreSkills: skills.map(s => s.name).join(', ')
  };
}

function buildStep3Prefill(basics, education, work) {
  const firstEdu = education[0] || {};
  const firstWork = work[0] || {};

  return {
    fullLegalName: basics.fullLegalName,
    email: basics.email,
    phone: basics.phone,
    city: basics.city,
    stateRegion: basics.stateRegion,
    postalCode: basics.postalCode,
    country: basics.country,
    linkedinUrl: basics.linkedinUrl,
    linkedIn: basics.linkedinUrl,
    linkedin: basics.linkedinUrl,
    currentJobTitle: basics.currentJobTitle,
    currentTitle: basics.currentJobTitle,
    highestDegree: firstEdu.highestDegree || '',
    majorFieldOfStudy: firstEdu.majorFieldOfStudy || '',
    gpa: firstEdu.gpa || '',
    institutionName: firstEdu.institutionName || '',
    institutionAddress: firstEdu.institutionAddress || '',
    institutionCity: firstEdu.institutionCity || '',
    institutionState: firstEdu.institutionState || '',
    attendanceStartDate: firstEdu.attendanceStartDate || '',
    graduationDate: firstEdu.graduationDate || '',
    physicalAddress: `${basics.city}${basics.stateRegion ? ', ' + basics.stateRegion : ''}${basics.country ? ', ' + basics.country : ''}`.trim(),
    streetAddress: '',
    county: '',
    fromDate: '',
    endDate: firstWork?.current ? 'Present' : '',
    residentialHistory: [{
      streetAddress: '',
      city: basics.city,
      state: basics.stateRegion,
      postalCode: basics.postalCode,
      fromDate: '',
      toDate: 'Present'
    }],
    education: education,
    workHistory: work
  };
}

function buildStep5Education(education) {
  return education.map(e => ({
    institution: e.institutionName,
    location: `${e.institutionCity}${e.institutionState ? ', ' + e.institutionState : ''}`.trim(),
    dates: `${e.attendanceStartDate || ''} - ${e.graduationDate || (e.current ? 'Present' : '')}`.trim(),
    degree: e.highestDegree,
    major: e.majorFieldOfStudy,
    gpa: e.gpa
  }));
}

function buildStep6Work(work) {
  return work.map(w => {
    const start = w.startDate || '';
    const end = w.current ? 'Present' : (w.endDate || start);
    const dateStr = start && end ? `${start} - ${end}` : (start || '');

    return {
      company: w.companyName,
      title: w.jobTitle,
      dates: dateStr,
      description: w.description,
      location: w.location || ''
    };
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateYearsExperience(work) {
  if (!Array.isArray(work) || work.length === 0) return 0;

  let totalMonths = 0;
  const now = new Date();

  for (const job of work) {
    const start = job.startDate ? new Date(job.startDate) : null;
    const end = job.current ? now : (job.endDate ? new Date(job.endDate) : null);

    if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      const months = (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, months);
    }
  }

  return Math.floor(totalMonths / 12);
}

function buildEmptyResponse() {
  return {
    prefill: {
      step1: {},
      step3: {},
      step5: [],
      step6: []
    },
    profileDraft: {
      basics: {},
      work: [],
      education: [],
      skills: [],
      keywords: [],
      currentJobTitle: null
    },
    confidence: 0
  };
}

export default mapToProfileDraft;
