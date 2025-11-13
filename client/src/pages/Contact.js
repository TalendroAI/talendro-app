export default function Page(){
  return (
    <section>
      <h1 className="h1">Contact Talendro™</h1>
      
      <div className="mt-6">
        <p className='body mb-8'>We're here to help you succeed. Reach out to our team for support, partnerships, or media inquiries.</p>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="card text-center">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="h3 mb-3">Customer Support</h3>
            <p className="body mb-4">Questions about your account, billing, or how to use Talendro™ Navigator? Our support team is ready to help.</p>
            <p className="font-medium text-talBlue">support@talendro.com</p>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl mb-3">🤝</div>
            <h3 className="h3 mb-3">Partnerships</h3>
            <p className="body mb-4">Interested in partnering with Talendro™? We work with HR technology companies, recruiting firms, and career service providers.</p>
            <p className="font-medium text-talBlue">partners@talendro.com</p>
          </div>
          
          <div className="card text-center">
            <div className="text-3xl mb-3">📰</div>
            <h3 className="h3 mb-3">Media Inquiries</h3>
            <p className="body mb-4">Press inquiries, interview requests, and media resources. We're happy to discuss our mission and impact.</p>
            <p className="font-medium text-talBlue">press@talendro.com</p>
          </div>
        </div>
        
        <div className="mt-12 space-y-6">
          <div className="card">
            <h3 className="h3 mb-4">Frequently Asked Questions</h3>
            <p className="body mb-4">Before reaching out, you might find answers to common questions in our comprehensive FAQ section.</p>
            <a href='/resources/faq'><button className='btn btn-secondary'>View FAQ</button></a>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">Veterans Support</h3>
            <p className="body mb-4">Special support and resources for veterans transitioning to civilian careers. We're honored to serve those who served.</p>
            <a href='/veterans'><button className='btn btn-secondary'>Learn About Veteran Benefits</button></a>
          </div>
        </div>
        
        <div className="mt-12 p-6 bg-gray-50 rounded-2xl text-center">
          <h3 className="h3 mb-3">Ready to Transform Your Job Search?</h3>
          <p className="body mb-6">Don't wait for opportunities to find you. Let Talendro™ Navigator work around the clock to advance your career.</p>
          <a href='/app/onboarding/welcome'><button className='btn btn-primary text-lg px-8 py-3'>Get Started</button></a>
        </div>
      </div>
    </section>
  )
}
