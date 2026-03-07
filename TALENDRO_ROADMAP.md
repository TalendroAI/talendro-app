# Talendro Go-Live Roadmap & Feature Audit

**Version:** 1.0
**Date:** 2026-03-07
**Author:** Manus AI

## 1. Introduction

This document provides a transparent, code-level audit of all key features requested and outlines a realistic roadmap to achieve a go-live state. The analysis is based on a thorough review of the existing codebase in the `talendro-app-main` repository. The goal is to provide an honest assessment of what is complete, what is a partial implementation or UI facade, and what has not yet been started. This serves as a foundation for prioritizing the engineering effort required to launch a robust and reliable product.

## 2. Feature Status Audit

The following table summarizes the current state of each feature area. The status is defined as:

*   **Complete:** The feature is fully implemented, connected to a real backend, and appears production-ready.
*   **Partial:** The feature has significant frontend and backend code but is missing key logic, has hardcoded data, or is not fully integrated.
*   **Facade:** The feature exists as a user interface but is not connected to a functional backend or relies on mock data. It *looks* real but is not.
*   **Not Started:** There is no meaningful code for this feature in the repository.

| Feature                   | Status        | Summary of Findings                                                                                             |
| :------------------------ | :------------ | :-------------------------------------------------------------------------------------------------------------- |
| **Resume Creation**       | **Partial**   | A comprehensive multi-step UI form exists. Data is collected but backend integration for building a resume from scratch is incomplete. |
| **Resume Update**         | **Partial**   | Similar to creation, a good UI exists for capturing updates, but the backend logic to merge changes is not fully implemented. |
| **Resume Optimization**   | **Partial**   | UI is complete and calls a real OpenAI-powered backend API (`/api/resume/optimize`). This is one of the most complete features. |
| **Job Search (Steady State)** | **Partial**   | The main job feed and search UI are built and connected to live backend APIs (`/api/jobs/feed`, `/api/jobs/search`). The backend job discovery pipeline is functional. |
| **Interview Coaching**    | **Partial**   | A robust multi-modal UI exists supporting text and audio. It is connected to a real backend API (`/api/interview/chat`) that uses AI. |
| **Onboarding Data Collection** | **Partial**   | The 11-step onboarding form is built and captures a vast amount of user data, but it is not fully integrated with other systems. |
| **User & Application Tracking** | **Complete**  | The `Jobs.js` and `Applications.js` pages are fully functional, with real API calls for creating, updating, and viewing data. |
| **Job Search (Onboarding)** | **Facade**    | The dashboard shown during onboarding (`/pages/app/Dashboard.js`) is a facade that pulls from mock API endpoints (e.g., `/api/dashboard/initial-search/demo`). |
| **Resume Customization**  | **Not Started** | There is no code for tailoring a user's optimized resume for a *specific* job application. The current optimization is generic. |
| **Job Application (Auto-Apply)** | **Not Started** | This is the largest missing piece. There is **zero** code related to browser automation (Puppeteer/Playwright) or submitting applications to ATS platforms. |
| **LinkedIn Optimization** | **Not Started** | There is no code in the repository for analyzing or suggesting improvements to a user's LinkedIn profile. |
| **Salary Negotiation**    | **Not Started** | There is no code related to salary negotiation tools, guides, or AI coaching for this purpose. |

## 3. Detailed Analysis & Go-Live Roadmap

Based on the audit, the following roadmap outlines the necessary work, grouped into logical phases, to get Talendro to a viable go-live state.

### Phase 1: Solidify the Foundation (Estimated: 2-3 Weeks)

The goal of this phase is to fix the facades, complete the core user data pipeline, and ensure the most critical features are robust.

1.  **Fix Onboarding Job Search:**
    *   **Task:** Replace the mock data in the onboarding dashboard with a call to the real `/api/jobs/feed` endpoint.
    *   **Justification:** This is a deceptive facade that breaks user trust from the start. It must show real, relevant jobs based on the user's initial input.

2.  **Complete Resume Create/Update Flow:**
    *   **Task:** Fully wire the `ResumeCreate.js` and `ResumeUpdate.js` components to the backend. Ensure the data collected is correctly processed by the `/api/resume/optimize` endpoint.
    *   **Justification:** The resume is the central asset. The user must be able to create, upload, or update it reliably before any other value can be delivered.

3.  **Stabilize Resume Parsing:**
    *   **Task:** Clean up the `server/routes/parse.js` file. Remove all commented-out code and confirm the `claudeAdapter.js` (OpenAI) parser is working reliably with robust error handling.
    *   **Justification:** Resume parsing is the first point of failure. The current file is confusing and fragile. This needs to be a resilient service.

### Phase 2: Deliver the Core Promise (Estimated: 4-6 Weeks)

This phase focuses on building the single most important missing feature: applying for jobs.

1.  **Build the Auto-Apply Engine:**
    *   **Task:** Design and build the job application engine as described in the `TALENDRO_ARCHITECTURE.md` document. This involves:
        *   Setting up a job queue (e.g., RabbitMQ).
        *   Creating a worker service that consumes from the queue.
        *   Implementing an ATS adapter layer, starting with Greenhouse as the first target.
        *   Using a headless browser library (Playwright is recommended) to automate form filling and submission.
    *   **Justification:** This is the core value proposition of Talendro. Without it, the product is just a job board with a resume builder.

2.  **Implement Resume Customization (Per-Job):**
    *   **Task:** Create a new AI-powered service that takes an optimized resume and a specific job description, and dynamically tailors the resume's summary and bullet points to match the job's keywords and requirements.
    *   **Justification:** This is a critical prerequisite for the Auto-Apply Engine to be effective. Sending a generic resume for every application will yield poor results.

### Phase 3: Add High-Value Features (Estimated: 3-4 Weeks)

With the core apply loop in place, this phase adds the features that will differentiate the product and justify premium tiers.

1.  **Build LinkedIn Optimization:**
    *   **Task:** Create a new feature that allows a user to input their LinkedIn profile URL. The backend will scrape the profile, analyze it against their resume and target roles, and provide AI-generated suggestions for improvement.
    *   **Justification:** A strong LinkedIn profile is as important as a resume in today's market. This is a high-value feature for users.

2.  **Build Salary Negotiation Coach:**
    *   **Task:** Develop a new AI chat-based tool specifically for salary negotiation. It could be triggered when an application status changes to "Offer". The AI would be primed with data about the role, location, and user's experience to provide negotiation strategies and practice conversations.
    *   **Justification:** This provides immense value at the most critical moment of the job search, directly impacting the user's financial outcome.

## 4. Estimated Go-Live Timeline

Summing the estimates for the three phases, the projected timeline to get to a go-live state with the features you've outlined is **9 to 13 weeks** of focused engineering work.

This timeline is an estimate and assumes a dedicated development effort. It prioritizes building real, functional components over UI facades to ensure a trustworthy and valuable product at launch.
