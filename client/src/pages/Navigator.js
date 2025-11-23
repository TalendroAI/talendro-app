import CitationsFooter from '../ui/CitationsFooter'

export default function Page(){
  return (
    <section>
      <h1 className="h1">Talendro™ Navigator</h1>
      
      <div className="mt-6">
        <p className='tagline mb-4'>Fully autonomous job search AI that works 24/7 on your behalf.</p>
        
        <p className='body mb-2'>
          Search millions of jobs • AI-tailored resume for every application • Intelligent match scoring • <strong className="text-talBlue">Autonomous submission for 90% of applications</strong> • Comprehensive analytics
        </p>
        
        <p className='body text-sm text-gray-600 mb-6'>
          Our extensive onboarding enables fully automated submission with zero ongoing work for 90% of positions. Choose from three plans based on your job search intensity.
        </p>
        
        {/* Autonomous AI Callout */}
        <div className="mb-12 bg-talBlue text-white rounded-xl p-8">
          <div className="flex items-start gap-4">
            <div className="text-5xl">🤖</div>
            <div>
              <h2 className="h2 text-white mb-4">True Autonomous AI Agent</h2>
              <p className="body text-white mb-4">
                This isn't a tool that "helps" you apply faster. This is an AI agent that 
                <strong> applies for you</strong>—completely autonomously, 24/7, while you sleep.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-cyan-200 mr-3 text-2xl flex-shrink-0">✓</span>
                  <span className="text-white body">
                    <strong>Set it and forget it:</strong> Complete onboarding once (10-25 minutes), 
                    then the AI works independently forever
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-200 mr-3 text-2xl flex-shrink-0">✓</span>
                  <span className="text-white body">
                    <strong>Zero ongoing work:</strong> No reviewing matches, no clicking apply, 
                    no manual effort required
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-200 mr-3 text-2xl flex-shrink-0">✓</span>
                  <span className="text-white body">
                    <strong>Wake up to results:</strong> Check your dashboard frequently to see the 
                    applications submitted while you worked, slept, and played
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-200 mr-3 text-2xl flex-shrink-0">✓</span>
                  <span className="text-white body">
                    <strong>Self-learning technology:</strong> When AI encounters a new question 
                    (rare), it asks once, learns, and handles it autonomously forever
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="card">
            <h3 className="h3 mb-3">🔍 Real-Time Job Discovery</h3>
            <p className="body">Advanced AI agents monitor hundreds of thousands of job boards, company websites, and professional networks 24/7. Never miss an opportunity that matches your profile and preferences.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">📄 AI-Powered Résumé Tailoring</h3>
            <p className="body">Each application gets a customized résumé optimized for the specific role. Our AI analyzes job descriptions and highlights your most relevant experience and skills.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">🎯 Smart Match Scoring</h3>
            <p className="body">Intelligent algorithms score every opportunity based on your experience, preferences, and career goals. Focus your energy on the best-fit positions.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">⚡ One-Click Applications</h3>
            <p className="body">Submit applications instantly or set up auto-apply for pre-approved criteria. Perfect timing ensures your application is seen by hiring managers.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">📊 Personalized Alerts & Tracking</h3>
            <p className="body">Get notified about new opportunities and application status updates. Comprehensive analytics help you optimize your job search strategy.</p>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
          <h3 className="h3 mb-3">Why Choose Navigator?</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="body font-medium mb-2">For Experienced Professionals</p>
              <p className="body text-sm">Designed specifically for mid-to-late career professionals who value their time and want premium results.</p>
            </div>
            <div>
              <p className="body font-medium mb-2">Flexible Pricing Plans</p>
              <p className="body text-sm">Choose Basic ($29), Pro ($49), or Premium ($99) based on your job search intensity. 
                All plans include autonomous submission and self-learning AI.</p>
            </div>
            <div>
              <p className="body font-medium mb-2">Proven Results</p>
              <p className="body text-sm">Built by recruitment industry veterans with 20+ years of experience placing top talent.</p>
            </div>
            <div>
              <p className="body font-medium mb-2">Complete Automation</p>
              <p className="body text-sm">Set it up once, then let our AI work around the clock to advance your career.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Competitive Advantages Section */}
      <div className="max-w-6xl mx-auto py-16 px-4">
        <h2 className="h2 text-center mb-4">Your Competitive Advantages</h2>
        <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
          Research-proven strategies built into every application
        </p>
        
        {/* Advantage 1: Speed */}
        <div className="mb-12 p-8 bg-blue-50 rounded-xl border-2 border-talBlue">
          <h3 className="h3 mb-4 flex items-center gap-3">
            <span className="text-3xl">🏃</span>
            Advantage #1: Apply Before the Competition
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold mb-3 text-lg">The Research:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>First 10 applicants are <strong>13% more likely to be shortlisted</strong> (The Ladders, 2019)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>First 96 hours = <strong>21% higher interview rate</strong> (TalentWorks, 2018)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>60% of recruiters</strong> start reviewing within first week (Jobvite, 2020)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>44% contact top candidates within 3 days</strong> (ZipRecruiter, 2021)</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-lg">How Talendro™ Wins:</h4>
              <p className="text-sm mb-3">
                Our AI monitors job postings in real-time and applies <strong>within minutes</strong> 
                of a position going live—often before it even appears on major job boards.
              </p>
              <div className="bg-white rounded-lg p-4 border-2 border-talBlue">
                <p className="text-sm font-bold text-talBlue">
                  You're not just early. You're FIRST.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Advantage 2: Tailoring */}
        <div className="mb-12 p-8 bg-green-50 rounded-xl border-2 border-green-500">
          <h3 className="h3 mb-4 flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            Advantage #2: Perfect Resume Every Time
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold mb-3 text-lg">The Research:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Tailored resumes = <strong>25% more callbacks</strong> (TopResume, 2020)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>40% better ATS pass rate</strong> (Jobscan, 2021)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>63% of hiring managers</strong> prefer keyword-matched resumes (CareerBuilder, 2020)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>79% of recruiters</strong> prefer job-specific achievements (ResumeLab, 2022)</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-lg">How Talendro™ Wins:</h4>
              <p className="text-sm mb-3">
                Our AI analyzes each job description and creates a custom-tailored resume highlighting 
                your most relevant experience, skills, and achievements—optimized for both ATS and human reviewers.
              </p>
              <div className="bg-white rounded-lg p-4 border-2 border-green-500">
                <p className="text-sm font-bold text-green-700">
                  Every application gets a perfectly tailored resume. Automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Advantage 3: Volume */}
        <div className="p-8 bg-purple-50 rounded-xl border-2 border-purple-500">
          <h3 className="h3 mb-4 flex items-center gap-3">
            <span className="text-3xl">📊</span>
            Advantage #3: Play the Numbers Game (The Right Way)
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold mb-3 text-lg">The Research:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Recruiters spend <strong>6-8 seconds</strong> per resume (SHRM, 2018)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Average job posting gets <strong>250 applications</strong> (Glassdoor)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span><strong>50% of applications</strong> arrive in first week (Indeed, 2020)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Average job search takes <strong>3-6 months</strong> (LinkedIn)</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-lg">How Talendro™ Wins:</h4>
              <p className="text-sm mb-3">
                While maintaining quality (75%+ match threshold + tailored resumes), our AI applies to 
                <strong> 50-100+ positions per week</strong> on your behalf. More at-bats = more chances to win.
              </p>
              <div className="bg-white rounded-lg p-4 border-2 border-purple-500">
                <p className="text-sm font-bold text-purple-700">
                  Quantity AND quality. Automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className='mt-8 flex flex-wrap gap-3'>
        <a href='/app/onboarding/welcome'><button className='btn btn-primary mr-3'>Get Started</button></a>
        <a href='/pricing'><button className='btn btn-secondary mr-3'>View Pricing</button></a>
      </div>
      
      <CitationsFooter />
    </section>
  )
}
