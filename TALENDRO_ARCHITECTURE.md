# Talendro Engineering: System Architecture & Technical Deep Dive

**Version:** 1.0
**Date:** 2026-03-07
**Author:** Manus AI

## 1. Introduction

This document provides a comprehensive technical overview of the Talendro platform. It serves as the definitive engineering reference for the system's architecture, technology stack, core components, database schema, API endpoints, and operational procedures. The goal is to create a single source of truth for both current and future development, ensuring clarity, consistency, and maintainability.

Talendro is a SaaS platform designed to automate the entire job search and application process for job seekers. It leverages AI to discover relevant job openings, match them to user profiles, tailor resumes for specific roles, and (in the future) automatically submit applications on behalf of the user. The platform is built on a modern web stack and is deployed on Render.

## 2. High-Level Architecture

The Talendro platform is a monolithic application composed of a React single-page application (SPA) client and a Node.js/Express backend server. This architecture was chosen for its simplicity in development and deployment. A MongoDB database serves as the primary data store, and the system integrates with several external APIs for job discovery, AI-powered content generation, and payment processing.

![Talendro System Architecture Diagram](https://s.manus.ai/g/g-talendro-app-1-onrender-com-2df6d1d-2024-07-12T18-45-01-000Z.png)
*(A more detailed process flow diagram is available in the project repository as `FinalTalendroProcessFlow.drawio`)*

### Core Components:

1.  **Frontend (React SPA):** The user-facing application built with React and Create React App. It handles all user interactions, including the marketing site, user authentication, onboarding, the main dashboard, and all subscriber-only features.
2.  **Backend (Node.js/Express):** The API server that powers the frontend. It manages user data, authentication, job data, application tracking, and integrations with all external services (Stripe, OpenAI, Job Boards).
3.  **Database (MongoDB):** The central database storing all user, job, application, and company data.
4.  **Job Discovery Pipeline:** A collection of scheduled services (`crawlerScheduler.js`) that run periodically to ingest job postings from multiple sources (Greenhouse, Lever, Fantastic.jobs, JSearch).
5.  **AI Services Layer:** Integrations with OpenAI for resume tailoring and interview question generation, and xAI (Grok) for real-time voice in the Audio Mock Interview feature.
6.  **Billing (Stripe):** Manages all subscription payments, tier management, and billing-related webhooks.


## 3. Technology Stack

The platform utilizes a curated set of technologies chosen for their robustness, scalability, and developer productivity.

| Category      | Technology / Service        | Purpose                                                                                             |
| :------------ | :-------------------------- | :-------------------------------------------------------------------------------------------------- |
| **Frontend**  | React 18 (via CRA)          | Core UI library for building the single-page application.                                           |
|               | React Router v6             | Client-side routing for navigation within the SPA.                                                  |
|               | TailwindCSS                 | Utility-first CSS framework for styling the user interface.                                         |
|               | Recharts                    | Charting library used for data visualizations in the user dashboard.                                |
| **Backend**   | Node.js                     | JavaScript runtime for the server-side application.                                                 |
|               | Express.js                  | Web application framework for building the REST API.                                                |
|               | Mongoose                    | Object Data Modeling (ODM) library for MongoDB, providing schema validation and business logic.     |
| **Database**  | MongoDB Atlas               | Primary database-as-a-service for storing all application data (Users, Jobs, Applications).         |
| **AI & ML**   | OpenAI API (gpt-4.1-mini)   | Used for AI-powered resume tailoring, interview question generation, and Boolean search string creation. |
|               | xAI Grok (Realtime API)     | Powers the voice-based Audio Mock Interview feature via a WebSocket connection.                     |
| **Payments**  | Stripe                      | Handles all subscription billing, payment processing, and subscription lifecycle management.        |
| **Deployment**| Render                      | Cloud platform for deploying and hosting the full-stack application and database.                   |
| **Job Sources**| Greenhouse, Lever, JSearch | APIs used by the job discovery pipeline to ingest job postings from various employer career pages.    |

## 4. Database Schema

The data is stored in a MongoDB Atlas database. The schema is defined and enforced by Mongoose models within the backend application. There are four primary collections:

*   `users`: Stores all user account information, including authentication, subscription status, onboarding data, and preferences.
*   `jobs`: A catalog of all job postings discovered by the crawler services.
*   `applications`: Tracks every job application submitted by the system or manually entered by the user.
*   `companies`: A collection of companies with ATS boards that the crawlers monitor.

### 4.1. `users` Collection

This collection is central to the platform, linking a user to their subscription, activity, and preferences.

| Field                  | Type                | Description                                                                                             |
| :--------------------- | :------------------ | :------------------------------------------------------------------------------------------------------ |
| `_id`                  | `ObjectId`          | Unique identifier for the user record.                                                                  |
| `email`                | `String` (unique)   | User's email address, used for login and communication.                                                 |
| `name`                 | `String`            | User's full name.                                                                                       |
| `passwordHash`         | `String`            | Hashed password for authentication. Can be `PENDING_REGISTRATION` for users created via webhook.        |
| `stripeCustomerId`     | `String`            | The user's customer ID in Stripe.                                                                       |
| `stripeSubscriptionId` | `String`            | The user's primary subscription ID in Stripe.                                                           |
| `plan`                 | `String` (enum)     | The user's subscription tier (`basic`, `pro`, `premium`).                                               |
| `subscriptionStatus`   | `String` (enum)     | The current status of the user's Stripe subscription (e.g., `active`, `canceled`).                     |
| `onboardingProgress`   | `Object`            | Tracks the user's progress through the multi-step onboarding flow.                                      |
| `onboardingData`       | `Mixed`             | A flexible object storing all data collected during the 11-step onboarding process.                     |
| `resumeData`           | `Mixed`             | Parsed and structured data from the user's uploaded resume, used for matching and tailoring.            |
| `stats`                | `Object`            | Aggregated statistics for the user, such as total applications and jobs discovered.                     |
| `interviewSessions`    | `Array<Object>`     | Stores records of all interview prep sessions (Quick Prep, Full Mock, Audio Mock).                      |

### 4.2. `jobs` Collection

This collection stores all job postings aggregated from various sources.

| Field             | Type       | Description                                                                                             |
| :---------------- | :--------- | :------------------------------------------------------------------------------------------------------ |
| `_id`             | `ObjectId` | Unique identifier for the job record.                                                                   |
| `externalId`      | `String`   | The job's unique ID from its original source (e.g., Greenhouse job ID).                                 |
| `source`          | `String`   | The platform where the job was discovered (e.g., `greenhouse`, `lever`).                                |
| `title`           | `String`   | The job title.                                                                                          |
| `company`         | `String`   | The name of the hiring company.                                                                         |
| `location`        | `String`   | The primary location of the job.                                                                        |
| `remote`          | `Boolean`  | Flag indicating if the job is fully remote.                                                             |
| `descriptionText` | `String`   | The full job description in plain text.                                                                 |
| `applyUrl`        | `String`   | The direct URL to the application page on the employer's ATS.                                           |
| `postedAt`        | `Date`     | The date the employer originally posted the job.                                                        |
| `firstSeenAt`     | `Date`     | The timestamp when our crawler first discovered this job.                                               |
| `lastSeenAt`      | `Date`     | The most recent timestamp our crawler confirmed this job was still active.                              |
| `isActive`        | `Boolean`  | A flag indicating if the job is still considered active by our system.                                  |
| `normalizedTitle` | `String`   | A cleaned, lowercased version of the title used for efficient matching.                                 |

### 4.3. `applications` Collection

This collection tracks the status and history of each job application.

| Field        | Type              | Description                                                                                             |
| :----------- | :---------------- | :------------------------------------------------------------------------------------------------------ |
| `_id`        | `ObjectId`        | Unique identifier for the application record.                                                           |
| `userId`     | `ObjectId` (ref)  | A reference to the `users` collection, linking the application to a user.                               |
| `jobId`      | `ObjectId` (ref)  | A reference to the `jobs` collection, linking to the original job posting.                              |
| `jobTitle`   | `String`          | Denormalized job title to persist even if the original job record is removed.                           |
| `company`    | `String`          | Denormalized company name.                                                                              |
| `status`     | `String` (enum)   | The current stage of the application (e.g., `applied`, `interview`, `offer`, `rejected`).               |
| `appliedAt`  | `Date`            | The timestamp when the application was submitted.                                                       |
| `activities` | `Array<Object>`   | A log of all activities related to this application (e.g., status changes, notes, follow-ups).        |
| `matchScore` | `Number`          | The calculated match score between the user's profile and the job at the time of application.         |

### 4.4. `companies` Collection

This collection maintains a list of companies to be crawled for new jobs.

| Field         | Type       | Description                                                                        |
| :------------ | :--------- | :--------------------------------------------------------------------------------- |
| `_id`         | `ObjectId` | Unique identifier for the company record.                                          |
| `name`        | `String`   | The name of the company.                                                           |
| `slug`        | `String`   | The company's unique identifier on the ATS job board (e.g., "acme" for Greenhouse). |
| `source`      | `String`   | The ATS provider for this company (e.g., `greenhouse`, `lever`).                   |
| `lastCrawledAt` | `Date`     | The timestamp of the last time the crawler processed this company.                 |
| `priority`    | `Number`   | A score from 1-10 indicating how frequently this company should be crawled.        |

## 5. Core Systems & Workflows

This section details the primary operational flows and backend systems that drive the Talendro platform.

### 5.1. Authentication Flow

Authentication is managed via JSON Web Tokens (JWT). The flow is designed to handle both new user registrations and users who are created via a Stripe webhook after a successful payment.

1.  **Registration (`/api/auth/register`):**
    *   A new user provides their email, name, and password.
    *   The backend hashes the password using `bcryptjs`.
    *   A new `User` document is created in MongoDB.
    *   If a placeholder user record already exists (created by a Stripe webhook with `passwordHash: 'PENDING_REGISTRATION'`), this registration completes the account by setting the real password hash.
    *   A JWT is generated using `jsonwebtoken`, signed with the `JWT_SECRET`, and has an expiration of 30 days.
    *   The token and a sanitized user object are returned to the client.

2.  **Login (`/api/auth/login`):**
    *   The user provides their email and password.
    *   The backend finds the user by email and compares the provided password with the stored `passwordHash` using `bcrypt.compare`.
    *   On success, a new JWT is issued and returned to the client.

3.  **Token Handling (Frontend):**
    *   The JWT and user object are stored in `localStorage` by the `AuthContext`.
    *   For subsequent API requests, the token is sent in the `Authorization: Bearer <token>` header.

4.  **Token Verification (Backend):**
    *   The `authenticateToken` middleware (`/server/middleware/auth.js`) intercepts all protected routes.
    *   It verifies the JWT's signature and expiration. If valid, it attaches the decoded user payload (containing `userId` and `email`) to the `req` object, allowing downstream route handlers to identify and authorize the user.

### 5.2. Job Discovery Pipeline

The job discovery process is orchestrated by the `crawlerScheduler.js` service, which runs a series of `node-cron` scheduled tasks to continuously ingest new job postings.

*   **Scheduler:** `server/services/crawlerScheduler.js`
*   **Cron Jobs:** The scheduler initiates different crawlers at set intervals:
    *   **ATS Crawl (Greenhouse & Lever):** Runs every 30 minutes. It fetches a batch of companies from the `companies` collection and calls the respective crawler functions (`crawlGreenhouseCompany`, `crawlLeverCompany`) to scrape their job boards.
    *   **Aggregator Ingestion (Fantastic.jobs & JSearch):** Runs every 60 minutes to pull jobs from large, third-party job aggregators.
    *   **Company Discovery:** Runs once daily to find new companies using the Greenhouse and Lever APIs.
    *   **Stale Job Cleanup:** Runs once daily to mark jobs as `isActive: false` if they haven't been seen by the crawlers for 72 hours.
*   **Data Flow:**
    1.  The cron job triggers a crawler function.
    2.  The crawler makes API requests to the target job source (e.g., a company's Greenhouse job board API).
    3.  The raw job data is transformed into the `Job` schema format.
    4.  The system uses `Job.findOneAndUpdate` with the `externalId` and `source` as a unique key to either create a new job record or update an existing one (updating `lastSeenAt`).

### 5.3. Job Matching & Scoring Engine

Once a user has completed their onboarding, the system can score jobs against their profile to determine relevance. This is the core logic behind the personalized job feed.

*   **Location:** `server/routes/jobs.js` (the `scoreJobFull` function)
*   **Process:**
    1.  When a user requests their job feed (`/api/jobs/feed`), the system fetches their `onboardingData`.
    2.  It retrieves a large pool of candidate jobs from the database, pre-filtering where possible (e.g., by job titles).
    3.  Each job is passed through the `scoreJobFull` function, which calculates a match score out of 100 based on a weighted 7-factor model:
        *   **Title Relevance (35 pts):** How closely the job title matches the user's target titles.
        *   **Seniority Match (20 pts):** Compares inferred seniority from the job title with the user's preferred experience levels.
        *   **Work Arrangement (15 pts):** Matches remote/hybrid/onsite preferences.
        *   **Employment Type (10 pts):** Matches full-time, contract, etc.
        *   **Skills Overlap (10 pts):** Checks for keyword overlap between the user's skills and the job description.
        *   **Location Match (5 pts):** Checks if the job location is within the user's target areas.
        *   **Recency Bonus (5 pts):** Awards points for newer job postings.
    4.  **Thresholding:** Only jobs that score **75% or higher** are included in the final feed delivered to the user, ensuring high relevance.

### 5.4. Subscription & Billing Management

Billing is handled entirely by Stripe. The backend integrates with Stripe for creating checkout sessions and handling webhooks to keep user subscription status in sync.

*   **Checkout (`/api/stripe/create-checkout-session`):** When a user selects a plan, the frontend sends the `priceId` to this endpoint. The backend creates a Stripe Checkout Session and returns the session URL, to which the user is redirected to complete payment.
*   **Webhooks (`/api/webhooks/stripe`):** A dedicated webhook handler processes events from Stripe. This is critical for managing the subscription lifecycle asynchronously.
    *   The endpoint uses `express.raw({ type: 'application/json' })` to receive the raw request body for signature verification.
    *   It verifies the `stripe-signature` header to ensure the request is genuinely from Stripe.
    *   Key events handled:
        *   `invoice.payment_succeeded`: A payment was successful. The backend can use this to provision or continue access.
        *   `customer.subscription.updated`: The subscription status changed (e.g., to `past_due`).
        *   `customer.subscription.deleted`: The subscription was canceled. was canceled. canceled. canceled. canceled. canceled. canceled. canceled. canceled. canceled. The backend updates the user's record to reflect this.

## 6. API Endpoints

The backend exposes a RESTful API to be consumed by the React frontend. All API routes are prefixed with `/api`. Authentication is required for most endpoints that handle user-specific data.

| Endpoint                               | Method | Auth? | Description                                                                                                                               |
| :------------------------------------- | :----- | :---- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication**                     |        |       |                                                                                                                                           |
| `/auth/register`                       | `POST` | No    | Creates a new user account or completes a pending registration.                                                                           |
| `/auth/login`                          | `POST` | No    | Authenticates a user and returns a JWT.                                                                                                   |
| `/auth/me`                             | `GET`  | Yes   | Fetches the profile of the currently authenticated user.                                                                                  |
| `/auth/progress`                       | `PUT`  | Yes   | Saves the user's progress during the onboarding flow.                                                                                     |
| **Jobs & Applications**                |        |       |                                                                                                                                           |
| `/jobs/feed`                           | `GET`  | Yes   | Returns a personalized and scored list of jobs that meet the 75% match threshold.                                                         |
| `/jobs/search`                         | `GET`  | Yes   | Performs a keyword-based job search without a strict match threshold.                                                                     |
| `/applications`                        | `GET`  | Yes   | Lists all of the user's tracked applications with filtering and pagination.                                                               |
| `/applications`                        | `POST` | Yes   | Creates a new application record, typically for manual entry.                                                                             |
| `/applications/:id`                    | `PATCH`| Yes   | Updates the status or details of a specific application.                                                                                  |
| **AI & Interview Prep**                |        |       |                                                                                                                                           |
| `/ai/generate-search-string`           | `POST` | Yes   | Uses OpenAI to generate a Boolean search string based on the user's profile.                                                              |
| `/interview/voice-token`               | `POST` | Yes   | Fetches an ephemeral token for the xAI Realtime API to conduct an Audio Mock Interview.                                                     |
| `/interview/chat`                      | `POST` | Yes   | Handles the back-and-forth chat interaction with the AI interview coach for all prep modes.                                               |
| **Billing (Stripe)**                   |        |       |                                                                                                                                           |
| `/stripe/create-checkout-session`      | `POST` | Yes   | Creates a Stripe Checkout session for a user to subscribe to a plan.                                                                      |
| `/stripe/create-portal-session`        | `POST` | Yes   | Creates a Stripe Customer Portal session for the user to manage their subscription.                                                       |
| `/webhooks/stripe`                     | `POST` | No    | Handles incoming webhooks from Stripe to manage subscription lifecycle events. This endpoint has special middleware to process the raw body. |

## 7. Deployment

The application is configured for continuous deployment on Render. The process is defined in the `render.yaml` file at the root of the repository.

*   **Service Type:** The application is deployed as a single `web` service.
*   **Environment:** The environment is `node`.
*   **Build Command:** `npm run install:all && npm run build`
    1.  `npm run install:all`: This custom script runs `npm install` in both the `client/` and `server/` directories concurrently to install all dependencies for both the frontend and backend.
    2.  `npm run build`: This script runs `react-scripts build` within the `client/` directory, which creates a production-ready, optimized static build of the React application in `client/build/`.
*   **Start Command:** `cd server && npm start`
    *   After the build is complete, Render changes to the `server/` directory and runs `npm start`, which executes `node index.js`. The Node.js server then serves both the API and the static React application from the `client/build` directory.
*   **Environment Variables:** All secrets (API keys, database URI, JWT secret) are configured as environment variables within the Render dashboard. The `render.yaml` file is configured to sync these variables.

## 8. Future Work: The Auto-Apply Engine

The most critical missing component in the Talendro platform is the **Auto-Apply Engine**. This system is the core of the product promise, responsible for programmatically submitting job applications to employer Applicant Tracking Systems (ATS) on behalf of the user. Its implementation is the highest priority for future development.

### Conceptual Architecture:

The engine will likely be a new, separate service or a distinct module within the existing backend. It will require a robust, queue-based architecture to handle the complexity and unreliability of interacting with dozens of different ATS platforms.

1.  **Application Queue:** When a job is identified as a match (and approved by the user, depending on their settings), an "apply" task will be added to a message queue (e.g., RabbitMQ or AWS SQS).
2.  **Task Worker:** A pool of worker processes will consume tasks from this queue.
3.  **ATS Adapter Layer:** Each worker will use an "adapter" specific to the target ATS (e.g., a `GreenhouseAdapter`, `LeverAdapter`). This adapter will contain the logic for navigating and submitting an application on that specific platform.
4.  **Browser Automation:** The adapters will use a headless browser automation tool like **Puppeteer** or **Playwright** to perform the application steps:
    *   Navigate to the `applyUrl`.
    *   Fill in the application form fields by mapping the user's `onboardingData` and tailored resume to the form inputs.
    *   Upload the tailored resume file.
    *   Handle any required checkboxes (e.g., work authorization, EEO questions).
    *   Submit the form.
5.  **State Management & Error Handling:** The worker must track the application's state (`in_progress`, `submitted`, `failed`) and update the `applications` collection in MongoDB. It needs sophisticated error handling to manage CAPTCHAs, unexpected form fields, or changes in the ATS interface.

This component represents a significant engineering challenge and will be the primary focus of the next development cycle.

## 9. Conclusion

This document provides a foundational understanding of the Talendro platform's architecture and technical implementation. It is a living document that should be updated as the system evolves. By maintaining a clear and comprehensive reference, the engineering team can build, scale, and maintain the platform effectively, ensuring the successful delivery of a powerful and reliable job search automation tool for our users.
