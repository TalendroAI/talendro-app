# Affinda Resume Parsing Debug Information

## Overview
We're experiencing resume parsing failures in our Talendro application. The parsing works intermittently and we're getting various errors. Below is all the relevant code and configuration information.

## Current Error
```
Proxy error: Could not proxy request /api/resume/parse from localhost:3000 to http://localhost:5001.
ECONNREFUSED
```

## Frontend Code (React)

### File: client/src/app/Onb2.js
```javascript
import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Onb2() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const jumped = useRef(false);

  const parseAndGo = useCallback(async () => {
    if (!file || jumped.current) return;
    try {
      setBusy(true); setError('');

      const fd = new FormData();
      fd.append('file', file, file.name);

      const resp = await fetch('/api/resume/parse', { method: 'POST', body: fd });
      if (!resp.ok) {
        const t = await resp.text().catch(()=>'');
        throw new Error(`Parse failed: ${resp.status} ${t}`);
      }
      const result = await resp.json();

      // Accept either { success:true, data:{...} } or the flat shape we used earlier
      const successLike = result?.success === true || result?.status === 'complete';
      if (!successLike) throw new Error('Parser did not report success/complete');

      const payload = result?.data?.prefill
        ? result.data
        : {
            jobId: result.jobId ?? result.data?.jobId,
            status: result.status ?? result.data?.status,
            prefill: result.prefill ?? result.data?.prefill ?? {},
            profileDraft: result.profileDraft ?? result.data?.profileDraft ?? {},
            confidence: result.confidence ?? result.data?.confidence ?? {}
          };

      // Persist for Steps 3–6
      localStorage.setItem('resumeData', JSON.stringify(payload));
      localStorage.setItem('resumeParsed', 'true');

      // Jump immediately to Step 1 (Registration) after resume upload
      jumped.current = true;
      try { navigate('/app/onboarding/step-1', { replace: true }); }
      catch { window.location.replace('/app/onboarding/step-1'); }

    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, [file, navigate]);

  // ... rest of component
}
```

### Frontend Configuration
**File: client/package.json**
```json
{
  "proxy": "http://localhost:5001",
  "scripts": {
    "start": "PORT=3000 react-scripts start"
  }
}
```

## Backend Code (Node.js/Express)

### File: server/routes/parse.js
```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AffindaAPI, AffindaAPIConfiguration } = require('@affinda/api');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Affinda API configuration
const affindaConfig = new AffindaAPIConfiguration({
  apiKey: process.env.AFFINDA_API_KEY,
});

const affindaClient = new AffindaAPI(affindaConfig);

router.post('/parse', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File uploaded:', req.file.filename);
    console.log('File path:', req.file.path);

    // Read the file
    const fileBuffer = fs.readFileSync(req.file.path);
    
    // Create document in Affinda
    const document = await affindaClient.createDocument({
      file: fileBuffer,
      fileName: req.file.originalname,
      collection: process.env.AFFINDA_COLLECTION_ID
    });

    console.log('Document created:', document.identifier);

    // Wait for processing
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max wait
    let processedDocument;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      try {
        processedDocument = await affindaClient.getDocument(document.identifier);
        console.log(`Attempt ${attempts + 1}: Status - ${processedDocument.meta?.workspaceId}`);
        
        if (processedDocument.meta?.workspaceId) {
          break;
        }
      } catch (err) {
        console.log(`Attempt ${attempts + 1} failed:`, err.message);
      }
      
      attempts++;
    }

    if (!processedDocument || !processedDocument.meta?.workspaceId) {
      throw new Error('Document processing timeout');
    }

    // Extract resume data
    const resumeData = processedDocument.data;
    
    // Transform data for our application
    const transformedData = {
      success: true,
      data: {
        prefill: {
          step3: {
            fullLegalName: resumeData.names?.[0]?.raw || '',
            preferredFirstName: resumeData.names?.[0]?.first || '',
            email: resumeData.emails?.[0]?.value || '',
            phone: resumeData.phoneNumbers?.[0]?.raw || '',
            linkedinUrl: resumeData.websites?.find(w => w.url?.includes('linkedin'))?.url || '',
            website: resumeData.websites?.find(w => !w.url?.includes('linkedin'))?.url || '',
            streetAddress: resumeData.addresses?.[0]?.raw || '',
            city: resumeData.addresses?.[0]?.city || '',
            stateRegion: resumeData.addresses?.[0]?.state || '',
            postalCode: resumeData.addresses?.[0]?.postalCode || '',
            country: resumeData.addresses?.[0]?.country || '',
            ssnLast4: '',
            dateOfBirth: resumeData.dateOfBirth || '',
            driversLicenseNumber: '',
            driversLicenseState: '',
            currentEmployer: resumeData.workExperience?.[0]?.organization || '',
            currentJobTitle: resumeData.workExperience?.[0]?.jobTitle || '',
            yearsExperience: calculateYearsExperience(resumeData.workExperience),
            workAuthorization: '',
            visaStatus: '',
            securityClearance: '',
            willingToRelocate: '',
            willingToTravel: '',
            veteranStatus: '',
            gender: '',
            hispanicLatino: '',
            race: '',
            disabilityDisclosure: '',
            highestDegree: resumeData.education?.[0]?.accreditation?.education || '',
            institutionName: resumeData.education?.[0]?.organization || '',
            institutionCity: resumeData.education?.[0]?.location?.city || '',
            institutionState: resumeData.education?.[0]?.location?.state || '',
            majorFieldOfStudy: resumeData.education?.[0]?.accreditation?.inputStr || '',
            datesAttendedStart: resumeData.education?.[0]?.dates?.startDate || '',
            datesAttendedEnd: resumeData.education?.[0]?.dates?.completionDate || '',
            graduationDate: resumeData.education?.[0]?.dates?.completionDate || '',
            earliestStartDate: '',
            workArrangement: '',
            employmentType: ''
          }
        },
        profileDraft: {
          // Additional profile data
        },
        confidence: {
          // Confidence scores for parsed data
        }
      }
    };

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json(transformedData);

  } catch (error) {
    console.error('Parse error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to parse resume', 
      message: error.message 
    });
  }
});

function calculateYearsExperience(workExperience) {
  if (!workExperience || workExperience.length === 0) return '0';
  
  const totalMonths = workExperience.reduce((total, job) => {
    const startDate = new Date(job.dates?.startDate);
    const endDate = job.dates?.endDate ? new Date(job.dates.endDate) : new Date();
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth());
    return total + Math.max(0, months);
  }, 0);
  
  return Math.round(totalMonths / 12).toString();
}

module.exports = router;
```

