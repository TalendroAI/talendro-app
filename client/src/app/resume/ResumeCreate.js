import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const C = { blue: "#2F6DF6", aqua: "#00C4CC", slate: "#2C2F38", gray: "#9FA6B2", lightBg: "#F9FAFB", white: "#FFFFFF", purple: "#8B5CF6" };
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEARS = Array.from({ length: 40 }, (_, i) => String(new Date().getFullYear() - i));
const EMPTY_JOB = { title: "", company: "", city: "", startMonth: "", startYear: "", endMonth: "", endYear: "", current: false, bullets: ["", "", ""] };
const EMPTY_EDU = { degree: "", field: "", school: "", gradYear: "", gpa: "" };

function PageShell({ children, step, totalSteps, title, subtitle }) {
  const navigate = useNavigate();
  const pct = Math.round((step / totalSteps) * 100);
  return (
    <div style={{ minHeight: "100vh", background: C.lightBg, display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <header style={{ padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E5E7EB", background: C.white }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.blue, fontFamily: "'Montserrat', sans-serif" }}>
          Talendro™ <span style={{ fontSize: 13, fontWeight: 500, color: C.gray }}>Apply</span>
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: C.gray }}>Step {step} of {totalSteps}</span>
          <button onClick={() => navigate("/app/resume-gate")} style={{ padding: "8px 20px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, cursor: "pointer", background: C.white, color: C.slate, fontFamily: "'Inter', sans-serif" }}>← Back</button>
        </div>
      </header>
      <div style={{ height: 4, background: "#E5E7EB" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.aqua})`, transition: "width 0.4s ease" }} />
      </div>
      <main style={{ flex: 1, padding: "48px 48px 80px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ maxWidth: 720, width: "100%" }}>
          <div style={{ marginBottom: 36, textAlign: "center" }}>
            <div style={{ display: "inline-block", padding: "5px 16px", borderRadius: 20, background: "#EFF6FF", border: `1px solid ${C.blue}30`, marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.aqua, letterSpacing: 1 }}>BUILD RESUME — STEP {step} OF {totalSteps}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: C.blue, fontFamily: "'Montserrat', sans-serif", marginBottom: 10 }}>{title}</h2>
            {subtitle && <p style={{ margin: 0, fontSize: 16, color: C.gray, lineHeight: 1.6 }}>{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", hint }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.slate, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.7 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "12px 16px", background: C.white, border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 15, color: C.slate, fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box" }}
        onFocus={e => e.target.style.borderColor = C.blue}
        onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
      {hint && <p style={{ margin: "5px 0 0", fontSize: 12, color: C.gray }}>{hint}</p>}
    </div>
  );
}

function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.slate, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.7 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "12px 16px", background: C.white, border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 15, color: value ? C.slate : C.gray, fontFamily: "'Inter', sans-serif", outline: "none" }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 3, hint }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.slate, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.7 }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width: "100%", padding: "12px 16px", background: C.white, border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 15, color: C.slate, fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box", resize: "vertical" }}
        onFocus={e => e.target.style.borderColor = C.blue}
        onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
      {hint && <p style={{ margin: "5px 0 0", fontSize: 12, color: C.gray }}>{hint}</p>}
    </div>
  );
}

function NavButtons({ onBack, onNext, nextLabel = "Continue →", disabled = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40 }}>
      {onBack ? <button onClick={onBack} style={{ padding: "12px 28px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", background: C.white, color: C.slate, fontFamily: "'Inter', sans-serif" }}>← Back</button> : <div />}
      <button onClick={onNext} disabled={disabled}
        style={{ padding: "14px 48px", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#E5E7EB" : C.blue, color: disabled ? C.gray : C.white, fontFamily: "'Inter', sans-serif", boxShadow: disabled ? "none" : `0 4px 16px ${C.blue}40`, transition: "all 0.2s" }}>
        {nextLabel}
      </button>
    </div>
  );
}

export default function ResumeCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [contact, setContact] = useState({ firstName: "", lastName: "", email: "", phone: "", city: "", state: "", linkedin: "", portfolio: "", summary: "" });
  const [jobs, setJobs] = useState([{ ...EMPTY_JOB }]);
  const [noExperience, setNoExperience] = useState(false);
  const [education, setEducation] = useState([{ ...EMPTY_EDU }]);
  const [skills, setSkills] = useState({ technical: "", soft: "", languages: "", certs: "", tools: "" });
  const [goals, setGoals] = useState({ targetTitle: "", targetIndustry: "", salaryMin: "", salaryMax: "", workType: "", arrangement: "", openToRelocation: false, careerLevel: "" });

  const [generatingIdx, setGeneratingIdx] = useState(null);
  const updateJob = (i, field, val) => setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, [field]: val } : j));
  const updateBullet = (i, bi, val) => setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, bullets: j.bullets.map((b, bidx) => bidx === bi ? val : b) } : j));
  const addJob = () => setJobs(prev => [...prev, { ...EMPTY_JOB }]);
  const removeJob = (i) => setJobs(prev => prev.filter((_, idx) => idx !== i));

  const generateBullets = async (i) => {
    const job = jobs[i];
    if (!job.company || !job.title) {
      alert('Please enter a Job Title and Company first.');
      return;
    }
    setGeneratingIdx(i);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/ai/generate-job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ company: job.company, title: job.title }),
      });
      const json = await res.json();
      if (json.success && json.description) {
        // Parse the bullet lines into the 3-bullet array
        const lines = json.description.split('\n').map(l => l.replace(/^[-•\s]+/, '').trim()).filter(Boolean).slice(0, 3);
        while (lines.length < 3) lines.push('');
        setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, bullets: lines } : j));
      } else {
        alert('Could not generate. Please try again or type manually.');
      }
    } catch (err) {
      alert('Network error. Please check your connection.');
    } finally {
      setGeneratingIdx(null);
    }
  };
  const updateEdu = (i, field, val) => setEducation(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));
  const addEdu = () => setEducation(prev => [...prev, { ...EMPTY_EDU }]);
  const removeEdu = (i) => setEducation(prev => prev.filter((_, idx) => idx !== i));

  const handleFinish = () => {
    const createData = { path: "create", contact, jobs: noExperience ? [] : jobs, education, skills, goals };
    localStorage.setItem("talendro_resume_create", JSON.stringify(createData));
    localStorage.setItem("talendro_resume_path", "create");
    navigate("/app/resume/optimize");
  };

  if (step === 1) return (
    <PageShell step={1} totalSteps={4} title="Let's Start With You" subtitle="Your contact information is the foundation of every job application.">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Input label="First Name *" value={contact.firstName} onChange={v => setContact(p => ({ ...p, firstName: v }))} placeholder="Jane" />
        <Input label="Last Name *" value={contact.lastName} onChange={v => setContact(p => ({ ...p, lastName: v }))} placeholder="Smith" />
        <Input label="Email Address *" value={contact.email} onChange={v => setContact(p => ({ ...p, email: v }))} placeholder="jane@email.com" type="email" />
        <Input label="Phone Number *" value={contact.phone} onChange={v => setContact(p => ({ ...p, phone: v }))} placeholder="(555) 123-4567" />
        <Input label="City *" value={contact.city} onChange={v => setContact(p => ({ ...p, city: v }))} placeholder="Chicago" />
        <Input label="State *" value={contact.state} onChange={v => setContact(p => ({ ...p, state: v }))} placeholder="IL" />
        <div style={{ gridColumn: "1 / -1" }}>
          <Input label="LinkedIn URL" value={contact.linkedin} onChange={v => setContact(p => ({ ...p, linkedin: v }))} placeholder="linkedin.com/in/janesmith" hint="Increases interview rate by 40% — highly recommended" />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Input label="Portfolio / Website" value={contact.portfolio} onChange={v => setContact(p => ({ ...p, portfolio: v }))} placeholder="janesmith.com or github.com/janesmith" />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Textarea label="Professional Summary (optional — AI will write one if left blank)" value={contact.summary} onChange={v => setContact(p => ({ ...p, summary: v }))} placeholder="A brief 2–3 sentence overview of your professional background and what you're looking for..." rows={4} hint="AI will tailor this to each job application automatically." />
        </div>
      </div>
      <NavButtons onNext={() => setStep(2)} nextLabel="Add Work History →" disabled={!contact.firstName || !contact.lastName || !contact.email || !contact.phone} />
    </PageShell>
  );

  if (step === 2) return (
    <PageShell step={2} totalSteps={4} title="Your Work History" subtitle="Add your most recent positions first. Include part-time, contract, and freelance work.">
      <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 28, padding: "14px 20px", background: C.white, border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <input type="checkbox" checked={noExperience} onChange={e => setNoExperience(e.target.checked)} style={{ width: 18, height: 18, accentColor: C.blue, flexShrink: 0 }} />
        <div>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.slate }}>I have no work experience</span>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: C.gray }}>New graduates, career changers, or first-time job seekers — AI will highlight your education and skills instead.</p>
        </div>
      </label>

      {!noExperience && (
        <>
          {jobs.map((job, i) => (
            <div key={i} style={{ padding: "24px 28px", background: C.white, border: "1.5px solid #E5E7EB", borderRadius: 16, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>Position {i + 1}</h4>
                {jobs.length > 1 && <button onClick={() => removeJob(i)} style={{ padding: "5px 14px", border: "1px solid #FECACA", borderRadius: 6, fontSize: 12, cursor: "pointer", background: "#FEF2F2", color: "#EF4444", fontFamily: "'Inter', sans-serif" }}>Remove</button>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                <Input label="Job Title *" value={job.title} onChange={v => updateJob(i, "title", v)} placeholder="Marketing Manager" />
                <Input label="Company *" value={job.company} onChange={v => updateJob(i, "company", v)} placeholder="Acme Corporation" />
                <Input label="City, State" value={job.city} onChange={v => updateJob(i, "city", v)} placeholder="Chicago, IL" />
                <div />
                <Select label="Start Month" value={job.startMonth} onChange={v => updateJob(i, "startMonth", v)} options={MONTHS} placeholder="Month" />
                <Select label="Start Year" value={job.startYear} onChange={v => updateJob(i, "startYear", v)} options={YEARS} placeholder="Year" />
                {!job.current && <>
                  <Select label="End Month" value={job.endMonth} onChange={v => updateJob(i, "endMonth", v)} options={MONTHS} placeholder="Month" />
                  <Select label="End Year" value={job.endYear} onChange={v => updateJob(i, "endYear", v)} options={YEARS} placeholder="Year" />
                </>}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, cursor: "pointer" }}>
                <input type="checkbox" checked={job.current} onChange={e => updateJob(i, "current", e.target.checked)} style={{ width: 16, height: 16, accentColor: C.blue }} />
                <span style={{ fontSize: 14, color: C.slate }}>I currently work here</span>
              </label>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.slate, textTransform: "uppercase", letterSpacing: 0.7 }}>Key Achievements (up to 3 bullet points)</label>
                  <button type="button" onClick={() => generateBullets(i)} disabled={generatingIdx === i}
                    style={{ padding: "5px 14px", border: `1.5px solid ${C.purple}`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: generatingIdx === i ? "not-allowed" : "pointer", background: generatingIdx === i ? "#e5e7eb" : "rgba(139,92,246,0.06)", color: generatingIdx === i ? C.gray : C.purple, fontFamily: "'Inter', sans-serif", transition: "all 0.2s" }}>
                    {generatingIdx === i ? "Generating..." : "✨ Generate with AI"}
                  </button>
                </div>
                <p style={{ margin: "0 0 10px", fontSize: 12, color: C.gray }}>Start with action verbs: "Led...", "Built...", "Increased...", "Managed..." — AI will polish these. Or click Generate with AI to auto-fill.</p>
                {job.bullets.map((b, bi) => (
                  <input key={bi} type="text" value={b} onChange={e => updateBullet(i, bi, e.target.value)}
                    placeholder={`Achievement ${bi + 1}...`}
                    style={{ width: "100%", padding: "10px 14px", background: C.white, border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, color: C.slate, fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
                ))}
              </div>
            </div>
          ))}
          <button onClick={addJob} style={{ width: "100%", padding: "14px", border: "1.5px dashed #D1D5DB", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", background: C.white, color: C.gray, fontFamily: "'Inter', sans-serif", marginBottom: 8 }}>
            + Add Another Position
          </button>
        </>
      )}

      <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Add Education & Skills →" disabled={!noExperience && (!jobs[0]?.title || !jobs[0]?.company)} />
    </PageShell>
  );

  if (step === 3) return (
    <PageShell step={3} totalSteps={4} title="Education & Skills" subtitle="Add your highest education and the skills that make you stand out.">
      <h3 style={{ fontSize: 16, fontWeight: 700, color: C.slate, fontFamily: "'Montserrat', sans-serif", marginBottom: 16 }}>Education</h3>
      {education.map((edu, i) => (
        <div key={i} style={{ padding: "20px 24px", background: C.white, border: "1.5px solid #E5E7EB", borderRadius: 14, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.slate }}>Education {i + 1}</span>
            {education.length > 1 && <button onClick={() => removeEdu(i)} style={{ padding: "4px 12px", border: "1px solid #FECACA", borderRadius: 6, fontSize: 12, cursor: "pointer", background: "#FEF2F2", color: "#EF4444", fontFamily: "'Inter', sans-serif" }}>Remove</button>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <Select label="Degree Type" value={edu.degree} onChange={v => updateEdu(i, "degree", v)} options={["High School Diploma / GED", "Associate's Degree", "Bachelor's Degree", "Master's Degree", "MBA", "Doctorate (PhD)", "Professional Degree (JD/MD)", "Certificate / Diploma", "Bootcamp", "Some College (No Degree)"]} placeholder="Select degree..." />
            <Input label="Field of Study" value={edu.field} onChange={v => updateEdu(i, "field", v)} placeholder="Computer Science" />
            <Input label="School / University *" value={edu.school} onChange={v => updateEdu(i, "school", v)} placeholder="University of Illinois" />
            <Select label="Graduation Year" value={edu.gradYear} onChange={v => updateEdu(i, "gradYear", v)} options={YEARS} placeholder="Year" />
            <Input label="GPA (optional)" value={edu.gpa} onChange={v => updateEdu(i, "gpa", v)} placeholder="3.8" />
          </div>
        </div>
      ))}
      <button onClick={addEdu} style={{ width: "100%", padding: "12px", border: "1.5px dashed #D1D5DB", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", background: C.white, color: C.gray, fontFamily: "'Inter', sans-serif", marginBottom: 32 }}>
        + Add Another Degree or Certification
      </button>

      <h3 style={{ fontSize: 16, fontWeight: 700, color: C.slate, fontFamily: "'Montserrat', sans-serif", marginBottom: 16 }}>Skills & Expertise</h3>
      <Textarea label="Technical Skills *" value={skills.technical} onChange={v => setSkills(p => ({ ...p, technical: v }))} placeholder="Python, JavaScript, SQL, Excel, Salesforce, AutoCAD..." hint="List the tools, platforms, and technologies you know" />
      <Textarea label="Soft Skills" value={skills.soft} onChange={v => setSkills(p => ({ ...p, soft: v }))} placeholder="Leadership, project management, public speaking, team collaboration..." rows={2} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Textarea label="Languages" value={skills.languages} onChange={v => setSkills(p => ({ ...p, languages: v }))} placeholder="English (native), Spanish (conversational)..." rows={2} />
        <Textarea label="Certifications & Licenses" value={skills.certs} onChange={v => setSkills(p => ({ ...p, certs: v }))} placeholder="PMP, AWS Solutions Architect, CPA, Series 7..." rows={2} />
      </div>

      <NavButtons onBack={() => setStep(2)} onNext={() => setStep(4)} nextLabel="Career Goals →" disabled={!education[0]?.school || !skills.technical} />
    </PageShell>
  );

  if (step === 4) return (
    <PageShell step={4} totalSteps={4} title="Your Career Goals" subtitle="Help AI tailor your resume to the right opportunities from day one.">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
        <Input label="Target Job Title *" value={goals.targetTitle} onChange={v => setGoals(p => ({ ...p, targetTitle: v }))} placeholder="Senior Product Manager" />
        <Input label="Target Industry" value={goals.targetIndustry} onChange={v => setGoals(p => ({ ...p, targetIndustry: v }))} placeholder="Technology, Healthcare, Finance..." />
        <Select label="Years of Experience" value={goals.careerLevel} onChange={v => setGoals(p => ({ ...p, careerLevel: v }))} options={["0–2 years", "3–5 years", "6–10 years", "11–20 years", "20+ years"]} placeholder="Select level..." />
        <Select label="Employment Type" value={goals.workType} onChange={v => setGoals(p => ({ ...p, workType: v }))} options={["Full-Time", "Part-Time", "Contract / Freelance", "Internship", "Temporary"]} placeholder="Select type..." />
        <Select label="Work Arrangement" value={goals.arrangement} onChange={v => setGoals(p => ({ ...p, arrangement: v }))} options={["On-site", "Remote", "Hybrid", "Open to Any"]} placeholder="Select arrangement..." />
        <div />
        <Input label="Minimum Salary ($)" value={goals.salaryMin} onChange={v => setGoals(p => ({ ...p, salaryMin: v }))} placeholder="75000" type="number" />
        <Input label="Maximum Salary ($)" value={goals.salaryMax} onChange={v => setGoals(p => ({ ...p, salaryMax: v }))} placeholder="120000" type="number" />
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginTop: 8, marginBottom: 32, padding: "14px 20px", background: C.white, border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <input type="checkbox" checked={goals.openToRelocation} onChange={e => setGoals(p => ({ ...p, openToRelocation: e.target.checked }))} style={{ width: 18, height: 18, accentColor: C.blue, flexShrink: 0 }} />
        <span style={{ fontSize: 15, color: C.slate }}>I am open to relocation</span>
      </label>

      <div style={{ padding: "20px 24px", background: "#EFF6FF", border: `1px solid ${C.blue}30`, borderRadius: 14, marginBottom: 8 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.slate, fontFamily: "'Montserrat', sans-serif", marginBottom: 8 }}>✨ What happens next</h4>
        <p style={{ margin: 0, fontSize: 14, color: C.gray, lineHeight: 1.7 }}>
          AI will use everything you've provided to generate a complete, professionally formatted resume — tailored to your career level and target role. You'll see a before/after score comparison and a full preview before proceeding to your profile setup.
        </p>
      </div>

      <NavButtons onBack={() => setStep(3)} onNext={handleFinish} nextLabel="Build My Resume →" disabled={!goals.targetTitle} />
    </PageShell>
  );

  return null;
}
