import { useState, useEffect } from 'react'
import FormRendererComprehensive from '../components/FormRendererComprehensive'
import step4Schema from '../schemas/step-4-comprehensive.json'

export default function Onb4() {
  const [prefillData, setPrefillData] = useState({})
  const [loading, setLoading] = useState(true)

  // No prefill data since no parsing was performed
  useEffect(() => {
    // Clear any existing resume data to prevent prefill
    localStorage.removeItem('resumeData')
    localStorage.removeItem('step-4')
    localStorage.removeItem('step4Data')
    setLoading(false)
  }, [])

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
    </section>
  )
}