import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Button from './Button'

export default function Header(){
  const [open, setOpen] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const location = useLocation()
  const isOnWelcomePage = location.pathname === '/app/onboarding/welcome'
  const isOnUploadResumePage = location.pathname === '/app/onboarding/step-1'
  const isOnCreateProfilePage = location.pathname === '/app/onboarding/step-2'
  const isOnPersonalInfoPage = location.pathname === '/app/onboarding/step-3'
  const isOnProfessionalInfoPage = location.pathname === '/app/onboarding/step-4'
  const isOnDisclosuresPage = location.pathname === '/app/onboarding/step-5'
  const isOnReviewPage = location.pathname === '/app/onboarding/review'
  
  const handleCreateProfileClick = () => {
    if (isOnUploadResumePage) {
      // Check if a file has been selected by looking for the file input element
      const fileInput = document.querySelector('input[type="file"]')
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        setShowWarning(true)
        return
      }
    }
    // If file is selected or not on upload page, proceed with normal navigation
    window.location.href = '/app/onboarding/step-2'
  }

  const handleProfessionalInfoClick = () => {
    if (isOnPersonalInfoPage) {
      // Check if all required fields are completed by looking for blankFields in localStorage
      const blankFields = JSON.parse(localStorage.getItem('blankFields') || '[]')
      if (blankFields.length > 0) {
        setShowWarning(true)
        return
      }
    }
    // If all fields are completed or not on personal info page, proceed with navigation
    window.location.href = '/app/onboarding/step-4'
  }

  const handleDisclosuresClick = () => {
    if (isOnProfessionalInfoPage) {
      // Check if all required fields are completed by looking for blankFields in localStorage
      const blankFields = JSON.parse(localStorage.getItem('blankFields') || '[]')
      if (blankFields.length > 0) {
        setShowWarning(true)
        return
      }
    }
    // If all fields are completed or not on professional info page, proceed with navigation
    window.location.href = '/app/onboarding/step-5'
  }

  const handlePaymentClick = () => {
    if (isOnDisclosuresPage) {
      // Check if all required fields are completed by looking for blankFields in localStorage
      const blankFields = JSON.parse(localStorage.getItem('blankFields') || '[]')
      if (blankFields.length > 0) {
        setShowWarning(true)
        return
      }
    }
    // If all fields are completed or not on disclosures page, proceed with navigation
    window.location.href = '/app/checkout'
  }

  const handlePersonalInfoClick = () => {
    // Check if all required fields are completed for Create Profile step
    const step1Data = JSON.parse(localStorage.getItem('onboarding_step1') || '{}')
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword', 'agreeToTerms']
    const incompleteFields = requiredFields.filter(field => {
      if (field === 'agreeToTerms') {
        return !step1Data[field]
      }
      return !step1Data[field] || step1Data[field].toString().trim() === ''
    })
    
    if (incompleteFields.length > 0) {
      setShowWarning(true)
      return
    }
    // If all fields are completed, proceed with navigation
    window.location.href = '/app/onboarding/step-3'
  }
  
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
          {isOnUploadResumePage ? (
            <Button onClick={handleCreateProfileClick}>Create Profile</Button>
          ) : isOnPersonalInfoPage ? (
            <Button onClick={handleProfessionalInfoClick}>Professional Information</Button>
          ) : isOnProfessionalInfoPage ? (
            <Button onClick={handleDisclosuresClick}>Disclosures & Authorizations</Button>
          ) : isOnDisclosuresPage ? (
            <Button onClick={handlePaymentClick}>Proceed to Payment</Button>
          ) : (
            isOnCreateProfilePage ? (
              <Button onClick={handlePersonalInfoClick}>Personal Information</Button>
            ) : (
              <Link to={isOnWelcomePage ? "/app/onboarding/step-1" : isOnReviewPage ? "/app/dashboard" : "/app/onboarding/welcome"}>
                <Button>{isOnWelcomePage ? "Upload Resume" : isOnReviewPage ? "Dashboard" : "Get Started"}</Button>
              </Link>
            )
          )}
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
            {isOnUploadResumePage ? (
              <Button className="mt-2" onClick={handleCreateProfileClick}>Create Profile</Button>
            ) : isOnPersonalInfoPage ? (
              <Button className="mt-2" onClick={handleProfessionalInfoClick}>Professional Information</Button>
            ) : isOnProfessionalInfoPage ? (
              <Button className="mt-2" onClick={handleDisclosuresClick}>Disclosures & Authorizations</Button>
            ) : isOnDisclosuresPage ? (
              <Button className="mt-2" onClick={handlePaymentClick}>Proceed to Payment</Button>
            ) : (
              isOnCreateProfilePage ? (
                <Button className="mt-2" onClick={handlePersonalInfoClick}>Personal Information</Button>
              ) : (
                <Link to={isOnWelcomePage ? "/app/onboarding/step-1" : isOnReviewPage ? "/app/dashboard" : "/app/onboarding/welcome"}>
                  <Button className="mt-2">{isOnWelcomePage ? "Upload Resume" : isOnReviewPage ? "Dashboard" : "Get Started"}</Button>
                </Link>
              )
            )}
          </div>
        </div>
      )}
      
      {/* Warning Popup */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Complete Required Information</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm" style={{color: '#dc2626'}}>
                You must complete all required fields before proceeding to the next step. Please fill out the missing information and try again.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowWarning(false)}
                className="btn btn-primary"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
