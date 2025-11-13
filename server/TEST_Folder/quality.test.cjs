// const fs = require('fs');
// const path = require('path');
// const axios = require('axios');
// const FormData = require('form-data');

// // ============================================
// // CONFIGURATION
// // ============================================
// const API_URL = 'http://localhost:5001/api/resume/parse';

// // Test files
// const TEST_FILES = [
//   'C:\\Users\\HT\\Desktop\\RESUME_PARSER\\Testing_Resume_1.docx',
//   'C:\\Users\\HT\\Desktop\\RESUME_PARSER\\Testing_Resume_2.docx',
//   'C:\\Users\\HT\\Desktop\\RESUME_PARSER\\Testing_Resume_3_txt.txt',
//   'C:\\Users\\HT\\Desktop\\Muhammad_Subhan_CV.pdf',
//   'C:\\Users\\HT\\Desktop\\RESUME_PARSER\\new_resume_001.docx',
//   'C:\\Users\\HT\\Desktop\\RESUME_PARSER\\CV_TEMPLATE_0003.docx'
// ];

// // Quality validation rules
// const QUALITY_RULES = {
//   name: { required: true, minLength: 3, maxLength: 100, weight: 15, description: 'Full name extracted' },
//   email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, weight: 10, description: 'Valid email address' },
//   phone: { required: true, minLength: 7, weight: 10, description: 'Phone number extracted' },
//   location: { required: true, minLength: 3, weight: 8, description: 'Location information' },
//   skills: { required: true, minCount: 3, maxCount: 100, weight: 12, description: 'Reasonable skills count (3-100)' },
//   education: { required: true, minCount: 1, maxCount: 5, weight: 12, description: 'Education entries (1-5)' },
//   educationHasDegree: { required: false, weight: 8, description: 'Education has degree information' },
//   educationHasInstitution: { required: true, weight: 8, description: 'Education has institution' },
//   workExperience: { required: true, minCount: 1, maxCount: 10, weight: 12, description: 'Work experience entries (1-10)' },
//   workHasBullets: { required: false, weight: 5, description: 'Work experience has bullet points' }
// };

// // ============================================
// // EXTRACT SUMMARY - USE DIRECT SUMMARY OBJECT
// // ============================================
// function extractSummary(responseData) {
//   // The server now returns a summary object - use it directly!
//   const summary = responseData.summary;

//   if (!summary) {
//     console.error('   ❌ No summary object in response');
//     console.error('   → Available keys:', Object.keys(responseData));
//     throw new Error('Server response missing summary object');
//   }

//   console.log('   ✅ Summary object found');

//   return {
//     name: summary.name || 'N/A',
//     email: summary.email || 'N/A',
//     phone: summary.phone || 'N/A',
//     location: summary.location || 'N/A',
//     skills: Array.isArray(summary.skills) ? summary.skills : [],
//     education: Array.isArray(summary.education) ? summary.education : [],
//     workExperience: Array.isArray(summary.workExperience) ? summary.workExperience : []
//   };
// }

// // ============================================
// // PARSE RESUME
// // ============================================
// async function parseResume(filePath) {
//   const formData = new FormData();
//   const fileName = path.basename(filePath);

//   // Match server's expected field name
//   formData.append('file', fs.createReadStream(filePath), {
//     filename: fileName,
//     contentType: getContentType(fileName)
//   });

//   try {
//     console.log(`   → Sending request to: ${API_URL}`);
//     console.log(`   → File: ${fileName}`);

//     const response = await axios.post(API_URL, formData, {
//       headers: {
//         ...formData.getHeaders()
//       },
//       maxContentLength: Infinity,
//       maxBodyLength: Infinity,
//       timeout: 90000
//     });

//     console.log(`   ✅ Server responded with status: ${response.status}`);

//     if (response.data && response.data.success) {
//       // Extract summary from the direct summary object
//       const summary = extractSummary(response.data.data);

//       console.log(`   ✅ Extracted data:`, {
//         name: summary.name,
//         email: summary.email,
//         skillsCount: summary.skills?.length || 0,
//         eduCount: summary.education?.length || 0,
//         workCount: summary.workExperience?.length || 0
//       });

