export default function Page(){
  return (
    <section>
      <div className="text-center">
        <h1 className="h1">How It Works</h1>
        <p className='tagline mt-2'>Your job search, automated in three simple steps.</p>
      </div>
      
      <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
        <div className="card">
          <div className="text-6xl mb-4">1</div>
          <h3 className="h3 mb-2">You Tell Us Who You Are</h3>
          <p className="body">Complete your profile once. We learn your skills, experience, and exactly what you’re looking for in your next role.</p>
        </div>
        <div className="card">
          <div className="text-6xl mb-4">2</div>
          <h3 className="h3 mb-2">ASAN Searches & Applies</h3>
          <p className="body">Our AI, ASAN, works 24/7, searching over 175,000+ employers and applying to every job that is a 75%+ match for you.</p>
        </div>
        <div className="card">
          <div className="text-6xl mb-4">3</div>
          <h3 className="h3 mb-2">You Focus on Interviews</h3>
          <p className="body">You wake up to a dashboard of applications already submitted. Your only job is to show up prepared when an employer responds.</p>
        </div>
      </div>

      <div className='mt-16 text-center'>
        <h2 className='h2 mb-4'>While you are living your life, we are building your career.</h2>
        <a href="/pricing" className="btn btn-primary btn-lg mt-6">Get Started Now</a>
      </div>
    </section>
  )
}
