# Talendro — Master Build & Deployment To-Do List

> **Last Updated:** March 8, 2026
> **Status Key:** ✅ Scaffolded (file exists, logic needed) | 🔲 Not Started | ✔️ Complete

This document is the single source of truth for all remaining work required to take Talendro from its current state to a fully operational product that delivers on every promise made on the marketing and pricing pages. Tasks are ordered by priority and dependency.

---

## Phase 1 — Core Application Engine
*Estimated: 8–10 weeks of engineering effort*
*This phase delivers the core product promise: automated job application submission.*

| # | Task | File(s) to Edit | Status |
|---|---|---|---|
| 1.1 | **Application Queue** — In-memory queue for managing apply jobs | `server/services/queueService.js` | ✅ Scaffolded |
| 1.2 | **Apply Worker** — Core worker that processes jobs from the queue | `server/services/applyWorker.js` | ✅ Scaffolded |
| 1.3 | **ATS Adapter Registry** — Routes jobs to the correct ATS adapter | `server/services/ats/index.js` | ✅ Scaffolded |
| 1.4 | **ATS Adapters (Playwright)** — Implement browser automation for Greenhouse, Lever, and Generic forms | `server/services/ats/greenhouseAdapter.js`, `leverAdapter.js`, `genericAdapter.js` | ✅ Scaffolded |
| 1.5 | **Resume Tailoring Service** — OpenAI call to tailor resume per job | `server/services/resumeTailorService.js` | ✅ Scaffolded |
| 1.6 | **Cover Letter Service** — OpenAI call to generate cover letter per job | `server/services/coverLetterService.js` | ✅ Scaffolded |
| 1.7 | **Email Notification Service** — Resend integration for application confirmations | `server/services/emailService.js` | ✅ Scaffolded |
| 1.8 | **Quota Enforcement** — Enforce monthly application limits per plan | `server/services/applyWorker.js` (see TODO comment) | ✅ Scaffolded |

**To activate Phase 1:**
1. Install Playwright: `cd server && npm install playwright`
2. Implement the `apply()` method in each ATS adapter (see detailed TODO comments in each file)
3. Implement `resumeTailorService.tailor()` with the OpenAI call
4. Implement `coverLetterService.generate()` with the OpenAI call
5. Add `RESEND_API_KEY` to Render env vars and implement `emailService` methods
6. Set `ENABLE_AUTO_APPLY=true` in Render to enable the worker

---

## Phase 2 — Pro-Tier Features & Facade Fixes
*Estimated: 4–6 weeks of engineering effort*
*This phase completes the Pro plan and fixes the fake onboarding experience.*

| # | Task | File(s) to Edit | Status |
|---|---|---|---|
| 2.1 | **Tiered Resume Output** — Implement logic to deliver correct resume formats per tier | `server/routes/resume.js`, `server/services/pdfService.js` | ✅ Scaffolded |
| 2.2 | **Salary Negotiation — Pro (Chat)** — AI-conducted Full Mock salary negotiation role-play via text chat | `server/services/negotiationService.js`, `server/routes/negotiation.js`, `client/src/app/SalaryNegotiation.js` | ✅ Scaffolded |
| 2.3 | **Fix Onboarding Dashboard Facade** — Replace mock data with real MongoDB queries | `server/routes/dashboard.js` | ✔️ **Complete** |
| 2.4 | **Stabilize Resume Parsing** — Clean up `parse.js` and remove dead code | `server/routes/parse.js` | 🔲 Not Started |

**To activate Phase 2:**
1. Install Puppeteer for PDF: `cd server && npm install puppeteer`
2. Implement `pdfService.generateResumePdf()` to generate the HTML resume (see TODO in file)
3. Update the `/api/resume/download-pdf` endpoint to check user's plan and only return the PDF for Pro/Concierge tiers.
4. Implement `negotiationService.chat()` and `negotiationService.analyze()` (see TODO in file)
5. Clean up `server/routes/parse.js` — remove the 320 lines of commented-out dead code above the live code

---

## Phase 3 — Concierge Features
*Estimated: 4–5 weeks of engineering effort*
*This phase completes the highest-tier plan.*

| # | Task | File(s) to Edit | Status |
|---|---|---|---|
| 3.1 | **LinkedIn Profile Optimization** — AI analysis and update of LinkedIn profile | `server/services/linkedinService.js`, `server/routes/linkedin.js`, `client/src/app/LinkedInOptimizer.js` | ✅ Scaffolded |
| 3.2 | **Salary Negotiation — Concierge (Voice)** — AI-conducted live voice Mock salary negotiation role-play (mirrors the voice interview system) | `server/services/negotiationService.js`, `server/routes/negotiation.js` (add voice token endpoint) | ✅ Scaffolded |
| 3.3 | **Weekly AI Strategy Session** — Personalized weekly career strategy brief + chat | `server/services/strategyService.js`, `server/routes/strategy.js`, `client/src/app/WeeklyStrategy.js` | ✅ Scaffolded |

**To activate Phase 3:**
1. Implement `linkedinService.analyze()` and `linkedinService.update()` with the OpenAI call (see TODO in file)
2. Implement `strategyService.generateSession()` and `strategyService.chat()` (see TODO in file)
3. Verify plan-gating logic in `linkedin.js` and `strategy.js` routes is correct

---

## Phase 4 — Deployment & Cleanup
*Estimated: 1–2 weeks*

| # | Task | File(s) to Edit | Status |
|---|---|---|---|
| 4.1 | **Archive stale server files** — Move 18 dead parser/utility files out of server root | `server/_archive/` | ✔️ **Complete** |
| 4.2 | **Update render.yaml** — Add all new env vars (RESEND_API_KEY, ENABLE_AUTO_APPLY, etc.) | `render.yaml` | ✔️ **Complete** |
| 4.3 | **Clean up parse.js** — Remove 320 lines of commented-out dead code | `server/routes/parse.js` | 🔲 Not Started |
| 4.4 | **Add Playwright to Dockerfile** — Ensure system deps are installed on Render for browser automation | Create `server/Dockerfile` or add to `render.yaml` build command | 🔲 Not Started |
| 4.5 | **Wire new routes into navigation** — Add Salary Negotiation, LinkedIn, and Strategy links to the app sidebar/nav | `client/src/app/BrandShell.js` or equivalent nav component | 🔲 Not Started |
| 4.6 | **End-to-end test** — Full user journey test from signup → resume → job match → application | Manual QA checklist | 🔲 Not Started |

---

## New Files Created (Reference)

*This section is unchanged and remains for reference.*