//       return summary;
//     } else {
//       throw new Error(response.data?.error || 'Parsing failed - no success flag');
//     }
//   } catch (error) {
//     if (error.response) {
//       console.error(`   ❌ Server error (${error.response.status}):`, error.response.data);
//       throw new Error(
//         `API error ${error.response.status}: ${error.response.data?.error || error.response.data?.detail || JSON.stringify(error.response.data)}`
//       );
//     } else if (error.request) {
//       console.error(`   ❌ No response from server:`, error.message);
//       throw new Error(`Network error: No response from server at ${API_URL}. Is the server running?`);
//     } else {
//       console.error(`   ❌ Request setup error:`, error.message);
//       throw new Error(`Request error: ${error.message}`);
//     }
//   }
// }

// function getContentType(fileName) {
//   const ext = path.extname(fileName).toLowerCase();
//   const types = {
//     '.pdf': 'application/pdf',
//     '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     '.doc': 'application/msword',
//     '.txt': 'text/plain',
//     '.rtf': 'application/rtf'
//   };
//   return types[ext] || 'application/octet-stream';
// }

// // ============================================
// // VALIDATE QUALITY
// // ============================================
// function validateQuality(parsed) {
//   const results = {};
//   let totalScore = 0;
//   let maxScore = 0;

//   // Name
//   if (QUALITY_RULES.name) {
//     maxScore += QUALITY_RULES.name.weight;
//     if (parsed.name && parsed.name !== 'N/A' &&
//       parsed.name.length >= QUALITY_RULES.name.minLength &&
//       parsed.name.length <= QUALITY_RULES.name.maxLength) {
//       results.name = { pass: true, score: QUALITY_RULES.name.weight, message: '✅ Name extracted successfully' };
//       totalScore += QUALITY_RULES.name.weight;
//     } else {
//       results.name = { pass: false, score: 0, message: `❌ Name missing or invalid: "${parsed.name}"` };
//     }
//   }

//   // Email
//   if (QUALITY_RULES.email) {
//     maxScore += QUALITY_RULES.email.weight;
//     if (parsed.email && parsed.email !== 'N/A' && QUALITY_RULES.email.pattern.test(parsed.email)) {
//       results.email = { pass: true, score: QUALITY_RULES.email.weight, message: '✅ Valid email found' };
//       totalScore += QUALITY_RULES.email.weight;
//     } else {
//       results.email = { pass: false, score: 0, message: `❌ Email missing or invalid: "${parsed.email}"` };
//     }
//   }

//   // Phone
//   if (QUALITY_RULES.phone) {
//     maxScore += QUALITY_RULES.phone.weight;
//     if (parsed.phone && parsed.phone !== 'N/A' && parsed.phone.length >= QUALITY_RULES.phone.minLength) {
//       results.phone = { pass: true, score: QUALITY_RULES.phone.weight, message: '✅ Phone number extracted' };
//       totalScore += QUALITY_RULES.phone.weight;
//     } else {
//       results.phone = { pass: false, score: 0, message: `❌ Phone missing or invalid: "${parsed.phone}"` };
//     }
//   }

//   // Location
//   if (QUALITY_RULES.location) {
//     maxScore += QUALITY_RULES.location.weight;
//     if (parsed.location && parsed.location !== 'N/A' && parsed.location.length >= QUALITY_RULES.location.minLength) {
//       results.location = { pass: true, score: QUALITY_RULES.location.weight, message: '✅ Location extracted' };
//       totalScore += QUALITY_RULES.location.weight;
//     } else {
//       results.location = { pass: false, score: 0, message: `❌ Location missing: "${parsed.location}"` };
//     }
//   }

//   // Skills (from array of strings)
//   if (QUALITY_RULES.skills) {
//     maxScore += QUALITY_RULES.skills.weight;
//     const skillCount = parsed.skills?.length || 0;
//     if (skillCount >= QUALITY_RULES.skills.minCount && skillCount <= QUALITY_RULES.skills.maxCount) {
//       results.skills = { pass: true, score: QUALITY_RULES.skills.weight, message: `✅ ${skillCount} skills extracted` };
//       totalScore += QUALITY_RULES.skills.weight;
//     } else if (skillCount > QUALITY_RULES.skills.maxCount) {
//       results.skills = { pass: true, score: Math.floor(QUALITY_RULES.skills.weight * 0.8), message: `⚠️  ${skillCount} skills (high count, possible noise)` };
//       totalScore += Math.floor(QUALITY_RULES.skills.weight * 0.8);
//     } else {
//       results.skills = { pass: false, score: 0, message: `❌ Only ${skillCount} skills found (minimum ${QUALITY_RULES.skills.minCount})` };
//     }
//   }

