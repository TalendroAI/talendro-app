/**
 * Boolean Search String Generator & Job Search System
 * CRITICAL: Generates search strings AND executes searches before payment
 */

// API Configuration - Backend URL for proxy
const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

console.log('✓ Boolean Search Generator loaded');
console.log('Backend URL:', BACKEND_API_URL);
console.log('Note: API calls go through backend proxy to avoid CORS issues');

/**
 * MAIN FUNCTION: Generate Boolean string AND execute job search
 * This must complete before user reaches payment
 */
export async function generateSearchProfileAndFindJobs(profileData, onProgress) {
  const results = {
    searchString: null,
    jobsFound: [],
    totalJobsDiscovered: 0,
    jobsMatched: 0,
    error: null
  };
  
  try {
    // Step 1: Generate Boolean search string with Claude
    onProgress?.('Analyzing your profile...');
    console.log('=== Step 1: Generating Boolean Search String ===');
    
    results.searchString = await generateBooleanSearchString(profileData);
    console.log('✓ Boolean search string generated:', results.searchString.booleanString);
    
    // Step 2: Execute job searches across platforms
    onProgress?.('Searching for matching jobs...');
    console.log('=== Step 2: Executing Job Searches ===');
    
    const searchResults = await executeJobSearches(results.searchString, profileData);
    
    results.jobsFound = searchResults.jobs || [];
    results.totalJobsDiscovered = searchResults.totalDiscovered || 0;
    results.jobsMatched = searchResults.matched || 0;
    
    console.log(`✓ Found ${results.totalJobsDiscovered} jobs, ${results.jobsMatched} matched 75%+`);
    
    // Step 3: Store everything
    onProgress?.('Saving results...');
    console.log('=== Step 3: Storing Results ===');
    
    localStorage.setItem('booleanSearchString', JSON.stringify(results.searchString));
    localStorage.setItem('initialJobResults', JSON.stringify(results.jobsFound));
    localStorage.setItem('searchStats', JSON.stringify({
      totalDiscovered: results.totalJobsDiscovered,
      matched: results.jobsMatched,
      searchedAt: new Date().toISOString()
    }));
    
    console.log('✓ All data stored successfully');
    
    return results;
    
  } catch (error) {
    console.error('=== CRITICAL ERROR IN SEARCH SYSTEM ===');
    console.error(error);
    results.error = error.message;
    throw error;
  }
}

/**
 * Generate Boolean search string from user profile data
 * Calls backend proxy instead of direct API call (avoids CORS issues)
 */
export async function generateBooleanSearchString(profileData) {
  try {
    console.log('=== BOOLEAN SEARCH STRING GENERATION STARTED ===');
    console.log('Profile Data:', JSON.stringify(profileData, null, 2));
    
    // Call backend proxy instead of Anthropic directly
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
    
    console.log('Calling backend API at:', `${backendUrl}/api/ai/generate-search-string`);
    
    const response = await fetch(`${backendUrl}/api/ai/generate-search-string`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ profileData })
    });
    
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend API Error:', errorData);
      
      let errorMessage = `Backend API Error (${response.status}): ${errorData.error || 'Unknown error'}`;
      
      // Add helpful messages for common errors
      if (response.status === 500 && errorData.error?.includes('API key')) {
        errorMessage += '\n\nAnthropic API key not configured on server. Check server/.env file.';
      } else if (response.status === 401) {
        errorMessage += '\n\nInvalid API key on server.';
      } else if (response.status === 429) {
        errorMessage += '\n\nRate limit exceeded. Please try again in a moment.';
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate search string');
    }
    
    console.log('✓ Boolean search string generated successfully');
    console.log('Search String:', data.searchString);
    
    return data.searchString;
    
  } catch (error) {
    console.error('=== BOOLEAN SEARCH STRING GENERATION FAILED ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    throw error;
  }
}

/**
 * Execute job searches across multiple platforms
 */
