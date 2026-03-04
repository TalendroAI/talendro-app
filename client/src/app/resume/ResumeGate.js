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
  purple: "#8B5CF6",
};

const paths = [
  {
    id: "upload",
    emoji: "✅",
    title: "My resume is current",
    subtitle: "Updated within the last 6 months",
    description: "Upload your resume and our AI will verify it's complete, ATS-ready, and optimized for today's job market.",
    cta: "Upload & Optimize",
    color: C.green,
    border: "#D1FAE5",
    bg: "#F0FDF4",
    route: "/app/resume/upload",
    badge: "Fastest — ~3 min",
  },
  {
    id: "update",
    emoji: "🔄",
    title: "My resume needs updating",
    subtitle: "Has gaps, outdated info, or missing recent work",
    description: "Upload your existing resume and answer a few quick questions. AI merges everything into a polished, optimized version.",
    cta: "Update My Resume",
    color: C.blue,
    border: "#DBEAFE",
    bg: "#EFF6FF",
    route: "/app/resume/update",
    badge: "~8 min",
  },
  {
    id: "create",
    emoji: "✨",
    title: "I don't have a resume",
    subtitle: "Starting fresh or never had one",
    description: "Answer a guided set of questions about your background. AI builds a complete, professionally formatted resume from scratch.",
    cta: "Build My Resume",
    color: C.purple,
    border: "#EDE9FE",
    bg: "#F5F3FF",
    route: "/app/resume/create",
    badge: "~12 min",
  },
];

export default function ResumeGate() {
  const navigate = useNavigate();
  const [hovering, setHovering] = useState(null);

  // Only show "Payment confirmed" if the session has a confirmed active subscription
  const subscriptionStatus = sessionStorage.getItem("subscriptionStatus");
  const isPaymentConfirmed = subscriptionStatus === "active";

  return (
    <div style={{ height: "100vh", background: C.lightBg, display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ background: C.white, borderBottom: "1px solid #E5E7EB", padding: "12px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.blue, fontFamily: "'Montserrat', sans-serif", letterSpacing: -0.5 }}>
          Talendro™ <span style={{ fontSize: 13, fontWeight: 600, color: C.gray }}>Apply</span>
        </h1>
        {isPaymentConfirmed && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
            <span style={{ fontSize: 13, color: C.gray }}>Payment confirmed</span>
          </div>
        )}
      </header>

      {/* Progress Stepper */}
      <div style={{ background: C.white, borderBottom: "1px solid #E5E7EB", padding: "10px 48px", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 900, margin: "0 auto" }}>
          {["Resume", "Optimize", "Profile", "Launch"].map((label, i) => (
            <React.Fragment key={label}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? C.blue : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: i === 0 ? C.white : C.gray }}>{i + 1}</div>
                <span style={{ fontSize: 13, color: i === 0 ? C.slate : C.gray, fontWeight: i === 0 ? 600 : 400 }}>{label}</span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 2, background: i === 0 ? C.blue : "#E5E7EB", borderRadius: 1 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content — fills remaining viewport height */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 24px 16px", overflow: "hidden" }}>
        <div style={{ maxWidth: 960, width: "100%", textAlign: "center" }}>

          {/* Step Badge */}
          <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: "#EFF6FF", border: `1px solid ${C.blue}30`, marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.aqua, letterSpacing: 1 }}>STEP 1 OF 4 — RESUME</span>
          </div>

          {/* Headline */}
          <h2 style={{ margin: "0 0 8px", fontSize: 30, fontWeight: 800, color: C.blue, fontFamily: "'Montserrat', sans-serif", lineHeight: 1.2 }}>
            Let's start with your resume
          </h2>
          <p style={{ margin: "0 auto 20px", fontSize: 15, color: C.slate, maxWidth: 560, lineHeight: 1.5 }}>
            Your resume is the foundation of everything. AI will optimize it and pre-fill 35–50% of your profile automatically.
          </p>

          {/* Path Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {paths.map(path => {
              const isHovered = hovering === path.id;
              return (
                <div key={path.id}
                  onClick={() => navigate(path.route)}
                  onMouseEnter={() => setHovering(path.id)}
                  onMouseLeave={() => setHovering(null)}
                  style={{
                    background: isHovered ? path.bg : C.white,
                    border: `2px solid ${isHovered ? path.color : "#E5E7EB"}`,
                    borderRadius: 14,
                    padding: "20px 22px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                    transform: isHovered ? "translateY(-2px)" : "none",
                    boxShadow: isHovered ? `0 6px 20px ${path.color}20` : "0 1px 3px rgba(0,0,0,0.05)",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                  }}>

                  {/* Time Badge */}
                  <div style={{ position: "absolute", top: 12, right: 12, padding: "2px 9px", borderRadius: 10, background: path.bg, border: `1px solid ${path.border}`, fontSize: 10, fontWeight: 600, color: path.color }}>
                    {path.badge}
                  </div>

                  {/* Emoji */}
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{path.emoji}</div>

                  {/* Title */}
                  <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>{path.title}</h3>
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: path.color, fontWeight: 600 }}>{path.subtitle}</p>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: C.gray, lineHeight: 1.5, flex: 1 }}>{path.description}</p>

                  {/* Inline CTA */}
                  <div style={{
                    width: "100%", padding: "10px 0", borderRadius: 8,
                    background: isHovered ? path.color : path.bg,
                    color: isHovered ? C.white : path.color,
                    fontSize: 13, fontWeight: 700, textAlign: "center",
                    transition: "all 0.2s",
                    boxShadow: isHovered ? `0 3px 10px ${path.color}40` : "none",
                  }}>
                    {path.cta} →
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust note */}
          <p style={{ marginTop: 14, fontSize: 12, color: C.gray, lineHeight: 1.5 }}>
            🔒 Your resume is encrypted and stored securely. Never shared without your explicit authorization.
          </p>
        </div>
      </main>
    </div>
  );
}
