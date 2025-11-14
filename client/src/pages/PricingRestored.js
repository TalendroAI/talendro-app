import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PricingRestored() {
  const [billing, setBilling] = useState('monthly'); // 'monthly' or 'annual'

  // Pricing configuration - matching restored page pricing
  const plans = {
    basic: {
      name: 'Basic',
      monthly: 29,
      annual: 23,
      description: 'Perfect for passive job seekers',
      features: [
        'Daily job searches (AI runs once per day)',
        'Up to 50 auto-applications/month',
        'AI-powered matching & scoring',
        'Resume auto-tailored for each job',
        'SMS + Email notifications',
        'Basic analytics dashboard'
      ]
    },
    professional: {
      name: 'Professional',
      monthly: 49,
      annual: 39,
      description: 'For active job seekers',
      features: [
        'Hourly job searches (AI runs 24x per day)',
        'Unlimited auto-applications',
        'Priority auto-apply (first to submit)',
        'Advanced AI matching algorithms',
        'Detailed analytics & insights',
        'Everything in Basic'
      ],
      popular: true
    },
    premium: {
      name: 'Premium',
      monthly: 99,
      annual: 79,
      description: 'Maximum results & support',
      features: [
        'Real-time alerts (AI runs every 30 min)',
        'Dedicated success manager',
        'Interview preparation resources',
        'Salary negotiation support',
        'Priority customer support',
        'Everything in Pro'
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

  // Get current price for a plan
  const getPrice = (planKey) => {
    return billing === 'monthly' ? plans[planKey].monthly : plans[planKey].annual;
  };

  return (
    <section>
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 className="h1">Pricing</h1>
        <p className="tagline mt-2">Precision Matches, Faster Results</p>
        
        <p style={{ 
          fontSize: '1rem', 
          color: '#374151', 
          marginTop: '1.5rem',
          marginBottom: '1rem'
        }}>
          Choose the plan that matches your job search intensity.
        </p>
        
        <p style={{ 
          fontSize: '1rem', 
          color: '#374151', 
          marginBottom: '1rem',
          lineHeight: '1.6'
        }}>
          <strong>All plans Include:</strong> Real-time discovery across millions of job postings • AI-tailored resume for every application • Intelligent match scoring • Fully autonomous submission for 90% of applications
        </p>
        
        <p style={{ 
          fontSize: '0.875rem', 
          color: '#6b7280', 
          lineHeight: '1.6',
          marginTop: '1rem'
        }}>
          Our comprehensive onboarding collects 10 years of employment history, education, certifications, and references—enabling fully automated applications for 90% of positions. For the remaining 10%, the AI may ask 1-2 clarifying questions, learn from your answers, then auto-submit.
        </p>

        {/* Billing Toggle */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '1rem',
          marginTop: '2rem',
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
        marginBottom: '4rem'
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
                transition: 'transform 0.3s'
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
                marginBottom: '0.5rem',
                marginTop: isPopular ? '1rem' : '0'
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
                marginBottom: '0'
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
            </div>
          );
        })}
      </div>

      {/* Why This Investment Pays for Itself */}
      <div style={{
        marginBottom: '4rem',
        padding: '3rem 2rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '1rem'
      }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#2563eb',
          marginBottom: '0.5rem',
          textAlign: 'center'
        }}>
          Why This Investment Pays for Itself
        </h2>
        <p style={{
          fontSize: '1.125rem',
          color: '#374151',
          textAlign: 'center',
          marginBottom: '0.25rem'
        }}>
          The cost of Talendro™ is recovered in days when you land a job faster
        </p>
        <p style={{
          fontSize: '0.875rem',
          color: '#6b7280',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          The ROI of Speed + Tailoring
        </p>
        
        {/* Comparison Table */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Left Column - Traditional */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '2px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#dc2626',
              marginBottom: '1.5rem'
            }}>
              ✗ Traditional Job Search
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {[
                'Apply 1-2 weeks after posting (miss 21% interview boost)',
                'Generic resume (miss 25% callback boost)',
                'Compete with 100+ applicants',
                'Spend 5+ hours/week applying manually',
                '2-5 applications per week',
                'Result: 3-6 month job search'
              ].map((item, index) => (
                <li key={index} style={{
                  padding: '0.75rem 0',
                  borderBottom: '1px solid #f3f4f6',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Right Column - With Talendro */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '2px solid #10b981'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#10b981',
              marginBottom: '1.5rem'
            }}>
              ✓ With Talendro™
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {[
                'Apply within minutes (capture 21% interview boost)',
                'Tailored resume every time (capture 25% callback boost)',
                'Be in first 10 applicants (13% shortlist boost)',
                'Zero hours/week spent applying',
                '50-100+ applications per week',
                'Result: Find job 40-60% faster'
              ].map((item, index) => (
                <li key={index} style={{
                  padding: '0.75rem 0',
                  borderBottom: '1px solid #f3f4f6',
                  fontSize: '0.875rem',
                  color: '#374151'
                }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          marginBottom: '2rem',
          border: '2px solid #2563eb'
        }}>
          <p style={{
            fontSize: '1rem',
            color: '#1f2937',
            fontWeight: '600',
            marginBottom: '1rem'
          }}>
            Bottom Line:
          </p>
          <p style={{
            fontSize: '0.875rem',
            color: '#374151',
            lineHeight: '1.6'
          }}>
            If Talendro™ helps you land a job even 2 weeks faster, it pays for itself with your first paycheck. Most subscribers find their next role 1-2 months faster than traditional job searching.
          </p>
        </div>
        
        {/* Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem'
        }}>
          {[
            { number: '21%', text: 'Higher interview rate within first 96 hours (TalentWorks 2018)' },
            { number: '25%', text: 'More callbacks with tailored resumes (TopResume 2020)' },
            { number: '40%', text: 'Better ATS pass rate with tailored resumes (Jobscan 2021)' }
          ].map((stat, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              textAlign: 'center',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                color: '#2563eb',
                marginBottom: '0.5rem'
              }}>
                {stat.number}
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                lineHeight: '1.5'
              }}>
                {stat.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Why Our Comprehensive Onboarding Matters */}
      <div style={{
        marginBottom: '4rem'
      }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#2563eb',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          Why Our Comprehensive Onboarding Matters
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {[
            {
              title: '90% Fully Autonomous',
              text: 'Our in-depth onboarding collects 10 years of employment history, education, skills, certifications, and references. This enables fully automated submission for 90% of applications—with zero ongoing work required.'
            },
            {
              title: 'Apply While You Sleep',
              text: 'Search millions of jobs 24/7, auto-tailor your resume for each position, and submit applications entirely hands-free. Wake up to "Applied to 47 jobs overnight."'
            },
            {
              title: 'Cancel Anytime',
              text: 'No contracts, no commitments. Stop or pause your subscription whenever you want.'
            }
          ].map((card, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '1rem',
              border: '2px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#2563eb',
                marginBottom: '1rem'
              }}>
                {card.title}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#374151',
                lineHeight: '1.6'
              }}>
                {card.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How Autonomous Submission Actually Works */}
      <div style={{
        marginBottom: '4rem',
        padding: '3rem 2rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '1rem'
      }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#2563eb',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          How Autonomous Submission Actually Works
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {[
            {
              title: '90% Fully Autonomous Submission',
              text: 'AI searches, matches, tailors your resume, and submits applications—completely hands-free. You wake up to "Applied to 34 jobs overnight." Zero input required.'
            },
            {
              title: '9% Ask Once & Learn',
              text: 'AI encounters a never-before-seen question. Asks you once (30 seconds), learns your answer, adds it to your profile, updates the system for all users, then completes and submits the application. After your first month, this drops to ~1%.'
            },
            {
              title: '1% Manual Steps Required',
              text: 'Application requires video interview, complex assessment, or multi-stage process AI cannot automate. AI notifies you. *This position requires manual application. You decide if it\'s worth your time.*'
            }
          ].map((step, index) => (
            <div key={index} style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '1rem',
              border: '2px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#2563eb',
                marginBottom: '1rem'
              }}>
                {step.title}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#374151',
                lineHeight: '1.6'
              }}>
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Special Offer for Veterans */}
      <div style={{
        backgroundColor: '#eff6ff',
        padding: '3rem 2rem',
        borderRadius: '1rem',
        border: '2px solid #2563eb',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#2563eb',
          marginBottom: '1rem'
        }}>
          Special Offer for Veterans
        </h2>
        <p style={{
          fontSize: '1rem',
          color: '#374151',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          We provide free access to eligible veterans as part of our commitment to those who served.
        </p>
        <Link to="/veterans">
          <button style={{
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: '#2563eb',
            color: 'white'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1d4ed8';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#2563eb';
          }}>
            Learn About Veteran Benefits
          </button>
        </Link>
      </div>

      {/* Bottom CTA Buttons */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'flex-start',
        marginTop: '4rem',
        marginBottom: '2rem'
      }}>
        <Link to="/app/onboarding/welcome">
          <button style={{
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: '#2563eb',
            color: 'white'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1d4ed8';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#2563eb';
          }}>
            Get Started
          </button>
        </Link>
        <Link to="/about">
          <button style={{
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            border: '2px solid #2563eb',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s',
            backgroundColor: 'white',
            color: '#2563eb'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#eff6ff';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'white';
          }}>
            About
          </button>
        </Link>
      </div>

      {/* Mobile Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
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

