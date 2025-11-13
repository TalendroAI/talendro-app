# Complete Tech Stack: Resume Parsing & Subscriber Profile Population

This document details every technology, library, service, and tool used in the Talendro resume parsing and profile population system.

---

## 🏗️ Architecture Overview

**Primary Strategy**: Hybrid parsing with intelligent fallback
- **Primary**: Claude AI (Anthropic) API for intelligent parsing
- **Fallback**: Local regex-based parser
- **Legacy Support**: Affinda API (commented out but available)

**Data Flow**:
1. File Upload → Text Extraction → AI/Regex Parsing → Data Mapping → Profile Population

---

## 📦 Core Dependencies

### Backend (Node.js/Express)

#### **File Upload & Handling**
- **`multer`** (v1.4.5-lts.1)
  - Multipart form-data parsing
  - Memory storage for file buffers
  - File size limits (10MB)
  - MIME type validation

- **`form-data`** (v4.0.0)
  - FormData construction for API requests
  - File blob handling

#### **Text Extraction Libraries**

1. **`pdf-parse-new`** (v1.4.1)
   - PDF text extraction
   - Handles text-layer PDFs
   - Used by: Claude adapter, local parser

2. **`mammoth`** (v1.11.0)
   - DOCX to text/HTML conversion
   - Preserves document structure
   - Handles Word formatting
   - Used by: Claude adapter, local parser, parsing gateway

3. **`textract`** (v2.5.0)
   - Universal text extraction
   - Handles DOC, RTF, TXT formats
   - Fallback for unusual file types
   - Used by: Local parser

#### **Data Validation & Schema**

- **`zod`** (v3.22.4)
  - Schema validation
  - JSON Resume structure enforcement
  - Type-safe data transformation

#### **HTTP & API Communication**

- **`axios`** (v1.6.0)
  - HTTP client for external API calls
  - Request/response handling

- **`node-fetch`** (v2.7.0)
  - Native fetch API for Node.js
  - Used by: Affinda adapter

- **`express`** (v4.19.2)
  - Web framework
  - Route handling
  - Middleware support

#### **Utilities**

- **`uuid`** (v10.0.0)
  - Unique ID generation for jobs/traces

- **`crypto`** (Node.js built-in)
  - Trace ID generation
  - Hash functions

- **`dotenv`** (v16.3.1)
  - Environment variable management
  - API key configuration

---

## 🤖 AI/ML Services

### **Primary: Claude AI (Anthropic)**

**Service**: Anthropic Claude API
- **API Endpoint**: `https://api.anthropic.com/v1/messages`
- **Model**: `claude-sonnet-4-20250514` (latest)
- **Previous Model**: `claude-3-5-sonnet-20241022`
- **Max Tokens**: 4096
- **API Key**: `CLAUDE_API_KEY` or `ANTHROPIC_API_KEY` (env var)

**Implementation**: `server/vendor/claudeAdapter.js`
- Text extraction from PDF/DOCX/DOC/TXT
- Intelligent resume parsing with structured JSON output
- Handles complex resume formats
- Extracts: personal info, work history, education, skills, certifications, references

**Features**:
- Structured JSON schema enforcement
- Handles nested data structures
- Extracts personal details, emergency contacts
- Parses residential history
- Identifies licenses and certifications

### **Legacy: Affinda API** (Available but not primary)

**Service**: Affinda Resume Parser API
- **API Endpoint**: `https://api.affinda.com/v3`
- **API Key**: `AFFINDA_API_KEY` (env var)
- **Organization ID**: `AFFINDA_ORG_ID` (env var)
- **Workspace ID**: `AFFINDA_WORKSPACE_ID` (env var)

**Implementation**: `server/vendor/affindaAdapter.js`
- Rate limiting (30 docs/minute)
- Exponential backoff retry logic
- Document type detection
- Resume-specific endpoint handling

**Status**: Currently commented out in favor of Claude, but code remains for fallback

---

## 🔧 Local Parsing Engine

### **Implementation**: `server/vendor/localParser.js`

**Text Extraction**:
- PDF: `pdf-parse-new`
- DOCX: `mammoth`
- DOC/TXT/RTF: `textract`

**Parsing Strategy**: Regex-based pattern matching
- Name extraction (first line heuristics)
- Email regex patterns
- Phone number patterns (US formats)
- Location extraction (City, State)
- LinkedIn URL extraction
- Skills section detection
- Education parsing (degree, institution, dates)
- Work experience parsing (company, title, dates, descriptions)

