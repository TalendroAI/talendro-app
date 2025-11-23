import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
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
            {/* Benefit 1 */}
            <div className="bg-white rounded-xl p-4 shadow-md -mr-8">
              <div className="flex items-center gap-3">
                <div className="text-2xl flex-shrink-0">⏰</div>
                <h3 className="h3 mb-0">
                  Time-Efficient & Fully Autonomous
                </h3>
              </div>
              <p className="body mt-2 ml-[2.75rem] text-sm">
                Focus on your current role while our AI handles your entire job search. 
                Zero hours per week required after initial 10-25 minute setup.
              </p>
            </div>
            
            {/* Benefit 2 */}
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="text-2xl flex-shrink-0">🎯</div>
                <h3 className="h3 mb-0">
                  Quality Over Quantity
                </h3>
              </div>
              <p className="body mt-2 ml-[2.75rem] text-sm">
                Smart 75%+ match threshold ensures you only apply to roles where 
                you're a strong fit. No spray-and-pray approach.
              </p>
            </div>
            
            {/* Benefit 3 */}
            <div className="bg-white rounded-xl p-4 shadow-md -mr-8">
              <div className="flex items-center gap-3">
                <div className="text-2xl flex-shrink-0">💼</div>
                <h3 className="h3 mb-0">
                  Built for Experienced Professionals
                </h3>
              </div>
              <p className="body mt-2 ml-[2.75rem] text-sm">
                Designed specifically for professionals with 5+ years of experience. 
                Our AI understands senior-level job markets and requirements.
              </p>
            </div>
            
            {/* Benefit 4 */}
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="text-2xl flex-shrink-0">🏆</div>
                <h3 className="h3 mb-0">
                  Recruiter-Built Technology
                </h3>
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
      
      {/* Final CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="h2 mb-4">
            Ready to Transform Your Job Search?
          </h2>
          <p className="body mb-8">
            Join experienced professionals who've automated their way to better opportunities.
          </p>
          
          {/* Two CTA Buttons Only */}
          <div className="flex gap-4 justify-center mb-6">
            <Link to="/app/onboarding/welcome">
              <button className="btn btn-primary">
                Get Started
              </button>
            </Link>
            <Link to="/pricing">
              <button className="btn btn-secondary">
                View Pricing
              </button>
            </Link>
          </div>
          
          <p className="body text-sm">
            No credit card required to explore. Cancel anytime.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
