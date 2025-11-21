import React from 'react';

const InterviewCoachLanding = () => {
  const handleStarterCheckout = () => {
    window.location.href = 'https://buy.stripe.com/6oUcN4avtes2bdvfb9cV201';
  };

  const handleFullMockCheckout = () => {
    window.location.href = 'https://buy.stripe.com/5kQaEW1YX0Bc1CV0gfcV200';
  };

  const handlePremiumCheckout = () => {
    window.location.href = 'https://buy.stripe.com/28E3cu1YX97I4P7bYXcV202';
  };

  const scrollToPricing = (e) => {
    e.preventDefault();
    document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto" style={{ paddingTop: '3rem' }}>
          <h1 className="h1 mb-4">Talendro™ Interview Coach</h1>

          <p className="tagline text-2xl mb-6">
            Personalized, professional-grade interview preparation using your
            résumé, job description, and target company.
          </p>

          <p className="body text-lg mb-4">
            Choose the level of prep you need, pay securely, and start practicing in minutes.
          </p>

          <p className="body text-sm text-gray-600 mb-8">
            Built on Talendro&apos;s autonomous job search &amp; apply engine • 
            Optimized for mid-career &amp; senior roles
          </p>

          <button onClick={scrollToPricing} className="btn btn-primary px-8 py-3">
            View Plans &amp; Pricing
          </button>
        </div>
      </section>

      {/* Info Banner */}
      <section className="bg-talBlue py-4 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="body text-sm text-white">
            <strong>When you purchase, you&apos;ll receive an email</strong> with your 
            Interview Coach link and simple instructions: <strong>upload résumé + job 
            description + company URL</strong>, then select your plan.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-white px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="h2 mb-4">Choose your prep level</h2>
          <p className="body text-gray-600 mb-12">
            All options use your résumé, JD, and company website for tailored questions.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="card">
              <div className="text-center mb-6">
                <h3 className="h3 mb-2">Starter</h3>
                <p className="body text-sm text-gray-600 mb-4">Quick Prep Interview</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-talBlue">$12</span>
                </div>
              </div>

              <p className="body text-sm mb-6">
                A focused question set with model answers and feedback to sharpen your responses fast.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Targeted questions based on your résumé &amp; JD</span>
                </li>
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Suggested talking points and improvement tips</span>
                </li>
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Perfect for &quot;I&apos;ve got an interview tomorrow&quot; panic</span>
                </li>
              </ul>

              <button onClick={handleStarterCheckout} className="btn btn-primary w-full">
                Start Quick Prep – $12
              </button>
            </div>

            {/* Full Mock Plan */}
            <div className="card relative" style={{ border: '2px solid #2F6DF6', transform: 'scale(1.05)' }}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-talBlue text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>

              <div className="text-center mb-6 mt-4">
                <h3 className="h3 mb-2">Full Mock Interview (Text)</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-talBlue">$29</span>
                </div>
              </div>

              <p className="body text-sm mb-6">
                A realistic, text-based mock interview with pacing, coaching, and a full improvement report.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Simulated live interview in chat</span>
                </li>
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Follow-up questions, probes, and clarifiers</span>
                </li>
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Post-interview summary with strengths &amp; gaps</span>
                </li>
              </ul>

              <button onClick={handleFullMockCheckout} className="btn btn-primary w-full">
                Book Full Mock – $29
              </button>
            </div>

            {/* Premium Plan */}
            <div className="card">
              <div className="text-center mb-6">
                <h3 className="h3 mb-2">Premium</h3>
                <p className="body text-sm text-gray-600 mb-4">Premium Audio Mock Interview</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-talBlue">$49</span>
                </div>
              </div>

              <p className="body text-sm mb-6">
                A live, audio-mode mock interview with verbal questions, real-time coaching, and a comprehensive report.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Practice answering out loud under pressure</span>
                </li>
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Coaching on tone, pace, and clarity</span>
                </li>
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Final written recap you can reuse for future prep</span>
                </li>
              </ul>

              <button onClick={handlePremiumCheckout} className="btn btn-primary w-full">
                Upgrade to Premium Audio – $49
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="body text-sm text-gray-600">
              <strong>24-Hour Upgrade Credit:</strong> If you purchase Quick Prep or Full Mock 
              and upgrade within 24 hours, Talendro credits your original purchase toward the higher-level plan.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="h2 mb-4">How Talendro™ Interview Coach works</h2>
          <p className="body text-gray-600 mb-12">
            We keep it simple: pay securely, receive your access email, and start practicing 
            with a coach that already understands your background and target role.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-talBlue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
              <h3 className="h3 mb-4">Pick your prep level &amp; pay via Stripe</h3>
              <p className="body">
                Use the buttons above to choose Quick Prep, Full Mock, or Premium Audio. 
                Payments are processed securely through Stripe. You&apos;ll receive a confirmation email within minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-talBlue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
              <h3 className="h3 mb-4">Upload résumé, JD, and company URL</h3>
              <p className="body">
                Your confirmation email includes a link to Talendro™ Interview Coach and clear instructions. 
                Upload your résumé, paste the job description, and provide the company website so the coach 
                can tailor everything to your exact opportunity.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-talBlue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
              <h3 className="h3 mb-4">Run your session and review the report</h3>
              <p className="body">
                Complete your Quick Prep or Mock Interview session, then review your feedback, suggested 
                talking points, and improvement areas. Use the insights to walk into your interview clear, 
                confident, and prepared.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="h2 mb-12">FAQs &amp; quick notes</h2>

          <div className="space-y-8">
            <div className="card">
              <h3 className="h3 mb-3">How do I access the actual Interview Coach?</h3>
              <p className="body">
                After payment, Stripe notifies our system and Talendro sends you an email with your 
                unique Interview Coach link and simple &quot;how to start&quot; steps.
              </p>
            </div>

            <div className="card">
              <h3 className="h3 mb-3">Can I upgrade after I purchase?</h3>
              <p className="body">
                Yes. If you upgrade within 24 hours of your original purchase, Talendro credits 
                what you already paid toward the higher-level plan.
              </p>
            </div>

            <div className="card">
              <h3 className="h3 mb-3">What do I need ready before I start?</h3>
              <p className="body">
                Have your latest résumé, the full job description, and the target company&apos;s 
                website URL. That&apos;s all the coach needs to personalize your prep.
              </p>
            </div>

            <div className="card">
              <h3 className="h3 mb-3">Is this part of the full Talendro™ platform?</h3>
              <p className="body">
                Yes. Talendro™ Interview Coach is one product in the broader Talendro autonomous 
                job search &amp; apply suite, built to help serious job seekers move faster with more confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="h2 mb-4">Ready to ace your next interview?</h2>
          <p className="body text-lg mb-8">
            Get personalized interview prep tailored to your background and target role.
          </p>

          <button onClick={scrollToPricing} className="btn btn-primary px-8 py-3">
            Choose Your Plan
          </button>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Talendro™. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Secure payments processed by Stripe
          </p>
        </div>
      </footer>
    </div>
  );
};

export default InterviewCoachLanding;
