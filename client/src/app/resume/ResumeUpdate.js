import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const C = { blue: "#2F6DF6", aqua: "#00C4CC", slate: "#2C2F38", gray: "#9FA6B2", lightBg: "#F9FAFB", white: "#FFFFFF", green: "#10B981" };

const EMPTY_JOB = { title: "", company: "", startMonth: "", startYear: "", endMonth: "", endYear: "", current: false, description: "" };
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i));

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
      {/* Progress */}
      <div style={{ height: 4, background: "#E5E7EB" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.aqua})`, transition: "width 0.4s ease" }} />
      </div>
      <main style={{ flex: 1, padding: "48px 48px 80px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ maxWidth: 720, width: "100%" }}>
          <div style={{ marginBottom: 36, textAlign: "center" }}>
            <div style={{ display: "inline-block", padding: "5px 16px", borderRadius: 20, background: "#EFF6FF", border: `1px solid ${C.blue}30`, marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.aqua, letterSpacing: 1 }}>UPDATE RESUME — STEP {step} OF {totalSteps}</span>
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
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.slate, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "12px 16px", background: C.white, border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 15, color: C.slate, fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
        onFocus={e => e.target.style.borderColor = C.blue}
        onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
      {hint && <p style={{ margin: "6px 0 0", fontSize: 12, color: C.gray }}>{hint}</p>}
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.slate, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width: "100%", padding: "12px 16px", background: C.white, border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 15, color: C.slate, fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box", resize: "vertical", transition: "border-color 0.2s" }}
        onFocus={e => e.target.style.borderColor = C.blue}
        onBlur={e => e.target.style.borderColor = "#E5E7EB"} />
    </div>
  );
}

function NavButtons({ onBack, onNext, nextLabel = "Continue →", disabled = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40 }}>
      {onBack ? (
        <button onClick={onBack} style={{ padding: "12px 28px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", background: C.white, color: C.slate, fontFamily: "'Inter', sans-serif" }}>← Back</button>
      ) : <div />}
      <button onClick={onNext} disabled={disabled}
        style={{ padding: "14px 48px", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#E5E7EB" : C.blue, color: disabled ? C.gray : C.white, fontFamily: "'Inter', sans-serif", boxShadow: disabled ? "none" : `0 4px 16px ${C.blue}40`, transition: "all 0.2s" }}>
        {nextLabel}
      </button>
    </div>
  );
}

export default function ResumeUpdate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [contact, setContact] = useState({ name: "", email: "", phone: "", location: "", linkedin: "" });
  const [changes, setChanges] = useState({ newJobs: [], newSkills: "", newEducation: "", newCerts: "", summary: "" });
  const [newJob, setNewJob] = useState({ ...EMPTY_JOB });
  const [confirmed, setConfirmed] = useState(false);

  const handleFileUpload = async (f) => {
    setFile(f);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", f);
      const res = await fetch("/api/resume/parse", { method: "POST", body: formData });
      const result = await res.json();
      if (res.ok && result.data) {
        localStorage.setItem("talendro_resume_raw", JSON.stringify(result.data));
        const s1 = result.data.s1 || {};
        setContact(prev => ({
          name: s1.firstName ? `${s1.firstName} ${s1.lastName || ""}`.trim() : prev.name,
          email: s1.email || prev.email,
          phone: s1.phone || prev.phone,
          location: s1.city ? `${s1.city}, ${s1.state || ""}`.trim().replace(/,$/, "") : prev.location,
          linkedin: s1.linkedin || prev.linkedin,
        }));
      }
    } catch (e) { /* continue without parse */ }
    setUploading(false);
  };

  const addNewJob = () => {
    if (!newJob.title || !newJob.company) return;
    setChanges(prev => ({ ...prev, newJobs: [...prev.newJobs, { ...newJob }] }));
    setNewJob({ ...EMPTY_JOB });
  };

  const removeJob = (i) => setChanges(prev => ({ ...prev, newJobs: prev.newJobs.filter((_, idx) => idx !== i) }));

  const handleFinish = () => {
    const updateData = { path: "update", contact, changes, file: file?.name };
    localStorage.setItem("talendro_resume_update", JSON.stringify(updateData));
    localStorage.setItem("talendro_resume_path", "update");
    navigate("/app/resume/optimize");
  };

  const selectStyle = { width: "100%", padding: "10px 12px", background: C.white, border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, color: C.slate, fontFamily: "'Inter', sans-serif" };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 600, color: C.slate, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6 };

  if (step === 1) return (
    <PageShell step={1} totalSteps={3} title="Upload Your Current Resume" subtitle="Even if it's outdated — we'll use it as a starting point and update it together.">
      <div style={{ border: `2px dashed ${file ? C.green : "#D1D5DB"}`, borderRadius: 16, padding: "40px", textAlign: "center", background: file ? "#F0FDF4" : C.white, marginBottom: 28, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <input type="file" id="resume-file" accept=".pdf,.doc,.docx,.txt" style={{ display: "none" }} onChange={e => e.target.files[0] && handleFileUpload(e.target.files[0])} />
        <label htmlFor="resume-file" style={{ cursor: "pointer" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{uploading ? "⚙️" : file ? "✅" : "📄"}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.slate, marginBottom: 4 }}>
            {uploading ? "Parsing resume..." : file ? file.name : "Click to upload your resume"}
          </div>
          <div style={{ fontSize: 13, color: C.gray }}>{file ? "File uploaded" : "PDF, Word, or text — we'll extract what we can"}</div>
        </label>
      </div>

      <div style={{ marginBottom: 24, padding: "14px 20px", background: "#EFF6FF", border: `1px solid ${C.blue}30`, borderRadius: 10 }}>
        <p style={{ margin: 0, fontSize: 14, color: C.slate }}>💡 <strong>No resume file?</strong> That's OK — skip the upload and fill in your contact info below. We'll build from your answers.</p>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, color: C.slate, fontFamily: "'Montserrat', sans-serif", marginBottom: 16 }}>Confirm Your Contact Information</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Input label="Full Name" value={contact.name} onChange={v => setContact(p => ({ ...p, name: v }))} placeholder="Jane Smith" />
        <Input label="Email" value={contact.email} onChange={v => setContact(p => ({ ...p, email: v }))} placeholder="jane@email.com" type="email" />
        <Input label="Phone" value={contact.phone} onChange={v => setContact(p => ({ ...p, phone: v }))} placeholder="(555) 123-4567" />
        <Input label="City, State" value={contact.location} onChange={v => setContact(p => ({ ...p, location: v }))} placeholder="Chicago, IL" />
        <div style={{ gridColumn: "1 / -1" }}>
          <Input label="LinkedIn URL" value={contact.linkedin} onChange={v => setContact(p => ({ ...p, linkedin: v }))} placeholder="linkedin.com/in/janesmith" hint="Increases interview rate by 40% — highly recommended" />
        </div>
      </div>

      <NavButtons onNext={() => setStep(2)} nextLabel="Continue to What's Changed →" disabled={!contact.name || !contact.email} />
    </PageShell>
  );

  if (step === 2) return (
    <PageShell step={2} totalSteps={3} title="What's Changed?" subtitle="Tell us what's new since your last resume. Add as much or as little as you know.">
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.slate, fontFamily: "'Montserrat', sans-serif", marginBottom: 4 }}>New Positions</h3>
        <p style={{ fontSize: 14, color: C.gray, marginBottom: 16 }}>Add any jobs you've held since your last resume was updated.</p>

        {changes.newJobs.map((job, i) => (
          <div key={i} style={{ padding: "16px 20px", background: "#F0FDF4", border: "1px solid #D1FAE5", borderRadius: 12, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.slate }}>{job.title}</div>
              <div style={{ fontSize: 13, color: C.gray }}>{job.company} · {job.startMonth} {job.startYear} – {job.current ? "Present" : `${job.endMonth} ${job.endYear}`}</div>
            </div>
            <button onClick={() => removeJob(i)} style={{ padding: "6px 14px", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "#FEF2F2", color: "#EF4444", fontFamily: "'Inter', sans-serif" }}>Remove</button>
          </div>
        ))}

        <div style={{ padding: "20px 24px", background: C.white, border: "1.5px dashed #D1D5DB", borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Input label="Job Title" value={newJob.title} onChange={v => setNewJob(p => ({ ...p, title: v }))} placeholder="Senior Software Engineer" />
            <Input label="Company" value={newJob.company} onChange={v => setNewJob(p => ({ ...p, company: v }))} placeholder="Acme Corp" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Start Month</label>
              <select value={newJob.startMonth} onChange={e => setNewJob(p => ({ ...p, startMonth: e.target.value }))} style={selectStyle}>
                <option value="">Month</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Start Year</label>
              <select value={newJob.startYear} onChange={e => setNewJob(p => ({ ...p, startYear: e.target.value }))} style={selectStyle}>
                <option value="">Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {!newJob.current && <>
              <div>
                <label style={labelStyle}>End Month</label>
                <select value={newJob.endMonth} onChange={e => setNewJob(p => ({ ...p, endMonth: e.target.value }))} style={selectStyle}>
                  <option value="">Month</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>End Year</label>
                <select value={newJob.endYear} onChange={e => setNewJob(p => ({ ...p, endYear: e.target.value }))} style={selectStyle}>
                  <option value="">Year</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </>}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={newJob.current} onChange={e => setNewJob(p => ({ ...p, current: e.target.checked }))} style={{ width: 16, height: 16, accentColor: C.blue }} />
            <span style={{ fontSize: 14, color: C.slate }}>I currently work here</span>
          </label>
          <Textarea label="Key Responsibilities & Achievements (optional)" value={newJob.description} onChange={v => setNewJob(p => ({ ...p, description: v }))} placeholder="Describe your main responsibilities and any notable achievements..." rows={3} />
          <button onClick={addNewJob} disabled={!newJob.title || !newJob.company}
            style={{ padding: "10px 28px", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: !newJob.title || !newJob.company ? "not-allowed" : "pointer", background: !newJob.title || !newJob.company ? "#E5E7EB" : C.blue, color: !newJob.title || !newJob.company ? C.gray : C.white, fontFamily: "'Inter', sans-serif" }}>
            + Add This Position
          </button>
        </div>
      </div>

      <Textarea label="New Skills or Technologies" value={changes.newSkills} onChange={v => setChanges(p => ({ ...p, newSkills: v }))} placeholder="e.g., React, Kubernetes, Salesforce, PMP certification..." rows={2} />
      <Textarea label="New Education or Training" value={changes.newEducation} onChange={v => setChanges(p => ({ ...p, newEducation: v }))} placeholder="e.g., MBA from Northwestern, AWS Solutions Architect certification..." rows={2} />
      <Textarea label="Anything Else to Add or Change?" value={changes.summary} onChange={v => setChanges(p => ({ ...p, summary: v }))} placeholder="e.g., Changed industries, relocated, took a career break, updated career objective..." rows={3} />

      <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Review & Confirm →" />
    </PageShell>
  );

  if (step === 3) return (
    <PageShell step={3} totalSteps={3} title="Review Your Updates" subtitle="Confirm everything looks right before AI builds your optimized resume.">
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
        <SummaryCard icon="👤" title="Contact Information" items={[
          contact.name, contact.email, contact.phone, contact.location, contact.linkedin
        ].filter(Boolean)} onEdit={() => setStep(1)} />
        <SummaryCard icon="💼" title={`New Positions (${changes.newJobs.length})`}
          items={changes.newJobs.map(j => `${j.title} at ${j.company}`)}
          empty="No new positions added"
          onEdit={() => setStep(2)} />
        {changes.newSkills && <SummaryCard icon="⚡" title="New Skills" items={[changes.newSkills]} onEdit={() => setStep(2)} />}
        {changes.newEducation && <SummaryCard icon="🎓" title="New Education" items={[changes.newEducation]} onEdit={() => setStep(2)} />}
        {changes.summary && <SummaryCard icon="📝" title="Additional Notes" items={[changes.summary]} onEdit={() => setStep(2)} />}
      </div>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 14, cursor: "pointer", padding: "16px 20px", background: "#EFF6FF", border: `1px solid ${C.blue}30`, borderRadius: 12, marginBottom: 32 }}>
        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: C.blue, flexShrink: 0 }} />
        <span style={{ fontSize: 14, color: C.slate, lineHeight: 1.6 }}>
          I confirm this information is accurate. I authorize Talendro to use it to create and optimize my professional resume.
        </span>
      </label>

      <NavButtons onBack={() => setStep(2)} onNext={handleFinish} nextLabel="Build My Optimized Resume →" disabled={!confirmed} />
    </PageShell>
  );

  return null;
}

function SummaryCard({ icon, title, items, empty, onEdit }) {
  return (
    <div style={{ padding: "20px 24px", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#2C2F38", fontFamily: "'Montserrat', sans-serif" }}>{title}</span>
        </div>
        <button onClick={onEdit} style={{ padding: "5px 14px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 12, cursor: "pointer", background: "#F9FAFB", color: "#2C2F38", fontFamily: "'Inter', sans-serif" }}>Edit</button>
      </div>
      {items.length > 0
        ? items.map((item, i) => <div key={i} style={{ fontSize: 14, color: "#9FA6B2", paddingLeft: 30, marginBottom: 4 }}>• {item}</div>)
        : <div style={{ fontSize: 14, color: "#D1D5DB", paddingLeft: 30, fontStyle: "italic" }}>{empty}</div>}
    </div>
  );
}
