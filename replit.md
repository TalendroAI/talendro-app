# Overview

Talendro is an AI-powered job search automation platform designed for mid-to-late career professionals. The application automatically finds job opportunities, tailors resumes for each position, and submits applications on behalf of users. The platform includes user onboarding, subscription management via Stripe, job application tracking, and analytics dashboards to monitor job search progress.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React and TypeScript using Vite as the build tool. The UI leverages shadcn/ui components with Radix UI primitives for accessible, modern interface components. Styling is implemented with Tailwind CSS using a custom design system with CSS variables for theming. The application uses wouter for client-side routing and TanStack Query for state management and API interactions.

## Backend Architecture
The backend is an Express.js server with TypeScript that follows a RESTful API design. The server implements middleware for request logging, JSON parsing, and error handling. Route registration is modularized with separate files for authentication, onboarding, job applications, and metrics endpoints. The storage layer uses a repository pattern with an interface abstraction for database operations.

## Authentication & Authorization
The application integrates with Replit's OpenID Connect authentication system using Passport.js strategies. Session management is handled through express-session with PostgreSQL session storage via connect-pg-simple. The authentication middleware protects API endpoints and maintains user session state across requests.

## Database Architecture
The system uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The schema includes tables for users, sessions, job applications, job searches, and user metrics. Database migrations are managed through Drizzle Kit, and the connection is established using Neon's serverless PostgreSQL driver.

## Payment Integration
Stripe is integrated for subscription management and payment processing. The system handles customer creation, subscription management, and webhook processing for payment events. The frontend includes Stripe Elements for secure payment form handling and subscription flow management.

## Job Search Automation
The platform implements automated job search functionality through scheduled job searches, application tracking, and metrics collection. Users can configure search parameters, and the system maintains application history with status tracking for comprehensive job search management.

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting with connection pooling
- **Drizzle ORM**: Type-safe database ORM with migration management

## Authentication Services
- **Replit Auth**: OpenID Connect authentication provider for user management
- **Passport.js**: Authentication middleware for Express.js applications

## Payment Processing
- **Stripe**: Payment processing, subscription management, and billing automation
- **Stripe Elements**: Secure payment form components for frontend integration

## UI Framework & Styling
- **Radix UI**: Accessible primitive components for React applications
- **shadcn/ui**: Pre-built component library with consistent design patterns
- **Tailwind CSS**: Utility-first CSS framework for responsive design

## Development & Build Tools
- **Vite**: Modern build tool with hot module replacement for development
- **TypeScript**: Type safety and enhanced developer experience
- **TanStack Query**: Data fetching, caching, and synchronization library

## Session & Data Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **wouter**: Lightweight client-side routing for React applications