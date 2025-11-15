/**
 * COMPLETE RESUME PARSER IMPLEMENTATION
 * This is production-ready code you can use in your Talendro application
 */

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    // Get your API key from https://console.anthropic.com
    ANTHROPIC_API_KEY: 'YOUR_API_KEY_HERE', // Replace with your actual key
    MODEL: 'claude-3-5-sonnet-20241022',
    MAX_TOKENS: 4096
};

// ============================================
// 1. FILE READING UTILITIES
// ============================================

/**
 * Read different file types and extract text
 */
class ResumeReader {
    
    /**
     * Main method to read any supported file type
     */
    async readFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        
        switch(extension) {
            case 'txt':
                return await this.readTextFile(file);
            case 'pdf':
                return await this.readPDFFile(file);
            case 'doc':
            case 'docx':
                return await this.readWordFile(file);
            default:
                throw new Error(`Unsupported file type: ${extension}`);
        }
    }
    
    /**
     * Read plain text files
     */
    async readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read text file'));
            reader.readAsText(file);
        });
    }
    
    /**
     * Read PDF files using PDF.js
     * You need to include: <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
     */
    async readPDFFile(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        
        return fullText;
    }
    
    /**
     * Read Word documents using mammoth.js
     * You need to include: <script src="https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js"></script>
     */
    async readWordFile(file) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    }
}

// ============================================
// 2. AI PARSING ENGINE
// ============================================

/**
 * Parse resume using Claude AI
 */
class AIResumeParser {
    
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    
    /**
     * Create the extraction prompt
     * Customize this based on your specific form fields
     */
    createPrompt(resumeText) {
        return `You are an expert resume parser. Extract ALL available information from this resume and return it as a JSON object.

RESUME TEXT:
${resumeText}

Extract and return ONLY a valid JSON object with this EXACT structure. If a field is not found, use empty string "" or empty array []:

{
    "personalInfo": {
        "fullLegalName": "",
        "preferredFirstName": "",
        "middleName": "",
        "maidenName": "",
        "previousNames": "",
        "email": "",
        "phone": "",
        "linkedinUrl": "",
        "personalWebsite": "",
        "streetAddress": "",
        "city": "",
        "state": "",
        "zipCode": "",
        "county": "",
        "country": "US",
        "dateOfBirth": "",
        "driversLicenseNumber": "",
        "driversLicenseState": ""
    },
    "emergencyContact": {
        "name": "",
        "relationship": "",
        "phone": "",
        "alternatePhone": ""
    },
    "professionalInfo": {
        "desiredSalary": "",
        "availableStartDate": "",
        "workArrangement": [],
        "willingToRelocate": "",
        "travelPercentage": "",
        "legallyAuthorized": "yes",
        "requiresSponsorship": "no",
        "nonCompete": "no",
        "criminalHistory": "no",
        "backgroundCheckConsent": "yes",
        "workRestrictions": "no"
    },
    "securityClearance": {
        "hasClearance": "no",
        "level": "",
        "grantDate": "",
        "expirationDate": ""
    },
    "workHistory": [
        {
            "company": "",
            "title": "",
            "startDate": "YYYY-MM",
            "endDate": "YYYY-MM or Present",
            "current": false,
            "city": "",
            "state": "",
            "reasonForLeaving": "",
            "responsibilities": ""
        }
    ],
    "education": [
        {
            "school": "",
            "degree": "",
            "field": "",
            "graduationDate": "YYYY-MM",
            "gpa": ""
        }
    ],
    "licenses": [
        {
            "type": "",
            "number": "",
            "state": "",
            "expirationDate": ""
        }
    ],
    "certifications": [
        {
            "name": "",
            "issuer": "",
            "dateEarned": "",
            "expirationDate": ""
        }
    ],
    "references": [
        {
            "name": "",
            "title": "",
            "company": "",
            "relationship": "",
            "email": "",
            "phone": "",
            "mayContact": "yes"
        }
    ],
    "skills": [],
    "residentialHistory": [
        {
            "streetAddress": "",
            "city": "",
            "state": "",
            "zipCode": "",
            "fromDate": "YYYY-MM",
            "toDate": "YYYY-MM or Present",
            "current": false
        }
    ]
}

IMPORTANT INSTRUCTIONS:
1. Return ONLY the JSON object, no other text before or after
2. Use exact field names as shown above
3. For names with middle initials or middle names (e.g., "K. Greg Jackson", "Gladys C. Jackson"):
   - fullLegalName should be the complete name exactly as written
   - preferredFirstName should be the FIRST name only (e.g., "Greg", "Gladys")
   - middleName should contain the middle initial or middle name (e.g., "K.", "C.", "Elizabeth")
   - NEVER include middle initials or middle names in preferredFirstName
4. For dates, use format YYYY-MM (e.g., "2020-01")
5. For current positions, set endDate to "Present" and current to true
6. Extract ALL work history going back 10 years if available
7. Extract ALL residential history going back 7 years if available
8. If information is not in resume, leave as empty string "" or empty array []
9. For phone numbers, try to format as (555) 123-4567
10. Infer information when possible (e.g., if someone lives in Orlando, county is likely Orange)

Return the JSON now:`;
    }
    
