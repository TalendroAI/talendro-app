import { Routes, Route, useLocation } from 'react-router-dom'
import Header from '../ui/Header'
import Footer from '../ui/Footer'
import ScrollToTop from '../ui/ScrollToTop'

import Home from '../pages/Home'
import How from '../pages/How'
import Services from '../pages/Services'
import Navigator from '../pages/Navigator'
import Optional from '../pages/Optional'
import Pricing from '../pages/Pricing'
import InterviewCoach from '../pages/InterviewCoach'
import InterviewCoachWithNav from '../pages/InterviewCoachWithNav'
import InterviewCoachPublic from '../pages/InterviewCoachPublic'
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

import Checkout from '../app/Checkout'
import CheckoutSuccess from '../app/CheckoutSuccess'
import CheckoutError from '../app/CheckoutError'
import PaymentSuccess from '../app/PaymentSuccess'

import Dashboard from '../pages/app/Dashboard'
import Profile from '../app/Profile'
import Agents from '../app/Agents'
import Applications from '../app/Applications'
import Billing from '../app/Billing'

export default function App(){
  const location = useLocation();
  const isInterviewCoachPublic = location.pathname === '/interview-coach' || location.pathname === '/interview-coach-final';
  
  return (
    <>
      <ScrollToTop />
      {!isInterviewCoachPublic && <Header />}
      <main className={isInterviewCoachPublic ? "" : "container py-10"}>
        <Routes>
          {/* Public route - NO header/footer */}
          <Route path="/interview-coach" element={<InterviewCoachPublic />} />
          <Route path="/interview-coach-final" element={<InterviewCoachPublic />} />
          
          {/* All other routes WITH header/footer */}
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<How />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/navigator" element={<Navigator />} />
          <Route path="/services/optional" element={<Optional />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/interview-coach-future" element={<InterviewCoachWithNav />} />
          <Route path="/about" element={<About />} />
          <Route path="/about/our-story" element={<Story />} />
          <Route path="/about/our-team" element={<Team />} />
          <Route path="/resources/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/veterans" element={<Veterans />} />
          <Route path="/security" element={<Security />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          {/* App — 10-Step Onboarding */}
          <Route path="/app/onboarding/*" element={<Onboarding />} />
          <Route path="/app/onboarding/welcome" element={<Onboarding />} />
          
          <Route path="/auth/sign-in" element={<SignIn />} />

          <Route path="/app/checkout" element={<Checkout />} />
          <Route path="/app/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/app/checkout/error" element={<CheckoutError />} />
          <Route path="/app/payment/success" element={<PaymentSuccess />} />

          <Route path="/app/dashboard" element={<Dashboard />} />
          <Route path="/app/profile" element={<Profile />} />
          <Route path="/app/agents" element={<Agents />} />
          <Route path="/app/applications" element={<Applications />} />
          <Route path="/app/billing" element={<Billing />} />
        </Routes>
      </main>
      {!isInterviewCoachPublic && <Footer />}
    </>
  )
}
