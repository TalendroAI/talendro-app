import { useState, useEffect } from 'react'
import FormRendererComprehensive from '../components/FormRendererComprehensive'
import step4Schema from '../schemas/step-4-comprehensive.json'

export default function Onb4() {
  const [prefillData, setPrefillData] = useState({})
  const [loading, setLoading] = useState(true)
  const [showWarning, setShowWarning] = useState(false)

  // No prefill data since no parsing was performed
  useEffect(() => {
    // Clear any existing resume data to prevent prefill
    localStorage.removeItem('resumeData')
    localStorage.removeItem('step-4')
    localStorage.removeItem('step4Data')
    setLoading(false)
  }, [])

  const handleDisclosuresClick = () => {
    // Check if there are any blank required fields
    const blankFields = JSON.parse(localStorage.getItem('blankFields') || '[]')
    if (blankFields.length > 0) {
      setShowWarning(true)
      return
    }
    // If all fields are completed, proceed with navigation
    window.location.href = '/app/onboarding/step-5'
  }

  const handleFormSubmit = async (formData) => {
    // Save to server if needed
    try {
      await fetch('/api/profile/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step4: formData })
      })
    } catch (error) {
      console.log('Could not save to server, continuing with localStorage')
    }
  }

  if (loading) {
    return (
      <section>
        <div className="mb-6">
          <a href="/app/onboarding/step-3" className="text-talBlue hover:underline flex items-center gap-2">
            ← Back to Personal Information
          </a>
        </div>
        <h1 className="h1">Professional Information</h1>
        <p className="body mt-2">Loading...</p>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-6">
        <a href="/app/onboarding/step-3" className="text-talBlue hover:underline flex items-center gap-2">
          ← Back to Personal Information
        </a>
      </div>
      <h1 className="h1">{step4Schema.title}</h1>
      <p className="body mt-2">Please complete all fields.</p>
      
      {/* User Instruction Note */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Please Review Parsed Data
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Please review all parsed data and complete any missing information, indicated by <span style={{color: '#dc2626', fontWeight: 'bold'}}>red highlighting</span>.</p>
            </div>
          </div>
        </div>
      </div>
      
      <FormRendererComprehensive 
        schema={step4Schema}
        initialData={prefillData}
        onSubmit={handleFormSubmit}
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
                You must complete all required fields (marked with red highlighting) before proceeding to Disclosures & Authorizations. Please fill out the missing information and try again.
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
    </section>
  )
}