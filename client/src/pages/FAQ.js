export default function Page(){
  return (
    <section>
      <h1 className="h1">FAQ</h1>
      
      <div className="mt-6">
        <p className='body mb-6'>Auto-apply vs review-first, what's included, security, and more.</p>
        
        <div className="space-y-6">
          <div className="card">
            <h3 className="h3 mb-3">Who is Talendro™ for?</h3>
            <p className="body">Anyone in the US workforce who is unemployed, underemployed, or unhappily employed and wants to find a better opportunity. Talendro™ serves every career level — from entry-level candidates to C-suite executives, across every industry and occupation type. If you need a job and want the process automated, Talendro™ is built for you.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">How does Talendro™ find jobs?</h3>
            <p className="body">Always-on AI search agents monitor thousands of job boards, company websites, and professional networks in real time. Our algorithms identify new opportunities that match your profile within minutes of posting, giving you a competitive advantage.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">Will Talendro™ apply for me?</h3>
            <p className="body">Yes—after your profile is complete. ASAN applies fully automatically on your behalf. You set your criteria once during onboarding (job titles, location, work arrangement, seniority, employment type), and ASAN handles everything from there. You are notified after each application is submitted, not before.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">What does it cost?</h3>
            <p className="body">Plans start at $39/month (Starter), with Pro at $99/month and Concierge at $249/month. All tiers include ASAN automated job search and application submission. Higher tiers unlock faster search frequency, more monthly applications, PDF resume formatting, and advanced interview and salary negotiation tools. Cancel anytime.</p>
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
            <p className="body">Unlike passive job boards, Talendro™ actively searches, tailors, and applies on your behalf — 24 hours a day, 7 days a week. Built by recruitment industry veterans with 20+ years of placement experience across every level of the workforce, from entry-level to executive.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">Do you guarantee job placements?</h3>
            <p className="body">While we can't guarantee specific outcomes, our platform significantly increases your application volume, quality, and timing. Most users see interview requests within their first month of active searching.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">What about veteran benefits?</h3>
            <p className="body">We offer a 20% discount on all plans for active military members and veterans. Verification is handled securely at checkout using your DD-214 or other proof of service. Veterans also receive priority onboarding and access to specialized transition resources.</p>
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