    /**
     * Call Claude API to parse the resume
     */
    async parse(resumeText) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                max_tokens: CONFIG.MAX_TOKENS,
                messages: [{
                    role: 'user',
                    content: this.createPrompt(resumeText)
                }]
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`API Error: ${error.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        const jsonText = data.content[0].text;
        
        // Clean up the response (remove markdown code blocks if present)
        const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        try {
            return JSON.parse(cleanJson);
        } catch (e) {
            console.error('Failed to parse JSON:', cleanJson);
            throw new Error('Invalid JSON response from AI');
        }
    }
}

// ============================================
// 3. FORM FILLING ENGINE
// ============================================

/**
 * Map parsed data to form fields and fill them
 */
class FormFiller {
    
    /**
     * Fill Step 1: Account Creation
     */
    fillAccountForm(data) {
        // Use preferredFirstName if available, otherwise extract first name from full name
        const firstName = data.personalInfo.preferredFirstName || 
                         data.personalInfo.fullLegalName.split(' ')[0] || '';
        
        // Extract last name (everything after first name, excluding middle name if present)
        let lastName = '';
        if (data.personalInfo.fullLegalName) {
            const nameParts = data.personalInfo.fullLegalName.split(' ');
            // If we have a middle name, skip it and get the rest
            if (nameParts.length > 2) {
                lastName = nameParts.slice(2).join(' '); // Skip first and middle
            } else if (nameParts.length === 2) {
                lastName = nameParts[1];
            }
        }
        
        this.setField('firstName', firstName);
        this.setField('lastName', lastName);
        this.setField('email', data.personalInfo.email);
        this.setField('phone', data.personalInfo.phone);
    }
    
    /**
     * Fill Step 2: Personal Information
     */
    fillPersonalInfoForm(data) {
        // Contact Information
        this.setField('fullLegalName', data.personalInfo.fullLegalName);
        
        // Use preferredFirstName from parsed data, or extract first name only
        const preferredFirstName = data.personalInfo.preferredFirstName || 
                                   (data.personalInfo.fullLegalName ? 
                                    data.personalInfo.fullLegalName.split(' ')[0] : '');
        this.setField('preferredFirstName', preferredFirstName);
        
        this.setField('maidenName', data.personalInfo.maidenName);
        this.setField('previousNames', data.personalInfo.previousNames);
        this.setField('email', data.personalInfo.email);
        this.setField('phone', data.personalInfo.phone);
        this.setField('linkedinUrl', data.personalInfo.linkedinUrl);
        this.setField('website', data.personalInfo.personalWebsite);
        
        // Current Address
        this.setField('streetAddress', data.personalInfo.streetAddress);
        this.setField('city', data.personalInfo.city);
        this.setField('state', data.personalInfo.state);
        this.setField('postalCode', data.personalInfo.zipCode);
        this.setField('county', data.personalInfo.county);
        this.setField('country', data.personalInfo.country);
        
        // Emergency Contact
        this.setField('emergencyName', data.emergencyContact.name);
        this.setField('emergencyRelationship', data.emergencyContact.relationship);
        this.setField('emergencyPhone', data.emergencyContact.phone);
        this.setField('emergencyPhoneAlt', data.emergencyContact.alternatePhone);
        
        // Sensitive Information
        this.setField('dlNumber', data.personalInfo.driversLicenseNumber);
        this.setField('dlState', data.personalInfo.driversLicenseState);
        this.setField('dateOfBirth', data.personalInfo.dateOfBirth);
        
        // Residential History
        this.fillResidentialHistory(data.residentialHistory);
    }
    
    /**
     * Fill Step 3: Professional Information
     */
    fillProfessionalForm(data) {
        // Job Search Preferences
        this.setField('desiredSalary', data.professionalInfo.desiredSalary);
        this.setField('availableStartDate', data.professionalInfo.availableStartDate);
        this.setField('willingToRelocate', data.professionalInfo.willingToRelocate);
        this.setField('travelPercentage', data.professionalInfo.travelPercentage);
        
        // Work arrangement checkboxes
        data.professionalInfo.workArrangement.forEach(arrangement => {
            const checkbox = document.querySelector(`input[name="workArrangement"][value="${arrangement}"]`);
            if (checkbox) checkbox.checked = true;
        });
        
        // Legal & Compliance
        this.setField('legallyAuthorized', data.professionalInfo.legallyAuthorized);
        this.setField('requiresSponsorship', data.professionalInfo.requiresSponsorship);
        this.setField('nonCompeteAgreement', data.professionalInfo.nonCompete);
        this.setField('criminalHistory', data.professionalInfo.criminalHistory);
        this.setField('backgroundCheckConsent', data.professionalInfo.backgroundCheckConsent);
        this.setField('workRestrictions', data.professionalInfo.workRestrictions);
        
        // Security Clearance
        this.setField('hasSecurityClearance', data.securityClearance.hasClearance);
        this.setField('clearanceLevel', data.securityClearance.level);
        this.setField('clearanceGrantDate', data.securityClearance.grantDate);
        this.setField('clearanceExpDate', data.securityClearance.expirationDate);
        
        // Dynamic Collections
        this.fillLicenses(data.licenses);
        this.fillCertifications(data.certifications);
        this.fillReferences(data.references);
        this.fillEmploymentHistory(data.workHistory);
    }
    
    /**
     * Fill residential history (dynamic collection)
     */
    fillResidentialHistory(residences) {
        residences.forEach((residence, index) => {
            if (typeof addResidence === 'function') {
                addResidence(); // Call the form's add function
            }
            const i = index + 1;
            this.setField(`res${i}_street`, residence.streetAddress);
            this.setField(`res${i}_city`, residence.city);
            this.setField(`res${i}_state`, residence.state);
            this.setField(`res${i}_zip`, residence.zipCode);
            this.setField(`res${i}_from`, residence.fromDate);
            if (residence.current) {
                const checkbox = document.getElementById(`res${i}_current`);
                if (checkbox) checkbox.checked = true;
            } else {
                this.setField(`res${i}_to`, residence.toDate);
            }
        });
    }
    
    /**
     * Fill employment history (dynamic collection)
     */
    fillEmploymentHistory(jobs) {
        jobs.forEach((job, index) => {
            if (typeof addEmployment === 'function') {
                addEmployment(); // Call the form's add function
            }
            const i = index + 1;
            this.setField(`emp${i}_company`, job.company);
            this.setField(`emp${i}_title`, job.title);
            this.setField(`emp${i}_start`, job.startDate);
            this.setField(`emp${i}_city`, job.city);
            this.setField(`emp${i}_state`, job.state);
            this.setField(`emp${i}_reason`, job.reasonForLeaving);
            this.setField(`emp${i}_responsibilities`, job.responsibilities);
            
            if (job.current) {
                const checkbox = document.getElementById(`emp${i}_current`);
                if (checkbox) checkbox.checked = true;
            } else {
                this.setField(`emp${i}_end`, job.endDate);
            }
        });
    }
    
    /**
     * Fill licenses (dynamic collection)
     */
    fillLicenses(licenses) {
        licenses.forEach((license, index) => {
            if (typeof addLicense === 'function') {
                addLicense();
            }
            const i = index + 1;
            this.setField(`lic${i}_type`, license.type);
            this.setField(`lic${i}_number`, license.number);
            this.setField(`lic${i}_state`, license.state);
            this.setField(`lic${i}_exp`, license.expirationDate);
        });
    }
    
    /**
     * Fill certifications (dynamic collection)
     */
    fillCertifications(certs) {
        certs.forEach((cert, index) => {
            if (typeof addCertification === 'function') {
                addCertification();
            }
            const i = index + 1;
            this.setField(`cert${i}_name`, cert.name);
            this.setField(`cert${i}_issuer`, cert.issuer);
            this.setField(`cert${i}_date`, cert.dateEarned);
            this.setField(`cert${i}_exp`, cert.expirationDate);
        });
    }
    
    /**
     * Fill references (dynamic collection)
     */
    fillReferences(refs) {
        refs.forEach((ref, index) => {
            if (typeof addReference === 'function') {
                addReference();
            }
            const i = index + 1;
            this.setField(`ref${i}_name`, ref.name);
            this.setField(`ref${i}_title`, ref.title);
            this.setField(`ref${i}_company`, ref.company);
            this.setField(`ref${i}_relationship`, ref.relationship);
            this.setField(`ref${i}_email`, ref.email);
            this.setField(`ref${i}_phone`, ref.phone);
            this.setField(`ref${i}_contact`, ref.mayContact);
        });
    }
    
    /**
     * Helper method to set a field value and mark it as filled
     */
    setField(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field && value) {
            field.value = value;
            field.classList.add('filled'); // Your form's CSS class for filled fields
            
            // Trigger change event for any listeners
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}

// ============================================
// 4. MAIN ORCHESTRATOR
// ============================================

/**
 * Main class that coordinates the entire parsing process
 */
class ResumeParsingOrchestrator {
    
    constructor(apiKey) {
        this.reader = new ResumeReader();
        this.parser = new AIResumeParser(apiKey);
        this.filler = new FormFiller();
    }
    
    /**
     * Process a resume file from start to finish
     */
    async processResume(file, onProgress) {
        try {
            // Step 1: Read the file
            onProgress?.('Reading resume file...');
            const text = await this.reader.readFile(file);
            
            // Step 2: Parse with AI
            onProgress?.('Parsing resume with AI...');
            const parsedData = await this.parser.parse(text);
            
            // Step 3: Store the data
            onProgress?.('Storing parsed data...');
            localStorage.setItem('resumeData', JSON.stringify(parsedData));
            
            // Step 4: Fill current form if on a form page
            onProgress?.('Auto-filling form fields...');
            this.autoFillCurrentPage(parsedData);
            
            onProgress?.('Complete!');
            
            return parsedData;
            
        } catch (error) {
            console.error('Resume processing error:', error);
            throw error;
        }
    }
    
    /**
     * Auto-fill the current page based on URL
     */
    autoFillCurrentPage(data) {
        const path = window.location.pathname;
        
        if (path.includes('step-1') || path.includes('account')) {
            this.filler.fillAccountForm(data);
        } else if (path.includes('step-2') || path.includes('personal')) {
            this.filler.fillPersonalInfoForm(data);
        } else if (path.includes('step-3') || path.includes('professional')) {
            this.filler.fillProfessionalForm(data);
        }
    }
    
    /**
     * Get stored resume data
     */
    getStoredData() {
        const data = localStorage.getItem('resumeData');
        return data ? JSON.parse(data) : null;
    }
}

// ============================================
// 5. USAGE EXAMPLES
// ============================================

/**
 * Example 1: Simple usage in your upload page
 */
async function handleResumeUpload(file) {
    // Initialize the orchestrator with your API key
    const orchestrator = new ResumeParsingOrchestrator(CONFIG.ANTHROPIC_API_KEY);
    
    try {
        // Process the resume
        const parsedData = await orchestrator.processResume(file, (status) => {
            console.log(status);
            // Update UI with status
            document.getElementById('status').textContent = status;
        });
        
        // Success!
        console.log('Parsed data:', parsedData);
        alert('Resume parsed successfully! Forms will be auto-filled.');
        
        // Navigate to first form page
        window.location.href = '/onboarding/step-1';
        
    } catch (error) {
        console.error('Error:', error);
        alert(`Failed to parse resume: ${error.message}`);
    }
}

/**
 * Example 2: Auto-fill on page load
 */
window.addEventListener('load', () => {
    const orchestrator = new ResumeParsingOrchestrator(CONFIG.ANTHROPIC_API_KEY);
    const storedData = orchestrator.getStoredData();
    
    if (storedData) {
        // Auto-fill the current page
        orchestrator.autoFillCurrentPage(storedData);
        console.log('Form auto-filled from resume data');
    }
});

/**
 * Example 3: Manual form filling
 */
function manuallyFillForm() {
    const orchestrator = new ResumeParsingOrchestrator(CONFIG.ANTHROPIC_API_KEY);
    const data = orchestrator.getStoredData();
    
    if (data) {
        orchestrator.filler.fillPersonalInfoForm(data);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ResumeReader,
        AIResumeParser,
        FormFiller,
        ResumeParsingOrchestrator
    };
}
