import { useState, useEffect } from 'react'
import FormRendererComprehensive from '../components/FormRendererComprehensive'
import step3Schema from '../schemas/step-3-comprehensive.json'

export default function Onb3() {
  const [blankFields, setBlankFields] = useState(new Set())
  const [resumeData, setResumeData] = useState(null)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    console.log('🚀 Onb3 - Loading resume data')
    
    try {
      const storedData = JSON.parse(localStorage.getItem('resumeData') || 'null')
      console.log('🚀 Onb3 - Stored resume data:', storedData)
      console.log('🚀 Onb3 - Step3 data:', storedData?.prefill?.step3)
      console.log('🚀 Onb3 - Full name:', storedData?.prefill?.step3?.fullLegalName)
      console.log('🚀 Onb3 - Email:', storedData?.prefill?.step3?.email)
      console.log('🚀 Onb3 - Phone:', storedData?.prefill?.step3?.phone)
      console.log('🚀 Onb3 - City:', storedData?.prefill?.step3?.city)
      console.log('🚀 Onb3 - State:', storedData?.prefill?.step3?.stateRegion)
      setResumeData(storedData)
    } catch (error) {
      console.error('🚀 Onb3 - Error loading resume data:', error)
    }
  }, [])

  const handleProfessionalInfoClick = async (formData) => {
    // Get blankFields from localStorage (updated by FormRendererComprehensive)
    const storedBlankFields = JSON.parse(localStorage.getItem('blankFields') || '[]')
    console.log('🚀 Onb3 - handleProfessionalInfoClick called', { storedBlankFields })
    
    // Check if there are any blank required fields
    if (storedBlankFields.length > 0) {
      console.log('🚀 Onb3 - Validation failed, showing warning popup')
      setShowWarning(true)
      return
    }
    
    console.log('🚀 Onb3 - Validation passed, navigating to step-4')
    // If all fields are completed, proceed with navigation
    window.location.href = '/app/onboarding/step-4'
  }

  return (
    <div className="container py-10">
      <div className="mb-6">
        <a href="/app/onboarding/step-2" className="text-talBlue hover:underline flex items-center gap-2">
          ← Back to Create Profile
        </a>
      </div>
      <h1 className="h1">Personal Information</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800">
          Please review all parsed data and complete any missing information, indicated by <span style={{color: '#dc2626', fontWeight: 'bold'}}>red highlighting</span>.
        </p>
      </div>

      <FormRendererComprehensive
        schema={step3Schema}
        resumeData={resumeData}
        blankFields={blankFields}
        setBlankFields={setBlankFields}
        onSubmit={handleProfessionalInfoClick}
      />
      
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
    </div>
  )
}