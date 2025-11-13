import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Onb3 = () => {
  console.log('Onb3');
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
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
  });

  const [residences, setResidences] = useState([
    { id: 1, street: '', city: '', state: '', zip: '', fromDate: '', toDate: '', current: false }
  ]);

  useEffect(() => {
    // Auto-fill from localStorage if available
    const resumeData = JSON.parse(localStorage.getItem('resumeData') || 'null');
    if (resumeData?.data?.prefill?.step3) {
      setFormData(prev => ({...prev, ...resumeData.data.prefill.step3}));
    }
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
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
      current: false
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
    setResidences(residences.map(res =>
      res.id === id ? {...res, current: !res.current, toDate: res.current ? res.toDate : ''} : res
    ));
  };

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
          
          <div className="grid md:grid-cols-2 gap-6">
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
          
          <div className="grid md:grid-cols-2 gap-6 mt-4">
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
          
          <div className="grid md:grid-cols-2 gap-6 mt-4">
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
          
          <div className="grid md:grid-cols-3 gap-6 mt-4">
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
                <option value="FL">Florida</option>
                <option value="CA">California</option>
                <option value="NY">New York</option>
                <option value="TX">Texas</option>
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
          
          <div className="grid md:grid-cols-2 gap-6">
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
          
          <div className="grid md:grid-cols-2 gap-6 mt-4">
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
              <input
                type="tel"
                id="emergencyPhoneAlt"
                value={formData.emergencyPhoneAlt}
                onChange={handleChange}
                 {...getInputStyle(formData.emergencyPhoneAlt)}
              />
            </div>
          </div>
        </div>
        
        {/* Sensitive Information */}
        <div className="card">
          <h2 className="h3 mb-4 pb-2 border-b border-gray-200">Sensitive Personal Information</h2>
          <p className="body text-sm text-talGray mb-4">This information is encrypted and only used for background checks</p>
          
          <div className="grid md:grid-cols-2 gap-6">
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
                <option value="FL">Florida</option>
                <option value="CA">California</option>
              </select>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mt-4">
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
                maxLength="4"
                value={formData.ssnLast4}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.ssnLast4)}
              />
            </div>
          </div>
        </div>
        
        {/* Residential History */}
        <div className="card">
          <h2 className="h3 mb-4 pb-2 border-b border-gray-200">Residential History (7 Years Required)</h2>
          
          {residences.map((res, index) => (
            <div key={res.id} className="border-2 border-gray-200 rounded-xl p-5 bg-white mb-4">
              <div className="flex justify-between items-center mb-4">
                <span className="body font-semibold text-talSlate">Address #{index + 1}</span>
                {residences.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeResidence(res.id)}
                    className="px-3 py-1 bg-red-50 text-red-600 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-100 transition"
                  >
                    Remove
                  </button>
                )}
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
              
              <div className="grid md:grid-cols-3 gap-6 mt-4">
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
                    <option value="FL">Florida</option>
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
              
              <div className="grid md:grid-cols-2 gap-6 mt-4">
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
                <div>
                  <label className="block body mb-2">End Date</label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="date"
                      value={res.toDate}
                      onChange={(e) => updateResidence(res.id, 'toDate', e.target.value)}
                      disabled={res.current}
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
          
          <button 
            type="button" 
            onClick={addResidence}
            className="btn btn-secondary mt-4"
          >
            + Add Another Address
          </button>
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