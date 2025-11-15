import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Login.css';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 12) {
      setError('Password must be at least 12 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setMessage('Password has been reset successfully! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Reset password error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h1 className="login-logo">Talendro™</h1>
            <p className="login-tagline">Precision Matches. Faster Results.</p>
          </div>
          <div className="login-form">
            <h2>Invalid Reset Link</h2>
            <p className="login-subtitle">This password reset link is invalid or has expired.</p>
            <a href="/forgot-password" className="btn-login" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Request New Reset Link
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Logo */}
        <div className="login-header">
          <h1 className="login-logo">Talendro™</h1>
          <p className="login-tagline">Precision Matches. Faster Results.</p>
        </div>

        {/* Reset Password Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <h2>Reset Password</h2>
          <p className="login-subtitle">Enter your new password below.</p>

          {error && (
            <div className="login-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {message && (
            <div className="login-success" style={{ 
              background: '#d1fae5', 
              border: '1px solid #10b981', 
              borderRadius: '8px', 
              padding: '12px', 
              marginBottom: '20px',
              color: '#065f46'
            }}>
              <span className="error-icon">✓</span>
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
              required
              disabled={loading || !!message}
              minLength={12}
            />
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Must be at least 12 characters long
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              required
              disabled={loading || !!message}
              minLength={12}
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading || !!message}>
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <a href="/login" className="forgot-password" style={{ fontSize: '14px' }}>
              ← Back to Sign In
            </a>
          </div>
        </form>

        {/* Security Note */}
        <div className="security-note">
          🔒 Your data is encrypted and secure
        </div>
      </div>

      {/* Background Design */}
      <div className="login-background">
        <div className="bg-circle bg-circle-1"></div>
        <div className="bg-circle bg-circle-2"></div>
        <div className="bg-circle bg-circle-3"></div>
      </div>
    </div>
  );
}

export default ResetPassword;

