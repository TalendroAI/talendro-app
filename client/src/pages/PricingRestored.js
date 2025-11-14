import React from 'react';
import { Link } from 'react-router-dom';

export default function PricingRestored() {
  return (
    <section style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
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
      </div>

      {/* Pricing Plans */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginBottom: '4rem'
      }}>
        {/* Basic Plan */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          border: '2px solid #e5e7eb',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            Basic
          </h3>
          
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              color: '#2563eb'
            }}>
              $29
            </span>
            <span style={{
              fontSize: '1.125rem',
              color: '#6b7280',
              marginLeft: '0.5rem'
            }}>
              /month
            </span>
          </div>
          
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginBottom: '1.5rem'
          }}>
            Perfect for passive job seekers
          </p>
          
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            marginBottom: '2rem',
            flex: 1
          }}>
            {[
              'Daily job searches (AI runs once per day)',
              'Up to 50 auto-applications/month',
              'AI-powered matching & scoring',
              'Resume auto-tailored for each job',
              'SMS + Email notifications',
              'Basic analytics dashboard'
            ].map((feature, index) => (
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
          
          <Link to="/app/onboarding/step-1">
            <button style={{
              width: '100%',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: '2px solid #2563eb',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backgroundColor: 'white',
              color: '#2563eb',
              marginTop: 'auto'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#eff6ff';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
            }}>
              Get Started
            </button>
          </Link>
        </div>

        {/* Professional Plan (Most Popular) */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          border: '2px solid #2563eb',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          transform: 'scale(1.05)'
        }}>
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
          
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#2563eb',
            marginBottom: '0.5rem',
            marginTop: '1rem'
          }}>
            Professional
          </h3>
          
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              color: '#2563eb'
            }}>
              $49
            </span>
            <span style={{
              fontSize: '1.125rem',
              color: '#6b7280',
              marginLeft: '0.5rem'
            }}>
              /month
            </span>
          </div>
          
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginBottom: '1.5rem'
          }}>
            For active job seekers
          </p>
          
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            marginBottom: '2rem',
            flex: 1
          }}>
            {[
              'Hourly job searches (AI runs 24x per day)',
              'Unlimited auto-applications',
              'Priority auto-apply (first to submit)',
              'Advanced AI matching algorithms',
              'Detailed analytics & insights',
              'Everything in Basic'
            ].map((feature, index) => (
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
          
          <Link to="/app/onboarding/step-1">
            <button style={{
              width: '100%',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backgroundColor: '#2563eb',
              color: 'white',
              marginTop: 'auto'
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
        </div>

        {/* Premium Plan */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          border: '2px solid #e5e7eb',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            Premium
          </h3>
          
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              color: '#2563eb'
            }}>
              $99
            </span>
            <span style={{
              fontSize: '1.125rem',
              color: '#6b7280',
              marginLeft: '0.5rem'
            }}>
              /month
            </span>
          </div>
          
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            marginBottom: '1.5rem'
          }}>
            Maximum results & support
          </p>
          
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            marginBottom: '2rem',
            flex: 1
          }}>
            {[
              'Real-time alerts (AI runs every 30 min)',
              'Dedicated success manager',
              'Interview preparation resources',
              'Salary negotiation support',
              'Priority customer support',
              'Everything in Pro'
            ].map((feature, index) => (
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
          
          <Link to="/app/onboarding/step-1">
            <button style={{
              width: '100%',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: '2px solid #2563eb',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backgroundColor: 'white',
              color: '#2563eb',
              marginTop: 'auto'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#eff6ff';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
            }}>
              Get Started
            </button>
          </Link>
        </div>
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

