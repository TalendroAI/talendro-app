import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCountiesForState } from '../lib/stateCounties'

// Helper to get nested value from object using dot notation
function getNestedValue(obj, path) {
  if (!obj || !path) return null
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return null
    if (key.includes('[') && key.includes(']')) {
      // Handle array notation like "listItem[0]"
      const [arrayKey, indexStr] = key.split('[')
      const index = parseInt(indexStr.replace(']', ''))
      return current[arrayKey]?.[index]
    }
    return current[key]
  }, obj)
}

// Helper to extract prefill value from multiple sources
function extractPrefillValue(prefillKeys, prefillData) {
  if (!prefillKeys || !prefillData) return ''
  
  for (const key of prefillKeys) {
    const value = getNestedValue(prefillData, key)
    if (value !== null && value !== undefined && value !== '') {
      return typeof value === 'object' ? value.parsed || value.raw || value.value || '' : value
    }
  }
  return ''
}

// Helper to map resume data to form fields
function mapResumeDataToFields(resumeData, fieldKey) {
  console.log('🔍 mapResumeDataToFields:', { fieldKey, resumeData })
  
  // Try multiple data sources
  let data = null
  
  if (resumeData?.prefill?.step3) {
    data = resumeData.prefill.step3
    console.log('🔍 Using prefill.step3 data:', data)
  } else if (resumeData?.prefill) {
    data = resumeData.prefill
    console.log('🔍 Using prefill data:', data)
  } else {
    console.log('🔍 No prefill data found, trying direct mapping')
    // Try direct mapping from the resume data structure
    return mapDirectResumeData(resumeData, fieldKey)
  }
  
  // Direct mappings from parsed resume data
  const mappings = {
    firstName: () => {
      const fullName = data.fullLegalName || data.firstName
      if (fullName) {
        return fullName.split(' ')[0] || ''
      }
      return data.firstName || ''
    },
    
    lastName: () => {
      const fullName = data.fullLegalName || data.lastName
      if (fullName) {
        const parts = fullName.split(' ')
        return parts[parts.length - 1] || ''
      }
      return data.lastName || ''
    },
    
    email: () => data.email || '',
    phone: () => data.phone || '',
    
    linkedin: () => data.linkedIn || data.linkedin || data.linkedinUrl || '',
    
    currentJobTitle: () => data.currentJobTitle || data.currentTitle || '',
    
    addressLine1: () => {
      const addr = data.physicalAddress
      if (addr) {
        // Extract first part before comma
        return addr.split(',')[0]?.trim() || ''
      }
      return ''
    },
    
    city: () => {
      const addr = data.physicalAddress
      if (addr) {
        // "Orlando, Florida, US" -> "Orlando"
        return addr.split(',')[0]?.trim() || ''
      }
      return ''
    },
    
    state: () => {
      const addr = data.physicalAddress
      if (addr) {
        const parts = addr.split(',')
        if (parts[1]) {
          const state = parts[1]?.trim()
          // Convert full state names to abbreviations
          const stateMap = {
            'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
            'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
            'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
            'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
            'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
            'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
            'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
            'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
            'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
            'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
          }
          return stateMap[state] || state
        }
      }
      return ''
    },
    
    country: () => {
      const addr = data.physicalAddress
      if (addr && addr.includes('US')) {
        return 'US'
      }
      return ''
    }
  }
  
  const mapper = mappings[fieldKey]
  const result = mapper ? mapper() : ''
  console.log('🔍 mapResumeDataToFields result:', { fieldKey, result })
  return result
}

