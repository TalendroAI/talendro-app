export default function Page(){
  return (
    <section>
      <h1 className="h1">Privacy Policy</h1>
      <p className='tagline mt-2'>We respect your privacy and protect your data.</p>
      
      <div className="mt-6">
        <p className='body mb-6'>Your privacy is fundamental to our service. This policy explains how we collect, use, and protect your information when you use Talendro™.</p>
        
        <div className="space-y-6">
          <div className="card">
            <h3 className="h3 mb-4">📊 Information We Collect</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Profile Information</h4>
                <p className="body text-sm">Professional experience, skills, education, certifications, and career preferences you provide to create your job search profile and enable accurate matching.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Resume and Documents</h4>
                <p className="body text-sm">Your resume, cover letters, and other career documents that you upload for AI-powered optimization and application customization.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Application Data</h4>
                <p className="body text-sm">Information about job applications submitted on your behalf, including application status, employer responses, and interview scheduling data.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Usage Analytics</h4>
                <p className="body text-sm">Platform usage patterns, feature interactions, and service performance data to improve our AI algorithms and user experience.</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">🎯 How We Use Your Information</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Job Matching and Discovery</h4>
                <p className="body text-sm">Analyzing your profile to identify relevant job opportunities across thousands of sources and match you with positions that align with your experience and goals.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Resume Optimization</h4>
                <p className="body text-sm">Using AI to tailor your resume for specific job applications, highlighting relevant experience and optimizing keywords for applicant tracking systems.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Application Automation</h4>
                <p className="body text-sm">Submitting job applications on your behalf using your optimized materials and profile information, with timing optimized for maximum visibility.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Service Improvement</h4>
                <p className="body text-sm">Analyzing usage patterns and success metrics to improve our algorithms, enhance matching accuracy, and develop new features that benefit all users.</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">🔒 Data Protection and Security</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Encryption Standards</h4>
                <p className="body text-sm">All data encrypted in transit using TLS 1.3 and at rest using AES-256 encryption, ensuring your information remains secure throughout our systems.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Access Controls</h4>
                <p className="body text-sm">Strict role-based access controls limit data access to authorized personnel only, with all access logged and monitored for security compliance.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Data Minimization</h4>
                <p className="body text-sm">We collect only the minimum information necessary to provide our services effectively, avoiding unnecessary data collection or retention.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Secure Infrastructure</h4>
                <p className="body text-sm">Enterprise-grade cloud infrastructure with SOC 2 Type II compliance, regular security audits, and 24/7 monitoring for threats and vulnerabilities.</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">👤 Your Privacy Rights</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Data Access and Portability</h4>
                <p className="body text-sm">Request a complete copy of your data in machine-readable format. Export your profile, applications, and platform history at any time.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Correction and Updates</h4>
                <p className="body text-sm">Update or correct your information directly in your profile settings, or contact our privacy team for assistance with complex data corrections.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Data Deletion</h4>
                <p className="body text-sm">Request deletion of your account and associated data at any time. We'll securely delete your information within 30 days of verified requests.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Processing Restrictions</h4>
                <p className="body text-sm">Limit how we process your data for specific purposes while maintaining essential service functionality and legal compliance requirements.</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">🤝 Data Sharing and Third Parties</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">No Data Sales</h4>
                <p className="body text-sm font-medium">We never sell, rent, or trade your personal information to third parties for any purpose. Your data is used exclusively to provide our job search services.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Employer Applications</h4>
                <p className="body text-sm">We share your application materials with employers only when applying for specific positions on your behalf, as part of our core service offering.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Service Providers</h4>
                <p className="body text-sm">Limited data sharing with vetted service providers (cloud hosting, analytics) under strict data processing agreements that require the same privacy protections.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Legal Requirements</h4>
                <p className="body text-sm">Data may be disclosed only when required by law, court order, or to protect our legal rights, with prior notice to users when legally permissible.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100">
            <h3 className="h3 mb-4 text-center">Questions About Your Privacy?</h3>
            <p className="body text-center mb-4">Our privacy team is here to help with any questions about your data, privacy rights, or this policy. We're committed to transparency and protecting your information.</p>
            <div className="text-center">
              <p className="font-medium text-talBlue">Contact: privacy@talendro.com</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className='mt-8 flex flex-wrap gap-3 justify-center'>
        <a href='/contact'><button className='btn btn-secondary mr-3'>Questions? Contact Privacy</button></a>
        <a href='/security'><button className='btn btn-primary mr-3'>Learn About Security</button></a>
      </div>
    </section>
  )
}