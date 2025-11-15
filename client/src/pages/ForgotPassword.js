import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setMessage(data.message || 'If an account with that email exists, a password reset link has been sent.');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      console.error('Forgot password error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Logo */}
        <div className="login-header">
          <h1 className="login-logo">Talendro™</h1>
          <p className="login-tagline">Precision Matches. Faster Results.</p>
        </div>

        {/* Forgot Password Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <h2>Reset Password</h2>
          <p className="login-subtitle">Enter your email address and we'll send you a link to reset your password.</p>

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
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading || !!message}
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading || !!message}>
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Sending...
              </>
            ) : (
              'Send Reset Link'
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

export default ForgotPassword;