// Helper to map direct resume data structure to form fields
function mapDirectResumeData(resumeData, fieldKey) {
  console.log('🔍 mapDirectResumeData:', { fieldKey, resumeData })
  
  if (!resumeData) return ''
  
  const mappings = {
    fullLegalName: () => {
      // Try to get name from various sources
      if (resumeData.candidateName) return resumeData.candidateName
      if (resumeData.name) return resumeData.name
      return ''
    },
    email: () => {
      if (resumeData.email) return resumeData.email
      return ''
    },
    phone: () => {
      if (resumeData.phone) return resumeData.phone
      return ''
    },
    linkedinUrl: () => {
      if (resumeData.socialMedia && Array.isArray(resumeData.socialMedia)) {
        const linkedin = resumeData.socialMedia.find(sm => sm.type === 'linkedin')
        return linkedin ? linkedin.url : ''
      }
      return resumeData.linkedin || resumeData.linkedIn || resumeData.linkedinUrl || ''
    },
    website: () => {
      if (resumeData.website && Array.isArray(resumeData.website)) {
        return resumeData.website[0] || ''
      }
      return resumeData.website || ''
    },
    currentJobTitle: () => {
      if (resumeData.workExperience && Array.isArray(resumeData.workExperience) && resumeData.workExperience.length > 0) {
        return resumeData.workExperience[0].position || resumeData.workExperience[0].jobTitle || ''
      }
      return resumeData.currentJobTitle || resumeData.currentTitle || ''
    },
    currentEmployer: () => {
      if (resumeData.workExperience && Array.isArray(resumeData.workExperience) && resumeData.workExperience.length > 0) {
        return resumeData.workExperience[0].company || resumeData.workExperience[0].employer || ''
      }
      return resumeData.currentEmployer || ''
    },
    city: () => {
      if (resumeData.location && resumeData.location.city) {
        return resumeData.location.city
      }
      return ''
    },
    stateRegion: () => {
      if (resumeData.location && resumeData.location.state) {
        return resumeData.location.state
      }
      return ''
    },
    country: () => {
      if (resumeData.location && resumeData.location.country) {
        return resumeData.location.country
      }
      return ''
    }
  }

  const mapper = mappings[fieldKey]
  const result = mapper ? mapper() : ''
  console.log('🔍 mapDirectResumeData result:', { fieldKey, result })
  return result
}

