/**
 * InterviewPrep.js
 * 
 * Main interview preparation page for authenticated Talendro subscribers.
 * Orchestrates three interview modes:
 *   1. Quick Prep — AI-generated prep packet (Starter+)
 *   2. Full Mock Interview — 10-question text chat with Sarah (Pro+)
 *   3. Audio Mock Interview — Voice-based interview with Sarah via Grok Realtime (Concierge)
 * 
 * This component replaces the Supabase-dependent InterviewCoach.tsx with a clean
 * Express API integration using the existing AuthContext.
 */
import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import AuthContext from '../auth/AuthContext';
import { ChatInterface } from './interview/ChatInterface';
import { QuickPrepContent } from './interview/QuickPrepContent';
import AudioInterface from './interview/AudioInterface';

// ─── API helpers ─────────────────────────────────────────────────────────────

function getAuthToken() {
  return localStorage.getItem('authToken') || localStorage.getItem('talendro_token') || '';
}

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

// ─── Plan tier helpers ────────────────────────────────────────────────────────

const PLAN_TIERS = { basic: 1, pro: 2, premium: 3 };

function canAccess(userPlan, requiredPlan) {
  return (PLAN_TIERS[userPlan] || 0) >= (PLAN_TIERS[requiredPlan] || 0);
}

// ─── Session type config ──────────────────────────────────────────────────────

const SESSION_TYPES = [
  {
    id: 'quick_prep',
    name: 'Quick Prep',
    icon: '⚡',
    tagline: 'AI-generated prep packet in minutes',
    description: 'Get a comprehensive prep packet with tailored interview questions, STAR-method answer frameworks, company research, and key talking points — all generated specifically for the job you\'re applying to.',
    requiredPlan: 'basic',
    planLabel: 'All Plans',
    color: 'blue',
  },
  {
    id: 'full_mock',
    name: 'Full Mock Interview',
    icon: '🎯',
    tagline: '10-question text interview with AI feedback',
    description: 'Practice with Sarah, your AI interview coach. She\'ll ask 10 tailored questions, give you real-time feedback on each answer, and provide a detailed performance analysis at the end.',
    requiredPlan: 'pro',
    planLabel: 'Pro & Concierge',
    color: 'indigo',
  },
  {
    id: 'premium_audio',
    name: 'Audio Mock Interview',
    icon: '🎙️',
    tagline: 'Voice-to-voice interview with Sarah',
    description: 'The most realistic practice experience. Speak your answers naturally and Sarah responds in real-time with her voice. Includes full transcript and performance analysis.',
    requiredPlan: 'premium',
    planLabel: 'Concierge Only',
    color: 'purple',
  },
];

// ─── Document Input Form ──────────────────────────────────────────────────────

function DocumentForm({ documents, onChange, onSave, isSaving }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Your Information</h3>
        <p className="text-sm text-gray-500">Paste your resume and the job description to personalize your session.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
        <input
          type="text"
          value={documents.firstName}
          onChange={e => onChange({ ...documents, firstName: e.target.value })}
          placeholder="Your first name"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Resume <span className="text-red-500">*</span>
        </label>
        <textarea
          value={documents.resume}
          onChange={e => onChange({ ...documents, resume: e.target.value })}
          placeholder="Paste your full resume text here..."
          rows={8}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Job Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={documents.jobDescription}
          onChange={e => onChange({ ...documents, jobDescription: e.target.value })}
          placeholder="Paste the full job description here..."
          rows={8}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company URL (optional)</label>
        <input
          type="url"
          value={documents.companyUrl}
          onChange={e => onChange({ ...documents, companyUrl: e.target.value })}
          placeholder="https://company.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        onClick={onSave}
        disabled={isSaving || documents.resume.trim().length < 50 || documents.jobDescription.trim().length < 50}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors"
      >
        {isSaving ? 'Saving...' : 'Continue to Interview'}
      </button>
    </div>
  );
}

// ─── Session Type Selector ────────────────────────────────────────────────────

