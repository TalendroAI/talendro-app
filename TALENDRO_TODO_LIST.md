# Talendro Master To-Do List

**Version:** 1.0
**Date:** 2026-03-07
**Author:** Manus AI

## Introduction

This document provides a master to-do list for the complete build and deployment of the Talendro platform. It is based on the revised roadmap and a detailed code-level audit. Each task is designed to be specific and actionable, referencing the exact files, services, or components that need to be built or fixed.

---

## Phase 1: Build the Core Application Engine (Est: 8-10 Weeks)

**Objective:** Build the core automated application engine from the ground up. This is the most critical phase and delivers the fundamental promise of the product.

| Task | Component / File | Acceptance Criteria |
| :--- | :--- | :--- |
| **1.1: Set Up Job Queue** | New Service | Implement a message queue (e.g., RabbitMQ) to manage application jobs. Create a new service file: `/server/services/queueService.js`. |
| **1.2: Create Apply Worker** | New Service | Create a new worker service `/server/services/applyWorker.js` that consumes jobs from the queue. |
| **1.3: Build ATS Adapters** | New Services | Create ATS-specific adapters. Start with Greenhouse (`/server/services/ats/greenhouseAdapter.js`) and Lever (`/server/services/ats/leverAdapter.js`). |
| **1.4: Implement Browser Automation** | `applyWorker.js` | Use Playwright within the `applyWorker.js` to navigate to application forms, fill in fields, and submit. |
| **1.5: Build Per-Job Resume Tailoring** | New API & Service | Create a new API endpoint `/api/resume/tailor` and a service `/server/services/resumeTailorService.js` that uses AI to customize a resume for a specific job description. |
| **1.6: Build Cover Letter Generation** | New API & Service | Create a new API endpoint `/api/resume/generate-cover-letter` and a service `/server/services/coverLetterService.js` to generate AI-powered cover letters. |
| **1.7: Implement Email Notifications** | New Service | Integrate an email service (e.g., SendGrid) in `/server/services/emailService.js` and call it from the `applyWorker.js` on successful application submission. |
| **1.8: Enforce Application Quotas** | `User.js` & `applyWorker.js` | Modify `/server/models/User.js` to properly track monthly application counts. The `applyWorker.js` must check and enforce this limit before processing a job. |

---

## Phase 2: Deliver Pro-Tier Features & Fix Facades (Est: 4-6 Weeks)

**Objective:** Build out the features promised in the Pro plan and fix the deceptive UI elements to create an honest user experience.

| Task | Component / File | Acceptance Criteria |
| :--- | :--- | :--- |
| **2.1: Implement PDF Resume Generation** | New API & Service | Create a `/api/resume/download-pdf` endpoint and a `/server/services/pdfService.js` that uses a library like Puppeteer to generate a downloadable PDF resume. |
| **2.2: Build Salary Negotiation Guide** | New UI, API & Service | Create a new UI component `/client/src/app/SalaryNegotiation.js`, a new API endpoint `/api/negotiation/chat`, and a new service `/server/services/negotiationService.js` for single-round AI negotiation coaching. |
| **2.3: Fix Onboarding Dashboard** | `Dashboard.js` | Modify `/client/src/pages/app/Dashboard.js` to remove the mock API call and replace it with a call to the live `/api/jobs/feed` endpoint. |
| **2.4: Stabilize Resume Parsing** | `parse.js` | Refactor `/server/routes/parse.js` to remove all commented-out code and legacy logic, ensuring only the production-ready OpenAI parser is used. |

---

## Phase 3: Build Concierge Features (Est: 4-5 Weeks)

**Objective:** Implement the high-value, premium features promised to Concierge subscribers.

| Task | Component / File | Acceptance Criteria |
| :--- | :--- | :--- |
| **3.1: Build LinkedIn Optimization** | New UI, API & Service | Create a `/client/src/app/LinkedInOptimizer.js` component, a `/api/linkedin/optimize` endpoint, and a `/server/services/linkedinService.js` to scrape and analyze a user's LinkedIn profile. |
| **3.2: Implement Advanced Salary Negotiation** | `negotiationService.js` | Extend the existing salary negotiation service to support the multi-round analysis and support promised in the Concierge plan. |
| **3.3: Build Weekly AI Strategy Session** | New UI, API & Service | Create a `/client/src/app/StrategySession.js` component, a `/api/strategy/chat` endpoint, and a `/server/services/strategyService.js` for the weekly AI-powered career coaching session. |

---

## Phase 4: Deployment & Cleanup

**Objective:** Prepare the application for production, deploy it, and clean up the repository.

| Task | Component / File | Acceptance Criteria |
| :--- | :--- | :--- |
| **4.1: Update Deployment Configuration** | `render.yaml` | Add all new environment variables (e.g., for the queue service, email service) to the `render.yaml` file. |
| **4.2: Create Worker Dockerfile** | New File | Create a new `Dockerfile` specifically for the `applyWorker.js` service to ensure it can be deployed as a separate background worker on Render. |
| **4.3: Repository Cleanup** | Entire `/server/` directory | Delete all stale, unused, and temporary files from the `/server/` directory (e.g., `resume-parser-*.js`, `index-stripe.js`, etc.) to create a clean, production-ready codebase. |
