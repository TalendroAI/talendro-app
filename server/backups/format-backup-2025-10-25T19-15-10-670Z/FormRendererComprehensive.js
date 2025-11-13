import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCountiesForState } from '../lib/stateCounties'


// Helper to extract value from confidence-scored objects
function extractValue(field) {
  if (!field) return ''

  // If it's an object with value property, extract value
  if (typeof field === 'object' && field !== null && 'value' in field) {
    return field.value || ''
  }

  // Otherwise return as-is (already a string)
  return field
}

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

  // Check for prefill data in the correct structure
  if (resumeData?.data?.prefill?.step1) {
    data = resumeData.data.prefill.step1
    console.log('🔍 Using data.prefill.step1 data:', data)
  } else if (resumeData?.data?.prefill?.step2) {
    data = resumeData.data.prefill.step2
    console.log('🔍 Using data.prefill.step2 data:', data)
  } else if (resumeData?.data?.prefill?.step3) {
    data = resumeData.data.prefill.step3
    console.log('🔍 Using data.prefill.step3 data:', data)
  } else if (resumeData?.data?.prefill) {
    data = resumeData.data.prefill
    console.log('🔍 Using data.prefill data:', data)
  } else if (resumeData?.prefill?.step1) {
    data = resumeData.prefill.step1
    console.log('🔍 Using prefill.step1 data (fallback):', data)
  } else if (resumeData?.prefill?.step2) {
    data = resumeData.prefill.step2
    console.log('🔍 Using prefill.step2 data (fallback):', data)
  } else if (resumeData?.prefill?.step3) {
    data = resumeData.prefill.step3
    console.log('🔍 Using prefill.step3 data (fallback):', data)
  } else if (resumeData?.prefill) {
    data = resumeData.prefill
    console.log('🔍 Using prefill data (fallback):', data)
  } else if (resumeData?.raw?.data) {
    // Try the raw data structure from the server
    console.log('🔍 Using raw.data structure:', resumeData.raw.data)
    return mapDirectResumeData(resumeData.raw.data, fieldKey)
  } else {
    console.log('🔍 No prefill data found, trying direct mapping')
    return mapDirectResumeData(resumeData, fieldKey)
  }

  // Direct mappings from parsed resume data
  const mappings = {
    fullLegalName: () => data.fullLegalName || data.candidateName || data.name || '',
    email: () => data.email || '',
    phone: () => data.phone || '',
    linkedinUrl: () => data.linkedIn || data.linkedin || data.linkedinUrl || '',
    website: () => data.website || '',
    currentJobTitle: () => data.currentJobTitle || data.currentTitle || '',
    currentEmployer: () => data.currentEmployer || '',
    yearsExperience: () => data.yearsExperience || '',
    highestDegree: () => data.highestDegree || '',
    institutionName: () => data.institutionName || '',
    majorFieldOfStudy: () => data.majorFieldOfStudy || '',
    graduationDate: () => data.graduationDate || '',
    gpa: () => data.gpa || '',
    coreSkills: () => data.coreSkills || data.skills || '',
    streetAddress: () => data.streetAddress || '',
    city: () => data.city || data.location?.city || '',
    stateRegion: () => data.stateRegion || data.location?.state || '',
    postalCode: () => data.postalCode || '',
    country: () => data.country || data.location?.country || '',
    county: () => data.county || '',
    residentialHistory: () => data.residentialHistory || []
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
      if (resumeData.candidateName) return resumeData.candidateName
      if (resumeData.name) return resumeData.name
      return ''
    },
    email: () => resumeData.email || '',
    phone: () => resumeData.phone || '',
    linkedinUrl: () => {
      if (resumeData.socialMedia && Array.isArray(resumeData.socialMedia)) {
        const linkedin = resumeData.socialMedia.find(sm => sm.type === 'linkedin')
        return linkedin ? linkedin.url : ''
      }
      return resumeData.linkedin || resumeData.linkedIn || resumeData.linkedinUrl || ''
    },
    website: () => (Array.isArray(resumeData.website) ? resumeData.website[0] : resumeData.website) || '',
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
    city: () => resumeData.location?.city || '',
    stateRegion: () => resumeData.location?.state || '',
    country: () => resumeData.location?.country || '',
    highestDegree: () => {
      if (resumeData.education && Array.isArray(resumeData.education) && resumeData.education.length > 0) {
        return resumeData.education[0].degree || resumeData.education[0].educationLevel || ''
      }
      return ''
    },
    institutionName: () => {
      if (resumeData.education && Array.isArray(resumeData.education) && resumeData.education.length > 0) {
        return resumeData.education[0].institution || resumeData.education[0].organization || ''
      }
      return ''
    },
    majorFieldOfStudy: () => {
      if (resumeData.education && Array.isArray(resumeData.education) && resumeData.education.length > 0) {
        return resumeData.education[0].fieldOfStudy || resumeData.education[0].major || ''
      }
      return ''
    },
    coreSkills: () => {
      if (resumeData.skills && Array.isArray(resumeData.skills)) {
        return resumeData.skills.join(', ')
      }
      return resumeData.skills || ''
    }
  }

  const mapper = mappings[fieldKey]
  const result = mapper ? mapper() : ''
  console.log('🔍 mapDirectResumeData result:', { fieldKey, result })
  return result
}


