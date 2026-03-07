export default function Page(){
  return (
    <section>
      <div className="text-center">
        <h1 className="h1">What ASAN Does For You</h1>
        <p className="tagline mt-2">A deep look at the seven capabilities working on your behalf, around the clock.</p>
      </div>

      <div className="mt-16 space-y-16">

        {/* Capability 1 */}
        <div className="card">
          <div className="flex items-start gap-6">
            <div className="text-5xl">📋</div>
            <div>
              <h2 className="h2 mb-3">1. Profile Intelligence</h2>
              <p className="body mb-4">
                During onboarding, ASAN builds a comprehensive professional profile from everything you share — your work history, education, certifications, technical skills, soft skills, target job titles, preferred locations, work arrangement preferences, employment type, compensation expectations, and relocation willingness. This is not a simple form. It is a structured data model that ASAN uses as the foundation for every decision it makes on your behalf.
              </p>
              <p className="body">
                You complete this once. Every application ASAN submits on your behalf draws from this profile. You never re-enter your work history, never re-type your contact information, and never fill out the same field twice.
              </p>
            </div>
          </div>
        </div>

        {/* Capability 2 */}
        <div className="card">
          <div className="flex items-start gap-6">
            <div className="text-5xl">📄</div>
            <div>
              <h2 className="h2 mb-3">2. AI Resume Optimization</h2>
              <p className="body mb-4">
                Most resumes fail before a human ever reads them. Every major employer routes applications through an Applicant Tracking System — software that scores and filters candidates automatically. A resume not written for ATS is invisible, regardless of how qualified the candidate is.
              </p>
              <p className="body mb-4">
                ASAN takes your raw resume or the information you provide and produces a professionally written, ATS-optimized version. This means a strong professional summary, achievement-oriented bullet points with quantified results, the right keyword density for your target roles, and a clean format that passes every major ATS parser. You review the result, edit anything you want, and approve it. That approved version becomes your base resume.
              </p>
              <p className="body">
                At the point of each application, ASAN further tailors this base resume for the specific job — adjusting keywords, reordering skills, and emphasizing the most relevant experience for that particular role and company.
              </p>
            </div>
          </div>
        </div>

        {/* Capability 3 */}
        <div className="card">
          <div className="flex items-start gap-6">
            <div className="text-5xl">🔍</div>
            <div>
              <h2 className="h2 mb-3">3. Continuous Job Discovery</h2>
              <p className="body mb-4">
                ASAN searches continuously — not once a day, not when you remember to check. It monitors over 175,000 employer career sites and ATS platforms including Greenhouse, Lever, Workday, iCIMS, Ashby, SmartRecruiters, SAP SuccessFactors, Oracle Recruiting, Taleo, BambooHR, Rippling, and dozens more. It also pulls from Google for Jobs, which aggregates postings from LinkedIn, Indeed, Glassdoor, and ZipRecruiter.
              </p>
              <p className="body mb-4">
                New jobs are discovered within three hours of posting, on average. This matters because research consistently shows that the first applicants to a role are significantly more likely to be shortlisted. By the time most job seekers see a posting, manually tailor a resume, and submit — they have already lost the first-mover advantage. ASAN eliminates that gap entirely.
              </p>
              <p className="body">
                The system runs every 30 minutes for direct ATS sources and every hour for aggregated sources, ensuring your job pool is always current.
              </p>
            </div>
          </div>
        </div>

        {/* Capability 4 */}
        <div className="card">
          <div className="flex items-start gap-6">
            <div className="text-5xl">🎯</div>
            <div>
              <h2 className="h2 mb-3">4. Precision Match Scoring</h2>
              <p className="body mb-4">
                Not every job that mentions your title is a real match. ASAN evaluates every discovered job against your profile using a seven-factor scoring engine before any application is considered.
              </p>
              <div className="grid md:grid-cols-2 gap-4 my-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="font-semibold mb-1">Title Match (35 pts)</p>
                  <p className="body text-sm">Exact, partial, and word-overlap comparison against your target titles.</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="font-semibold mb-1">Seniority Match (20 pts)</p>
                  <p className="body text-sm">Your seniority level vs. keywords inferred from the job title.</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="font-semibold mb-1">Work Arrangement (15 pts)</p>
                  <p className="body text-sm">Remote, hybrid, or on-site preference vs. job's actual arrangement.</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="font-semibold mb-1">Employment Type (10 pts)</p>
                  <p className="body text-sm">Full-time, contract, part-time preference vs. job type.</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="font-semibold mb-1">Skills Match (10 pts)</p>
                  <p className="body text-sm">Your skills and software vs. job keywords and description text.</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="font-semibold mb-1">Location (5 pts)</p>
                  <p className="body text-sm">Your target cities vs. job location, with remote and relocation bypass.</p>
                </div>
              </div>
              <p className="body">
                Only jobs scoring 75 points or higher are considered a match. ASAN does not apply to roles that do not meet this threshold. You will never receive a notification about a job that is not genuinely aligned with what you are looking for.
              </p>
            </div>
          </div>
        </div>

        {/* Capability 5 */}
        <div className="card">
          <div className="flex items-start gap-6">
            <div className="text-5xl">🚀</div>
            <div>
              <h2 className="h2 mb-3">5. Automated Application Submission</h2>
              <p className="body mb-4">
                This is the capability that makes Talendro unlike anything else in the market. For every job that passes the 75% match threshold, ASAN navigates directly to the employer's application form — on Greenhouse, Lever, Workday, or any other supported ATS — fills in every required field from your profile, uploads your tailored resume, and submits the application. Completely autonomously.
              </p>
              <p className="body mb-4">
                ASAN handles standard application fields including name, contact information, work authorization, work history, education, skills, cover letter generation, and all employer-specific custom questions where answers can be derived from your profile. If a required field cannot be completed from your existing data, ASAN flags it and prompts you for that specific piece of information — and only that piece.
              </p>
              <p className="body">
                You do not click a button. You do not review a form. You do not upload a file. ASAN does all of it.
              </p>
            </div>
          </div>
        </div>

        {/* Capability 6 */}
        <div className="card">
          <div className="flex items-start gap-6">
            <div className="text-5xl">🔔</div>
            <div>
              <h2 className="h2 mb-3">6. Real-Time Notifications</h2>
              <p className="body mb-4">
                Every time ASAN submits an application on your behalf, you receive an email notification. The notification includes the company name, job title, date and time of submission, and a direct link to the application in your dashboard. You are never in the dark about what is being submitted in your name.
              </p>
              <p className="body">
                You can also view your complete application history at any time in your Talendro dashboard — a full audit trail of every application submitted, its current status, and the match score that qualified it.
              </p>
            </div>
          </div>
        </div>

        {/* Capability 7 */}
        <div className="card">
          <div className="flex items-start gap-6">
            <div className="text-5xl">📊</div>
            <div>
              <h2 className="h2 mb-3">7. Applications Audit Trail</h2>
              <p className="body mb-4">
                Your Applications dashboard is your post-hoc review center. Every application ASAN has submitted appears here with full detail — company, role, date applied, match score, and current status. You review at your leisure. If something does not look right, you can mark it as not interested. If something looks promising, you can flag it for follow-up.
              </p>
              <p className="body">
                This is not an approval queue. ASAN does not wait for your permission before applying. It acts, notifies you, and then gives you full visibility and control over the record. This is the model that lets you sleep while your career advances.
              </p>
            </div>
          </div>
        </div>

      </div>

      <div className="mt-16 text-center">
        <h2 className="h2 mb-4">This is unlike anything you have ever seen, read about, or heard of.</h2>
        <p className="body mb-8 max-w-2xl mx-auto">This is your job search, automated on steroids. Ready to activate ASAN?</p>
        <a href="/pricing"><button className="btn btn-primary btn-lg">View Plans & Get Started</button></a>
      </div>
    </section>
  )
}
