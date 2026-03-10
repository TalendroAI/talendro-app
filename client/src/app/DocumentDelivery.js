import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/* ═══════════════════════════════════════════════════════════════
   DOCUMENT DELIVERY SCREEN
   Shown after onboarding completes. Presents tier-based
   career document deliverables before the dashboard opens.

   Starter   → ATS-Optimized Plain Text Resume
   Pro       → Plain Text + Beautifully Formatted HTML Resume PDF
   Concierge → Plain Text + HTML Resume PDF + LinkedIn Analysis
   ═══════════════════════════════════════════════════════════════ */

const C = {
  blue:  '#2F6DF6',
  aqua:  '#00C4CC',
  slate: '#2C2F38',
  gray:  '#9FA6B2',
  white: '#FFFFFF',
  green: '#10B981',
  purple:'#8B5CF6',
};

export default function DocumentDelivery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plan, setPlan]           = useState('starter');
  const [loading, setLoading]     = useState(true);
  const [resumeText, setResumeText] = useState('');
  const [pdfReady, setPdfReady]   = useState(false);
  const [linkedinReady, setLinkedinReady] = useState(false);
  const [linkedinData, setLinkedinData]   = useState(null);
  const [feedback, setFeedback]   = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [downloadingPdf, setDownloadingPdf]   = useState(false);

  // ─── Determine plan and load deliverables ───────────────────
  useEffect(() => {
    const loadDeliverables = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Get user plan
        const userPlan = user?.plan || localStorage.getItem('userPlan') || 'starter';
        setPlan(userPlan);

        // Load plain text resume
        const resumeRes = await fetch('/api/resume/latest', { headers });
        if (resumeRes.ok) {
          const data = await resumeRes.json();
          setResumeText(data.optimizedText || data.rawText || '');
        }

        // For Pro and Concierge — check if PDF is available
        if (userPlan === 'pro' || userPlan === 'premium') {
          setPdfReady(true);
        }

        // For Concierge — load or generate LinkedIn optimization
        if (userPlan === 'premium') {
          // First check if we already have a result saved
          const lastRes = await fetch('/api/linkedin/last-result', { headers });
          if (lastRes.ok) {
            const liData = await lastRes.json();
            if (liData.result) {
              setLinkedinData(liData.result);
              setLinkedinReady(true);
            } else {
              // No saved result — trigger generation now
              const profileData = JSON.parse(localStorage.getItem('talendro_profile') || '{}');
              const linkedinUrl = profileData?.s8?.linkedinUrl || null;
              const optimizeRes = await fetch('/api/linkedin/optimize', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ linkedinUrl }),
              });
              if (optimizeRes.ok) {
                const liData = await optimizeRes.json();
                setLinkedinData(liData.result);
                setLinkedinReady(true);
              }
            }
          }
        }
      } catch (err) {
        console.error('DocumentDelivery load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDeliverables();
  }, [user]);

  // ─── Download plain text resume ─────────────────────────────
  const downloadText = () => {
    const blob = new Blob([resumeText], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'resume-talendro.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Download HTML PDF resume ────────────────────────────────
  const downloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch('/api/resume/download-pdf', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'resume-talendro-formatted.pdf';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert('PDF generation failed. Please try again or contact support.');
      }
    } catch (err) {
      console.error('PDF download error:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ─── Submit feedback ─────────────────────────────────────────
  const submitFeedback = async () => {
    if (!feedback.trim()) return;
    setSendingFeedback(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/resume/feedback', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
      });
      setFeedbackSent(true);
      setFeedback('');
    } catch (err) {
      console.error('Feedback error:', err);
    } finally {
      setSendingFeedback(false);
    }
  };

  // ─── Loading state ───────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        background:'linear-gradient(135deg, #1a1f2e 0%, #2C2F38 100%)', fontFamily:'-apple-system, sans-serif' }}>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ textAlign:'center', color:'#fff' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>⚙️</div>
          <p style={{ fontSize:18, color:'#9ca3af' }}>Preparing your career documents...</p>
        </div>
      </div>
    );
  }

  const isPro       = plan === 'pro' || plan === 'premium';
  const isConcierge = plan === 'premium';

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg, #1a1f2e 0%, #2C2F38 100%)',
      fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding:'40px 20px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ maxWidth:860, margin:'0 auto' }}>

        {/* ── Header ── */}
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
          <h1 style={{ fontFamily:"'Montserrat', sans-serif", fontSize:36, fontWeight:800,
            color:'#fff', margin:'0 0 12px' }}>
            Your Career Documents Are Ready
          </h1>
          <p style={{ color:'#9ca3af', fontSize:18, margin:0 }}>
            AI has optimized everything for ATS systems, keyword matching, and recruiter review.
            Download your documents below.
          </p>
        </div>

        {/* ── Deliverables ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:24, marginBottom:40 }}>

          {/* Plain Text Resume — ALL tiers */}
          <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:16, padding:32,
            border:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              flexWrap:'wrap', gap:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:48, height:48, borderRadius:12, background:'rgba(47,109,246,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>📄</div>
                <div>
                  <h3 style={{ fontFamily:"'Montserrat', sans-serif", fontSize:18, fontWeight:700,
                    color:'#fff', margin:'0 0 4px' }}>ATS-Optimized Plain Text Resume</h3>
                  <p style={{ color:'#9ca3af', fontSize:14, margin:0 }}>
                    Formatted for maximum compatibility with Applicant Tracking Systems.
                    Use this for online job portals and automated submissions.
                  </p>
                </div>
              </div>
              <button onClick={downloadText}
                style={{ padding:'12px 28px', background:C.blue, color:'#fff', border:'none',
                  borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer',
                  fontFamily:"'Inter', sans-serif", whiteSpace:'nowrap',
                  boxShadow:'0 4px 16px rgba(47,109,246,0.4)' }}>
                ⬇ Download Plain Text
              </button>
            </div>
          </div>

          {/* HTML Formatted Resume — Pro + Concierge */}
          {isPro && (
            <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:16, padding:32,
              border:'1px solid rgba(139,92,246,0.3)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                flexWrap:'wrap', gap:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                  <div style={{ width:48, height:48, borderRadius:12, background:'rgba(139,92,246,0.2)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>🎨</div>
                  <div>
                    <h3 style={{ fontFamily:"'Montserrat', sans-serif", fontSize:18, fontWeight:700,
                      color:'#fff', margin:'0 0 4px' }}>
                      Beautifully Formatted Resume
                      <span style={{ marginLeft:10, fontSize:12, background:'rgba(139,92,246,0.3)',
                        color:'#c4b5fd', padding:'2px 10px', borderRadius:20, fontWeight:600 }}>
                        PDF
                      </span>
                    </h3>
                    <p style={{ color:'#9ca3af', fontSize:14, margin:0 }}>
                      Professionally designed layout for personal delivery, networking, and
                      direct submissions to hiring managers. Makes a strong visual impression.
                    </p>
                  </div>
                </div>
                <button onClick={downloadPdf} disabled={downloadingPdf}
                  style={{ padding:'12px 28px', background:C.purple, color:'#fff', border:'none',
                    borderRadius:10, fontSize:14, fontWeight:700,
                    cursor:downloadingPdf ? 'not-allowed' : 'pointer',
                    fontFamily:"'Inter', sans-serif", whiteSpace:'nowrap', opacity:downloadingPdf ? 0.7 : 1,
                    boxShadow:'0 4px 16px rgba(139,92,246,0.4)' }}>
                  {downloadingPdf ? '⚙️ Generating...' : '⬇ Download PDF'}
                </button>
              </div>
            </div>
          )}

          {/* LinkedIn Analysis — Concierge only */}
          {isConcierge && (
            <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:16, padding:32,
              border:'1px solid rgba(0,196,204,0.3)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
                <div style={{ width:48, height:48, borderRadius:12, background:'rgba(0,196,204,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>🔗</div>
                <div>
                  <h3 style={{ fontFamily:"'Montserrat', sans-serif", fontSize:18, fontWeight:700,
                    color:'#fff', margin:'0 0 4px' }}>
                    LinkedIn Profile Analysis & Updated Copy
                    <span style={{ marginLeft:10, fontSize:12, background:'rgba(0,196,204,0.2)',
                      color:'#67e8f9', padding:'2px 10px', borderRadius:20, fontWeight:600 }}>
                      Concierge
                    </span>
                  </h3>
                  <p style={{ color:'#9ca3af', fontSize:14, margin:0 }}>
                    AI-generated recommendations and updated copy for your headline,
                    about section, and experience bullets. Ready to paste directly into LinkedIn.
                  </p>
                </div>
              </div>

              {linkedinReady && linkedinData ? (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {/* Path indicator */}
                  {linkedinData.path && (
                    <div style={{ background:'rgba(0,196,204,0.1)', borderRadius:8, padding:'8px 14px', display:'inline-flex', alignItems:'center', gap:8 }}>
                      <span style={{ color:'#67e8f9', fontSize:12, fontWeight:700 }}>
                        {linkedinData.path === 'rewrite' ? '✓ Profile Rewrite — Based on your existing LinkedIn profile' : '✓ Profile Built from Scratch — Ready to create your LinkedIn account'}
                      </span>
                    </div>
                  )}
                  {/* Note (e.g., scraping fallback) */}
                  {linkedinData.note && (
                    <div style={{ background:'rgba(245,158,11,0.1)', borderRadius:8, padding:'10px 14px', border:'1px solid rgba(245,158,11,0.3)' }}>
                      <p style={{ color:'#fcd34d', fontSize:13, margin:0 }}>{linkedinData.note}</p>
                    </div>
                  )}
                  {/* Headline */}
                  {(linkedinData.headline?.rewritten || linkedinData.headline?.text) && (
                    <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:10, padding:20 }}>
                      <p style={{ color:C.aqua, fontSize:12, fontWeight:700, margin:'0 0 8px', textTransform:'uppercase', letterSpacing:1 }}>
                        {linkedinData.path === 'rewrite' ? 'Rewritten Headline' : 'Recommended Headline'}
                      </p>
                      <p style={{ color:'#fff', fontSize:15, margin:'0 0 8px' }}>
                        {linkedinData.headline?.rewritten || linkedinData.headline?.text}
                      </p>
                      {linkedinData.headline?.rationale && (
                        <p style={{ color:'#9ca3af', fontSize:12, margin:0, fontStyle:'italic' }}>{linkedinData.headline.rationale}</p>
                      )}
                    </div>
                  )}
                  {/* About */}
                  {(linkedinData.about?.rewritten || linkedinData.about?.text) && (
                    <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:10, padding:20 }}>
                      <p style={{ color:C.aqua, fontSize:12, fontWeight:700, margin:'0 0 8px', textTransform:'uppercase', letterSpacing:1 }}>
                        {linkedinData.path === 'rewrite' ? 'Rewritten About Section' : 'About Section'}
                      </p>
                      <p style={{ color:'#e5e7eb', fontSize:14, margin:0, lineHeight:1.7, whiteSpace:'pre-wrap' }}>
                        {linkedinData.about?.rewritten || linkedinData.about?.text}
                      </p>
                    </div>
                  )}
                  {/* Experience */}
                  {linkedinData.experience?.length > 0 && (
                    <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:10, padding:20 }}>
                      <p style={{ color:C.aqua, fontSize:12, fontWeight:700, margin:'0 0 12px', textTransform:'uppercase', letterSpacing:1 }}>Experience Bullets</p>
                      {linkedinData.experience.map((exp, i) => (
                        <div key={i} style={{ marginBottom:16 }}>
                          <p style={{ color:'#fff', fontSize:14, fontWeight:600, margin:'0 0 6px' }}>{exp.title} — {exp.company}</p>
                          {(exp.rewritten_bullets || exp.bullets || []).map((b, j) => (
                            <div key={j} style={{ display:'flex', gap:8, marginBottom:4 }}>
                              <span style={{ color:C.aqua, flexShrink:0 }}>•</span>
                              <p style={{ color:'#e5e7eb', fontSize:13, margin:0 }}>{b}</p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Skills */}
                  {linkedinData.skills?.recommended?.length > 0 && (
                    <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:10, padding:20 }}>
                      <p style={{ color:C.aqua, fontSize:12, fontWeight:700, margin:'0 0 12px', textTransform:'uppercase', letterSpacing:1 }}>Recommended Skills</p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {linkedinData.skills.recommended.map((s, i) => (
                          <span key={i} style={{ background:'rgba(0,196,204,0.15)', color:'#67e8f9', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600 }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Instructions / Setup Guide */}
                  {(linkedinData.instructions || linkedinData.setup_guide) && (
                    <div style={{ background:'rgba(16,185,129,0.08)', borderRadius:10, padding:20, border:'1px solid rgba(16,185,129,0.2)' }}>
                      <p style={{ color:'#10B981', fontSize:12, fontWeight:700, margin:'0 0 8px', textTransform:'uppercase', letterSpacing:1 }}>
                        {linkedinData.path === 'build' ? 'Setup Guide' : 'How to Apply These Changes'}
                      </p>
                      <p style={{ color:'#e5e7eb', fontSize:13, margin:0, lineHeight:1.7, whiteSpace:'pre-wrap' }}>
                        {linkedinData.instructions || linkedinData.setup_guide}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:20 }}>
                  <div style={{ color:'#9ca3af', fontSize:14 }}>
                    {linkedinReady ? 'Optimization complete.' : '⚙️ Generating your LinkedIn profile optimization...'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Feedback Section ── */}
        <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:16, padding:32,
          border:'1px solid rgba(255,255,255,0.08)', marginBottom:32 }}>
          <h3 style={{ fontFamily:"'Montserrat', sans-serif", fontSize:18, fontWeight:700,
            color:'#fff', margin:'0 0 8px' }}>Have Feedback on Your Documents?</h3>
          <p style={{ color:'#9ca3af', fontSize:14, margin:'0 0 16px' }}>
            Tell us what to change and AI will revise and redeliver your documents.
          </p>
          {feedbackSent ? (
            <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)',
              borderRadius:10, padding:16, color:'#6ee7b7', fontSize:14 }}>
              ✓ Feedback received. Your documents will be revised and updated shortly.
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="e.g. 'Please emphasize my leadership experience more' or 'The summary is too long — make it more concise'"
                rows={4}
                style={{ width:'100%', padding:'12px 16px', background:'rgba(0,0,0,0.3)',
                  border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#fff',
                  fontSize:14, fontFamily:"'Inter', sans-serif", resize:'vertical', boxSizing:'border-box' }}
              />
              <button onClick={submitFeedback} disabled={sendingFeedback || !feedback.trim()}
                style={{ alignSelf:'flex-start', padding:'12px 28px', background:'rgba(47,109,246,0.2)',
                  color:C.blue, border:`1.5px solid ${C.blue}`, borderRadius:10, fontSize:14,
                  fontWeight:700, cursor:(!feedback.trim() || sendingFeedback) ? 'not-allowed' : 'pointer',
                  fontFamily:"'Inter', sans-serif", opacity:(!feedback.trim() || sendingFeedback) ? 0.5 : 1 }}>
                {sendingFeedback ? 'Sending...' : '✉ Submit Feedback'}
              </button>
            </div>
          )}
        </div>

        {/* ── Proceed to Dashboard ── */}
        <div style={{ textAlign:'center' }}>
          <p style={{ color:'#9ca3af', fontSize:14, marginBottom:20 }}>
            Your job search has already started. AI identified matching opportunities
            while you were completing onboarding.
          </p>
          <button onClick={() => navigate('/app/dashboard')}
            style={{ padding:'16px 56px', background:C.blue, color:'#fff', border:'none',
              borderRadius:12, fontSize:16, fontWeight:700, cursor:'pointer',
              fontFamily:"'Montserrat', sans-serif",
              boxShadow:'0 6px 24px rgba(47,109,246,0.5)' }}>
            View My Matched Jobs →
          </button>
        </div>

      </div>
    </div>
  );
}
