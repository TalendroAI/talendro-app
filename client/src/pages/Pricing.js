import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Page() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly'); // 'monthly' or 'annual'

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
        'Application tracking dashboard'
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
        'Interview prep resources',
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
        'Custom outreach to hiring managers',
        'Salary negotiation support',
        'LinkedIn profile optimization',
        'Weekly strategy calls',
        'Priority 24/7 support'
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

  // Handle plan selection — store plan and go to checkout
  const handleSelectPlan = (planKey) => {
    const selection = {
      plan: planKey,
      billing: billing,
      price: billing === 'monthly' ? plans[planKey].monthly : plans[planKey].annual
    };
    localStorage.setItem('selectedPlan', JSON.stringify(selection));
    navigate(`/app/checkout?plan=${planKey}`);
  };

  // Get current price for a plan
  const getPrice = (planKey) => {
    return billing === 'monthly' ? plans[planKey].monthly : plans[planKey].annual;
  };

  return (
    <section className="py-10 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="h1 mb-2">
          Choose Your Plan
        </h1>
        <p className="body mb-8">
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
              className={`card relative flex flex-col ${isPopular ? 'border-2 border-talBlue transform scale-105 md:scale-105' : 'border-2 border-gray-200'}`}
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
                <span className="text-4xl font-bold text-talBlue">
                  ${price}
                </span>
                <span className="text-lg text-gray-600 ml-2">
                  /month
                </span>
                {billing === 'annual' && (
                  <span className="body text-sm text-gray-600 block mt-1">
                    billed annually
                  </span>
                )}
              </div>

              {billing === 'annual' && (
                <p className="body text-sm text-green-700 font-semibold mb-4">
                  Save ${savings}/year
                </p>
              )}

              <p className="body text-sm mb-6">
                {plan.description}
              </p>

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

      {/* Additional Info Section */}
      <div className="bg-gray-50 rounded-2xl p-8 mt-12 text-center">
        <h2 className="h2 mb-4">
          All Plans Include
        </h2>
        <p className="body mb-6">
          24/7 job discovery • AI-tailored resumes • 75%+ match threshold • Autonomous application submission
        </p>
        <p className="body text-sm text-gray-500">
          Cancel anytime. No contracts. No commitments.
        </p>
      </div>
    </section>
  );
}
