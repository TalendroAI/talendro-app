import { useState, useEffect } from 'react'
import FormRenderer from '../components/FormRendererComprehensive'
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
      
      <FormRenderer 
        schema={step4Schema}
        initialData={prefillData}
        onSubmit={handleFormSubmit}
      />
    </section>
  )
}