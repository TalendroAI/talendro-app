# 🚀 QUICK START GUIDE FOR DEVELOPER

## ⚡ GET RUNNING IN 5 MINUTES

### 1. Install & Start
```bash
# Install all dependencies
npm run install:all

# Start both servers
npm run dev
```

### 2. Access the Application
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001
- **Onboarding**: http://localhost:3000/app/onboarding/welcome

### 3. Test the Issue
1. Go to http://localhost:3000/app/onboarding/welcome
2. Click "Start Your Job Search"
3. Upload a resume (or use the sample data)
4. Navigate to "Personal Information" step
5. **ISSUE**: Education and work history sections are blank

---

## 🎯 THE EXACT PROBLEM

### What Works ✅
- Personal info fields (name, email, phone) populate
- Form validation (red highlighting) works
- Backend parsing works perfectly

### What's Broken ❌
- Education section stays blank
- Work history section stays blank
- Some personal fields may be missing

### The Data Structure
```javascript
// This data exists but doesn't populate in form
resumeData = {
  prefill: {
    step3: {
      fullLegalName: "K. Greg Jackson",
      email: "kgregjackson@gmail.com",
      // ... more fields
    }
  }
}
```

---

## 🔧 FILES TO FOCUS ON

### Primary Target
**`/client/src/components/FormRendererComprehensive.js`**
- This is where the data binding fails
- Lines 474-559 contain the initialization logic
- The component receives `resumeData` but doesn't populate fields

### Supporting Files
- `/client/src/app/Onb3.js` - Page that renders the form
- `/client/src/schemas/step-3-comprehensive.json` - Form schema
- `/server/mappers/mapToProfileDraft.js` - Backend (working correctly)

---

## 🧪 TESTING

### Use This Sample Data
```javascript
// Load this into localStorage as 'resumeData'
{
  "prefill": {
    "step3": {
      "fullLegalName": "K. Greg Jackson",
      "email": "kgregjackson@gmail.com",
      "phone": "571-287-0086",
      "city": "Orlando",
      "stateRegion": "FL",
      "country": "US"
    }
  }
}
```

### Test Steps
1. Open browser console
2. Run: `localStorage.setItem('resumeData', JSON.stringify(sampleData))`
3. Refresh the page
4. Check if fields populate

---

## ✅ SUCCESS CRITERIA

### Must Work
1. All form fields populate from parsed data
2. Education section shows parsed education
3. Work history shows parsed work experience
4. Form validation works unchanged
5. No console errors

### Must Preserve
1. Existing Tailwind validation styling
2. Form structure and requirements
3. Other onboarding steps
4. Backend parsing (don't touch)

---

## 🚨 CRITICAL NOTES

- **Backend is working perfectly** - DO NOT modify
- **Focus only on frontend data binding**
- **This is blocking product launch**
- **Quality and reliability are critical**
- **Preserve existing form structure**

---

## 📞 SUPPORT

- Check console for debug logs
- All debug logs start with 🚀 or 🔍
- FormRendererComprehensive has extensive logging
- Backend mappers have debug output

**Ready to start? The issue is in FormRendererComprehensive.js data binding logic.**
