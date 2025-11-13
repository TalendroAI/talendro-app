
# Talendro™ User & Application Pack — Install Guide (2025-09-06)

This pack ONLY adds/updates the **user** areas (auth, onboarding, dashboard). Your marketing site stays as-is.

## Frontend (CRA)
Copy these into your CRA project under `src/` (keep folders):

```
src/ui/Header.js                         # Adds "Sign In" link
src/ui/Button.js                         # Small helper (if you don't already have one)
src/auth/SignIn.js                       # Sign In page
src/app/Onb3.js                          # Personal Information (updated fields)
src/app/Onb4.js                          # Residential (County=required; Reason removed)
src/app/Onb5.js                          # Education
src/app/Onb6.js                          # Employment (Supervisor Title & Reason required)
src/app/Onb7.js                          # Voluntary Self‑ID & Consent (complete/decline)
src/app/OnbReview.js                     # Final Review (Approve & Continue to Payment)
src/app/Dashboard.js                     # KPI tiles + deep links + quick file links
src/shell/App.js                         # Routes for the above pages
```

If your routes live elsewhere, merge the paths:
```
/auth/sign-in
/app/onboarding/step-3 .. /step-7
/app/onboarding/review
/app/dashboard
/app/agents
/app/jobs
/app/resumes
/app/applications
```

Run your client as usual: `npm start`

## Backend (Express)
Add routes and (optionally) sample metrics:

```
server/routes.user.js          # NEW — user/app routes (agents, jobs, resumes, applications, files)
server/index.userpack.js       # EXAMPLE server showing how to register routes + metrics mocks
```

Merge into your server (example):
```js
import userRoutes from './routes.user.js'
app.use('/api/user', userRoutes)

// If you don't already have them:
app.get('/api/metrics/today', (req,res)=> res.json({ applied:3, optimized:2, found:25, agents:1 }))
app.get('/api/metrics/alltime', (req,res)=> res.json({ applied:87, optimized:64, found:412, agents:5 }))
```

## What you get
- **Sign In** page + nav link
- **Onboarding Steps 3–6** (with your exact required/conditional fields)
- **Step 7** (Voluntary Self‑ID & Consent) with **complete or decline**, plus standing consent
- **Final Review** with Approve → Payment
- **Dashboard** with KPI tiles (Today & All‑Time), deep links, and quick links to:
  - Original Uploaded Résumé → `/api/user/files/resume`
  - Originally Completed Application (compiled) → `/api/user/files/application`
- Stub targets for Agents/Jobs/Resumes/Applications (so deep links resolve)

## Next integrations
- Replace mock data with your DB/services for `/api/user/*` and `/api/metrics/*`
- Connect Step‑2 résumé parsing to prefill Steps 3–6
- Persist Step‑7 choices and mirror them on employer applications
