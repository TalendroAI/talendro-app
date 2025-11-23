# Complete Onboarding Pages & Links
## Base URL: https://talendro-app-1.onrender.com

---

## 📝 Onboarding Flow Pages

### Main Onboarding Sequence

#### Step 0: Welcome
- **URL**: https://talendro-app-1.onrender.com/app/onboarding/welcome
- **Page Name**: Welcome to Talendro™
- **Links FROM this page**:
  - → **Upload Resume** (Step 1): https://talendro-app-1.onrender.com/app/onboarding/step-1
  - → **Learn How It Works**: https://talendro-app-1.onrender.com/services/how-it-works

#### Step 1: Upload Résumé
- **URL**: https://talendro-app-1.onrender.com/app/onboarding/step-1
- **Page Name**: Upload Résumé
- **Component**: Onb2
- **Links FROM this page**:
  - ← **Back to Welcome**: https://talendro-app-1.onrender.com/app/onboarding/welcome
  - → **Auto-navigates to Step 2** (Create Profile) after resume upload

#### Step 2: Create Profile
- **URL**: https://talendro-app-1.onrender.com/app/onboarding/step-2
- **Page Name**: Create Profile
- **Component**: Onb1
- **Links FROM this page**:
  - ← **Back to Upload Resume** (Step 1): https://talendro-app-1.onrender.com/app/onboarding/step-1
  - → **Continue to Personal Information** (Step 3): https://talendro-app-1.onrender.com/app/onboarding/step-3
  - → **Terms of Service**: https://talendro-app-1.onrender.com/terms
  - → **Privacy Policy**: https://talendro-app-1.onrender.com/privacy
  - → **Log In** (if already have account): https://talendro-app-1.onrender.com/auth/sign-in

#### Step 3: Personal Information
- **URL**: https://talendro-app-1.onrender.com/app/onboarding/step-3
- **Page Name**: Personal Information
- **Component**: Onb3
- **Links FROM this page**:
  - ← **Back to Create Profile** (Step 2): https://talendro-app-1.onrender.com/app/onboarding/step-2
  - → **Continue to Professional Information** (Step 4): https://talendro-app-1.onrender.com/app/onboarding/step-4

#### Step 4: Professional Information
- **URL**: https://talendro-app-1.onrender.com/app/onboarding/step-4
- **Page Name**: Professional Information
- **Component**: Onb4
- **Links FROM this page**:
  - ← **Back to Personal Information** (Step 3): https://talendro-app-1.onrender.com/app/onboarding/step-3
  - → **Continue to Disclosures & Authorizations** (Step 5): https://talendro-app-1.onrender.com/app/onboarding/step-5

#### Step 5: Disclosures & Authorizations
- **URL**: https://talendro-app-1.onrender.com/app/onboarding/step-5
- **Page Name**: Disclosures & Authorizations
- **Component**: Onb5
- **Links FROM this page**:
  - ← **Back to Professional Information** (Step 4): https://talendro-app-1.onrender.com/app/onboarding/step-4
  - → **Proceed to Payment & Activate**: https://talendro-app-1.onrender.com/app/checkout

#### Step 6: Review
- **URL**: https://talendro-app-1.onrender.com/app/onboarding/review
- **Page Name**: Final Review
- **Component**: OnbReview
- **Links FROM this page**:
  - → **Approve & Continue to Payment**: https://talendro-app-1.onrender.com/app/checkout

---

## 🔗 Direct Access Routes (For Testing/QA)

These routes allow direct access to specific onboarding steps without going through the full flow:

- **Create Profile (Direct)**: https://talendro-app-1.onrender.com/app/onboarding/create-profile
  - Same as Step 2 (Onb1 component)
  
- **Upload Resume (Direct)**: https://talendro-app-1.onrender.com/app/onboarding/upload-resume
  - Same as Step 1 (Onb2 component)
  
- **Personal Information (Direct)**: https://talendro-app-1.onrender.com/app/onboarding/personal-information
  - Same as Step 3 (Onb3 component)

---

## 🔄 Onboarding Flow Navigation Map

```
Welcome
  ↓
Step 1: Upload Résumé
  ↓ (auto-navigates after upload)
Step 2: Create Profile
  ↓
Step 3: Personal Information
  ↓
Step 4: Professional Information
  ↓
Step 5: Disclosures & Authorizations
  ↓
Checkout/Payment
  ↓
Review (optional)
  ↓
Dashboard
```

---

## 📋 Complete List of All Onboarding URLs

1. **Welcome**: https://talendro-app-1.onrender.com/app/onboarding/welcome
2. **Step 1 - Upload Résumé**: https://talendro-app-1.onrender.com/app/onboarding/step-1
3. **Step 2 - Create Profile**: https://talendro-app-1.onrender.com/app/onboarding/step-2
4. **Step 3 - Personal Information**: https://talendro-app-1.onrender.com/app/onboarding/step-3
5. **Step 4 - Professional Information**: https://talendro-app-1.onrender.com/app/onboarding/step-4
6. **Step 5 - Disclosures & Authorizations**: https://talendro-app-1.onrender.com/app/onboarding/step-5
7. **Review**: https://talendro-app-1.onrender.com/app/onboarding/review
8. **Create Profile (Direct)**: https://talendro-app-1.onrender.com/app/onboarding/create-profile
9. **Upload Resume (Direct)**: https://talendro-app-1.onrender.com/app/onboarding/upload-resume
10. **Personal Information (Direct)**: https://talendro-app-1.onrender.com/app/onboarding/personal-information

---

## 🔗 External Links from Onboarding Pages

### Links to Other Site Pages:
- **How It Works**: https://talendro-app-1.onrender.com/services/how-it-works
- **Terms of Service**: https://talendro-app-1.onrender.com/terms
- **Privacy Policy**: https://talendro-app-1.onrender.com/privacy
- **Sign In**: https://talendro-app-1.onrender.com/auth/sign-in

### Links to Checkout:
- **Checkout**: https://talendro-app-1.onrender.com/app/checkout

---

## 📊 Summary

**Total Onboarding Pages**: 10 unique routes
- **Main Flow**: 7 pages (Welcome + Steps 1-5 + Review)
- **Direct Access Routes**: 3 pages (for testing/QA)

**Total Links from Onboarding Pages**: 14 links
- Internal navigation: 10 links
- External site pages: 4 links