//   // Education count
//   if (QUALITY_RULES.education) {
//     maxScore += QUALITY_RULES.education.weight;
//     const eduCount = parsed.education?.length || 0;
//     if (eduCount >= QUALITY_RULES.education.minCount && eduCount <= QUALITY_RULES.education.maxCount) {
//       results.education = { pass: true, score: QUALITY_RULES.education.weight, message: `✅ ${eduCount} education entries` };
//       totalScore += QUALITY_RULES.education.weight;
//     } else {
//       results.education = { pass: false, score: 0, message: `❌ ${eduCount} education entries (expected ${QUALITY_RULES.education.minCount}-${QUALITY_RULES.education.maxCount})` };
//     }
//   }

//   // Education: degree (summary uses 'degree' field)
//   if (QUALITY_RULES.educationHasDegree) {
//     maxScore += QUALITY_RULES.educationHasDegree.weight;
//     const hasDegree = parsed.education?.length > 0 &&
//       parsed.education[0].degree &&
//       parsed.education[0].degree !== 'N/A';
//     if (hasDegree) {
//       results.educationHasDegree = { pass: true, score: QUALITY_RULES.educationHasDegree.weight, message: `✅ Degree: "${parsed.education[0].degree}"` };
//       totalScore += QUALITY_RULES.educationHasDegree.weight;
//     } else {
//       results.educationHasDegree = { pass: false, score: 0, message: '❌ No degree information found' };
//     }
//   }

//   // Education: institution (summary uses 'institution' field)
//   if (QUALITY_RULES.educationHasInstitution) {
//     maxScore += QUALITY_RULES.educationHasInstitution.weight;
//     const hasInst = parsed.education?.length > 0 &&
//       parsed.education[0].institution &&
//       parsed.education[0].institution !== 'N/A';
//     if (hasInst) {
//       results.educationHasInstitution = { pass: true, score: QUALITY_RULES.educationHasInstitution.weight, message: `✅ Institution: "${parsed.education[0].institution}"` };
//       totalScore += QUALITY_RULES.educationHasInstitution.weight;
//     } else {
//       results.educationHasInstitution = { pass: false, score: 0, message: '❌ No institution found' };
//     }
//   }

//   // Work count
//   if (QUALITY_RULES.workExperience) {
//     maxScore += QUALITY_RULES.workExperience.weight;
//     const workCount = parsed.workExperience?.length || 0;
//     if (workCount >= QUALITY_RULES.workExperience.minCount && workCount <= QUALITY_RULES.workExperience.maxCount) {
//       results.workExperience = { pass: true, score: QUALITY_RULES.workExperience.weight, message: `✅ ${workCount} work experience entries` };
//       totalScore += QUALITY_RULES.workExperience.weight;
//     } else {
//       results.workExperience = { pass: false, score: 0, message: `❌ ${workCount} work entries (expected ${QUALITY_RULES.workExperience.minCount}-${QUALITY_RULES.workExperience.maxCount})` };
//     }
//   }

//   // Work bullets (summary uses 'description' field)
//   // Work bullets (summary uses 'description' field)
//   if (QUALITY_RULES.workHasBullets) {
//     maxScore += QUALITY_RULES.workHasBullets.weight;
//     const totalBullets = parsed.workExperience?.reduce((sum, exp) => {
//       const desc = exp.description || '';
//       // Count bullets by both • character AND newlines
//       const bulletCount = Math.max(
//         desc.split('•').filter(b => b.trim().length > 10).length,
//         desc.split('\n').filter(b => b.trim().length > 10 && b.includes('•')).length
//       );
//       return sum + bulletCount;
//     }, 0) || 0;

//     if (totalBullets >= QUALITY_RULES.workHasBullets.minBullets) {
//       results.workHasBullets = { pass: true, score: QUALITY_RULES.workHasBullets.weight, message: `✅ ${totalBullets} bullet points found` };
//       totalScore += QUALITY_RULES.workHasBullets.weight;
//     } else {
//       results.workHasBullets = { pass: false, score: 0, message: `❌ No bullet points found in work experience` };
//     }
//   }


