import { useState, useEffect } from 'react'
import FormRendererComprehensive from '../components/FormRendererComprehensive'
import step3Schema from '../schemas/step-3-comprehensive.json'

export default function Onb3() {
  const [prefillData, setPrefillData] = useState({})
  const [loading, setLoading] = useState(true)
  const [showWarning, setShowWarning] = useState(false)

  // Load previously saved data if available
  useEffect(() => {
    // Load previously saved form data from localStorage
    const savedData = localStorage.getItem('step-3-comprehensive')
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        setPrefillData(parsedData)
        console.log('🔍 Loaded previously saved data for step-3:', parsedData)
      } catch (error) {
        console.log('🔍 Error loading saved data for step-3:', error)
      }
    }
    
    // Clear any existing resume data to prevent prefill
    localStorage.removeItem('resumeData')
    setLoading(false)
  }, [])

  const handlePersonalInfoClick = () => {
    // Check if there are any blank required fields
    const blankFields = JSON.parse(localStorage.getItem('blankFields') || '[]')
    console.log('🔍 Onb3 validation check:', { blankFields })
    
    // Filter out fields that are populated from resume data
    // These fields should not block navigation even if they appear in blankFields
    const resumeData = JSON.parse(localStorage.getItem('resumeData') || '{}')
    const step3Data = JSON.parse(localStorage.getItem('step-3-comprehensive') || '{}')
    
    // Get all required fields from the schema
    const requiredFields = step3Schema.sections.flatMap(section => 
      section.fields?.filter(field => field.required) || []
    )
    
    // Check which required fields are actually empty
    const actuallyBlankFields = requiredFields.filter(field => {
      const fieldValue = step3Data[field.key]
      
      // For multiselect fields, check if array is empty
      if (field.type === 'multiselect') {
        return !fieldValue || !Array.isArray(fieldValue) || fieldValue.length === 0
      }
      
      // For checkbox fields, check if value is false or undefined
      if (field.type === 'checkbox') {
        return !fieldValue || fieldValue === false
      }
      
      // For other fields, check if value is empty
      return !fieldValue || fieldValue === ''
    })
    
    console.log('🔍 Onb3 actually blank fields:', actuallyBlankFields.map(f => f.key))
    
    if (actuallyBlankFields.length > 0) {
      setShowWarning(true)
      return
    }
    
    // If all fields are completed, proceed with navigation
    // (Data is already saved via auto-save functionality)
    console.log('🔍 Step-3 completed via top nav, data already saved to localStorage via auto-save')
    window.location.href = '/app/onboarding/step-4'
  }

  const handleFormSubmit = async (formData) => {
    console.log('🔍 Onb3 handleFormSubmit called with:', formData)
    
    // Save form data to localStorage first
    localStorage.setItem('step-3-comprehensive', JSON.stringify(formData))
    
    // Check if there are any blank required fields using the same logic as handlePersonalInfoClick
    const requiredFields = step3Schema.sections.flatMap(section => 
      section.fields?.filter(field => field.required) || []
    )
    
    // Check which required fields are actually empty
    const actuallyBlankFields = requiredFields.filter(field => {
      const fieldValue = formData[field.key]
      
      // For multiselect fields, check if array is empty
      if (field.type === 'multiselect') {
        return !fieldValue || !Array.isArray(fieldValue) || fieldValue.length === 0
      }
      
      // For checkbox fields, check if value is false or undefined
      if (field.type === 'checkbox') {
        return !fieldValue || fieldValue === false
      }
      
      // For other fields, check if value is empty
      return !fieldValue || fieldValue === ''
    })
    
    console.log('🔍 Onb3 handleFormSubmit - actually blank fields:', actuallyBlankFields.map(f => f.key))
    
    if (actuallyBlankFields.length > 0) {
      console.log('🔍 Onb3 handleFormSubmit - blocking navigation due to blank fields')
      setShowWarning(true)
      return
    }
    
    // If all fields are completed, save to localStorage and proceed
    // (Final save will happen when onboarding is complete)
    console.log('🔍 Step-3 completed, data already saved to localStorage via auto-save')
    
    // Navigate to next step
    window.location.href = '/app/onboarding/step-4'
  }

  if (loading) {
    return (
      <section>
        <div className="mb-6">
          <a href="/app/onboarding/step-2" className="text-talBlue hover:underline flex items-center gap-2">
            ← Back to Resume Upload
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
        <a href="/app/onboarding/step-2" className="text-talBlue hover:underline flex items-center gap-2">
          ← Back to Resume Upload
        </a>
      </div>
      <h1 className="h1">{step3Schema.title}</h1>
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
        schema={step3Schema}
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
    </section>
  )
}