// Input field component
function FormField({ field, value, onChange, error, formData = {} }) {
  const { key, label, type, required, options, testId, hasNAButton } = field

  // Get dynamic options for county fields based on selected state
  const getDynamicOptions = () => {
    if (key === 'county' && formData.stateRegion) {
      const stateCounties = getCountiesForState(formData.stateRegion)
      return stateCounties.length > 0 ? stateCounties : options
    }
    return options
  }

  const dynamicOptions = getDynamicOptions()
  
  const inputProps = {
    id: key,
    name: key,
    value: value || '',
    onChange: (e) => onChange(key, e.target.value),
    required,
    'data-testid': testId,
    className: `w-full h-10 px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : ''}`
  }

  if (type === 'select') {
    return (
      <div className="space-y-1">
        <label htmlFor={key} className="block text-sm font-medium text-gray-700">
          {label} {required && '*'}
        </label>
        <select {...inputProps} value={value || ''} className={`w-full h-10 px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : ''}`}>
          <option value="">Select</option>
          {dynamicOptions?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  if (type === 'password') {
    return (
      <div className="space-y-1">
        <label htmlFor={key} className="block text-sm font-medium text-gray-700">
          {label} {required && '*'}
        </label>
        <input {...inputProps} type="password" />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  if (type === 'checkbox') {
    return (
      <div className="flex items-center space-x-2">
        <input
          {...inputProps}
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(key, e.target.checked)}
          className="rounded border-gray-400 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor={key} className="text-sm text-gray-700">
          {label} {required && '*'}
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  if (type === 'textarea') {
    return (
      <div className="space-y-1">
        <label htmlFor={key} className="block text-sm font-medium text-gray-700">
          {label} {required && '*'}
        </label>
        <textarea
          {...inputProps}
          rows={3}
          className={`w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y ${error ? 'border-red-500' : ''}`}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  if (type === 'multiselect') {
    const selectedValues = Array.isArray(value) ? value : []
    const [isOpen, setIsOpen] = useState(false)
    
    const handleOptionChange = (optionValue) => {
      let newSelected
      if (selectedValues.includes(optionValue)) {
        newSelected = selectedValues.filter(val => val !== optionValue)
      } else {
        newSelected = [...selectedValues, optionValue]
      }
      onChange(key, newSelected)
    }
    
    const displayText = selectedValues.length > 0 
      ? selectedValues.map(val => options?.find(opt => opt.value === val)?.label).join(', ')
      : 'Select all that applies'
    
    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (isOpen && !event.target.closest('.multiselect-container')) {
          setIsOpen(false)
        }
      }
      
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])
    
    return (
      <div className="space-y-1">
        <label htmlFor={key} className="block text-sm font-medium text-gray-700">
          {label} {required && '*'}
        </label>
        <div className="relative multiselect-container">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full h-10 px-3 py-2 bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between ${error ? 'border-red-500' : ''}`}
          >
            <span className={selectedValues.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
              {displayText}
            </span>
            <span className="text-gray-400">▼</span>
          </button>
          
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-400 rounded-md shadow-lg">
              {options?.map(option => (
                <label key={option.value} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleOptionChange(option.value)}
                    className="mr-3 rounded border-gray-400 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  // Default text input (text, email, tel, date, etc.)
  return (
    <div className="space-y-1">
      <label htmlFor={key} className="block text-sm font-medium text-gray-700">
        {label} {required && '*'}
      </label>
      <div className="flex gap-2">
        <input {...inputProps} type={type} className="flex-1 h-10" />
        {hasNAButton && (
          <button
            type="button"
            onClick={() => onChange(key, 'N/A')}
            className="h-10 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md border border-gray-400 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            N/A
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default function FormRenderer({ schema, initialData = {}, onSubmit }) {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Define sensitive fields that should not be stored in localStorage
  const sensitiveFields = ['dateOfBirth', 'ssnLast4', 'password', 'confirmPassword']
  
  // Initialize form data with prefilled values
  useEffect(() => {
    const prefillData = {}
    
    // Handle both old flat structure and new sections structure
    const fields = schema.sections ? 
      schema.sections.flatMap(section => section.fields || []) : 
      schema.fields || []
    
    // Get resume data from localStorage
    const resumeData = JSON.parse(localStorage.getItem('resumeData') || 'null')
    console.log('🔍 FormRenderer - Resume data:', resumeData)
    console.log('🔍 FormRenderer - All localStorage keys:', Object.keys(localStorage))
    
    fields.forEach(field => {
      // Try to get value from multiple sources in priority order:
      // 1. localStorage for this step (with backward compatibility)
      // 2. Resume data from parsing
      // 3. initialData (from props)  
      // 4. prefillKeys extraction
      
      // Fix localStorage key compatibility
      const newKey = schema.id
      const oldKey = `step-${schema.id}`
      
      let localValue = null
      
      // Try new key first, then old key for backward compatibility
      try {
        const savedData = localStorage.getItem(newKey) || localStorage.getItem(oldKey)
        if (savedData) {
          localValue = JSON.parse(savedData)[field.key]
        }
      } catch (e) {}
      
      let value = localValue || ''
      
      // If still empty, try resume data mapping
      if (!value && resumeData) {
        // Try direct mapping from resume data
        value = mapResumeDataToFields(resumeData, field.key)
        
        // If still empty, try prefillKeys
        if (!value && field.prefillKeys) {
          value = extractPrefillValue(field.prefillKeys, resumeData)
        }
        
        // If still empty, try direct field mapping from the raw data
        if (!value) {
          value = mapDirectResumeData(resumeData, field.key)
        }
        
        // If still empty, try direct field access from prefill data
        if (!value && resumeData.prefill && resumeData.prefill.step3) {
          value = resumeData.prefill.step3[field.key] || ''
        }
      }
      
      // Fallback to initialData
      if (!value) {
        value = initialData[field.key] || ''
        
        // If still empty, try initialData.prefill.step3
        if (!value && initialData.prefill && initialData.prefill.step3) {
          value = initialData.prefill.step3[field.key] || ''
        }
      }
      
      prefillData[field.key] = value
      console.log(`🔍 FormRenderer - Field ${field.key}:`, { value, field: field.label })
    })
    
    console.log('🔍 FormRenderer - Final prefill data:', prefillData)
    setFormData(prefillData)
  }, [schema, initialData])

  // Handle field changes
  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    // Clear error when field is changed
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }))
    }
  }

  // Validation logic
  const validateForm = () => {
    const newErrors = {}

    // Handle both old flat structure and new sections structure
    const fields = schema.sections ? 
      schema.sections.flatMap(section => section.fields || []) : 
      schema.fields || []

    // Required field validation
    fields.forEach(field => {
      if (field.required && (!formData[field.key] || formData[field.key] === '')) {
        newErrors[field.key] = `${field.label} is required`
      }
    })

    // AtLeastOneOf constraint validation
    if (schema.constraints?.atLeastOneOf) {
      const hasAtLeastOne = schema.constraints.atLeastOneOf.some(
        fieldKey => formData[fieldKey] === true || formData[fieldKey] === 'true'
      )
      if (!hasAtLeastOne) {
        newErrors._form = `Please select at least one of: ${schema.constraints.atLeastOneOf.join(', ')}`
      }
    }

    return newErrors
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      // Save to localStorage (excluding sensitive fields)
      const sanitizedData = {}
      Object.keys(formData).forEach(key => {
        if (!sensitiveFields.includes(key)) {
          sanitizedData[key] = formData[key]
        }
      })
      
      const localStorageKey = schema.id
      localStorage.setItem(localStorageKey, JSON.stringify(sanitizedData))

      // Call onSubmit if provided
      if (onSubmit) {
        await onSubmit(formData)
      }

      // Navigate to next route
      if (schema.nextRoute) {
        navigate(schema.nextRoute)
      }
    } catch (error) {
      console.error('Form submission failed:', error)
      setErrors({ _form: 'An error occurred while saving. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  // Handle collection-based forms
  if (schema.collection) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6" data-testid={`form-${schema.id}`}>
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">{schema.collection.title}</h3>
          <div className="space-y-4">
            {schema.fields?.map(field => (
              <FormField
                key={field.key}
                field={field}
                value={formData[field.key]}
                onChange={handleChange}
                error={errors[field.key]}
              />
            ))}
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => {/* Add collection item logic */}}
          data-testid="button-add-item"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Add Another {schema.collection.title}
        </button>
        
        {errors.collection_coverage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.collection_coverage}</p>
          </div>
        )}
        
        {errors._form && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors._form}</p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          data-testid={`button-submit-${schema.id}`}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Submitting...' : 'Continue'}
        </button>
      </form>
    )
  }
  
       // Render regular form
       return (
         <form onSubmit={handleSubmit} className="space-y-6" data-testid={`form-${schema.id}`}>
           {schema.sections ? (
             // New sections-based structure with two-column layout
             schema.sections.map((section, sectionIndex) => (
               <div key={sectionIndex} className="bg-white p-6 rounded-lg border border-gray-300">
                 <h3 className="text-lg font-semibold text-gray-900 mb-4">{section.title}</h3>
                 {section.description && (
                   <p className="text-sm text-gray-600 mb-4">{section.description}</p>
                 )}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {section.fields?.map(field => (
                     <FormField
                       key={field.key}
                       field={field}
                       value={formData[field.key]}
                       onChange={handleChange}
                       error={errors[field.key]}
                       formData={formData}
                     />
                   ))}
                 </div>
               </div>
             ))
           ) : (
             // Old flat structure (backward compatibility)
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {schema.fields?.map(field => (
                 <FormField
                   key={field.key}
                   field={field}
                   value={formData[field.key]}
                   onChange={handleChange}
                   error={errors[field.key]}
                   formData={formData}
                 />
               ))}
             </div>
           )}
      
      {errors._form && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors._form}</p>
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        data-testid={`button-submit-${schema.id}`}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Submitting...' : 'Continue'}
      </button>
    </form>
  )
}