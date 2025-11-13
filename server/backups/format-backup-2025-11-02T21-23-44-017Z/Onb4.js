import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutoSave, loadSavedData } from '../../hooks/useAutoSave';

const Onb4 = () => {
  console.log('Onb4');
  const navigate = useNavigate();
  
  // Load saved form data
  const [formData, setFormData] = useState(() => 
    loadSavedData('onboarding_step4_form', {
      desiredSalary: '',
      availableStartDate: '',
      workArrangement: [],
      willingToRelocate: '',
      travelPercentage: '',
      howHeardAboutJobs: '',
      shiftPreference: '',
      legallyAuthorized: 'yes',
      requiresSponsorship: 'no',
      nonCompeteAgreement: 'no',
      criminalHistory: 'no',
      backgroundCheckConsent: 'yes',
      workRestrictions: 'no',
      legalExplanation: '',
      hasSecurityClearance: 'no',
      clearanceLevel: '',
      clearanceGrantDate: '',
      clearanceExpDate: ''
    })
  );

  // Load saved arrays
  const [licenses, setLicenses] = useState(() => 
    loadSavedData('onboarding_step4_licenses', [])
  );
  
  const [certifications, setCertifications] = useState(() => 
    loadSavedData('onboarding_step4_certifications', [])
  );
  
  const [references, setReferences] = useState(() => {
    const saved = loadSavedData('onboarding_step4_references', []);
    // If no saved references, start with 3 empty ones
    if (saved.length === 0) {
      return Array.from({ length: 3 }, (_, i) => ({
        id: i + 1,
        name: '',
        title: '',
        company: '',
        relationship: '',
        email: '',
        phone: '',
        contact: ''
      }));
    }
    return saved;
  });
  
  const [employment, setEmployment] = useState(() => {
    const saved = loadSavedData('onboarding_step4_employment', []);
    // If no saved employment, start with 1 empty one
    if (saved.length === 0) {
      return [{
        id: 1,
        company: '',
        title: '',
        start: '',
        end: '',
        city: '',
        state: '',
        reason: '',
        responsibilities: '',
        current: false,
        autoAdded: false
      }];
    }
    return saved;
  });

  // Education state
  const [education, setEducation] = useState(() => {
    const saved = loadSavedData('onboarding_step4_education', []);
    // If no saved education, start with 1 empty entry
    if (saved.length === 0) {
      return [{
        id: 1,
        institution: '',
        degreeType: '',
        fieldOfStudy: '',
        graduationDate: '',
        gpa: '',
        honors: '',
        additionalDetails: '',
        stillEnrolled: false
      }];
    }
    return saved;
  });

  // Auto-save all data
  useAutoSave('onboarding_step4_form', formData);
  useAutoSave('onboarding_step4_licenses', licenses);
  useAutoSave('onboarding_step4_certifications', certifications);
  useAutoSave('onboarding_step4_references', references);
  useAutoSave('onboarding_step4_employment', employment);
  useAutoSave('onboarding_step4_education', education);

  // Load from parsed resume data on mount
  useEffect(() => {
    const resumeData = JSON.parse(localStorage.getItem('resumeData') || 'null');
    const prefill = resumeData?.prefill;
    
    if (prefill?.step4) {
      const step4 = prefill.step4;
      
      // Populate work history if not already loaded
      if (step4.workHistory && step4.workHistory.length > 0 && employment.length === 1 && !employment[0].company) {
        const employmentData = step4.workHistory.map((job, index) => ({
          id: index + 1,
          company: job.companyName || '',
          title: job.jobTitle || '',
          start: job.startDate || '',
          end: job.endDate || '',
          city: job.location ? job.location.split(',')[0].trim() : '',
          state: job.location ? job.location.split(',')[1]?.trim() : '',
          reason: '',
          responsibilities: job.description || '',
          current: job.current || false,
          autoAdded: false
        }));
        setEmployment(employmentData);
      }
      
      // Populate licenses if available
      if (step4.licenses && step4.licenses.length > 0 && licenses.length === 0) {
        const licensesData = step4.licenses.map((lic, index) => ({
          id: index + 1,
          type: lic.type || '',
          number: lic.number || '',
          state: lic.state || '',
          expiration: lic.expiration || ''
        }));
        setLicenses(licensesData);
      }
      
      // Populate certifications if available
      if (step4.certifications && step4.certifications.length > 0 && certifications.length === 0) {
        const certsData = step4.certifications.map((cert, index) => ({
          id: index + 1,
          name: cert.name || '',
          issuer: cert.issuer || '',
          date: cert.dateEarned || '',
          expiration: cert.expiration || ''
        }));
        setCertifications(certsData);
      }
      
      // Populate references if available
      if (step4.references && step4.references.length > 0) {
        const refsData = step4.references.map((ref, index) => ({
          id: index + 1,
          name: ref.name || '',
          title: ref.title || '',
          company: ref.company || '',
          relationship: ref.relationship || '',
          email: ref.email || '',
          phone: ref.phone || '',
          contact: ref.mayContact || ''
        }));
        setReferences(refsData);
      }
      
      // Populate education if available
      if (step4.education && step4.education.length > 0 && education.length === 1 && !education[0].institution) {
        const educationData = step4.education.map((edu, index) => ({
          id: index + 1,
          institution: edu.institution || '',
          degreeType: mapDegreeType(edu.degree || edu.studyType || ''),
          fieldOfStudy: edu.area || edu.major || '',
          graduationDate: edu.endDate || '',
          gpa: edu.score || '',
          honors: edu.honors || '',
          additionalDetails: '',
          stillEnrolled: false
        }));
        setEducation(educationData);
      }
    }
  }, []);
  
  // Helper function to map parsed degree names
  const mapDegreeType = (degree) => {
    const lower = degree.toLowerCase();
    if (lower.includes('bachelor') || lower.includes('ba') || lower.includes('bs')) return 'bachelor';
    if (lower.includes('master') || lower.includes('ma') || lower.includes('ms') || lower.includes('mba')) return 'master';
    if (lower.includes('phd') || lower.includes('doctorate') || lower.includes('doctoral')) return 'doctoral';
    if (lower.includes('associate') || lower.includes('aa') || lower.includes('as')) return 'associate';
    if (lower.includes('high school') || lower.includes('diploma') || lower.includes('ged')) return 'high_school';
    if (lower.includes('jd') || lower.includes('md') || lower.includes('dds')) return 'professional';
    if (lower.includes('certificate')) return 'certificate';
    return '';
  };

  const handleChange = (e) => {
    const { id, value, type, checked, name } = e.target;
    
    if (name === 'workArrangement') {
      setFormData(prev => {
        const arr = prev.workArrangement || [];
        if (checked) {
          return { ...prev, workArrangement: [...arr, value] };
        } else {
          return { ...prev, workArrangement: arr.filter(v => v !== value) };
        }
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [id]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // License functions
  const addLicense = () => {
    const newId = licenses.length + 1;
    setLicenses([...licenses, { id: newId, type: '', number: '', state: '', exp: '' }]);
  };

  const removeLicense = (id) => {
    setLicenses(licenses.filter(lic => lic.id !== id));
  };

  const updateLicense = (id, field, value) => {
    setLicenses(licenses.map(lic =>
      lic.id === id ? {...lic, [field]: value} : lic
    ));
  };

  // Certification functions
  const addCertification = () => {
    const newId = certifications.length + 1;
    setCertifications([...certifications, { id: newId, name: '', issuer: '', date: '', exp: '' }]);
  };

  const removeCertification = (id) => {
    setCertifications(certifications.filter(cert => cert.id !== id));
  };

  const updateCertification = (id, field, value) => {
    setCertifications(certifications.map(cert =>
      cert.id === id ? {...cert, [field]: value} : cert
    ));
  };

  // Reference functions
  const addReference = () => {
    const newId = references.length + 1;
    setReferences([...references, { id: newId, name: '', title: '', company: '', relationship: '', email: '', phone: '', contact: '' }]);
  };

  const removeReference = (id) => {
    if (references.length > 1) {
      setReferences(references.filter(ref => ref.id !== id));
    }
  };

  const updateReference = (id, field, value) => {
    setReferences(references.map(ref =>
      ref.id === id ? {...ref, [field]: value} : ref
    ));
  };

  // Education functions
  const addEducation = () => {
    const newId = Math.max(...education.map(e => e.id), 0) + 1;
    setEducation(prev => [...prev, {
      id: newId,
      institution: '',
      degreeType: '',
      fieldOfStudy: '',
      graduationDate: '',
      gpa: '',
      honors: '',
      additionalDetails: '',
      stillEnrolled: false
    }]);
  };

  const removeEducation = (id) => {
    setEducation(prev => prev.filter(edu => edu.id !== id));
  };

  const updateEducation = (id, field, value) => {
    setEducation(prev => prev.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  // Employment functions
  const addEmployment = () => {
    const newId = employment.length + 1;
    setEmployment([...employment, { id: newId, company: '', title: '', start: '', end: '', city: '', state: '', reason: '', responsibilities: '', current: false, autoAdded: false }]);
  };

  const removeEmployment = (id) => {
    setEmployment(prev => prev.filter(emp => emp.id !== id));
  };

  const updateEmployment = (id, field, value) => {
    setEmployment(employment.map(emp =>
      emp.id === id ? {...emp, [field]: value} : emp
    ));
  };

  const toggleCurrentEmployment = (id) => {
    setEmployment(employment.map(emp => {
      if (emp.id === id) {
        const newCurrent = !emp.current;
        // If checking "Current", clear end; if unchecking, keep existing end
        return {
          ...emp,
          current: newCurrent,
          end: newCurrent ? '' : emp.end
        };
      }
      return emp;
    }));
  };

  // Calculate duration of a single employment entry in years
  const calculateEmploymentYears = (emp) => {
    if (!emp.start) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(emp.start);
    startDate.setHours(0, 0, 0, 0);
    
    let endDate;
    if (emp.current) {
      endDate = today;
    } else if (emp.end) {
      endDate = new Date(emp.end);
      endDate.setHours(0, 0, 0, 0);
    } else {
      return 0; // No end date and not current
    }
    
    const daysDiff = Math.max(0, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)));
    return daysDiff / 365.25; // Convert to years
  };

  // Calculate total years covered by employment history
  const employmentHistoryCoverage = useMemo(() => {
    const REQUIRED_YEARS = 10;
    
    if (!employment || employment.length === 0) {
      return {
        totalYears: 0,
        remainingYears: REQUIRED_YEARS,
        isComplete: false
      };
    }
    
    let totalDays = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    employment.forEach(emp => {
      if (!emp.start) return; // Skip if no start date
      
      const startDate = new Date(emp.start);
      startDate.setHours(0, 0, 0, 0);
      
      let endDate;
      if (emp.current) {
        // For current employment, use today as end date
        endDate = today;
      } else if (emp.end) {
        endDate = new Date(emp.end);
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
  }, [employment]);

  // Dynamically add/remove employment entries based on manually-added employment's coverage
  useEffect(() => {
    const REQUIRED_YEARS = 10;
    
    // Separate manually-added from auto-added employment
    const manuallyAdded = employment.filter(e => !e.autoAdded);
    const autoAdded = employment.filter(e => e.autoAdded);
    
    // Only proceed if we have at least one manually-added employment with complete dates
    if (manuallyAdded.length === 0) return;
    
    // Calculate total years covered by manually-added employment with valid dates
    let totalDays = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let hasCompleteEmployment = false;
    
    manuallyAdded.forEach(emp => {
      if (!emp.start) return; // Skip if no start date
      
      // Check if this employment has complete date information
      const hasEndDate = emp.current || emp.end;
      if (!hasEndDate) return; // Skip if no end date and not current
      
      hasCompleteEmployment = true;
      
      const startDate = new Date(emp.start);
      startDate.setHours(0, 0, 0, 0);
      
      let endDate;
      if (emp.current) {
        endDate = today;
      } else {
        endDate = new Date(emp.end);
        endDate.setHours(0, 0, 0, 0);
      }
      
      const daysDiff = Math.max(0, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)));
      totalDays += daysDiff;
    });
    
    // Don't do anything until at least one manually-added employment has complete dates
    if (!hasCompleteEmployment) {
      // If we have auto-added employment but no complete manually-added ones, remove them
      if (autoAdded.length > 0) {
        setEmployment(manuallyAdded);
      }
      return;
    }
    
    const totalYears = totalDays / 365.25;
    const remainingYears = Math.max(0, REQUIRED_YEARS - totalYears);
    const isComplete = totalYears >= REQUIRED_YEARS;
    
    // If coverage is complete, remove all auto-added employment
    if (isComplete && autoAdded.length > 0) {
      setEmployment(manuallyAdded);
      return;
    }
    
    // If coverage is incomplete, ensure we have enough auto-added employment
    if (!isComplete && remainingYears > 0.5) {
      // Calculate how many auto-added employment entries we should have
      // Assume each employment might cover 2-4 years, so roughly one per 3 years needed
      const estimatedEntriesNeeded = Math.ceil(remainingYears / 3);
      const entriesNeeded = Math.min(estimatedEntriesNeeded, 4); // Max 4 auto-added
      
      // If we don't have enough auto-added employment, add more
      if (autoAdded.length < entriesNeeded) {
        const toAdd = entriesNeeded - autoAdded.length;
        const newAutoAdded = [];
        const maxId = Math.max(...employment.map(e => e.id), 0);
        
        for (let i = 0; i < toAdd; i++) {
          newAutoAdded.push({
            id: maxId + i + 1,
            company: '',
            title: '',
            start: '',
            end: '',
            city: '',
            state: '',
            reason: '',
            responsibilities: '',
            current: false,
            autoAdded: true
          });
        }
        
        setEmployment([...manuallyAdded, ...autoAdded, ...newAutoAdded]);
      }
      // If we have too many auto-added employment, remove excess
      else if (autoAdded.length > entriesNeeded) {
        const toKeep = autoAdded.slice(0, entriesNeeded);
        setEmployment([...manuallyAdded, ...toKeep]);
      }
    }
    // If we have auto-added employment but they're no longer needed
    else if (remainingYears <= 0.5 && autoAdded.length > 0) {
      setEmployment(manuallyAdded);
    }
    
    // Only run this effect when employment dates change (create a dependency string from all dates)
  }, [employment.map(e => `${e.id}-${e.start}-${e.end}-${e.current}`).join('|')]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Data is already auto-saved, just navigate
    navigate('/app/onboarding/step-5');
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

  const getCollectionInputStyle = (value) => {
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

  const getTextareaStyle = (value) => {
    const isEmpty = !value || (typeof value === 'string' && value.trim() === '') || value === '';
    const baseClass = 'w-full px-3 py-2 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-talAqua transition resize-y min-h-[100px]';
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
        <a href="/app/onboarding/step-3" className="text-talBlue hover:underline flex items-center gap-2">
          ← Back to Personal Information
        </a>
      </div>
      
      <h1 className="h1">Professional Information</h1>
      <p className="body mt-2 text-talGray">Please complete all fields</p>
      
      {/* Progress Bar */}
      <div className="mt-6 mb-6 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-talBlue to-talAqua transition-all duration-300" style={{width: '60%'}}></div>
      </div>

      {/* Alert */}
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
        <p className="body text-sm text-red-800">
          Please review all parsed data and complete any missing information, indicated by <strong className="font-bold" style={{color: '#dc2626'}}>red highlighting</strong>.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Search Preferences */}
        <div className="card">
          <h2 className="h3 mb-4 pb-2 border-b border-gray-200">Job Search Preferences</h2>
          
          <div className="form-grid-2col">
            <div>
              <label className="block body mb-2">
                Desired Base Annual Salary <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="desiredSalary"
                value={formData.desiredSalary}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.desiredSalary)}
              />
            </div>

            <div>
              <label className="block body mb-2">
                Available Start Date <span className="text-red-600">*</span>
              </label>
              <select
                id="availableStartDate"
                value={formData.availableStartDate}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.availableStartDate)}
              >
                <option value="">Select</option>
                <option value="immediately">Immediately</option>
                <option value="one_week">One week</option>
                <option value="two_weeks">Two weeks (standard notice)</option>
                <option value="three_weeks">Three weeks</option>
                <option value="four_weeks">Four weeks</option>
                <option value="custom">Custom (will specify)</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block body mb-2">
              Preferred Work Arrangement <span className="text-red-600">*</span>
            </label>
            <div 
              className="flex flex-wrap gap-4 p-4 border-2 rounded-xl"
              style={
                formData.workArrangement.length === 0 
                  ? { borderColor: '#ef4444', backgroundColor: '#fef2f2', boxShadow: '0 0 0 2px rgba(254, 202, 202, 0.5)' }
                  : { borderColor: '#9ca3af', backgroundColor: '#f9fafb' }
              }
            >
              <label className="flex items-center gap-2 body cursor-pointer">
                <input
                  type="checkbox"
                  name="workArrangement"
                  id="workArrangement_onsite"
                  value="onsite"
                  checked={formData.workArrangement.includes('onsite')}
                  onChange={handleChange}
                  className="rounded border-gray-400 text-talBlue focus:ring-talAqua"
                />
                <span>Onsite</span>
              </label>
              <label className="flex items-center gap-2 body cursor-pointer">
                <input
                  type="checkbox"
                  name="workArrangement"
                  id="workArrangement_remote"
                  value="remote"
                  checked={formData.workArrangement.includes('remote')}
                  onChange={handleChange}
                  className="rounded border-gray-400 text-talBlue focus:ring-talAqua"
                />
                <span>Remote</span>
              </label>
              <label className="flex items-center gap-2 body cursor-pointer">
                <input
                  type="checkbox"
                  name="workArrangement"
                  id="workArrangement_hybrid"
                  value="hybrid"
                  checked={formData.workArrangement.includes('hybrid')}
                  onChange={handleChange}
                  className="rounded border-gray-400 text-talBlue focus:ring-talAqua"
                />
                <span>Hybrid</span>
              </label>
            </div>
          </div>
          
          <div className="form-grid-2col">
            <div>
              <label className="block body mb-2">
                Willing to Relocate? <span className="text-red-600">*</span>
              </label>
              <select
                id="willingToRelocate"
                value={formData.willingToRelocate}
                onChange={handleChange}
                required
                className="w-full"
                {...getInputStyle(formData.willingToRelocate)}
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="depends">Depends on opportunity</option>
              </select>
            </div>

            <div>
              <label className="block body mb-2">
                Travel Percentage <span className="text-red-600">*</span>
              </label>
              <select
                id="travelPercentage"
                value={formData.travelPercentage}
                onChange={handleChange}
                required
                className="w-full"
                {...getInputStyle(formData.travelPercentage)}
              >
                <option value="">Select</option>
                <option value="0">0% - No travel</option>
                <option value="25">25% - Occasional travel</option>
                <option value="50">50% - Regular travel</option>
                <option value="75">75% - Frequent travel</option>
                <option value="100">100% - Constant travel</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Legal & Compliance */}
        <div className="card">
          <h2 className="h3 mb-4 pb-2 border-b border-gray-200">Legal and Compliance Questions</h2>
          
          <div className="form-grid-2col">
            <div>
              <label className="block body mb-2">
                Legally Authorized to Work in USA? <span className="text-red-600">*</span>
              </label>
              <select
                id="legallyAuthorized"
                value={formData.legallyAuthorized}
                onChange={handleChange}
                required
                className="w-full"
                 {...getInputStyle(formData.legallyAuthorized)}
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div>
              <label className="block body mb-2">
                Will Require Future Sponsorship? <span className="text-red-600">*</span>
              </label>
              <select
                id="requiresSponsorship"
                value={formData.requiresSponsorship}
                onChange={handleChange}
                required
                className="w-full"
                 {...getInputStyle(formData.requiresSponsorship)}
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
          
          <div className="form-grid-2col">
            <div>
              <label className="block body mb-2">
                Bound by Non-Compete Agreement? <span className="text-red-600">*</span>
              </label>
              <select
                id="nonCompeteAgreement"
                value={formData.nonCompeteAgreement}
                onChange={handleChange}
                required
                className="w-full"
                 {...getInputStyle(formData.nonCompeteAgreement)}
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div>
              <label className="block body mb-2">
                Criminal History? <span className="text-red-600">*</span>
              </label>
              <select
                id="criminalHistory"
                value={formData.criminalHistory}
                onChange={handleChange}
                required
                className="w-full"
                 {...getInputStyle(formData.criminalHistory)}
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Education History */}
        <div className="card">
          <h2 className="h3 mb-4 pb-2 border-b border-gray-200">Education History</h2>
          <p className="body text-sm text-talGray mb-4">
            List all degrees, certifications, and relevant education. Include incomplete degrees if relevant.
          </p>
          
          <div className="space-y-4">
            {education.map((edu, index) => (
              <div key={edu.id} className="border-2 border-gray-200 rounded-xl bg-white">
                <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-200">
                  <span className="body font-semibold text-talSlate">Education #{index + 1}</span>
                  {education.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeEducation(edu.id)}
                      className="px-3 py-1 bg-red-50 text-red-600 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="p-6 pt-4">
                  {/* Institution & Degree Type */}
                  <div className="form-grid-2col">
                    <div>
                      <label className="block body mb-2">
                        Institution/School Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                        placeholder="e.g., University of Florida"
                        required
                        {...getInputStyle(edu.institution)}
                      />
                    </div>

                    <div>
                      <label className="block body mb-2">
                        Degree Type <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={edu.degreeType}
                        onChange={(e) => updateEducation(edu.id, 'degreeType', e.target.value)}
                        required
                        {...getInputStyle(edu.degreeType)}
                      >
                        <option value="">Select</option>
                        <option value="high_school">High School Diploma/GED</option>
                        <option value="associate">Associate Degree (AA/AS)</option>
                        <option value="bachelor">Bachelor's Degree (BA/BS)</option>
                        <option value="master">Master's Degree (MA/MS/MBA)</option>
                        <option value="doctoral">Doctoral Degree (PhD/EdD)</option>
                        <option value="professional">Professional Degree (JD/MD/DDS)</option>
                        <option value="certificate">Certificate Program</option>
                        <option value="trade">Trade/Vocational Training</option>
                        <option value="some_college">Some College (No Degree)</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Field of Study & Graduation Date */}
                  <div className="form-grid-2col">
                    <div>
                      <label className="block body mb-2">
                        Field of Study/Major <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={edu.fieldOfStudy}
                        onChange={(e) => updateEducation(edu.id, 'fieldOfStudy', e.target.value)}
                        placeholder="e.g., Computer Science"
                        required
                        {...getInputStyle(edu.fieldOfStudy)}
                      />
                    </div>

                    <div>
                      <label className="block body mb-2">
                        Graduation Date <span className="text-red-600">*</span>
                      </label>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input
                          type="date"
                          value={edu.graduationDate}
                          onChange={(e) => updateEducation(edu.id, 'graduationDate', e.target.value)}
                          disabled={edu.stillEnrolled}
                          required={!edu.stillEnrolled}
                          {...getInputStyle(edu.graduationDate)}
                        />
                        <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                          <input 
                            type="checkbox" 
                            checked={edu.stillEnrolled}
                            onChange={(e) => updateEducation(edu.id, 'stillEnrolled', e.target.checked)}
                            className="w-auto"
                          />
                          <span className="text-sm">Currently Enrolled</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* GPA & Honors */}
                  <div className="form-grid-2col">
                    <div>
                      <label className="block body mb-2">
                        GPA (Optional)
                      </label>
                      <input
                        type="text"
                        value={edu.gpa}
                        onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                        placeholder="e.g., 3.8 or 3.8/4.0"
                        className="w-full h-10 px-3 py-2 border-2 border-gray-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-talAqua transition"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave blank if not applicable</p>
                    </div>

                    <div>
                      <label className="block body mb-2">
                        Honors/Awards (Optional)
                      </label>
                      <input
                        type="text"
                        value={edu.honors}
                        onChange={(e) => updateEducation(edu.id, 'honors', e.target.value)}
                        placeholder="e.g., Summa Cum Laude, Dean's List"
                        className="w-full h-10 px-3 py-2 border-2 border-gray-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-talAqua transition"
                      />
                    </div>
                  </div>
                  
                  {/* Additional Details (Optional) */}
                  <div>
                    <label className="block body mb-2">
                      Additional Details (Optional)
                    </label>
                    <textarea
                      value={edu.additionalDetails}
                      onChange={(e) => updateEducation(edu.id, 'additionalDetails', e.target.value)}
                      rows="2"
                      placeholder="Relevant coursework, thesis/dissertation, study abroad, etc."
                      className="w-full px-3 py-2 border-2 border-gray-300 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-talAqua transition resize-vertical"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            type="button" 
            onClick={addEducation}
            className="mt-4 px-4 py-2 bg-white text-talBlue border-2 border-talBlue rounded-lg font-medium hover:bg-blue-50 transition"
          >
            + Add Another Education Entry
          </button>
        </div>
        
        {/* Professional References */}
        <div className="card">
          <h2 className="h3 mb-4 pb-2 border-b border-gray-200">Professional References</h2>
          <p className="body text-sm text-talGray mb-4">Please provide 3-5 professional references</p>
          
          {references.map((ref, index) => (
            <div key={ref.id} className="border-2 border-gray-200 rounded-xl bg-white mb-4">
              <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-200">
                <span className="body font-semibold text-talSlate">Reference #{index + 1}</span>
                {references.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeReference(ref.id)}
                    className="px-3 py-1 bg-red-50 text-red-600 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="p-6 pt-4">
              <div className="form-grid-2col">
                <div>
                  <label className="block body mb-2">
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={ref.name}
                    onChange={(e) => updateReference(ref.id, 'name', e.target.value)}
                    required
                     {...getInputStyle(ref.name)}
                  />
                </div>

                <div>
                  <label className="block body mb-2">
                    Job Title <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={ref.title}
                    onChange={(e) => updateReference(ref.id, 'title', e.target.value)}
                    required
                     {...getInputStyle(ref.title)}
                  />
                </div>
              </div>
              
              <div className="form-grid-2col">
                <div>
                  <label className="block body mb-2">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={ref.email}
                    onChange={(e) => updateReference(ref.id, 'email', e.target.value)}
                    required
                     {...getInputStyle(ref.email)}
                  />
                </div>

                <div>
                  <label className="block body mb-2">
                    Phone <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    value={ref.phone}
                    onChange={(e) => updateReference(ref.id, 'phone', e.target.value)}
                    required
                     {...getInputStyle(ref.phone)}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block body mb-2">
                  Relationship <span className="text-red-600">*</span>
                </label>
                <select
                  value={ref.relationship}
                  onChange={(e) => updateReference(ref.id, 'relationship', e.target.value)}
                  required
                   {...getInputStyle(ref.relationship)}
                >
                  <option value="">Select</option>
                  <option value="supervisor">Former Supervisor</option>
                  <option value="manager">Former Manager</option>
                  <option value="colleague">Colleague/Co-worker</option>
                  <option value="direct_report">Direct Report</option>
                  <option value="client">Client/Customer</option>
                  <option value="vendor">Vendor/Supplier</option>
                  <option value="mentor">Mentor</option>
                  <option value="professor">Professor/Teacher</option>
                  <option value="other">Other</option>
                </select>
              </div>
              </div>
            </div>
          ))}
          
          <button 
            type="button" 
            onClick={addReference}
            className="btn btn-secondary mt-4"
          >
            + Add Reference
          </button>
        </div>
        
        {/* Employment History */}
        <div className="card">
          <div className="mb-4 pb-2 border-b border-gray-200">
            <h2 className="h3 mb-2">Employment History (10 Years Required)</h2>
            <div className={`mt-2 p-3 rounded-lg border-2 ${
              employmentHistoryCoverage.isComplete 
                ? 'bg-green-50 border-green-300' 
                : 'bg-yellow-50 border-yellow-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="body text-sm font-medium">
                  {employmentHistoryCoverage.isComplete ? (
                    <span className="text-green-700">✓ Coverage Complete</span>
                  ) : (
                    <span className="text-yellow-700">
                      {employmentHistoryCoverage.totalYears.toFixed(2)} years provided •{' '}
                      <strong>{employmentHistoryCoverage.remainingYears.toFixed(2)} years remaining</strong>
                    </span>
                  )}
                </span>
                <span className="body text-xs text-gray-600">
                  {employmentHistoryCoverage.totalYears.toFixed(2)} / 10.00 years
                </span>
              </div>
            </div>
          </div>
          
          {employment.map((emp, index) => (
            <div key={emp.id} className="border-2 border-gray-200 rounded-xl bg-white mb-4">
              <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-200">
                <span className="body font-semibold text-talSlate">Employer #{index + 1}</span>
                {employment.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeEmployment(emp.id)}
                    className="px-3 py-1 bg-red-50 text-red-600 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="p-6 pt-4">
              <div className="form-grid-2col">
                <div>
                  <label className="block body mb-2">
                    Company Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={emp.company}
                    onChange={(e) => updateEmployment(emp.id, 'company', e.target.value)}
                    required
                     {...getCollectionInputStyle(emp.company)}
                  />
                </div>

                <div>
                  <label className="block body mb-2">
                    Job Title <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={emp.title}
                    onChange={(e) => updateEmployment(emp.id, 'title', e.target.value)}
                    required
                     {...getCollectionInputStyle(emp.title)}
                  />
                </div>
              </div>
              
              <div className="form-grid-2col">
                <div>
                  <label className="block body mb-2">
                    Start Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={emp.start}
                    onChange={(e) => updateEmployment(emp.id, 'start', e.target.value)}
                    required
                     {...getCollectionInputStyle(emp.start)}
                  />
                </div>

                <div>
                  <label className="block body mb-2">End Date</label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="date"
                      value={emp.end}
                      onChange={(e) => updateEmployment(emp.id, 'end', e.target.value)}
                       {...getCollectionInputStyle(emp.end || emp.current)}
                    />
                    <label className="flex items-center gap-2 body text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emp.current}
                        onChange={() => toggleCurrentEmployment(emp.id)}
                        className="rounded border-gray-400 text-talBlue focus:ring-talAqua"
                      />
                      <span>Current</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block body mb-2">Responsibilities/Achievements</label>
                <textarea
                  value={emp.responsibilities}
                  onChange={(e) => updateEmployment(emp.id, 'responsibilities', e.target.value)}
                  rows={3}
                   {...getTextareaStyle(emp.responsibilities)}
                />
              </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            type="button" 
            onClick={() => navigate('/app/onboarding/step-3')} 
            className="btn btn-secondary"
          >
            ← Back
          </button>
          <button type="submit" className="btn btn-primary flex-1">
            Continue to Disclosures & Authorizations →
          </button>
        </div>
      </form>
    </section>
  );
};

export default Onb4;