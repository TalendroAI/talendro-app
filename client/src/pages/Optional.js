export default function Page(){
  return (
    <section>
      <h1 className="h1">Optional AI Add-Ons</h1>
      
      <div className="mt-6">
        <p className='body mb-6'>Mix and match—use one or many.</p>
        
        <div className="mt-8 space-y-6">
          <div className="card">
            <h3 className="h3 mb-3">🎯 AI Interview Coach</h3>
            <p className="body mb-4">Personalized interview preparation powered by AI. Practice with realistic scenarios, get feedback on your responses, and build confidence for any interview format.</p>
            <div className="space-y-2">
              <p className="body text-sm flex items-start"><span className="text-talAqua mr-3">●</span>Mock interviews tailored to specific roles and companies</p>
              <p className="body text-sm flex items-start"><span className="text-talAqua mr-3">●</span>Real-time feedback on communication and content</p>
              <p className="body text-sm flex items-start"><span className="text-talAqua mr-3">●</span>Industry-specific question banks and best practices</p>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">🚀 AI Transition & First 100 Days Planner</h3>
            <p className="body mb-4">Smooth career transitions with strategic planning for your first 100 days. From negotiating offers to establishing yourself in your new role.</p>
            <div className="space-y-2">
              <p className="body text-sm flex items-start"><span className="text-talAqua mr-3">●</span>Personalized transition timeline and milestone tracking</p>
              <p className="body text-sm flex items-start"><span className="text-talAqua mr-3">●</span>Strategic guidance for making impact early</p>
              <p className="body text-sm flex items-start"><span className="text-talAqua mr-3">●</span>Relationship building and stakeholder mapping</p>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">✨ AI Career Branding Suite</h3>
            <p className="body mb-4">Build and maintain a powerful professional brand across all platforms. Optimize your LinkedIn, craft compelling narratives, and establish thought leadership.</p>
            <div className="space-y-2">
              <p className="body text-sm flex items-start"><span className="text-talAqua mr-3">●</span>LinkedIn profile optimization and content strategy</p>
              <p className="body text-sm flex items-start"><span className="text-talAqua mr-3">●</span>Personal brand positioning and messaging</p>
              <p className="body text-sm flex items-start"><span className="text-talAqua mr-3">●</span>Thought leadership content creation and scheduling</p>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">🤝 AI Career Concierge</h3>
            <p className="body mb-4">White-glove career management for executives and senior professionals. Dedicated support for complex career decisions and strategic moves.</p>
            <div className="space-y-2">
              <p className="body text-sm flex items-start"><span className="text-talAqua mr-3">●</span>One-on-one strategic career consulting</p>
              <p className="body text-sm flex items-start"><span className="text-talAqua mr-3">●</span>Executive search firm relationship management</p>
              <p className="body text-sm flex items-start"><span className="text-talAqua mr-3">●</span>Confidential career transition planning</p>
            </div>
          </div>
          
          <div className="card border-2 border-talLime bg-gradient-to-br from-green-50 to-white">
            <h3 className="h3 mb-3">🔗 Networking Insights (Coming Soon)</h3>
            <p className="body mb-4">AI-powered networking recommendations and relationship intelligence. Discover meaningful connections and strengthen your professional network.</p>
            <div className="space-y-2">
              <p className="body text-sm flex items-start"><span className="text-talLime mr-3">●</span>Strategic networking recommendations</p>
              <p className="body text-sm flex items-start"><span className="text-talLime mr-3">●</span>Relationship mapping and intelligence</p>
              <p className="body text-sm flex items-start"><span className="text-talLime mr-3">●</span>Event and conference optimization</p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 p-6 bg-gray-50 rounded-2xl">
          <h3 className="h3 mb-4 text-center">Flexible Add-On Pricing</h3>
          <p className="body text-center mb-6">Choose the services you need, when you need them. All add-ons require an active Navigator subscription.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-center">
              <p className="font-medium mb-2">Individual Add-Ons</p>
              <p className="body text-sm">Perfect for targeting specific career needs</p>
            </div>
            <div className="text-center">
              <p className="font-medium mb-2">Bundle Discounts</p>
              <p className="body text-sm">Save when you combine multiple services</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className='mt-8 flex flex-wrap gap-3'>
        <a href='/contact'><button className='btn btn-primary mr-3'>Add to My Plan</button></a>
        <a href='/app/onboarding/welcome'><button className='btn btn-secondary mr-3'>Start with Navigator</button></a>
      </div>
    </section>
  )
}
