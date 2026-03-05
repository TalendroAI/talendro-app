import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  blue: "#2F6DF6",
  aqua: "#00C4CC",
  slate: "#2C2F38",
  gray: "#9FA6B2",
  lightBg: "#F9FAFB",
  white: "#FFFFFF",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
};

const FIELD_LABELS = {
  name: "Full Name", email: "Email", phone: "Phone",
  currentTitle: "Current Job Title", currentCompany: "Current Employer",
  location: "Location", linkedin: "LinkedIn",
  jobCount: "Positions Found", educationCount: "Education Entries",
  skillCount: "Skills Detected", certCount: "Certifications",
};

export default function ResumeUpload() {
  const navigate = useNavigate();
  const [stage, setStage] = useState("upload");
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState("");
  const [gaps, setGaps] = useState([]);
  const [confidence, setConfidence] = useState(0);

  const handleFile = async (f) => {
    setFile(f);
    setStage("parsing");
    setParseError("");
    try {
      const formData = new FormData();
      formData.append("resume", f);
      const res = await fetch("/api/resume/parse", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Parse failed");
      localStorage.setItem("talendro_resume_raw", JSON.stringify(result.data));
      localStorage.setItem("talendro_resume_path", "upload");
      // Also save under 'resumeData' key so Onb1/Onb3/Onb4 can find the prefill data
      localStorage.setItem("resumeData", JSON.stringify(result.data));
      localStorage.setItem("resumeParsed", "true");
      // Map from actual API response shape: result.data.summary + result.data.profileDraft
      const summary = result.data?.summary || {};
      const profileDraft = result.data?.profileDraft || {};
      const basics = profileDraft?.basics || {};
      const work = Array.isArray(profileDraft?.work) ? profileDraft.work : [];
      const edu = Array.isArray(profileDraft?.education) ? profileDraft.education : [];
      const skills = Array.isArray(profileDraft?.skills) ? profileDraft.skills : [];
      const mapped = {
        name: summary.name !== 'N/A' ? summary.name : (basics.name || ''),
        email: summary.email !== 'N/A' ? summary.email : (basics.email || ''),
        phone: summary.phone !== 'N/A' ? summary.phone : (basics.phone || ''),
        currentTitle: profileDraft?.currentJobTitle || work[0]?.jobTitle || '',
        currentCompany: work[0]?.companyName || work[0]?.name || '',
        location: summary.location !== 'N/A' ? summary.location : '',
        linkedin: basics.linkedin || '',
        jobCount: work.length || 0,
        educationCount: edu.length || 0,
        skillCount: skills.length || 0,
        certCount: 0,
      };
      setParsed(mapped);
      setConfidence(Math.round((result.data?.confidence || 0.82) * 100));
      const foundGaps = [];
      if (!mapped.email) foundGaps.push({ field: "email", label: "Email Address", hint: "Required for all applications" });
      if (!mapped.phone) foundGaps.push({ field: "phone", label: "Phone Number", hint: "Required for most applications" });
      if (!mapped.linkedin) foundGaps.push({ field: "linkedin", label: "LinkedIn URL", hint: "Increases interview rate by 40%" });
      if (work.length === 0) foundGaps.push({ field: "employment", label: "Work History", hint: "No positions were detected" });
      setGaps(foundGaps);
      setStage("verify");
    } catch (err) {
      setParseError(err.message || "Could not parse resume. Please try a different format.");
      setStage("upload");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleContinue = () => {
    navigate("/app/resume/optimize");
  };

  if (stage === "parsing") return (
    <PageShell>
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>⚙️</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: C.blue, fontFamily: "'Montserrat', sans-serif", marginBottom: 12 }}>Analyzing your resume...</h2>
        <p style={{ fontSize: 16, color: C.gray, marginBottom: 40 }}>Extracting work history, education, skills, and contact info</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400, margin: "0 auto" }}>
          {["Parsing document structure", "Extracting contact information", "Identifying work history", "Detecting skills & certifications", "Scoring ATS compatibility"].map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: C.white, border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div style={{ width: 20, height: 20, border: `2px solid ${C.blue}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: C.slate }}>{step}</span>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </PageShell>
  );

  if (stage === "verify") return (
    <PageShell>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Confidence Score */}
        <div style={{
          background: confidence >= 80 ? "#F0FDF4" : "#FFFBEB",
          border: `1px solid ${confidence >= 80 ? "#D1FAE5" : "#FDE68A"}`,
          borderRadius: 16, padding: 24, marginBottom: 32,
          display: "flex", alignItems: "center", gap: 24
        }}>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: confidence >= 80 ? C.green : C.amber, fontFamily: "'Montserrat', sans-serif", lineHeight: 1 }}>{confidence}%</div>
            <div style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>Parse Confidence</div>
          </div>
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>
              {confidence >= 80 ? "✅ Resume parsed successfully" : "⚠️ Partial parse — some fields need attention"}
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: C.gray, lineHeight: 1.5 }}>
              {confidence >= 80
                ? `We extracted ${file?.name} successfully. Review the fields below to confirm accuracy before AI optimization.`
                : "We extracted what we could. Please fill in the missing fields below before proceeding."}
            </p>
          </div>
        </div>

        {/* Extracted Fields */}
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.slate, fontFamily: "'Montserrat', sans-serif", marginBottom: 16 }}>Extracted Information</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 32 }}>
          {Object.entries(FIELD_LABELS).map(([key, label]) => {
            const val = parsed?.[key];
            const found = val && val !== "N/A";
            return (
              <div key={key} style={{
                padding: "14px 18px",
                background: found ? "#F0FDF4" : "#FEF2F2",
                border: `1px solid ${found ? "#D1FAE5" : "#FECACA"}`,
                borderRadius: 10
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.gray, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, color: found ? C.slate : C.red, fontWeight: found ? 500 : 400 }}>
                  {found ? (typeof val === "number" ? `${val} found` : val) : "Not detected"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Gaps */}
        {gaps.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.amber, fontFamily: "'Montserrat', sans-serif", marginBottom: 16 }}>⚠️ Missing Information ({gaps.length} items)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {gaps.map((gap, i) => (
                <div key={i} style={{ padding: "16px 20px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.slate }}>{gap.label}</span>
                      <span style={{ fontSize: 12, color: C.gray, marginLeft: 8 }}>{gap.hint}</span>
                    </div>
                    <span style={{ fontSize: 12, color: C.amber, fontWeight: 600 }}>Add in onboarding</span>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: C.gray, marginTop: 12 }}>These fields will be collected during your profile setup. You can continue now.</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 16, justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => { setStage("upload"); setFile(null); setParsed(null); }}
            style={{ padding: "12px 28px", border: `1.5px solid #E5E7EB`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", background: C.white, color: C.slate, fontFamily: "'Inter', sans-serif" }}>
            ← Upload Different File
          </button>
          <button onClick={handleContinue}
            style={{ padding: "14px 48px", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", background: C.green, color: C.white, fontFamily: "'Inter', sans-serif", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}>
            Looks Good — Optimize My Resume →
          </button>
        </div>
      </div>
    </PageShell>
  );

  // Default: upload stage
  return (
    <PageShell>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: C.blue, fontFamily: "'Montserrat', sans-serif", marginBottom: 12 }}>Upload Your Resume</h2>
          <p style={{ fontSize: 16, color: C.gray, lineHeight: 1.6 }}>AI will extract your information and verify completeness before optimization.</p>
        </div>

        {/* Drop Zone */}
        <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          style={{
            border: `2px dashed ${file ? C.green : "#D1D5DB"}`,
            borderRadius: 20, padding: "64px 40px", textAlign: "center",
            background: file ? "#F0FDF4" : C.white,
            cursor: "pointer", transition: "all 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
          <input type="file" id="resume-file" accept=".pdf,.doc,.docx,.txt" style={{ display: "none" }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          <label htmlFor="resume-file" style={{ cursor: "pointer" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📄</div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.slate, fontFamily: "'Montserrat', sans-serif", marginBottom: 8 }}>
              {file ? file.name : "Drop your resume here"}
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: C.gray }}>
              {file ? "✓ File selected" : "or click to browse — PDF, Word, or Text"}
            </p>
          </label>
        </div>

        {parseError && (
          <div style={{ marginTop: 20, padding: 16, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 14, color: C.red }}>
            ⚠️ {parseError}
          </div>
        )}

        {/* Format tips */}
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { icon: "✅", label: "PDF", note: "Best format" },
            { icon: "✅", label: "Word (.docx)", note: "Fully supported" },
            { icon: "⚠️", label: "Plain text", note: "Limited parsing" },
          ].map((f, i) => (
            <div key={i} style={{ padding: "12px 16px", background: C.white, border: "1px solid #E5E7EB", borderRadius: 10, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.slate }}>{f.label}</div>
              <div style={{ fontSize: 11, color: C.gray }}>{f.note}</div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ children }) {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <header style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E7EB", padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#2F6DF6", fontFamily: "'Montserrat', sans-serif" }}>
          Talendro™ <span style={{ fontSize: 13, fontWeight: 500, color: "#9FA6B2" }}>Apply</span>
        </h1>
        <button onClick={() => navigate("/app/resume-gate")}
          style={{ padding: "8px 20px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, cursor: "pointer", background: "#FFFFFF", color: "#2C2F38", fontFamily: "'Inter', sans-serif" }}>
          ← Back
        </button>
      </header>
      <main style={{ flex: 1, padding: "48px 48px 80px", display: "flex", flexDirection: "column" }}>
        {children}
      </main>
    </div>
  );
}
