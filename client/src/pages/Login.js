import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      navigate('/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Logo */}
        <div className="login-header">
          <h1 className="h1">Talendro™</h1>
          <p className="tagline">Precision Matches. Faster Results.</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <h2 className="h2">Sign In</h2>
          <p className="body text-sm">Access your job search dashboard</p>

          {error && (
            <div className="login-error">
              <span className="error-icon">⚠️</span>
              {error}
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
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="/forgot-password" className="forgot-password">
              Forgot password?
            </a>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <a href="/signup" className="signup-link">
              Start your free trial
            </a>
          </p>
        </div>

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

export default Login;





