import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Page() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly'); // 'monthly' or 'annual'

  const plans = {
    starter: {
      name: 'Starter',
      monthly: 49,
      annual: 39,
      description: 'For professionals ready to automate their job search',
      features: [
        'Automated job search every 4 hours',
        'Up to 50 applications/month',
        'ATS-optimized plain text resume',
        'Quick Prep Interview Report',
        '75%+ match threshold filtering',
        'Applications audit trail dashboard'
      ]
    },
    pro: {
      name: 'Pro',
      monthly: 99,
      annual: 79,
      description: 'For serious job seekers who want maximum reach',
      features: [
        'Everything in Starter, plus:',
        'Automated job search every 60 minutes',
        'Up to 200 applications/month',
        'Professionally formatted PDF resume',
        'Full Mock Interview (AI-coached chat)',
        'AI salary negotiation support'
      ],
      popular: true
    },
    concierge: {
      name: 'Concierge',
      monthly: 249,
      annual: 199,
      description: 'Full-service, done-for-you career advancement',
      features: [
        'Everything in Pro, plus:',
        'Automated job search every 30 minutes',
        'Unlimited applications',
        'LinkedIn profile optimization',
        'Premium Audio Mock Interview (voice sim)',
        'Advanced salary negotiation support',
        'Weekly AI strategy session'
      ]
    }
  };

  const calculateSavings = (planKey) => {
    const plan = plans[planKey];
    const monthlyTotal = plan.monthly * 12;
    const annualTotal = plan.annual * 12;
    return Math.round(((monthlyTotal - annualTotal) / monthlyTotal) * 100);
  };

  const handleSelectPlan = (planKey) => {
    navigate(`/app/checkout?plan=${planKey}&billing=${billing}`);
  };

  return (
    <section>
      <div className="text-center">
        <h1 className="h1">Choose Your Plan</h1>
        <p className="tagline mt-2">Talendro searches for jobs 24/7, tailors your resume, and applies on your behalf — automatically.</p>
      </div>

      <div className="mt-8 flex justify-center">
        <div className="relative flex items-center p-1 bg-gray-200 rounded-full">
          <button
            className={`relative w-1/2 py-2 text-sm font-medium rounded-full transition-colors ${billing === 'monthly' ? 'text-white' : 'text-gray-500'}`}
            onClick={() => setBilling('monthly')}
          >
            Monthly
          </button>
          <button
            className={`relative w-1/2 py-2 text-sm font-medium rounded-full transition-colors ${billing === 'annual' ? 'text-white' : 'text-gray-500'}`}
            onClick={() => setBilling('annual')}
          >
            Annual
          </button>
          <span className={`absolute top-1 left-1 h-10 w-1/2 bg-talBlue rounded-full transition-transform duration-300 ease-in-out ${billing === 'annual' ? 'transform translate-x-full' : ''}`} />
        </div>
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-8 items-start" style={{paddingTop: '1.5rem'}}>
        {Object.keys(plans).map((key) => {
          const plan = plans[key];
          const isPopular = plan.popular;
          return (
            <div key={key} className={`relative card ${isPopular ? 'border-2 border-talBlue scale-105 mt-0' : ''}`} style={isPopular ? {paddingTop: '2.5rem'} : {}}>
              {isPopular && (
                <div className="absolute left-1/2 transform -translate-x-1/2" style={{top: '-1rem'}}>
                  <div className="inline-block px-4 py-1 text-sm font-semibold tracking-wider text-white uppercase bg-talBlue rounded-full whitespace-nowrap">Most Popular</div>
                </div>
              )}
              <h3 className="h3 mb-2">{plan.name}</h3>
              <p className="body text-sm mb-4">{plan.description}</p>
              <div className="text-4xl font-bold mb-4">
                ${billing === 'monthly' ? plan.monthly : plan.annual}<span className="text-lg font-normal">/month</span>
              </div>
              {billing === 'annual' && (
                <p className="text-sm text-green-600 mb-4">Save {calculateSavings(key)}% with annual billing</p>
              )}
              <button onClick={() => handleSelectPlan(key)} className={`btn w-full ${isPopular ? 'btn-primary' : 'btn-secondary'}`}>
                Get Started
              </button>
              <ul className="mt-6 space-y-3 text-sm">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-4 h-4 mr-2 mt-1 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-16 text-center">
        <div className="card bg-gray-50">
          <h3 className="h3 mb-3">Veterans Support</h3>
          <p className="body max-w-2xl mx-auto">Talendro is proud to offer a 20% discount to active military members and veterans. Your service to our country deserves our service to your career. Verification is handled securely at checkout.</p>
        </div>
      </div>

      <div className="mt-16 text-center">
        <h2 className="h2 mb-4">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          <details className="p-4 border rounded-lg">
            <summary className="font-medium cursor-pointer">Can I cancel anytime?</summary>
            <p className="body mt-2">Yes. You can cancel your subscription at any time from your profile. Your service will remain active until the end of your current billing period.</p>
          </details>
          <details className="p-4 border rounded-lg">
            <summary className="font-medium cursor-pointer">What if I find a job?</summary>
            <p className="body mt-2">Congratulations! You can pause or cancel your subscription. Many subscribers choose to keep their subscription active to continue monitoring the market for even better opportunities.</p>
          </details>
          <details className="p-4 border rounded-lg">
            <summary className="font-medium cursor-pointer">Is my data secure?</summary>
            <p className="body mt-2">Yes. We use enterprise-grade security and privacy-by-design principles. Your data is never sold or shared. We only use it to find and apply for jobs on your behalf.</p>
          </details>
        </div>
      </div>
    </section>
  );
}
