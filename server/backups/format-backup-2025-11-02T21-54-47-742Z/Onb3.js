import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutoSave, loadSavedData, mergeWithResumeData } from '../../hooks/useAutoSave';

// All 50 US States
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' }
];

const Onb3 = () => {
  console.log('Onb3');
  const navigate = useNavigate();
  
  // Load saved data with defaults
  const [formData, setFormData] = useState(() => 
    loadSavedData('onboarding_step3', {
      fullLegalName: '',
      preferredFirstName: '',
      maidenName: '',
      previousNames: '',
      email: '',
      phone: '',
      linkedinUrl: '',
      website: '',
      streetAddress: '',
      city: '',
      state: '',
      postalCode: '',
      county: '',
      country: 'US',
      emergencyName: '',
      emergencyRelationship: '',
      emergencyPhone: '',
      emergencyPhoneAlt: '',
      dlNumber: '',
      dlState: '',
      dateOfBirth: '',
      ssnLast4: ''
    })
  );

  // Load saved residences or use default
  const [residences, setResidences] = useState(() => {
    const saved = loadSavedData('onboarding_step3_residences', []);
    return saved.length > 0 ? saved : [
      { id: 1, street: '', city: '', state: '', zip: '', fromDate: '', toDate: '', current: false, autoAdded: false }
    ];
  });

  // Auto-save formData on every change
  useAutoSave('onboarding_step3', formData);
  
  // Auto-save residences on every change
  useAutoSave('onboarding_step3_residences', residences);

  // Merge with parsed resume data on mount
  useEffect(() => {
    const resumeData = JSON.parse(localStorage.getItem('resumeData') || 'null');
    const prefill = resumeData?.prefill;
    
    if (prefill?.step2) {
      const step2 = prefill.step2;
      
      // Populate fields only if they're currently empty (initial load)
      setFormData(prev => {
        const updates = {};
        
        // Only populate if field is currently empty (hasn't been edited)
        if (!prev.fullLegalName) updates.fullLegalName = step2.fullLegalName || '';
        if (!prev.preferredFirstName) updates.preferredFirstName = step2.preferredFirstName || '';
        if (!prev.maidenName) updates.maidenName = step2.maidenName || '';
        if (!prev.previousNames) updates.previousNames = step2.previousNames || '';
        if (!prev.email) updates.email = step2.email || '';
        if (!prev.phone) updates.phone = step2.phone || '';
        if (!prev.linkedinUrl) updates.linkedinUrl = step2.linkedinUrl || '';
        if (!prev.website) updates.website = step2.website || '';
        if (!prev.streetAddress) updates.streetAddress = step2.streetAddress || '';
        if (!prev.city) updates.city = step2.city || '';
        if (!prev.state) updates.state = step2.state || '';
        if (!prev.postalCode) updates.postalCode = step2.postalCode || '';
        if (!prev.county) updates.county = step2.county || '';
        if (!prev.country) updates.country = step2.country || 'US';
        if (!prev.emergencyName) updates.emergencyName = step2.emergencyName || '';
        if (!prev.emergencyRelationship) updates.emergencyRelationship = step2.emergencyRelationship || '';
        if (!prev.emergencyPhone) updates.emergencyPhone = step2.emergencyPhone || '';
        if (!prev.emergencyPhoneAlt) updates.emergencyPhoneAlt = step2.emergencyPhoneAlt || '';
        if (!prev.dlNumber) updates.dlNumber = step2.dlNumber || '';
        if (!prev.dlState) updates.dlState = step2.dlState || '';
        if (!prev.dateOfBirth) updates.dateOfBirth = step2.dateOfBirth || '';
        
        // SSN should always start empty
        updates.ssnLast4 = '';
        
        return { ...prev, ...updates };
      });
      
      // Populate residential history (only if empty)
      if (step2.residentialHistory && step2.residentialHistory.length > 0 && residences.length === 1 && !residences[0].fromDate) {
        const mappedResidences = step2.residentialHistory.map((residence, index) => ({
          id: index + 1,
          street: residence.streetAddress || '',
          city: residence.city || '',
          state: residence.state || '',
          zip: residence.postalCode || '',
          fromDate: residence.fromDate || '',
          toDate: residence.isCurrent ? '' : (residence.toDate || ''),
          current: residence.isCurrent || false,
          autoAdded: false // Pre-filled from resume are not auto-added
        }));
        setResidences(mappedResidences);
      }
    }
  }, []); // Only run once on mount

  const handleChange = (e) => {
    const { id, value } = e.target;
    
    // Special handling for SSN Last 4 - only allow digits and limit to 4
    if (id === 'ssnLast4') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({...prev, [id]: digitsOnly}));
      return;
    }
    
    setFormData(prev => ({...prev, [id]: value}));
  };

  const setNA = (fieldId) => {
    setFormData(prev => ({...prev, [fieldId]: 'N/A'}));
  };

  const addResidence = () => {
    const newId = residences.length + 1;
    setResidences([...residences, {
      id: newId,
      street: '',
      city: '',
      state: '',
      zip: '',
      fromDate: '',
      toDate: '',
      current: false,
      autoAdded: false // Manually added by user
    }]);
  };

  const removeResidence = (id) => {
    setResidences(residences.filter(res => res.id !== id));
  };

  const updateResidence = (id, field, value) => {
    setResidences(residences.map(res =>
      res.id === id ? {...res, [field]: value} : res
    ));
  };

  const toggleCurrentResidence = (id) => {
    setResidences(residences.map(res => {
      if (res.id === id) {
        const newCurrent = !res.current;
        // If checking "Current", clear toDate; if unchecking, keep existing toDate
        return {
          ...res,
          current: newCurrent,
          toDate: newCurrent ? '' : res.toDate
        };
      }
      return res;
    }));
  };

  // Calculate duration of a single residence in years
  const calculateResidenceYears = (res) => {
    if (!res.fromDate) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(res.fromDate);
    startDate.setHours(0, 0, 0, 0);
    
    let endDate;
    if (res.current) {
      endDate = today;
    } else if (res.toDate) {
      endDate = new Date(res.toDate);
      endDate.setHours(0, 0, 0, 0);
    } else {
      return 0; // No end date and not current
    }
    
    const daysDiff = Math.max(0, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)));
    return daysDiff / 365.25; // Convert to years
  };

  // Calculate total years covered by residential history
  const residentialHistoryCoverage = useMemo(() => {
    const REQUIRED_YEARS = 7;
    
    if (!residences || residences.length === 0) {
      return {
        totalYears: 0,
        remainingYears: REQUIRED_YEARS,
        isComplete: false
      };
    }
    
    let totalDays = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    residences.forEach(res => {
      if (!res.fromDate) return; // Skip if no start date
      
      const startDate = new Date(res.fromDate);
      startDate.setHours(0, 0, 0, 0);
      
      let endDate;
      if (res.current) {
        // For current residence, use today as end date
        endDate = today;
      } else if (res.toDate) {
        endDate = new Date(res.toDate);
        endDate.setHours(0, 0, 0, 0);
      } else {
        // Skip if no end date and not current
        return;
      }
      
      // Calculate days difference
      const daysDiff = Math.max(0, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)));
      totalDays += daysDiff;
    });
    
    // Convert days to years (approximate - 365.25 days per year to account for leap years)
    const totalYears = totalDays / 365.25;
    const remainingYears = Math.max(0, REQUIRED_YEARS - totalYears);
    const isComplete = totalYears >= REQUIRED_YEARS;
    
    return {
      totalYears: Math.round(totalYears * 100) / 100, // Round to 2 decimal places
      remainingYears: Math.round(remainingYears * 100) / 100,
      isComplete
    };
  }, [residences]);

  // Dynamically add/remove residence entries based on manually-added residences' coverage
  useEffect(() => {
    const REQUIRED_YEARS = 7;
    
    // Separate manually-added from auto-added residences
    const manuallyAdded = residences.filter(r => !r.autoAdded);
    const autoAdded = residences.filter(r => r.autoAdded);
    
    // Only proceed if we have at least one manually-added residence with complete dates
    if (manuallyAdded.length === 0) return;
    
    // Calculate total years covered by manually-added residences with valid dates
    let totalDays = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let hasCompleteResidence = false;
    
    manuallyAdded.forEach(res => {
      if (!res.fromDate) return; // Skip if no start date
      
      // Check if this residence has complete date information
      const hasEndDate = res.current || res.toDate;
      if (!hasEndDate) return; // Skip if no end date and not current
      
      hasCompleteResidence = true;
      
      const startDate = new Date(res.fromDate);
      startDate.setHours(0, 0, 0, 0);
      
      let endDate;
      if (res.current) {
        endDate = today;
      } else {
        endDate = new Date(res.toDate);
        endDate.setHours(0, 0, 0, 0);
      }
      
      const daysDiff = Math.max(0, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)));
      totalDays += daysDiff;
    });
    
    // Don't do anything until at least one manually-added residence has complete dates
    if (!hasCompleteResidence) {
      // If we have auto-added residences but no complete manually-added ones, remove them
      if (autoAdded.length > 0) {
        setResidences(manuallyAdded);
      }
      return;
    }
    
    const totalYears = totalDays / 365.25;
    const remainingYears = Math.max(0, REQUIRED_YEARS - totalYears);
    const isComplete = totalYears >= REQUIRED_YEARS;
    
    // If coverage is complete, remove all auto-added residences
    if (isComplete && autoAdded.length > 0) {
      setResidences(manuallyAdded);
      return;
    }
    
    // If coverage is incomplete, ensure we have enough auto-added residences
    if (!isComplete && remainingYears > 0.5) {
      // Calculate how many auto-added residences we should have
      // Assume each residence might cover 2-4 years, so roughly one per 3 years needed
      const estimatedEntriesNeeded = Math.ceil(remainingYears / 3);
      const entriesNeeded = Math.min(estimatedEntriesNeeded, 4); // Max 4 auto-added
      
      // If we don't have enough auto-added residences, add more
      if (autoAdded.length < entriesNeeded) {
        const toAdd = entriesNeeded - autoAdded.length;
        const newAutoAdded = [];
        const maxId = Math.max(...residences.map(r => r.id), 0);
        
        for (let i = 0; i < toAdd; i++) {
          newAutoAdded.push({
            id: maxId + i + 1,
            street: '',
            city: '',
            state: '',
            zip: '',
            fromDate: '',
            toDate: '',
            current: false,
            autoAdded: true
          });
        }
        
        setResidences([...manuallyAdded, ...autoAdded, ...newAutoAdded]);
      }
      // If we have too many auto-added residences, remove excess
      else if (autoAdded.length > entriesNeeded) {
        const toKeep = autoAdded.slice(0, entriesNeeded);
        setResidences([...manuallyAdded, ...toKeep]);
      }
    }
    // If we have auto-added residences but they're no longer needed
    else if (remainingYears <= 0.5 && autoAdded.length > 0) {
      setResidences(manuallyAdded);
    }
    
    // Only run this effect when residence dates change (create a dependency string from all dates)
  }, [residences.map(r => `${r.id}-${r.fromDate}-${r.toDate}-${r.current}`).join('|')]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Save data to localStorage
    const completeData = {
      ...formData,
      residences
    };
    localStorage.setItem('step2Data', JSON.stringify(completeData));
    
    // Navigate to next step
    navigate('/app/onboarding/step-4');
  };

  const getInputStyle = (value) => {
    const isEmpty = !value || (typeof value === 'string' && value.trim() === '') || value === '';
    const baseClass = 'w-full h-10 px-3 py-2 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-talAqua transition';
    if (isEmpty) {
      return {
        className: baseClass,
        style: {
          borderColor: '#ef4444',
          backgroundColor: '#fef2f2',
          boxShadow: '0 0 0 2px rgba(254, 202, 202, 0.5)'
        }
      };
    }
    return {
      className: `${baseClass} border-gray-300 bg-white`,
      style: {}
    };
  };

  const getResidenceInputStyle = (value) => {
    const isEmpty = !value || (typeof value === 'string' && value.trim() === '') || value === '';
    const baseClass = 'w-full h-10 px-3 py-2 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-talAqua transition';
    if (isEmpty) {
      return {
        className: baseClass,
        style: {
          borderColor: '#ef4444',
          backgroundColor: '#fef2f2',
          boxShadow: '0 0 0 2px rgba(254, 202, 202, 0.5)'
        }
      };
    }
    return {
      className: `${baseClass} border-gray-300 bg-white`,
      style: {}
    };
  };

  return (
    <section>
      <div className="mb-6">
        <a href="/app/onboarding/step-2" className="text-talBlue hover:underline flex items-center gap-2">
          ← Back to Create Profile
        </a>
      </div>
      
      <h1 className="h1">Personal Information</h1>
      <p className="body mt-2 text-talGray">Please complete all fields</p>
      
      {/* Progress Bar */}
      <div className="mt-6 mb-6 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-talBlue to-talAqua transition-all duration-300" style={{width: '40%'}}></div>
      </div>

      {/* Alert */}
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
        <p className="body text-sm text-red-800">
          Please review all parsed data and complete any missing information, indicated by <strong className="font-bold" style={{color: '#dc2626'}}>red highlighting</strong>.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <div className="card">
          <h2 className="h3 mb-4 pb-2 border-b border-gray-200">Contact Information</h2>
          
          <div className="form-grid-2col">
            <div>
              <label className="block body mb-2">
                Full Legal Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="fullLegalName"
                value={formData.fullLegalName}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.fullLegalName)}
              />
            </div>

            <div>
              <label className="block body mb-2">
                Preferred First Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="preferredFirstName"
                value={formData.preferredFirstName}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.preferredFirstName)}
              />
            </div>
          </div>
          
          <div className="form-grid-2col">
            <div>
              <label className="block body mb-2">Full Legal Maiden Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="maidenName"
                  value={formData.maidenName}
                  onChange={handleChange}
                   {...getInputStyle(formData.maidenName)}
                />
                <button 
                  type="button" 
                  onClick={() => setNA('maidenName')} 
                  className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
                >
                  N/A
                </button>
              </div>
            </div>

            <div>
              <label className="block body mb-2">Previously Used Names</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="previousNames"
                  value={formData.previousNames}
                  onChange={handleChange}
                   {...getInputStyle(formData.previousNames)}
                />
                <button 
                  type="button" 
                  onClick={() => setNA('previousNames')} 
                  className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
                >
                  N/A
                </button>
              </div>
            </div>
          </div>
          
          <div className="form-grid-2col">
            <div>
              <label className="block body mb-2">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.email)}
              />
            </div>

            <div>
              <label className="block body mb-2">
                Phone <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.phone)}
              />
            </div>
          </div>
        </div>
        
        {/* Current Address */}
        <div className="card">
          <h2 className="h3 mb-4 pb-2 border-b border-gray-200">Current Address</h2>
          
          <div className="mt-4">
            <label className="block body mb-2">
              Street Address <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="streetAddress"
              value={formData.streetAddress}
              onChange={handleChange}
              required
               {...getInputStyle(formData.streetAddress)}
            />
          </div>
          
          <div className="form-grid-3col">
            <div>
              <label className="block body mb-2">
                City <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.city)}
              />
            </div>

            <div>
              <label className="block body mb-2">
                State <span className="text-red-600">*</span>
              </label>
              <select
                id="state"
                value={formData.state}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.state)}
              >
                <option value="">Select</option>
                {US_STATES.map(state => (
                  <option key={state.value} value={state.value}>{state.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block body mb-2">
                ZIP Code <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.postalCode)}
              />
            </div>
          </div>
        </div>
        
        {/* Emergency Contact */}
        <div className="card">
          <h2 className="h3 mb-4 pb-2 border-b border-gray-200">Emergency Contact</h2>
          
          <div className="form-grid-2col">
            <div>
              <label className="block body mb-2">
                Emergency Contact Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="emergencyName"
                value={formData.emergencyName}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.emergencyName)}
              />
            </div>

            <div>
              <label className="block body mb-2">
                Relationship <span className="text-red-600">*</span>
              </label>
              <select
                id="emergencyRelationship"
                value={formData.emergencyRelationship}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.emergencyRelationship)}
              >
                <option value="">Select</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="child">Child</option>
                <option value="friend">Friend</option>
              </select>
            </div>
          </div>
          
          <div className="form-grid-2col">
            <div>
              <label className="block body mb-2">
                Emergency Contact Phone <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                id="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.emergencyPhone)}
              />
            </div>

            <div>
              <label className="block body mb-2">Alternate Phone</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  id="emergencyPhoneAlt"
                  value={formData.emergencyPhoneAlt}
                  onChange={handleChange}
                   {...getInputStyle(formData.emergencyPhoneAlt)}
                />
                <button 
                  type="button" 
                  onClick={() => setNA('emergencyPhoneAlt')} 
                  className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
                >
                  N/A
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sensitive Information */}
        <div className="card">
          <h2 className="h3 mb-4 pb-2 border-b border-gray-200">Sensitive Personal Information</h2>
          <p className="body text-sm text-talGray mb-4">This information is encrypted and only used for background checks</p>
          
          <div className="form-grid-2col">
            <div>
              <label className="block body mb-2">
                Driver's License Number <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="dlNumber"
                value={formData.dlNumber}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.dlNumber)}
              />
            </div>

            <div>
              <label className="block body mb-2">
                Driver's License State <span className="text-red-600">*</span>
              </label>
              <select
                id="dlState"
                value={formData.dlState}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.dlState)}
              >
                <option value="">Select</option>
                {US_STATES.map(state => (
                  <option key={state.value} value={state.value}>{state.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-grid-2col">
            <div>
              <label className="block body mb-2">
                Date of Birth <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                id="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.dateOfBirth)}
              />
            </div>

            <div>
              <label className="block body mb-2">
                SSN Last 4 Digits <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="ssnLast4"
                name="ssnLast4"
                maxLength="4"
                value={formData.ssnLast4 || ''}
                onChange={handleChange}
                required
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                className="w-full h-10 px-3 py-2 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-talAqua transition [&::placeholder]:opacity-0 [&::placeholder]:text-transparent"
                style={{
                  ...(!formData.ssnLast4 || formData.ssnLast4.length < 4
                    ? {
                        borderColor: '#ef4444',
                        backgroundColor: '#fef2f2',
                        boxShadow: '0 0 0 2px rgba(254, 202, 202, 0.5)'
                      }
                    : {
                        borderColor: '#9ca3af',
                        backgroundColor: 'white'
                      })
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Residential History */}
        <div className="card">
          <div className="mb-4 pb-2 border-b border-gray-200">
            <h2 className="h3 mb-2">Residential History (7 Years Required)</h2>
            <div className={`mt-2 p-3 rounded-lg border-2 ${
              residentialHistoryCoverage.isComplete 
                ? 'bg-green-50 border-green-300' 
                : 'bg-yellow-50 border-yellow-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="body text-sm font-medium">
                  {residentialHistoryCoverage.isComplete ? (
                    <span className="text-green-700">✓ Coverage Complete</span>
                  ) : (
                    <span className="text-yellow-700">
                      {residentialHistoryCoverage.totalYears.toFixed(2)} years provided •{' '}
                      <strong>{residentialHistoryCoverage.remainingYears.toFixed(2)} years remaining</strong>
                    </span>
                  )}
                </span>
                <span className="body text-xs text-gray-600">
                  {residentialHistoryCoverage.totalYears.toFixed(2)} / 7.00 years
                </span>
              </div>
            </div>
          </div>
          
          {residences.map((res, index) => (
            <div key={res.id} className="border-2 border-gray-200 rounded-xl p-5 bg-white mb-4">
              <div className="flex justify-between items-center mb-4">
                <span className="body font-semibold text-talSlate">Address #{index + 1}</span>
              </div>
              
              <div className="mt-4">
                <label className="block body mb-2">
                  Street Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={res.street}
                  onChange={(e) => updateResidence(res.id, 'street', e.target.value)}
                  required
                   {...getResidenceInputStyle(res.street)}
                />
              </div>
              
              <div className="form-grid-3col">
                <div>
                  <label className="block body mb-2">
                    City <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={res.city}
                    onChange={(e) => updateResidence(res.id, 'city', e.target.value)}
                    required
                     {...getResidenceInputStyle(res.city)}
                  />
                </div>

                <div>
                  <label className="block body mb-2">
                    State <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={res.state}
                    onChange={(e) => updateResidence(res.id, 'state', e.target.value)}
                    required
                     {...getResidenceInputStyle(res.state)}
                  >
                    <option value="">Select</option>
                    {US_STATES.map(state => (
                      <option key={state.value} value={state.value}>{state.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block body mb-2">
                    ZIP Code <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={res.zip}
                    onChange={(e) => updateResidence(res.id, 'zip', e.target.value)}
                    required
                     {...getResidenceInputStyle(res.zip)}
                  />
                </div>
              </div>
              
              <div className="form-grid-2col">
                <div>
                  <label className="block body mb-2">
                    From Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={res.fromDate}
                    onChange={(e) => updateResidence(res.id, 'fromDate', e.target.value)}
                    required
                     {...getResidenceInputStyle(res.fromDate)}
                  />
                </div>
                <div className="w-full">
                  <label className="block body mb-2">End Date</label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="date"
                      value={res.toDate}
                      onChange={(e) => updateResidence(res.id, 'toDate', e.target.value)}
                       {...getResidenceInputStyle(res.toDate || res.current)}
                    />
                    <label className="flex items-center gap-2 body text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={res.current}
                        onChange={() => toggleCurrentResidence(res.id)}
                        className="rounded border-gray-400 text-talBlue focus:ring-talAqua"
                      />
                      <span>Current</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            type="button" 
            onClick={() => navigate('/app/onboarding/step-2')} 
            className="btn btn-secondary"
          >
            ← Back
          </button>
          <button type="submit" className="btn btn-primary flex-1">
            Continue to Professional Information →
          </button>
        </div>
      </form>
    </section>
  );
};

export default Onb3;