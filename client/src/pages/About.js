export default function Page(){
  return (
    <section>
      <h1 className="h1">About Talendro™</h1>
      <p className='tagline mt-2'>Your job search, automated on steroids.</p>
      
      <div className="mt-6">
        <p className='body mb-6'>We exist to level the playing field for every job seeker in America — regardless of where you are in your career, what industry you work in, or what kind of work you do.</p>
        
        <div className="space-y-8">
          <div className="card">
            <h3 className="h3 mb-4">Our Mission</h3>
            <p className="body mb-4">To transform the job search experience for every American worker by leveraging AI technology to deliver precision matches and faster results. We believe that your skills and experience deserve great opportunities — and we're here to make that connection happen automatically.</p>
            <p className="body">The traditional job search is broken for everyone. The process is the same no matter who you are or what you do: time-consuming, inconsistent, and stacked against you. Talendro™ changes that equation entirely.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">Why We Exist</h3>
            <p className="body mb-4">Under- and unemployment no longer discriminates. It impacts the entire US workforce across every industry, occupation, and pay grade. Every worker faces the same broken system:</p>
            <div className="ml-6 space-y-2">
              <p className="body"><span className="text-talAqua mr-3">●</span>Job boards that bury your application under thousands of others</p>
              <p className="body"><span className="text-talAqua mr-3">●</span>ATS systems that filter out qualified candidates before a human ever sees them</p>
              <p className="body"><span className="text-talAqua mr-3">●</span>Time constraints — whether from current work, family, or financial pressure</p>
              <p className="body"><span className="text-talAqua mr-3">●</span>Rapidly changing application requirements, keywords, and hiring practices</p>
              <p className="body"><span className="text-talAqua mr-3">●</span>The sheer volume of applications required to land a single interview</p>
            </div>
            <p className="body mt-4">Talendro™ flips the script with real-time discovery across thousands of employer career sites, AI-tailored résumés, and perfectly timed applications — giving every worker the competitive edge they deserve.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">Our Commitment</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">To Veterans</h4>
                <p className="body text-sm">A 20% discount for active military and veterans, priority onboarding, and specialized transition resources. Your service to our country deserves our service to your career.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">To Privacy</h4>
                <p className="body text-sm">Your data is never sold or shared. We use enterprise-grade security and privacy-by-design principles to protect your information.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">To Transparency</h4>
                <p className="body text-sm">Three clear tiers, no hidden fees. Every tier delivers the core promise — ASAN working on your behalf. Higher tiers unlock faster search frequency, more applications, deeper resume optimization, and advanced interview and negotiation support. Cancel anytime.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">To Results</h4>
                <p className="body text-sm">Built by recruitment industry veterans who understand what it takes to get noticed, get interviews, and get offers — at every level of the workforce.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className='mt-8 flex flex-wrap gap-3'>
        <a href='/about/our-story'><button className='btn btn-primary mr-3'>Read Our Story</button></a>
        <a href='/pricing'><button className='btn btn-secondary mr-3'>Get Started</button></a>
      </div>
    </section>
  )
}
