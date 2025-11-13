import { useState, useEffect } from 'react'

export default function Onb3() {
  const [formData, setFormData] = useState({
    fullLegalName: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    city: '',
    stateRegion: '',
    country: 'US',
    streetAddress: '',
    postalCode: '',
    county: ''
  })

  // SIMPLE DIRECT APPROACH - NO COMPLEX COMPONENTS
  useEffect(() => {
    console.log('🚀 Onb3 - SIMPLE DIRECT APPROACH')
    
    try {
      // Get resume data from localStorage
      const resumeData = JSON.parse(localStorage.getItem('resumeData') || 'null')
      console.log('🚀 Onb3 - Resume data:', resumeData)
      
      if (resumeData?.prefill?.step3) {
        const step3 = resumeData.prefill.step3
        console.log('🚀 Onb3 - Step3 data:', step3)
        
        // DIRECT ASSIGNMENT - NO BULLSHIT
        setFormData({
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
        })
        
        console.log('🚀 Onb3 - Form data set:', formData)
      }
    } catch (error) {
      console.error('🚀 Onb3 - Error:', error)
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('🚀 Onb3 - Form submitted:', formData)
    // Navigate to next step
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Personal Information</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800">
          Please review all parsed data and complete any missing information, indicated by <span className="text-red-600 font-semibold">red highlighting</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Legal Name *</label>
              <input
                type="text"
                name="fullLegalName"
                value={formData.fullLegalName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">LinkedIn URL</label>
              <input
                type="url"
                name="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Address Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Street Address</label>
              <input
                type="text"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">State/Region *</label>
              <input
                type="text"
                name="stateRegion"
                value={formData.stateRegion}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">County</label>
              <input
                type="text"
                name="county"
                value={formData.county}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Country *</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
              </select>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-gray-100 border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <pre className="text-sm">{JSON.stringify(formData, null, 2)}</pre>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Back
          </button>
          
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Continue →
          </button>
        </div>
      </form>
    </div>
  )
}