// Helper to extract education fields from profileDraft.education array
function extractEducationFromProfileDraft(education, fieldKey) {
  if (!education) return ''

  const mapping = {
    institutionName: extractValue(education.institution) ||
      extractValue(education.institutionName) ||
      extractValue(education.school) || '',
    majorFieldOfStudy: extractValue(education.fieldOfStudy) ||
      extractValue(education.major) ||
      extractValue(education.majorFieldOfStudy) || '',
    highestDegree: extractValue(education.degree) ||
      extractValue(education.degreeType) ||
      extractValue(education.educationLevel) || '',
    graduationDate: formatDateForInput(
      extractValue(education.endDate) ||
      extractValue(education.graduationDate) ||
      extractValue(education.completionDate) || ''
    ),
    attendanceStartDate: formatDateForInput(
      extractValue(education.startDate) ||
      extractValue(education.attendanceStartDate) || ''
    ),
    gpa: extractValue(education.gpa) || extractValue(education.grade) || '',
    institutionCity: extractValue(education.location?.city) ||
      extractValue(education.city) || '',
    institutionState: extractValue(education.location?.state) ||
      extractValue(education.state) || '',
    institutionAddress: extractValue(education.location?.address) ||
      extractValue(education.address) || '',
    completedAsOfToday: '' // Don't pre-fill this field - let user select
  }

  return mapping[fieldKey] || ''
}


// Helper to extract work fields from profileDraft.workExperience array
function extractWorkFromProfileDraft(work, fieldKey) {
  if (!work) return ''

  const mapping = {
    currentJobTitle: extractValue(work.position) ||
      extractValue(work.jobTitle) ||
      extractValue(work.title) || '',
    currentEmployer: extractValue(work.company) ||
      extractValue(work.employer) ||
      extractValue(work.organization) || '',
    fromDate: formatDateForInput(extractValue(work.startDate) || extractValue(work.fromDate) || ''),
    endDate: formatDateForInput(extractValue(work.endDate) || extractValue(work.toDate) || '')
  }

  return mapping[fieldKey] || ''
}


// Helper to format dates for HTML5 date inputs (yyyy-MM-dd format)
function formatDateForInput(dateStr) {
  if (!dateStr || dateStr === '') return ''

  const str = String(dateStr).trim()

  // Handle "Present" or similar text
  if (str.toLowerCase() === 'present' || str.toLowerCase() === 'current') {
    return ''
  }

  // Already in correct format yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str
  }

  // Just year "2020" -> "2020-01-01"
  if (/^\d{4}$/.test(str)) {
    return `${str}-01-01`
  }

  // Year-month "2020-06" -> "2020-06-01"
  if (/^\d{4}-\d{2}$/.test(str)) {
    return `${str}-01`
  }

  // Try to parse other date formats
  try {
    const date = new Date(str)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
  } catch (e) {
    console.warn('Date parsing failed for:', str, e)
  }

  return ''
}




// Helper to extract education fields from education array
function mapEducationFromArray(step3Data, fieldKey) {
  // Map of form field keys to education array property names
  const educationFieldMap = {
    institutionName: ['institutionName', 'institution', 'school'],
    majorFieldOfStudy: ['majorFieldOfStudy', 'major', 'fieldOfStudy'],
    highestDegree: ['highestDegree', 'degree', 'educationLevel'],
    graduationDate: ['graduationDate', 'endDate', 'completionDate'],
    gpa: ['gpa', 'grade']
  }

  // Check if this field is an education field
  if (!educationFieldMap[fieldKey]) {
    return ''
  }

  // Get education array
  const education = step3Data.education
  if (!Array.isArray(education) || education.length === 0) {
    return ''
  }

  // Extract from first education entry
  const firstEducation = education[0]
  const possibleKeys = educationFieldMap[fieldKey]

  for (const key of possibleKeys) {
    if (firstEducation[key]) {
      console.log(`🎓 Extracted ${fieldKey} from education[0].${key}:`, firstEducation[key])
      return firstEducation[key]
    }
  }

  return ''
}


