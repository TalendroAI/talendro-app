export default function Page(){
  return (
    <section>
      <h1 className="h1">Our Story</h1>
      
      <div className="mt-6">
        <p className='body mb-6'>Because great experience deserves great opportunities.</p>
        
        <div className="space-y-8">
          <div className="card">
            <h3 className="h3 mb-4">The Problem We Saw</h3>
            <p className="body mb-4">After two decades in recruitment leadership, our founder witnessed a troubling pattern: the most qualified candidates were struggling the most with job searches. Experienced professionals—executives, managers, specialists with proven track records—were spending months in search processes that should have taken weeks.</p>
            <p className="body">The job search ecosystem had evolved to favor volume over value, speed over experience, and keywords over competence. Something had to change.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">The Solution We Built</h3>
            <p className="body mb-4">Talendro™ was born from the intersection of recruitment expertise and AI innovation. We asked a simple question: What if technology could do the searching, tailoring, and timing while experienced professionals focused on what they do best—interviewing and excelling in their roles?</p>
            <p className="body">Our platform flips the script entirely. Instead of you searching for jobs, intelligent agents search for you. Instead of generic applications, every submission is precisely tailored. Instead of guessing the best time to apply, our algorithms determine optimal timing.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">Founded by Experience</h3>
            <p className="body mb-4">K. Greg Jackson brings over 20 years of recruitment leadership experience, having placed thousands of professionals in roles ranging from individual contributors to C-suite executives. As both a veteran and an AI Blackbelt, Greg understands the unique challenges faced by experienced professionals in today's job market.</p>
            <p className="body">This isn't another tech platform built by people who've never hired anyone. Talendro™ was created by someone who has spent decades understanding what hiring managers want, when they want it, and how to present candidates in the most compelling way.</p>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">Our Vision</h3>
            <p className="body mb-4">We envision a world where career advancement is based on merit and experience, not on who has the most time to spend on job applications. Where seasoned professionals can focus on strategic thinking, leadership, and innovation rather than keyword optimization and application tracking.</p>
            <p className="body">Every feature we build, every algorithm we refine, every partnership we form is designed to give experienced professionals the competitive advantage they deserve in a market that too often overlooks their value.</p>
          </div>
        </div>
      </div>
      
      <div className='mt-8 flex flex-wrap gap-3'>
        <a href='/services/navigator'><button className='btn btn-primary mr-3'>Try Talendro™ Navigator</button></a>
        <a href='/about'><button className='btn btn-secondary mr-3'>Learn More About Us</button></a>
      </div>
    </section>
  )
}
