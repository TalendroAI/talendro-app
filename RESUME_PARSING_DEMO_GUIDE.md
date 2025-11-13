# Resume Parsing Demo Guide

This guide provides multiple ways to test and demonstrate the Talendro resume parsing and profile population system.

---

## 🎯 Quick Demo Options

### Option 1: Standalone HTML Demo Page (Recommended)

**File**: `RESUME_PARSING_DEMO.html`

**How to Use**:
1. Make sure your Talendro server is running (`npm run dev`)
2. Open `RESUME_PARSING_DEMO.html` in a web browser
3. Upload a resume file (PDF, DOCX, DOC, RTF, or TXT)
4. Click "Parse Resume"
5. View the extracted data in multiple tabs:
   - **Summary**: Key information extracted
   - **Form Prefill**: Data formatted for onboarding forms
   - **Profile Draft**: Complete profile structure
   - **Raw JSON**: Full API response

**Features**:
- Drag-and-drop file upload
- Real-time parsing status
- Beautiful, easy-to-read results display
- Shows exactly what data would populate the forms
- No coding required - just open and use!

**To Share**:
- Send the HTML file to anyone
- They just need to open it in a browser (with your server running)
- Or host it on a web server

---

### Option 2: Use the Built-in Onboarding Flow

**URL**: `http://localhost:3000/app/onboarding/welcome`

**Steps**:
1. Navigate to the welcome page
2. Click "Start Your Job Search"
3. Upload your resume on Step 2
4. Watch as it automatically navigates to Step 3 with pre-filled data
5. Review all onboarding steps to see populated fields

**What to Show**:
- Step 2: Resume upload interface
- Step 3: Personal Information (pre-filled from resume)
- Step 4: Professional Information
- Step 5: Disclosures
- Step 6: Employment History (pre-filled)

---

### Option 3: API Testing with cURL

Test the parsing API directly from the command line:

```bash
# Basic test
curl -X POST http://localhost:5001/api/resume/parse \
  -F "file=@/path/to/your/resume.pdf" \
  -H "Content-Type: multipart/form-data"

# Save response to file
curl -X POST http://localhost:5001/api/resume/parse \
  -F "file=@/path/to/your/resume.pdf" \
  -o response.json

# Pretty print JSON response
curl -X POST http://localhost:5001/api/resume/parse \
  -F "file=@/path/to/your/resume.pdf" | jq '.'
```

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
      "step3": {...},
      "step4": {...},
      "step5": [...],
      "step6": [...]
    },
    "profileDraft": {...}
  },
  "metadata": {
    "parserUsed": "claude",
    "processingTime": 1234,
    "traceId": "..."
  }
}
```

---

### Option 4: Postman/Insomnia Collection

**Endpoint**: `POST http://localhost:5001/api/resume/parse`

**Headers**:
- `Content-Type: multipart/form-data` (set automatically)

**Body**:
- Type: `form-data`
- Key: `file` (type: File)
- Value: Select your resume file

**Expected Response**: 200 OK with JSON containing parsed data

---

## 📋 What Gets Extracted

### Personal Information
- Full Legal Name
- Email Address
- Phone Number
- Location (City, State, Country)
- LinkedIn URL
- Personal Website

### Work Experience
- Company Name
- Job Title
- Start Date / End Date
- Location
- Responsibilities / Achievements
- Supervisor Information
- Salary Information

### Education
- Institution Name
- Degree Type
- Major/Field of Study
- GPA
- Graduation Date
- Institution Location

### Skills
- Technical Skills
- Professional Certifications
- Languages
- Software Proficiency

### Additional Data
- Residential History (7 years)
- Professional Licenses
- Certifications
- References
- Emergency Contact Information

---

## 🎬 Demo Script

### For Stakeholders/Non-Technical Users

1. **Introduction** (30 seconds)
   - "This is Talendro's intelligent resume parsing system"
   - "It automatically extracts information from resumes and populates our registration forms"

2. **Upload** (10 seconds)
   - Open the demo page or onboarding flow
   - Upload a sample resume
   - "Watch as we parse the resume in real-time"

3. **Show Results** (2 minutes)
   - **Summary Tab**: "Here's what we extracted - name, email, work history, education"
   - **Form Prefill Tab**: "This data automatically populates our onboarding forms"
   - **Profile Draft Tab**: "This is the complete profile structure we build"
   - Point out accuracy: "Notice how we correctly identified the job titles, dates, and responsibilities"

