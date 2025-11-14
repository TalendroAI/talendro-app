import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Onb5 = () => {
  console.log('Onb5');
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    gender: '',
    hispanicLatino: '',
    disability: '',
    race: [],
    veteran: [],
    profileReviewApproval: false,
    signature: '',
    finalAuthorization: false
  });

  const [signatureDate] = useState(new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));

  const handleChange = (e) => {
    const { id, value, type, checked, name } = e.target;
    
    if (name === 'race') {
      if (id === 'race_decline' && checked) {
        setFormData(prev => ({...prev, race: ['decline']}));
      } else if (checked) {
        setFormData(prev => ({
          ...prev,
          race: [...prev.race.filter(r => r !== 'decline'), value]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          race: prev.race.filter(r => r !== value)
        }));
      }
    } else if (name === 'veteran') {
      if ((id === 'vet_decline' || id === 'vet_not_veteran') && checked) {
        // If "decline" or "not a veteran" is checked, uncheck all others
        setFormData(prev => ({...prev, veteran: [value]}));
      } else if (checked) {
        // If any other is checked, uncheck "decline" and "not a veteran"
        setFormData(prev => ({
          ...prev,
          veteran: [...prev.veteran.filter(v => v !== 'decline' && v !== 'not_veteran'), value]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          veteran: prev.veteran.filter(v => v !== value)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [id]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const isFormComplete = () => {
    return formData.profileReviewApproval && 
           formData.finalAuthorization && 
           formData.signature.trim() !== '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const completeData = {
      ...formData,
      signatureDate: new Date().toISOString()
    };
    
    localStorage.setItem('step4Data', JSON.stringify(completeData));
    
    // Navigate to review page before checkout
    navigate('/app/onboarding/review');
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

  const getSignatureInputStyle = (value) => {
    const isEmpty = !value || (typeof value === 'string' && value.trim() === '') || value === '';
    const baseClass = 'w-full px-3 py-2 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-talAqua transition text-lg';
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

  const getSignatureFieldStyle = (value) => {
    const isEmpty = !value || (typeof value === 'string' && value.trim() === '') || value === '';
    const baseClass = 'border-2 rounded-xl p-5 mt-4';
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
      className: `${baseClass} border-green-500 bg-green-50`,
      style: {}
    };
  };

  return (
    <section>
      <div className="mb-6">
        <a href="/app/onboarding/step-4" className="text-talBlue hover:underline flex items-center gap-2">
          ← Back to Professional Information
        </a>
      </div>
      
      <h1 className="h1">Disclosures & Authorizations</h1>
      <p className="body mt-2 text-talGray">Final step - Please complete all fields</p>
      
      {/* Progress Bar */}
      <div className="mt-6 mb-6 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-talBlue to-talAqua transition-all duration-300" style={{width: '80%'}}></div>
      </div>

      {/* Alert */}
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
        <p className="body text-sm text-red-800">
          Please review all parsed data and complete any missing information, indicated by <strong className="font-bold" style={{color: '#dc2626'}}>red highlighting</strong>.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Voluntary Self-Identification */}
        <div className="card">
          <h2 className="h3 mb-4 pb-2 border-b border-gray-200">Voluntary Self-Identification Questions</h2>
          <p className="body text-sm text-talGray mb-4">This information is voluntary and used for Equal Employment Opportunity (EEO) reporting only.</p>
          
          <div className="form-grid-2col">
            <div>
              <label className="block body mb-2">
                What is your gender? <span className="text-red-600">*</span>
              </label>
              <select
                id="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.gender)}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">I prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block body mb-2">
                Are you Hispanic or Latino? <span className="text-red-600">*</span>
              </label>
              <select
                id="hispanicLatino"
                value={formData.hispanicLatino}
                onChange={handleChange}
                required
                 {...getInputStyle(formData.hispanicLatino)}
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="prefer-not-to-say">I prefer not to say</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block body mb-2">
              Do you have a disability? <span className="text-red-600">*</span>
            </label>
            <select
              id="disability"
              value={formData.disability}
              onChange={handleChange}
              required
               {...getInputStyle(formData.disability)}
            >
              <option value="">Select</option>
              <option value="yes">Yes, I have a disability, or have a history/record of having a disability</option>
              <option value="no">No, I don't have a disability, or a history/record of having a disability</option>
              <option value="prefer-not-to-say">I prefer not to say</option>
            </select>
          </div>
          
          <div className="mt-4">
            <label className="block body mb-2">
              Racial categories <span className="text-red-600">*</span>
            </label>
            <div 
              className={`flex flex-col gap-3 ${formData.race.length === 0 ? 'border-2 rounded-xl p-4' : ''}`}
              style={
                formData.race.length === 0 
                  ? { borderColor: '#ef4444', backgroundColor: '#fef2f2', boxShadow: '0 0 0 2px rgba(254, 202, 202, 0.5)' }
                  : {}
              }
            >
              {[
                // Alphabetized options
                { id: 'race_native', value: 'native', label: 'American Indian or Alaska Native' },
                { id: 'race_asian', value: 'asian', label: 'Asian' },
                { id: 'race_black', value: 'black', label: 'Black or African American' },
                { id: 'race_hispanic', value: 'hispanic', label: 'Hispanic or Latin' },
                { id: 'race_pacific', value: 'pacific', label: 'Native Hawaiian or Other Pacific Islander' },
                { id: 'race_white', value: 'white', label: 'White' },
                // Non-alphabetized options at the end
                { id: 'race_two', value: 'two_or_more', label: 'Two or More Races' },
                { id: 'race_other', value: 'other', label: 'Other' },
                { id: 'race_decline', value: 'decline', label: 'I prefer not to say' }
              ].map(option => (
                <label key={option.id} className="flex items-start gap-3 p-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-talBlue transition">
                  <input
                    type="checkbox"
                    id={option.id}
                    name="race"
                    value={option.value}
                    checked={formData.race.includes(option.value)}
                    onChange={handleChange}
                    className="mt-1 rounded border-gray-400 text-talBlue focus:ring-talAqua"
                  />
                  <span className="body">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block body mb-2">
              Protected Veteran categories <span className="text-red-600">*</span>
            </label>
            <div 
              className={`flex flex-col gap-3 ${formData.veteran.length === 0 ? 'border-2 rounded-xl p-4' : ''}`}
              style={
                formData.veteran.length === 0 
                  ? { borderColor: '#ef4444', backgroundColor: '#fef2f2', boxShadow: '0 0 0 2px rgba(254, 202, 202, 0.5)' }
                  : {}
              }
            >
              {[
                { id: 'vet_disabled', value: 'disabled', label: 'Disabled Veteran' },
                { id: 'vet_wartime', value: 'wartime', label: 'Active-Duty Wartime or Campaign Badge Veteran' },
                { id: 'vet_medal', value: 'medal', label: 'Armed Forces Service Medal Veteran' },
                { id: 'vet_recent', value: 'recent', label: 'Recently Separated Veteran' },
                { id: 'vet_other', value: 'other', label: 'I am a veteran but not a protected veteran' },
                { id: 'vet_not_veteran', value: 'not_veteran', label: 'I am not a veteran' },
                { id: 'vet_decline', value: 'decline', label: 'I prefer not to say' }
              ].map(option => (
                <label key={option.id} className="flex items-start gap-3 p-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-talBlue transition">
                  <input
                    type="checkbox"
                    id={option.id}
                    name="veteran"
                    value={option.value}
                    checked={formData.veteran.includes(option.value)}
                    onChange={handleChange}
                    className="mt-1 rounded border-gray-400 text-talBlue focus:ring-talAqua"
                  />
                  <span className="body">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        {/* Important Notice */}
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-5">
          <h3 className="h3 mb-3 flex items-center gap-2 text-yellow-900">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
            Important: Profile Review Required
          </h3>
          <p className="body text-sm text-yellow-800">
            Before proceeding to payment, you must review and approve your complete profile. This profile will be used to automatically complete employment applications on your behalf.
          </p>
        </div>
        
        <div className="card">
          <div 
            className="flex items-start gap-3 p-4 border-2 rounded-xl"
            style={
              formData.profileReviewApproval 
                ? { borderColor: '#86efac', backgroundColor: '#f0fdf4' }
                : { borderColor: '#ef4444', backgroundColor: '#fef2f2', boxShadow: '0 0 0 2px rgba(254, 202, 202, 0.5)' }
            }
          >
            <input
              type="checkbox"
              id="profileReviewApproval"
              checked={formData.profileReviewApproval}
              onChange={handleChange}
              required
              className="mt-1 rounded border-gray-400 text-talBlue focus:ring-talAqua"
            />
            <label htmlFor="profileReviewApproval" className="body font-semibold text-red-800 cursor-pointer">
              I have reviewed and approve my profile for use in completing employment applications <span className="text-red-600">*</span>
            </label>
          </div>
        </div>
        
        {/* Authorization */}
        <div className="card">
          <h2 className="h3 mb-4 pb-2 border-b border-gray-200">Authorization</h2>
          
          <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-5 my-5">
            <p className="body text-sm text-blue-900 mb-4"><strong>By signing below, I authorize and consent to the following:</strong></p>
            <div className="space-y-3 body text-sm text-blue-900">
              <p>1. I authorize Talendro™ to use my profile information, credentials, and uploaded documents to automatically complete and submit job applications on my behalf to positions that match my subscriber profile.</p>
              <p>2. I understand that Talendro™ will act as my agent in submitting applications and that I am responsible for the accuracy of all information provided.</p>
              <p>3. I authorize Talendro™ to use my login credentials (created during account setup) to access job application systems and complete applications.</p>
              <p>4. I understand that I can review, modify, or revoke this authorization at any time through my account settings.</p>
              <p>5. I certify that all information provided in my profile is true, accurate, and complete to the best of my knowledge.</p>
            </div>
          </div>
          
          <div {...getSignatureFieldStyle(formData.signature)}>
            <label className="block body font-semibold mb-3">
              Type your full legal name as electronic signature <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="signature"
              placeholder="Your Full Legal Name"
              value={formData.signature}
              onChange={handleChange}
              required
               {...getSignatureInputStyle(formData.signature)}
            />
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <span className="body text-sm text-talGray">By signing, you agree to all terms above</span>
              <span className="body text-sm text-talGray">{signatureDate}</span>
            </div>
          </div>
        </div>
        
        {/* Final Confirmation */}
        <div className={`border-3 rounded-xl p-5 ${formData.finalAuthorization ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600 ring-2 ring-red-200'}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="finalAuthorization"
              checked={formData.finalAuthorization}
              onChange={handleChange}
              required
              className="mt-1 w-6 h-6 rounded border-gray-400 text-talBlue focus:ring-talAqua"
            />
            <span className="body font-semibold text-red-900">
              I hereby authorize Talendro™ to apply to positions matching my subscriber profile. 
              I understand this authorization remains in effect until I cancel my subscription or revoke authorization. <span className="text-red-600">*</span>
            </span>
          </label>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            type="button" 
            onClick={() => navigate('/app/onboarding/step-4')} 
            className="btn btn-secondary"
          >
            ← Back
          </button>
          <button 
            type="submit" 
            disabled={!isFormComplete()} 
            className={`btn btn-primary flex-1 ${!isFormComplete() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Continue to Review & Approve →
          </button>
        </div>
      </form>
    </section>
  );
};

export default Onb5;