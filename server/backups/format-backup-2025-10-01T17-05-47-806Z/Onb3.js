import { useState, useEffect } from 'react'
import FormRenderer from '../components/FormRendererComprehensive'
import step3Schema from '../schemas/step-3-comprehensive.json'

export default function Onb3() {
  const [prefillData, setPrefillData] = useState({})
  const [loading, setLoading] = useState(true)

  // Load resume data for prefilling
  useEffect(() => {
    try {
      setLoading(true)
      let combinedData = {}

      // Try to get resume data from localStorage
      try {
        const resumeData = JSON.parse(localStorage.getItem('resumeData') || 'null')
        console.log('🔍 Onb3 - Resume data from localStorage:', resumeData)
        
        if (resumeData?.data?.prefill?.step3) {
          combinedData.prefill = { step3: resumeData.data.prefill.step3 }
          console.log('🔍 Onb3 - Using data.prefill.step3 data:', resumeData.data.prefill.step3)
        } else if (resumeData?.prefill?.step3) {
          combinedData.prefill = { step3: resumeData.prefill.step3 }
          console.log('🔍 Onb3 - Using prefill.step3 data:', resumeData.prefill.step3)
        } else if (resumeData) {
          // Try to use the raw resume data directly
          console.log('🔍 Onb3 - Using raw resume data:', resumeData)
          combinedData = { ...combinedData, ...resumeData }
        }
      } catch (e) {
        console.error('Error loading resume data from localStorage:', e)
      }

      setPrefillData(combinedData)
      console.log('🔍 Onb3 - Final prefill data:', combinedData)
    } catch (e) {
      console.error('Failed to load prefill data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleFormSubmit = async (formData) => {
    // Save to server if needed
    try {
      await fetch('/api/profile/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step3: formData })
      })
    } catch (error) {
      console.log('Could not save to server, continuing with localStorage')
    }
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem('step3Data', JSON.stringify(formData))
      console.log('✅ Step 3 data saved to localStorage:', formData)
    } catch (error) {
      console.error('Failed to save step 3 data to localStorage:', error)
    }
  }

  if (loading) {
    return (
      <section>
        <div className="mb-6">
          <a href="/app/onboarding/step-1" className="text-talBlue hover:underline flex items-center gap-2">
            ← Back to Create Profile
          </a>
        </div>
        <h1 className="h1">Personal Information</h1>
        <p className="body mt-2">Loading...</p>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-6">
        <a href="/app/onboarding/step-1" className="text-talBlue hover:underline flex items-center gap-2">
          ← Back to Create Profile
        </a>
      </div>
      <h1 className="h1">{step3Schema.title}</h1>
      <p className="body mt-2">Please complete all fields.</p>
      
      <FormRenderer 
        schema={step3Schema}
        initialData={prefillData}
        onSubmit={handleFormSubmit}
      />
    </section>
  )
}