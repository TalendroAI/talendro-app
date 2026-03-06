import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const { user: authUser, logout, resendVerification } = useAuth();
  const [verifyResent, setVerifyResent] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    fetchUserData();
    const interval = setInterval(() => {
      if (userData?.createdAt) calculateGuaranteeDaysRemaining(userData.createdAt);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/auth/sign-in');
        return;
      }
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/auth/sign-in');
          return;
        }
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      const user = data.user || data;
      if (!user.stats) {
        user.stats = {
          totalApplications: 0,
          applicationsThisMonth: 0,
          totalJobsDiscovered: 0,
          matchRate: 0,
          tailoredMatchRate: 0,
        };
      }
      // Fetch live stats from the database (overwrites stored stats with real-time values)
      try {
        const statsRes = await fetch('/api/auth/stats', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.stats) {
            user.stats = { ...user.stats, ...statsData.stats };
          }
        }
      } catch (statsErr) {
        console.warn('[Dashboard] Could not fetch live stats:', statsErr);
      }
      setUserData(user);
      if (user.createdAt) calculateGuaranteeDaysRemaining(user.createdAt);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  // 7-day money-back guarantee: calculated from account creation date
  const calculateGuaranteeDaysRemaining = (createdAt) => {
    if (!createdAt) return;
    const now = new Date();
    const created = new Date(createdAt);
    const guaranteeEnd = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
    const diffTime = guaranteeEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysRemaining(diffDays > 0 ? diffDays : 0);
  };

  const getPlanDisplayName = (plan) => {
    const plans = { basic: 'Basic', pro: 'Pro', premium: 'Premium' };
    return plans[plan] || (plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Pro');
  };

  const getPlanPrice = (plan) => {
    const prices = { basic: 29, pro: 49, premium: 99 };
    return prices[plan] || 49;
  };

  const handleManageSubscription = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const portalResponse = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ customerId: userData?.stripeCustomerId }),
      });
      const portalData = await portalResponse.json();
      if (portalData.url) {
        window.location.href = portalData.url;
      } else {
        alert('Unable to open subscription management. Please contact support.');
      }
    } catch (error) {
      console.error('Error opening subscription portal:', error);
      alert('Failed to open subscription management. Please try again.');
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/');
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
        <button className="btn-primary" onClick={() => { logout(); navigate('/auth/sign-in'); }}>
          Sign In Again
        </button>
      </div>
    );
  }

  const firstName = (userData.name || authUser?.name || 'there').split(' ')[0];
  const stats = userData.stats || {};
  const onboardingDone = (userData.onboardingProgress?.step || 0) >= 11;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="h1">Welcome back, {firstName}!</h1>
          <p className="body">Here's what's happening with your job search</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate('/app/onboarding')}>
            {onboardingDone ? 'Edit Profile' : 'Complete Profile'}
          </button>
          <button className="btn-primary" onClick={handleManageSubscription}>
            Manage Subscription
          </button>
          <button className="btn-outline" onClick={handleSignOut} style={{ marginLeft: 8 }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Email Verification Banner — shown until user verifies */}
      {userData && !userData.isEmailVerified && (
        <div className="trial-banner" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
          <div className="trial-icon">📧</div>
          <div className="trial-content">
            <h3 className="h3">Verify your email address</h3>
            <p>
              We sent a verification link to <strong>{userData.email}</strong>. Check your inbox and click the link to fully activate your account.
              {verifyResent && <span style={{ color: '#10B981', marginLeft: 8 }}>✓ Sent!</span>}
              {verifyError && <span style={{ color: '#EF4444', marginLeft: 8 }}>{verifyError}</span>}
            </p>
          </div>
          <div className="trial-action">
            <button
              className="btn-outline"
              disabled={verifyLoading || verifyResent}
              onClick={async () => {
                setVerifyLoading(true);
                setVerifyError('');
                const result = await resendVerification();
                setVerifyLoading(false);
                if (result?.success) {
                  setVerifyResent(true);
                  setTimeout(() => setVerifyResent(false), 60000);
                } else {
                  setVerifyError(result?.error || 'Failed to send');
                }
              }}
            >
              {verifyLoading ? 'Sending...' : verifyResent ? 'Email Sent ✓' : 'Resend Email'}
            </button>
          </div>
        </div>
      )}

      {/* 7-Day Money-Back Guarantee Banner — shown for first 7 days after signup */}
      {daysRemaining > 0 && (
        <div className="trial-banner">
          <div className="trial-icon">🎉</div>
          <div className="trial-content">
            <h3 className="h3">7-day money-back guarantee active</h3>
            <p>
              <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining</strong> in your guarantee period.
              Not satisfied? Contact support for a full refund — no questions asked.
            </p>
          </div>
          <div className="trial-action">
            <button className="btn-outline">Contact Support</button>
          </div>
        </div>
      )}

      {/* Onboarding nudge if not complete */}
      {!onboardingDone && (
        <div className="trial-banner" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <div className="trial-icon">📋</div>
          <div className="trial-content">
            <h3 className="h3">Complete your profile to activate AI job search</h3>
            <p>Your profile is {Math.round(((userData.onboardingProgress?.step || 0) / 11) * 100)}% complete. Finish onboarding so Talendro can start applying to jobs on your behalf.</p>
          </div>
          <div className="trial-action">
            <button className="btn-primary" onClick={() => navigate('/app/onboarding')}>
              Continue Profile →
            </button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="dashboard-grid">

        {/* COLUMN 1: Subscription Card */}
        <div className="card subscription-card">
          <div className="card-header">
            <h2 className="h2">Your Subscription</h2>
            <span className={`status-badge ${userData.subscriptionStatus === 'active' || userData.subscriptionStatus === 'trialing' ? 'active' : (userData.subscriptionStatus || 'active')}`}>
              {userData.subscriptionStatus === 'canceled' ? 'Canceled' : userData.subscriptionStatus === 'past_due' ? 'Past Due' : 'Active'}
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
                <strong>Active</strong>
              </div>
              {userData.currentPeriodEnd && (
                <div className="detail-row">
                  <span>Next billing:</span>
                  <strong>
                    {new Date(userData.currentPeriodEnd).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric'
                    })}
                  </strong>
                </div>
              )}
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
              {stats.tailoredMatchRate || 0}%
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
            <div className="stat-value">{stats.totalApplications || 0}</div>
            <div className="stat-label">Total submitted</div>
            <div className="stat-secondary">
              {stats.applicationsThisMonth || 0} this month
            </div>
          </div>
        </div>

        {/* COLUMN 2, ROW 2: Jobs Discovered */}
        <div className="card stats-card">
          <div className="card-header">
            <h2 className="h2">Jobs Discovered</h2>
          </div>
          <div className="card-body">
            <div className="stat-value">{stats.totalJobsDiscovered || 0}</div>
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
            <div className="stat-value">{stats.matchRate || 0}%</div>
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
              <div className={`step ${onboardingDone ? 'completed' : ''}`}>
                <div className="step-icon">{onboardingDone ? '✓' : '1'}</div>
                <div className="step-content">
                  <h3 className="h3">Complete Profile</h3>
                  <p className="body text-sm">
                    {onboardingDone ? 'Your profile is complete and ready!' : 'Finish your profile to activate AI job search.'}
                  </p>
                  {!onboardingDone && (
                    <button className="step-action" onClick={() => navigate('/app/onboarding')}>
                      Continue Profile →
                    </button>
                  )}
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
              <button className="action-item" onClick={() => navigate('/app/jobs')}>
                <span className="action-icon">🔍</span>
                <span className="action-text">View Job Matches</span>
                <span className="action-arrow">→</span>
              </button>
              <button className="action-item" onClick={() => navigate('/app/resume/update')}>
                <span className="action-icon">📝</span>
                <span className="action-text">Update Resume</span>
                <span className="action-arrow">→</span>
              </button>
              <button className="action-item" onClick={() => navigate('/app/onboarding')}>
                <span className="action-icon">👤</span>
                <span className="action-text">{onboardingDone ? 'Edit Profile' : 'Complete Profile'}</span>
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
              {onboardingDone && (
                <div className="activity-item">
                  <div className="activity-icon success">✓</div>
                  <div className="activity-content">
                    <div className="activity-title">Profile completed</div>
                    <div className="activity-time">Profile ready for AI job search</div>
                  </div>
                </div>
              )}
              <div className="activity-item">
                <div className="activity-icon success">✓</div>
                <div className="activity-content">
                  <div className="activity-title">Account created</div>
                  <div className="activity-time">
                    {userData.createdAt
                      ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : 'Recently'}
                  </div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon info">ℹ️</div>
                <div className="activity-content">
                  <div className="activity-title">Subscription active</div>
                  <div className="activity-time">Talendro™ {getPlanDisplayName(userData.plan)} plan</div>
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
