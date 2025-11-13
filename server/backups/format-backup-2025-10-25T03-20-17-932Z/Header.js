import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Button from './Button'

export default function Header(){
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const isOnWelcomePage = location.pathname === '/app/onboarding/welcome'
  const isOnUploadResumePage = location.pathname === '/app/onboarding/step-1'
  const isOnCreateProfilePage = location.pathname === '/app/onboarding/step-2'
  const isOnPersonalInfoPage = location.pathname === '/app/onboarding/step-3'
  const isOnProfessionalInfoPage = location.pathname === '/app/onboarding/step-4'
  const isOnDisclosuresPage = location.pathname === '/app/onboarding/step-5'
  const isOnReviewPage = location.pathname === '/app/onboarding/review'
  return (
    <header className="border-b border-gray-200">
      <div className="container flex items-center justify-between py-4">
        <Link to="/" className="font-mont font-bold text-xl text-talBlue">Talendro™</Link>
        <nav className="hidden md:flex items-center gap-6 font-mont">
          <Link to="/how-it-works">How It Works</Link>
          <div className="group relative">
            <span className="inline-flex items-center gap-1 cursor-pointer">Services ▾</span>
            <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition bg-white shadow-card rounded-xl p-3 top-full left-0 w-64">
              <Link className="block px-3 py-2 rounded-lg hover:bg-gray-50" to="/services/navigator">Talendro™ Navigator</Link>
              <Link className="block px-3 py-2 rounded-lg hover:bg-gray-50" to="/services/optional">Optional AI Services</Link>
            </div>
          </div>
          <Link to="/pricing">Pricing</Link>
          <div className="group relative">
            <span className="inline-flex items-center gap-1 cursor-pointer">About ▾</span>
            <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition bg-white shadow-card rounded-xl p-3 top-full left-0 w-56">
              <Link className="block px-3 py-2 rounded-lg hover:bg-gray-50" to="/about/our-story">Our Story</Link>
              <Link className="block px-3 py-2 rounded-lg hover:bg-gray-50" to="/about/our-team">Our Team</Link>
            </div>
          </div>
          <div className="group relative">
            <span className="inline-flex items-center gap-1 cursor-pointer">Resources ▾</span>
            <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition bg-white shadow-card rounded-xl p-3 top-full left-0 w-56">
              <Link className="block px-3 py-2 rounded-lg hover:bg-gray-50" to="/resources/faq">FAQ</Link>
              <span className="block px-3 py-2 text-talGray">Blog (future)</span>
            </div>
          </div>
          <Link to="/contact">Contact</Link>
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/auth/sign-in" className="text-talBlue hover:underline">Sign In</Link>
          <Link to={isOnWelcomePage ? "/app/onboarding/step-1" : isOnUploadResumePage ? "/app/onboarding/step-2" : isOnCreateProfilePage ? "/app/onboarding/step-3" : isOnPersonalInfoPage ? "/app/onboarding/step-4" : isOnProfessionalInfoPage ? "/app/onboarding/step-5" : isOnDisclosuresPage ? "/app/checkout" : isOnReviewPage ? "/app/dashboard" : "/app/onboarding/welcome"}>
            <Button>{isOnWelcomePage ? "Upload Resume" : isOnUploadResumePage ? "Create Profile" : isOnCreateProfilePage ? "Personal Information" : isOnPersonalInfoPage ? "Professional Information" : isOnProfessionalInfoPage ? "Disclosures & Authorizations" : isOnDisclosuresPage ? "Proceed to Payment" : isOnReviewPage ? "Dashboard" : "Get Started"}</Button>
          </Link>
        </div>
        <button className="md:hidden" onClick={()=>setOpen(!open)} aria-label="Open Menu">☰</button>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-200">
          <div className="container py-4 flex flex-col gap-3">
            <Link to="/how-it-works">How It Works</Link>
            <span className="font-semibold">Services</span>
            <div className="pl-3 flex flex-col gap-2">
              <Link to="/services/navigator">Talendro™ Navigator</Link>
              <Link to="/services/optional">Optional AI Services</Link>
            </div>
            <Link to="/pricing">Pricing</Link>
            <span className="font-semibold">About</span>
            <div className="pl-3 flex flex-col gap-2">
              <Link to="/about/our-story">Our Story</Link>
              <Link to="/about/our-team">Our Team</Link>
            </div>
            <span className="font-semibold">Resources</span>
            <div className="pl-3 flex flex-col gap-2">
              <Link to="/resources/faq">FAQ</Link>
              <span className="text-talGray">Blog (future)</span>
            </div>
            <Link to="/contact">Contact</Link>
            <Link to="/auth/sign-in" className="text-talBlue hover:underline">Sign In</Link>
            <Link to={isOnWelcomePage ? "/app/onboarding/step-1" : isOnUploadResumePage ? "/app/onboarding/step-2" : isOnCreateProfilePage ? "/app/onboarding/step-3" : isOnPersonalInfoPage ? "/app/onboarding/step-4" : isOnProfessionalInfoPage ? "/app/onboarding/step-5" : isOnDisclosuresPage ? "/app/checkout" : isOnReviewPage ? "/app/dashboard" : "/app/onboarding/welcome"}>
              <Button className="mt-2">{isOnWelcomePage ? "Upload Resume" : isOnUploadResumePage ? "Create Profile" : isOnCreateProfilePage ? "Personal Information" : isOnPersonalInfoPage ? "Professional Information" : isOnProfessionalInfoPage ? "Disclosures & Authorizations" : isOnDisclosuresPage ? "Proceed to Payment" : isOnReviewPage ? "Dashboard" : "Get Started"}</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
