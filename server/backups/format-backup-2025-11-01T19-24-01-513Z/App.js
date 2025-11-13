import { Routes, Route } from 'react-router-dom'
import Header from '../ui/Header'
import Footer from '../ui/Footer'
import ScrollToTop from '../ui/ScrollToTop'

import Home from '../pages/Home'
import How from '../pages/How'
import Services from '../pages/Services'
import Navigator from '../pages/Navigator'
import Optional from '../pages/Optional'
import Pricing from '../pages/Pricing'
import About from '../pages/About'
import Story from '../pages/Story'
import Team from '../pages/Team'
import FAQ from '../pages/FAQ'
import Contact from '../pages/Contact'
import Veterans from '../pages/Veterans'
import Security from '../pages/Security'
import Privacy from '../pages/Privacy'
import Terms from '../pages/Terms'

import OnbWelcome from '../app/js/OnbWelcome'
import Onb1 from '../app/js/Onb1'
import Onb2 from '../app/js/Onb2'
import Onb3 from '../app/js/Onb3'
import Onb4 from '../app/js/Onb4'
import Onb5 from '../app/js/Onb5'
import OnbReview from '../app/js/OnbReview'
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
  return (
    <>
      <ScrollToTop />
      <Header />
      <main className="container py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<How />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/navigator" element={<Navigator />} />
          <Route path="/services/optional" element={<Optional />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/about/our-story" element={<Story />} />
          <Route path="/about/our-team" element={<Team />} />
          <Route path="/resources/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/veterans" element={<Veterans />} />
          <Route path="/security" element={<Security />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          {/* App */}
          <Route path="/app/onboarding/welcome" element={<OnbWelcome />} />
          <Route path="/app/onboarding/step-1" element={<Onb2 />} />
          <Route path="/app/onboarding/step-2" element={<Onb1 />} />
          <Route path="/app/onboarding/step-3" element={<Onb3 />} />
          {/* Direct access routes for testing/QA */}
          <Route path="/app/onboarding/create-profile" element={<Onb1 />} />
          <Route path="/app/onboarding/upload-resume" element={<Onb2 />} />
          <Route path="/app/onboarding/personal-information" element={<Onb3 />} />
          <Route path="/app/onboarding/step-4" element={<Onb4 />} />
          <Route path="/app/onboarding/step-5" element={<Onb5 />} />
          <Route path="/app/onboarding/review" element={<OnbReview />} />
          
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
      <Footer />
    </>
  )
}
