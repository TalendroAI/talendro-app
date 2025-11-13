import { useState, useEffect } from 'react'
import FormRenderer from '../components/FormRendererComprehensive'
import step5Schema from '../schemas/step-5-comprehensive.json'

export default function Onb5() {
  const [prefillData, setPrefillData] = useState({})
  const [loading, setLoading] = useState(true)

  // No prefill data since no parsing was performed
  useEffect(() => {
    // Clear any existing resume data to prevent prefill
    localStorage.removeItem('resumeData')
    localStorage.removeItem('step-5')
    localStorage.removeItem('step5Data')
    setLoading(false)
  }, [])

  const handleFormSubmit = async (formData) => {
    // Save to server if needed
    try {
      await fetch('/api/profile/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step5: formData })
      })
    } catch (error) {
      console.log('Could not save to server, continuing with localStorage')
    }
  }

  if (loading) {
    return (
      <section>
        <div className="mb-6">
          <a href="/app/onboarding/step-4" className="text-talBlue hover:underline flex items-center gap-2">
            ← Back to Professional Information
          </a>
        </div>
        <h1 className="h1">Disclosures & Authorizations</h1>
        <p className="body mt-2">Loading...</p>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-6">
        <a href="/app/onboarding/step-4" className="text-talBlue hover:underline flex items-center gap-2">
          ← Back to Professional Information
        </a>
      </div>
      <h1 className="h1">{step5Schema.title}</h1>
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
              <p>Please review all parsed data and complete any missing information, indicated by <strong>red highlighting</strong>.</p>
            </div>
          </div>
        </div>
      </div>
      
      <FormRenderer 
        schema={step5Schema}
        initialData={prefillData}
        onSubmit={handleFormSubmit}
      />
    </section>
  )
}