//   const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
//   return {
//     results,
//     totalScore,
//     maxScore,
//     percentage,
//     grade: percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F'
//   };
// }

// function printValidationResults(fileName, parsed, validation) {
//   console.log('\n' + '='.repeat(80));
//   console.log(`📄 FILE: ${fileName}`);
//   console.log('='.repeat(80));

//   console.log('\n📋 PARSED SUMMARY:');
//   console.log(`   Name:     ${parsed.name}`);
//   console.log(`   Email:    ${parsed.email}`);
//   console.log(`   Phone:    ${parsed.phone}`);
//   console.log(`   Location: ${parsed.location}`);
//   console.log(`   Skills:   ${parsed.skills?.length || 0} found`);
//   console.log(`   Education: ${parsed.education?.length || 0} entries`);
//   console.log(`   Work:     ${parsed.workExperience?.length || 0} positions`);

//   console.log('\n✅ QUALITY VALIDATION:');
//   console.log('─'.repeat(80));

//   Object.entries(validation.results).forEach(([key, result]) => {
//     const rule = QUALITY_RULES[key];
//     if (rule) {
//       console.log(`   ${result.message}`);
//       console.log(`      ${rule.description} [${result.score}/${rule.weight} points]`);
//     }
//   });

//   console.log('\n' + '─'.repeat(80));
//   const emoji = validation.grade === 'A' ? '🟢' : validation.grade === 'B' ? '🟡' : validation.grade === 'C' ? '🟠' : '🔴';
//   console.log(`${emoji} QUALITY SCORE: ${validation.percentage.toFixed(1)}% (${validation.totalScore}/${validation.maxScore} points) - Grade: ${validation.grade}`);
// }

// async function runQualityTests() {
//   console.log('\n🚀 AUTOMATED RESUME QUALITY VALIDATION\n');
//   console.log('Testing against API:', API_URL);
//   console.log('No manual expected values needed!\n');

//   // Test server connectivity
//   try {
//     const healthCheck = await axios.get('http://localhost:5001/api/debug/env', { timeout: 5000 });
//     console.log('✅ Server is responsive');
//     console.log('   Affinda Status:', healthCheck.data.affinda?.status || 'unknown');
//     console.log('   Parser Mode:', healthCheck.data.parser?.mode || 'unknown');
//     console.log('');
//   } catch (error) {
//     console.error('❌ Server connectivity check failed!');
//     console.error('   Make sure the server is running on port 5001');
//     console.error('   Error:', error.message);
//     console.log('');
//     process.exit(1);
//   }

//   const allResults = [];

//   for (const filePath of TEST_FILES) {
//     try {
//       const fileName = path.basename(filePath);
//       console.log(`\n⏳ Processing: ${fileName}...`);

//       if (!fs.existsSync(filePath)) {
//         console.error(`❌ File not found: ${filePath}`);
//         allResults.push({
//           fileName,
//           score: 0,
//           grade: 'F',
//           passed: false,
//           error: 'File not found'
//         });
//         continue;
//       }

//       const parsed = await parseResume(filePath);
//       const validation = validateQuality(parsed);

//       printValidationResults(fileName, parsed, validation);

//       allResults.push({
//         fileName,
//         score: validation.percentage,
//         grade: validation.grade,
//         passed: validation.percentage >= 70
//       });
//     } catch (error) {
//       console.error(`\n❌ Error processing ${path.basename(filePath)}:`);
//       console.error(`   ${error.message}`);
//       allResults.push({
//         fileName: path.basename(filePath),
//         score: 0,
//         grade: 'F',
//         passed: false,
//         error: error.message
//       });
//     }

//     await new Promise(resolve => setTimeout(resolve, 2000));
//   }

//   console.log('\n\n' + '='.repeat(80));
//   console.log('📊 FINAL QUALITY REPORT');
//   console.log('='.repeat(80));

//   allResults.forEach(result => {
//     const emoji = result.grade === 'A' ? '🟢' : result.grade === 'B' ? '🟡' : result.grade === 'C' ? '🟠' : '🔴';
//     if (result.error) {
//       console.log(`${emoji} ${result.fileName.padEnd(40)} ERROR: ${result.error.substring(0, 40)}`);
//     } else {
//       console.log(`${emoji} ${result.fileName.padEnd(40)} ${result.score.toFixed(1)}% (${result.grade})`);
//     }
//   });

