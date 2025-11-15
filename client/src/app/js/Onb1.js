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
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Universal password standards (NIST, OWASP, ISO 27001 compliant)
  const validatePassword = (password) => {
    const errors = [];
    
    // Minimum 12 characters (NIST recommendation)
    if (password.length < 12) {
      errors.push('Must be at least 12 characters long');
    }
    
    // Maximum 128 characters (reasonable limit)
    if (password.length > 128) {
      errors.push('Must be no more than 128 characters long');
    }
    
    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Must contain at least one uppercase letter');
    }
    
    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Must contain at least one lowercase letter');
    }
    
    // At least one number
    if (!/\d/.test(password)) {
      errors.push('Must contain at least one number');
    }
    
    // At least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Must contain at least one special character');
    }
    
    // No common patterns or personal info
    const commonPatterns = [
      /(.)\1{2,}/, // No repeated characters (aaa, 111, etc.)
      /123|234|345|456|567|678|789|890/, // No sequential numbers
      /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, // No sequential letters
      /password|qwerty|admin|user|login|welcome|123456/i // No common passwords
    ];
    
    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('Cannot contain common patterns or dictionary words');
        break;
      }
    }
    
    return errors;
  };

  // Generate a strong password
  const generateStrongPassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    // Include all special characters that the validator checks for: !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?
    const special = "!@#$%^&*()_+-=[]{}|;:',.<>/?\\";
    const allChars = uppercase + lowercase + numbers + special;
    
    let password = '';
    
    // Ensure at least one of each required character type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Fill the rest to make it 16 characters (strong and memorable)
    for (let i = password.length; i < 16; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password to randomize character positions
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));

    // Password validation and strength checker
    if (id === 'password') {
      const errors = validatePassword(value);
      setPasswordErrors(errors);
      
      let strength = 0;
      if (value.length >= 12) strength++;
      if (/[a-z]/.test(value)) strength++;
      if (/[A-Z]/.test(value)) strength++;
      if (/[0-9]/.test(value)) strength++;
      if (/[^a-zA-Z0-9]/.test(value)) strength++;
      
      if (strength <= 2 || errors.length > 0) setPasswordStrength('weak');
      else if (strength <= 4) setPasswordStrength('medium');
      else setPasswordStrength('strong');
      
      // Clear confirm password error if passwords match
      if (formData.confirmPassword && value === formData.confirmPassword) {
        setConfirmPasswordError('');
      }
    }
    
    // Confirm password validation
    if (id === 'confirmPassword') {
      if (value && value !== formData.password) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password
    const passwordValidationErrors = validatePassword(formData.password);
    setPasswordErrors(passwordValidationErrors);
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }
    
    // Check if password is valid
    if (passwordValidationErrors.length > 0) {
      alert('Please fix password errors before continuing');
      return;
    }
    
    // Save password to server if user exists (from checkout)
    if (formData.email && formData.password) {
      try {
        const response = await fetch('/api/auth/set-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          // Don't block navigation if user doesn't exist yet (will be created at checkout)
          if (errorData.error !== 'User not found') {
            console.error('Failed to save password:', errorData.error);
          }
        }
      } catch (error) {
        // Don't block navigation - password will be saved at checkout
        console.error('Error saving password:', error);
      }
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
            <div className="flex gap-2 items-start">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={`flex-1 h-10 px-3 py-2 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-talAqua transition ${
                  passwordErrors.length > 0 ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-300 bg-white'
                }`}
                style={passwordErrors.length > 0 ? {
                  borderColor: '#dc2626',
                  backgroundColor: '#fef2f2',
                  boxShadow: '0 0 0 2px rgba(254, 202, 202, 0.5)'
                } : {}}
                placeholder="Create a secure password"
                autoComplete="new-password"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="h-10 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const newPassword = generateStrongPassword();
                  setFormData(prev => ({
                    ...prev,
                    password: newPassword,
                    confirmPassword: newPassword
                  }));
                  // Show the password so user can see and remember it
                  setShowPassword(true);
                  setShowConfirmPassword(true);
                  // Trigger validation
                  const errors = validatePassword(newPassword);
                  setPasswordErrors(errors);
                  setConfirmPasswordError('');
                  setPasswordStrength('strong');
                }}
                className="h-10 px-4 py-2 bg-talBlue text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-talAqua transition-colors duration-200 text-sm font-medium whitespace-nowrap"
              >
                Suggest strong
              </button>
            </div>
            {passwordErrors.length > 0 && (
              <div className="mt-2">
                {passwordErrors.map((error, index) => (
                  <p key={index} className="text-sm mt-1" style={{color: '#dc2626'}}>{error}</p>
                ))}
              </div>
            )}
            {passwordStrength && passwordErrors.length === 0 && (
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
            <div className="flex gap-2 items-start">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={`flex-1 h-10 px-3 py-2 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-talAqua transition ${
                  confirmPasswordError ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-gray-300 bg-white'
                }`}
                style={confirmPasswordError ? {
                  borderColor: '#dc2626',
                  backgroundColor: '#fef2f2',
                  boxShadow: '0 0 0 2px rgba(254, 202, 202, 0.5)'
                } : {}}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="h-10 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="text-sm mt-1" style={{color: '#dc2626'}}>{confirmPasswordError}</p>
            )}
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
        
        <div className="flex gap-3 mt-6">
          <button 
            type="button" 
            onClick={() => navigate('/app/onboarding/step-1')} 
            className="btn btn-secondary"
          >
            ← Back
          </button>
          <button type="submit" className="btn btn-primary flex-1">
            Continue to Personal Information →
          </button>
        </div>
        
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