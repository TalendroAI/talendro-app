export default function Page(){
  return (
    <section>
      <h1 className="h1">Welcome to Talendro™</h1>
      <p className='tagline mt-2'>Precision Matches. Faster Results.</p>
      
      <div className="mt-6">
        <p className='body mb-6'>You're one step away from having Talendro™ search for jobs, tailor your resume, and apply on your behalf — 24 hours a day. We'll collect your details once so we can submit complete, optimized applications at scale.</p>
        
        <div className="space-y-6">
          <div className="card">
            <h3 className="h3 mb-4">What Happens Next</h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="w-8 h-8 bg-talBlue text-white flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                <div>
                  <h4 className="font-medium mb-1">Build Your Profile (5 minutes)</h4>
                  <p className="body text-sm">Share your experience, skills, and job preferences. This is the foundation Talendro uses to match and apply to the right roles.</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-8 h-8 bg-talBlue text-white flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                <div>
                  <h4 className="font-medium mb-1">Talendro Starts Searching</h4>
                  <p className="body text-sm">Our AI begins scanning job boards and company career pages around the clock, filtering only roles that meet your 75%+ match threshold.</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-8 h-8 bg-talBlue text-white flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                <div>
                  <h4 className="font-medium mb-1">Automated Applications Go Out</h4>
                  <p className="body text-sm">For every matched role, Talendro tailors your resume and submits a complete application — no action required from you.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">Why Professionals Choose Talendro™</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Speed-to-Apply</h4>
                <p className="body text-sm">Being among the first to apply dramatically increases your chances. Talendro applies within minutes of a job posting going live.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Quality Matches Only</h4>
                <p className="body text-sm">Our 75%+ match threshold means you're only applied to roles that genuinely fit your background — no spray-and-pray.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">AI-Tailored Resumes</h4>
                <p className="body text-sm">Every application includes a resume customized to that specific job description, improving ATS pass-through rates significantly.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Zero Ongoing Effort</h4>
                <p className="body text-sm">Set your preferences once and let Talendro handle the rest. Focus on your current role while new opportunities come to you.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100">
            <h3 className="h3 mb-4 text-center">Your Success Is Our Mission</h3>
            <p className="body text-center mb-4">Talendro doesn't just find jobs — it finds the right opportunities and gets you in front of hiring managers before the competition. Every application is strategically crafted and perfectly timed.</p>
            <div className="text-center">
              <p className="font-medium text-talBlue">Let's build your profile and get started.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className='mt-8 flex flex-wrap gap-3 justify-center'>
        <a href='/app/onboarding/step-1'><button className='btn btn-primary mr-3 text-lg py-3 px-6'>Build My Profile</button></a>
        <a href='/how-it-works'><button className='btn btn-secondary mr-3'>Learn How It Works</button></a>
      </div>
    </section>
  )
}