//   const passedTests = allResults.filter(r => r.passed && !r.error);
//   const passRate = (passedTests.length / allResults.length) * 100;

//   console.log('\n' + '='.repeat(80));
//   console.log(`🎯 PASS RATE: ${passedTests.length}/${allResults.length} (${passRate.toFixed(1)}%)`);
//   if (passedTests.length > 0) {
//     const avgScore = allResults.filter(r => !r.error).reduce((sum, r) => sum + r.score, 0) / allResults.filter(r => !r.error).length;
//     console.log(`📈 AVERAGE QUALITY SCORE: ${avgScore.toFixed(1)}%`);
//   }
//   console.log('='.repeat(80));
//   console.log('\n✨ Quality validation complete!\n');
// }

// runQualityTests().catch(console.error);



const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// ============================================
// CONFIGURATION
// ============================================
const API_URL = 'http://localhost:5001/api/resume/parse';

// Test files
const TEST_FILES = [
  'D:\\download\\Node_js_New\\talendro-developer-package\\Sample_Resumes\\Testing_Resume_1.docx',
  'D:\\download\\Node_js_New\\talendro-developer-package\\Sample_Resumes\\Testing_Resume_2.docx',
  'D:\\download\\Node_js_New\\talendro-developer-package\\Sample_Resumes\\Testing_Resume_3_txt.txt',
  'D:\\download\\Node_js_New\\talendro-developer-package\\Sample_Resumes\\new_resume_001.docx',
  'D:\\download\\Node_js_New\\talendro-developer-package\\Sample_Resumes\\CV_TEMPLATE_0003.docx'

];

// Quality validation rules
const QUALITY_RULES = {
  name: { required: true, minLength: 3, maxLength: 100, weight: 15, description: 'Full name extracted' },
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, weight: 10, description: 'Valid email address' },
  phone: { required: true, minLength: 7, weight: 10, description: 'Phone number extracted' },
  location: { required: true, minLength: 3, weight: 8, description: 'Location information' },
  skills: { required: true, minCount: 3, maxCount: 100, weight: 12, description: 'Reasonable skills count (3-100)' },
  education: { required: true, minCount: 1, maxCount: 5, weight: 12, description: 'Education entries (1-5)' },
  educationHasDegree: { required: false, weight: 8, description: 'Education has degree information' },
  educationHasInstitution: { required: true, weight: 8, description: 'Education has institution' },
  workExperience: { required: true, minCount: 1, maxCount: 10, weight: 12, description: 'Work experience entries (1-10)' },
  workHasBullets: { required: false, weight: 5, description: 'Work experience has bullet points' }
};

// ============================================
// EXTRACT SUMMARY - USE DIRECT SUMMARY OBJECT
// ============================================
function extractSummary(responseData) {
  const summary = responseData.summary;

  if (!summary) {
    console.error('   ❌ No summary object in response');
    console.error('   → Available keys:', Object.keys(responseData));
    throw new Error('Server response missing summary object');
  }

  console.log('   ✅ Summary object found');

  return {
    name: summary.name || 'N/A',
    email: summary.email || 'N/A',
    phone: summary.phone || 'N/A',
    location: summary.location || 'N/A',
    skills: Array.isArray(summary.skills) ? summary.skills : [],
    education: Array.isArray(summary.education) ? summary.education : [],
    workExperience: Array.isArray(summary.workExperience) ? summary.workExperience : []
  };
}

