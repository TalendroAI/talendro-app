import CitationsFooter from '../ui/CitationsFooter'

export default function Page(){
  return (
    <section>
      <h1 className="h1">How Talendro™ Works</h1>
      
      <div className="mt-6">
        <p className='body mb-4'>From job posting to application—fast, accurate, automatic.</p>
        <p className='body mb-6'>Upload once. Complete essentials. Build agents. We tailor & time. You track results.</p>
        
        <div className="mt-8 space-y-6">
          <div className="card">
            <h3 className="h3 mb-3">1) Upload Your Résumé</h3>
            <p className="body">Simply upload your existing résumé. Our AI will parse and understand your experience, skills, and career trajectory to create your professional profile.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">2) Complete Profile Essentials</h3>
            <p className="body">Fill in key preferences like location, salary range, and job types. This one-time setup ensures every opportunity we find matches your criteria.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">3) Build Search Agents</h3>
            <p className="body">Your Navigator will create intelligent search agents that monitor career pages 24/7. Each agent can target specific roles, companies, or industries you're interested in.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">4) Tailor & Time Applications</h3>
            <p className="body">Our AI tailors your résumé for each opportunity, optimizing keywords and highlighting relevant experience. Applications are submitted at optimal times for maximum visibility.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-3">5) Track & Improve</h3>
            <p className="body">Monitor your application success rates, interview requests, and overall progress. Our analytics help you refine your strategy and improve results over time.</p>
          </div>
        </div>
      </div>
      
      {/* The Science Behind Talendro */}
      <div className="max-w-6xl mx-auto py-16 px-4">
        <h2 className="h2 text-center mb-4">The Science Behind Talendro™</h2>
        <p className="body text-center mb-12 max-w-3xl mx-auto">
          Our approach is backed by extensive research from leading recruitment firms and career platforms
        </p>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Speed Advantage */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-blue-100">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="h3 mb-4">Apply First, Win More</h3>
            <p className="body text-sm mb-4">
              Research shows the first 10 applicants are <strong>13% more likely to be shortlisted</strong>, 
              and applications submitted within the first 96 hours have a <strong>21% higher chance of landing an interview</strong>.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mt-4">
              <p className="body text-xs">
                <strong>Sources:</strong><br/>
                • The Ladders (2019): "Job Application Timing"<br/>
                • TalentWorks (2018): "Science of Job Search"
              </p>
            </div>
          </div>
          
          {/* Tailoring Advantage */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-green-100">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="h3 mb-4">Tailored Resumes Win</h3>
            <p className="body text-sm mb-4">
              Candidates with customized resumes receive <strong>25% more callbacks</strong> than those 
              with generic resumes, and are <strong>40% more likely to pass ATS screening</strong>.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mt-4">
              <p className="body text-xs">
                <strong>Sources:</strong><br/>
                • TopResume (2020): "Power of Tailored Resume"<br/>
                • Jobscan (2021): "Optimize Resume for ATS"
              </p>
            </div>
          </div>
          
          {/* Timing Advantage */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-purple-100">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="h3 mb-4">Timing Is Everything</h3>
            <p className="body text-sm mb-4">
              <strong>60% of recruiters</strong> begin reviewing applications within the first week, 
              and <strong>44% contact top candidates within three days</strong> of posting.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mt-4">
              <p className="body text-xs">
                <strong>Sources:</strong><br/>
                • Jobvite (2020): "Recruiting Benchmark Report"<br/>
                • ZipRecruiter (2021): "Hiring Trends"
              </p>
            </div>
          </div>
        </div>
        
        {/* The Problem */}
        <div className="bg-red-50 rounded-xl p-8 border-2 border-red-200 mb-8">
          <h3 className="h3 mb-4 text-center">The Problem: You Can't Be Fast Enough Manually</h3>
          <p className="body text-center mb-4 max-w-3xl mx-auto">
            Job postings receive <strong>50% of their applications within the first week</strong>. 
            By the time most job seekers see a posting, manually tailor a resume, and submit—
            they've already lost the first-mover advantage.
          </p>
          <p className="body text-sm text-center">
            Source: Indeed (2020) "Job Market Insights: Application Trends"
          </p>
        </div>
        
        {/* The Solution */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-8 border-2 border-talBlue">
          <h3 className="h3 mb-4 text-center">The Talendro™ Solution: Autonomous Speed + Perfect Tailoring</h3>
          <p className="body text-center mb-6 max-w-3xl mx-auto">
            Our AI applies <strong>within minutes</strong> of a job posting going live—before human job seekers 
            even see it—with a <strong>perfectly tailored resume</strong> for each position. You get both the 
            first-applicant advantage AND the tailored-resume advantage, automatically.
          </p>
        </div>
      </div>
      
      <div className='mt-8 flex flex-wrap gap-3'>
        <a href='/pricing'><button className='btn btn-primary mr-3'>Get Started</button></a>
        <a href='/services'><button className='btn btn-secondary mr-3'>Services</button></a>
      </div>
      
      <CitationsFooter />
    </section>
  )
}