**Fallback Logic**:
- Used when Claude API is unavailable
- Used when Claude API fails (network errors, timeouts)
- Not used for authentication/credit errors

---

## 📊 Data Mapping & Transformation

### **Core Mapper**: `server/mappers/mapToProfileDraft.js`

**Purpose**: Converts raw parsed data (from any source) into standardized profile format

**Key Functions**:
- `mapToProfileDraft(raw)` - Main mapping function
- `extractBasics()` - Personal information extraction
- `extractEducation()` - Education history mapping
- `extractWork()` - Work experience mapping
- `buildStep1Prefill()` - Step 1 form prefill
- `buildStep3Prefill()` - Step 3 form prefill
- `buildStep5Education()` - Step 5 education summary
- `buildStep6Work()` - Step 6 work history

### **Transform Utilities**: `server/mappers/transforms.js`

**Functions**:
- `flattenValue()` - Recursive flattening of nested confidence objects
- `normalizeDate()` - Date format normalization (YYYY-MM-DD)
- `normalizePhone()` - Phone number formatting
- `normalizeLinkedIn()` - LinkedIn URL normalization
- `parseLocation()` - Location data extraction
- `parseCityStateFromText()` - City/State parsing from text
- `parseLocationFromHeader()` - Location from resume header
- `extractName()` - Enhanced name extraction
- `extractEmail()` - Email extraction with validation
- `extractSkills()` - Skills list extraction
- `extractWorkDescription()` - Work description/bullets extraction
- `extractEducationFields()` - Education field extraction
- `stripSectionHeaders()` - Clean section headers
- `coalesce()` - Value coalescing (first non-null)
- `safeTrim()` - Safe string trimming
- `dedupeStrings()` - String deduplication
- `isPresentLike()` - "Present" date detection

---

## 🗄️ Data Storage & State Management

### **Profile Draft Store**: `server/profileDraftStore.js`

**Functions**:
- `createJob()` - Create parsing job
- `setJobStatus()` - Update job status
- `getJob()` - Retrieve job by ID
- `getDraft()` - Get user's profile draft
- `saveDraft()` - Save profile draft

**Storage**: In-memory (can be extended to database)

---

## 🛡️ Security & Middleware

### **Format Protection**: `server/middleware/formatProtection.js`

**Purpose**: Ensures parsing files haven't been tampered with
- File integrity validation
- Format verification
- `formatProtectionMiddleware` - Express middleware
- `validateFormatIntegrity()` - Validation function

---

## 📡 API Routes

### **Parse Route**: `server/routes/parse.js`

**Endpoints**:
- `POST /api/resume/parse` - Main parsing endpoint
  - Accepts multipart/form-data
  - 90-second timeout
  - Trace ID generation
  - Job creation and tracking
  - Error handling with appropriate HTTP status codes

- `GET /api/resume/status/:jobId` - Job status check
- `GET /api/debug/env` - Environment/debug info
- `GET /api/profile/draft` - Retrieve saved draft
- `GET /api/resume/parser-info` - Parser configuration info

**Processing Flow**:
1. Validate multipart form data
2. Extract file buffer and metadata
3. Create parsing job
4. Try Claude API (if configured)
5. Fallback to local parser (if Claude fails or unavailable)
6. Map parsed data to profile format
7. Build prefill structures for each onboarding step
8. Save profile draft
9. Return response with summary, prefill, and profileDraft

---

## 🔄 Data Structures

### **Input Format**
- **File Types**: PDF, DOCX, DOC, RTF, TXT
- **Max Size**: 10MB
- **Upload Method**: multipart/form-data

