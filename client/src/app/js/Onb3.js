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

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 className="h1">Personal Information</h1>
          <p className="body text-sm">Please complete all fields</p>
        </div>
        
        <div style={styles.progressBar}>
          <div style={{...styles.progressFill, width: '40%'}}></div>
        </div>
        
        <div style={styles.alert}>
          <p style={styles.alertText}>
            Please review all parsed data and complete any missing information, indicated by <strong style={{color: '#dc2626'}}>red highlighting</strong>.
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Contact Information */}
          <div style={styles.section}>
            <h2 className="h3">Contact Information</h2>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Legal Name <span style={styles.required}>*</span></label>
                <input
                  type="text"
                  id="fullLegalName"
                  value={formData.fullLegalName}
                  onChange={handleChange}
                  required
                  style={{...styles.input, ...(formData.fullLegalName ? styles.inputFilled : {})}}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Preferred First Name <span style={styles.required}>*</span></label>
                <input
                  type="text"
                  id="preferredFirstName"
                  value={formData.preferredFirstName}
                  onChange={handleChange}
                  required
                  style={{...styles.input, ...(formData.preferredFirstName ? styles.inputFilled : {})}}
                />
              </div>
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Legal Maiden Name</label>
                <div style={styles.naButtonGroup}>
                  <input
                    type="text"
                    id="maidenName"
                    value={formData.maidenName}
                    onChange={handleChange}
                    style={{...styles.input, ...(formData.maidenName ? styles.inputFilled : {})}}
                  />
                  <button type="button" onClick={() => setNA('maidenName')} style={styles.naBtn}>N/A</button>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Previously Used Names</label>
                <div style={styles.naButtonGroup}>
                  <input
                    type="text"
                    id="previousNames"
                    value={formData.previousNames}
                    onChange={handleChange}
                    style={{...styles.input, ...(formData.previousNames ? styles.inputFilled : {})}}
                  />
                  <button type="button" onClick={() => setNA('previousNames')} style={styles.naBtn}>N/A</button>
                </div>
              </div>
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email <span style={styles.required}>*</span></label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{...styles.input, ...(formData.email ? styles.inputFilled : {})}}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone <span style={styles.required}>*</span></label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  style={{...styles.input, ...(formData.phone ? styles.inputFilled : {})}}
                />
              </div>
            </div>
          </div>
          
          {/* Current Address */}
          <div style={styles.section}>
            <h2 className="h3">Current Address</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Street Address <span style={styles.required}>*</span></label>
              <input
                type="text"
                id="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                required
                style={{...styles.input, ...(formData.streetAddress ? styles.inputFilled : {})}}
              />
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>City <span style={styles.required}>*</span></label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  style={{...styles.input, ...(formData.city ? styles.inputFilled : {})}}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>State <span style={styles.required}>*</span></label>
                <select
                  id="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  style={{...styles.input, ...(formData.state ? styles.inputFilled : {})}}
                >
                  <option value="">Select</option>
                  <option value="FL">Florida</option>
                  <option value="CA">California</option>
                  <option value="NY">New York</option>
                  <option value="TX">Texas</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>ZIP Code <span style={styles.required}>*</span></label>
                <input
                  type="text"
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                  style={{...styles.input, ...(formData.postalCode ? styles.inputFilled : {})}}
                />
              </div>
            </div>
          </div>
          
          {/* Emergency Contact */}
          <div style={styles.section}>
            <h2 className="h3">Emergency Contact</h2>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Emergency Contact Name <span style={styles.required}>*</span></label>
                <input
                  type="text"
                  id="emergencyName"
                  value={formData.emergencyName}
                  onChange={handleChange}
                  required
                  style={{...styles.input, ...(formData.emergencyName ? styles.inputFilled : {})}}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Relationship <span style={styles.required}>*</span></label>
                <select
                  id="emergencyRelationship"
                  value={formData.emergencyRelationship}
                  onChange={handleChange}
                  required
                  style={{...styles.input, ...(formData.emergencyRelationship ? styles.inputFilled : {})}}
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
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Emergency Contact Phone <span style={styles.required}>*</span></label>
                <input
                  type="tel"
                  id="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleChange}
                  required
                  style={{...styles.input, ...(formData.emergencyPhone ? styles.inputFilled : {})}}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Alternate Phone</label>
                <input
                  type="tel"
                  id="emergencyPhoneAlt"
                  value={formData.emergencyPhoneAlt}
                  onChange={handleChange}
                  style={{...styles.input, ...(formData.emergencyPhoneAlt ? styles.inputFilled : {})}}
                />
              </div>
            </div>
          </div>
          
          {/* Sensitive Information */}
          <div style={styles.section}>
            <h2 className="h3">Sensitive Personal Information</h2>
            <p style={styles.helpText}>This information is encrypted and only used for background checks</p>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Driver's License Number <span style={styles.required}>*</span></label>
                <input
                  type="text"
                  id="dlNumber"
                  value={formData.dlNumber}
                  onChange={handleChange}
                  required
                  style={{...styles.input, ...(formData.dlNumber ? styles.inputFilled : {})}}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Driver's License State <span style={styles.required}>*</span></label>
                <select
                  id="dlState"
                  value={formData.dlState}
                  onChange={handleChange}
                  required
                  style={{...styles.input, ...(formData.dlState ? styles.inputFilled : {})}}
                >
                  <option value="">Select</option>
                  <option value="FL">Florida</option>
                  <option value="CA">California</option>
                </select>
              </div>
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date of Birth <span style={styles.required}>*</span></label>
                <input
                  type="date"
                  id="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  style={{...styles.input, ...(formData.dateOfBirth ? styles.inputFilled : {})}}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>SSN Last 4 Digits <span style={styles.required}>*</span></label>
                <input
                  type="text"
                  id="ssnLast4"
                  maxLength="4"
                  value={formData.ssnLast4}
                  onChange={handleChange}
                  required
                  style={{...styles.input, ...(formData.ssnLast4 ? styles.inputFilled : {})}}
                />
              </div>
            </div>
          </div>
          
          {/* Residential History */}
          <div style={styles.section}>
            <h2 className="h3">Residential History (7 Years Required)</h2>
            
            {residences.map((res, index) => (
              <div key={res.id} style={styles.collectionItem}>
                <div style={styles.collectionHeader}>
                  <span style={styles.collectionTitle}>Address #{index + 1}</span>
                  {residences.length > 1 && (
                    <button type="button" onClick={() => removeResidence(res.id)} style={styles.removeBtn}>
                      Remove
                    </button>
                  )}
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Street Address <span style={styles.required}>*</span></label>
                  <input
                    type="text"
                    value={res.street}
                    onChange={(e) => updateResidence(res.id, 'street', e.target.value)}
                    required
                    style={{...styles.input, ...(res.street ? styles.inputFilled : {})}}
                  />
                </div>
                
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>City <span style={styles.required}>*</span></label>
                    <input
                      type="text"
                      value={res.city}
                      onChange={(e) => updateResidence(res.id, 'city', e.target.value)}
                      required
                      style={{...styles.input, ...(res.city ? styles.inputFilled : {})}}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>State <span style={styles.required}>*</span></label>
                    <select
                      value={res.state}
                      onChange={(e) => updateResidence(res.id, 'state', e.target.value)}
                      required
                      style={{...styles.input, ...(res.state ? styles.inputFilled : {})}}
                    >
                      <option value="">Select</option>
                      <option value="FL">Florida</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>ZIP Code <span style={styles.required}>*</span></label>
                    <input
                      type="text"
                      value={res.zip}
                      onChange={(e) => updateResidence(res.id, 'zip', e.target.value)}
                      required
                      style={{...styles.input, ...(res.zip ? styles.inputFilled : {})}}
                    />
                  </div>
                </div>
                
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>From Date <span style={styles.required}>*</span></label>
                    <input
                      type="date"
                      value={res.fromDate}
                      onChange={(e) => updateResidence(res.id, 'fromDate', e.target.value)}
                      required
                      style={{...styles.input, ...(res.fromDate ? styles.inputFilled : {})}}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>End Date</label>
                    <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                      <input
                        type="date"
                        value={res.toDate}
                        onChange={(e) => updateResidence(res.id, 'toDate', e.target.value)}
                        disabled={res.current}
                        style={{...styles.input, ...(res.toDate || res.current ? styles.inputFilled : {})}}
                      />
                      <label style={{margin: 0, display: 'flex', alignItems: 'center', gap: '6px'}}>
                        <input
                          type="checkbox"
                          checked={res.current}
                          onChange={() => toggleCurrentResidence(res.id)}
                        />
                        <span>Current</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <button type="button" onClick={addResidence} style={styles.addBtn}>
              + Add Another Address
            </button>
          </div>
          
          <div style={styles.btnGroup}>
            <button type="button" onClick={() => navigate('/app/onboarding/step-2')} style={styles.btnSecondary}>
              ← Back
            </button>
            <button type="submit" style={styles.btnPrimary}>
              Continue to Professional Information →
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
    maxWidth: '1000px',
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
    // Using brand class .h1 instead
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
    background: 'linear-gradient(to right, #2F6DF6, #00C4CC)'
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
    marginTop: '4px'
  },
  naButtonGroup: {
    display: 'flex',
    gap: '8px'
  },
  naBtn: {
    padding: '10px 16px',
    background: '#f3f4f6',
    border: '2px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  collectionItem: {
    background: 'white',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px'
  },
  collectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  collectionTitle: {
    fontWeight: '600',
    color: '#111827'
  },
  removeBtn: {
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  addBtn: {
    background: 'white',
    color: '#2F6DF6',
    border: '2px solid #2F6DF6',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginTop: '12px'
  },
  btnGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '32px'
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #2F6DF6, #1d4ed8)',
    color: 'white',
    border: 'none',
    padding: '14px 32px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    flex: 1
  },
  btnSecondary: {
    background: 'white',
    color: '#6b7280',
    border: '2px solid #d1d5db',
    padding: '14px 32px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default Onb3;
