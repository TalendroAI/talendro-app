import React from 'react';
import { Link } from 'react-router-dom';

const InterviewCoach = () => {
  return (
    <div className="min-h-screen -mx-4 -my-10">
      {/* Hero Section */}
      <section className="bg-gray-50 pt-12 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="h1 mb-4" style={{ fontSize: '3.5rem', lineHeight: '1.1' }}>
            Talendro™ Interview Coach
          </h1>
          
          <p className="tagline text-2xl mb-6">
            Personalized, professional-grade interview preparation using your résumé, job description, and target company.
          </p>
          
          <p className="body text-lg text-gray-700 mb-4">
            Choose the level of prep you need, pay securely, and start practicing in minutes.
          </p>
          
          <p className="body text-sm text-gray-600 mb-8">
            Built on Talendro's autonomous job search & apply engine • Optimized for mid-career & senior roles
          </p>
          
          <div className="flex gap-4 mb-8">
            <Link to="#pricing">
              <button className="btn btn-primary px-8 py-3 text-base">
                View Plans & Pricing
              </button>
            </Link>
            <Link to="/how-it-works">
              <button className="btn btn-secondary px-8 py-3 text-base">
                See How It Works
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Info Banner */}
      <section className="bg-talBlue py-4 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="body text-sm" style={{ color: '#ffffff' }}>
            <strong style={{ color: '#ffffff' }}>When you purchase, you'll receive an email</strong> with your Interview Coach link and simple instructions: 
            <strong style={{ color: '#ffffff' }}> upload résumé + job description + company URL</strong>, then select your plan.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-white px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="h2 text-center mb-4">
            Choose your prep level
          </h2>
          <p className="body text-center text-gray-600 mb-12 max-w-3xl mx-auto">
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
              
              <p className="body text-sm text-gray-700 mb-6">
                A focused question set with model answers and feedback to sharpen your responses fast.
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Targeted questions based on your résumé & JD</span>
                </li>
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Suggested talking points and improvement tips</span>
                </li>
                <li className="flex items-start">
                  <span className="text-talAqua mr-3">●</span>
                  <span className="body text-sm">Perfect for "I've got an interview tomorrow" panic</span>
                </li>
              </ul>
              
              <button className="btn btn-primary w-full">
                Start Quick Prep – $12
              </button>
            </div>

            {/* Full Mock Plan - Most Popular */}
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
              
              <p className="body text-sm text-gray-700 mb-6">
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
                  <span className="body text-sm">Post-interview summary with strengths & gaps</span>
                </li>
              </ul>
              
              <button className="btn btn-primary w-full">
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
              
              <p className="body text-sm text-gray-700 mb-6">
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
              
              <button className="btn btn-primary w-full">
                Upgrade to Premium Audio – $49
              </button>
            </div>
          </div>

          {/* Upgrade Credit Notice */}
          <div className="mt-8 text-center">
            <p className="body text-sm text-gray-600">
              <strong>24-Hour Upgrade Credit:</strong> If you purchase Quick Prep or Full Mock and upgrade within 24 hours, 
              Talendro credits your original purchase toward the higher-level plan.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="h2 text-center mb-4">
            How Talendro™ Interview Coach works
          </h2>
          <p className="body text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            We keep it simple: pay securely, receive your access email, and start practicing with a coach that already understands your background and target role.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-talBlue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="h3 mb-4">
                Pick your prep level & pay via Stripe
              </h3>
              <p className="body text-gray-700">
                Use the buttons above to choose Quick Prep, Full Mock, or Premium Audio. Payments are processed securely through Stripe. 
                You'll receive a confirmation email within minutes.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-talBlue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="h3 mb-4">
                Upload résumé, JD, and company URL
              </h3>
              <p className="body text-gray-700">
                Your confirmation email includes a link to Talendro™ Interview Coach and clear instructions. Upload your résumé, 
                paste the job description, and provide the company website so the coach can tailor everything to your exact opportunity.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-talBlue text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="h3 mb-4">
                Run your session and review the report
              </h3>
              <p className="body text-gray-700">
                Complete your Quick Prep or Mock Interview session, then review your feedback, suggested talking points, 
                and improvement areas. Use the insights to walk into your interview clear, confident, and prepared.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="h2 text-center mb-12">
            FAQs & quick notes
          </h2>
          
          <div className="space-y-8">
            <div className="card">
              <h3 className="h3 mb-3">
                How do I access the actual Interview Coach?
              </h3>
              <p className="body text-gray-700">
                After payment, Stripe notifies our system and Talendro sends you an email with your unique Interview Coach link 
                and simple "how to start" steps.
              </p>
            </div>
            
            <div className="card">
              <h3 className="h3 mb-3">
                Can I upgrade after I purchase?
              </h3>
              <p className="body text-gray-700">
                Yes. If you upgrade within 24 hours of your original purchase, Talendro credits what you already paid toward 
                the higher-level plan.
              </p>
            </div>
            
            <div className="card">
              <h3 className="h3 mb-3">
                What do I need ready before I start?
              </h3>
              <p className="body text-gray-700">
                Have your latest résumé, the full job description, and the target company's website URL. That's all the coach 
                needs to personalize your prep.
              </p>
            </div>
            
            <div className="card">
              <h3 className="h3 mb-3">
                Is this part of the full Talendro™ platform?
              </h3>
              <p className="body text-gray-700">
                Yes. Talendro™ Interview Coach is one product in the broader Talendro autonomous job search & apply suite, 
                built to help serious job seekers move faster with more confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="h2 mb-4">
            Ready to ace your next interview?
          </h2>
          <p className="body text-lg text-gray-700 mb-8">
            Get personalized interview prep tailored to your background and target role.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link to="#pricing">
              <button className="btn btn-primary px-8 py-3 text-base">
                Choose Your Plan
              </button>
            </Link>
            <Link to="/how-it-works">
              <button className="btn btn-secondary px-8 py-3 text-base">
                Learn More
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InterviewCoach;

