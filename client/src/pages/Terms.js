export default function Page(){
  return (
    <section>
      <h1 className="h1">Terms of Service</h1>
      <p className='tagline mt-2'>Simple, transparent terms.</p>
      
      <div className="mt-6">
        <p className='body mb-6'>These terms govern your use of Talendro™ services. We've written them in plain language to ensure clarity about your rights and responsibilities.</p>
        
        <div className="space-y-6">
          <div className="card">
            <h3 className="h3 mb-4">💳 Subscription and Billing</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Monthly Subscription</h4>
                <p className="body text-sm">Talendro™ Navigator is available for $39/month, billed monthly to your chosen payment method. All features and services are included in this single price.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Automatic Renewal</h4>
                <p className="body text-sm">Your subscription automatically renews each month unless cancelled. You can cancel at any time through your account settings or by contacting customer support.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Payment Processing</h4>
                <p className="body text-sm">Payments are processed securely through Stripe. We do not store your payment information on our servers. All transactions are encrypted and protected.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Price Changes</h4>
                <p className="body text-sm">We'll provide 30 days advance notice of any price changes. Existing subscribers maintain their current rate for 90 days after any price increase.</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">✅ Acceptable Use</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Professional Use Only</h4>
                <p className="body text-sm">Talendro™ is designed for legitimate job search activities by qualified professionals. Misrepresentation of qualifications or fraudulent applications are prohibited.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Account Responsibility</h4>
                <p className="body text-sm">You're responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Accurate Information</h4>
                <p className="body text-sm">Provide accurate, current, and complete information in your profile and applications. False information may result in account suspension.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">System Integrity</h4>
                <p className="body text-sm">Do not attempt to circumvent security measures, access unauthorized areas, or interfere with the normal operation of our services.</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">⚠️ Service Limitations</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">No Employment Guarantees</h4>
                <p className="body text-sm font-medium">Talendro™ provides job search automation and optimization services. We do not guarantee job offers, interviews, or employment outcomes.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Best Efforts Service</h4>
                <p className="body text-sm">We use commercially reasonable efforts to provide quality job matching and application services, but market conditions and employer preferences affect outcomes.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Platform Availability</h4>
                <p className="body text-sm">We strive for 99.9% uptime but cannot guarantee uninterrupted service. Planned maintenance will be scheduled during low-usage periods when possible.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Third-Party Dependencies</h4>
                <p className="body text-sm">Our service relies on job boards, company websites, and applicant tracking systems controlled by third parties, which may affect service availability.</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">🔄 Cancellation and Refunds</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Easy Cancellation</h4>
                <p className="body text-sm">Cancel your subscription at any time through your account settings or by contacting customer support. No cancellation fees or complicated procedures.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">End of Billing Cycle</h4>
                <p className="body text-sm">Upon cancellation, you retain access to all features until the end of your current billing period. No partial refunds for unused portions of the month.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Refund Policy</h4>
                <p className="body text-sm">Full refunds available within 14 days of initial subscription for new users. Contact support to request a refund within this window.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Data Retention</h4>
                <p className="body text-sm">Your profile and application data remain accessible for 30 days after cancellation. Request data deletion or export during this period.</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">⚖️ Limitation of Liability</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Service Scope</h4>
                <p className="body text-sm">Our liability is limited to the amount you paid for services in the 12 months preceding any claim. We are not liable for lost opportunities, career decisions, or employment outcomes.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Indirect Damages</h4>
                <p className="body text-sm">We are not liable for indirect, incidental, or consequential damages arising from your use of our services, even if we've been advised of the possibility of such damages.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Third-Party Actions</h4>
                <p className="body text-sm">We are not responsible for employer decisions, hiring practices, or actions taken by third-party job boards and applicant tracking systems.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Force Majeure</h4>
                <p className="body text-sm">We are not liable for service interruptions caused by circumstances beyond our reasonable control, including natural disasters, government actions, or internet infrastructure failures.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100">
            <h3 className="h3 mb-4 text-center">Questions About These Terms?</h3>
            <p className="body text-center mb-4">Our legal team is available to clarify any aspect of these terms. We believe in transparency and want you to fully understand your rights and responsibilities.</p>
            <div className="text-center">
              <p className="font-medium text-talBlue">Contact: legal@talendro.com</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className='mt-8 flex flex-wrap gap-3'>
        <a href='/pricing'><button className='btn btn-secondary mr-3'>View Pricing</button></a>
        <a href='/privacy'><button className='btn btn-primary mr-3'>Read Privacy Policy</button></a>
      </div>
    </section>
  )
}