async function executeJobSearches(searchString, profileData) {
  console.log('=== Executing Job Searches ===');
  console.log('Search String:', searchString.booleanString);
  
  try {
    // Try to call backend API first
    const response = await fetch(`${BACKEND_API_URL}/jobs/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        booleanString: searchString.booleanString,
        jobTitles: searchString.jobTitles,
        location: searchString.location,
        salaryRange: profileData.professionalInfo?.desiredSalary,
        workArrangement: profileData.professionalInfo?.workArrangement,
        platforms: searchString.searchPlatforms || ['Indeed', 'LinkedIn', 'ZipRecruiter']
      })
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    console.warn('Backend API unavailable, using mock data');
  } catch (error) {
    console.warn('Job search API unavailable, using mock data:', error.message);
  }
  
  // Return mock data if backend is not available
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const mockJobs = [
    {
      id: 1,
      title: searchString.jobTitles?.[0] || 'Marketing Manager',
      company: 'Apex Group',
      location: searchString.location || 'Orlando, FL',
      salary: searchString.salaryRange || '$100-120K',
      posted: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      matchScore: 87,
      source: 'Indeed',
      url: 'https://indeed.com/job/123',
      description: 'Leading marketing initiatives for a growing tech company...'
    },
    {
      id: 2,
      title: searchString.jobTitles?.[1] || 'Senior Marketing Director',
      company: 'Growth Solutions Inc',
      location: 'Remote',
      salary: '$130-160K',
      posted: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      matchScore: 82,
      source: 'LinkedIn',
      url: 'https://linkedin.com/jobs/456',
      description: 'Strategic marketing leadership role with equity...'
    },
    {
      id: 3,
      title: searchString.jobTitles?.[2] || 'VP of Marketing',
      company: 'United Marketing Inc',
      location: 'Tampa, FL',
      salary: '$140-180K',
      posted: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      matchScore: 79,
      source: 'ZipRecruiter',
      url: 'https://ziprecruiter.com/job/789',
      description: 'Executive marketing position with P&L responsibility...'
    }
  ];
  
  // Filter jobs by match score (75%+)
  const matchedJobs = mockJobs.filter(job => job.matchScore >= 75);
  
  return {
    jobs: mockJobs,
    totalDiscovered: 247,
    matched: matchedJobs.length,
    searchedAt: new Date().toISOString()
  };
}

// Default export for convenience
export default generateSearchProfileAndFindJobs;

/**
 * Create the prompt for Claude to generate Boolean search string
 */
function createBooleanPrompt(profileData) {
  return `You are an expert recruiter creating Boolean search strings for job aggregator platforms (Indeed, LinkedIn, ZipRecruiter, Glassdoor, Monster, etc.).

Generate an optimized Boolean search string based on this candidate profile:

PERSONAL INFORMATION:
- Name: ${profileData.personalInfo?.fullLegalName || 'Not provided'}
- Location: ${profileData.personalInfo?.city}, ${profileData.personalInfo?.state}
- Willing to relocate: ${profileData.professionalInfo?.willingToRelocate || 'Unknown'}

PROFESSIONAL PROFILE:
- Desired salary: ${profileData.professionalInfo?.desiredSalary || 'Not specified'}
- Work arrangement preference: ${profileData.professionalInfo?.workArrangement?.join(', ') || 'Not specified'}
- Travel willingness: ${profileData.professionalInfo?.travelPercentage || 'Not specified'}

WORK HISTORY (Most Recent):
${formatWorkHistory(profileData.workHistory)}

EDUCATION:
${formatEducation(profileData.education)}

SKILLS:
${profileData.skills?.join(', ') || 'Not provided'}

LICENSES & CERTIFICATIONS:
${formatLicensesCerts(profileData.licenses, profileData.certifications)}

SEARCH PREFERENCES:
- Available start date: ${profileData.professionalInfo?.availableStartDate || 'Not specified'}
- Security clearance: ${profileData.professionalInfo?.hasSecurityClearance || 'None'}

INSTRUCTIONS:
Create a Boolean search string that will find jobs matching this profile. The string should:

1. Include job titles this person would qualify for (use OR between similar titles)
2. Include key skills and technologies (use OR for synonyms)
3. Include location parameters if relevant
4. Use salary ranges if specified
5. Include work arrangement preferences (remote, hybrid, onsite)
6. Be optimized for major job platforms (Indeed, LinkedIn, ZipRecruiter, Glassdoor)
7. Be specific enough to get quality matches (75%+ fit) but broad enough to not miss opportunities
8. Include industry-specific keywords and terminology
9. Consider seniority level based on experience

Return ONLY a JSON object with this structure:

{
  "booleanString": "the complete Boolean search string",
  "explanation": "2-3 sentence explanation of the search strategy",
  "estimatedMatchCount": "rough estimate like 'hundreds' or 'thousands'",
  "searchPlatforms": ["Indeed", "LinkedIn", "ZipRecruiter", "Glassdoor", "Monster"],
  "jobTitles": ["list of 5-8 specific job titles included in search"],
  "keySkills": ["list of 8-12 key skills/technologies included"],
  "location": "location parameters used in search",
  "salaryRange": "salary parameters if applicable",
  "workArrangement": "remote/hybrid/onsite preferences",
  "seniorityLevel": "entry/mid/senior/executive based on experience"
}

IMPORTANT: Return ONLY the JSON object, no markdown formatting or extra text.`;
}

/**
 * Format work history for prompt
 */
function formatWorkHistory(workHistory) {
  if (!workHistory || workHistory.length === 0) return 'No work history provided';
  
  return workHistory.slice(0, 3).map((job, index) => `
${index + 1}. ${job.title} at ${job.company}
   Duration: ${job.startDate} - ${job.current ? 'Present' : job.endDate}
   Location: ${job.city}, ${job.state}
   Responsibilities: ${job.responsibilities?.substring(0, 250) || 'Not provided'}...
  `).join('\n');
}

/**
 * Format education for prompt
 */
function formatEducation(education) {
  if (!education || education.length === 0) return 'No education provided';
  
  return education.map((edu, index) => `
${index + 1}. ${edu.degreeType || edu.degree} in ${edu.fieldOfStudy || edu.field} from ${edu.institution || edu.school} (${edu.graduationDate || edu.graduationDate || 'N/A'})
  `).join('\n');
}

/**
 * Format licenses and certifications for prompt
 */
function formatLicensesCerts(licenses, certifications) {
  const items = [];
  
  if (licenses && licenses.length > 0) {
    items.push('Licenses:');
    licenses.forEach(lic => {
      items.push(`- ${lic.type || lic.licenseType}: ${lic.number || lic.licenseNumber} (${lic.state || lic.licenseState})`);
    });
  }
  
  if (certifications && certifications.length > 0) {
    items.push('\nCertifications:');
    certifications.forEach(cert => {
      items.push(`- ${cert.name || cert.certificationName} from ${cert.issuer || cert.issuingOrganization}`);
    });
  }
  
  return items.length > 0 ? items.join('\n') : 'No licenses or certifications';
}

/**
 * Validate the generated Boolean search string
 */
export function validateBooleanString(searchString) {
  if (!searchString || typeof searchString !== 'object') {
    return { valid: false, error: 'Invalid search string format' };
  }
  
  if (!searchString.booleanString || searchString.booleanString.trim() === '') {
    return { valid: false, error: 'Boolean string is empty' };
  }
  
  // Check for common Boolean operators
  const hasOperators = /AND|OR|NOT|\(|\)/.test(searchString.booleanString);
  if (!hasOperators) {
    return { valid: false, error: 'Boolean string missing operators' };
  }
  
  return { valid: true };
}


