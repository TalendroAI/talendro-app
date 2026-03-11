import React from 'react';

const InterviewCoachLanding = () => {
  const handleSelectPlan = (plan) => {
    window.location.href = `/app/checkout?plan=${plan}`;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto" style={{ paddingTop: '3rem' }}>
          <h1 className="h1 mb-4">Talendro™ Interview Coach</h1>
          <p className="tagline text-2xl mb-6">
            Personalized, professional-grade interview preparation — included with every Talendro subscription.
          </p>
          <p className="body text-lg mb-4">
            Interview coaching is built into your plan. Subscribe today and start practicing in minutes.
          </p>
          <button onClick={() => handleSelectPlan('pro')} className="btn btn-primary px-8 py-3">
            View Plans &amp; Get Started
          </button>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-white px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="h2 mb-4">Interview coaching by plan</h2>
          <p className="body text-gray-600 mb-12 max-w-3xl">
            Every plan includes interview preparation tailored to your résumé, the job description, and the target company.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="card">
              <div className="text-center mb-6">
                <h3 className="h3 mb-2">Starter</h3>
                <p className="body text-sm text-gray-600 mb-4">Quick Prep</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-talBlue">$39</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Targeted questions based on your résumé &amp; job description</span>
                </li>
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Suggested talking points and improvement tips</span>
                </li>
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Company brief and role context</span>
                </li>
              </ul>
              <button className="btn btn-primary w-full" onClick={() => handleSelectPlan('starter')}>
                Get Starter — $39/mo
              </button>
            </div>

            {/* Pro */}
            <div className="card relative border-2 border-talBlue scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-talBlue text-white px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
              </div>
              <div className="text-center mb-6 mt-4">
                <h3 className="h3 mb-2">Pro</h3>
                <p className="body text-sm text-gray-600 mb-4">Full Mock Interview (text)</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-talBlue">$99</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Simulated live interview in real-time chat</span>
                </li>
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Follow-up questions, probes, and clarifiers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Post-interview performance analysis</span>
                </li>
              </ul>
              <button className="btn btn-primary w-full" onClick={() => handleSelectPlan('pro')}>
                Get Pro — $99/mo
              </button>
            </div>

            {/* Concierge */}
            <div className="card">
              <div className="text-center mb-6">
                <h3 className="h3 mb-2">Concierge</h3>
                <p className="body text-sm text-gray-600 mb-4">Audio Mock Interview (voice)</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-talBlue">$249</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Live voice mock interview — practice out loud under pressure</span>
                </li>
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Real-time coaching on tone, pace, and clarity</span>
                </li>
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Full written debrief and improvement plan</span>
                </li>
              </ul>
              <button className="btn btn-primary w-full" onClick={() => handleSelectPlan('concierge')}>
                Get Concierge — $249/mo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="h2 mb-4">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-talBlue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
              <h3 className="h3 mb-4">Subscribe to any plan</h3>
              <p className="body text-gray-700">Interview coaching is included — no add-ons, no extra charges.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-talBlue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
              <h3 className="h3 mb-4">Complete onboarding</h3>
              <p className="body text-gray-700">Upload your résumé and target role details. Talendro personalizes every coaching session to your exact opportunity.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-talBlue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
              <h3 className="h3 mb-4">Access coaching from your dashboard</h3>
              <p className="body text-gray-700">Launch prep sessions anytime. Review feedback, talking points, and improvement areas before every interview.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="h2 mb-4">Ready to ace your next interview?</h2>
          <p className="body text-lg text-gray-700 mb-8">
            Subscribe today and get interview coaching, automated job search, and resume optimization — all in one platform.
          </p>
          <button className="btn btn-primary px-8 py-3 text-base" onClick={() => handleSelectPlan('pro')}>
            Choose Your Plan
          </button>
        </div>
      </section>
    </div>
  );
};

export default InterviewCoachLanding;
