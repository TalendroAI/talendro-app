export default function Page(){
  return (
    <section>
      <h1 className="h1">FAQ</h1>
      
      <div className="mt-6">
        <p className='body mb-6'>Auto-apply vs review-first, what's included, security, and more.</p>
        
        <div className="space-y-6">
          <div className="card">
            <h3 className="h3 mb-3">Who is Talendro™ for?</h3>
            <p className="body">Mid-to-late career professionals and veterans who want to leverage their experience for better opportunities. Perfect for executives, managers, specialists, and anyone with 5+ years of professional experience who values their time and wants premium results.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">How does Talendro™ find jobs?</h3>
            <p className="body">Always-on AI search agents monitor thousands of job boards, company websites, and professional networks in real time. Our algorithms identify new opportunities that match your profile within minutes of posting, giving you a competitive advantage.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">Will Talendro™ apply for me?</h3>
            <p className="body">Yes—after your profile is complete. You can choose auto-apply for pre-approved criteria or approve-then-apply for more control. Each application includes a tailored résumé optimized for the specific role and company.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">What does it cost?</h3>
            <p className="body">$39/month for complete access to Talendro™ Navigator. No hidden fees, no tier limitations, no upsells. Cancel anytime with no penalties or commitments.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">How secure is my information?</h3>
            <p className="body">We use enterprise-grade encryption, strict access controls, and continuous monitoring. Your data is never sold or shared. We collect only what's necessary to deliver the service and maintain privacy by design principles.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">Can I customize my job search?</h3>
            <p className="body">Absolutely. Set preferences for location, salary range, company size, industry, remote work options, and more. Create multiple search agents for different types of roles or career paths you're exploring.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">What makes this different from other job sites?</h3>
            <p className="body">Unlike passive job boards, Talendro™ actively searches, tailors, and applies on your behalf. Built specifically for experienced professionals by recruitment industry veterans with 20+ years of placement experience.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">Do you guarantee job placements?</h3>
            <p className="body">While we can't guarantee specific outcomes, our platform significantly increases your application volume, quality, and timing. Most users see interview requests within their first month of active searching.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">What about veteran benefits?</h3>
            <p className="body">We provide free access to eligible veterans as part of our commitment to those who served. Veterans also receive priority onboarding and access to specialized transition resources.</p>
          </div>
        </div>
      </div>
      
      <div className='mt-8 flex flex-wrap gap-3'>
        <a href='/contact'><button className='btn btn-secondary mr-3'>Contact Support</button></a>
        <a href='/pricing'><button className='btn btn-primary mr-3'>Get Started</button></a>
      </div>
    </section>
  )
}
