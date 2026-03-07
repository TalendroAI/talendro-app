export default function Page(){
  return (
    <section>
      <h1 className="h1">Veterans at Talendro™</h1>
      <p className='tagline mt-2'>Honoring those who served — with service in return.</p>
      
      <div className="mt-6">
        <p className='body mb-6'>Your service to our country deserves our service to your career. Talendro is proud to offer a 20% discount on all plans to active military members and veterans, along with specialized transition resources designed specifically for the military-to-civilian journey.</p>
        
        <div className="space-y-6">
          <div className="card border-2 border-talBlue bg-gradient-to-br from-blue-50 to-white">
            <h3 className="h3 mb-4">🇺🇸 20% Discount on All Plans</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Complete Platform Access</h4>
                <p className="body text-sm">Full access to all Talendro features — ASAN job search automation, AI resume optimization, match scoring, and automated application submission — at 20% off any tier.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Priority Onboarding</h4>
                <p className="body text-sm">Dedicated onboarding support with veteran-specific guidance for translating military experience into civilian career opportunities.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Verified at Checkout</h4>
                <p className="body text-sm">Upload your DD-214 or other proof of service at checkout. Your discount is applied immediately and persists for the life of your subscription.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">All Branches Welcome</h4>
                <p className="body text-sm">Army, Navy, Air Force, Marines, Coast Guard, and Space Force veterans. National Guard and Reserve veterans with qualifying service included.</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">🎯 Veteran-Specific Capabilities</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Military-to-Civilian Translation</h4>
                <p className="body text-sm">ASAN understands military terminology and experience, automatically translating your service background into compelling civilian resume language that hiring managers recognize and value.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Security Clearance Matching</h4>
                <p className="body text-sm">Specialized matching identifies opportunities that value your security clearance, connecting you with defense contractors, government agencies, and security-focused private companies.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Leadership Experience Recognition</h4>
                <p className="body text-sm">Your military leadership experience is properly positioned for corporate leadership and management roles — because commanding a unit is exactly the kind of experience civilian employers want.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Veteran-Friendly Industry Targeting</h4>
                <p className="body text-sm">Targeted job discovery across veteran-friendly industries including aerospace, logistics, cybersecurity, project management, and federal contracting.</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">✅ Eligibility</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Service Verification</h4>
                <p className="body text-sm">DD-214 or other proof of military service required. We protect your privacy while confirming eligibility.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Honorable Service</h4>
                <p className="body text-sm">Open to veterans with honorable discharge or general discharge under honorable conditions. Case-by-case review for other discharge types.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl border border-green-200">
            <h3 className="h3 mb-4 text-center">Ready to Advance Your Civilian Career?</h3>
            <p className="body text-center mb-4">Your service has prepared you for success. Let ASAN find the right opportunity — automatically, around the clock, while you focus on what matters.</p>
            <div className="text-center">
              <p className="font-medium text-talBlue">Honor your service. Advance your career.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className='mt-8 flex flex-wrap gap-3'>
        <a href='/app/onboarding/welcome?veteran=true'><button className='btn btn-primary mr-3 text-lg py-3 px-6'>Get Started — 20% Off</button></a>
        <a href='/contact'><button className='btn btn-secondary mr-3'>Questions? Contact Us</button></a>
      </div>
    </section>
  )
}
