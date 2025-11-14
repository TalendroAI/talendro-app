export default function Page(){
  return (
    <section>
      <h1 className="h1">Services</h1>
      <p className='tagline mt-2'>Precision Matches. Faster Results.</p>
      
      <div className="mt-6">
        <p className='body mb-6'>Two paths. One mission: get you hired faster.</p>
        
        <div className="grid gap-8 md:grid-cols-2">
          <div className="card border-2 border-talBlue bg-gradient-to-br from-blue-50 to-white">
            <h3 className="h2 text-talBlue mb-4">Talendro™ Navigator</h3>
            <p className="body mb-6">Fully autonomous job search platform. Choose from three plans designed for different job search timelines and needs.</p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center">
                <span className="text-talAqua mr-3">●</span>
                <span className="body">Real-time job discovery</span>
              </div>
              <div className="flex items-center">
                <span className="text-talAqua mr-3">●</span>
                <span className="body">AI-powered résumé tailoring</span>
              </div>
              <div className="flex items-center">
                <span className="text-talAqua mr-3">●</span>
                <span className="body">Smart match scoring</span>
              </div>
              <div className="flex items-center">
                <span className="text-talAqua mr-3">●</span>
                <span className="body">One-click applications</span>
              </div>
              <div className="flex items-center">
                <span className="text-talAqua mr-3">●</span>
                <span className="body">Analytics & tracking</span>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="h3 mb-4">Starting at $29/month</p>
              <div className="bg-blue-50 rounded-lg p-4 border border-talBlue">
                <p className="body text-sm mb-3"><strong>Three plans to fit your needs:</strong></p>
                <ul className="space-y-2">
                  <li className="body text-sm flex items-start">
                    <span className="text-talAqua mr-3">●</span>
                    <span><strong>Basic ($29/mo):</strong> Daily searches, 50 applications/month</span>
                  </li>
                  <li className="body text-sm flex items-start">
                    <span className="text-talAqua mr-3">●</span>
                    <span><strong>Pro ($49/mo):</strong> Hourly searches, unlimited applications</span>
                  </li>
                  <li className="body text-sm flex items-start">
                    <span className="text-talAqua mr-3">●</span>
                    <span><strong>Premium ($99/mo):</strong> Real-time alerts every 30 min, dedicated support</span>
                  </li>
                </ul>
              </div>
            </div>
            <a href='/services/navigator'><button className='btn btn-primary w-full'>Explore Navigator</button></a>
          </div>
          
          <div className="card">
            <h3 className="h2 text-talSlate mb-4">Optional AI Services</h3>
            <p className="body mb-6">Targeted tools to enhance your job search when you need extra lift. Add-ons available to Navigator subscribers.</p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center">
                <span className="text-talLime mr-3">●</span>
                <span className="body">Interview Coach</span>
              </div>
              <div className="flex items-center">
                <span className="text-talLime mr-3">●</span>
                <span className="body">Transition & First 100 Days</span>
              </div>
              <div className="flex items-center">
                <span className="text-talLime mr-3">●</span>
                <span className="body">Career Branding Suite</span>
              </div>
              <div className="flex items-center">
                <span className="text-talLime mr-3">●</span>
                <span className="body">Concierge Services</span>
              </div>
              <div className="flex items-center">
                <span className="text-talLime mr-3">●</span>
                <span className="body">Networking (Coming Soon)</span>
              </div>
            </div>
            
            <p className="text-lg font-medium text-talGray mb-4">Available as add-ons</p>
            <a href='/services/optional'><button className='btn btn-secondary w-full'>Explore Add-Ons</button></a>
          </div>
        </div>
        
        <div className="mt-12 text-center card">
          <h3 className="h3 mb-4">Why Choose Talendro™?</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium mb-2">For Experienced Professionals</h4>
              <p className="body text-sm">Designed specifically for mid-to-late career professionals who value premium results and their time.</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Proven by Recruiters</h4>
              <p className="body text-sm">Built by recruitment industry veterans with 20+ years of experience placing top talent.</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">True Autonomous AI</h4>
              <p className="body text-sm">Our comprehensive onboarding—collecting 10 years of work history, education, certifications, and references—enables 
                <strong> autonomous submission for 90% of applications</strong>. Set it up once, then the AI works 24/7 on your behalf 
                with zero ongoing effort required. Wake up to "Applied to 47 jobs overnight."</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className='mt-8 flex flex-wrap gap-3'>
        <a href='/app/onboarding/welcome'><button className='btn btn-primary mr-3'>Get Started</button></a>
        <a href='/pricing'><button className='btn btn-secondary mr-3'>View Pricing</button></a>
      </div>
    </section>
  )
}
