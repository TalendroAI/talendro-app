import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Onb4 = () => {
  console.log('Onb4');
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    desiredSalary: '',
    availableStartDate: '',
    workArrangement: [],
    willingToRelocate: '',
    travelPercentage: '',
    howHeardAboutJobs: '',
    shiftPreference: '',
    legallyAuthorized: '',
    requiresSponsorship: '',
    nonCompeteAgreement: '',
    criminalHistory: '',
    backgroundCheckConsent: '',
    workRestrictions: '',
    legalExplanation: '',
    hasSecurityClearance: '',
    clearanceLevel: '',
    clearanceGrantDate: '',
    clearanceExpDate: ''
  });

  const [licenses, setLicenses] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [references, setReferences] = useState([
    { id: 1, name: '', title: '', company: '', relationship: '', email: '', phone: '', contact: '' },
    { id: 2, name: '', title: '', company: '', relationship: '', email: '', phone: '', contact: '' },
    { id: 3, name: '', title: '', company: '', relationship: '', email: '', phone: '', contact: '' }
  ]);
  const [employment, setEmployment] = useState([
    { id: 1, company: '', title: '', start: '', end: '', city: '', state: '', reason: '', responsibilities: '', current: false }
  ]);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    
    if (type === 'checkbox' && id.includes('workArrangement')) {
      const arrangement = value;
      setFormData(prev => ({
        ...prev,
        workArrangement: checked
          ? [...prev.workArrangement, arrangement]
          : prev.workArrangement.filter(a => a !== arrangement)
      }));
    } else {
      setFormData(prev => ({...prev, [id]: value}));
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

  // Employment functions
  const addEmployment = () => {
    const newId = employment.length + 1;
    setEmployment([...employment, { id: newId, company: '', title: '', start: '', end: '', city: '', state: '', reason: '', responsibilities: '', current: false }]);
  };

  const removeEmployment = (id) => {
    if (employment.length > 1) {
      setEmployment(employment.filter(emp => emp.id !== id));
    }
  };

  const updateEmployment = (id, field, value) => {
    setEmployment(employment.map(emp =>
      emp.id === id ? {...emp, [field]: value} : emp
    ));
  };

  const toggleCurrentEmployment = (id) => {
    setEmployment(employment.map(emp =>
      emp.id === id ? {...emp, current: !emp.current, end: emp.current ? emp.end : ''} : emp
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const completeData = {
      ...formData,
      licenses,
      certifications,
      references,
      employment
    };
    
    localStorage.setItem('step3Data', JSON.stringify(completeData));
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
          
          <div className="grid md:grid-cols-2 gap-6">
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
          
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div>
              <label className="block body mb-2">
                Willing to Relocate? <span className="text-red-600">*</span>
              </label>
              <select
                id="willingToRelocate"
                value={formData.willingToRelocate}
                onChange={handleChange}
                required
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
                 {...getInputStyle(formData.travelPercentage)}
              >
                <option value="">Select</option>
                <option value="0">0% - No travel</option>
                <option value="25">25% - Occasional travel</option>
                <option value="50">50% - Regular travel</option>
                <option value="75">75% - Frequent travel</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Legal & Compliance */}
        <div className="card">
          <h2 className="h3 mb-4 pb-2 border-b border-gray-200">Legal and Compliance Questions</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block body mb-2">
                Legally Authorized to Work in USA? <span className="text-red-600">*</span>
              </label>
              <select
                id="legallyAuthorized"
                value={formData.legallyAuthorized}
                onChange={handleChange}
                required
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
                 {...getInputStyle(formData.requiresSponsorship)}
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div>
              <label className="block body mb-2">
                Bound by Non-Compete Agreement? <span className="text-red-600">*</span>
              </label>
              <select
                id="nonCompeteAgreement"
                value={formData.nonCompeteAgreement}
                onChange={handleChange}
                required
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
                 {...getInputStyle(formData.criminalHistory)}
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Professional References */}
        <div className="card">
          <h2 className="h3 mb-4 pb-2 border-b border-gray-200">Professional References</h2>
          <p className="body text-sm text-talGray mb-4">Please provide 3-5 professional references</p>
          
          {references.map((ref, index) => (
            <div key={ref.id} className="border-2 border-gray-200 rounded-xl p-5 bg-white mb-4">
              <div className="flex justify-between items-center mb-4">
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
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block body mb-2">
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={ref.name}
                    onChange={(e) => updateReference(ref.id, 'name', e.target.value)}
                    required
                     {...getCollectionInputStyle(ref.name)}
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
                     {...getCollectionInputStyle(ref.title)}
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block body mb-2">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={ref.email}
                    onChange={(e) => updateReference(ref.id, 'email', e.target.value)}
                    required
                     {...getCollectionInputStyle(ref.email)}
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
                     {...getCollectionInputStyle(ref.phone)}
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
                   {...getCollectionInputStyle(ref.relationship)}
                >
                  <option value="">Select</option>
                  <option value="supervisor">Former Supervisor</option>
                  <option value="colleague">Colleague</option>
                  <option value="client">Client</option>
                </select>
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
          <h2 className="h3 mb-4 pb-2 border-b border-gray-200">Employment History (10 Years Required)</h2>
          
          {employment.map((emp, index) => (
            <div key={emp.id} className="border-2 border-gray-200 rounded-xl p-5 bg-white mb-4">
              <div className="flex justify-between items-center mb-4">
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
              
              <div className="grid md:grid-cols-2 gap-6">
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
              
              <div className="grid md:grid-cols-2 gap-6 mt-4">
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
                      disabled={emp.current}
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
          ))}
          
          <button 
            type="button" 
            onClick={addEmployment}
            className="btn btn-secondary mt-4"
          >
            + Add Another Employer
          </button>
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