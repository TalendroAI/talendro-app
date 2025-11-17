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
      if (id === 'vet_decline' && checked) {
        setFormData(prev => ({...prev, veteran: ['decline']}));
      } else if (checked) {
        setFormData(prev => ({
          ...prev,
          veteran: [...prev.veteran.filter(v => v !== 'decline'), value]
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
    
    // Navigate to checkout/payment
    navigate('/checkout');
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.h1}>Disclosures & Authorizations</h1>
          <p style={styles.subheader}>Final step - Please complete all fields</p>
        </div>
        
        <div style={styles.progressBar}>
          <div style={{...styles.progressFill, width: '80%'}}></div>
        </div>
        
        <div style={styles.alert}>
          <p style={styles.alertText}>
            Please review all parsed data and complete any missing information, indicated by <strong style={{color: '#dc2626'}}>red highlighting</strong>.
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Voluntary Self-Identification */}
          <div style={styles.section}>
            <h2 style={styles.sectionHeader}>Voluntary Self-Identification Questions</h2>
            <p style={styles.helpText}>This information is voluntary and used for Equal Employment Opportunity (EEO) reporting only.</p>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>What is your gender? <span style={styles.required}>*</span></label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  style={{...styles.input, ...(formData.gender ? styles.inputFilled : {})}}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">I prefer not to say</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Are you Hispanic or Latino? <span style={styles.required}>*</span></label>
                <select
                  id="hispanicLatino"
                  value={formData.hispanicLatino}
                  onChange={handleChange}
                  required
                  style={{...styles.input, ...(formData.hispanicLatino ? styles.inputFilled : {})}}
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="prefer-not-to-say">I prefer not to say</option>
                </select>
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Do you have a disability? <span style={styles.required}>*</span></label>
              <select
                id="disability"
                value={formData.disability}
                onChange={handleChange}
                required
                style={{...styles.input, ...(formData.disability ? styles.inputFilled : {})}}
              >
                <option value="">Select</option>
                <option value="yes">Yes, I have a disability, or have a history/record of having a disability</option>
                <option value="no">No, I don't have a disability, or a history/record of having a disability</option>
                <option value="prefer-not-to-say">I prefer not to say</option>
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Racial categories <span style={styles.required}>*</span></label>
              <div style={styles.checkboxGroupVertical}>
                <div style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="race_white"
                    name="race"
                    value="white"
                    checked={formData.race.includes('white')}
                    onChange={handleChange}
                  />
                  <label htmlFor="race_white" style={styles.checkboxItemLabel}>White</label>
                </div>
                <div style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="race_black"
                    name="race"
                    value="black"
                    checked={formData.race.includes('black')}
                    onChange={handleChange}
                  />
                  <label htmlFor="race_black" style={styles.checkboxItemLabel}>Black or African American</label>
                </div>
                <div style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="race_asian"
                    name="race"
                    value="asian"
                    checked={formData.race.includes('asian')}
                    onChange={handleChange}
                  />
                  <label htmlFor="race_asian" style={styles.checkboxItemLabel}>Asian</label>
                </div>
                <div style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="race_pacific"
                    name="race"
                    value="pacific"
                    checked={formData.race.includes('pacific')}
                    onChange={handleChange}
                  />
                  <label htmlFor="race_pacific" style={styles.checkboxItemLabel}>Native Hawaiian or Other Pacific Islander</label>
                </div>
                <div style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="race_native"
                    name="race"
                    value="native"
                    checked={formData.race.includes('native')}
                    onChange={handleChange}
                  />
                  <label htmlFor="race_native" style={styles.checkboxItemLabel}>American Indian or Alaska Native</label>
                </div>
                <div style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="race_two"
                    name="race"
                    value="two_or_more"
                    checked={formData.race.includes('two_or_more')}
                    onChange={handleChange}
                  />
                  <label htmlFor="race_two" style={styles.checkboxItemLabel}>Two or More Races</label>
                </div>
                <div style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="race_decline"
                    name="race"
                    value="decline"
                    checked={formData.race.includes('decline')}
                    onChange={handleChange}
                  />
                  <label htmlFor="race_decline" style={styles.checkboxItemLabel}>I prefer not to say</label>
                </div>
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Protected Veteran categories <span style={styles.required}>*</span></label>
              <div style={styles.checkboxGroupVertical}>
                <div style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="vet_disabled"
                    name="veteran"
                    value="disabled"
                    checked={formData.veteran.includes('disabled')}
                    onChange={handleChange}
                  />
                  <label htmlFor="vet_disabled" style={styles.checkboxItemLabel}>Disabled Veteran</label>
                </div>
                <div style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="vet_wartime"
                    name="veteran"
                    value="wartime"
                    checked={formData.veteran.includes('wartime')}
                    onChange={handleChange}
                  />
                  <label htmlFor="vet_wartime" style={styles.checkboxItemLabel}>Active-Duty Wartime or Campaign Badge Veteran</label>
                </div>
                <div style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="vet_medal"
                    name="veteran"
                    value="medal"
                    checked={formData.veteran.includes('medal')}
                    onChange={handleChange}
                  />
                  <label htmlFor="vet_medal" style={styles.checkboxItemLabel}>Armed Forces Service Medal Veteran</label>
                </div>
                <div style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="vet_recent"
                    name="veteran"
                    value="recent"
                    checked={formData.veteran.includes('recent')}
                    onChange={handleChange}
                  />
                  <label htmlFor="vet_recent" style={styles.checkboxItemLabel}>Recently Separated Veteran</label>
                </div>
                <div style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="vet_other"
                    name="veteran"
                    value="other"
                    checked={formData.veteran.includes('other')}
                    onChange={handleChange}
                  />
                  <label htmlFor="vet_other" style={styles.checkboxItemLabel}>I am a veteran but not a protected veteran</label>
                </div>
                <div style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="vet_decline"
                    name="veteran"
                    value="decline"
                    checked={formData.veteran.includes('decline')}
                    onChange={handleChange}
                  />
                  <label htmlFor="vet_decline" style={styles.checkboxItemLabel}>I prefer not to say</label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Important Notice */}
          <div style={styles.importantNotice}>
            <h3 style={styles.noticeHeader}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" style={{marginRight: '8px'}}>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              Important: Profile Review Required
            </h3>
            <p style={styles.noticeText}>
              Before proceeding to payment, you must review and approve your complete profile. This profile will be used to automatically complete employment applications on your behalf.
            </p>
          </div>
          
          <div style={styles.section}>
            <div style={{...styles.checkboxItem, background: '#fef2f2', borderColor: '#fca5a5'}}>
              <input
                type="checkbox"
                id="profileReviewApproval"
                checked={formData.profileReviewApproval}
                onChange={handleChange}
                required
                style={{flexShrink: 0, marginTop: '2px'}}
              />
              <label htmlFor="profileReviewApproval" style={{...styles.checkboxItemLabel, fontWeight: '600', color: '#991b1b'}}>
                I have reviewed and approve my profile for use in completing employment applications <span style={styles.required}>*</span>
              </label>
            </div>
          </div>
          
          {/* Authorization */}
          <div style={styles.section}>
            <h2 style={styles.sectionHeader}>Authorization</h2>
            
            <div style={styles.authorizationBox}>
              <p style={styles.authText}><strong>By signing below, I authorize and consent to the following:</strong></p>
              <p style={styles.authText}>
                1. I authorize Talendro™ to use my profile information, credentials, and uploaded documents to automatically complete and submit job applications on my behalf to positions that match my subscriber profile.
              </p>
              <p style={styles.authText}>
                2. I understand that Talendro™ will act as my agent in submitting applications and that I am responsible for the accuracy of all information provided.
              </p>
              <p style={styles.authText}>
                3. I authorize Talendro™ to use my login credentials (created during account setup) to access job application systems and complete applications.
              </p>
              <p style={styles.authText}>
                4. I understand that I can review, modify, or revoke this authorization at any time through my account settings.
              </p>
              <p style={styles.authText}>
                5. I certify that all information provided in my profile is true, accurate, and complete to the best of my knowledge.
              </p>
            </div>
            
            <div style={{...styles.signatureField, ...(formData.signature ? styles.signatureFilled : {})}}>
              <label style={styles.signatureLabel}>
                Type your full legal name as electronic signature <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="signature"
                placeholder="Your Full Legal Name"
                value={formData.signature}
                onChange={handleChange}
                required
                style={{...styles.signatureInput, ...(formData.signature ? styles.inputFilled : {})}}
              />
              <div style={styles.signatureDate}>
                <span>By signing, you agree to all terms above</span>
                <span>{signatureDate}</span>
              </div>
            </div>
          </div>
          
          {/* Final Confirmation */}
          <div style={styles.finalCheckbox}>
            <label style={styles.finalCheckboxLabel}>
              <input
                type="checkbox"
                id="finalAuthorization"
                checked={formData.finalAuthorization}
                onChange={handleChange}
                required
                style={{width: '24px', height: '24px', marginTop: '2px', flexShrink: 0}}
              />
              <span style={styles.finalCheckboxText}>
                I hereby authorize Talendro™ to apply to positions matching my subscriber profile. 
                I understand this authorization remains in effect until I cancel my subscription or revoke authorization. <span style={styles.required}>*</span>
              </span>
            </label>
          </div>
          
          <div style={styles.btnGroup}>
            <button type="button" onClick={() => navigate('/app/onboarding/step-4')} style={styles.btnSecondary}>
              ← Back
            </button>
            <button 
              type="submit" 
              disabled={!isFormComplete()} 
              style={{
                ...styles.btnPrimary,
                ...(isFormComplete() ? styles.btnPrimaryEnabled : styles.btnPrimaryDisabled)
              }}
            >
              Proceed to Payment & Activate →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  body: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f8f9fa',
    padding: '20px',
    minHeight: '100vh'
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '40px'
  },
  header: {
    marginBottom: '30px'
  },
  h1: {
    color: '#2563eb',
    fontSize: '32px',
    marginBottom: '8px'
  },
  subheader: {
    color: '#6b7280',
    fontSize: '14px'
  },
  progressBar: {
    height: '6px',
    background: '#e5e7eb',
    borderRadius: '3px',
    marginBottom: '30px'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(to right, #2563eb, #00bcd4)'
  },
  alert: {
    background: '#fef2f2',
    borderLeft: '4px solid #ef4444',
    padding: '16px',
    marginBottom: '24px',
    borderRadius: '6px'
  },
  alertText: {
    color: '#991b1b',
    fontSize: '14px'
  },
  section: {
    background: '#fafafa',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px'
  },
  sectionHeader: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '2px solid #e5e7eb'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  },
  required: {
    color: '#dc2626'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #fca5a5',
    background: '#fef2f2',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit'
  },
  inputFilled: {
    borderColor: '#d1d5db',
    background: 'white'
  },
  helpText: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '16px'
  },
  checkboxGroupVertical: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px',
    background: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  checkboxItemLabel: {
    margin: 0,
    cursor: 'pointer',
    fontWeight: 'normal'
  },
  importantNotice: {
    background: '#fffbeb',
    border: '2px solid #fcd34d',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0'
  },
  noticeHeader: {
    color: '#92400e',
    fontSize: '16px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center'
  },
  noticeText: {
    color: '#78350f',
    fontSize: '14px',
    lineHeight: '1.6'
  },
  authorizationBox: {
    background: '#f0f9ff',
    border: '2px solid #0ea5e9',
    borderRadius: '8px',
    padding: '20px',
    margin: '20px 0'
  },
  authText: {
    color: '#0c4a6e',
    fontSize: '14px',
    lineHeight: '1.8',
    marginBottom: '16px'
  },
  signatureField: {
    background: 'white',
    border: '2px solid #fca5a5',
    borderRadius: '6px',
    padding: '20px',
    marginTop: '16px'
  },
  signatureFilled: {
    borderColor: '#10b981',
    background: '#f0fdf4'
  },
  signatureLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px'
  },
  signatureInput: {
    fontSize: '18px',
    fontFamily: '"Brush Script MT", cursive',
    padding: '12px',
    width: '100%',
    border: '2px solid #fca5a5',
    background: '#fef2f2',
    borderRadius: '6px'
  },
  signatureDate: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
    fontSize: '13px',
    color: '#6b7280'
  },
  finalCheckbox: {
    background: '#fef2f2',
    border: '3px solid #dc2626',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0'
  },
  finalCheckboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    cursor: 'pointer'
  },
  finalCheckboxText: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#991b1b',
    lineHeight: '1.6'
  },
  btnGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '32px'
  },
  btnPrimary: {
    color: 'white',
    border: 'none',
    padding: '16px 32px',
    borderRadius: '6px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    flex: 1,
    transition: 'all 0.2s'
  },
  btnPrimaryEnabled: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  },
  btnPrimaryDisabled: {
    background: '#9ca3af',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  btnSecondary: {
    background: 'white',
    color: '#6b7280',
    border: '2px solid #d1d5db',
    padding: '16px 32px',
    borderRadius: '6px',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer'
  }
};

export default Onb5;
