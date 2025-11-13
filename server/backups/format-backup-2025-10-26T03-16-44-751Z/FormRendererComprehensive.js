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
    onBlur: (e) => {
      // Check if field was auto-filled by browser
      if (e.target.value && e.target.value !== value) {
        console.log('🔍 Auto-fill detected on blur:', { key, oldValue: value, newValue: e.target.value })
        onChange(key, e.target.value)
      }
    },
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
          onBlur={(e) => {
            // Check if field was auto-filled by browser
            if (e.target.value && e.target.value !== value) {
              console.log('🔍 Auto-fill detected on blur (select):', { key, oldValue: value, newValue: e.target.value })
              onChange(key, e.target.value)
            }
          }}
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
                onChange={(e) => {
                  console.log('🏠 Current checkbox clicked:', { checked: e.target.checked, formData: formData })
                  onChange('current', e.target.checked)
                }}
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
    
    // Debug logging for multiselect fields
    console.log('🔍 Multiselect Field Debug:', { 
      key, 
      selectedValues, 
      hasKey: safeBlankFields.has(key), 
      shouldShowRed: error || safeBlankFields.has(key),
      blankFieldsSize: safeBlankFields.size,
      blankFieldsArray: Array.from(safeBlankFields)
    })
    
    // FORCE red styling for multiselect fields if they're empty
    const multiselectFieldsToForce = ['workArrangement', 'protectedVeteran', 'race']
    const shouldForceRed = multiselectFieldsToForce.includes(key) && selectedValues.length === 0
    const shouldShowRed = error || safeBlankFields.has(key) || shouldForceRed
    console.log('🔍 Multiselect force red check:', { key, selectedValuesLength: selectedValues.length, shouldForceRed, shouldShowRed })

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

    // Update data attributes when selected values change
    useEffect(() => {
      const button = document.querySelector(`button[data-field-name="${key}"]`)
      if (button) {
        button.setAttribute('data-selected-values', selectedValues.join(','))
        console.log('🔍 Updated multiselect data attributes:', { key, selectedValues: selectedValues.join(',') })
      }
    }, [selectedValues, key])

    return (
      <div className="space-y-1">
        <label htmlFor={key} className="block text-sm font-medium text-gray-700">
          {label} {required && '*'}
        </label>
        <div className="relative multiselect-container">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full h-10 px-3 py-2 bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between ${shouldShowRed ? 'border-red-500' : ''}`}
            style={shouldShowRed ? { borderColor: '#dc2626', backgroundColor: '#fef2f2', boxShadow: '0 0 0 3px #fecaca', borderWidth: '2px' } : {}}
            data-field-name={key}
            data-selected-values={selectedValues.join(',')}
            data-required={required}
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
    console.log('🏠 CollectionItem handleFieldChange:', { key, value, index, item })
    
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

    // Always call the main onChange to update the field
    console.log('🏠 Calling onChange with:', { index, key, value })
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
  console.log('🚀 FormRendererComprehensive - Received props:', { hasOnSubmit: !!onSubmit, schemaId: schema?.id })
  
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
      // Only add to blank fields if required AND not populated
      let isEmpty = false
      if (field.type === 'multiselect') {
        // For multiselect fields, check if array is empty
        const fieldValue = initialForm[field.key]
        isEmpty = !fieldValue || !Array.isArray(fieldValue) || fieldValue.length === 0
        console.log('🔍 Initialization - Multiselect field:', field.key, 'fieldValue:', fieldValue, 'isEmpty:', isEmpty, 'required:', field.required)
      } else if (field.type === 'checkbox') {
        // For checkbox fields, check if value is false or undefined
        const fieldValue = initialForm[field.key]
        isEmpty = !fieldValue || fieldValue === false
        console.log('🔍 Initialization - Checkbox field:', field.key, 'fieldValue:', fieldValue, 'isEmpty:', isEmpty, 'required:', field.required)
      } else {
        // For other fields, check if value is empty
        isEmpty = !initialForm[field.key] || initialForm[field.key] === ''
      }
      
      if (field.required && isEmpty) {
        newBlankFields.add(field.key)
        console.log('🔍 Added field to blank fields:', field.key, 'value:', initialForm[field.key], 'type:', field.type)
      } else if (field.required && !isEmpty) {
        // Remove from blank fields if field is populated
        newBlankFields.delete(field.key)
        console.log('🔍 Removed field from blank fields (populated):', field.key, 'value:', initialForm[field.key], 'type:', field.type)
      }
    })
    
    // Check collection fields
    if (schema.collections) {
      console.log('🔍 Processing collections:', schema.collections.map(c => ({ key: c.key, hasData: !!initialCollections[c.key] })))
      
      schema.collections.forEach(collection => {
        console.log('🔍 Processing collection:', collection.key, 'hasData:', !!initialCollections[collection.key])
        
        if (initialCollections[collection.key]) {
          console.log('🔍 Collection items:', initialCollections[collection.key])
          initialCollections[collection.key].forEach((item, itemIndex) => {
            console.log('🔍 Processing item:', itemIndex, item)
            collection.fields?.forEach(field => {
              console.log('🔍 Processing field:', field.key, 'required:', field.required, 'value:', item[field.key])
              
              // Only add to blank fields if required AND not populated
              if (field.required && (!item[field.key] || item[field.key] === '')) {
                newBlankFields.add(field.key)
                console.log('🔍 Added collection field to blank fields:', field.key, 'value:', item[field.key])
              } else if (field.required && item[field.key] && item[field.key] !== '') {
                // Remove from blank fields if field is populated
                newBlankFields.delete(field.key)
                console.log('🔍 Removed collection field from blank fields (populated):', field.key, 'value:', item[field.key])
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
                
                // Only add to blank fields if neither current checkbox is checked NOR end date is provided
                if (!isCurrent && !hasEndDate) {
                  newBlankFields.add(field.key)
                  console.log('🏠 Added residentialEndDate to blank fields')
                } else {
                  // Remove from blank fields if current is checked or end date is provided
                  newBlankFields.delete(field.key)
                  console.log('🏠 Removed residentialEndDate from blank fields - current or end date provided')
                }
              }
            })
          })
        } else {
          // If collection is empty, add all required fields to blank fields
          console.log('🔍 Collection is empty, adding all required fields to blank fields:', collection.key)
          collection.fields?.forEach(field => {
            if (field.required) {
              newBlankFields.add(field.key)
              console.log('🔍 Added empty collection field to blank fields:', field.key)
            }
          })
        }
      })
    }
    
    // FORCE specific fields to be in blank fields if they're empty
    const fieldsToForce = ['workArrangement', 'protectedVeteran', 'race', 'profileReview', 'talendroAuthorization']
    
    fieldsToForce.forEach(fieldKey => {
      const fieldValue = formData[fieldKey]
      let shouldForce = false
      
      if (fieldKey === 'workArrangement' || fieldKey === 'protectedVeteran' || fieldKey === 'race') {
        // Multiselect fields
        shouldForce = !fieldValue || !Array.isArray(fieldValue) || fieldValue.length === 0
      } else if (fieldKey === 'profileReview' || fieldKey === 'talendroAuthorization') {
        // Checkbox fields
        shouldForce = !fieldValue || fieldValue === false
      }
      
      if (shouldForce) {
        newBlankFields.add(fieldKey)
        console.log('🔍 FORCED', fieldKey, 'to blank fields - field is empty')
      }
    })
    
    setBlankFields(newBlankFields)
    console.log('🔍 Initial blank fields set:', Array.from(newBlankFields))
    console.log('🔍 workArrangement in blank fields:', newBlankFields.has('workArrangement'))
    
    // Save blankFields to localStorage for Header component to access
    localStorage.setItem('blankFields', JSON.stringify(Array.from(newBlankFields)))

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

  // Auto-fill detection useEffect - more conservative approach
  useEffect(() => {
    const checkForAutoFill = () => {
      // Get all form fields and check if they have values that aren't in our state
      const allFields = document.querySelectorAll('input, select, textarea')
      let hasChanges = false
      
      allFields.forEach(field => {
        const fieldName = field.name || field.id
        const fieldValue = field.value
        const currentValue = formData[fieldName]
        
        // Only update if field has a value AND it's different from our state
        // AND the field is not empty (to avoid clearing valid empty states)
        if (fieldName && fieldValue && fieldValue !== currentValue && fieldValue.trim() !== '') {
          console.log('🔍 Auto-fill detected:', { fieldName, currentValue, fieldValue })
          handleChange(fieldName, fieldValue)
          hasChanges = true
        }
      })
      
      if (hasChanges) {
        console.log('🔍 Auto-fill changes detected and applied')
      }
    }

    // Check for auto-fill after a short delay to allow browser to complete auto-fill
    const timeoutId = setTimeout(checkForAutoFill, 500) // Increased delay
    
    return () => clearTimeout(timeoutId)
  }, [formData])

  // Periodic auto-fill detection - reduced frequency
  useEffect(() => {
    const interval = setInterval(() => {
      const allFields = document.querySelectorAll('input, select, textarea')
      let hasChanges = false
      
      allFields.forEach(field => {
        const fieldName = field.name || field.id
        const fieldValue = field.value
        const currentValue = formData[fieldName]
        
        // Only update if field has a value AND it's different from our state
        // AND the field is not empty (to avoid clearing valid empty states)
        if (fieldName && fieldValue && fieldValue !== currentValue && fieldValue.trim() !== '') {
          console.log('🔍 Periodic auto-fill check detected:', { fieldName, currentValue, fieldValue })
          handleChange(fieldName, fieldValue)
          hasChanges = true
        }
      })
      
      if (hasChanges) {
        console.log('🔍 Periodic auto-fill changes detected and applied')
      }
    }, 3000) // Reduced frequency - check every 3 seconds instead of 1
    
    return () => clearInterval(interval)
  }, [formData])

  // Re-validate fields periodically to maintain consistent red highlighting
  useEffect(() => {
    const revalidateFields = () => {
      // Get all form fields and check their current state
      const allFields = document.querySelectorAll('input, select, textarea')
      const newBlankFields = new Set()
      
      allFields.forEach(field => {
        const fieldName = field.name || field.id
        const fieldValue = field.value
        
        // Skip multiselect fields - they are handled by handleChange function
        if (fieldName === 'workArrangement' || fieldName === 'protectedVeteran' || fieldName === 'race') {
          console.log('🔍 Re-validation: Skipping multiselect field in main loop:', fieldName)
          return
        }
        
        // Check if field is required and empty
        if (fieldName && field.required && (!fieldValue || fieldValue.trim() === '')) {
          newBlankFields.add(fieldName)
          console.log('🔍 Re-validation: Added field to blank fields:', fieldName, 'value:', fieldValue)
        } else if (fieldName && field.required && fieldValue && fieldValue.trim() !== '') {
          // Field has a value, don't add to blank fields
          console.log('🔍 Re-validation: Field has value, not adding to blank fields:', fieldName, 'value:', fieldValue)
        }
      })
      
      // Skip multiselect fields entirely - they are handled by handleChange function
      console.log('🔍 Re-validation: Skipping multiselect fields - managed by handleChange function')
      
      // Skip workArrangement entirely in re-validation
      // The handleChange function and initialization already handle it properly
      console.log('🔍 Re-validation: Skipping workArrangement - managed by handleChange and initialization')
      
      // Special handling for residential end date - check if it needs red highlighting
      // Look for residential end date fields in the DOM
      const residentialEndDateFields = document.querySelectorAll('input[name="residentialEndDate"], input[id="residentialEndDate"]')
      residentialEndDateFields.forEach(field => {
        const fieldValue = field.value
        const isCurrentChecked = field.closest('.space-y-1')?.querySelector('input[type="checkbox"]')?.checked || false
        
        // Add to blank fields if neither end date nor current checkbox is provided
        if (!fieldValue || fieldValue.trim() === '') {
          if (!isCurrentChecked) {
            newBlankFields.add('residentialEndDate')
            console.log('🔍 Re-validation: Added residentialEndDate to blank fields (no end date, not current)')
          }
        }
      })
      
      // Special handling for employment end date - check if it needs red highlighting
      // Look for employment end date fields in the DOM (collection fields)
      const employmentEndDateFields = document.querySelectorAll('input[name="employmentEndDate"], input[id="employmentEndDate"]')
      employmentEndDateFields.forEach(field => {
        const fieldValue = field.value
        const isCurrentChecked = field.closest('.space-y-1')?.querySelector('input[type="checkbox"]')?.checked || false
        
        // Add to blank fields if neither end date nor current checkbox is provided
        if (!fieldValue || fieldValue.trim() === '') {
          if (!isCurrentChecked) {
            newBlankFields.add('employmentEndDate')
            console.log('🔍 Re-validation: Added employmentEndDate to blank fields (no end date, not current)')
          }
        }
      })
      
      // Also check employment history collection items for employment end date
      if (collections.employmentHistory) {
        let hasCurrentEmployment = false
        let hasEmploymentEndDate = false
        
        collections.employmentHistory.forEach((item, index) => {
          const isCurrent = item.current === true
          const hasEndDate = item.employmentEndDate && item.employmentEndDate !== ''
          
          if (isCurrent) hasCurrentEmployment = true
          if (hasEndDate) hasEmploymentEndDate = true
          
          console.log('🔍 Re-validation: Employment item check:', {
            index,
            isCurrent,
            hasEndDate,
            employmentEndDate: item.employmentEndDate,
            current: item.current
          })
        })
        
        // Only add to blank fields if NO employment items have current checked AND NO employment items have end dates
        if (!hasCurrentEmployment && !hasEmploymentEndDate) {
          newBlankFields.add('employmentEndDate')
          console.log('🔍 Re-validation: Added employmentEndDate to blank fields from collection (no current, no end dates)')
        } else {
          newBlankFields.delete('employmentEndDate')
          console.log('🔍 Re-validation: Removed employmentEndDate from blank fields (current or end date exists)')
        }
      }
      
      // Update blank fields if there are changes
      setBlankFields(prev => {
        const prevArray = Array.from(prev).sort()
        const newArray = Array.from(newBlankFields).sort()
        
        if (JSON.stringify(prevArray) !== JSON.stringify(newArray)) {
          console.log('🔍 Re-validation found changes:', { 
            previous: prevArray, 
            current: newArray,
            added: newArray.filter(f => !prevArray.includes(f)),
            removed: prevArray.filter(f => !newArray.includes(f))
          })
          
          // Check if we're removing fields that should stay in blank fields
          const removedFields = prevArray.filter(f => !newArray.includes(f))
          if (removedFields.length > 0) {
            console.log('🔍 Re-validation: Fields being removed:', removedFields)
            // Double-check these fields are actually filled
            removedFields.forEach(fieldName => {
              const field = document.querySelector(`[name="${fieldName}"], [id="${fieldName}"]`)
              if (field && (!field.value || field.value.trim() === '')) {
                console.log('🔍 Re-validation: Field should not be removed, adding back:', fieldName)
                newBlankFields.add(fieldName)
              }
            })
          }
          
          localStorage.setItem('blankFields', JSON.stringify(Array.from(newBlankFields)))
          return newBlankFields
        }
        return prev
      })
    }

    // Re-validate every 3 seconds, starting after 5 seconds to allow form initialization
    let intervalId = null
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(revalidateFields, 3000)
    }, 5000)
    
    return () => {
      clearTimeout(timeoutId)
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [])

  // Handle field changes
  const handleChange = (key, value) => {
    setFormData(prev => {
      const newData = { ...prev, [key]: value }
      
      // Auto-save to localStorage whenever form data changes
      const localStorageKey = schema.id
      const sanitizedData = {}
      Object.keys(newData).forEach(key => {
        if (!sensitiveFields.includes(key)) {
          sanitizedData[key] = newData[key]
        }
      })
      localStorage.setItem(localStorageKey, JSON.stringify(sanitizedData))
      console.log('🔍 Auto-saved form data to localStorage:', localStorageKey, sanitizedData)
      
      return newData
    })
    
    // Clear error when field is changed
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }))
    }

    // More conservative blank fields management
    let hasValue = false
    if (Array.isArray(value)) {
      // For multiselect fields, check if array has any values
      hasValue = value.length > 0
    } else {
      // For other fields, check if value exists and is not empty
      hasValue = value && (typeof value === 'string' ? value.trim() !== '' : value !== false && value !== null && value !== undefined)
    }
    
    setBlankFields(prev => {
      const newBlankFields = new Set(prev)
      
      if (hasValue) {
        // Only remove from blank fields if field actually has a meaningful value
        newBlankFields.delete(key)
        console.log('🔍 Removed field from blank fields (has value):', key, 'value:', value)
      } else {
        // Add field back to blank fields if it becomes empty
        newBlankFields.add(key)
        console.log('🔍 Added field to blank fields (empty):', key, 'value:', value)
      }
      
      // Save to localStorage for Header component
      localStorage.setItem('blankFields', JSON.stringify(Array.from(newBlankFields)))
      return newBlankFields
    })
  }

  // Handle collection item changes
  const handleCollectionChange = (collectionKey, index, fieldKey, value) => {
    setCollections(prev => {
      const newCollections = {
        ...prev,
        [collectionKey]: prev[collectionKey].map((item, i) =>
          i === index ? { ...item, [fieldKey]: value } : item
        )
      }
      
      // Auto-save collections to localStorage
      if (schema.collections) {
        schema.collections.forEach(collection => {
          localStorage.setItem(`${schema.id}_${collection.key}`, JSON.stringify(newCollections[collection.key] || []))
        })
        console.log('🔍 Auto-saved collections to localStorage:', newCollections)
      }
      
      return newCollections
    })

    // Clear error when field is changed
    const errorKey = `${collectionKey}_${index}_${fieldKey}`
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: null }))
    }
    
    // Update blank fields for collection items
    if (value && (typeof value === 'string' ? value.trim() !== '' : value !== false && value !== null)) {
      setBlankFields(prev => {
        const newBlankFields = new Set(prev)
        newBlankFields.delete(fieldKey)
        // Save to localStorage for Header component
        localStorage.setItem('blankFields', JSON.stringify(Array.from(newBlankFields)))
        return newBlankFields
      })
    } else {
      setBlankFields(prev => {
        const newBlankFields = new Set(prev)
        newBlankFields.add(fieldKey)
        // Save to localStorage for Header component
        localStorage.setItem('blankFields', JSON.stringify(Array.from(newBlankFields)))
        return newBlankFields
      })
    }
    
    // Special handling for employment end date and current checkbox
    if (collectionKey === 'employmentHistory' && (fieldKey === 'employmentEndDate' || fieldKey === 'current')) {
      setBlankFields(prev => {
        const newBlankFields = new Set(prev)
        
        // Get the updated item with the new value
        const updatedItem = { ...collections[collectionKey]?.[index] }
        if (fieldKey === 'current') {
          updatedItem.current = value
        } else if (fieldKey === 'employmentEndDate') {
          updatedItem.employmentEndDate = value
        }
        
        const isCurrent = updatedItem.current === true
        const hasEndDate = updatedItem.employmentEndDate && updatedItem.employmentEndDate !== ''
        
        console.log('🔍 Employment validation check:', {
          isCurrent,
          hasEndDate,
          updatedItem,
          fieldKey,
          value
        })
        
        if (!isCurrent && !hasEndDate) {
          newBlankFields.add('employmentEndDate')
          console.log('🔍 Added employmentEndDate to blank fields - neither current nor end date')
        } else {
          newBlankFields.delete('employmentEndDate')
          console.log('🔍 Removed employmentEndDate from blank fields - current or end date provided')
        }
        
        // Save to localStorage for Header component
        localStorage.setItem('blankFields', JSON.stringify(Array.from(newBlankFields)))
        return newBlankFields
      })
    }
    
    // Special handling for residential end date and current checkbox
    if (collectionKey === 'residentialHistory' && (fieldKey === 'residentialEndDate' || fieldKey === 'current')) {
      setBlankFields(prev => {
        const newBlankFields = new Set(prev)
        
        // Get the updated item with the new value
        const updatedItem = { ...collections[collectionKey]?.[index] }
        if (fieldKey === 'current') {
          updatedItem.current = value
        } else if (fieldKey === 'residentialEndDate') {
          updatedItem.residentialEndDate = value
        }
        
        const isCurrent = updatedItem.current === true
        const hasEndDate = updatedItem.residentialEndDate && updatedItem.residentialEndDate !== ''
        
        console.log('🏠 Residential validation check:', {
          isCurrent,
          hasEndDate,
          updatedItem,
          fieldKey,
          value
        })
        
        if (!isCurrent && !hasEndDate) {
          newBlankFields.add('residentialEndDate')
          console.log('🏠 Added residentialEndDate to blank fields - neither current nor end date')
        } else {
          newBlankFields.delete('residentialEndDate')
          console.log('🏠 Removed residentialEndDate from blank fields - current or end date provided')
        }
        
        // Save to localStorage for Header component
        localStorage.setItem('blankFields', JSON.stringify(Array.from(newBlankFields)))
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
    console.log('🚀 FormRendererComprehensive - handleSubmit called', { hasOnSubmit: !!onSubmit, eventType: e.type })
    e.preventDefault()

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

      // Call onSubmit if provided - this handles validation and navigation
      if (onSubmit) {
        console.log('🚀 FormRendererComprehensive - Calling onSubmit function')
        await onSubmit(allData)
      } else {
        // Fallback to default validation if no onSubmit provided
        const validationErrors = validateForm()
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors)
          setShowValidationAlert(true)
          // Scroll to top to show the alert
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }

        // Navigate to next route
        if (schema.nextRoute) {
          navigate(schema.nextRoute)
        }
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
    <form className="comprehensive-form space-y-6" data-testid={`form-${schema.id}`}>
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
          {collection.note && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> {collection.note}
              </p>
            </div>
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
        onClick={(e) => {
          console.log('🚀 Button clicked!', { type: e.type, target: e.target, disabled: e.target.disabled, loading })
          // Prevent default and manually trigger form submission
          e.preventDefault()
          console.log('🚀 Manually triggering form submission')
          handleSubmit(e)
        }}
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
