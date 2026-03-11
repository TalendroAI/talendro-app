/**
 * SalaryNegotiation.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Salary Negotiation Coach — Pro & Concierge feature.
 *
 * Three modes:
 *   1. Setup:   User enters offer details to configure the session
 *   2. Analyze: One-shot offer analysis with market data, counter-offer, script
 *   3. Chat:    Conversational coaching / role-play (multi-round for Concierge)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

const C = {
  blue: '#2F6DF6',
  aqua: '#00C4CC',
  slate: '#2C2F38',
  gray: '#9FA6B2',
  lightBg: '#F9FAFB',
  white: '#FFFFFF',
  green: '#10B981',
  red: '#EF4444',
  amber: '#F59E0B',
};

function formatMarkdown(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <p key={i} style={{ fontWeight: 700, color: C.slate, marginBottom: 4, marginTop: 12 }}>{line.replace(/\*\*/g, '')}</p>;
    }
    if (line.startsWith('**')) {
      const parts = line.split('**').filter(Boolean);
      return (
        <p key={i} style={{ marginBottom: 4 }}>
          {parts.map((part, j) => j % 2 === 0 ? <strong key={j}>{part}</strong> : <span key={j}>{part}</span>)}
        </p>
      );
    }
    if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
    return <p key={i} style={{ marginBottom: 4, lineHeight: 1.7 }}>{line}</p>;
  });
}

