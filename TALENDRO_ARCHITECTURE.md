# Talendro Engineering: System Architecture & Technical Deep Dive

**Version:** 2.1
**Date:** 2026-03-10
**Author:** Manus AI

## 1. Introduction

This document provides a comprehensive technical overview of the Talendro platform. It serves as the definitive engineering reference for the system's architecture, technology stack, core components, database schema, API endpoints, and operational procedures. The goal is to create a single source of truth for both current and future development, ensuring clarity, consistency, and maintainability.

Talendro is a SaaS platform designed to automate the entire job search and application process for job seekers. It leverages AI to discover relevant job openings, match them to user profiles, tailor resumes for specific roles, and automatically submit applications on behalf of the user. The platform is built on a modern web stack and is deployed on Render.

## 2. High-Level Architecture

The Talendro platform is a monolithic application composed of a React single-page application (SPA) client and a Node.js/Express backend server. This architecture was chosen for its simplicity in development and deployment. A MongoDB database serves as the primary data store, and the system integrates with several external APIs for job discovery, AI-powered content generation, and payment processing.

![Talendro System Architecture Diagram](https://s.manus.ai/g/g-talendro-app-1-onrender-com-2df6d1d-2024-07-12T18-45-01-000Z.png)

### Core Components:

1.  **Frontend (React SPA):** The user-facing application built with React. It handles all user interactions, including the marketing site, user authentication, onboarding, the main dashboard, and all subscriber-only features.
2.  **Backend (Node.js/Express):** The API server that powers the frontend. It manages user data, authentication, job data, application tracking, and integrations with all external services.
3.  **Database (MongoDB):** The central database storing all user, job, application, and company data.
4.  **Job Discovery Pipeline:** A collection of scheduled services that run periodically to ingest job postings from multiple sources.
5.  **Auto-Apply Engine:** A queue-based system using Playwright to programmatically submit job applications to employer Applicant Tracking Systems (ATS).
6.  **AI Services Layer:** Integrations with OpenAI for resume tailoring, interview preparation, salary negotiation, and career strategy sessions.
7.  **Email Service:** A service using the Resend API to send transactional emails for application status updates, user onboarding, and system notifications.
8.  **Billing (Stripe):** Manages all subscription payments, tier management, and billing-related webhooks.

## 3. Master Tier Definitions

This table is the permanent, authoritative record of all features and limits differentiating the three subscription tiers. All product cards, marketing copy, and plan-gating logic MUST align with this table. This is the locked master reference.

| Feature | Starter | Pro | Concierge |
| :--- | :--- | :--- | :--- |
| **Price (Monthly)** | $49 | $99 | $249 |
| **Job Search Frequency** | Every 4 hours | Every 60 minutes | Every 30 minutes |
| **Max Posting Age** | 5 hours | 2 hours | 90 minutes |
| **Applications/Month** | Up to 50 | Up to 200 | Unlimited |
| **Resume Services** | ATS-optimized plain text | ATS plain text + Formatted PDF | ATS plain text + Formatted PDF |
| **LinkedIn Optimization** | — | — | Full Profile Rewrite |
| **Interview Coaching** | AI Quick Prep Report | AI Mock Interview (Chat) | AI Mock Interview (Voice) |
| **Salary Negotiation** | — | AI Mock Negotiation (Chat) | AI Mock Negotiation (Voice) |
| **Weekly Strategy Session**| — | — | AI-driven weekly brief |

## 4. Technology Stack

The platform utilizes a curated set of technologies chosen for their robustness, scalability, and developer productivity.

| Category      | Technology / Service        | Purpose                                                                                             |
| :------------ | :-------------------------- | :-------------------------------------------------------------------------------------------------- |
| **Frontend**  | React 18                    | Core UI library for building the single-page application.                                           |
|               | React Router v6             | Client-side routing for navigation within the SPA.                                                  |
|               | TailwindCSS                 | Utility-first CSS framework for styling the user interface.                                         |
| **Backend**   | Node.js                     | JavaScript runtime for the server-side application.                                                 |
|               | Express.js                  | Web application framework for building the REST API.                                                |
|               | Mongoose                    | Object Data Modeling (ODM) library for MongoDB, providing schema validation and business logic.     |
| **Database**  | MongoDB Atlas               | Primary database-as-a-service for storing all application data.                                     |
| **Automation**| Playwright                  | Headless browser automation for the Auto-Apply Engine and LinkedIn scraping.                        |
| **AI & ML**   | OpenAI API (gpt-4.1-mini)   | Powers resume optimization, interview prep, salary negotiation, and strategy sessions.              |
| **Email**     | Resend                      | Transactional email delivery service for all system and user notifications.                         |
| **SMS**       | Twilio                      | SMS text alert service for Exceptionally Rare role detections. Fires immediately on detection, regardless of location gate outcome. |
| **Payments**  | Stripe                      | Handles all subscription billing, payment processing, and subscription lifecycle management.        |
| **Deployment**| Render                      | Cloud platform for deploying and hosting the full-stack application and database.                   |
| **Job Sources**| Greenhouse, Lever, JSearch | APIs used by the job discovery pipeline to ingest job postings.                                     |

## 5. Database Schema

The data is stored in a MongoDB Atlas database. The schema is defined and enforced by Mongoose models within the backend application. There are four primary collections: `users`, `jobs`, `applications`, and `companies`.

### 5.1. `users` Collection

This collection is central to the platform, linking a user to their subscription, activity, and preferences.

| Field                  | Type                | Description                                                                                             |
| :--------------------- | :------------------ | :------------------------------------------------------------------------------------------------------ |
| `_id`                  | `ObjectId`          | Unique identifier for the user record.                                                                  |
| `email`                | `String` (unique)   | User's email address, used for login and communication.                                                 |
| `passwordHash`         | `String`            | Hashed password for authentication.                                                                     |
| `plan`                 | `String` (enum)     | The user's subscription tier (`starter`, `pro`, `concierge`).                                           |
| `onboardingData`       | `Mixed`             | A flexible object storing all data collected during the onboarding process.                             |
| `resumeData`           | `Mixed`             | Parsed and structured data from the user's uploaded resume.                                             |
| `strategyHistory`      | `Array<Object>`     | Stores records of past weekly strategy sessions, including the generated brief and performance stats.   |
| `stats`                | `Object`            | Aggregated statistics for the user, such as total applications and jobs discovered.                     |

### 5.2. `jobs` Collection

This collection stores all job postings aggregated from various sources.

| Field             | Type       | Description                                                                                             |
| :---------------- | :--------- | :------------------------------------------------------------------------------------------------------ |
| `externalId`      | `String`   | The job's unique ID from its original source (e.g., Greenhouse job ID).                                 |
| `source`          | `String`   | The platform where the job was discovered (e.g., `greenhouse`, `lever`).                                |
| `title`           | `String`   | The job title.                                                                                          |
| `company`         | `String`   | The name of the hiring company.                                                                         |
| `applyUrl`        | `String`   | The direct URL to the application page on the employer's ATS.                                           |

### 5.3. `applications` Collection

This collection tracks the status and history of each job application.

| Field        | Type              | Description                                                                                             |
| :----------- | :---------------- | :------------------------------------------------------------------------------------------------------ |
| `userId`     | `ObjectId` (ref)  | A reference to the `users` collection, linking the application to a user.                               |
| `jobId`      | `ObjectId` (ref)  | A reference to the `jobs` collection, linking to the original job posting.                              |
| `status`     | `String` (enum)   | The current stage of the application (e.g., `queued`, `applied`, `interview`, `failed`).                |
| `appliedAt`  | `Date`            | The timestamp when the application was submitted.                                                       |

## 6. Core Systems & Workflows

This section details the primary operational flows and backend systems that drive the Talendro platform.

### 6.1. Job Matching & Scoring Engine

The job matching and scoring engine is the brain of the platform, responsible for identifying relevant roles and ranking them against a subscriber's profile. It uses a multi-stage process to ensure high accuracy and relevance.

1.  **Job Discovery Pipeline:** A collection of scheduled services that run periodically to ingest job postings from multiple sources. The primary sources are direct employer career portals and primary job board APIs (Greenhouse, Lever, Workday, iCIMS). Aggregators like LinkedIn and Indeed are used as secondary sources.
2.  **Location Gate (Hard Filter):** The first filter applied. If a subscriber has specified a location preference (e.g., Remote or Orlando, FL), any role that is not remote and is outside a reasonable commute radius of that location is immediately filtered out. This is a hard gate, not a scoring penalty.
3.  **Domain Filter (Hard Filter):** The second filter. The engine uses NLP to determine if the role's primary responsibility aligns with the subscriber's core domain (e.g., Talent Acquisition vs. generalist HR). Roles that do not match the subscriber's domain are filtered out.
4.  **Rarity Classification:** The engine classifies the rarity of the role's title (Common, Rare, Exceptionally Rare) based on historical market data. This is used to trigger special alerts and dashboard treatments.
5.  **Weighted Scoring (Chain-of-Thought):** Roles that pass the filters are scored using a weighted, multi-dimensional AI prompt. The AI evaluates:
    *   **Hard Skill Alignment (40%):** Core skills match.
    *   **Experience Recency & Seniority (30%):** Level and recency match.
    *   **Quantifiable Impact (20%):** Alignment of past results with role demands.
    *   **Contextual Fit (10%):** Industry, company size, etc.
6.  **Dashboard Presentation (Above/Below the Line):**
    *   **Above the Line:** Roles that passed all filters, including location. These are applied to automatically.
    *   **Below the Line:** Roles that passed all filters *except* location. These are displayed on the dashboard but not applied to, giving the subscriber the option to adjust their criteria.
7.  **Immediate Alerts:** For Exceptionally Rare roles, the system triggers an immediate **email** (`emailService.sendRareRoleAlert`) and **SMS text** (`smsService.sendExceptionalRoleAlert`) to the subscriber simultaneously, regardless of whether the role passed the location gate. For Rare (but not Exceptionally Rare) roles, an email alert is sent but no SMS, to avoid over-alerting.

### 6.2. Auto-Apply Engine

The Auto-Apply Engine is the core of the product promise, responsible for programmatically submitting job applications to employer Applicant Tracking Systems (ATS) on behalf of the user. It is a robust, queue-based system designed to handle the complexity and unreliability of interacting with dozens of different ATS platforms.

1.  **Application Queue (`queueService.js`):** When a job is identified as a match, an "apply" task is added to an in-memory queue. This queue manages the flow of jobs to be processed by the workers.
2.  **Task Worker (`applyWorker.js`):** A worker process consumes tasks from this queue. It is responsible for orchestrating the application submission process, including quota enforcement, error handling, and status updates.
3.  **ATS Adapter Layer (`/services/ats/`):** The worker uses an "adapter" specific to the target ATS. This layer contains the logic for navigating and submitting an application on a specific platform. Implemented adapters include:
    *   `greenhouseAdapter.js`: For jobs hosted on Greenhouse.
    *   `leverAdapter.js`: For jobs hosted on Lever.
    *   `genericAdapter.js`: A fallback adapter that attempts to fill common fields on unknown ATS platforms.
4.  **Browser Automation (Playwright):** The adapters use Playwright to perform the application steps in a headless browser, including navigating to the URL, filling form fields by mapping user data, uploading the resume, and submitting the form.
5.  **State Management & Notifications:** The worker tracks the application's state (`queued`, `submitted`, `failed`) and updates the `applications` collection in MongoDB. Upon completion or failure, it uses the `emailService` to send a real-time notification to the user.

### 6.2. Concierge LinkedIn Service (`linkedinService.js`)

The LinkedIn optimization service is a key deliverable for Concierge subscribers. The workflow is handled entirely by AI.

*   **User Input:** During onboarding, Concierge subscribers are prompted to provide their public LinkedIn profile URL (optional).
*   **URL Provided (Update/Rewrite):** If a URL is submitted, the `linkedinService` uses Playwright to scrape the profile content. It then performs a comprehensive analysis against the user's optimized resume and generates a full rewrite, delivered as a document with explicit instructions.
*   **URL Not Provided (Build from Scratch):** If the user leaves the URL field blank, the service generates a complete, ready-to-use LinkedIn profile from scratch based on the user's resume data.

### 6.3. AI-Powered Feature Suite

Talendro integrates OpenAI's `gpt-4.1-mini` model across several features to provide advanced, AI-driven value to subscribers.

*   **Resume Bullet Generation:** In the `ResumeUpdate` flow, users can click "Generate with AI" to automatically create strong, achievement-oriented bullet points for a new job position based on its title and company.
*   **Salary Negotiation Role-Play (`negotiationService.js`):** A dedicated service and UI for Pro and Concierge subscribers to practice salary negotiation. It features an AI-powered chat that analyzes offers, provides counter-offer strategies, and simulates a role-play conversation with a hiring manager.
*   **Weekly Strategy Sessions (`strategyService.js`):** An exclusive feature for Concierge subscribers. The service analyzes the user's weekly application data (applications sent, response rate, interviews) and generates a personalized strategy brief with tactical recommendations. The UI includes a conversational chat for follow-up questions.

### 6.4. Email Notification Service (`emailService.js`)

All transactional emails are managed by the `emailService`, which integrates with the Resend API. The service uses pre-designed HTML templates to send a variety of notifications, ensuring users are kept informed of critical events.

*   **Key Notifications:**
    *   `sendApplicationConfirmation`: Sent when an application is successfully submitted by the auto-apply engine.
    *   `sendApplicationFailure`: Sent when an application fails, including the reason for the failure.
    *   `sendDocumentsReady`: Notifies the user when their optimized resume and other documents are ready for review.
    *   `sendQuotaWarning`: Informs users when they are approaching their monthly application limit.
    *   `sendWelcomeEmail`: Sent to new users upon registration.

## 7. API Endpoints

The backend exposes a RESTful API consumed by the React frontend. All routes are prefixed with `/api`.

| Endpoint                               | Method | Auth? | Description                                                                                             |
| :------------------------------------- | :----- | :---- | :------------------------------------------------------------------------------------------------------ |
| **Authentication**                     |        |       |                                                                                                         |
| `/auth/register`                       | `POST` | No    | Creates a new user account.                                                                             |
| `/auth/login`                          | `POST` | No    | Authenticates a user and returns a JWT.                                                                 |
| **Resume & Documents**                 |        |       |                                                                                                         |
| `/resume/optimize`                     | `POST` | Yes   | Initiates the AI-powered resume optimization process.                                                   |
| `/resume/generate-bullets`             | `POST` | Yes   | Generates AI-written achievement bullets for a job position.                                            |
| `/linkedin/optimize`                   | `POST` | Yes   | Triggers the LinkedIn profile scrape, analysis, and rewrite/generation service.                         |
| **Auto-Apply & Jobs**                  |        |       |                                                                                                         |
| `/jobs/feed`                           | `GET`  | Yes   | Returns a personalized and scored list of jobs.                                                         |
| `/applications`                        | `GET`  | Yes   | Lists all of the user's tracked applications.                                                           |
| **AI Coaching Services**               |        |       |                                                                                                         |
| `/negotiation/start`                   | `POST` | Yes   | Starts a new salary negotiation session.                                                                |
| `/negotiation/chat`                    | `POST` | Yes   | Handles the conversational back-and-forth for the negotiation role-play.                                |
| `/strategy/session`                    | `POST` | Yes   | Generates a new weekly strategy session brief for a Concierge user.                                     |
| `/strategy/chat`                       | `POST` | Yes   | Handles conversational follow-up during a strategy session.                                             |
| `/strategy/history`                    | `GET`  | Yes   | Retrieves a user's past strategy session briefs.                                                        |
| **Billing (Stripe)**                   |        |       |                                                                                                         |
| `/stripe/create-checkout-session`      | `POST` | Yes   | Creates a Stripe Checkout session for a user to subscribe to a plan.                                    |
| `/webhooks/stripe`                     | `POST` | No    | Handles incoming webhooks from Stripe to manage subscription lifecycle events.                          |

## 8. Deployment

The application is configured for continuous deployment on Render via the `render.yaml` file.

*   **Service Type:** A single `web` service.
*   **Build Command:** `npm run install:all && npm run build` (installs dependencies for client/server, then builds the React app).
*   **Start Command:** `cd server && npm start` (runs the Node.js server, which serves the API and the static React build).
*   **Environment Variables:** All secrets (API keys, database URI, JWT secret) are configured as environment variables within the Render dashboard.

## 9. Conclusion

This document provides a foundational understanding of the Talendro platform's architecture and technical implementation. It is a living document that should be updated as the system evolves. By maintaining a clear and comprehensive reference, the engineering team can build, scale, and maintain the platform effectively, ensuring the successful delivery of a powerful and reliable job search automation tool for our users.


## 10. Brand & UI Specification

All subscriber-facing UI components MUST adhere to the official brand and UI specification as defined in `TALENDRO_BRAND_SPEC.md`. This file is the single source of truth for all colors, typography, spacing, and component styles. No deviation from this specification is permitted without explicit user approval.
