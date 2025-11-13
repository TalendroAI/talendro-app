import { useState, useEffect } from 'react'
import FormRendererComprehensive from '../components/FormRendererComprehensive'
import step3Schema from '../schemas/step-3-comprehensive.json'

export default function Onb3() {
  const [prefillData, setPrefillData] = useState({})
  const [collections, setCollections] = useState({})
  const [loading, setLoading] = useState(true)

  // DIRECT DATA POPULATION - NO MORE BULLSHIT
  useEffect(() => {
    console.log('🚀 Onb3 - DIRECT DATA POPULATION STARTING')
    
    try {
      setLoading(true)
      
      // Get resume data from localStorage
      const resumeData = JSON.parse(localStorage.getItem('resumeData') || 'null')
      console.log('🚀 Onb3 - Raw resume data:', resumeData)
      
      if (!resumeData) {
        console.log('🚀 Onb3 - No resume data found')
        setLoading(false)
        return
      }
      
      // DIRECT MAPPING - Extract data directly from the parsed structure
      let directData = {}
      
      // Get the step3 data directly
      if (resumeData.data?.prefill?.step3) {
        const step3 = resumeData.data.prefill.step3
        console.log('🚀 Onb3 - Step3 data found:', step3)
        
        // Map all the fields directly
        directData = {
          fullLegalName: step3.fullLegalName || '',
          email: step3.email || '',
          phone: step3.phone || '',
          linkedinUrl: step3.linkedinUrl || '',
          city: step3.city || '',
          stateRegion: step3.stateRegion || '',
          country: step3.country || 'US',
          streetAddress: step3.streetAddress || '',
          postalCode: step3.postalCode || '',
          county: step3.county || ''
        }
        
        console.log('🚀 Onb3 - Direct mapped data:', directData)
        
        // Handle collections directly
        const directCollections = {}
        if (step3.residentialHistory && Array.isArray(step3.residentialHistory)) {
          directCollections.residentialHistory = step3.residentialHistory
          console.log('🚀 Onb3 - Direct residential history:', directCollections.residentialHistory)
        } else {
          directCollections.residentialHistory = [{}]
        }
        
        setCollections(directCollections)
        console.log('🚀 Onb3 - Final collections set:', directCollections)
      }
      
      setPrefillData(directData)
      console.log('🚀 Onb3 - Final prefill data set:', directData)
      
    } catch (error) {
      console.error('🚀 Onb3 - Error in direct data population:', error)
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
      
      {/* User Instruction Note */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <div className="text-sm text-blue-700">
              <p>Please review all parsed data and complete any missing information, indicated by <strong style={{color: '#dc2626'}}>red highlighting</strong>.</p>
            </div>
          </div>
        </div>
      </div>
      
      <FormRendererComprehensive 
        schema={step3Schema}
        initialData={prefillData}
        collections={collections}
        onSubmit={handleFormSubmit}
      />
    </section>
  )
}