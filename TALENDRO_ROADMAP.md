# Talendro Go-Live Roadmap & Feature Audit

**Version:** 1.1
**Date:** 2026-03-08
**Author:** Manus AI

## 1. Introduction

This document provides a transparent, code-level audit of all key features and outlines a realistic roadmap to achieve a go-live state. The analysis is based on a thorough review of the existing codebase in the `talendro-app-main` repository. The goal is to provide an honest assessment of what is complete, what is a partial implementation or UI facade, and what has not yet been started. This serves as a foundation for prioritizing the engineering effort required to launch a robust and reliable product.

## 2. Feature Status Audit

*This section is unchanged and remains for reference.*

## 3. Detailed Analysis & Go-Live Roadmap

Based on the audit and a clear understanding of the three-tier product strategy, the following roadmap outlines the necessary work, grouped into logical phases, to get Talendro to a viable go-live state.

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

### Phase 3: Implement Tiered Deliverables (Estimated: 3-4 Weeks)

With the core apply loop in place, this phase implements the specific deliverables that differentiate the subscription tiers.

1.  **Implement Tiered Resume Outputs:**
    *   **Task:** Update the resume service to generate the correct outputs based on the user's plan. This includes:
        *   **Plain Text Resume (All Tiers):** Ensure a clean, ATS-friendly text version is always generated.
        *   **HTML Formatted Resume (Pro & Concierge):** Build the service (`pdfService.js`) to generate a visually appealing HTML resume. Gate this feature so it's only available to Pro and Concierge subscribers.
    *   **Justification:** This directly implements the core product differentiation strategy.

2.  **Build LinkedIn Optimization (Concierge):**
    *   **Task:** Create the LinkedIn optimization feature as a deliverable for Concierge users. This involves building the UI, the backend service (`linkedinService.js`), and the API route to analyze a user's profile and provide AI-powered recommendations.
    *   **Justification:** This is the key deliverable that makes the Concierge plan unique and justifies its premium price.

3.  **Build Salary Negotiation Coach (Pro & Concierge):**
    *   **Task:** Develop the AI chat-based tool for salary negotiation. This will be available to Pro and Concierge users.
    *   **Justification:** This provides immense value at the most critical moment of the job search, directly impacting the user's financial outcome.

## 4. Estimated Go-Live Timeline

Summing the estimates for the three phases, the projected timeline to get to a go-live state with the features you've outlined is **9 to 13 weeks** of focused engineering work.

This timeline is an estimate and assumes a dedicated development effort. It prioritizes building real, functional components over UI facades to ensure a trustworthy and valuable product at launch.