export default function SalaryNegotiation() {
  const { user: authUser } = useAuth();
  const userPlan = authUser?.plan || localStorage.getItem('talendro_plan') || 'basic';
  const isConcierge = userPlan === 'premium';
  const isPro = userPlan === 'pro';
  const isStarter = userPlan === 'basic';

  const [mode, setMode] = useState('setup'); // 'setup' | 'analyze' | 'chat'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [offerForm, setOfferForm] = useState({
    jobTitle: '',
    companyName: '',
    offeredSalary: '',
    location: '',
    seniorityLevel: '',
  });
  const [analysis, setAnalysis] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatContext, setChatContext] = useState({});
  const [sessionStarted, setSessionStarted] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ── Analyze an offer ────────────────────────────────────────────────────────
  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');
    setAnalysis('');
    setLoading(true);
    try {
      const res = await fetch('/api/negotiation/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          ...offerForm,
          offeredSalary: parseInt(offerForm.offeredSalary.replace(/[^0-9]/g, ''), 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setAnalysis(data.analysis);
      setMode('analyze');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Start a chat session ────────────────────────────────────────────────────
  const startChatSession = async (fromAnalysis = false) => {
    const ctx = {
      jobTitle: offerForm.jobTitle,
      companyName: offerForm.companyName,
      offeredSalary: offerForm.offeredSalary ? parseInt(offerForm.offeredSalary.replace(/[^0-9]/g, ''), 10) : undefined,
      location: offerForm.location,
      seniorityLevel: offerForm.seniorityLevel,
    };
    setChatContext(ctx);
    setMode('chat');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/negotiation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(ctx),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start session');
      setMessages([{ role: 'assistant', content: data.openingMessage }]);
      setSessionStarted(true);
    } catch (err) {
      setError(err.message);
      // Fallback opening message
      setMessages([{
        role: 'assistant',
        content: `I'm ready to coach you through your salary negotiation${offerForm.companyName ? ` with ${offerForm.companyName}` : ''}. What would you like to work on first?`,
      }]);
      setSessionStarted(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Send a chat message ─────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/negotiation/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          context: chatContext,
          conversationHistory: messages,
          message: userMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chat failed');
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Plan gate ───────────────────────────────────────────────────────────────
  // Starter: Quick Prep (AI prep packet only — no live coaching)
  // Pro: AI text role-play coaching
  // Concierge: AI voice role-play coaching
  // All plans have access to some form of salary negotiation support.

  return (
    <div style={{ minHeight: '100vh', background: C.lightBg, fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: C.white, borderBottom: '1px solid #e5e7eb', padding: '20px 32px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>
              Salary Negotiation Coach
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: C.gray }}>
              {isConcierge ? 'AI voice role-play · Concierge' : isPro ? 'AI text role-play · Pro' : 'Quick Prep · Starter'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['setup', 'analyze', 'chat'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{ padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${mode === m ? C.blue : '#e5e7eb'}`, background: mode === m ? C.blue : C.white, color: mode === m ? C.white : C.slate, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                {m === 'setup' ? '⚙️ Setup' : m === 'analyze' ? '📊 Analysis' : '💬 Chat Coach'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {error && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#dc2626', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* ── Setup Mode ─────────────────────────────────────────────────────── */}
        {mode === 'setup' && (
          <div style={{ background: C.white, borderRadius: 16, border: '1px solid #e5e7eb', padding: 32 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>Enter Offer Details</h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: C.gray }}>
              Provide the offer details and choose how you'd like to proceed — instant analysis or live coaching.
            </p>

            <form onSubmit={handleAnalyze}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {[
                  { key: 'jobTitle', label: 'Job Title', placeholder: 'e.g. Senior Product Manager' },
                  { key: 'companyName', label: 'Company', placeholder: 'e.g. Stripe' },
                  { key: 'offeredSalary', label: 'Offered Salary *', placeholder: 'e.g. $145,000', required: true },
                  { key: 'location', label: 'Location', placeholder: 'e.g. San Francisco, CA or Remote' },
                ].map(({ key, label, placeholder, required }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.slate, marginBottom: 6 }}>{label}</label>
                    <input
                      type="text"
                      value={offerForm[key]}
                      onChange={e => setOfferForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      required={required}
                      style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: "'Inter', sans-serif", boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.slate, marginBottom: 6 }}>Seniority Level</label>
                <select
                  value={offerForm.seniorityLevel}
                  onChange={e => setOfferForm(f => ({ ...f, seniorityLevel: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: "'Inter', sans-serif", background: C.white, outline: 'none' }}
                >
                  <option value="">Select level...</option>
                  <option value="entry">Entry Level (0–2 years)</option>
                  <option value="mid">Mid Level (3–5 years)</option>
                  <option value="senior">Senior (6–10 years)</option>
                  <option value="staff">Staff / Principal (10+ years)</option>
                  <option value="director">Director / VP</option>
                  <option value="executive">C-Suite / Executive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" disabled={loading || !offerForm.offeredSalary}
                  style={{ flex: 1, padding: '12px 0', background: loading ? '#93c5fd' : C.blue, color: C.white, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  {loading ? '⚙️ Analyzing...' : '📊 Analyze This Offer'}
                </button>
                <button type="button" onClick={() => startChatSession()} disabled={loading}
                  style={{ flex: 1, padding: '12px 0', background: C.green, color: C.white, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  {loading ? '⚙️ Starting...' : '💬 Start Coaching Session'}
                </button>
              </div>
            </form>

            {/* Quick-start prompts */}
            <div style={{ marginTop: 24, padding: 16, background: C.lightBg, borderRadius: 10 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: C.gray, textTransform: 'uppercase', letterSpacing: 1 }}>Quick Start — Common Scenarios</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  "I just received an offer and need a counter-offer script",
                  "How do I negotiate without losing the offer?",
                  "They said the salary is non-negotiable — what do I do?",
                  "I have a competing offer — how do I use it as leverage?",
                  isConcierge ? "Role-play the negotiation call with me" : null,
                ].filter(Boolean).map((prompt, i) => (
                  <button key={i} onClick={() => {
                    setChatInput(prompt);
                    if (mode !== 'chat') startChatSession();
                  }}
                    style={{ padding: '6px 12px', background: C.white, border: `1.5px solid ${C.blue}`, borderRadius: 20, fontSize: 12, color: C.blue, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Analyze Mode ───────────────────────────────────────────────────── */}
        {mode === 'analyze' && (
          <div style={{ background: C.white, borderRadius: 16, border: '1px solid #e5e7eb', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>Negotiation Analysis</h2>
                {offerForm.jobTitle && (
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: C.gray }}>
                    {offerForm.jobTitle}{offerForm.companyName ? ` at ${offerForm.companyName}` : ''} — {offerForm.offeredSalary}
                  </p>
                )}
              </div>
              <button onClick={() => startChatSession(true)}
                style={{ padding: '10px 20px', background: C.green, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Continue to Coaching →
              </button>
            </div>

            {analysis ? (
              <div style={{ fontSize: 14, color: C.slate, lineHeight: 1.7 }}>
                {formatMarkdown(analysis)}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: C.gray }}>
                <p>No analysis yet. Go to Setup to enter your offer details.</p>
                <button onClick={() => setMode('setup')}
                  style={{ marginTop: 12, padding: '10px 20px', background: C.blue, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  ← Back to Setup
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Chat Mode ──────────────────────────────────────────────────────── */}
        {mode === 'chat' && (
          <div style={{ background: C.white, borderRadius: 16, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: '65vh' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>
                  Negotiation Coach
                  <span style={{ marginLeft: 8, fontSize: 11, background: isConcierge ? 'rgba(0,196,204,0.1)' : 'rgba(47,109,246,0.1)', color: isConcierge ? C.aqua : C.blue, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                    {isConcierge ? 'Concierge' : 'Pro'}
                  </span>
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: C.gray }}>
                  {isConcierge ? 'Multi-round coaching · Role-play available' : 'Counter-offer guidance'}
                  {chatContext.companyName ? ` · ${chatContext.companyName}` : ''}
                </p>
              </div>
              <button onClick={() => { setMessages([]); setSessionStarted(false); setMode('setup'); }}
                style={{ padding: '6px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, background: C.white, color: C.slate, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                New Session
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.length === 0 && !loading && (
                <div style={{ textAlign: 'center', color: C.gray, fontSize: 14, marginTop: 40 }}>
                  <p>Go to Setup to configure your session, then start coaching.</p>
                  <button onClick={() => setMode('setup')}
                    style={{ marginTop: 12, padding: '8px 18px', background: C.blue, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    ← Go to Setup
                  </button>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '72%',
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user' ? C.blue : C.lightBg,
                    color: msg.role === 'user' ? C.white : C.slate,
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}>
                    {msg.role === 'assistant' ? formatMarkdown(msg.content) : msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: C.lightBg, color: C.gray, fontSize: 14 }}>
                    ⚙️ Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 10 }}>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder={isConcierge ? "Ask your coach or say 'Role-play the call with me'..." : "Ask your negotiation coach..."}
                style={{ flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 14, fontFamily: "'Inter', sans-serif", outline: 'none' }}
              />
              <button type="submit" disabled={loading || !chatInput.trim()}
                style={{ padding: '10px 20px', background: loading || !chatInput.trim() ? '#93c5fd' : C.blue, color: C.white, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading || !chatInput.trim() ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
