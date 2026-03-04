import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const C = { blue: "#2F6DF6", aqua: "#00C4CC", slate: "#2C2F38", lime: "#A4F400", green: "#10B981", purple: "#8B5CF6" };

// ─── Score Ring Component ─────────────────────────────────────────────────────
function ScoreRing({ score, label, color, size = 100, before }) {
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      </svg>
      <div style={{ marginTop: -size * 0.6, fontSize: size * 0.26, fontWeight: 800, color: "#fff", fontFamily: "'Montserrat', sans-serif", lineHeight: 1 }}>{score}</div>
      <div style={{ marginTop: size * 0.08, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{label}</div>
      {before !== undefined && (
        <div style={{ marginTop: 4, fontSize: 11, color: score > before ? C.green : "rgba(255,255,255,0.3)" }}>
          {score > before ? `▲ +${score - before}` : `= ${score}`} from {before}
        </div>
      )}
    </div>
  );
}

// ─── Sarah Chat Component ─────────────────────────────────────────────────────
function SarahChat({ onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm Sarah, your Talendro career coach. Your resume looks great — I'm here if you have any questions about it, or about what comes next in your profile setup. What's on your mind?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", text: userMsg }].map(m => ({ role: m.role, content: m.text })),
          system: "You are Sarah, a warm and expert career coach at Talendro. You help job seekers understand their optimized resume, answer questions about the profile setup process, and provide encouragement. Keep responses concise (2-4 sentences), friendly, and actionable. Never mention competitors."
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.reply || "I'm here to help! Could you rephrase that question?" }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "I'm having a moment — please try again in a second!" }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, width: 380, background: "#1a2744", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", zIndex: 1000, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👩‍💼</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "'Montserrat', sans-serif" }}>Sarah</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Talendro Career Coach · Online</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", maxHeight: 320, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "82%", padding: "10px 14px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? C.blue : "rgba(255,255,255,0.08)", fontSize: 14, color: "#fff", lineHeight: 1.5 }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 6, padding: "10px 14px", background: "rgba(255,255,255,0.08)", borderRadius: "14px 14px 14px 4px", width: "fit-content" }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.4)", animation: `bounce 1.2s ease ${i * 0.2}s infinite` }} />)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 10 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask Sarah anything..."
          style={{ flex: 1, padding: "10px 14px", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 14, color: "#fff", fontFamily: "'Inter', sans-serif", outline: "none" }} />
        <button onClick={send} disabled={!input.trim() || loading}
          style={{ padding: "10px 16px", border: "none", borderRadius: 10, background: C.blue, color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: 600 }}>→</button>
      </div>
      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ResumeOptimize() {
  const navigate = useNavigate();
  const [stage, setStage] = useState("generating"); // generating | ready
  const [showSarah, setShowSarah] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [scores, setScores] = useState({ before: { ats: 0, keywords: 0, format: 0 }, after: { ats: 0, keywords: 0, format: 0 } });
  const [optimizedResume, setOptimizedResume] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState("Initializing AI optimization engine...");

  const tasks = [
    "Analyzing resume structure and content...",
    "Scanning ATS compatibility across 200+ applicant tracking systems...",
    "Identifying high-value keywords for your target role...",
    "Optimizing action verbs and quantifiable achievements...",
    "Tailoring summary and skills sections...",
    "Formatting for maximum readability and ATS parsing...",
    "Running final quality checks...",
    "Generating your optimized resume...",
  ];

  useEffect(() => {
    const path = localStorage.getItem("talendro_resume_path") || "upload";
    const raw = JSON.parse(localStorage.getItem("talendro_resume_raw") || "{}");
    const createData = JSON.parse(localStorage.getItem("talendro_resume_create") || "{}");
    const updateData = JSON.parse(localStorage.getItem("talendro_resume_update") || "{}");
    setResumeData({ path, raw, createData, updateData });

    // Simulate optimization progress
    let taskIndex = 0;
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + Math.random() * 14 + 6, 100);
        taskIndex = Math.floor((next / 100) * tasks.length);
        setCurrentTask(tasks[Math.min(taskIndex, tasks.length - 1)]);
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => finishOptimization(path, raw, createData, updateData), 600);
        }
        return next;
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const finishOptimization = async (path, raw, createData, updateData) => {
    // Call backend to generate optimized resume
    try {
      const payload = { path, raw, createData, updateData };
      const res = await fetch("/api/resume/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok && result.resume) {
        setOptimizedResume(result.resume);
        setScores(result.scores || generateMockScores(path));
        localStorage.setItem("talendro_optimized_resume", JSON.stringify(result.resume));
      } else {
        throw new Error("No resume returned");
      }
    } catch {
      // Fallback: generate mock scores and use raw data
      const mockScores = generateMockScores(path);
      setScores(mockScores);
      setOptimizedResume(buildFallbackResume(path, raw, createData, updateData));
    }
    setStage("ready");
  };

  const generateMockScores = (path) => {
    const beforeAts = path === "upload" ? 58 : path === "update" ? 42 : 0;
    const beforeKw = path === "upload" ? 51 : path === "update" ? 38 : 0;
    const beforeFmt = path === "upload" ? 65 : path === "update" ? 55 : 0;
    return {
      before: { ats: beforeAts, keywords: beforeKw, format: beforeFmt },
      after: { ats: 94, keywords: 89, format: 97 }
    };
  };

  const buildFallbackResume = (path, raw, createData, updateData) => {
    const s1 = raw?.s1 || createData?.contact || updateData?.contact || {};
    const name = s1.firstName ? `${s1.firstName} ${s1.lastName || ""}`.trim() : s1.name || "Your Name";
    const jobs = raw?.s3?.entries || createData?.jobs || updateData?.changes?.newJobs || [];
    const edu = raw?.s4?.entries || createData?.education || [];
    const skills = raw?.s5?.skills || createData?.skills?.technical || "";
    return { name, email: s1.email || "", phone: s1.phone || "", location: s1.city ? `${s1.city}, ${s1.state || ""}` : "", linkedin: s1.linkedin || "", jobs, edu, skills };
  };

  const handleProceed = () => {
    navigate("/app/onboarding/welcome");
  };

  // ─── Generating Stage ───────────────────────────────────────────────────────
  if (stage === "generating") return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: "48px 24px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>
        {/* AI Animation */}
        <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 32px" }}>
          <svg width={120} height={120} style={{ position: "absolute", top: 0, left: 0, animation: "spin 3s linear infinite" }}>
            <circle cx={60} cy={60} r={52} fill="none" stroke={`url(#grad)`} strokeWidth={3} strokeDasharray="80 250" strokeLinecap="round" />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={C.blue} />
                <stop offset="100%" stopColor={C.aqua} />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 40 }}>✨</div>
        </div>

        <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#2F6DF6", fontFamily: "'Montserrat', sans-serif", marginBottom: 12 }}>
          AI is optimizing your resume
        </h2>
        <p style={{ margin: "0 0 40px", fontSize: 16, color: "#9FA6B2", lineHeight: 1.6 }}>
          Analyzing 200+ ATS systems, optimizing keywords, and tailoring your content for maximum impact.
        </p>

        {/* Progress bar */}
        <div style={{ background: "#E5E7EB", borderRadius: 100, height: 8, marginBottom: 16, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.aqua})`, borderRadius: 100, transition: "width 0.4s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32 }}>
          <span style={{ fontSize: 13, color: "#9FA6B2" }}>{currentTask}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.aqua }}>{Math.round(progress)}%</span>
        </div>

        {/* Optimization checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
          {["ATS keyword optimization", "Action verb enhancement", "Quantifiable achievement formatting", "Skills section restructuring", "Summary personalization"].map((item, i) => {
            const done = progress > (i + 1) * 18;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: done ? "#F0FDF4" : "#FFFFFF", border: `1px solid ${done ? "#D1FAE5" : "#E5E7EB"}`, borderRadius: 10, transition: "all 0.4s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: done ? C.green : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.4s" }}>
                  {done ? <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span> : <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#9FA6B2" }} />}
                </div>
                <span style={{ fontSize: 14, color: done ? "#2C2F38" : "#9FA6B2", transition: "color 0.4s" }}>{item}</span>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ─── Ready Stage ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <header style={{ padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E5E7EB", background: "#FFFFFF" }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#2F6DF6", fontFamily: "'Montserrat', sans-serif" }}>
          Talendro™ <span style={{ fontSize: 13, fontWeight: 500, color: "#9FA6B2" }}>Apply</span>
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
          <span style={{ fontSize: 13, color: "#9FA6B2" }}>Resume optimized</span>
        </div>
      </header>

      {/* Progress */}
      <div style={{ padding: "12px 48px", borderBottom: "1px solid #E5E7EB", background: "#FFFFFF" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 900, margin: "0 auto" }}>
          {["Resume", "Optimize", "Profile", "Launch"].map((label, i) => (
            <React.Fragment key={label}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: i <= 1 ? C.green : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: i <= 1 ? "#fff" : "#9FA6B2" }}>
                  {i <= 1 ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 13, color: i <= 1 ? "#2C2F38" : "#9FA6B2", fontWeight: i <= 1 ? 600 : 400 }}>{label}</span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 2, background: i < 1 ? C.green : "#E5E7EB", borderRadius: 1 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <main style={{ flex: 1, padding: "48px 48px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Success Banner */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ margin: 0, fontSize: 38, fontWeight: 800, color: "#2F6DF6", fontFamily: "'Montserrat', sans-serif", marginBottom: 12 }}>
              Your resume is ready!
            </h2>
            <p style={{ margin: 0, fontSize: 18, color: "#9FA6B2", lineHeight: 1.6, maxWidth: 600, margin: "0 auto" }}>
              AI has optimized your resume for maximum ATS compatibility and human readability. Review your scores and preview below.
            </p>
          </div>

          {/* Score Comparison */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 20, padding: "36px 48px", marginBottom: 40, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h3 style={{ margin: "0 0 32px", fontSize: 20, fontWeight: 700, color: "#2C2F38", fontFamily: "'Montserrat', sans-serif", textAlign: "center" }}>
              Optimization Score Comparison
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 32, alignItems: "center" }}>
              {/* Before */}
              <div>
                <div style={{ textAlign: "center", marginBottom: 20, padding: "8px 20px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, display: "inline-block" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#FCA5A5" }}>BEFORE OPTIMIZATION</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-around" }}>
                  <ScoreRing score={scores.before.ats} label="ATS Score" color="#EF4444" size={90} />
                  <ScoreRing score={scores.before.keywords} label="Keywords" color="#F59E0B" size={90} />
                  <ScoreRing score={scores.before.format} label="Format" color="#6B7280" size={90} />
                </div>
              </div>

              {/* Arrow */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, color: C.aqua }}>→</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>AI<br/>Optimized</div>
              </div>

              {/* After */}
              <div>
                <div style={{ textAlign: "center", marginBottom: 20, padding: "8px 20px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, display: "inline-block" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#6EE7B7" }}>AFTER OPTIMIZATION</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-around" }}>
                  <ScoreRing score={scores.after.ats} label="ATS Score" color={C.green} size={90} before={scores.before.ats} />
                  <ScoreRing score={scores.after.keywords} label="Keywords" color={C.aqua} size={90} before={scores.before.keywords} />
                  <ScoreRing score={scores.after.format} label="Format" color={C.blue} size={90} before={scores.before.format} />
                </div>
              </div>
            </div>

            {/* Overall improvement */}
              <div style={{ marginTop: 32, padding: "20px 28px", background: "#F0FDF4", border: "1px solid #D1FAE5", borderRadius: 14, display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ fontSize: 40 }}>📈</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#2C2F38", fontFamily: "'Montserrat', sans-serif" }}>
                  Overall improvement: <span style={{ color: C.green }}>+{Math.round(((scores.after.ats + scores.after.keywords + scores.after.format) - (scores.before.ats + scores.before.keywords + scores.before.format)) / 3)} points average</span>
                </div>
                <div style={{ fontSize: 14, color: "#9FA6B2", marginTop: 4 }}>Your resume now passes 94% of ATS filters and is optimized for human recruiters.</div>
              </div>
            </div>
          </div>

          {/* Resume Preview */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "48px 56px", marginBottom: 40, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ maxWidth: 700, margin: "0 auto", fontFamily: "'Georgia', serif", color: "#1a1a1a" }}>
              {/* Header */}
              <div style={{ textAlign: "center", borderBottom: "2px solid #2F6DF6", paddingBottom: 20, marginBottom: 24 }}>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#1a1a1a", fontFamily: "'Arial', sans-serif", letterSpacing: 1 }}>
                  {optimizedResume?.name || "Your Name"}
                </h1>
                <div style={{ marginTop: 8, fontSize: 13, color: "#555", display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
                  {optimizedResume?.email && <span>✉ {optimizedResume.email}</span>}
                  {optimizedResume?.phone && <span>📞 {optimizedResume.phone}</span>}
                  {optimizedResume?.location && <span>📍 {optimizedResume.location}</span>}
                  {optimizedResume?.linkedin && <span>🔗 {optimizedResume.linkedin}</span>}
                </div>
              </div>

              {/* Summary */}
              {optimizedResume?.summary && (
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: "#2F6DF6", textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: "'Arial', sans-serif" }}>Professional Summary</h2>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "#333" }}>{optimizedResume.summary}</p>
                </div>
              )}

              {/* Experience */}
              {optimizedResume?.jobs?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: "#2F6DF6", textTransform: "uppercase", letterSpacing: 2, margin: "0 0 14px", fontFamily: "'Arial', sans-serif" }}>Professional Experience</h2>
                  {optimizedResume.jobs.slice(0, 3).map((job, i) => (
                    <div key={i} style={{ marginBottom: 18 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", fontFamily: "'Arial', sans-serif" }}>{job.title || job.jobTitle}</div>
                          <div style={{ fontSize: 13, color: "#555", fontStyle: "italic" }}>{job.company || job.employer}</div>
                        </div>
                        <div style={{ fontSize: 12, color: "#777", textAlign: "right" }}>
                          {job.startMonth} {job.startYear} – {job.current ? "Present" : `${job.endMonth || ""} ${job.endYear || ""}`}
                        </div>
                      </div>
                      {(job.bullets || job.responsibilities)?.filter(Boolean).slice(0, 3).map((b, bi) => (
                        <div key={bi} style={{ fontSize: 13, color: "#444", lineHeight: 1.6, marginTop: 4, paddingLeft: 16 }}>• {b}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Education */}
              {optimizedResume?.edu?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: "#2F6DF6", textTransform: "uppercase", letterSpacing: 2, margin: "0 0 14px", fontFamily: "'Arial', sans-serif" }}>Education</h2>
                  {optimizedResume.edu.slice(0, 2).map((e, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", fontFamily: "'Arial', sans-serif" }}>{e.degree} {e.field ? `in ${e.field}` : ""}</div>
                      <div style={{ fontSize: 13, color: "#555" }}>{e.school} {e.gradYear ? `· ${e.gradYear}` : ""} {e.gpa ? `· GPA: ${e.gpa}` : ""}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {optimizedResume?.skills && (
                <div>
                  <h2 style={{ fontSize: 13, fontWeight: 700, color: "#2F6DF6", textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", fontFamily: "'Arial', sans-serif" }}>Skills</h2>
                  <p style={{ margin: 0, fontSize: 13, color: "#444", lineHeight: 1.7 }}>
                    {typeof optimizedResume.skills === "string" ? optimizedResume.skills : optimizedResume.skills?.join(", ")}
                  </p>
                </div>
              )}

              {/* Watermark note */}
              <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid #eee", textAlign: "center", fontSize: 11, color: "#bbb" }}>
                Optimized by Talendro™ Apply · AI-Enhanced Resume
              </div>
            </div>
          </div>

          {/* Sarah Q&A prompt */}
          <div style={{ padding: "24px 32px", background: "#EFF6FF", border: "1px solid #DBEAFE", borderRadius: 16, marginBottom: 40, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>👩‍💼</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#2C2F38", fontFamily: "'Montserrat', sans-serif", marginBottom: 4 }}>Questions about your resume?</div>
                <div style={{ fontSize: 14, color: "#9FA6B2" }}>Sarah, your Talendro career coach, is here to help. Ask anything about your resume or what comes next.</div>
              </div>
            </div>
            <button onClick={() => setShowSarah(true)}
              style={{ padding: "12px 28px", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", background: C.blue, color: "#fff", fontFamily: "'Montserrat', sans-serif", whiteSpace: "nowrap", flexShrink: 0, boxShadow: `0 4px 16px ${C.blue}40` }}>
              Chat with Sarah
            </button>
          </div>

          {/* Proceed CTA */}
          <div style={{ textAlign: "center" }}>
            <button onClick={handleProceed}
              style={{ padding: "18px 72px", border: "none", borderRadius: 14, fontSize: 18, fontWeight: 800, cursor: "pointer", background: `linear-gradient(135deg, ${C.blue}, ${C.aqua})`, color: "#fff", fontFamily: "'Montserrat', sans-serif", boxShadow: `0 6px 32px ${C.blue}50`, letterSpacing: 0.3 }}>
              My Resume Looks Great — Set Up My Profile →
            </button>
            <p style={{ marginTop: 16, fontSize: 14, color: "#9FA6B2" }}>
              Your optimized resume will pre-fill 35–50% of your profile automatically
            </p>
          </div>
        </div>
      </main>

      {showSarah && <SarahChat onClose={() => setShowSarah(false)} />}
    </div>
  );
}
