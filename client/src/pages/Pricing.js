import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Page() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly');

  const plans = {
    starter: {
      name: 'Starter',
      monthly: 49,
      annual: 39,
      description: 'For professionals ready to put their job search on autopilot',
      features: [
        'Automated job search every 4 hours',
        'Up to 50 applications/month',
        'ATS-optimized plain text resume',
        'Quick Prep Interview Report',
        '75%+ match threshold filtering',
        'Applications audit trail dashboard',
        'Email notifications on submission',
      ]
    },
    pro: {
      name: 'Pro',
      monthly: 99,
      annual: 79,
      description: 'For serious job seekers who want maximum reach and speed',
      features: [
        'Everything in Starter, plus:',
        'Automated job search every 60 minutes',
        'Up to 200 applications/month',
        'Professionally formatted PDF resume',
        'Full Mock Interview (AI-coached chat)',
        'Single-round salary negotiation guidance',
        'Priority application submission',
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
        'Premium Audio Mock Interview (voice)',
        'Multi-round salary negotiation support',
        'Weekly AI career strategy session',
      ]
    }
  };

  const annualSavings = (plan) => {
    return Math.round(((plan.monthly - plan.annual) / plan.monthly) * 100);
  };

  const handleSelectPlan = (planKey) => {
    navigate(`/app/checkout?plan=${planKey}&billing=${billing}`);
  };

  return (
    <section>

      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="h1">Simple, Transparent Pricing</h1>
        <p className="tagline mt-3 max-w-2xl mx-auto">
          Every plan includes ASAN — your Autonomous Search and Apply Navigator — working 24/7 to find jobs, tailor your resume, and submit applications on your behalf.
        </p>
        <p className="body text-gray-500 mt-2">No setup fees. No long-term contracts. Cancel anytime.</p>
      </div>

      {/* What every plan includes */}
      <div className="mb-12 p-6 bg-talBlue rounded-2xl text-white">
        <h2 className="text-xl font-bold text-center mb-6">Every Plan Includes</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl mb-2">🤖</div>
            <p className="text-sm font-semibold">ASAN Automation</p>
            <p className="text-xs text-blue-200 mt-1">24/7 job search & auto-apply</p>
          </div>
          <div>
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-sm font-semibold">75%+ Match Threshold</p>
            <p className="text-xs text-blue-200 mt-1">Only quality-matched jobs</p>
          </div>
          <div>
            <div className="text-3xl mb-2">📄</div>
            <p className="text-sm font-semibold">AI Resume Tailoring</p>
            <p className="text-xs text-blue-200 mt-1">Custom resume per application</p>
          </div>
          <div>
            <div className="text-3xl mb-2">📊</div>
            <p className="text-sm font-semibold">Applications Dashboard</p>
            <p className="text-xs text-blue-200 mt-1">Full audit trail of every submission</p>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              billing === 'monthly'
                ? 'bg-talBlue text-white shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              billing === 'annual'
                ? 'bg-talBlue text-white shadow'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Annual
            <span className="ml-2 text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Save ~20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6 items-stretch mb-16" style={{paddingTop: '1.25rem'}}>
        {Object.keys(plans).map((key) => {
          const plan = plans[key];
          const isPopular = plan.popular;
          const price = billing === 'monthly' ? plan.monthly : plan.annual;
          return (
            <div
              key={key}
              className={`relative flex flex-col rounded-2xl border bg-white ${
                isPopular
                  ? 'border-talBlue shadow-xl ring-2 ring-talBlue'
                  : 'border-gray-200 shadow-sm'
              }`}
              style={isPopular ? {paddingTop: '1rem'} : {}}
            >
              {isPopular && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 bg-talBlue text-white text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full whitespace-nowrap"
                  style={{top: '-0.85rem'}}
                >
                  Most Popular
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-slate-800 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                <div className="mb-1">
                  <span className="text-4xl font-extrabold text-slate-900">${price}</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                {billing === 'annual' && (
                  <p className="text-xs text-green-600 font-medium mb-4">
                    Save {annualSavings(plan)}% vs monthly — billed ${price * 12}/year
                  </p>
                )}
                {billing === 'monthly' && <div className="mb-4" />}

                <button
                  onClick={() => handleSelectPlan(key)}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all mb-6 ${
                    isPopular
                      ? 'bg-talBlue text-white hover:bg-blue-700'
                      : 'bg-white text-talBlue border-2 border-talBlue hover:bg-blue-50'
                  }`}
                >
                  Get Started with {plan.name}
                </button>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      {i === 0 && key !== 'starter' ? (
                        <span className="text-gray-400 font-medium mt-0.5 flex-shrink-0">—</span>
                      ) : (
                        <svg className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={i === 0 && key !== 'starter' ? 'text-gray-400 italic' : 'text-slate-700'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="mb-16">
        <h2 className="h2 text-center mb-8">Compare Plans</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 pr-4 font-semibold text-gray-700 w-1/2">Feature</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Starter</th>
                <th className="text-center py-3 px-4 font-semibold text-talBlue bg-blue-50 rounded-t-lg">Pro</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Concierge</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Monthly price', '$49', '$99', '$249'],
                ['Annual price', '$39/mo', '$79/mo', '$199/mo'],
                ['Job search frequency', 'Every 4 hours', 'Every 60 min', 'Every 30 min'],
                ['Applications per month', '50', '200', 'Unlimited'],
                ['Resume format', 'Plain text (ATS)', 'Plain text + PDF', 'Plain text + PDF + LinkedIn'],
                ['Resume tailoring per job', '✓', '✓', '✓'],
                ['Match threshold filtering', '75%+', '75%+', '75%+'],
                ['Applications dashboard', '✓', '✓', '✓'],
                ['Email notifications', '✓', '✓', '✓'],
                ['Interview prep', 'Quick Prep report', 'Full Mock (AI chat)', 'Premium Audio Mock (voice)'],
                ['Salary negotiation', '—', 'Single-round guidance', 'Multi-round full analysis'],
                ['LinkedIn optimization', '—', '—', '✓'],
                ['Weekly AI strategy session', '—', '—', '✓'],
              ].map(([feature, starter, pro, concierge], i) => (
                <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-3 pr-4 text-gray-700 font-medium">{feature}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{starter}</td>
                  <td className="py-3 px-4 text-center text-gray-800 font-medium bg-blue-50">{pro}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{concierge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Veterans Section */}
      <div className="mb-16 card bg-gradient-to-br from-blue-50 to-white border border-blue-100">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🇺🇸</div>
          <div>
            <h3 className="h3 mb-2">Veterans &amp; Active Military — 20% Off</h3>
            <p className="body">Talendro is proud to offer a 20% discount on all plans to active military members and veterans. Your service to our country deserves our service to your career. Verification is handled securely at checkout using your DD-214 or other proof of service.</p>
            <a href="/veterans" className="inline-block mt-3 text-sm font-medium text-talBlue hover:underline">Learn more about our veterans program →</a>
          </div>
        </div>
      </div>

      {/* How It Works Summary */}
      <div className="mb-16">
        <h2 className="h2 text-center mb-8">How ASAN Works for You</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="text-4xl mb-3">1️⃣</div>
            <h4 className="font-bold text-lg mb-2">You Set Your Criteria Once</h4>
            <p className="body text-sm">Complete a 10-minute onboarding profile — target titles, location, work arrangement, seniority, skills. That's it. You never have to do this again.</p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-3">2️⃣</div>
            <h4 className="font-bold text-lg mb-2">ASAN Searches &amp; Applies 24/7</h4>
            <p className="body text-sm">ASAN scans employer ATS systems continuously, scores every job against your profile, tailors your resume for each match, and submits the application — automatically.</p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-3">3️⃣</div>
            <h4 className="font-bold text-lg mb-2">You Prepare for Interviews</h4>
            <p className="body text-sm">You receive email notifications after each application is submitted. Check your dashboard for the full audit trail. Your only job is to be ready when employers call.</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-16">
        <h2 className="h2 text-center mb-8">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-3">
          {[
            {
              q: 'Do I have to approve each application before it goes out?',
              a: 'No — and that\'s the point. ASAN applies fully automatically on your behalf. You set your criteria once during onboarding, and ASAN handles everything. You are notified after each application is submitted, not before. This is what "we apply while you sleep" means.'
            },
            {
              q: 'What happens if ASAN encounters a question it can\'t answer from my profile?',
              a: 'ASAN will pause on that specific application and notify you of the missing information. Once you provide it, ASAN learns and handles that question autonomously for all future applications. This is rare — our onboarding is designed to capture everything upfront.'
            },
            {
              q: 'Can I cancel anytime?',
              a: 'Yes. Cancel anytime from your account settings. Your service remains active until the end of your current billing period. No cancellation fees, no commitments.'
            },
            {
              q: 'What ATS systems does ASAN cover?',
              a: 'ASAN currently covers Greenhouse, Lever, and thousands of additional employers via our job discovery integrations. We are continuously expanding coverage. The goal is comprehensive coverage of all major ATS platforms.'
            },
            {
              q: 'What is the 75% match threshold?',
              a: 'ASAN scores every job against your profile using 7 factors: job title alignment, seniority level, work arrangement (remote/hybrid/onsite), employment type, required skills, location, and posting recency. Only jobs scoring 75% or higher are applied to. This ensures quality over quantity — you won\'t be applied to jobs you\'re clearly not a fit for.'
            },
            {
              q: 'Is my data secure?',
              a: 'Yes. We use enterprise-grade encryption, strict access controls, and privacy-by-design principles. Your data is never sold or shared. We only use it to find and apply for jobs on your behalf.'
            },
            {
              q: 'Can I switch plans?',
              a: 'Yes. You can upgrade or downgrade your plan at any time from your billing settings. Changes take effect at the start of your next billing cycle.'
            },
          ].map((item, i) => (
            <details key={i} className="p-5 border border-gray-200 rounded-xl bg-white group">
              <summary className="font-semibold text-slate-800 cursor-pointer list-none flex items-center justify-between">
                {item.q}
                <span className="text-talBlue ml-4 flex-shrink-0 text-lg group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="body mt-3 text-gray-600">{item.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center p-10 bg-gradient-to-br from-talBlue to-blue-700 rounded-2xl text-white">
        <h2 className="text-3xl font-bold mb-3">Ready to Let ASAN Work for You?</h2>
        <p className="text-blue-100 mb-6 max-w-xl mx-auto">Set your criteria once. Wake up to applications already submitted. Your job search runs itself — starting today.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={() => handleSelectPlan('pro')} className="bg-white text-talBlue font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors">
            Start with Pro — $99/month
          </button>
          <button onClick={() => handleSelectPlan('starter')} className="bg-transparent text-white border-2 border-white font-semibold px-8 py-3 rounded-xl hover:bg-white hover:text-talBlue transition-colors">
            Try Starter — $49/month
          </button>
        </div>
        <p className="text-blue-200 text-sm mt-4">No contracts. Cancel anytime. Veterans save 20%.</p>
      </div>

    </section>
  );
}
