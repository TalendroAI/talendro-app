import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    fetchUserData();
    
    const interval = setInterval(() => {
      calculateDaysRemaining();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUserData = async () => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        // No token, redirect to login
        navigate('/login');
        return;
      }

      const response = await fetch('/api/user/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // If unauthorized, token is invalid
        if (response.status === 401) {
          // Clear invalid token
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      setUserData(userData);
      calculateDaysRemaining(userData.trialEndsAt);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // If token invalid, redirect to login
      if (error.response?.status === 401 || error.message.includes('401')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        setLoading(false);
      }
    }
  };

  const calculateDaysRemaining = (trialEndDate) => {
    if (!trialEndDate) return;
    
    const now = new Date();
    const end = new Date(trialEndDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    setDaysRemaining(diffDays > 0 ? diffDays : 0);
  };

  const getPlanDisplayName = (plan) => {
    const plans = {
      basic: 'Basic',
      pro: 'Pro',
      premium: 'Premium'
    };
    return plans[plan] || plan;
  };

  const getPlanPrice = (plan) => {
    const prices = {
      basic: 29,
      pro: 49,
      premium: 99
    };
    return prices[plan] || 0;
  };

  const handleManageSubscription = async () => {
    try {
      // Get customer ID from user data
      const response = await fetch('/api/user/subscription');
      const data = await response.json();
      
      if (!data.stripeCustomerId) {
        alert('Unable to access subscription management');
        return;
      }

      // Create portal session
      const portalResponse = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId: data.stripeCustomerId }),
      });

      const portalData = await portalResponse.json();

      if (portalData.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = portalData.url;
      }

    } catch (error) {
      console.error('Error opening subscription portal:', error);
      alert('Failed to open subscription management. Please try again.');
    }
  };

  const handleUpdatePayment = () => {
    window.location.href = '/account/payment';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="dashboard-error">
        <p className="body">Unable to load dashboard. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="h1">Welcome back, {userData.name.split(' ')[0]}!</h1>
          <p className="body">Here's what's happening with your job search</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleUpdatePayment}>
            Update Payment
          </button>
          <button className="btn-primary" onClick={handleManageSubscription}>
            Manage Subscription
          </button>
        </div>
      </div>

      {/* Trial Banner */}
      {userData.subscriptionStatus === 'trialing' && (
        <div className="trial-banner">
          <div className="trial-icon">🎉</div>
          <div className="trial-content">
            <h3 className="h3">You're on a free trial!</h3>
            <p>
              <strong>{daysRemaining} days remaining</strong> in your 7-day trial. 
              You'll be charged ${getPlanPrice(userData.plan)}/month when your trial ends.
            </p>
          </div>
          <div className="trial-action">
            <button className="btn-outline">Cancel Trial</button>
          </div>
        </div>
      )}

      {/* Main Grid - 2 rows, 3 columns */}
      <div className="dashboard-grid">
        
        {/* COLUMN 1: Subscription Card (spans 2 rows) */}
        <div className="card subscription-card">
          <div className="card-header">
            <h2 className="h2">Your Subscription</h2>
            <span className={`status-badge ${userData.subscriptionStatus}`}>
              {userData.subscriptionStatus === 'trialing' ? 'Trial' : 'Active'}
            </span>
          </div>
          <div className="card-body">
            <div className="plan-info">
              <div className="plan-name">
                Talendro™ {getPlanDisplayName(userData.plan)}
              </div>
              <div className="plan-price">
                ${getPlanPrice(userData.plan)}<span>/month</span>
              </div>
            </div>
            
            <div className="subscription-details">
              <div className="detail-row">
                <span>Status:</span>
                <strong>
                  {userData.subscriptionStatus === 'trialing' ? 'Free Trial' : 'Active'}
                </strong>
              </div>
              <div className="detail-row">
                <span>Next billing:</span>
                <strong>
                  {new Date(userData.trialEndsAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </strong>
              </div>
              <div className="detail-row">
                <span>Email:</span>
                <strong>{userData.email}</strong>
              </div>
            </div>

            <button className="btn-manage" onClick={handleManageSubscription}>
              Manage Subscription →
            </button>
          </div>
        </div>

        {/* COLUMN 2, ROW 1: Tailored Match Rate */}
        <div className="card stats-card stats-card-highlight">
          <div className="card-header">
            <h2 className="h2">Tailored Match Rate</h2>
            <span className="info-icon" title="Match rate after AI tailors your resume to each job">ℹ️</span>
          </div>
          <div className="card-body">
            <div className="stat-value stat-value-success">
              {userData.stats.tailoredMatchRate || 0}%
            </div>
            <div className="stat-label">AI-tailored score</div>
            <div className="stat-secondary">Personalized matching</div>
          </div>
        </div>

        {/* COLUMN 3, ROW 1: Applications */}
        <div className="card stats-card">
          <div className="card-header">
            <h2 className="h2">Applications</h2>
          </div>
          <div className="card-body">
            <div className="stat-value">{userData.stats.totalApplications}</div>
            <div className="stat-label">Total submitted</div>
            <div className="stat-secondary">
              {userData.stats.applicationsThisMonth} this month
            </div>
          </div>
        </div>

        {/* COLUMN 2, ROW 2: Jobs Discovered */}
        <div className="card stats-card">
          <div className="card-header">
            <h2 className="h2">Jobs Discovered</h2>
          </div>
          <div className="card-body">
            <div className="stat-value">{userData.stats.totalJobsDiscovered}</div>
            <div className="stat-label">Total found</div>
            <div className="stat-secondary">Updated daily</div>
          </div>
        </div>

        {/* COLUMN 3, ROW 2: Initial Match Rate */}
        <div className="card stats-card">
          <div className="card-header">
            <h2 className="h2">Initial Match Rate</h2>
            <span className="info-icon" title="Match rate based on your raw resume">ℹ️</span>
          </div>
          <div className="card-body">
            <div className="stat-value">{userData.stats.matchRate}%</div>
            <div className="stat-label">Avg. match score</div>
            <div className="stat-secondary">AI-powered matching</div>
          </div>
        </div>

        {/* Getting Started Card */}
        <div className="card full-width getting-started-card">
          <div className="card-header">
            <h2 className="h2">🚀 Getting Started with Talendro</h2>
          </div>
          <div className="card-body">
            <div className="steps-grid">
              <div className="step completed">
                <div className="step-icon">✓</div>
                <div className="step-content">
                  <h3 className="h3">Complete Profile</h3>
                  <p className="body text-sm">Your profile is complete and ready!</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-icon">2</div>
                <div className="step-content">
                  <h3 className="h3">AI is Searching</h3>
                  <p className="body text-sm">Our AI is finding jobs that match your profile</p>
                  <button className="step-action">View Matches →</button>
                </div>
              </div>
              
              <div className="step">
                <div className="step-icon">3</div>
                <div className="step-content">
                  <h3 className="h3">Auto-Apply Active</h3>
                  <p className="body text-sm">We'll automatically apply to your top matches</p>
                  <button className="step-action">Configure Settings →</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="card quick-actions-card">
          <div className="card-header">
            <h2 className="h2">Quick Actions</h2>
          </div>
          <div className="card-body">
            <div className="action-list">
              <button className="action-item">
                <span className="action-icon">🔍</span>
                <span className="action-text">View Job Matches</span>
                <span className="action-arrow">→</span>
              </button>
              
              <button className="action-item">
                <span className="action-icon">📝</span>
                <span className="action-text">Update Resume</span>
                <span className="action-arrow">→</span>
              </button>
              
              <button className="action-item">
                <span className="action-icon">⚙️</span>
                <span className="action-text">Search Settings</span>
                <span className="action-arrow">→</span>
              </button>
              
              <button className="action-item">
                <span className="action-icon">💬</span>
                <span className="action-text">Get Support</span>
                <span className="action-arrow">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Activity Feed Card */}
        <div className="card activity-card">
          <div className="card-header">
            <h2 className="h2">Recent Activity</h2>
          </div>
          <div className="card-body">
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon success">✓</div>
                <div className="activity-content">
                  <div className="activity-title">Trial started</div>
                  <div className="activity-time">Today at 2:13 PM</div>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon info">ℹ️</div>
                <div className="activity-content">
                  <div className="activity-title">Profile completed</div>
                  <div className="activity-time">Today at 2:10 PM</div>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon">👤</div>
                <div className="activity-content">
                  <div className="activity-title">Account created</div>
                  <div className="activity-time">Today at 2:05 PM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
