import React from "react";
import { useNavigate } from "react-router-dom";

export const C = {
  blue: "#2F6DF6",
  aqua: "#00C4CC",
  slate: "#2C2F38",
  lime: "#A4F400",
  gray: "#9FA6B2",
  lightBg: "#F9FAFB",
  white: "#FFFFFF",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  purple: "#8B5CF6",
};

const STEPS = ["Resume", "Optimize", "Profile", "Launch"];

export function BrandShell({ children, currentStep = 0, showBack = true, backPath = "/app/resume-gate", rightContent = null }) {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: C.lightBg, display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=DM+Serif+Display:ital@1&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ background: C.white, borderBottom: "1px solid #E5E7EB", padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.blue, fontFamily: "'Montserrat', sans-serif", letterSpacing: -0.5 }}>
          Talendro™ <span style={{ fontSize: 13, fontWeight: 600, color: C.gray }}>Apply</span>
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {rightContent}
          {showBack && (
            <button onClick={() => navigate(backPath)}
              style={{ padding: "8px 20px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, cursor: "pointer", background: C.white, color: C.slate, fontFamily: "'Inter', sans-serif" }}>
              ← Back
            </button>
          )}
        </div>
      </header>

      {/* Progress Bar */}
      <div style={{ background: C.white, borderBottom: "1px solid #E5E7EB", padding: "12px 48px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", maxWidth: 900, margin: "0 auto" }}>
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: i < currentStep ? C.green : i === currentStep ? C.blue : "#E5E7EB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                  color: i <= currentStep ? C.white : C.gray
                }}>
                  {i < currentStep ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 13, color: i === currentStep ? C.slate : C.gray, fontWeight: i === currentStep ? 600 : 400 }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: i < currentStep ? C.green : "#E5E7EB", borderRadius: 1 }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "48px 48px 80px", display: "flex", flexDirection: "column" }}>
        {children}
      </main>
    </div>
  );
}

export function StepBadge({ step, total, label }) {
  return (
    <div style={{ display: "inline-block", padding: "5px 16px", borderRadius: 20, background: "#EFF6FF", border: `1px solid ${C.blue}30`, marginBottom: 20 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.aqua, letterSpacing: 1, fontFamily: "'Inter', sans-serif" }}>
        STEP {step} OF {total} — {label}
      </span>
    </div>
  );
}

export function SectionHeading({ children }) {
  return (
    <h2 style={{ margin: "0 0 16px", fontSize: 36, fontWeight: 800, color: C.blue, fontFamily: "'Montserrat', sans-serif", lineHeight: 1.15 }}>
      {children}
    </h2>
  );
}

export function BodyText({ children, style = {} }) {
  return (
    <p style={{ margin: "0 0 24px", fontSize: 16, color: C.slate, lineHeight: 1.6, fontFamily: "'Inter', sans-serif", ...style }}>
      {children}
    </p>
  );
}

export function PrimaryButton({ onClick, children, disabled = false, color = C.blue }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        padding: "14px 52px", border: "none", borderRadius: 10,
        fontSize: 16, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? C.gray : color,
        color: C.white, fontFamily: "'Inter', sans-serif",
        boxShadow: disabled ? "none" : `0 4px 16px ${color}40`,
        transition: "all 0.2s", opacity: disabled ? 0.6 : 1
      }}>
      {children}
    </button>
  );
}

export function SecondaryButton({ onClick, children }) {
  return (
    <button onClick={onClick}
      style={{
        padding: "12px 28px", border: `1.5px solid #E5E7EB`, borderRadius: 10,
        fontSize: 14, fontWeight: 600, cursor: "pointer",
        background: C.white, color: C.slate, fontFamily: "'Inter', sans-serif"
      }}>
      {children}
    </button>
  );
}

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.white, border: "1px solid #E5E7EB",
      borderRadius: 16, padding: 28,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      ...style
    }}>
      {children}
    </div>
  );
}
