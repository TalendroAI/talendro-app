export default function Page(){
  return (
    <section>
      <h1 className="h1">Veterans at Talendro™</h1>
      <p className='tagline mt-2'>Our pledge: 10,000 veterans hired in 3 years.</p>
      
      <div className="mt-6">
        <p className='body mb-6'>Your service to our country deserves our service to your career. We provide free access to Talendro™ Navigator for eligible veterans, along with specialized transition resources and priority support.</p>
        
        <div className="space-y-6">
          <div className="card border-2 border-talBlue bg-gradient-to-br from-blue-50 to-white">
            <h3 className="h3 mb-4">🇺🇸 Free Navigator Access for Veterans</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Complete Platform Access</h4>
                <p className="body text-sm">Full access to all Navigator features including AI-powered job discovery, résumé tailoring, smart matching, and automated applications—completely free for eligible veterans.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Priority Onboarding</h4>
                <p className="body text-sm">Dedicated onboarding support with veteran-specific guidance for translating military experience into civilian career opportunities.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Unlimited Duration</h4>
                <p className="body text-sm">No time limits on your free access. Use Navigator for as long as you need to establish your civilian career trajectory.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Specialized Support</h4>
                <p className="body text-sm">Direct access to our veteran advocate team for career guidance, interview preparation, and transition planning.</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">🎯 Veteran-Specific Resources</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Military-to-Civilian Translation</h4>
                <p className="body text-sm">Our AI understands military terminology and experience, automatically translating your service background into compelling civilian résumé language that hiring managers recognize and value.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Security Clearance Matching</h4>
                <p className="body text-sm">Specialized algorithms identify opportunities that value your security clearance, connecting you with defense contractors, government agencies, and security-focused private companies.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Leadership Experience Recognition</h4>
                <p className="body text-sm">Our platform recognizes and highlights your military leadership experience, ensuring it's properly positioned for corporate leadership and management roles.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Industry Transition Guidance</h4>
                <p className="body text-sm">Targeted job discovery across veteran-friendly industries including aerospace, logistics, cybersecurity, project management, and federal contracting.</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">📈 Proven Success for Veterans</h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-talBlue mb-2">89%</div>
                <p className="body text-sm">Veteran success rate within 6 months of platform activation</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-talBlue mb-2">34%</div>
                <p className="body text-sm">Average salary increase over previous military or civilian role</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-talBlue mb-2">2,847</div>
                <p className="body text-sm">Veterans successfully placed in the last 18 months</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">✅ Eligibility Requirements</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Service Verification</h4>
                <p className="body text-sm">DD-214 or other proof of military service required for verification. We protect your privacy while confirming eligibility for veteran benefits.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Honorable Service</h4>
                <p className="body text-sm">Open to veterans with honorable discharge or general discharge under honorable conditions. Case-by-case review for other discharge types.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">All Service Branches</h4>
                <p className="body text-sm">Army, Navy, Air Force, Marines, Coast Guard, and Space Force veterans all welcome. National Guard and Reserve veterans with qualifying service included.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Simple Enrollment</h4>
                <p className="body text-sm">Quick verification process gets you started immediately. Upload your DD-214 and begin building your profile while we process verification.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl border border-green-200">
            <h3 className="h3 mb-4 text-center">Ready to Advance Your Civilian Career?</h3>
            <p className="body text-center mb-4">Join thousands of veterans who have successfully transitioned to rewarding civilian careers using Talendro™ Navigator. Your service has prepared you for success—let us help you find the right opportunity.</p>
            <div className="text-center">
              <p className="font-medium text-talBlue">Honor your service. Advance your career.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className='mt-8 flex flex-wrap gap-3 justify-center'>
        <a href='/app/onboarding/welcome?veteran=true'><button className='btn btn-primary mr-3 text-lg py-3 px-6'>Enroll as a Veteran</button></a>
        <a href='/contact'><button className='btn btn-secondary mr-3'>Questions? Contact Us</button></a>
      </div>
    </section>
  )
}