// Input field component
function FormField({ field, value, onChange, error, blankFields = new Set(), formData = {} }) {
  // Safety check to ensure blankFields is always a Set
  const safeBlankFields = blankFields instanceof Set ? blankFields : new Set()
  const { key, label, type, required, options, testId, hasNAButton } = field

  // Debug logging for key fields
  if (['fullLegalName', 'email', 'phone', 'city', 'stateRegion', 'country'].includes(key)) {
    console.log(`🔍 FormField DEBUG - ${key}:`, { value, type, required })
  }

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
    className: `w-full h-10 px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error || safeBlankFields.has(key) ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : ''}`,
    style: safeBlankFields.has(key) ? { borderColor: '#dc2626', backgroundColor: '#fef2f2', boxShadow: '0 0 0 3px #fecaca', borderWidth: '2px' } : {}
  }

  if (type === 'select') {
    // Debug logging for select fields
    if (key === 'country') {
      console.log(`🔍 SELECT DEBUG - Country field:`, { key, value, options: options?.slice(0, 3) })
    }

    return (
      <div className="space-y-1">
        <label htmlFor={key} className="block text-sm font-medium text-gray-700">
          {label} {required && '*'}
        </label>
        <select
          id={key}
          name={key}
          value={value || ''}
          onChange={(e) => onChange(key, e.target.value)}
          required={required}
          data-testid={testId}
          className={`w-full h-10 px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error || safeBlankFields.has(key) ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : ''}`}
          style={safeBlankFields.has(key) ? { borderColor: '#dc2626', backgroundColor: '#fef2f2', boxShadow: '0 0 0 3px #fecaca', borderWidth: '2px' } : {}}
        >
          <option value="">Select</option>
          {dynamicOptions?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
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
        {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
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
          id={key}
          name={key}
          value={value || ''}
          onChange={(e) => onChange(key, e.target.value)}
          required={required}
          data-testid={testId}
          rows={3}
          className={`w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y ${error || safeBlankFields.has(key) ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : ''}`}
          style={safeBlankFields.has(key) ? { borderColor: '#dc2626', backgroundColor: '#fef2f2', boxShadow: '0 0 0 3px #fecaca', borderWidth: '2px' } : {}}
        />
        {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
      </div>
    )
  }

  if (type === 'employmentEndDate') {
    return (
      <div className="space-y-1">
        <label htmlFor={key} className="block text-sm font-medium text-gray-700">
          {label} {required && '*'}
        </label>
        <div className="flex items-center gap-4">
          <input
            id={key}
            name={key}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(key, e.target.value)}
            required={required}
            data-testid={testId}
            className={`flex-1 h-10 px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error || safeBlankFields.has(key) ? 'border-red-500' : ''}`}
            style={safeBlankFields.has(key) ? { borderColor: '#dc2626', backgroundColor: '#fef2f2', boxShadow: '0 0 0 3px #fecaca', borderWidth: '2px' } : {}}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">OR</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => onChange('current', e.target.checked)}
                className="rounded border-gray-400 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Current</span>
            </label>
          </div>
        </div>
        {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
      </div>
    )
  }

  if (type === 'residentialEndDate') {
      // Residential end date field debug (can be removed in production)
      // console.log('🏠 ResidentialEndDate Field Debug:', { key, value, hasKey: safeBlankFields.has(key), shouldShowRed: error || safeBlankFields.has(key) })
    
    return (
      <div className="space-y-1">
        <label htmlFor={key} className="block text-sm font-medium text-gray-700">
          {label} {required && '*'}
        </label>
        <div className="flex items-center gap-4">
          <input
            id={key}
            name={key}
            type="date"
            value={value || ''}
            onChange={(e) => onChange(key, e.target.value)}
            required={required}
            data-testid={testId}
            className={`flex-1 h-10 px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error || safeBlankFields.has(key) ? 'border-red-500' : ''}`}
            style={safeBlankFields.has(key) ? { borderColor: '#dc2626', backgroundColor: '#fef2f2', boxShadow: '0 0 0 3px #fecaca', borderWidth: '2px' } : {}}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">OR</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.current}
                onChange={(e) => onChange('current', e.target.checked)}
                className="rounded border-gray-400 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Current</span>
            </label>
          </div>
        </div>
        {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
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
            className={`w-full h-10 px-3 py-2 bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between ${error || safeBlankFields.has(key) ? 'border-red-500' : ''}`}
            style={safeBlankFields.has(key) ? { borderColor: '#dc2626', backgroundColor: '#fef2f2', boxShadow: '0 0 0 3px #fecaca', borderWidth: '2px' } : {}}
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
        {error && <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>}
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
        <input
          id={key}
          name={key}
          type={type}
          value={value || ''}
          onChange={(e) => onChange(key, e.target.value)}
          required={required}
          data-testid={testId}
          className={`flex-1 h-10 px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${error || safeBlankFields.has(key) ? 'border-red-500' : ''}`}
          style={safeBlankFields.has(key) ? { borderColor: '#dc2626', backgroundColor: '#fef2f2', boxShadow: '0 0 0 3px #fecaca', borderWidth: '2px' } : {}}
        />
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

// Collection item component
function CollectionItem({ collection, item, index, onChange, onRemove, errors, blankFields = new Set() }) {
  // Safety check to ensure blankFields is always a Set
  const safeBlankFields = blankFields instanceof Set ? blankFields : new Set()
  const handleFieldChange = (key, value) => {
    // Handle conditional logic for employment end date and current checkbox
    if (key === 'current' && value === true) {
      // If current is checked, clear the end date
      onChange(index, 'employmentEndDate', '')
    } else if (key === 'employmentEndDate' && value) {
      // If end date is set, uncheck current
      onChange(index, 'current', false)
    }
    
    // Handle conditional logic for residential end date and current checkbox
    if (key === 'current' && value === true) {
      // If current is checked, clear the residential end date
      onChange(index, 'residentialEndDate', '')
    } else if (key === 'residentialEndDate' && value) {
      // If residential end date is set, uncheck current
      onChange(index, 'current', false)
    }

    onChange(index, key, value)
  }

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-md font-medium text-gray-900">
          {collection.itemTitle} #{index + 1}
        </h4>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {collection.fields?.map(field => (
          <FormField
            key={field.key}
            field={field}
            value={item[field.key]}
            onChange={handleFieldChange}
            error={errors[`${collection.key}_${index}_${field.key}`]}
            blankFields={safeBlankFields}
            formData={item}
          />
        ))}
      </div>

      {/* Conditional logic instruction for employment history */}
      {collection.key === 'employmentHistory' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">
            <strong>Note:</strong> If you are still employed at this company, check "Current" and leave the end date blank.
            If you are no longer employed there, select an end date and leave "Current" unchecked.
          </p>
        </div>
      )}
    </div>
  )
}

export default function FormRendererComprehensive({ schema, resumeData, initialData = {}, onSubmit }) {
  const [formData, setFormData] = useState({})
  const [collections, setCollections] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showValidationAlert, setShowValidationAlert] = useState(false)
  const [incompleteFields, setIncompleteFields] = useState([])
  const [blankFields, setBlankFields] = useState(new Set())

  // REMOVED - This useEffect was causing race conditions
  const navigate = useNavigate()

  // Define sensitive fields that should not be stored in localStorage
  const sensitiveFields = ['dateOfBirth', 'ssnLast4', 'password', 'confirmPassword']


  // useEffect(() => {
  //   console.log('🚀 FormRendererComprehensive - Starting initialization')

  //   // Get resume data from localStorage
  //   const resumeData = JSON.parse(localStorage.getItem('resumeData') || 'null')
  //   console.log('🔍 Resume data loaded:', resumeData)

  //   // Get step3 data from the correct location
  //   const step3Data = resumeData?.prefill?.step3 || {}
  //   console.log('🔍 Step3 data:', step3Data)

  //   // DIRECT DATA BINDING - Use the parsed data directly
  //   if (step3Data && Object.keys(step3Data).length > 0) {
  //     console.log('🚀 DIRECT BINDING - Using step3Data directly:', step3Data)
  //     console.log('🚀 DIRECT BINDING - Full name:', step3Data.fullLegalName)
  //     console.log('🚀 DIRECT BINDING - Email:', step3Data.email)
  //     console.log('🚀 DIRECT BINDING - Phone:', step3Data.phone)
  //     console.log('🚀 DIRECT BINDING - City:', step3Data.city)
  //     console.log('🚀 DIRECT BINDING - State:', step3Data.stateRegion)
  //     setFormData(step3Data)

  //     // Initialize collections from step3Data
  //     const initialCollections = {}
  //     if (schema.collections) {
  //       schema.collections.forEach(collection => {
  //         if (step3Data[collection.key] && Array.isArray(step3Data[collection.key])) {
  //           initialCollections[collection.key] = step3Data[collection.key]
  //           console.log(`🚀 Collection ${collection.key}:`, step3Data[collection.key])
  //         } else {
  //           initialCollections[collection.key] = [{}]
  //         }
  //       })
  //     }
  //     setCollections(initialCollections)

  //     // Update blank fields
  //     const newBlankFields = new Set()
  //     const fields = schema.sections ? 
  //       schema.sections.flatMap(section => section.fields || []) : 
  //       schema.fields || []

  //     fields.forEach(field => {
  //       if (field.required && (!step3Data[field.key] || step3Data[field.key] === '')) {
  //         newBlankFields.add(field.key)
  //       }
  //     })
  //     setBlankFields(newBlankFields)

  //     console.log('🚀 DIRECT BINDING COMPLETE:', { 
  //       formData: step3Data, 
  //       collections: initialCollections,
  //       blankFields: Array.from(newBlankFields)
  //     })
  //   } else {
  //     console.log('⚠️ No step3Data found, using fallback initialization')
  //     // Fallback to original logic if no step3Data
  //     const prefillData = {}
  //     const fields = schema.sections ? 
  //       schema.sections.flatMap(section => section.fields || []) : 
  //       schema.fields || []

  //     fields.forEach(field => {
  //       let value = initialData[field.key] || ''
  //       prefillData[field.key] = value
  //     })

  //     setFormData(prefillData)

  //     const initialCollections = {}
  //     if (schema.collections) {
  //       schema.collections.forEach(collection => {
  //         initialCollections[collection.key] = [{}]
  //       })
  //     }
  //     setCollections(initialCollections)
  //   }

  // }, [schema, initialData]) // Dependencies are correct

  useEffect(() => {
    console.log('🚀 FormRendererComprehensive - Starting ROBUST initialization')

    // STEP 1: Get data source (prop takes priority over localStorage)
    const source = resumeData ?? (JSON.parse(localStorage.getItem('resumeData') || 'null') || {})
    console.log('📦 Data source:', source)

    // STEP 2: Extract multiple data sources
    const step3Data = source?.prefill?.step3 || {}
    const profileDraft = source?.profileDraft || {}
    console.log('📦 Step3 data:', step3Data)
    console.log('📦 ProfileDraft data:', profileDraft)

    // STEP 3: Build field list from schema
    const fields = schema.sections
      ? schema.sections.flatMap(s => s.fields || [])
      : (schema.fields || [])


    // const initialForm = {}

    // // Define education field keys that should come from profileDraft.education array
    // const educationFields = [
    //   'institutionName', 'majorFieldOfStudy', 'highestDegree',
    //   'graduationDate', 'attendanceStartDate', 'gpa',
    //   'institutionCity', 'institutionState', 'institutionAddress',
    //   'completedAsOfToday'
    // ]

    // fields.forEach(field => {
    //   const fieldKey = field.key
    //   let value = ''

    //   // Try step3Data first (direct mapping) ONLY if it has a non-empty value
    //   if (step3Data[fieldKey] && step3Data[fieldKey] !== '') {
    //     value = step3Data[fieldKey]
    //     console.log(`✅ Direct hit for ${fieldKey}:`, value)
    //   }
    //   // NEW: Check step5 data for education fields (backend puts it there!)
    //   else if (educationFields.includes(fieldKey) &&
    //     source.prefill?.step5 &&
    //     Array.isArray(source.prefill.step5) &&
    //     source.prefill.step5.length > 0) {
    //     const step5Edu = source.prefill.step5[0]

    //     if (fieldKey === 'gpa' && step5Edu.gpa) {
    //       value = step5Edu.gpa
    //       console.log(`🎓 Step5 education extraction for ${fieldKey}:`, value)
    //     }
    //     else if (fieldKey === 'majorFieldOfStudy' && step5Edu.major) {
    //       value = step5Edu.major
    //       console.log(`🎓 Step5 education extraction for ${fieldKey}:`, value)
    //     }
    //     else if (fieldKey === 'highestDegree' && step5Edu.degree) {
    //       value = step5Edu.degree
    //       console.log(`🎓 Step5 education extraction for ${fieldKey}:`, value)
    //     }
    //     // If step5 didn't have it, try profileDraft
    //     else if (profileDraft.education &&
    //       Array.isArray(profileDraft.education) &&
    //       profileDraft.education.length > 0) {
    //       value = extractEducationFromProfileDraft(profileDraft.education[0], fieldKey) || ''
    //       if (value) {
    //         console.log(`🎓 ProfileDraft education extraction for ${fieldKey}:`, value)
    //       }
    //     }
    //   }
    //   // Try profileDraft for other education fields
    //   else if (educationFields.includes(fieldKey) &&
    //     profileDraft.education &&
    //     Array.isArray(profileDraft.education) &&
    //     profileDraft.education.length > 0) {
    //     value = extractEducationFromProfileDraft(profileDraft.education[0], fieldKey) || ''
    //     if (value) {
    //       console.log(`🎓 ProfileDraft education extraction for ${fieldKey}:`, value)
    //     }
    //   }


    //   // Try prefillKeys if available
    //   if (field.prefillKeys && field.prefillKeys.length > 0) {
    //     value = extractPrefillValue(field.prefillKeys, source) || ''
    //     if (value) {
    //       console.log(`🔍 PrefillKeys for ${fieldKey}:`, value)
    //       initialForm[fieldKey] = value
    //       return // Skip other checks for this field
    //     }
    //   }

    //   // Fallback to mapping helpers
    //   value = mapResumeDataToFields(source, fieldKey) || ''
    //   if (value) {
    //     console.log(`🔄 Fallback mapping for ${fieldKey}:`, value)
    //   }

    //   initialForm[fieldKey] = value
    // })


    // console.log('📋 Final formData:', initialForm)
    // setFormData(initialForm)

    // STEP 5: Initialize collections with date normalization


    // STEP 4 Enhanced hydration with correct condition order
    const initialForm = {};
    // Define education field keys that should come from profileDraft.education array
    const educationFields = [
      'institutionName',
      'majorFieldOfStudy',
      'highestDegree',
      'graduationDate',
      'attendanceStartDate',
      'gpa',
      'institutionCity',
      'institutionState',
      'institutionAddress',
      'completedAsOfToday',
    ];

    // Helper to test non-empty
    const isFilled = (v) => {
      if (v === undefined || v === null) return false;
      const raw = (typeof v === 'object' && v !== null && 'value' in v) ? v.value : v;
      return String(raw).trim() !== '';
    };

    fields.forEach((field) => {
      const fieldKey = field.key;

      // 1) Direct from step3 if present (object or string)
      const s3 = step3Data?.[fieldKey];
      if (isFilled(s3)) {
        const direct = (typeof s3 === 'object' && 'value' in s3) ? s3.value : s3;
        initialForm[fieldKey] = direct;
        return; // short-circuit
      }

      // 2) Education from step5 (backend puts degree/major/GPA here)
      if (
        educationFields.includes(fieldKey) &&
        Array.isArray(source.prefill?.step5) &&
        source.prefill.step5.length
      ) {
        const s5 = source.prefill.step5[0];
        if (fieldKey === 'gpa' && isFilled(s5?.gpa)) {
          initialForm[fieldKey] = s5.gpa;
          return;
        }
        if (fieldKey === 'majorFieldOfStudy' && isFilled(s5?.major)) {
          initialForm[fieldKey] = s5.major;
          return;
        }
        if (fieldKey === 'highestDegree' && isFilled(s5?.degree)) {
          initialForm[fieldKey] = s5.degree;
          return;
        }
      }

      // 3) Education from profileDraft.education
      if (
        educationFields.includes(fieldKey) &&
        Array.isArray(profileDraft?.education) &&
        profileDraft.education.length
      ) {
        const v = extractEducationFromProfileDraft(profileDraft.education[0], fieldKey) || '';
        if (isFilled(v)) {
          initialForm[fieldKey] = v;
          return;
        }
      }

      // 4) prefillKeys (generic key mapping)
      if (Array.isArray(field.prefillKeys) && field.prefillKeys.length) {
        const v = extractPrefillValue(field.prefillKeys, source) || '';
        if (isFilled(v)) {
          initialForm[fieldKey] = v;
          return;
        }
      }

      // 5) final fallback mapping ONLY if still empty
      const v = mapResumeDataToFields(source, fieldKey) || '';
      if (isFilled(v)) {
        initialForm[fieldKey] = v;
        return;
      }

      // If nothing found, leave empty string (maintains current required-field highlighting behavior)
      initialForm[fieldKey] = '';
    });

    console.log('Final formData', initialForm);
    setFormData(initialForm);


    const initialCollections = {}

    if (schema.collections) {
      schema.collections.forEach(collection => {
        const collectionKey = collection.key
        let arrayData = []

        // Try step3Data first
        if (step3Data[collectionKey] && Array.isArray(step3Data[collectionKey])) {
          // Normalize dates in collection items
          arrayData = step3Data[collectionKey].map(item => ({
            ...item,
            fromDate: formatDateForInput(item.fromDate),
            endDate: formatDateForInput(item.endDate),
            startDate: formatDateForInput(item.startDate)
          }))
          console.log(`📚 Collection ${collectionKey} from step3Data:`, arrayData)
        }
        // Try profileDraft for residentialHistory
        else if (collectionKey === 'residentialHistory' && profileDraft.addresses) {
          arrayData = profileDraft.addresses.map(addr => ({
            streetAddress: addr.streetAddress || addr.street || '',
            city: addr.city || '',
            state: addr.state || addr.stateRegion || '',
            postalCode: addr.postalCode || addr.zipCode || '',
            county: addr.county || '',
            country: addr.country || 'US',
            fromDate: formatDateForInput(addr.fromDate || addr.startDate),
            endDate: formatDateForInput(addr.endDate || addr.toDate),
            current: addr.current || false
          }))
          console.log(`📚 Collection ${collectionKey} from profileDraft.addresses:`, arrayData)
        }

        // Default empty collection
        if (arrayData.length === 0) {
          arrayData = [{}]
          console.log(`📚 Collection ${collectionKey} initialized empty`)
        }

        initialCollections[collectionKey] = arrayData
      })
    }

    setCollections(initialCollections)

    // STEP 6: Calculate blank required fields for validation highlighting
    const newBlankFields = new Set()
    
    // Check regular form fields
    fields.forEach(field => {
      if (field.required && (!initialForm[field.key] || initialForm[field.key] === '')) {
        newBlankFields.add(field.key)
      }
    })
    
    // Check collection fields
    if (schema.collections) {
      schema.collections.forEach(collection => {
        if (initialCollections[collection.key]) {
          initialCollections[collection.key].forEach((item, itemIndex) => {
            collection.fields?.forEach(field => {
              if (field.required && (!item[field.key] || item[field.key] === '')) {
                newBlankFields.add(field.key)
              }
              
              // Special case for employment end date - needs either end date OR current checkbox
              if (collection.key === 'employmentHistory' && field.key === 'employmentEndDate') {
                const isCurrent = item.current === true
                const hasEndDate = item.employmentEndDate && item.employmentEndDate !== ''
                
                if (!isCurrent && !hasEndDate) {
                  newBlankFields.add(field.key)
                }
              }
              
              // Special case for residential end date - needs either end date OR current checkbox
              if (collection.key === 'residentialHistory' && field.key === 'residentialEndDate') {
                const isCurrent = item.current === true
                const hasEndDate = item.residentialEndDate && item.residentialEndDate !== ''
                
                console.log('🏠 Residential End Date Check:', {
                  collectionKey: collection.key,
                  fieldKey: field.key,
                  isCurrent,
                  hasEndDate,
                  item,
                  shouldAddToBlank: !isCurrent && !hasEndDate
                })
                
                if (!isCurrent && !hasEndDate) {
                  newBlankFields.add(field.key)
                  console.log('🏠 Added residentialEndDate to blank fields')
                }
              }
            })
          })
        }
      })
    }
    
    setBlankFields(newBlankFields)

    console.log('🚀 Initialization complete:', {
      formData: initialForm,
      collections: initialCollections,
      blankFields: Array.from(newBlankFields)
    })
    
    // Debug residential history specifically
    if (initialCollections.residentialHistory) {
      console.log('🏠 Residential History Debug:', {
        items: initialCollections.residentialHistory,
        blankFields: Array.from(newBlankFields),
        hasResidentialEndDate: newBlankFields.has('residentialEndDate')
      })
    }

  }, [schema, resumeData])


  // Handle field changes
  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    // Clear error when field is changed
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }))
    }

    // Remove field from blank fields if it has a value
    if (value && value.trim() !== '') {
      setBlankFields(prev => {
        const newBlankFields = new Set(prev)
        newBlankFields.delete(key)
        return newBlankFields
      })
    } else {
      // Add field back to blank fields if it becomes empty
      setBlankFields(prev => {
        const newBlankFields = new Set(prev)
        newBlankFields.add(key)
        return newBlankFields
      })
    }
  }

  // Handle collection item changes
  const handleCollectionChange = (collectionKey, index, fieldKey, value) => {
    setCollections(prev => ({
      ...prev,
      [collectionKey]: prev[collectionKey].map((item, i) =>
        i === index ? { ...item, [fieldKey]: value } : item
      )
    }))

    // Clear error when field is changed
    const errorKey = `${collectionKey}_${index}_${fieldKey}`
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: null }))
    }
    
    // Update blank fields for collection items
    if (value && value.trim() !== '') {
      setBlankFields(prev => {
        const newBlankFields = new Set(prev)
        newBlankFields.delete(fieldKey)
        return newBlankFields
      })
    } else {
      setBlankFields(prev => {
        const newBlankFields = new Set(prev)
        newBlankFields.add(fieldKey)
        return newBlankFields
      })
    }
    
    // Special handling for employment end date and current checkbox
    if (collectionKey === 'employmentHistory' && (fieldKey === 'employmentEndDate' || fieldKey === 'current')) {
      setBlankFields(prev => {
        const newBlankFields = new Set(prev)
        const updatedCollections = collections
        const item = updatedCollections[collectionKey]?.[index]
        
        if (item) {
          const isCurrent = item.current === true
          const hasEndDate = item.employmentEndDate && item.employmentEndDate !== ''
          
          if (!isCurrent && !hasEndDate) {
            newBlankFields.add('employmentEndDate')
          } else {
            newBlankFields.delete('employmentEndDate')
          }
        }
        
        return newBlankFields
      })
    }
    
    // Special handling for residential end date and current checkbox
    if (collectionKey === 'residentialHistory' && (fieldKey === 'residentialEndDate' || fieldKey === 'current')) {
      setBlankFields(prev => {
        const newBlankFields = new Set(prev)
        const updatedCollections = collections
        const item = updatedCollections[collectionKey]?.[index]
        
        if (item) {
          const isCurrent = item.current === true
          const hasEndDate = item.residentialEndDate && item.residentialEndDate !== ''
          
          if (!isCurrent && !hasEndDate) {
            newBlankFields.add('residentialEndDate')
          } else {
            newBlankFields.delete('residentialEndDate')
          }
        }
        
        return newBlankFields
      })
    }
  }

  // Add collection item
  const addCollectionItem = (collectionKey) => {
    const collection = schema.collections.find(c => c.key === collectionKey)
    if (collection) {
      const newItem = {}
      collection.fields.forEach(field => {
        newItem[field.key] = field.type === 'checkbox' ? false : ''
      })

      setCollections(prev => ({
        ...prev,
        [collectionKey]: [...prev[collectionKey], newItem]
      }))
    }
  }

  // Remove collection item
  const removeCollectionItem = (collectionKey, index) => {
    setCollections(prev => ({
      ...prev,
      [collectionKey]: prev[collectionKey].filter((_, i) => i !== index)
    }))
  }

  // Validation logic
  const validateForm = () => {
    const newErrors = {}
    const incomplete = []

    // Handle both old flat structure and new sections structure
    const fields = schema.sections ?
      schema.sections.flatMap(section => section.fields || []) :
      schema.fields || []

    // Required field validation
    fields.forEach(field => {
      if (field.required && (!formData[field.key] || formData[field.key] === '')) {
        newErrors[field.key] = `${field.label} is required`
        incomplete.push(field.label)
      }
    })

    // Collection validation
    if (schema.collections) {
      schema.collections.forEach(collection => {
        const items = collections[collection.key] || []

        // Check minimum coverage if specified
        if (collection.minYearsCoverage && items.length === 0) {
          newErrors[`${collection.key}_coverage`] = `At least one ${collection.itemTitle.toLowerCase()} is required`
          incomplete.push(`${collection.itemTitle} (at least one required)`)
        }

        // Validate each item
        items.forEach((item, index) => {
          collection.fields.forEach(field => {
            if (field.required && (!item[field.key] || item[field.key] === '')) {
              newErrors[`${collection.key}_${index}_${field.key}`] = `${field.label} is required`
              incomplete.push(`${field.label} (${collection.itemTitle} ${index + 1})`)
            }
          })

          // Special validation for employment history
          if (collection.key === 'employmentHistory') {
            const isCurrent = item.current === true
            const hasEndDate = item.employmentEndDate && item.employmentEndDate !== ''

            if (!isCurrent && !hasEndDate) {
              newErrors[`${collection.key}_${index}_employmentEndDate`] = 'Please either check "Current" or select an end date'
            }
          }
          
          // Special validation for residential history
          if (collection.key === 'residentialHistory') {
            const isCurrent = item.current === true
            const hasEndDate = item.residentialEndDate && item.residentialEndDate !== ''

            if (!isCurrent && !hasEndDate) {
              newErrors[`${collection.key}_${index}_residentialEndDate`] = 'Please either check "Current" or select an end date'
            }
          }
        })
      })
    }

    setIncompleteFields(incomplete)
    return newErrors
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setShowValidationAlert(true)
      // Scroll to top to show the alert
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setShowValidationAlert(false)

    setLoading(true)
    setErrors({})

    try {
      // Combine form data and collections
      const allData = {
        ...formData,
        collections: collections
      }

      // Save to localStorage (excluding sensitive fields)
      const sanitizedData = {}
      Object.keys(formData).forEach(key => {
        if (!sensitiveFields.includes(key)) {
          sanitizedData[key] = formData[key]
        }
      })

      const localStorageKey = schema.id
      localStorage.setItem(localStorageKey, JSON.stringify(sanitizedData))

      // Save collections separately
      if (schema.collections) {
        schema.collections.forEach(collection => {
          localStorage.setItem(`${schema.id}_${collection.key}`, JSON.stringify(collections[collection.key] || []))
        })
      }

      // Call onSubmit if provided
      if (onSubmit) {
        await onSubmit(allData)
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

  // Render regular form with sections and collections
  return (
    <form onSubmit={handleSubmit} className="comprehensive-form space-y-6" data-testid={`form-${schema.id}`}>
      {/* Validation Alert */}
      {showValidationAlert && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium" style={{ color: '#dc2626' }}>
                Please Complete All Required Fields
              </h3>
              <div className="mt-2 text-sm" style={{ color: '#dc2626' }}>
                <p className="font-semibold" style={{ color: '#dc2626' }}>You cannot proceed until all required fields are completed:</p>
                <ul className="list-disc list-inside mt-2">
                  {incompleteFields.map((field, index) => (
                    <li key={index} className="font-medium" style={{ color: '#dc2626' }}>{field}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render sections */}
      {schema.sections && schema.sections.map((section, sectionIndex) => (
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
                value={formData[field.key] || ''}
                data-debug-value={formData[field.key] || ''}
                data-debug-key={field.key}
                onChange={handleChange}
                error={errors[field.key]}
                blankFields={blankFields}
                formData={formData}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Render collections */}
      {schema.collections && schema.collections.map(collection => {
        // Collection rendering debug (can be removed in production)
        // console.log(`🔍 Rendering collection ${collection.key}:`, { collection, items: collections[collection.key] })
        return (
          <div key={collection.key} className="bg-white p-6 rounded-lg border border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{collection.title}</h3>
          {collection.description && (
            <p className="text-sm text-gray-600 mb-4">{collection.description}</p>
          )}

          <div className="space-y-4">
            {(collections[collection.key] || []).map((item, index) => (
              <CollectionItem
                key={index}
                collection={collection}
                item={item}
                index={index}
                onChange={(idx, key, value) => handleCollectionChange(collection.key, idx, key, value)}
                onRemove={(idx) => removeCollectionItem(collection.key, idx)}
                errors={errors}
                blankFields={blankFields}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => addCollectionItem(collection.key)}
            className="btn btn-primary mt-4"
          >
            {collection.addLabel}
          </button>

          {errors[`${collection.key}_coverage`] && (
            <p className="text-sm mt-2" style={{ color: '#dc2626' }}>{errors[`${collection.key}_coverage`]}</p>
          )}
          </div>
        )
      })}

      {/* Form errors */}
      {errors._form && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm" style={{ color: '#dc2626' }}>{errors._form}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        data-testid={`button-submit-${schema.id}`}
        className="btn btn-primary"
      >
        {loading ? 'Submitting...' : (
          schema.nextRoute === '/app/onboarding/step-3' ? 'Personal Information' :
            schema.nextRoute === '/app/onboarding/step-4' ? 'Professional Information' :
              schema.nextRoute === '/app/onboarding/step-5' ? 'Disclosures & Authorizations' :
                schema.nextRoute === '/app/checkout' ? 'Proceed to Payment' :
                  schema.nextRoute === '/app/onboarding/review' ? 'Review & Submit' :
                    'Continue'
        )}
      </button>
    </form>
  )
}
