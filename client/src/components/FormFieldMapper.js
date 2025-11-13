// Helper component to map resume data to form fields
export function mapResumeDataToFields(resumeData, fieldKey) {
  if (!resumeData?.prefill?.step3) return ''
  
  const data = resumeData.prefill.step3
  
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
  return mapper ? mapper() : ''
}