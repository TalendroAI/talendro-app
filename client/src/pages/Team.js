export default function Page(){
  return (
    <section>
      <h1 className="h1">Our Team</h1>
      <p className='tagline mt-2'>Empathy meets expertise.</p>
      
      <div className="mt-6">
        <p className='body mb-6'>Built by people who understand both sides of the hiring equation—the challenges of finding great talent and the frustration of searching for great opportunities.</p>
        
        <div className="space-y-8">
          <div className="card">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <div className="w-32 h-32 bg-gradient-to-br from-talBlue to-talAqua rounded-full mx-auto md:mx-0 flex items-center justify-center text-white text-4xl font-bold">
                  KGJ
                </div>
              </div>
              <div className="md:w-2/3">
                <h3 className="h3 mb-2">K. Greg Jackson</h3>
                <p className="font-medium text-talBlue mb-3">Founder & CEO</p>
                <p className="body mb-4">Greg brings over 20 years of recruitment leadership experience, having placed thousands of professionals in roles ranging from individual contributors to C-suite executives. His career spans blue-chip companies including IBM, American Airlines, Cox Communications, and HealthTrust.</p>
                <p className="body mb-4">As a pioneering force in AI-driven hiring at IBM, Greg earned his AI Blackbelt certification and led the transformation of talent acquisition processes for enterprise-scale organizations. He understands both the technical possibilities of AI and the human realities of career transitions.</p>
                <p className="body">As a veteran himself, Greg is passionate about supporting fellow service members and every American worker who deserves better tools for navigating the job market. This personal mission — to level the playing field for the entire US workforce — drives every decision at Talendro™.</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">Our Advisory Board</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Recruitment Industry Veterans</h4>
                <p className="body text-sm">Former VPs of Talent from Fortune 500 companies who understand enterprise hiring challenges and what makes candidates stand out in competitive markets.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">AI Technology Experts</h4>
                <p className="body text-sm">Machine learning engineers and data scientists from leading tech companies who ensure our algorithms deliver precise matches and optimal timing.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Career Transition Specialists</h4>
                <p className="body text-sm">Executive coaches and career counselors with decades of experience helping professionals navigate complex career changes and transitions.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Veteran Advocates</h4>
                <p className="body text-sm">Military transition experts who understand the unique challenges faced by veterans entering civilian careers and advancing within corporate environments.</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">Our Values</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Experience Over Algorithms</h4>
                <p className="body text-sm">We believe that human expertise must guide AI development. Our technology amplifies human insight rather than replacing it, ensuring every feature serves real career advancement needs.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Quality Over Quantity</h4>
                <p className="body text-sm">We focus on finding the right opportunities, not just more opportunities. Our approach prioritizes precision matches that advance careers rather than generating application volume.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Service Over Profit</h4>
                <p className="body text-sm">Our commitment to veterans and every American worker goes beyond business metrics. We measure success by career transformations across every industry and career level, not just revenue growth.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Transparency Over Marketing</h4>
                <p className="body text-sm">We share honest insights about job market realities and provide clear expectations about timelines and outcomes. No false promises or unrealistic guarantees.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100">
            <h3 className="h3 mb-4 text-center">Join Our Mission</h3>
            <p className="body text-center mb-4">We're always looking for passionate professionals who share our commitment to transforming careers through technology and empathy.</p>
            <div className="grid gap-4 md:grid-cols-3 text-center">
              <div>
                <h4 className="font-medium mb-2">AI Engineers</h4>
                <p className="body text-sm">Build the next generation of career advancement technology</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Recruitment Experts</h4>
                <p className="body text-sm">Share your expertise to improve our matching algorithms</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Customer Success</h4>
                <p className="body text-sm">Help professionals achieve their career goals through our platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className='mt-8 flex flex-wrap gap-3'>
        <a href='/contact'><button className='btn btn-primary mr-3'>Join Our Team</button></a>
        <a href='/about'><button className='btn btn-secondary mr-3'>Learn More About Us</button></a>
      </div>
    </section>
  )
}
