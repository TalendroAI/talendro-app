export default function Page(){
  return (
    <section>
      <h1 className="h1">Welcome to Talendro™</h1>
      <p className='tagline mt-2'>Precision Matches. Faster Results.</p>
      
      <div className="mt-6">
        <p className='body mb-6'>By creating your profile, you unlock our commitment to find more jobs and apply faster than anyone else. We'll ask for details once so Talendro™ can submit complete, optimized applications at scale.</p>
        
        <div className="space-y-6">
          <div className="card">
            <h3 className="h3 mb-4">What Happens Next</h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="w-8 h-8 bg-talBlue text-white flex items-center justify-center font-bold text-sm flex-shrink-0" style={{minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px'}}>1</div>
                <div>
                  <h4 className="font-medium mb-1">Profile Setup (5 minutes)</h4>
                  <p className="body text-sm">Share your experience, preferences, and career goals. We'll use this to create your personalized job search strategy.</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-8 h-8 bg-talBlue text-white flex items-center justify-center font-bold text-sm flex-shrink-0" style={{minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px'}}>2</div>
                <div>
                  <h4 className="font-medium mb-1">AI Calibration (24 hours)</h4>
                  <p className="body text-sm">Our algorithms analyze hundreds of thousands of career pages to understand your ideal opportunity profile and market positioning.</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-8 h-8 bg-talBlue text-white flex items-center justify-center font-bold text-sm flex-shrink-0" style={{minWidth: '32px', minHeight: '32px', maxWidth: '32px', maxHeight: '32px'}}>3</div>
                <div>
                  <h4 className="font-medium mb-1">Navigator Activation</h4>
                  <p className="body text-sm">Your dedicated AI agents begin real-time job discovery, résumé tailoring, and application submissions based on your criteria.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">Why Experienced Professionals Choose Talendro™</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Time-Efficient</h4>
                <p className="body text-sm">Focus on your current role while our AI handles the job search. No more evenings and weekends spent scrolling through job boards.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Quality-Focused</h4>
                <p className="body text-sm">Smart matching ensures you only see relevant, high-quality opportunities that match your experience level and career goals.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Recruiter-Built</h4>
                <p className="body text-sm">Created by recruitment industry veterans who know what hiring managers want and how to present your experience effectively.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Results-Driven</h4>
                <p className="body text-sm">Built specifically for professionals with 5+ years of experience who value precision over volume in their job search.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100">
            <h3 className="h3 mb-4 text-center">Your Success Is Our Mission</h3>
            <p className="body text-center mb-4">We don't just find jobs—we find the right opportunities that advance your career and align with your goals. Every application is strategically crafted and perfectly timed for maximum impact.</p>
            <div className="text-center">
              <p className="font-medium text-talBlue">Ready to experience the difference?</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className='mt-8 flex flex-wrap gap-3 justify-center'>
        <a href='/app/onboarding/step-1'><button className='btn btn-primary mr-3 text-lg py-3 px-6'>Upload Resume</button></a>
        <a href='/how-it-works'><button className='btn btn-secondary mr-3 text-lg py-3 px-6'>See How It Works</button></a>
      </div>
    </section>
  )
}