function SessionTypeSelector({ userPlan, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {SESSION_TYPES.map(type => {
        const accessible = canAccess(userPlan, type.requiredPlan);
        const colorMap = {
          blue: 'border-blue-200 bg-blue-50',
          indigo: 'border-indigo-200 bg-indigo-50',
          purple: 'border-purple-200 bg-purple-50',
        };
        const btnColorMap = {
          blue: 'bg-blue-600 hover:bg-blue-700',
          indigo: 'bg-indigo-600 hover:bg-indigo-700',
          purple: 'bg-purple-600 hover:bg-purple-700',
        };
        return (
          <div
            key={type.id}
            className={`rounded-2xl border-2 p-6 flex flex-col ${accessible ? colorMap[type.color] : 'border-gray-200 bg-gray-50 opacity-60'}`}
          >
            <div className="text-3xl mb-3">{type.icon}</div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-gray-900">{type.name}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${accessible ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                {type.planLabel}
              </span>
            </div>
            <p className="text-sm text-gray-500 italic mb-3">{type.tagline}</p>
            <p className="text-sm text-gray-600 flex-1 mb-5">{type.description}</p>
            {accessible ? (
              <button
                onClick={() => onSelect(type.id)}
                className={`w-full text-white font-semibold py-2.5 px-4 rounded-xl transition-colors ${btnColorMap[type.color]}`}
              >
                Start {type.name}
              </button>
            ) : (
              <button
                disabled
                className="w-full bg-gray-200 text-gray-400 font-semibold py-2.5 px-4 rounded-xl cursor-not-allowed"
              >
                Upgrade to Access
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Quick Prep View — wraps QuickPrepContent.tsx ───────────────────────────

function QuickPrepView({ documents, sessionId, onDone }) {  // eslint-disable-line no-unused-vars
// REPLACED: now handled inline in main render using QuickPrepContent
return null; }

function _QuickPrepView_UNUSED({ documents, sessionId, onDone }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function generate() {
      try {
        const data = await apiPost('/api/interview/chat', {
          session_type: 'quick_prep',
          session_id: sessionId,
          documents,
          is_initial: true,
        });
        if (!cancelled) setContent(data.message);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    generate();
    return () => { cancelled = true; };
  }, [sessionId, documents]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 font-medium">Sarah is preparing your interview packet...</p>
        <p className="text-sm text-gray-400">This usually takes 20–30 seconds</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-medium mb-2">Failed to generate prep packet</p>
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={onDone} className="mt-4 text-sm text-blue-600 hover:underline">← Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">⚡ Your Quick Prep Packet</h2>
        <button onClick={onDone} className="text-sm text-gray-500 hover:text-gray-700">← New Session</button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">{content}</pre>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Mock View — replaced by ChatInterface.tsx ─────────────────────────

function ChatMockView({ documents, sessionId, userEmail, onDone }) {  // eslint-disable-line no-unused-vars
// REPLACED: now handled inline in main render using ChatInterface
return null; }

function _ChatMockView_UNUSED({ documents, sessionId, userEmail, onDone }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef(null);
  const questionCount = useRef(0);

  useEffect(() => {
    // Start the interview with Sarah's opening
    async function startInterview() {
      setIsLoading(true);
      try {
        const data = await apiPost('/api/interview/chat', {
          session_type: 'full_mock',
          session_id: sessionId,
          documents,
          is_initial: true,
        });
        setMessages([{ role: 'assistant', content: data.message, id: Date.now() }]);
        if (data.message.includes('?')) questionCount.current = 1;
      } catch (err) {
        setMessages([{ role: 'assistant', content: 'Hello! I\'m Sarah, your interview coach. I\'m ready to begin your mock interview. Could you start by telling me a bit about yourself and why you\'re interested in this role?', id: Date.now() }]);
        questionCount.current = 1;
      } finally {
        setIsLoading(false);
      }
    }
    startInterview();
  }, [sessionId, documents]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = { role: 'user', content: input.trim(), id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await apiPost('/api/interview/chat', {
        session_type: 'full_mock',
        session_id: sessionId,
        messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        documents,
      });
      const assistantMsg = { role: 'assistant', content: data.message, id: Date.now() + 1 };
      setMessages(prev => [...prev, assistantMsg]);
      if (data.message.includes('?')) questionCount.current += 1;
      if (questionCount.current >= 10 || data.isComplete) setIsComplete(true);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, I had trouble processing that. Could you try again?', id: Date.now() + 1 }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg">👩‍💼</div>
          <div>
            <p className="font-semibold text-gray-900">Sarah Chen</p>
            <p className="text-xs text-gray-500">AI Interview Coach · Question {Math.min(questionCount.current, 10)}/10</p>
          </div>
        </div>
        <button onClick={onDone} className="text-sm text-gray-500 hover:text-gray-700">End Session</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-4 space-y-4 mb-4" style={{ maxHeight: '500px' }}>
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isComplete ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-green-700 font-semibold mb-2">🎉 Interview Complete!</p>
          <p className="text-sm text-green-600 mb-3">Great work! You've completed all 10 questions.</p>
          <button onClick={onDone} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-xl">View Summary</button>
        </div>
      ) : (
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type your answer... (Enter to send)"
            rows={3}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold px-5 rounded-xl transition-colors"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Audio Mock View — replaced by AudioInterface.tsx ───────────────────────

function AudioMockView({ documents, sessionId, userEmail, onDone }) {  // eslint-disable-line no-unused-vars
// REPLACED: now handled inline in main render using AudioInterface
return null; }

function _AudioMockView_UNUSED({ documents, sessionId, userEmail, onDone }) {
  const [AudioInterface, setAudioInterface] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    // Dynamically import the TypeScript AudioInterface component
    import('./interview/AudioInterface')
      .then(mod => setAudioInterface(() => mod.AudioInterface))
      .catch(err => {
        console.error('Failed to load AudioInterface:', err);
        setLoadError(err.message);
      });
  }, []);

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-medium mb-2">Failed to load Audio Interface</p>
        <p className="text-sm text-red-500">{loadError}</p>
        <button onClick={onDone} className="mt-4 text-sm text-blue-600 hover:underline">← Back</button>
      </div>
    );
  }

  if (!AudioInterface) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 font-medium">Loading Audio Interface...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">🎙️ Audio Mock Interview</h2>
        <button onClick={onDone} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
      </div>
      <AudioInterface
        isActive={true}
        sessionId={sessionId}
        documents={documents}
        isDocumentsSaved={true}
        userEmail={userEmail}
        onInterviewComplete={onDone}
        onSessionComplete={onDone}
      />
    </div>
  );
}

// ─── Main InterviewPrep Component ─────────────────────────────────────────────

export default function InterviewPrep() {
  const { user } = useContext(AuthContext);
  const [step, setStep] = useState('select'); // 'select' | 'documents' | 'session'
  const [selectedType, setSelectedType] = useState(null);
  const [documents, setDocuments] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    resume: '',
    jobDescription: '',
    companyUrl: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionDone, setSessionDone] = useState(false);

  // Quick Prep state — managed here, passed to QuickPrepContent
  const [quickPrepContent, setQuickPrepContent] = useState(null);
  const [quickPrepLoading, setQuickPrepLoading] = useState(false);
  const [quickPrepError, setQuickPrepError] = useState(null);

  // Session completion state
  const [isCompletingSession, setIsCompletingSession] = useState(false);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);

  const userPlan = user?.plan || 'basic';
  const [searchParams] = useSearchParams();

  // Pre-select session type from URL param (e.g., ?type=quick_prep from dashboard)
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam && SESSION_TYPES.find(t => t.id === typeParam)) {
      if (canAccess(userPlan, SESSION_TYPES.find(t => t.id === typeParam)?.requiredPlan)) {
        setSelectedType(typeParam);
        setStep('documents');
      }
    }
  }, [searchParams, userPlan]);

  const handleSelectType = (typeId) => {
    setSelectedType(typeId);
    setStep('documents');
    setSessionDone(false);
    setQuickPrepContent(null);
    setQuickPrepError(null);
    setIsSessionCompleted(false);
  };

  const handleSaveDocuments = async () => {
    setIsSaving(true);
    try {
      const data = await apiPost('/api/interview/session/create', {
        sessionType: selectedType,
        documents,
      });
      setSessionId(data.sessionId);
    } catch (err) {
      console.error('Failed to create session:', err);
      setSessionId(`local_${Date.now()}`);
    } finally {
      setIsSaving(false);
      setStep('session');
    }
  };

  // Generate Quick Prep content once sessionId is available
  const generateQuickPrep = useCallback(async (sid) => {
    setQuickPrepLoading(true);
    setQuickPrepError(null);
    try {
      const data = await apiPost('/api/interview/chat', {
        session_type: 'quick_prep',
        session_id: sid,
        documents,
        is_initial: true,
      });
      setQuickPrepContent(data.message);
    } catch (err) {
      setQuickPrepError(err.message);
    } finally {
      setQuickPrepLoading(false);
    }
  }, [documents]);

  useEffect(() => {
    if (step === 'session' && selectedType === 'quick_prep' && sessionId && !quickPrepContent && !quickPrepLoading) {
      generateQuickPrep(sessionId);
    }
  }, [step, selectedType, sessionId, quickPrepContent, quickPrepLoading, generateQuickPrep]);

  const handleCompleteSession = async () => {
    setIsCompletingSession(true);
    try {
      await apiPost('/api/interview/session/complete', { sessionId });
    } catch (err) {
      console.error('Failed to mark session complete:', err);
    } finally {
      setIsCompletingSession(false);
      setIsSessionCompleted(true);
    }
  };

  const handleSessionDone = () => {
    setSessionDone(true);
    setStep('select');
    setSelectedType(null);
    setSessionId(null);
    setQuickPrepContent(null);
    setQuickPrepError(null);
    setIsSessionCompleted(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Preparation</h1>
        <p className="text-gray-500">Practice with Sarah, your AI interview coach. Choose a session type to get started.</p>
      </div>

      {sessionDone && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-green-600 text-xl">✓</span>
          <p className="text-green-700 font-medium">Session complete! Ready for another round?</p>
        </div>
      )}

      {/* Step: Select Session Type */}
      {step === 'select' && (
        <SessionTypeSelector userPlan={userPlan} onSelect={handleSelectType} />
      )}

      {/* Step: Enter Documents */}
      {step === 'documents' && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setStep('select')} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
            <span className="text-gray-300">|</span>
            <p className="text-sm text-gray-600">
              Starting: <span className="font-semibold text-gray-900">{SESSION_TYPES.find(t => t.id === selectedType)?.name}</span>
            </p>
          </div>
          <DocumentForm
            documents={documents}
            onChange={setDocuments}
            onSave={handleSaveDocuments}
            isSaving={isSaving}
          />
        </div>
      )}

      {/* Step: Quick Prep — uses QuickPrepContent.tsx */}
      {step === 'session' && selectedType === 'quick_prep' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">⚡ Quick Prep</h2>
            <button onClick={handleSessionDone} className="text-sm text-gray-500 hover:text-gray-700">← New Session</button>
          </div>
          <QuickPrepContent
            content={quickPrepContent}
            isLoading={quickPrepLoading}
            error={quickPrepError}
            onCompleteSession={handleCompleteSession}
            isCompletingSession={isCompletingSession}
            isSessionCompleted={isSessionCompleted}
            isContentReady={!!quickPrepContent}
            companyUrl={documents.companyUrl}
          />
        </div>
      )}

      {/* Step: Full Mock Interview — uses ChatInterface.tsx */}
      {step === 'session' && selectedType === 'full_mock' && sessionId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">💬 Full Mock Interview</h2>
            <button onClick={handleSessionDone} className="text-sm text-gray-500 hover:text-gray-700">← End Session</button>
          </div>
          <ChatInterface
            sessionType="full_mock"
            isActive={true}
            sessionId={sessionId}
            documents={documents}
            userEmail={user?.email}
            onInterviewComplete={(msgs) => console.log('[InterviewPrep] Full mock complete, messages:', msgs?.length)}
            onCompleteSession={handleCompleteSession}
            isCompletingSession={isCompletingSession}
            isSessionCompleted={isSessionCompleted}
            isContentReady={true}
          />
        </div>
      )}

      {/* Step: Audio Mock Interview — uses AudioInterface.tsx (Grok Realtime) */}
      {step === 'session' && selectedType === 'audio_mock' && sessionId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">🎙️ Audio Mock Interview</h2>
            <button onClick={handleSessionDone} className="text-sm text-gray-500 hover:text-gray-700">← End Session</button>
          </div>
          <AudioInterface
            isActive={true}
            sessionId={sessionId}
            documents={documents}
            isDocumentsSaved={true}
            userEmail={user?.email}
            onInterviewComplete={handleSessionDone}
            onSessionComplete={handleSessionDone}
          />
        </div>
      )}
    </div>
  );
}