// ============================================
// PARSE RESUME
// ============================================
async function parseResume(filePath) {
  const formData = new FormData();
  const fileName = path.basename(filePath);

  formData.append('file', fs.createReadStream(filePath), {
    filename: fileName,
    contentType: getContentType(fileName)
  });

  try {
    console.log(`   → Sending request to: ${API_URL}`);
    console.log(`   → File: ${fileName}`);

    const response = await axios.post(API_URL, formData, {
      headers: {
        ...formData.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 90000
    });

    console.log(`   ✅ Server responded with status: ${response.status}`);

    if (response.data && response.data.success) {
      const summary = extractSummary(response.data.data);

      console.log(`   ✅ Extracted data:`, {
        name: summary.name,
        email: summary.email,
        skillsCount: summary.skills?.length || 0,
        eduCount: summary.education?.length || 0,
        workCount: summary.workExperience?.length || 0
      });

      return summary;
    } else {
      throw new Error(response.data?.error || 'Parsing failed - no success flag');
    }
  } catch (error) {
    if (error.response) {
      console.error(`   ❌ Server error (${error.response.status}):`, error.response.data);
      throw new Error(
        `API error ${error.response.status}: ${error.response.data?.error || error.response.data?.detail || JSON.stringify(error.response.data)}`
      );
    } else if (error.request) {
      console.error(`   ❌ No response from server:`, error.message);
      throw new Error(`Network error: No response from server at ${API_URL}. Is the server running?`);
    } else {
      console.error(`   ❌ Request setup error:`, error.message);
      throw new Error(`Request error: ${error.message}`);
    }
  }
}

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const types = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.txt': 'text/plain',
    '.rtf': 'application/rtf'
  };
  return types[ext] || 'application/octet-stream';
}