### **Output Format**

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "status": "complete",
    "summary": {
      "name": "...",
      "email": "...",
      "phone": "...",
      "location": "...",
      "skills": [...],
      "education": [...],
      "workExperience": [...]
    },
    "prefill": {
      "step1": {...},
      "step2": {...},
      "step3": {...},
      "step4": {...},
      "step5": [...],
      "step6": [...]
    },
    "profileDraft": {
      "basics": {...},
      "work": [...],
      "education": [...],
      "skills": [...],
      "keywords": [],
      "currentJobTitle": "..."
    },
    "confidence": 0.95
  },
  "metadata": {
    "parserUsed": "claude" | "local" | "local-fallback",
    "processingTime": 1234,
    "traceId": "...",
    "timestamp": "..."
  }
}
```

### **Profile Draft Schema**

**Basics**:
- name, email, phone
- location: { city, region, postalCode, country }
- linkedin

**Work Experience**:
- companyName, jobTitle
- startDate, endDate, current
- description, location

**Education**:
- institutionName, majorFieldOfStudy
- highestDegree, gpa
- institutionCity, institutionState
- attendanceStartDate, graduationDate
- current

**Skills**:
- Array of { name, level, keywords }

---

## 🔍 Parsing Strategies

### **Claude AI Strategy**
1. Extract text from file (PDF/DOCX/DOC/TXT)
2. Send to Claude API with structured prompt
3. Receive JSON response with all fields
4. Map to profile format

### **Local Parser Strategy**
1. Extract text from file
2. Apply regex patterns for:
   - Name (first line heuristics)
   - Email (regex patterns)
   - Phone (US format patterns)
   - Location (City, State patterns)
   - LinkedIn (URL patterns)
   - Skills (section detection)
   - Education (degree, institution, dates)
   - Work (company, title, dates, bullets)

### **Fallback Logic**
- Claude unavailable → Use local immediately
- Claude network/timeout error → Fallback to local
- Claude auth/credit error → Return error (no fallback)
- Local parser failure → Return error

---

## 🧪 Testing & Debugging

### **Debug Endpoints**
- `/api/debug/env` - Check API key configuration
- `/api/resume/parser-info` - Parser mode and capabilities

### **Logging**
- Trace IDs for request tracking
- Processing time measurement
- Parser selection logging
- Error stack traces
- Field extraction logging

---

## 📋 Environment Variables

**Required**:
- `CLAUDE_API_KEY` or `ANTHROPIC_API_KEY` - Claude API key

**Optional** (for Affinda fallback):
- `AFFINDA_API_KEY` - Affinda API key
- `AFFINDA_ORG_ID` - Affinda organization ID
- `AFFINDA_WORKSPACE_ID` - Affinda workspace ID

---

## 🎯 Profile Population

### **Prefill Structure**

**Step 1** (Account Creation):
- fullLegalName, email, phone
- linkedinUrl, website
- city, stateRegion, country
- currentJobTitle, currentEmployer
- yearsExperience, coreSkills

**Step 2** (Core Identity):
- Personal identity fields
- Current address
- Professional identity
- Work authorization

**Step 3** (Personal Information):
- Contact information
- Sensitive personal information
- Education details
- Residential history (7 years)

**Step 4** (Professional Information):
- Employment preferences
- Legal/compliance questions
- Employment history (10 years)

**Step 5** (Disclosures):
- Education summary for review

**Step 6** (Employment History):
- Complete work history with all details

---

## 📈 Performance Characteristics

**Timeouts**:
- Request timeout: 90 seconds
- Claude API: Variable (typically 5-30 seconds)
- Local parser: < 5 seconds

**Rate Limits**:
- Affinda: 30 documents/minute
- Claude: Based on API tier

**File Size Limits**:
- Maximum: 10MB
- Recommended: < 5MB for faster processing

---

## 🔐 Security Considerations

1. **PII Handling**:
   - SSN redaction (last 4 only)
   - Server-side processing only
   - No client-side parsing

2. **File Validation**:
   - MIME type checking
   - File size limits
   - Format validation

3. **API Security**:
   - API keys in environment variables
   - No keys in code
   - Secure file handling

4. **Data Protection**:
   - Format integrity checks
   - Input sanitization
   - Error message sanitization

---

## 📚 Additional Resources

**Documentation Files**:
- `PARSING_SCHEMA_CANONICAL.md` - Schema documentation
- `DEVELOPER_QUICKSTART.md` - Quick start guide
- `affinda-debug-info.md` - Affinda debugging info

**Sample Data**:
- `SAMPLE_RESUME_DATA.json` - Example parsed output
- `Sample_Resumes/` - Test resume files

---

## 🎓 Summary

**Total Technologies**: ~20 core libraries + 2 external APIs

**Primary Stack**:
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **AI Service**: Claude (Anthropic)
- **Text Extraction**: pdf-parse-new, mammoth, textract
- **Validation**: Zod
- **File Handling**: Multer, FormData

**Key Strengths**:
- Intelligent AI parsing with reliable fallback
- Comprehensive data extraction
- Robust error handling
- Multi-format support
- Structured output for form prefill

**Areas for Enhancement**:
- Database persistence for profile drafts
- OCR support for scanned PDFs
- Additional AI provider fallbacks
- Enhanced skill extraction
- Better date parsing for international formats

