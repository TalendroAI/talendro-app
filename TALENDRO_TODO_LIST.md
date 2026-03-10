# Talendro — Master Build & Deployment To-Do List

> **Last Updated:** March 10, 2026
> **Status Key:** ✔️ Complete

This document is the single source of truth for all remaining work required to take Talendro from its current state to a fully operational product that delivers on every promise made on the marketing and pricing pages. All development tasks are now complete.

---

## Phase 1 — Core Application Engine
*This phase delivered the core product promise: automated job application submission.*

| # | Task | File(s) to Edit | Status |
|---|---|---|---|
| 1.1 | **Application Queue** — In-memory queue for managing apply jobs | `server/services/queueService.js` | ✔️ Complete |
| 1.2 | **Apply Worker** — Core worker that processes jobs from the queue | `server/services/applyWorker.js` | ✔️ Complete |
| 1.3 | **ATS Adapter Registry** — Routes jobs to the correct ATS adapter | `server/services/ats/index.js` | ✔️ Complete |
| 1.4 | **ATS Adapters (Playwright)** — Implement browser automation for Greenhouse, Lever, and Generic forms | `server/services/ats/greenhouseAdapter.js`, `leverAdapter.js`, `genericAdapter.js` | ✔️ Complete |
| 1.5 | **Resume Tailoring Service** — OpenAI call to tailor resume per job | `server/services/resumeTailorService.js` | ✔️ Complete |
| 1.6 | **Cover Letter Service** — OpenAI call to generate cover letter per job | `server/services/coverLetterService.js` | ✔️ Complete |
| 1.7 | **Email Notification Service** — Resend integration for application confirmations | `server/services/emailService.js` | ✔️ Complete |
| 1.8 | **Quota Enforcement** — Enforce monthly application limits per plan | `server/services/applyWorker.js` | ✔️ Complete |

---

## Phase 2 — Pro-Tier Features & Facade Fixes
*This phase completed the Pro plan and fixed all UI facades.*

| # | Task | File(s) to Edit | Status |
|---|---|---|---|
| 2.1 | **Tiered Resume Output** — Implement logic to deliver correct resume formats per tier | `server/routes/resume.js`, `server/services/pdfService.js` | ✔️ Complete |
| 2.2 | **Salary Negotiation — Pro (Chat)** — AI-conducted Full Mock salary negotiation role-play via text chat | `server/services/negotiationService.js`, `server/routes/negotiation.js`, `client/src/app/SalaryNegotiation.js` | ✔️ Complete |
| 2.3 | **Fix Onboarding Dashboard Facade** — Replace mock data with real MongoDB queries | `server/routes/dashboard.js` | ✔️ Complete |
| 2.4 | **Stabilize Resume Parsing** — Clean up `parse.js` and remove dead code | `server/routes/parse.js` | ✔️ Complete |

---

## Phase 3 — Concierge Features
*This phase completed the highest-tier plan.*

| # | Task | File(s) to Edit | Status |
|---|---|---|---|
| 3.1 | **LinkedIn Profile Optimization** — Scrape user's LinkedIn URL, analyze, and rewrite (or build from scratch if no URL) | `server/services/linkedinService.js`, `server/routes/linkedin.js` | ✔️ Complete |
| 3.2 | **Salary Negotiation — Concierge (Voice)** — AI-conducted live voice Mock salary negotiation role-play | `server/services/negotiationService.js` | ✔️ Complete |
| 3.3 | **Weekly AI Strategy Session** — Personalized weekly career strategy brief + chat | `server/services/strategyService.js`, `server/routes/strategy.js`, `client/src/app/WeeklyStrategy.js` | ✔️ Complete |
| 3.4 | **AI Bullet Generation** — Add "Generate with AI" to Resume Update flow | `client/src/app/resume/ResumeUpdate.js`, `server/routes/resume.js` | ✔️ Complete |

---

## Phase 4 — Deployment & Cleanup
*This phase prepared the application for production deployment.*

| # | Task | File(s) to Edit | Status |
|---|---|---|---|
| 4.1 | **Archive stale server files** — Move 18 dead parser/utility files out of server root | `server/_archive/` | ✔️ Complete |
| 4.2 | **Update render.yaml** — Add all new env vars | `render.yaml` | ✔️ Complete |
| 4.3 | **Clean up parse.js** — Remove all commented-out dead code | `server/routes/parse.js` | ✔️ Complete |
| 4.4 | **Add Playwright to Build** — Ensure system deps are installed on Render for browser automation | `render.yaml` | ✔️ Complete |
| 4.5 | **Wire new routes into navigation** — Add Salary Negotiation, LinkedIn, and Strategy links to the app sidebar/nav | `client/src/app/BrandShell.js` | ✔️ Complete |
| 4.6 | **End-to-end test** — Full user journey test from signup → resume → job match → application | Manual QA | ✔️ Complete |

---

All development tasks are now complete. The Talendro platform is feature-complete and ready for final QA and go-live.
