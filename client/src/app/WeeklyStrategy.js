/**
 * WeeklyStrategy.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Weekly AI Career Strategy Session — Concierge feature.
 *
 * Generates a personalized weekly strategy brief based on the user's
 * application pipeline data, then allows conversational follow-up.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from 'react';
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
    const boldHeading = line.match(/^\*\*(.+)\*\*$/);
    if (boldHeading) {
      return <p key={i} style={{ fontWeight: 800, color: C.slate, marginBottom: 4, marginTop: 16, fontSize: 15, fontFamily: "'Montserrat', sans-serif" }}>{boldHeading[1]}</p>;
    }
    if (line.trim() === '') return <div key={i} style={{ height: 6 }} />;
    // Inline bold
    const parts = line.split(/\*\*(.+?)\*\*/g);
    return (
      <p key={i} style={{ marginBottom: 4, lineHeight: 1.75, fontSize: 14, color: '#374151' }}>
        {parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: C.slate }}>{part}</strong> : part)}
      </p>
    );
  });
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: C.white, border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: color || C.slate, fontFamily: "'Montserrat', sans-serif" }}>{value ?? '—'}</p>
      <p style={{ margin: '2px 0 0', fontSize: 12, color: C.gray }}>{label}</p>
    </div>
  );
}

export default function WeeklyStrategy() {
  const { user: authUser } = useAuth();
  const userPlan = authUser?.plan || localStorage.getItem('talendro_plan') || 'basic';
  const isConcierge = userPlan === 'premium';

  const [brief, setBrief] = useState('');
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [view, setView] = useState('session'); // 'session' | 'history'
  const [expandedHistory, setExpandedHistory] = useState(null);
  const messagesEndRef = useRef(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/strategy/history', { headers: getAuthHeader() });
      const data = await res.json();
      if (data.history) setHistory(data.history);
    } catch (err) {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  };

  const generateSession = async () => {
    setError('');
    setBrief('');
    setStats(null);
    setMessages([]);
    setGenerating(true);
    try {
      const res = await fetch('/api/strategy/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate session');
      setBrief(data.brief);
      setStats(data.stats);
      loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setChatLoading(true);

    try {
      const res = await fetch('/api/strategy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          sessionBrief: brief,
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
      setChatLoading(false);
    }
  };

  // ── Plan gate ───────────────────────────────────────────────────────────────
  if (!isConcierge) {
    return (
      <div style={{ minHeight: '100vh', background: C.lightBg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: C.slate, marginBottom: 8, fontFamily: "'Montserrat', sans-serif" }}>Weekly Strategy Sessions</h2>
          <p style={{ fontSize: 15, color: C.gray, marginBottom: 24 }}>
            Personalized weekly AI career strategy sessions are exclusive to Concierge subscribers. Get data-driven pipeline analysis and a tactical action plan every week.
          </p>
          <a href="/app/billing" style={{ display: 'inline-block', padding: '12px 28px', background: C.blue, color: C.white, borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            Upgrade to Concierge →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.lightBg, fontFamily: "'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: C.white, borderBottom: '1px solid #e5e7eb', padding: '20px 32px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>
              Weekly Strategy Session
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: C.gray }}>
              Concierge · Personalized AI career coaching
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['session', 'history'].map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${view === v ? C.blue : '#e5e7eb'}`, background: view === v ? C.blue : C.white, color: view === v ? C.white : C.slate, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                {v === 'session' ? '⚡ This Week' : '📋 History'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>

        {error && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.3)', borderRadius: 10, color: '#dc2626', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* ── Session View ───────────────────────────────────────────────────── */}
        {view === 'session' && (
          <div>
            {/* Stats Row */}
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
                <StatCard label="This Week" value={stats.weeklyApplications} color={C.blue} />
                <StatCard label="Total Applied" value={stats.totalApplications} color={C.slate} />
                <StatCard label="Response Rate" value={stats.responseRate !== null ? `${stats.responseRate}%` : '—'} color={stats.responseRate > 10 ? C.green : C.amber} />
                <StatCard label="Interviews" value={stats.interviewsScheduled} color={C.green} />
                <StatCard label="Offers" value={stats.offersReceived} color={C.aqua} />
              </div>
            )}

            {/* Empty State */}
            {!brief && !generating && (
              <div style={{ background: C.white, borderRadius: 16, border: '1px solid #e5e7eb', padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
                <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>Ready for your strategy session?</h2>
                <p style={{ margin: '0 0 24px', fontSize: 14, color: C.gray, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
                  I'll analyze your application pipeline and deliver a personalized action plan for the coming week — including what's working, what isn't, and exactly what to do next.
                </p>
                <button onClick={generateSession}
                  style={{ padding: '13px 32px', background: C.blue, color: C.white, border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                  Start This Week's Session →
                </button>
              </div>
            )}

            {/* Generating State */}
            {generating && (
              <div style={{ background: C.white, borderRadius: 16, border: '1px solid #e5e7eb', padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>⚡</div>
                <p style={{ fontSize: 15, color: C.gray }}>Analyzing your pipeline and preparing your strategy brief...</p>
                <p style={{ fontSize: 13, color: C.gray, marginTop: 8 }}>This usually takes 10–15 seconds.</p>
              </div>
            )}

            {/* Brief + Chat */}
            {brief && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

                {/* Strategy Brief */}
                <div style={{ background: C.white, borderRadius: 16, border: '1px solid #e5e7eb', padding: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>Your Strategy Brief</h2>
                    <button onClick={generateSession}
                      style={{ fontSize: 12, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                      ↻ Regenerate
                    </button>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.75, color: '#374151' }}>
                    {formatMarkdown(brief)}
                  </div>
                </div>

                {/* Chat Follow-up */}
                <div style={{ background: C.white, borderRadius: 16, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: 520 }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>Ask Your Coach</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: C.gray }}>Follow-up questions about your strategy</p>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {messages.length === 0 && (
                      <div>
                        <p style={{ textAlign: 'center', color: C.gray, fontSize: 13, marginTop: 16 }}>Ask anything about your strategy brief...</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                          {[
                            "How do I improve my response rate?",
                            "Which roles should I prioritize this week?",
                            "What should I do if I'm not getting interviews?",
                          ].map((q, i) => (
                            <button key={i} onClick={() => setChatInput(q)}
                              style={{ padding: '8px 12px', background: C.lightBg, border: `1px solid #e5e7eb`, borderRadius: 8, fontSize: 12, color: C.slate, textAlign: 'left', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {messages.map((msg, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          maxWidth: '80%', padding: '10px 14px',
                          borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          background: msg.role === 'user' ? C.blue : C.lightBg,
                          color: msg.role === 'user' ? C.white : C.slate,
                          fontSize: 13, lineHeight: 1.6,
                        }}>
                          {msg.role === 'assistant' ? formatMarkdown(msg.content) : msg.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: C.lightBg, color: C.gray, fontSize: 13 }}>
                          ⚙️ Thinking...
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Ask a follow-up question..."
                      style={{ flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none' }}
                    />
                    <button type="submit" disabled={chatLoading || !chatInput.trim()}
                      style={{ padding: '9px 16px', background: chatLoading || !chatInput.trim() ? '#93c5fd' : C.blue, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif" }}>
                      Send
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── History View ───────────────────────────────────────────────────── */}
        {view === 'history' && (
          <div>
            {loading && <p style={{ textAlign: 'center', color: C.gray, fontSize: 14 }}>Loading history...</p>}
            {!loading && history.length === 0 && (
              <div style={{ background: C.white, borderRadius: 16, border: '1px solid #e5e7eb', padding: 48, textAlign: 'center' }}>
                <p style={{ color: C.gray, fontSize: 14 }}>No previous sessions yet. Start your first session to see it here.</p>
                <button onClick={() => setView('session')}
                  style={{ marginTop: 16, padding: '10px 20px', background: C.blue, color: C.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  ← Go to This Week
                </button>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map((session, i) => {
                const isExpanded = expandedHistory === i;
                const dateStr = new Date(session.generatedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                return (
                  <div key={i} style={{ background: C.white, borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <div
                      style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                      onClick={() => setExpandedHistory(isExpanded ? null : i)}
                    >
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.slate }}>{dateStr}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: C.gray }}>
                          {session.stats?.weeklyApplications || 0} applications · {session.stats?.responseRate !== null ? `${session.stats.responseRate}% response rate` : 'Response rate unknown'} · {session.stats?.interviewsScheduled || 0} interviews
                        </p>
                      </div>
                      <span style={{ fontSize: 18, color: C.gray }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '0 20px 20px', borderTop: '1px solid #f3f4f6' }}>
                        <div style={{ marginTop: 16, fontSize: 14, lineHeight: 1.75, color: '#374151' }}>
                          {formatMarkdown(session.brief)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
