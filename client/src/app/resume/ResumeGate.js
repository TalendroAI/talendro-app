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
};

const paths = [
  {
    id: "upload",
    emoji: "✅",
    title: "My resume is current",
    subtitle: "Updated within the last 6 months",
    description: "Upload your resume and our AI will verify it's complete, ATS-ready, and optimized for today's job market.",
    cta: "Upload & Optimize",
    color: "#10B981",
    bg: "rgba(16,185,129,0.06)",
    border: "rgba(16,185,129,0.3)",
    route: "/app/resume/upload",
    badge: "Fastest — ~3 minutes",
    badgeColor: "#10B981",
  },
  {
    id: "update",
    emoji: "🔄",
    title: "My resume needs updating",
    subtitle: "Has gaps, outdated info, or missing recent work",
    description: "Upload your existing resume and answer a few quick questions. AI merges everything into a polished, optimized version.",
    cta: "Update My Resume",
    color: C.blue,
    bg: "rgba(47,109,246,0.06)",
    border: "rgba(47,109,246,0.3)",
    route: "/app/resume/update",
    badge: "~8 minutes",
    badgeColor: C.blue,
  },
  {
    id: "create",
    emoji: "✨",
    title: "I don't have a resume",
    subtitle: "Starting fresh or never had one",
    description: "Answer a guided set of questions about your background. AI builds a complete, professionally formatted resume from scratch.",
    cta: "Build My Resume",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.06)",
    border: "rgba(139,92,246,0.3)",
    route: "/app/resume/create",
    badge: "~12 minutes",
    badgeColor: "#8B5CF6",
  },
];

export default function ResumeGate() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [hovering, setHovering] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a1628 0%, #1a3a5c 50%, #0d2137 100%)", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ padding: "24px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#fff", fontFamily: "'Montserrat', sans-serif", letterSpacing: -0.5 }}>
            Talendro<span style={{ color: C.aqua }}>™</span> <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Apply</span>
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Payment confirmed</span>
        </div>
      </header>

      {/* Progress */}
      <div style={{ padding: "0 48px", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          {["Resume", "Optimize", "Profile", "Launch"].map((label, i) => (
            <React.Fragment key={label}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 0 ? C.blue : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>{i + 1}</div>
                <span style={{ fontSize: 12, color: i === 0 ? "#fff" : "rgba(255,255,255,0.4)", fontWeight: i === 0 ? 600 : 400 }}>{label}</span>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px 48px" }}>
        <div style={{ maxWidth: 900, width: "100%", textAlign: "center" }}>

          {/* Headline */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: "inline-block", padding: "6px 18px", borderRadius: 20, background: "rgba(47,109,246,0.15)", border: "1px solid rgba(47,109,246,0.3)", marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.aqua, letterSpacing: 1 }}>STEP 1 OF 4 — RESUME</span>
            </div>
            <h2 style={{ margin: 0, fontSize: 42, fontWeight: 800, color: "#fff", fontFamily: "'Montserrat', sans-serif", lineHeight: 1.15, marginBottom: 16 }}>
              Let's start with your resume
            </h2>
            <p style={{ margin: 0, fontSize: 18, color: "rgba(255,255,255,0.65)", maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
              Your resume is the foundation of everything. AI will optimize it before using it to pre-fill 35–50% of your profile automatically.
            </p>
          </div>

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
                    background: isSelected ? path.bg : "rgba(255,255,255,0.04)",
                    border: `2px solid ${isSelected ? path.color : isHovered ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 16,
                    padding: 28,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.25s",
                    transform: isSelected ? "translateY(-4px)" : isHovered ? "translateY(-2px)" : "none",
                    boxShadow: isSelected ? `0 8px 32px ${path.color}30` : isHovered ? "0 4px 16px rgba(0,0,0,0.3)" : "none",
                    position: "relative",
                  }}>

                  {/* Badge */}
                  <div style={{ position: "absolute", top: 16, right: 16, padding: "3px 10px", borderRadius: 10, background: `${path.badgeColor}20`, border: `1px solid ${path.badgeColor}40`, fontSize: 11, fontWeight: 600, color: path.badgeColor }}>
                    {path.badge}
                  </div>

                  {/* Emoji */}
                  <div style={{ fontSize: 40, marginBottom: 16 }}>{path.emoji}</div>

                  {/* Title */}
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "'Montserrat', sans-serif", marginBottom: 6 }}>{path.title}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: path.color, fontWeight: 600, marginBottom: 14 }}>{path.subtitle}</p>
                  <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{path.description}</p>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: path.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: path.color }}>Selected</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA */}
          {selected ? (
            <button onClick={() => navigate(paths.find(p => p.id === selected).route)}
              style={{ padding: "16px 56px", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", background: paths.find(p => p.id === selected).color, color: "#fff", fontFamily: "'Montserrat', sans-serif", boxShadow: `0 4px 24px ${paths.find(p => p.id === selected).color}50`, transition: "all 0.2s", letterSpacing: 0.3 }}>
              {paths.find(p => p.id === selected).cta} →
            </button>
          ) : (
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>Select one of the options above to continue</p>
          )}

          {/* Trust note */}
          <p style={{ marginTop: 32, fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
            🔒 Your resume is encrypted and stored securely. It is never shared with employers without your explicit authorization.
          </p>
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
