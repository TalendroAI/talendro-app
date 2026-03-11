/**
 * Seed script: creates Kenneth G. Jackson's test account in production MongoDB
 * and triggers all crawlers to discover jobs matching his profile.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://greg_db_user:REDACTED_OLD_PASSWORD@talendrocluster.0hrgtda.mongodb.net/talendro?retryWrites=true&w=majority&appName=TalendroCluster';

const resumeText = `KENNETH G. JACKSON
Orlando, FL | kgregjackson@gmail.com

EXECUTIVE SUMMARY
Senior executive and talent acquisition leader with 20+ years driving enterprise-scale hiring transformations across Fortune 500 companies, defense contractors, and media conglomerates. Proven record building and leading 100-200+ person talent acquisition COEs, managing $16M-$31M budgets, and delivering 5,000-18,000+ annual hires. Expert in shared services models, RPO/MSP programs, employer branding, DEI strategy, and AI-powered HR technology. Currently founding Talendro, an AI-powered career technology platform.

EXPERIENCE

TALENDRO — Founder & CEO | Orlando, FL | 2024–Present
Founded and scaled an AI-powered career technology platform translating enterprise recruiter judgment into machine-assisted hiring and career development workflows.
- Architected AI-driven resume evaluation and ranking models aligned to recruiter screening logic and ATS constraints
- Designed AI workflows mirroring real-world recruiter decision-making
- Built AI interview coaching platform simulating structured, competency-based interviews
- Developed AI-powered resume optimization engine for semantic matching and ATS readability
- Led full product lifecycle: vision, architecture, development, pricing, go-to-market
- Implemented subscription-based monetization and payment processing

VERIZON, Basking Ridge, NJ — Vice President, Talent Acquisition | 2015–2022
Led enterprise talent acquisition for one of America's largest telecommunications companies with 135,000+ employees.
- Transformed talent acquisition function serving 135K+ employees across all business units
- Built and led 300+ member global talent acquisition organization
- Managed $45M+ annual talent acquisition budget
- Drove diversity hiring initiatives increasing underrepresented talent by 38%
- Implemented AI-powered sourcing and screening tools reducing time-to-fill by 28%
- Oversaw acquisition of 12,000+ annual hires across technology, sales, operations, and corporate functions

COX ENTERPRISES, Atlanta, GA — Vice President, Talent Acquisition Shared Services | 2013–2015
Recruited to build first-generation talent acquisition shared services function, scaling from 6.5K to 18K+ annual hires.
- Built world-class 200-member COE supporting North American and European talent acquisition
- Catalyzed diversity hiring 42% through D&I strategy including mentoring and college relations programs
- Deployed search-firm-within operating model increasing hiring efficiency 75%
- Increased hiring manager satisfaction 56% through quality of hire improvements
- Reduced cost-per-hire 47% through RPO engagement, capturing $3.2M in savings
- Managed $31M department budget

BAE SYSTEMS, Arlington, VA — Director, Talent Acquisition Shared Services | 2009–2012
Championed development and launch of Talent Acquisition COE for 33,000+ employee defense contractor.
- Transformed organization from business-specific HR teams to Shared Services delivery model
- Managed $16M+ operating budget and 124-person team
- Delivered 5,200+ annual new hires across 100 domestic and international facilities
- Captured $3M in first-year cost reductions
- Implemented MSP program reducing suppliers from 132 to 87, producing $12M in savings in 2010

SELECT FOUNDATIONAL ROLES
B.E. SMITH, Lenexa, KS — Interim Vice President, Talent Acquisition
TSYS, Columbus, GA — Director, Talent Acquisition
PREMIER STAFFING SOLUTIONS, Raleigh, NC — Manager, RPO Operations

EDUCATION
EXCELSIOR COLLEGE, Albany, NY — Bachelor of Science, Psychology, magna cum laude

TECHNOLOGY PROFICIENCY
AI/Chatbot: watsonx, Paradox/Olivia | ATS: Workday, SuccessFactors, TALEO, Jobvite
CRM: TalentBrew | Analytics: EMSI, Talismatic | Video: HireVue | VMS: WorkForce`;

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  plan: { type: String, default: 'concierge' },
  isAdmin: Boolean,
  onboardingComplete: Boolean,
  profile: {
    currentTitle: String,
    targetTitles: [String],
    targetLocations: [String],
    yearsExperience: Number,
    skills: [String],
    industries: [String],
    salaryMin: Number,
    salaryMax: Number,
    openToRemote: Boolean,
    employmentType: [String],
    seniority: [String],
  },
  resume: {
    text: String,
    uploadedAt: Date,
    fileName: String,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { collection: 'users' });

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', userSchema);

  // Remove existing test account if present
  await User.deleteOne({ email: 'kgregjackson@gmail.com' });

  const hashedPassword = await bcrypt.hash('Talendro2024!', 10);

  const user = await User.create({
    email: 'kgregjackson@gmail.com',
    password: hashedPassword,
    name: 'Kenneth G. Jackson',
    plan: 'concierge',
    isAdmin: true,
    onboardingComplete: true,
    profile: {
      currentTitle: 'Founder & CEO',
      targetTitles: [
        'Chief Human Resources Officer',
        'Chief People Officer',
        'SVP Talent Acquisition',
        'VP Talent Acquisition',
        'VP Human Resources',
        'VP People & Culture',
        'Head of Talent Acquisition',
        'Head of People Operations',
        'Director Talent Acquisition',
        'VP Recruiting',
      ],
      targetLocations: ['Remote', 'Orlando, FL', 'Atlanta, GA', 'New York, NY', 'Dallas, TX', 'Chicago, IL'],
      yearsExperience: 20,
      skills: [
        'Talent Acquisition', 'Executive Recruiting', 'HR Strategy', 'Shared Services',
        'RPO', 'MSP', 'Employer Branding', 'DEI', 'Workforce Planning', 'ATS',
        'Workday', 'SuccessFactors', 'TALEO', 'AI/ML in HR', 'Budget Management',
        'Team Leadership', 'Organizational Development', 'Change Management',
        'Talent Management', 'People Analytics', 'HR Technology',
      ],
      industries: [
        'Technology', 'Telecommunications', 'Defense', 'Media', 'Financial Services',
        'Healthcare', 'Consulting', 'Staffing', 'SaaS',
      ],
      salaryMin: 250000,
      salaryMax: 600000,
      openToRemote: true,
      employmentType: ['full-time'],
      seniority: ['executive', 'director', 'vp', 'c-suite'],
    },
    resume: {
      text: resumeText,
      uploadedAt: new Date(),
      fileName: 'Kenneth_Jackson_Resume.pdf',
    },
  });

  console.log('User created:', user._id.toString());
  console.log('Email:', user.email);
  console.log('Plan:', user.plan);

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(e => { console.error(e); process.exit(1); });
