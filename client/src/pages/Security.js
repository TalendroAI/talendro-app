export default function Page(){
  return (
    <section>
      <h1 className="h1">Security at Talendro™</h1>
      <p className='tagline mt-2'>Your data is safe, encrypted, and private.</p>
      
      <div className="mt-6">
        <p className='body mb-6'>We understand that your career information is among your most sensitive data. Our security framework is built on enterprise-grade principles with privacy by design at every level.</p>
        
        <div className="space-y-6">
          <div className="card">
            <h3 className="h3 mb-4">🔒 Data Protection</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Encryption Everywhere</h4>
                <p className="body text-sm">All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Your information is protected whether it's moving between systems or stored in our databases.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Secure Cloud Infrastructure</h4>
                <p className="body text-sm">Hosted on enterprise-grade cloud infrastructure with SOC 2 Type II compliance, multi-factor authentication, and automated security monitoring across all systems.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Access Controls</h4>
                <p className="body text-sm">Role-based access controls ensure only authorized personnel can access systems, with all actions logged and monitored for security compliance.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Regular Security Audits</h4>
                <p className="body text-sm">Continuous vulnerability scanning, penetration testing, and third-party security assessments ensure our defenses stay ahead of emerging threats.</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">🛡️ Privacy by Design</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Data Minimization</h4>
                <p className="body text-sm">We collect only the information necessary to provide our services effectively. No unnecessary tracking, no data mining for advertising, no selling of personal information to third parties.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Transparent Data Use</h4>
                <p className="body text-sm">Your data is used exclusively for job matching, application optimization, and service delivery. We provide clear visibility into how your information is processed and used.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">User Control</h4>
                <p className="body text-sm">Complete control over your data with options to download, modify, or delete your information at any time. Your data belongs to you, and you decide how it's used.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Retention Policies</h4>
                <p className="body text-sm">Clear data retention policies ensure information is kept only as long as necessary for service delivery, with secure deletion processes for expired data.</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">🤖 Responsible AI</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Algorithmic Transparency</h4>
                <p className="body text-sm">Our AI systems are designed with explainable decision-making processes. You can understand why certain opportunities are recommended and how your profile influences matching algorithms.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Bias Prevention</h4>
                <p className="body text-sm">Regular auditing of AI models to identify and eliminate potential biases in job matching, ensuring fair and equitable opportunities regardless of background or demographics.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Human Oversight</h4>
                <p className="body text-sm">AI systems operate under human supervision with manual review processes for critical decisions. Technology amplifies human expertise rather than replacing human judgment.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Continuous Improvement</h4>
                <p className="body text-sm">Regular model retraining and performance monitoring ensure AI systems remain accurate, fair, and aligned with evolving best practices in responsible AI development.</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="h3 mb-4">🔐 Compliance & Standards</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Privacy Regulations</h4>
                <p className="body text-sm">Full compliance with GDPR, CCPA, and other applicable privacy regulations, ensuring your rights are protected regardless of your location.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Industry Standards</h4>
                <p className="body text-sm">Adherence to ISO 27001 security standards and SOC 2 Type II compliance for comprehensive information security management.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Data Processing Agreements</h4>
                <p className="body text-sm">Clear data processing agreements with all service providers, ensuring your data is protected throughout our entire ecosystem of partners and vendors.</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-talBlue">Incident Response</h4>
                <p className="body text-sm">Comprehensive incident response procedures with 24/7 monitoring and immediate notification protocols in the unlikely event of a security incident.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100">
            <h3 className="h3 mb-4 text-center">Your Security Is Our Priority</h3>
            <p className="body text-center mb-4">We've built Talendro™ with the same security standards used by Fortune 500 companies because your career information deserves enterprise-level protection.</p>
            <div className="text-center">
              <p className="font-medium text-talBlue">Questions about our security practices? We're happy to provide additional details.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className='mt-8 flex flex-wrap gap-3 justify-center'>
        <a href='/privacy'><button className='btn btn-secondary mr-3'>Read Privacy Policy</button></a>
        <a href='/contact'><button className='btn btn-primary mr-3'>Contact Security Team</button></a>
      </div>
    </section>
  )
}