4. **Show Form Population** (1 minute)
   - Navigate to Step 3 of onboarding
   - Show pre-filled fields: "See how the form is already filled out"
   - Show work history: "All employment history is populated"
   - Show education: "Education section is complete"

5. **Highlight Features** (1 minute)
   - "Works with PDF, DOCX, DOC, RTF, and TXT formats"
   - "Uses AI to understand context, not just regex"
   - "Handles various resume formats and layouts"
   - "Falls back to local parsing if AI is unavailable"

---

## 🧪 Testing Checklist

### Before Demo
- [ ] Server is running (`npm run dev`)
- [ ] Claude API key is configured (or local parser is working)
- [ ] Test resume files are ready
- [ ] Demo page opens correctly
- [ ] API endpoint is accessible

### Test Cases
- [ ] PDF resume upload
- [ ] DOCX resume upload
- [ ] Resume with complex formatting
- [ ] Resume with multiple jobs
- [ ] Resume with education history
- [ ] Resume with skills section
- [ ] Resume with LinkedIn URL
- [ ] Resume with unusual layout
- [ ] Large file (near 10MB limit)
- [ ] Error handling (invalid file type)

### What to Verify
- [ ] Name is extracted correctly
- [ ] Email is found and formatted
- [ ] Phone number is parsed
- [ ] Work history dates are correct
- [ ] Job titles and companies are accurate
- [ ] Education details are complete
- [ ] Skills are extracted
- [ ] Form prefill data is structured correctly
- [ ] Profile draft contains all fields

---

## 🐛 Troubleshooting

### "Failed to parse resume"
- Check server is running
- Verify API endpoint URL is correct
- Check Claude API key is configured
- Review server logs for errors

### "No data extracted"
- Ensure resume has readable text (not scanned image)
- Try a different resume format
- Check file size (must be < 10MB)
- Verify file is not corrupted

### "Network error"
- Check server is accessible
- Verify CORS settings if accessing from different origin
- Check firewall/network restrictions

### Demo Page Not Working
- Ensure server is running on expected port
- Check browser console for errors
- Verify API_BASE URL in HTML matches your server
- Try accessing API directly with curl first

---

## 📊 Sample Test Resumes

Use these types of resumes to demonstrate capabilities:

1. **Standard Professional Resume**
   - Clear sections
   - Standard formatting
   - Multiple jobs
   - Education history

2. **Creative/Non-Standard Resume**
   - Unusual layout
   - Creative formatting
   - Tests parser flexibility

3. **Minimal Resume**
   - Basic information only
   - Tests fallback parsing

4. **Comprehensive Resume**
   - Extensive work history
   - Multiple degrees
   - Many skills
   - Certifications
   - Tests full extraction

---

## 🔗 Quick Links

- **Demo Page**: Open `RESUME_PARSING_DEMO.html` in browser
- **Onboarding Flow**: http://localhost:3000/app/onboarding/welcome
- **API Endpoint**: http://localhost:5001/api/resume/parse
- **API Status**: http://localhost:5001/api/debug/env
- **Parser Info**: http://localhost:5001/api/resume/parser-info

---

## 💡 Tips for Best Demo

1. **Use Real Resumes**: More impressive than test data
2. **Show Before/After**: Compare original resume to extracted data
3. **Highlight Accuracy**: Point out correctly parsed complex fields
4. **Show Speed**: Note how fast parsing completes (usually 5-30 seconds)
5. **Demonstrate Flexibility**: Try different resume formats
6. **Show Error Handling**: Upload invalid file to show graceful errors

---

## 📝 Notes for Sharing

When sharing the demo:

1. **Include Instructions**: Tell them to start the server first
2. **Provide Sample Resume**: Give them a test file to use
3. **Set Expectations**: Explain it may take 10-30 seconds to parse
4. **Explain Output**: Describe what each tab shows
5. **Highlight Value**: Emphasize time saved in form filling

---

## 🎯 Success Metrics to Highlight

- **Time Saved**: Manual form filling vs. automatic population
- **Accuracy**: How well we extract complex information
- **Coverage**: Percentage of form fields automatically filled
- **Reliability**: Works with various resume formats
- **User Experience**: Seamless, one-click process

---

**Ready to demo?** Open `RESUME_PARSING_DEMO.html` and upload a resume!

