import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from '../ui/Header'
import Footer from '../ui/Footer'
import ScrollToTop from '../ui/ScrollToTop'

import Home from '../pages/Home'
import How from '../pages/How'
import Services from '../pages/Services'
import Navigator from '../pages/Navigator'
import Optional from '../pages/Optional'
import Pricing from '../pages/Pricing'
// InterviewCoach public pages removed — interview prep is now at /app/interview (subscriber-only)
// Old routes /interview-coach and /interview-coach-final redirect to /pricing
import About from '../pages/About'
import Story from '../pages/Story'
import Team from '../pages/Team'
import FAQ from '../pages/FAQ'
import Contact from '../pages/Contact'
import Veterans from '../pages/Veterans'
import Security from '../pages/Security'
import Privacy from '../pages/Privacy'
import Terms from '../pages/Terms'

import Onboarding from '../app/js/Onboarding'
import SignIn from '../auth/SignIn'
import CreateAccount from '../auth/CreateAccount'

import Checkout from '../app/Checkout'
import CheckoutSuccess from '../app/CheckoutSuccess'
import CheckoutError from '../app/CheckoutError'
import PaymentSuccess from '../app/PaymentSuccess'

// Resume Readiness Gate
import ResumeGate from '../app/resume/ResumeGate'
import ResumeUpload from '../app/resume/ResumeUpload'
import ResumeUpdate from '../app/resume/ResumeUpdate'
import ResumeCreate from '../app/resume/ResumeCreate'
import ResumeOptimize from '../app/resume/ResumeOptimize'
import ResumeReview from '../app/ResumeReview'
import DocumentDelivery from '../app/DocumentDelivery'

import Dashboard from '../pages/app/Dashboard'
import JobMatches from '../app/JobMatches'
import Profile from '../app/Profile'
import Agents from '../app/Agents'
import Applications from '../app/Applications'
import Billing from '../app/Billing'
import Jobs from '../app/Jobs'
import InterviewPrep from '../app/InterviewPrep'
import SalaryNegotiation from '../app/SalaryNegotiation'
import LinkedInOptimizer from '../app/LinkedInOptimizer'
import WeeklyStrategy from '../app/WeeklyStrategy'

// Auth
import { AuthProvider } from '../auth/AuthContext'
import ProtectedRoute from '../auth/ProtectedRoute'

// Routes that should render without the public header/footer
const NO_CHROME_ROUTES = [
  '/app/resume-gate',
  '/app/resume/upload',
  '/app/resume/update',
  '/app/resume/create',
  '/app/resume/optimize',
  '/app/resume',
  '/app/onboarding',
  '/app/document-delivery',
  '/app/create-account',
  '/auth/sign-in',
];

function AppRoutes() {
  const location = useLocation();
  const isAppRoute = NO_CHROME_ROUTES.some(r => location.pathname.startsWith(r));
  const hideChrome = isAppRoute;

  return (
    <>
      <ScrollToTop />
      {!hideChrome && <Header />}
      <main className={hideChrome ? "" : "container py-10"}>
        <Routes>
          {/* Old interview coach URLs — redirect to pricing */}
          <Route path="/interview-coach" element={<Navigate to="/pricing" replace />} />
          <Route path="/interview-coach-final" element={<Navigate to="/pricing" replace />} />

          {/* Public marketing routes WITH header/footer */}
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<How />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/navigator" element={<Navigator />} />
          <Route path="/services/asan" element={<Navigator />} />
          <Route path="/services/optional" element={<Optional />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/interview-coach-future" element={<Navigate to="/pricing" replace />} />
          <Route path="/about" element={<About />} />
          <Route path="/about/our-story" element={<Story />} />
          <Route path="/about/our-team" element={<Team />} />
          <Route path="/resources/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/veterans" element={<Veterans />} />
          <Route path="/security" element={<Security />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* Auth routes */}
          <Route path="/auth/sign-in" element={<SignIn />} />
          <Route path="/app/create-account" element={<CreateAccount />} />

          {/* Checkout (public — payment happens before account creation) */}
          <Route path="/app/checkout" element={<Checkout />} />
          <Route path="/app/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/app/checkout/error" element={<CheckoutError />} />
          <Route path="/app/payment/success" element={<PaymentSuccess />} />

          {/* ── Protected: Resume Gate (post-payment, pre-onboarding) ── */}
          <Route path="/app/resume-gate" element={
            <ProtectedRoute><ResumeGate /></ProtectedRoute>
          } />
          <Route path="/app/resume/upload" element={
            <ProtectedRoute><ResumeUpload /></ProtectedRoute>
          } />
          <Route path="/app/resume/update" element={
            <ProtectedRoute><ResumeUpdate /></ProtectedRoute>
          } />
          <Route path="/app/resume/create" element={
            <ProtectedRoute><ResumeCreate /></ProtectedRoute>
          } />
          <Route path="/app/resume/optimize" element={
            <ProtectedRoute><ResumeOptimize /></ProtectedRoute>
          } />

          {/* ── Protected: Document Delivery (post-onboarding, pre-dashboard) ── */}
          <Route path="/app/document-delivery" element={
            <ProtectedRoute><DocumentDelivery /></ProtectedRoute>
          } />

          {/* ── Protected: Onboarding ── */}
          <Route path="/app/onboarding/*" element={
            <ProtectedRoute><Onboarding /></ProtectedRoute>
          } />
          <Route path="/app/onboarding/welcome" element={
            <ProtectedRoute><Onboarding /></ProtectedRoute>
          } />

          {/* ── Protected: Dashboard and app pages ── */}
          <Route path="/app/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/app/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/app/agents" element={
            <ProtectedRoute><Agents /></ProtectedRoute>
          } />
          <Route path="/app/applications" element={
            <ProtectedRoute><Applications /></ProtectedRoute>
          } />
          <Route path="/app/billing" element={
            <ProtectedRoute><Billing /></ProtectedRoute>
          } />
          <Route path="/app/jobs" element={
            <ProtectedRoute><Jobs /></ProtectedRoute>
          } />
          <Route path="/app/job-matches" element={
            <ProtectedRoute><JobMatches /></ProtectedRoute>
          } />
          <Route path="/app/resume" element={
            <ProtectedRoute><ResumeReview /></ProtectedRoute>
          } />
          <Route path="/app/interview" element={
            <ProtectedRoute><InterviewPrep /></ProtectedRoute>
          } />
          <Route path="/app/salary-negotiation" element={
            <ProtectedRoute><SalaryNegotiation /></ProtectedRoute>
          } />
          <Route path="/app/linkedin" element={
            <ProtectedRoute><LinkedInOptimizer /></ProtectedRoute>
          } />
          <Route path="/app/linkedin-optimizer" element={
            <ProtectedRoute><LinkedInOptimizer /></ProtectedRoute>
          } />
          <Route path="/app/strategy" element={
            <ProtectedRoute><WeeklyStrategy /></ProtectedRoute>
          } />
          <Route path="/app/weekly-strategy" element={
            <ProtectedRoute><WeeklyStrategy /></ProtectedRoute>
          } />
          <Route path="/app/resume-review" element={
            <ProtectedRoute><ResumeReview /></ProtectedRoute>
          } />
        </Routes>
      </main>
      {!hideChrome && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
