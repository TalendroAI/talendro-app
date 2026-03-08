/**
 * SalaryNegotiation.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Salary Negotiation Coach — Pro & Concierge feature.
 *
 * Two modes:
 *   1. Analyze Mode: User enters offer details → receives a one-shot analysis
 *      with market assessment, counter-offer recommendation, and a script.
 *   2. Chat Mode: Conversational coaching for multi-round negotiation.
 *      (Concierge only for multi-round; Pro gets single-round analysis.)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO (Task 2.2):
 *   - The backend route POST /api/negotiation/analyze is wired and ready.
 *   - The backend route POST /api/negotiation/chat is wired and ready.
 *   - Implement negotiationService.js on the backend to activate both.
 *   - The UI below is complete and ready to use once the backend is live.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || '';

export default function SalaryNegotiation() {
  const [mode, setMode] = useState('analyze'); // 'analyze' | 'chat'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Analyze mode state
  const [offerForm, setOfferForm] = useState({
    jobTitle: '',
    companyName: '',
    offeredSalary: '',
    location: '',
    seniorityLevel: '',
  });
  const [analysis, setAnalysis] = useState('');

  // Chat mode state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatContext, setChatContext] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');
    setAnalysis('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/negotiation/analyze`, {
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      const res = await fetch(`${API_BASE}/api/negotiation/chat`, {
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

  const startChatFromAnalysis = () => {
    setChatContext({
      jobTitle: offerForm.jobTitle,
      companyName: offerForm.companyName,
      offeredSalary: parseInt(offerForm.offeredSalary.replace(/[^0-9]/g, ''), 10),
      location: offerForm.location,
      seniorityLevel: offerForm.seniorityLevel,
    });
    setMessages([{
      role: 'assistant',
      content: `I've reviewed your offer from ${offerForm.companyName || 'the company'}. I'm ready to coach you through the negotiation. What would you like to work on first — the counter-offer script, handling objections, or something else?`,
    }]);
    setMode('chat');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Salary Negotiation Coach</h1>
          <p className="text-gray-500 mt-1">Get AI-powered guidance to maximize your compensation.</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('analyze')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'analyze' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Analyze an Offer
          </button>
          <button
            onClick={() => setMode('chat')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'chat' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Negotiation Chat
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Analyze Mode */}
        {mode === 'analyze' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Enter Offer Details</h2>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={offerForm.jobTitle}
                    onChange={e => setOfferForm(f => ({ ...f, jobTitle: e.target.value }))}
                    placeholder="e.g. Senior Product Manager"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={offerForm.companyName}
                    onChange={e => setOfferForm(f => ({ ...f, companyName: e.target.value }))}
                    placeholder="e.g. Stripe"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offered Salary</label>
                  <input
                    type="text"
                    value={offerForm.offeredSalary}
                    onChange={e => setOfferForm(f => ({ ...f, offeredSalary: e.target.value }))}
                    placeholder="e.g. $145,000"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={offerForm.location}
                    onChange={e => setOfferForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. San Francisco, CA or Remote"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seniority Level</label>
                  <select
                    value={offerForm.seniorityLevel}
                    onChange={e => setOfferForm(f => ({ ...f, seniorityLevel: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select level...</option>
                    <option value="entry">Entry Level (0-2 years)</option>
                    <option value="mid">Mid Level (3-5 years)</option>
                    <option value="senior">Senior (6-10 years)</option>
                    <option value="staff">Staff / Principal (10+ years)</option>
                    <option value="director">Director / VP</option>
                    <option value="executive">C-Suite / Executive</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Analyzing...' : 'Analyze This Offer'}
              </button>
            </form>

            {analysis && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3">Negotiation Analysis</h3>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{analysis}</pre>
                <button
                  onClick={startChatFromAnalysis}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Continue to Negotiation Chat →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Chat Mode */}
        {mode === 'chat' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col" style={{ height: '60vh' }}>
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Negotiation Coach</h2>
              <p className="text-xs text-gray-400">Ask anything about your negotiation strategy</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 text-sm mt-8">
                  Start by describing your situation or asking a question about your negotiation.
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-lg px-4 py-3 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-3 rounded-xl text-sm text-gray-500">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask your negotiation coach..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !chatInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
