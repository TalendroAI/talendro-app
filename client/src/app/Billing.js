import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const C = {
  bg: '#F9FAFB',
  white: '#FFFFFF',
  blue: '#2563EB',
  blueLight: '#EFF6FF',
  green: '#10B981',
  greenLight: '#ECFDF5',
  yellow: '#F59E0B',
  yellowLight: '#FFFBEB',
  red: '#EF4444',
  redLight: '#FEF2F2',
  gray: '#6B7280',
  grayLight: '#F3F4F6',
  border: '#E5E7EB',
  text: '#111827',
  textMuted: '#6B7280',
};

const PLAN_DETAILS = {
  starter: {
    name: 'Starter',
    color: C.blue,
    bg: C.blueLight,
    price: '$29/mo',
    features: ['Up to 50 applications/month', 'AI resume optimization', 'Job matching', 'Email support'],
  },
  pro: {
    name: 'Pro',
    color: '#7C3AED',
    bg: '#F5F3FF',
    price: '$59/mo',
    features: ['Unlimited applications', 'AI resume optimization', 'Priority job matching', 'Interview coaching', 'Priority support'],
  },
  concierge: {
    name: 'Concierge',
    color: '#D97706',
    bg: '#FFFBEB',
    price: '$149/mo',
    features: ['Everything in Pro', 'Dedicated job search agent', 'Personalized outreach', 'Weekly strategy calls', 'White-glove support'],
  },
};

function StatusBadge({ status }) {
  const map = {
    active: { label: 'Active', color: C.green, bg: C.greenLight },
    past_due: { label: 'Past Due', color: C.red, bg: C.redLight },
    canceled: { label: 'Canceled', color: C.gray, bg: C.grayLight },
    incomplete: { label: 'Incomplete', color: C.yellow, bg: C.yellowLight },
    trialing: { label: 'Active', color: C.green, bg: C.greenLight },
  };
  const s = map[status] || { label: status || 'Unknown', color: C.gray, bg: C.grayLight };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
      color: s.color, background: s.bg,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
      {s.label}
    </span>
  );
}

