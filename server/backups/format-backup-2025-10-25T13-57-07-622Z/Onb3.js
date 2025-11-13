import { useState, useEffect } from 'react'
import FormRendererComprehensive from '../components/FormRendererComprehensive'
import step3Schema from '../schemas/step-3-comprehensive.json'

export default function Onb3() {
  const [blankFields, setBlankFields] = useState(new Set())
  const [resumeData, setResumeData] = useState(null)

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
      />
    </div>
  )
}