// ============================================
// VALIDATE QUALITY
// ============================================
function validateQuality(parsed) {
  const results = {};
  let totalScore = 0;
  let maxScore = 0;

  // Name
  if (QUALITY_RULES.name) {
    maxScore += QUALITY_RULES.name.weight;
    if (parsed.name && parsed.name !== 'N/A' &&
      parsed.name.length >= QUALITY_RULES.name.minLength &&
      parsed.name.length <= QUALITY_RULES.name.maxLength) {
      results.name = { pass: true, score: QUALITY_RULES.name.weight, message: '✅ Name extracted successfully' };
      totalScore += QUALITY_RULES.name.weight;
    } else {
      results.name = { pass: false, score: 0, message: `❌ Name missing or invalid: "${parsed.name}"` };
    }
  }

  // Email
  if (QUALITY_RULES.email) {
    maxScore += QUALITY_RULES.email.weight;
    if (parsed.email && parsed.email !== 'N/A' && QUALITY_RULES.email.pattern.test(parsed.email)) {
      results.email = { pass: true, score: QUALITY_RULES.email.weight, message: '✅ Valid email found' };
      totalScore += QUALITY_RULES.email.weight;
    } else {
      results.email = { pass: false, score: 0, message: `❌ Email missing or invalid: "${parsed.email}"` };
    }
  }

  // Phone
  if (QUALITY_RULES.phone) {
    maxScore += QUALITY_RULES.phone.weight;
    if (parsed.phone && parsed.phone !== 'N/A' && parsed.phone.length >= QUALITY_RULES.phone.minLength) {
      results.phone = { pass: true, score: QUALITY_RULES.phone.weight, message: '✅ Phone number extracted' };
      totalScore += QUALITY_RULES.phone.weight;
    } else {
      results.phone = { pass: false, score: 0, message: `❌ Phone missing or invalid: "${parsed.phone}"` };
    }
  }

  // Location
  if (QUALITY_RULES.location) {
    maxScore += QUALITY_RULES.location.weight;
    if (parsed.location && parsed.location !== 'N/A' && parsed.location.length >= QUALITY_RULES.location.minLength) {
      results.location = { pass: true, score: QUALITY_RULES.location.weight, message: '✅ Location extracted' };
      totalScore += QUALITY_RULES.location.weight;
    } else {
      results.location = { pass: false, score: 0, message: `❌ Location missing: "${parsed.location}"` };
    }
  }

  // Skills
  if (QUALITY_RULES.skills) {
    maxScore += QUALITY_RULES.skills.weight;
    const skillCount = parsed.skills?.length || 0;
    if (skillCount >= QUALITY_RULES.skills.minCount && skillCount <= QUALITY_RULES.skills.maxCount) {
      results.skills = { pass: true, score: QUALITY_RULES.skills.weight, message: `✅ ${skillCount} skills extracted` };
      totalScore += QUALITY_RULES.skills.weight;
    } else if (skillCount > QUALITY_RULES.skills.maxCount) {
      results.skills = { pass: true, score: Math.floor(QUALITY_RULES.skills.weight * 0.8), message: `⚠️  ${skillCount} skills (high count, possible noise)` };
      totalScore += Math.floor(QUALITY_RULES.skills.weight * 0.8);
    } else {
      results.skills = { pass: false, score: 0, message: `❌ Only ${skillCount} skills found (minimum ${QUALITY_RULES.skills.minCount})` };
    }
  }

  // Education count
  if (QUALITY_RULES.education) {
    maxScore += QUALITY_RULES.education.weight;
    const eduCount = parsed.education?.length || 0;
    if (eduCount >= QUALITY_RULES.education.minCount && eduCount <= QUALITY_RULES.education.maxCount) {
      results.education = { pass: true, score: QUALITY_RULES.education.weight, message: `✅ ${eduCount} education entries` };
      totalScore += QUALITY_RULES.education.weight;
    } else {
      results.education = { pass: false, score: 0, message: `❌ ${eduCount} education entries (expected ${QUALITY_RULES.education.minCount}-${QUALITY_RULES.education.maxCount})` };
    }
  }

  // Education: degree
  if (QUALITY_RULES.educationHasDegree) {
    maxScore += QUALITY_RULES.educationHasDegree.weight;
    const hasDegree = parsed.education?.length > 0 &&
      parsed.education[0].degree &&
      parsed.education[0].degree !== 'N/A';
    if (hasDegree) {
      results.educationHasDegree = { pass: true, score: QUALITY_RULES.educationHasDegree.weight, message: `✅ Degree: "${parsed.education[0].degree}"` };
      totalScore += QUALITY_RULES.educationHasDegree.weight;
    } else {
      results.educationHasDegree = { pass: false, score: 0, message: '❌ No degree information found' };
    }
  }

  // Education: institution
  if (QUALITY_RULES.educationHasInstitution) {
    maxScore += QUALITY_RULES.educationHasInstitution.weight;
    const hasInst = parsed.education?.length > 0 &&
      parsed.education[0].institution &&
      parsed.education[0].institution !== 'N/A';
    if (hasInst) {
      results.educationHasInstitution = { pass: true, score: QUALITY_RULES.educationHasInstitution.weight, message: `✅ Institution: "${parsed.education[0].institution}"` };
      totalScore += QUALITY_RULES.educationHasInstitution.weight;
    } else {
      results.educationHasInstitution = { pass: false, score: 0, message: '❌ No institution found' };
    }
  }

  // Work count
  if (QUALITY_RULES.workExperience) {
    maxScore += QUALITY_RULES.workExperience.weight;
    const workCount = parsed.workExperience?.length || 0;
    if (workCount >= QUALITY_RULES.workExperience.minCount && workCount <= QUALITY_RULES.workExperience.maxCount) {
      results.workExperience = { pass: true, score: QUALITY_RULES.workExperience.weight, message: `✅ ${workCount} work experience entries` };
      totalScore += QUALITY_RULES.workExperience.weight;
    } else {
      results.workExperience = { pass: false, score: 0, message: `❌ ${workCount} work entries (expected ${QUALITY_RULES.workExperience.minCount}-${QUALITY_RULES.workExperience.maxCount})` };
    }
  }

  // ✅ FIXED: Work bullets detection - handles both newlines and bullet characters
  if (QUALITY_RULES.workHasBullets) {
    maxScore += QUALITY_RULES.workHasBullets.weight;
    const totalBullets = parsed.workExperience?.reduce((sum, exp) => {
      const desc = exp.description || '';

      // Count bullets by splitting on newlines and checking for bullet character
      const lines = desc.split('\n').filter(line => {
        const trimmed = line.trim();
        // Must contain bullet character AND have meaningful content
        return trimmed.includes('•') && trimmed.length > 15;
      });

      return sum + lines.length;
    }, 0) || 0;

    if (totalBullets >= QUALITY_RULES.workHasBullets.minBullets) {
      results.workHasBullets = { pass: true, score: QUALITY_RULES.workHasBullets.weight, message: `✅ ${totalBullets} bullet points found` };
      totalScore += QUALITY_RULES.workHasBullets.weight;
    } else {
      results.workHasBullets = { pass: false, score: 0, message: `❌ No bullet points found in work experience` };
    }
  }

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  return {
    results,
    totalScore,
    maxScore,
    percentage,
    grade: percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F'
  };
}

