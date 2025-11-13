import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutoSave, loadSavedData, mergeWithResumeData } from '../../hooks/useAutoSave';

const Page = () => {
  console.log('Onb1');
  const navigate = useNavigate();
  
  // Load saved data OR use defaults
  const [formData, setFormData] = useState(() => {
    const saved = loadSavedData('onboarding_step1', {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      referralSource: 'linkedin',
      password: '',
      confirmPassword: '',
      terms: false
    });
    
    // Merge with parsed resume data if available
    const resumeData = JSON.parse(localStorage.getItem('resumeData') || 'null');
    if (resumeData?.prefill?.step1) {
      return mergeWithResumeData(saved, resumeData, 'step1');
    }
    
    return saved;
  });

  const [passwordStrength, setPasswordStrength] = useState('');

  // Auto-save on every change
  useAutoSave('onboarding_step1', formData);

  // Also load from resume data on mount (if not already loaded from saved)
  useEffect(() => {
    const resumeData = JSON.parse(localStorage.getItem('resumeData') || 'null');
    if (resumeData?.prefill?.step1) {
      const step1 = resumeData.prefill.step1;
      const names = (step1.fullLegalName || '').split(' ').filter(Boolean);
      
      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || step1.firstName || names[0] || '',
        lastName: prev.lastName || step1.lastName || names.slice(1).join(' ') || '',
        email: prev.email || step1.email || '',
        phone: prev.phone || step1.phone || '',
        referralSource: prev.referralSource || step1.referralSource || 'linkedin'
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));

    // Password strength checker
    if (id === 'password') {
      let strength = 0;
      if (value.length >= 12) strength++;
      if (/[a-z]/.test(value)) strength++;
      if (/[A-Z]/.test(value)) strength++;
      if (/[0-9]/.test(value)) strength++;
      if (/[^a-zA-Z0-9]/.test(value)) strength++;
      
      if (strength <= 2) setPasswordStrength('weak');
      else if (strength <= 4) setPasswordStrength('medium');
      else setPasswordStrength('strong');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    // Data is already auto-saved, just navigate
    navigate('/app/onboarding/step-3');
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

  return (
    <section>
      <div className="mb-6">
        <a href="/app/onboarding/step-1" className="text-talBlue hover:underline flex items-center gap-2">
          ← Back to Upload Resume
        </a>
      </div>
      
      <h1 className="h1">Create Profile</h1>
      <p className="tagline mt-2">Precision Matches. Faster Results.</p>
      
      {/* Progress Bar */}
      <div className="mt-6 mb-6 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-talBlue to-talAqua transition-all duration-300" style={{width: '20%'}}></div>
      </div>

      {/* Alert */}
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
        <p className="body text-sm text-red-800">
          Please review all parsed data and complete any missing information, indicated by <strong className="font-bold" style={{color: '#dc2626'}}>red highlighting</strong>.
        </p>
      </div>
      
      <form id="accountForm" onSubmit={handleSubmit} className="card mt-6">
        <div className="form-grid-2col">
          <div>
            <label className="block body mb-2">
              First Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              {...getInputStyle(formData.firstName)}
            />
          </div>

          <div>
            <label className="block body mb-2">
              Last Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              {...getInputStyle(formData.lastName)}
            />
          </div>
        </div>
        
        <div className="mt-4">
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
          <p className="body text-sm text-talGray mt-2">Used for notifications, login, and as your username for job applications</p>
        </div>
        
        <div className="form-grid-2col">
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

          <div>
            <label className="block body mb-2">
              How did you hear about us? <span className="text-red-600">*</span>
            </label>
            <select
              id="referralSource"
              value={formData.referralSource}
              onChange={handleChange}
              required
              {...getInputStyle(formData.referralSource)}
            >
              <option value="">Select</option>
              <option value="search">Search Engine</option>
              <option value="social">Social Media</option>
              <option value="friend">Friend/Colleague Referral</option>
              <option value="linkedin">LinkedIn</option>
              <option value="indeed">Indeed/Job Board</option>
              <option value="ad">Online Advertisement</option>
              <option value="news">News/Article</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        
        <div className="form-grid-2col">
          <div>
            <label className="block body mb-2">
              Password <span className="text-red-600">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
              {...getInputStyle(formData.password)}
            />
            {passwordStrength && (
              <div className="mt-2">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${
                    passwordStrength === 'weak' ? 'bg-red-500 w-1/3' :
                    passwordStrength === 'medium' ? 'bg-yellow-500 w-2/3' :
                    'bg-green-500 w-full'
                  }`}></div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block body mb-2">
              Confirm Password <span className="text-red-600">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              {...getInputStyle(formData.confirmPassword)}
            />
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <p className="body text-sm font-medium mb-2">Password Requirements (Universal Standards):</p>
          <ul className="body text-sm text-talGray list-disc pl-5 space-y-1">
            <li>12-128 characters long</li>
            <li>At least one uppercase letter (A-Z)</li>
            <li>At least one lowercase letter (a-z)</li>
            <li>At least one number (0-9)</li>
            <li>At least one special character (!@#$%^&*+)</li>
            <li>No common patterns or dictionary words</li>
          </ul>
          <p className="body text-sm text-talGray mt-2">This password will be used for job applications</p>
        </div>
        
        <div 
          className={`mt-6 flex items-start gap-3 p-4 rounded-xl border-2 ${formData.terms ? 'bg-white border-gray-300' : ''}`}
          style={formData.terms ? {} : { borderColor: '#ef4444', backgroundColor: '#fef2f2', boxShadow: '0 0 0 2px rgba(254, 202, 202, 0.5)' }}
        >
          <input
            type="checkbox"
            id="terms"
            checked={formData.terms}
            onChange={handleChange}
            required
            className="mt-1 rounded border-gray-400 text-talBlue focus:ring-talAqua"
          />
          <label htmlFor="terms" className="body text-sm">
            I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-talBlue hover:underline">Terms of Service</a> and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-talBlue hover:underline">Privacy Policy</a>. I understand that Talendro™ will use my credentials to submit job applications on my behalf.
          </label>
        </div>
        
        <button type="submit" className="btn btn-primary w-full mt-6">
          Continue to Personal Information →
        </button>
        
        <div className="text-center mt-6">
          <p className="body text-sm text-talGray">
            Already have an account? <a href="/auth/sign-in" className="text-talBlue hover:underline font-medium">Log In</a>
          </p>
        </div>
        
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-center">
          <p className="body text-sm text-green-800">
            🔒 Your information is encrypted and never shared with third parties
          </p>
        </div>
      </form>
    </section>
  );
};

export default Page;