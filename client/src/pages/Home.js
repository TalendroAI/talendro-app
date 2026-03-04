import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly');

  // Pricing configuration — Talendro unified platform tiers
  const plans = {
    starter: {
      name: 'Starter',
      monthly: 49,
      annual: 39,
      description: 'For professionals ready to automate their job search',
      features: [
        '24/7 automated job search',
        'Up to 100 auto-applications/month',
        'AI resume tailoring for each job',
        '75%+ match threshold filtering',
        'Email & SMS job alerts',
        'Application tracking dashboard',
        'Quick Prep interview coaching'
      ]
    },
    pro: {
      name: 'Pro',
      monthly: 99,
      annual: 79,
      description: 'For serious job seekers who want maximum reach',
      features: [
        'Everything in Starter',
        'Unlimited auto-applications',
        'Real-time job alerts (every 30 min)',
        'Priority apply — first to submit',
        'Advanced AI matching & scoring',
        'Full Mock interview coaching',
        'Detailed analytics & insights'
      ],
      popular: true
    },
    concierge: {
      name: 'Concierge',
      monthly: 499,
      annual: 399,
      description: 'Full-service, done-for-you job placement',
      features: [
        'Everything in Pro',
        'Dedicated success manager',
        'Premium Audio interview coaching',
        'Custom outreach to hiring managers',
        'Salary negotiation support',
        'LinkedIn profile optimization',
        'Weekly strategy calls'
      ]
    }
  };

  const calculateSavings = (planKey) => {
    const plan = plans[planKey];
    return (plan.monthly - plan.annual) * 12;
  };

  const getPrice = (planKey) =>
    billing === 'monthly' ? plans[planKey].monthly : plans[planKey].annual;

  const handleSelectPlan = (planKey) => {
    const selection = {
      plan: planKey,
      billing,
      price: getPrice(planKey)
    };
    localStorage.setItem('selectedPlan', JSON.stringify(selection));
    navigate('/app/resume-gate');
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-50 pt-12 pb-24">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="h1 mb-4">
            Talendro™
          </h1>

          <p className="tagline mb-6">
            Precision Matches. Faster Results.
          </p>

          <p className="body mb-3">
            Your autonomous job search navigator for experienced professionals.
          </p>

          <p className="body mb-6">
            More roles. Better matches. Faster offers.
          </p>

          {/* Research-Backed Stats Banner */}
          <div className="bg-talBlue text-white py-8 px-8 rounded-2xl shadow-lg mb-6">
            <h2 className="h2 text-white text-center mb-6 uppercase tracking-wide">
              Research-Proven Advantages
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <p className="text-4xl font-bold text-white mb-3">13%</p>
                <p className="body text-white text-sm">More likely to be hired as first 10 applicants*</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-white mb-3">25%</p>
                <p className="body text-white text-sm">More callbacks with tailored resumes*</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-white mb-3">21%</p>
                <p className="body text-white text-sm">Higher interview rate within first 96 hours*</p>
              </div>
            </div>
            <p className="text-xs text-white text-center mt-6 opacity-90">
              *Sources: The Ladders (2019), TopResume (2020), TalentWorks (2018)
            </p>
          </div>

          {/* Primary CTA */}
          <div className="flex gap-4 justify-center mt-8">
            <a href="#pricing">
              <button className="btn btn-primary px-8 py-3 text-lg">
                Get Started
              </button>
            </a>
            <Link to="/how-it-works">
              <button className="btn btn-secondary px-8 py-3 text-lg">
                See How It Works
              </button>
            </Link>
          </div>
          <p className="body text-sm text-gray-500 mt-4">
            7-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Three Core Features */}
      <section className="pt-4 pb-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="h2 text-center mb-4">
            How Talendro™ Works
          </h2>
          <p className="body text-center mb-16 max-w-3xl mx-auto">
            Three competitive advantages working together, 24/7 on your behalf
          </p>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="text-6xl mb-6">🔍</div>
              <h3 className="h3 mb-4">
                Real-Time Discovery
              </h3>
              <p className="body">
                AI agents monitor millions of job postings 24/7, finding opportunities
                within minutes of posting—before they appear on major job boards.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="text-6xl mb-6">📄</div>
              <h3 className="h3 mb-4">
                Tailored Applications
              </h3>
              <p className="body">
                Every application gets a custom-tailored resume optimized for the specific
                role and company, maximizing ATS pass rates and recruiter interest.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="text-6xl mb-6">⚡</div>
              <h3 className="h3 mb-4">
                Perfect Timing
              </h3>
              <p className="body">
                Applications submitted within minutes of posting, when you're most likely
                to be seen by recruiters and land in the "first 10 applicants" window.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Talendro - Consolidated */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="h2 text-center mb-4">
            Why Experienced Professionals Choose Talendro™
          </h2>
          <p className="body text-center mb-16 max-w-3xl mx-auto">
            Built by recruitment veterans specifically for mid-to-late career professionals
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-4 shadow-md -mr-8">
              <div className="flex items-center gap-3">
                <div className="text-2xl flex-shrink-0">⏰</div>
                <h3 className="h3 mb-0">Time-Efficient & Fully Autonomous</h3>
              </div>
              <p className="body mt-2 ml-[2.75rem] text-sm">
                Focus on your current role while our AI handles your entire job search.
                Zero hours per week required after initial 10-25 minute setup.
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="text-2xl flex-shrink-0">🎯</div>
                <h3 className="h3 mb-0">Quality Over Quantity</h3>
              </div>
              <p className="body mt-2 ml-[2.75rem] text-sm">
                Smart 75%+ match threshold ensures you only apply to roles where
                you're a strong fit. No spray-and-pray approach.
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md -mr-8">
              <div className="flex items-center gap-3">
                <div className="text-2xl flex-shrink-0">💼</div>
                <h3 className="h3 mb-0">Built for Experienced Professionals</h3>
              </div>
              <p className="body mt-2 ml-[2.75rem] text-sm">
                Designed specifically for professionals with 5+ years of experience.
                Our AI understands senior-level job markets and requirements.
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="text-2xl flex-shrink-0">🏆</div>
                <h3 className="h3 mb-0">Recruiter-Built Technology</h3>
              </div>
              <p className="body mt-2 ml-[2.75rem] text-sm">
                Created by recruitment industry veterans with 20+ years of experience.
                We know exactly what hiring managers want to see.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / How It Helps */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl px-12 pt-0 pb-6 border-2 border-talBlue">
            <h2 className="h2 text-center mb-0 relative z-20">
              The Reality of Modern Job Searching
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-4 -mt-8">
              <div className="bg-white rounded-lg p-6 border-2 border-red-200">
                <h3 className="h3 mb-4 text-red-700">
                  ❌ Traditional Job Search
                </h3>
                <ul className="space-y-2 body text-sm list-disc list-inside">
                  <li>Spend 11+ hours per week applying manually</li>
                  <li>See postings 1-2 weeks after they go live</li>
                  <li>Compete with 250+ applicants per job</li>
                  <li>Use generic resume for every application</li>
                  <li>Average 3-6 month job search</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg p-6 border-2 border-green-500 relative z-10">
                <h3 className="h3 mb-4 text-green-700">
                  ✓ With Talendro™
                </h3>
                <ul className="space-y-2 body text-sm list-disc list-inside">
                  <li>Zero hours per week after setup</li>
                  <li>Apply within minutes of job posting</li>
                  <li>Be in the "first 10 applicants" window</li>
                  <li>Tailored resume for every application</li>
                  <li>Find jobs 40-60% faster on average</li>
                </ul>
              </div>
            </div>

            <p className="text-center text-lg font-semibold text-gray-900">
              Stop spending your evenings applying to jobs. Let our AI do it for you.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRICING SECTION — anchor: #pricing          */}
      {/* ============================================ */}
      <section id="pricing" className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="h1 mb-2">Choose Your Plan</h2>
            <p className="body mb-8 max-w-2xl mx-auto">
              Talendro searches for jobs 24/7, tailors your resume, and applies on your behalf — automatically.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={billing === 'monthly' ? 'text-talBlue font-semibold' : 'text-gray-600'}>
                Monthly
              </span>
              <button
                onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
                className={`w-14 h-8 rounded-full border-none cursor-pointer relative transition-colors outline-none ${
                  billing === 'annual' ? 'bg-talBlue' : 'bg-gray-300'
                }`}
                aria-label="Toggle billing period"
              >
                <span
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm ${
                    billing === 'monthly' ? 'left-1' : 'left-7'
                  }`}
                />
              </button>
              <span className={billing === 'annual' ? 'text-talBlue font-semibold' : 'text-gray-600'}>
                Annual
              </span>
              {billing === 'annual' && (
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm font-semibold ml-2">
                  Save up to ${calculateSavings('concierge')}/year
                </span>
              )}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {Object.entries(plans).map(([key, plan]) => {
              const price = getPrice(key);
              const savings = calculateSavings(key);
              const isPopular = plan.popular;

              return (
                <div
                  key={key}
                  className={`card relative flex flex-col ${
                    isPopular
                      ? 'border-2 border-talBlue transform scale-105 md:scale-105'
                      : 'border-2 border-gray-200'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-talBlue text-white px-6 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  )}

                  <h3 className={`h3 mb-2 ${isPopular ? 'text-talBlue' : ''}`}>
                    {plan.name}
                  </h3>

                  <div className="mb-2">
                    <span className="text-4xl font-bold text-talBlue">${price}</span>
                    <span className="text-lg text-gray-600 ml-2">/month</span>
                    {billing === 'annual' && (
                      <span className="body text-sm text-gray-600 block mt-1">billed annually</span>
                    )}
                  </div>

                  {billing === 'annual' && (
                    <p className="body text-sm text-green-700 font-semibold mb-4">
                      Save ${savings}/year
                    </p>
                  )}

                  <p className="body text-sm mb-6">{plan.description}</p>

                  <ul className="list-none p-0 m-0 mb-8 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start mb-3">
                        <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                        <span className="body text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(key)}
                    className={`btn w-full mt-auto ${isPopular ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Get Started
                  </button>
                </div>
              );
            })}
          </div>

          {/* Trust signals */}
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
            <h3 className="h3 mb-4">All Plans Include</h3>
            <p className="body mb-4">
              24/7 job discovery · AI-tailored resumes · 75%+ match threshold · Autonomous application submission
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <span>✓ 7-day money-back guarantee</span>
              <span>✓ Cancel anytime</span>
              <span>✓ No contracts</span>
              <span>✓ Secure payments via Stripe</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
