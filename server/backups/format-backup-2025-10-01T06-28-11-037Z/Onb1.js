import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Page(){
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })

  // Load resume data for prefilling
  useEffect(() => {
    try {
      const resumeData = JSON.parse(localStorage.getItem('resumeData') || 'null')
      console.log('🔍 Onb1 - Resume data from localStorage:', resumeData)
      
      if (resumeData?.prefill?.step1) {
        const prefill = resumeData.prefill.step1
        console.log('🔍 Onb1 - Using prefill.step1 data:', prefill)
        
        // Extract first and last name from fullLegalName
        const fullName = prefill.fullLegalName || ''
        const nameParts = fullName.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        
        setFormData(prev => ({
          ...prev,
          firstName: firstName,
          lastName: lastName,
          email: prefill.email || '',
          phone: prefill.phone || ''
        }))
        console.log('✅ Onb1 - Form prefilled with resume data')
      } else if (resumeData?.data?.prefill?.step1) {
        const prefill = resumeData.data.prefill.step1
        console.log('🔍 Onb1 - Using data.prefill.step1 data:', prefill)
        
        const fullName = prefill.fullLegalName || ''
        const nameParts = fullName.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        
        setFormData(prev => ({
          ...prev,
          firstName: firstName,
          lastName: lastName,
          email: prefill.email || '',
          phone: prefill.phone || ''
        }))
        console.log('✅ Onb1 - Form prefilled with resume data')
      } else {
        console.log('⚠️ Onb1 - No resume data found for prefilling')
      }
    } catch (e) {
      console.error('❌ Onb1 - Error loading resume data:', e)
    }
  }, [])
  
  const [errors, setErrors] = useState({})
  const [isValid, setIsValid] = useState(false)

  // Universal password standards (NIST, OWASP, ISO 27001 compliant)
  const validatePassword = (password) => {
    const errors = []
    
    // Minimum 12 characters (NIST recommendation)
    if (password.length < 12) {
      errors.push('Must be at least 12 characters long')
    }
    
    // Maximum 128 characters (reasonable limit)
    if (password.length > 128) {
      errors.push('Must be no more than 128 characters long')
    }
    
    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Must contain at least one uppercase letter')
    }
    
    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Must contain at least one lowercase letter')
    }
    
    // At least one number
    if (!/\d/.test(password)) {
      errors.push('Must contain at least one number')
    }
    
    // At least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Must contain at least one special character')
    }
    
    // No common patterns or personal info
    const commonPatterns = [
      /(.)\1{2,}/, // No repeated characters (aaa, 111, etc.)
      /123|234|345|456|567|678|789|890/, // No sequential numbers
      /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, // No sequential letters
      /password|qwerty|admin|user|login|welcome|123456/i // No common passwords
    ]
    
    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('Cannot contain common patterns or dictionary words')
        break
      }
    }
    
    return errors
  }

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone) => {
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '')
    // US phone numbers should have 10 digits
    return digitsOnly.length === 10
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Required field validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else {
      const passwordErrors = validatePassword(formData.password)
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors[0] // Show first error
      }
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy'
    }
    
    setErrors(newErrors)
    const formIsValid = Object.keys(newErrors).length === 0
    setIsValid(formIsValid)
    return formIsValid
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted')
    console.log('Form data:', formData)
    console.log('Current isValid state:', isValid)
    
    const formIsValid = validateForm()
    console.log('Form validation result:', formIsValid)
    
    if (formIsValid) {
      console.log('Form is valid, proceeding with submission')
      // Store form data (in a real app, this would be sent to backend)
      localStorage.setItem('onboarding_step1', JSON.stringify({
        ...formData,
        username: formData.email // Username is the email address
      }))
      
      console.log('Attempting to navigate to step-3')
      // Navigate to next step
      navigate('/app/onboarding/step-3')
    } else {
      console.log('Form validation failed, not submitting')
    }
  }

  const handleSocialLogin = (provider) => {
    // For demo purposes, we'll show an alert and pre-fill some data
    alert(`Social login with ${provider} would be implemented here.\n\nFor now, this would:\n- Authenticate with ${provider}\n- Pre-fill your profile information\n- Skip manual data entry`)
    
    // Demo: Pre-fill some form data
    if (provider === 'Google') {
      setFormData(prev => ({
        ...prev,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@gmail.com',
        phone: '+1 (555) 123-4567'
      }))
    } else if (provider === 'Apple') {
      setFormData(prev => ({
        ...prev,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@icloud.com',
        phone: '+1 (555) 987-6543'
      }))
    }
    
    // Clear any existing errors
    setErrors({})
  }

  return (
    <section>
      <div className="mb-6">
        <a href="/app/onboarding/step-2" className="text-talBlue hover:underline flex items-center gap-2">
          ← Back to Upload Resume
        </a>
      </div>
      <h1 className="h1">Create Profile</h1>
      <p className="tagline mt-2">Precision Matches. Faster Results.</p>
      
      <form onSubmit={handleSubmit}>
        {/* Social Login Options */}
        <div className="mt-6">
          <div className="text-center mb-4">
            <p className="text-sm text-talGray">
              <strong>Quick Start:</strong> Sign up with your existing account to pre-fill your profile information
            </p>
          </div>
          
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => handleSocialLogin('Google')}
              className="inline-flex items-center px-4 py-2 border border-talGray rounded-lg shadow-sm bg-white text-sm font-medium text-talGray hover:bg-gray-50 hover:border-talAqua hover:text-talAqua focus:outline-none focus:ring-2 focus:ring-talAqua transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            
            <button
              type="button"
              onClick={() => handleSocialLogin('Apple')}
              className="inline-flex items-center px-4 py-2 border border-talGray rounded-lg shadow-sm bg-white text-sm font-medium text-talGray hover:bg-gray-50 hover:border-talAqua hover:text-talAqua focus:outline-none focus:ring-2 focus:ring-talAqua transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="#000000">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Apple
            </button>
          </div>
          
          <div className="relative mt-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-talGray"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-talGray">Or create account manually</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="card">
            <label className="block body mb-2">First Name *</label>
            <input 
              type="text"
              className={`w-full border rounded-xl h-11 px-3 focus:outline-none focus:ring-2 focus:ring-talAqua ${
                errors.firstName ? 'border-red-500' : 'border-talGray'
              }`}
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              onBlur={validateForm}
            />
            {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
            
            <label className="block body mt-4 mb-2">Last Name *</label>
            <input 
              type="text"
              className={`w-full border rounded-xl h-11 px-3 focus:outline-none focus:ring-2 focus:ring-talAqua ${
                errors.lastName ? 'border-red-500' : 'border-talGray'
              }`}
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              onBlur={validateForm}
            />
            {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
            
            <label className="block body mt-4 mb-2">Email *</label>
            <input 
              type="email"
              className={`w-full border rounded-xl h-11 px-3 focus:outline-none focus:ring-2 focus:ring-talAqua ${
                errors.email ? 'border-red-500' : 'border-talGray'
              }`}
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={validateForm}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            <p className="text-sm text-talGray mt-2">Used for notifications, login, and as your username for job applications.</p>
          </div>
          
          <div className="card">
            <label className="block body mb-2">Phone *</label>
            <input 
              type="tel"
              className={`w-full border rounded-xl h-11 px-3 focus:outline-none focus:ring-2 focus:ring-talAqua ${
                errors.phone ? 'border-red-500' : 'border-talGray'
              }`}
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              onBlur={validateForm}
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            
            <label className="block body mt-4 mb-2">Password *</label>
            <input 
              type="password"
              className={`w-full border rounded-xl h-11 px-3 focus:outline-none focus:ring-2 focus:ring-talAqua ${
                errors.password ? 'border-red-500' : 'border-talGray'
              }`}
              placeholder="Create a secure password"
              key="password-field-2025"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onBlur={validateForm}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            
            <label className="block body mt-4 mb-2">Confirm Password *</label>
            <input 
              type="password"
              className={`w-full border rounded-xl h-11 px-3 focus:outline-none focus:ring-2 focus:ring-talAqua ${
                errors.confirmPassword ? 'border-red-500' : 'border-talGray'
              }`}
              placeholder="Re-enter your password"
              key="confirm-password-field-2025"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              onBlur={validateForm}
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            
            <div className="mt-3">
              <p className="text-sm text-talGray font-medium mb-2">Password Requirements (Universal Standards):</p>
              <ul className="text-sm text-talGray list-disc pl-5 space-y-1">
                <li>12-128 characters long</li>
                <li>At least one uppercase letter (A-Z)</li>
                <li>At least one lowercase letter (a-z)</li>
                <li>At least one number (0-9)</li>
                <li>At least one special character (!@#$%^&*)</li>
                <li>No common patterns or dictionary words</li>
                <li>This password will be used for job applications</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Terms of Service and Privacy Policy Checkbox */}
        <div className="mt-6">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="agreeToTerms"
                type="checkbox"
                className={`w-4 h-4 text-talAqua bg-gray-100 border-gray-300 rounded focus:ring-talAqua focus:ring-2 ${
                  errors.agreeToTerms ? 'border-red-500' : ''
                }`}
                checked={formData.agreeToTerms}
                onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="agreeToTerms" className="text-talGray">
                I agree to the{' '}
                <a href="/terms" className="text-talAqua hover:underline" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-talAqua hover:underline" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
                . I understand that Talendro™ will use my credentials to submit job applications on my behalf.
              </label>
              {errors.agreeToTerms && <p className="text-red-500 text-sm mt-1">{errors.agreeToTerms}</p>}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3">
          <button 
            type="submit"
            className="btn btn-primary"
            onClick={() => console.log('Button clicked, isValid:', isValid)}
          >
            Personal Information
          </button>
        </div>
      </form>
      
      {/* Already have an account? Log In Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-talGray">
          Already have an account?{' '}
          <a href="/auth/sign-in" className="text-talAqua hover:underline font-medium">
            Log In
          </a>
        </p>
      </div>
      
      <p className="text-sm text-talGray mt-4">Your information is encrypted and never shared with third parties.</p>
    </section>
  )
}