### File: server/vendor/affindaAdapter.js
```javascript
const { AffindaAPI, AffindaAPIConfiguration } = require('@affinda/api');

class AffindaAdapter {
  constructor(apiKey, collectionId) {
    this.config = new AffindaAPIConfiguration({
      apiKey: apiKey,
    });
    this.client = new AffindaAPI(this.config);
    this.collectionId = collectionId;
  }

  async parseResume(fileBuffer, fileName) {
    try {
      // Create document
      const document = await this.client.createDocument({
        file: fileBuffer,
        fileName: fileName,
        collection: this.collectionId
      });

      // Wait for processing
      return await this.waitForProcessing(document.identifier);
    } catch (error) {
      throw new Error(`Affinda parsing failed: ${error.message}`);
    }
  }

  async waitForProcessing(documentId, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      try {
        const document = await this.client.getDocument(documentId);
        if (document.meta?.workspaceId) {
          return document;
        }
      } catch (error) {
        console.log(`Processing attempt ${i + 1} failed:`, error.message);
      }
    }
    
    throw new Error('Document processing timeout');
  }
}

module.exports = AffindaAdapter;
```

## Environment Configuration

### Required Environment Variables
```bash
AFFINDA_API_KEY=your_affinda_api_key_here
AFFINDA_COLLECTION_ID=your_collection_id_here
```

### Backend Package Dependencies
```json
{
  "dependencies": {
    "@affinda/api": "^1.0.0",
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5"
  }
}
```

## Server Configuration

### File: server/index.js
```javascript
const express = require('express');
const cors = require('cors');
const parseRoutes = require('./routes/parse');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/resume', parseRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Error Patterns Observed

1. **ECONNREFUSED**: Backend server not running on port 5001
2. **Parse failed: 500**: Internal server errors during processing
3. **Document processing timeout**: Affinda processing taking too long
4. **Invalid file type**: File format validation issues
5. **No file uploaded**: Missing file in request

## Test Files Used
- PDF resumes (various formats)
- DOC/DOCX files
- TXT files

## Questions for Affinda
1. Are there any known issues with the current API version?
2. What's the recommended timeout for document processing?
3. Are there any rate limiting considerations?
4. Should we implement retry logic differently?
5. Are there any specific error codes we should handle?

## Contact Information
- Application: Talendro Resume Parsing
- Environment: Development
- Frontend: React (localhost:3000)
- Backend: Node.js/Express (localhost:5001)
- Affinda API Version: Latest

Please let us know if you need any additional information or logs.







