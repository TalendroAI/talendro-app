/**
 * WeeklyStrategy.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Weekly AI Career Strategy Session — Concierge feature.
 *
 * Generates a personalized weekly strategy brief based on the user's
 * application pipeline data, then allows conversational follow-up.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO (Task 3.3):
 *   - The backend route POST /api/strategy/session is wired and ready.
 *   - The backend route POST /api/strategy/chat is wired and ready.
 *   - The backend route GET /api/strategy/history is wired and ready.
 *   - Implement strategyService.js on the backend to activate all three.
 *   - The UI below is complete and ready to use once the backend is live.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || '';

export default function WeeklyStrategy() {
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
  const messagesEndRef = useRef(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
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
      const res = await fetch(`${API_BASE}/api/strategy/history`, { headers: getAuthHeader() });
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
      const res = await fetch(`${API_BASE}/api/strategy/session`, {
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
      const res = await fetch(`${API_BASE}/api/strategy/chat`, {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Weekly Strategy Session</h1>
            <p className="text-gray-500 mt-1">Your personalized AI career coach, updated weekly.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('session')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === 'session' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setView('history')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === 'history' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Session View */}
        {view === 'session' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Sidebar */}
            {stats && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-fit">
                <h3 className="font-semibold text-gray-800 mb-4">This Week's Numbers</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Applications</span>
                    <span className="font-semibold text-gray-800">{stats.weeklyApplications}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total to Date</span>
                    <span className="font-semibold text-gray-800">{stats.totalApplications}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Response Rate</span>
                    <span className="font-semibold text-gray-800">
                      {stats.responseRate !== null ? `${stats.responseRate}%` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Interviews</span>
                    <span className="font-semibold text-gray-800">{stats.interviewsScheduled}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Offers</span>
                    <span className="font-semibold text-gray-800">{stats.offersReceived}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className={`${stats ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
              {!brief && !generating && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                  <div className="text-5xl mb-4">🎯</div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">Ready for your strategy session?</h2>
                  <p className="text-gray-500 text-sm mb-6">
                    I'll analyze your pipeline data and give you a personalized action plan for the coming week.
                  </p>
                  <button
                    onClick={generateSession}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                  >
                    Start This Week's Session
                  </button>
                </div>
              )}

              {generating && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                  <div className="text-5xl mb-4 animate-pulse">⚡</div>
                  <p className="text-gray-500 text-sm">Analyzing your pipeline and preparing your strategy brief...</p>
                </div>
              )}

              {brief && (
                <>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-800">Your Strategy Brief</h2>
                      <button
                        onClick={generateSession}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Regenerate
                      </button>
                    </div>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{brief}</pre>
                  </div>

                  {/* Chat Follow-up */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col" style={{ height: '40vh' }}>
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-medium text-gray-800 text-sm">Ask a follow-up question</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.length === 0 && (
                        <p className="text-center text-gray-400 text-sm mt-4">
                          Ask your coach anything about your strategy...
                        </p>
                      )}
                      {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-lg px-3 py-2 rounded-xl text-sm leading-relaxed ${
                            msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 px-3 py-2 rounded-xl text-sm text-gray-500">Thinking...</div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        placeholder="Ask a follow-up question..."
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={chatLoading || !chatInput.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* History View */}
        {view === 'history' && (
          <div className="space-y-4">
            {loading && <p className="text-center text-gray-400 text-sm">Loading history...</p>}
            {!loading && history.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <p className="text-gray-400 text-sm">No previous sessions yet. Start your first session above.</p>
              </div>
            )}
            {history.map((session, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-800">
                    {new Date(session.generatedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                  <span className="text-xs text-gray-400">{session.stats?.weeklyApplications || 0} applications that week</span>
                </div>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans leading-relaxed line-clamp-4">{session.brief}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
