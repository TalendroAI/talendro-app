import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Page() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly'); // 'monthly' or 'annual'

  // Pricing configuration
  const plans = {
    starter: {
      name: 'Starter',
      monthly: 29,
      annual: 23,
      description: 'Perfect for passive job seekers',
      features: [
        'Daily job searches',
        'Up to 50 auto-applications/month',
        'AI-powered matching & scoring',
        'Resume auto-tailored for each job',
        'SMS + Email notifications',
        'Basic analytics dashboard'
      ]
    },
    professional: {
      name: 'Professional',
      monthly: 59,
      annual: 47,
      description: 'For active job seekers',
      features: [
        'Hourly job searches (24x per day)',
        'Unlimited auto-applications',
        'Priority auto-apply (first to submit)',
        'Advanced AI matching algorithms',
        'Detailed analytics & insights',
        'Everything in Starter'
      ],
      popular: true
    },
    premium: {
      name: 'Premium',
      monthly: 99,
      annual: 79,
      description: 'Maximum results & support',
      features: [
        'Real-time alerts (every 30 min)',
        'Dedicated success manager',
        'Interview preparation resources',
        'Salary negotiation support',
        'Priority customer support',
        'Everything in Professional'
      ]
    }
  };

  // Calculate savings for annual billing
  const calculateSavings = (planKey) => {
    const plan = plans[planKey];
    const monthlyTotal = plan.monthly * 12;
    const annualTotal = plan.annual * 12;
    return monthlyTotal - annualTotal;
  };

  // Handle plan selection
  const handleSelectPlan = (planKey) => {
    const selection = {
      plan: planKey,
      billing: billing
    };
    localStorage.setItem('selectedPlan', JSON.stringify(selection));
    navigate('/app/onboarding/step-1');
  };

  // Get current price for a plan
  const getPrice = (planKey) => {
    return billing === 'monthly' ? plans[planKey].monthly : plans[planKey].annual;
  };

  return (
    <section style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 className="h1">Choose Your Plan</h1>
        <p className='tagline mt-2'>All plans include AI-powered job matching and automated applications</p>

        {/* Billing Toggle */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <span style={{ 
            color: billing === 'monthly' ? '#2563eb' : '#6b7280',
            fontWeight: billing === 'monthly' ? '600' : '400',
            fontSize: '1rem'
          }}>
            Monthly
          </span>
          <button
            onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
            style={{
              width: '56px',
              height: '32px',
              borderRadius: '16px',
              border: 'none',
              backgroundColor: billing === 'annual' ? '#2563eb' : '#d1d5db',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background-color 0.3s',
              outline: 'none'
            }}
            aria-label="Toggle billing period"
          >
            <span
              style={{
                position: 'absolute',
                top: '4px',
                left: billing === 'monthly' ? '4px' : '28px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'white',
                transition: 'left 0.3s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            />
          </button>
          <span style={{ 
            color: billing === 'annual' ? '#2563eb' : '#6b7280',
            fontWeight: billing === 'annual' ? '600' : '400',
            fontSize: '1rem'
          }}>
            Annual
          </span>
          {billing === 'annual' && (
            <span style={{
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginLeft: '0.5rem'
            }}>
              Save up to ${calculateSavings('premium')}/year
            </span>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        {Object.entries(plans).map(([key, plan]) => {
          const price = getPrice(key);
          const savings = calculateSavings(key);
          const isPopular = plan.popular;

          return (
            <div
              key={key}
              style={{
                backgroundColor: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                border: isPopular ? '2px solid #2563eb' : '2px solid #e5e7eb',
                boxShadow: isPopular ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                transform: isPopular ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.3s',
                '@media (max-width: 768px)': {
                  transform: 'scale(1)'
                }
              }}
            >
              {isPopular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Most Popular
                </div>
              )}

              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: isPopular ? '#2563eb' : '#1f2937',
                marginBottom: '0.5rem'
              }}>
                {plan.name}
              </h3>

              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  color: '#2563eb'
                }}>
                  ${price}
                </span>
                <span style={{
                  fontSize: '1.125rem',
                  color: '#6b7280',
                  marginLeft: '0.5rem'
                }}>
                  /month
                </span>
                {billing === 'annual' && (
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    display: 'block',
                    marginTop: '0.25rem'
                  }}>
                    billed annually
                  </span>
                )}
              </div>

              {billing === 'annual' && (
                <p style={{
                  fontSize: '0.875rem',
                  color: '#16a34a',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  Save ${savings}/year
                </p>
              )}

              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '1.5rem'
              }}>
                {plan.description}
              </p>

              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                marginBottom: '2rem',
                flex: 1
              }}>
                {plan.features.map((feature, index) => (
                  <li key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem',
                    fontSize: '0.875rem',
                    color: '#374151'
                  }}>
                    <span style={{
                      color: '#00bcd4',
                      marginRight: '0.75rem',
                      fontSize: '1.25rem',
                      lineHeight: '1'
                    }}>●</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(key)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  backgroundColor: isPopular ? '#2563eb' : 'white',
                  color: isPopular ? 'white' : '#2563eb',
                  borderWidth: isPopular ? '0' : '2px',
                  borderStyle: isPopular ? 'none' : 'solid',
                  borderColor: '#2563eb',
                  marginTop: 'auto'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = isPopular ? '#1d4ed8' : '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = isPopular ? '#2563eb' : 'white';
                }}
              >
                Get Started
              </button>
            </div>
          );
        })}
      </div>

      {/* Additional Info Section */}
      <div style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '1rem',
        padding: '2rem',
        marginTop: '3rem',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '1rem'
        }}>
          All Plans Include
        </h2>
        <p style={{
          fontSize: '1rem',
          color: '#6b7280',
          marginBottom: '1.5rem'
        }}>
          Real-time job discovery • AI-tailored resumes • Intelligent match scoring • Fully autonomous submission for 90% of applications
        </p>
        <p style={{
          fontSize: '0.875rem',
          color: '#9ca3af'
        }}>
          Cancel anytime. No contracts. No commitments.
        </p>
      </div>

      {/* Mobile Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          section {
            padding: 1rem !important;
          }
          h1 {
            font-size: 2rem !important;
          }
          div[style*="grid"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="scale(1.05)"] {
            transform: scale(1) !important;
          }
        }
      `}</style>
    </section>
  );
}
