import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  blue: "#2F6DF6",
  aqua: "#00C4CC",
  slate: "#2C2F38",
  lime: "#A4F400",
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
    badge: "Fastest — ~3 minutes",
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
    badge: "~8 minutes",
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
    badge: "~12 minutes",
  },
];

export default function ResumeGate() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [hovering, setHovering] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: C.lightBg, display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=DM+Serif+Display:ital@1&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ background: C.white, borderBottom: "1px solid #E5E7EB", padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.blue, fontFamily: "'Montserrat', sans-serif", letterSpacing: -0.5 }}>
            Talendro™ <span style={{ fontSize: 13, fontWeight: 600, color: C.gray }}>Apply</span>
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
          <span style={{ fontSize: 13, color: C.gray }}>Payment confirmed</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div style={{ background: C.white, borderBottom: "1px solid #E5E7EB", padding: "12px 48px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 900, margin: "0 auto" }}>
          {["Resume", "Optimize", "Profile", "Launch"].map((label, i) => (
            <React.Fragment key={label}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: i === 0 ? C.blue : "#E5E7EB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  color: i === 0 ? C.white : C.gray
                }}>{i + 1}</div>
                <span style={{ fontSize: 13, color: i === 0 ? C.slate : C.gray, fontWeight: i === 0 ? 600 : 400 }}>{label}</span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 2, background: i === 0 ? C.blue : "#E5E7EB", borderRadius: 1 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ maxWidth: 900, width: "100%", textAlign: "center" }}>

          {/* Step Badge */}
          <div style={{ display: "inline-block", padding: "5px 16px", borderRadius: 20, background: "#EFF6FF", border: `1px solid ${C.blue}30`, marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.aqua, letterSpacing: 1, fontFamily: "'Inter', sans-serif" }}>STEP 1 OF 4 — RESUME</span>
          </div>

          {/* Headline */}
          <h2 style={{ margin: "0 0 16px", fontSize: 40, fontWeight: 800, color: C.blue, fontFamily: "'Montserrat', sans-serif", lineHeight: 1.15 }}>
            Let's start with your resume
          </h2>
          <p style={{ margin: "0 auto 48px", fontSize: 18, color: C.slate, maxWidth: 580, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
            Your resume is the foundation of everything. AI will optimize it before using it to pre-fill 35–50% of your profile automatically.
          </p>

          {/* Path Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 40 }}>
            {paths.map(path => {
              const isSelected = selected === path.id;
              const isHovered = hovering === path.id;
              return (
                <div key={path.id}
                  onClick={() => setSelected(path.id)}
                  onMouseEnter={() => setHovering(path.id)}
                  onMouseLeave={() => setHovering(null)}
                  style={{
                    background: isSelected ? path.bg : C.white,
                    border: `2px solid ${isSelected ? path.color : isHovered ? path.color + "60" : "#E5E7EB"}`,
                    borderRadius: 16,
                    padding: 28,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                    transform: isSelected || isHovered ? "translateY(-3px)" : "none",
                    boxShadow: isSelected ? `0 8px 24px ${path.color}20` : isHovered ? "0 4px 12px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.05)",
                    position: "relative",
                  }}>

                  {/* Badge */}
                  <div style={{ position: "absolute", top: 14, right: 14, padding: "3px 10px", borderRadius: 10, background: path.bg, border: `1px solid ${path.border}`, fontSize: 11, fontWeight: 600, color: path.color }}>
                    {path.badge}
                  </div>

                  {/* Emoji */}
                  <div style={{ fontSize: 36, marginBottom: 14 }}>{path.emoji}</div>

                  {/* Title */}
                  <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>{path.title}</h3>
                  <p style={{ margin: "0 0 12px", fontSize: 13, color: path.color, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>{path.subtitle}</p>
                  <p style={{ margin: 0, fontSize: 14, color: C.gray, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>{path.description}</p>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: path.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: C.white, fontSize: 11, fontWeight: 700 }}>✓</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: path.color, fontFamily: "'Inter', sans-serif" }}>Selected</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA */}
          {selected ? (
            <button
              onClick={() => navigate(paths.find(p => p.id === selected).route)}
              style={{
                padding: "14px 52px", border: "none", borderRadius: 10,
                fontSize: 16, fontWeight: 600, cursor: "pointer",
                background: C.blue, color: C.white,
                fontFamily: "'Inter', sans-serif",
                boxShadow: `0 4px 16px ${C.blue}40`,
                transition: "all 0.2s",
                letterSpacing: 0.2
              }}>
              {paths.find(p => p.id === selected).cta} →
            </button>
          ) : (
            <p style={{ fontSize: 14, color: C.gray, fontStyle: "italic", fontFamily: "'Inter', sans-serif" }}>Select one of the options above to continue</p>
          )}

          {/* Trust note */}
          <p style={{ marginTop: 32, fontSize: 13, color: C.gray, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
            🔒 Your resume is encrypted and stored securely. It is never shared with employers without your explicit authorization.
          </p>
        </div>
      </main>
    </div>
  );
}