export default function Billing() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) { navigate('/auth/sign-in'); return; }
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { navigate('/auth/sign-in'); return; }
      const data = await res.json();
      setUserData(data.user || data);
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    setPortalLoading(true);
    setPortalError('');
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to open billing portal');
      window.location.href = data.url;
    } catch (err) {
      setPortalError(err.message);
      setPortalLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const getGuaranteeDaysLeft = (createdAt) => {
    if (!createdAt) return 0;
    const diff = Math.ceil(7 - (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: C.textMuted }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Loading billing info...
        </div>
      </div>
    );
  }

  const plan = userData?.plan || 'starter';
  const planInfo = PLAN_DETAILS[plan] || PLAN_DETAILS.starter;
  const status = userData?.subscriptionStatus || 'active';
  const nextBilling = userData?.currentPeriodEnd;
  const guaranteeDaysLeft = getGuaranteeDaysLeft(userData?.createdAt);
  const daysUntilRenewal = getDaysRemaining(nextBilling);
  const hasStripeCustomer = !!userData?.stripeCustomerId;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: '32px 24px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .billing-btn { transition: all 0.2s; cursor: pointer; }
        .billing-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .billing-btn:active { transform: translateY(0); }
        .billing-card { transition: box-shadow 0.2s; }
        .billing-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important; }
      `}</style>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: C.text, margin: 0 }}>Billing & Plan</h1>
          <p style={{ color: C.textMuted, marginTop: 6, fontSize: 15 }}>
            Manage your subscription, payment method, and billing history.
          </p>
        </div>

        {/* 7-day guarantee banner */}
        {guaranteeDaysLeft > 0 && (
          <div style={{
            background: C.greenLight, border: `1px solid ${C.green}`, borderRadius: 12,
            padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>🛡️</span>
            <div>
              <strong style={{ color: C.green }}>7-Day Money-Back Guarantee Active</strong>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#065F46' }}>
                You have <strong>{guaranteeDaysLeft} day{guaranteeDaysLeft !== 1 ? 's' : ''}</strong> remaining in your guarantee period.
                Not satisfied? Contact <a href="mailto:support@talendro.com" style={{ color: C.green }}>support@talendro.com</a> for a full refund.
              </p>
            </div>
          </div>
        )}

        {/* Current Plan Card */}
        <div className="billing-card" style={{
          background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
          padding: 28, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>Current Plan</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  background: planInfo.bg, color: planInfo.color,
                  padding: '6px 16px', borderRadius: 20, fontSize: 15, fontWeight: 700,
                }}>
                  {planInfo.name}
                </span>
                <StatusBadge status={status} />
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: '12px 0 4px' }}>{planInfo.price}</p>
              <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>
                {nextBilling
                  ? `Next billing date: ${formatDate(nextBilling)}${daysUntilRenewal !== null ? ` (${daysUntilRenewal} days)` : ''}`
                  : 'Billing date not available'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {planInfo.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text, marginBottom: 6 }}>
                    <span style={{ color: C.green, fontWeight: 700, fontSize: 15 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Manage Billing Card */}
        <div className="billing-card" style={{
          background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
          padding: 28, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: '0 0 6px' }}>Manage Billing</h2>
          <p style={{ fontSize: 14, color: C.textMuted, margin: '0 0 20px' }}>
            Update your payment method, download invoices, or cancel your subscription through the secure Stripe billing portal.
          </p>

          {portalError && (
            <div style={{
              background: C.redLight, border: `1px solid ${C.red}`, borderRadius: 8,
              padding: '10px 16px', marginBottom: 16, fontSize: 13, color: C.red,
            }}>
              {portalError}
            </div>
          )}

          {!hasStripeCustomer ? (
            <div style={{
              background: C.yellowLight, border: `1px solid ${C.yellow}`, borderRadius: 8,
              padding: '12px 16px', fontSize: 13, color: '#92400E',
            }}>
              No billing account found. If you recently subscribed, it may take a moment to sync.
              Please <a href="mailto:support@talendro.com" style={{ color: C.yellow }}>contact support</a> if this persists.
            </div>
          ) : (
            <button
              className="billing-btn"
              onClick={openCustomerPortal}
              disabled={portalLoading}
              style={{
                background: C.blue, color: C.white, border: 'none',
                padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: portalLoading ? 0.7 : 1,
              }}
            >
              {portalLoading ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  Opening portal...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  Manage Billing & Invoices
                </>
              )}
            </button>
          )}

          <p style={{ fontSize: 12, color: C.textMuted, marginTop: 12 }}>
            You'll be redirected to a secure Stripe-hosted portal. Your payment info is never stored on our servers.
          </p>
        </div>

        {/* Upgrade / Change Plan Card */}
        {plan !== 'concierge' && (
          <div className="billing-card" style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
            borderRadius: 16, padding: 28, marginBottom: 20,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
              {plan === 'starter' ? 'Upgrade to Pro or Concierge' : 'Upgrade to Concierge'}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '0 0 20px' }}>
              {plan === 'starter'
                ? 'Get unlimited applications, interview coaching, and priority matching.'
                : 'Get a dedicated job search agent, personalized outreach, and white-glove support.'}
            </p>
            <button
              className="billing-btn"
              onClick={() => navigate('/pricing')}
              style={{
                background: '#fff', color: C.blue, border: 'none',
                padding: '11px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              }}
            >
              View Plans →
            </button>
          </div>
        )}

        {/* Billing Info */}
        <div className="billing-card" style={{
          background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
          padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: '0 0 16px' }}>Account Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Account Email', value: userData?.email || '—' },
              { label: 'Plan', value: planInfo.name },
              { label: 'Status', value: <StatusBadge status={status} /> },
              { label: 'Member Since', value: formatDate(userData?.createdAt) },
              { label: 'Next Billing Date', value: formatDate(nextBilling) },
              { label: 'Stripe Customer ID', value: userData?.stripeCustomerId ? `...${userData.stripeCustomerId.slice(-8)}` : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '12px 16px', background: C.grayLight, borderRadius: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 4px' }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support footer */}
        <p style={{ textAlign: 'center', fontSize: 13, color: C.textMuted, marginTop: 24 }}>
          Questions about your bill? Email us at{' '}
          <a href="mailto:support@talendro.com" style={{ color: C.blue, fontWeight: 600 }}>support@talendro.com</a>
        </p>

      </div>
    </div>
  );
}
