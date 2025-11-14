export default function Page(){
  return (
    <section>
      <h1 className="h1">About Talendro™</h1>
      <p className='tagline mt-2'>Precision Matches. Faster Results.</p>
      
      <div className="mt-6">
        <p className='body mb-6'>We exist to level the playing field for experienced professionals.</p>
        
        <div className="space-y-8">
          <div className="card">
            <h3 className="h3 mb-4">Our Mission</h3>
            <p className="body mb-4">To transform the job search experience for mid-to-late career professionals by leveraging AI technology to deliver precision matches and faster results. We believe that great experience deserves great opportunities, and we're here to make that connection happen automatically.</p>
            <p className="body">The traditional job search is broken for experienced professionals. Companies want your expertise, but finding those opportunities requires countless hours of searching, tailoring applications, and perfect timing. Talendro™ changes that equation entirely.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">Why We Exist</h3>
            <p className="body mb-4">The job search is stacked against experienced professionals. Despite having valuable skills and proven track records, seasoned professionals face unique challenges:</p>
            <div className="ml-6 space-y-2">
              <p className="body"><span className="text-talAqua mr-3">●</span>Age bias in hiring processes</p>
              <p className="body"><span className="text-talAqua mr-3">●</span>Oversaturated job boards designed for entry-level roles</p>
              <p className="body"><span className="text-talAqua mr-3">●</span>Time constraints from current responsibilities</p>
              <p className="body"><span className="text-talAqua mr-3">●</span>Rapidly changing application requirements and keywords</p>
              <p className="body"><span className="text-talAqua mr-3">●</span>The need for personalized approaches for senior-level positions</p>
            </div>
            <p className="body mt-4">Talendro™ flips the script with real-time discovery, AI-tailored résumés, and perfectly timed applications that give you the competitive edge you deserve.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">Our Commitment</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">To Veterans</h4>
                <p className="body text-sm">Free access for eligible veterans, priority onboarding, and specialized transition resources. Your service to our country deserves our service to your career.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">To Privacy</h4>
                <p className="body text-sm">Your data is never sold or shared. We use enterprise-grade security and privacy-by-design principles to protect your information.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">To Transparency</h4>
                <p className="body text-sm">One simple price, no hidden fees, no tier limitations. What you see is what you get, with the ability to cancel anytime.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">To Results</h4>
                <p className="body text-sm">Built by recruitment industry veterans who understand what it takes to get noticed, get interviews, and get offers.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className='mt-8 flex flex-wrap gap-3'>
        <a href='/app/onboarding/welcome'><button className='btn btn-primary mr-3'>Get Started</button></a>
        <a href='/about/our-story'><button className='btn btn-secondary mr-3'>Read Our Story</button></a>
      </div>
    </section>
  )
}