function printValidationResults(fileName, parsed, validation) {
  console.log('\n' + '='.repeat(80));
  console.log(`📄 FILE: ${fileName}`);
  console.log('='.repeat(80));

  console.log('\n📋 PARSED SUMMARY:');
  console.log(`   Name:     ${parsed.name}`);
  console.log(`   Email:    ${parsed.email}`);
  console.log(`   Phone:    ${parsed.phone}`);
  console.log(`   Location: ${parsed.location}`);
  console.log(`   Skills:   ${parsed.skills?.length || 0} found`);
  console.log(`   Education: ${parsed.education?.length || 0} entries`);
  console.log(`   Work:     ${parsed.workExperience?.length || 0} positions`);

  console.log('\n✅ QUALITY VALIDATION:');
  console.log('─'.repeat(80));

  Object.entries(validation.results).forEach(([key, result]) => {
    const rule = QUALITY_RULES[key];
    if (rule) {
      console.log(`   ${result.message}`);
      console.log(`      ${rule.description} [${result.score}/${rule.weight} points]`);
    }
  });

  console.log('\n' + '─'.repeat(80));
  const emoji = validation.grade === 'A' ? '🟢' : validation.grade === 'B' ? '🟡' : validation.grade === 'C' ? '🟠' : '🔴';
  console.log(`${emoji} QUALITY SCORE: ${validation.percentage.toFixed(1)}% (${validation.totalScore}/${validation.maxScore} points) - Grade: ${validation.grade}`);
}

async function runQualityTests() {
  console.log('\n🚀 AUTOMATED RESUME QUALITY VALIDATION\n');
  console.log('Testing against API:', API_URL);
  console.log('No manual expected values needed!\n');

  // Test server connectivity
  try {
    const healthCheck = await axios.get('http://localhost:5001/api/debug/env', { timeout: 5000 });
    console.log('✅ Server is responsive');
    console.log('   Affinda Status:', healthCheck.data.affinda?.status || 'unknown');
    console.log('   Parser Mode:', healthCheck.data.parser?.mode || 'unknown');
    console.log('');
  } catch (error) {
    console.error('❌ Server connectivity check failed!');
    console.error('   Make sure the server is running on port 5001');
    console.error('   Error:', error.message);
    console.log('');
    process.exit(1);
  }

  const allResults = [];

  for (const filePath of TEST_FILES) {
    try {
      const fileName = path.basename(filePath);
      console.log(`\n⏳ Processing: ${fileName}...`);

      if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        allResults.push({
          fileName,
          score: 0,
          grade: 'F',
          passed: false,
          error: 'File not found'
        });
        continue;
      }

      const parsed = await parseResume(filePath);
      const validation = validateQuality(parsed);

      printValidationResults(fileName, parsed, validation);

      allResults.push({
        fileName,
        score: validation.percentage,
        grade: validation.grade,
        passed: validation.percentage >= 70
      });
    } catch (error) {
      console.error(`\n❌ Error processing ${path.basename(filePath)}:`);
      console.error(`   ${error.message}`);
      allResults.push({
        fileName: path.basename(filePath),
        score: 0,
        grade: 'F',
        passed: false,
        error: error.message
      });
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('📊 FINAL QUALITY REPORT');
  console.log('='.repeat(80));

  allResults.forEach(result => {
    const emoji = result.grade === 'A' ? '🟢' : result.grade === 'B' ? '🟡' : result.grade === 'C' ? '🟠' : '🔴';
    if (result.error) {
      console.log(`${emoji} ${result.fileName.padEnd(40)} ERROR: ${result.error.substring(0, 40)}`);
    } else {
      console.log(`${emoji} ${result.fileName.padEnd(40)} ${result.score.toFixed(1)}% (${result.grade})`);
    }
  });

  const passedTests = allResults.filter(r => r.passed && !r.error);
  const passRate = (passedTests.length / allResults.length) * 100;

  console.log('\n' + '='.repeat(80));
  console.log(`🎯 PASS RATE: ${passedTests.length}/${allResults.length} (${passRate.toFixed(1)}%)`);
  if (passedTests.length > 0) {
    const avgScore = allResults.filter(r => !r.error).reduce((sum, r) => sum + r.score, 0) / allResults.filter(r => !r.error).length;
    console.log(`📈 AVERAGE QUALITY SCORE: ${avgScore.toFixed(1)}%`);
  }
  console.log('='.repeat(80));
  console.log('\n✨ Quality validation complete!\n');
}

runQualityTests().catch(console.error);
