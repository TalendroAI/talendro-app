import React from 'react';
import { Link } from 'react-router-dom';
import CitationsFooter from '../ui/CitationsFooter'

export default function Page(){
  return (
    <section>
      <h1 className="h1">Pricing</h1>
      <p className='tagline mt-2'>Precision Matches. Faster Results.</p>
      
      <div className="mt-6">
        <p className='body mb-4'>Choose the plan that matches your job search intensity.</p>
        
        <p className='body mb-2'>
          <strong>All plans include:</strong> Real-time discovery across millions of job postings • AI-tailored resume for every application • Intelligent match scoring • <strong className="text-talBlue">Fully autonomous submission for 90% of applications</strong>
        </p>
        
        <p className='body text-gray-600 mb-6' style={{ fontSize: '0.875rem' }}>
          Our comprehensive onboarding collects 10 years of employment history, education, certifications, and references—enabling fully automated applications with zero ongoing work for 90% of positions. For the remaining 10%, the AI may ask 1-2 clarifying questions, learn from your answers, then auto-submit.
        </p>
        
        {/* Three Pricing Tiers */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16" style={{alignItems: 'stretch'}}>
          
          {/* BASIC PLAN */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200 hover:border-talAqua transition flex flex-col h-full">
            <h3 className="h3 mb-2">Basic</h3>
            <div className="mb-4">
              <span className="text-5xl font-bold text-talBlue">$29</span>
              <span className="text-gray-600">/month</span>
            </div>
            <p className="body text-gray-600 mb-6">Perfect for passive job seekers</p>
            
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}>Daily job searches (AI runs once per day)</span>
              </li>
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}>Up to 50 auto-applications/month</span>
              </li>
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}>AI-powered matching & scoring</span>
              </li>
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}>Resume auto-tailored for each job</span>
              </li>
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}>SMS + Email notifications</span>
              </li>
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}>Basic analytics dashboard</span>
              </li>
            </ul>
            
            <Link 
              to="/app/onboarding/welcome" 
              className="mt-auto block w-full py-3 px-6 bg-white text-talBlue border-2 border-talBlue rounded-lg font-semibold hover:bg-blue-50 transition text-center"
              style={{ border: 'none' }}
            >
              Get Started
            </Link>
          </div>

          {/* PRO PLAN - HIGHLIGHTED */}
          <div className="bg-white rounded-xl shadow-2xl p-8 border-2 border-talBlue transform md:scale-105 relative flex flex-col h-full">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-talBlue text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                Most Popular
              </span>
            </div>
            
            <h3 className="h3 mb-2 text-talBlue">Pro</h3>
            <div className="mb-4">
              <span className="text-5xl font-bold text-talBlue">$49</span>
              <span className="text-gray-600">/month</span>
            </div>
            <p className="body text-gray-600 mb-6">For active job seekers</p>
            
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}>Hourly job searches (AI runs 24x per day)</span>
              </li>
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}><strong>Unlimited auto-applications</strong></span>
              </li>
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}>Priority auto-apply (first to submit)</span>
              </li>
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}>Advanced AI matching algorithms</span>
              </li>
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}>Detailed analytics & insights</span>
              </li>
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}>Everything in Basic</span>
              </li>
            </ul>
            
            <Link 
              to="/app/onboarding/welcome" 
              className="mt-auto block w-full py-3 px-6 bg-talBlue text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg text-center"
              style={{ border: 'none' }}
            >
              Get Started
            </Link>
          </div>

          {/* PREMIUM PLAN */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200 hover:border-talAqua transition flex flex-col h-full">
            <h3 className="h3 mb-2">Premium</h3>
            <div className="mb-4">
              <span className="text-5xl font-bold text-talBlue">$99</span>
              <span className="text-gray-600">/month</span>
            </div>
            <p className="body text-gray-600 mb-6">Maximum results & support</p>
            
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}><strong>Real-time alerts</strong> (AI runs every 30 min)</span>
              </li>
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}><strong>Dedicated success manager</strong></span>
              </li>
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}>Interview preparation resources</span>
              </li>
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}>Salary negotiation support</span>
              </li>
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}>Priority customer support</span>
              </li>
              <li className="flex items-center">
                <span className="text-talAqua mr-3 text-xl leading-none">●</span>
                <span className="body" style={{ fontSize: '0.875rem' }}>Everything in Pro</span>
              </li>
            </ul>
            
            <Link 
              to="/app/onboarding/welcome" 
              className="mt-auto block w-full py-3 px-6 bg-white text-talBlue border-2 border-talBlue rounded-lg font-semibold hover:bg-blue-50 transition text-center"
              style={{ border: 'none' }}
            >
              Get Started
            </Link>
          </div>
        </div>
        
        {/* ROI Section */}
        <div className="max-w-5xl mx-auto py-16" style={{ marginTop: '4rem', paddingTop: '2rem' }}>
          <h2 className="h2 text-center mb-4">Why This Investment Pays for Itself</h2>
          <p className="body text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            The cost of Talendro™ is recovered in days when you land a job faster
          </p>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border-2 border-green-500 mb-12">
            <h3 className="h3 mb-3 text-center">The ROI of Speed + Tailoring</h3>
            
            <div className="grid md:grid-cols-2 gap-8" style={{ marginBottom: '0' }}>
              <div className="bg-white rounded-lg p-6">
                <h4 className="h3 mb-4" style={{ color: '#dc2626', fontSize: '1.125rem' }}>❌ Traditional Job Search:</h4>
                <ul className="space-y-2 body" style={{ fontSize: '0.875rem' }}>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Apply 1-2 weeks after posting (miss 21% interview boost)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Generic resume (miss 25% callback boost)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Compete with 100+ applicants</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Spend 11 hours/week applying manually</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>2-5 applications per week</span>
                  </li>
                </ul>
                <p className="mt-4 font-bold text-red-700 text-center">
                  Result: 3-6 month job search
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 border-2 border-green-500">
                <h4 className="h3 mb-4" style={{ color: '#16a34a', fontSize: '1.125rem' }}>✓ With Talendro™:</h4>
                <ul className="space-y-2 body" style={{ fontSize: '0.875rem' }}>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Apply within minutes (capture 21% interview boost)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Tailored resume every time (capture 25% callback boost)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Be in first 10 applicants (13% shortlist boost)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>Zero hours/week spent applying</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">✓</span>
                    <span>50-100+ applications per week</span>
                  </li>
                </ul>
                <p className="mt-4 font-bold text-green-700 text-center">
                  Result: Find job 40-60% faster
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 border-2 border-green-600" style={{ marginTop: '-1rem' }}>
              <p className="text-center">
                <strong className="text-lg">Bottom Line:</strong> If Talendro™ helps you land a job even{' '}
                <strong className="text-green-700">2 weeks faster</strong>, it pays for itself with your first paycheck. 
                Most subscribers find their next role <strong className="text-green-700">1-2 months faster</strong> than 
                traditional job searching.
              </p>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 text-center border-2 border-gray-200">
              <p className="text-4xl font-bold text-talBlue mb-2">21%</p>
              <p className="body mb-2" style={{ fontSize: '0.875rem' }}>Higher interview rate within first 96 hours</p>
              <p className="body text-gray-600" style={{ fontSize: '0.75rem' }}>TalentWorks (2018)</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center border-2 border-gray-200">
              <p className="text-4xl font-bold text-talBlue mb-2">25%</p>
              <p className="body mb-2" style={{ fontSize: '0.875rem' }}>More callbacks with tailored resumes</p>
              <p className="body text-gray-600" style={{ fontSize: '0.75rem' }}>TopResume (2020)</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center border-2 border-gray-200">
              <p className="text-4xl font-bold text-talBlue mb-2">40%</p>
              <p className="body mb-2" style={{ fontSize: '0.875rem' }}>Better ATS pass rate with tailored resumes</p>
              <p className="body text-gray-600" style={{ fontSize: '0.75rem' }}>Jobscan (2021)</p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <h3 className="h3 mb-6">Why Our Comprehensive Onboarding Matters</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="card">
              <h4 className="h3 mb-2" style={{ fontSize: '1.125rem' }}>90% Fully Autonomous</h4>
              <p className="body" style={{ fontSize: '0.875rem' }}>Our in-depth onboarding collects 10 years of employment history, education, skills, certifications, and references. This enables fully automated submission for 90% of applications—with zero ongoing work required.</p>
            </div>
            <div className="card">
              <h4 className="h3 mb-2" style={{ fontSize: '1.125rem' }}>Apply While You Sleep</h4>
              <p className="body" style={{ fontSize: '0.875rem' }}>Search millions of jobs 24/7, auto-tailor your resume for each position, and submit applications entirely hands-free. Wake up to "Applied to 47 jobs overnight."</p>
            </div>
            <div className="card">
              <h4 className="h3 mb-2" style={{ fontSize: '1.125rem' }}>Cancel Anytime</h4>
              <p className="body" style={{ fontSize: '0.875rem' }}>No contracts, no commitments. Stop or pause your subscription whenever you want.</p>
            </div>
          </div>
        </div>
        
        {/* How Automation Actually Works */}
        <div className="max-w-4xl mx-auto mb-16 bg-blue-50 rounded-xl border-2 border-talBlue" style={{ marginTop: '3rem', paddingTop: '3rem', paddingBottom: '3rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
          <h3 className="h3 text-center mb-8">How Autonomous Submission Actually Works</h3>
          
          <div className="space-y-6" style={{ marginBottom: '2rem' }}>
            {/* 90% - Fully Automated */}
            <div className="flex items-start gap-4 bg-white rounded-lg p-6">
              <div className="flex-shrink-0">
                <div className="text-4xl font-bold text-green-600">90%</div>
              </div>
              <div>
                <h4 className="h3 mb-2" style={{ fontSize: '1.125rem' }}>Fully Autonomous Submission</h4>
                <p className="body text-gray-700" style={{ fontSize: '0.875rem' }}>
                  AI searches, matches, tailors your resume, and submits applications—completely hands-free. 
                  You wake up to "Applied to 34 jobs overnight." <strong>Zero input required.</strong>
                </p>
              </div>
            </div>
            
            {/* 9% - Ask Once & Learn */}
            <div className="flex items-start gap-4 bg-white rounded-lg p-6">
              <div className="flex-shrink-0">
                <div className="text-4xl font-bold text-blue-600">9%</div>
              </div>
              <div>
                <h4 className="h3 mb-2" style={{ fontSize: '1.125rem' }}>Ask Once & Learn</h4>
                <p className="body text-gray-700" style={{ fontSize: '0.875rem' }}>
                  AI encounters a never-before-seen question. Asks you once (30 seconds), learns your answer, 
                  adds it to your profile, updates the system for all users, then completes and submits the application. 
                  <strong> After your first month, this drops to ~1%.</strong>
                </p>
              </div>
            </div>
            
            {/* 1% - Manual Required */}
            <div className="flex items-start gap-4 bg-white rounded-lg p-6">
              <div className="flex-shrink-0">
                <div className="text-4xl font-bold text-gray-600">1%</div>
              </div>
              <div>
                <h4 className="h3 mb-2" style={{ fontSize: '1.125rem' }}>Manual Steps Required</h4>
                <p className="body text-gray-700" style={{ fontSize: '0.875rem' }}>
                  Application requires video interview, complex assessment, or multi-stage process AI cannot automate. 
                  AI notifies you: "This position requires manual application." 
                  <strong> You decide if it's worth your time.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-2xl text-center" style={{ marginTop: '3rem', paddingTop: '3rem', paddingBottom: '3rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
          <h3 className="h3 mb-3">Special Offer for Veterans</h3>
          <p className="body mb-4">We provide free access to eligible veterans as part of our commitment to those who served.</p>
          <a href='/veterans'><button className='btn btn-secondary'>Learn About Veteran Benefits</button></a>
        </div>
        
        <CitationsFooter />
      </div>
    </section>
  )
}
