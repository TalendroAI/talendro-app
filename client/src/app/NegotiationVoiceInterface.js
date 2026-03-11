/**
 * NegotiationVoiceInterface.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Voice Salary Negotiation Role-Play — Concierge feature.
 *
 * Uses the xAI Realtime WebSocket API (same engine as AudioInterface.js) to
 * conduct a live, spoken salary negotiation role-play session. The AI plays
 * the role of a hiring manager or recruiter making an offer; the user practices
 * their negotiation in real time.
 *
 * Architecture mirrors AudioInterface.js exactly — same PCM encoding/decoding,
 * same WebSocket protocol, same token fetch pattern — to preserve the
 * established audio port system.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const GROK_WS_URL = 'wss://api.x.ai/v1/realtime';
const GROK_VOICE = 'Rex';   // Professional male voice for the hiring manager persona
const AUDIO_SAMPLE_RATE = 24000;
const HEARTBEAT_INTERVAL = 5000;
const SILENCE_TIMEOUT = 180000;
const MAX_RECONNECT_ATTEMPTS = 3;

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
  border: '#E5E7EB',
  greenBg: 'rgba(16,185,129,0.08)',
  redBg: 'rgba(239,68,68,0.08)',
};

// ─── PCM Helpers (identical to AudioInterface.js) ────────────────────────────
function float32ToBase64PCM16(float32) {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64PCM16ToFloat32(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7FFF);
  return float32;
}

// ─── Build system instructions for the hiring manager persona ────────────────
function buildNegotiationInstructions({ jobTitle, companyName, offeredSalary, desiredSalary, seniorityLevel, location }) {
  const title = jobTitle || 'the position';
  const company = companyName || 'our company';
  const offered = offeredSalary ? `$${Number(offeredSalary).toLocaleString()}` : 'the offered amount';
  const desired = desiredSalary ? `$${Number(desiredSalary).toLocaleString()}` : null;
  const level = seniorityLevel || 'mid-level';
  const loc = location || 'the listed location';

  return `You are Jordan, a senior recruiter at ${company}. You are conducting a real-time salary negotiation call with a candidate who has just received an offer for the ${title} role (${level}, ${loc}).

YOUR ROLE:
- You are playing the hiring manager/recruiter making and defending the offer.
- You opened with an offer of ${offered}.${desired ? ` The candidate's target is ${desired}.` : ''}
- Your goal is to be realistic: push back professionally, use standard recruiter tactics (budget constraints, equity, benefits, growth trajectory), but ultimately be willing to negotiate within reason.
- You are NOT a coach in this session — you are the other side of the negotiation table.
- Respond naturally, as a real recruiter would in a live phone call.

VOICE AND DELIVERY RULES:
- Speak in a calm, professional, slightly formal American English tone.
- Keep responses concise — this is a phone call, not a lecture.
- React authentically to what the candidate says: if they make a strong case, acknowledge it. If they are vague, probe.
- Do not break character. Do not offer coaching tips during the role-play.

NEGOTIATION TACTICS YOU MAY USE:
- "That's at the top of our band for this level."
- "I can check with the hiring manager, but I want to set expectations."
- "We do have flexibility on the signing bonus / equity / remote days."
- "The growth trajectory here is strong — many people at this level are at [X] within 18 months."
- "I want to make this work — what's most important to you?"

SESSION STRUCTURE:
1. Open by introducing yourself and confirming the offer details.
2. Invite the candidate to share their thoughts on the offer.
3. Respond to their negotiation attempts realistically over multiple rounds.
4. After 4–6 exchanges, reach a natural conclusion (accepted, countered, or tabled).
5. End by summarizing what was agreed and wishing them well.

After the session ends, tell the candidate: "Great work today. A summary of this negotiation session will be available in your dashboard."`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function NegotiationVoiceInterface({ context, onSessionEnd }) {
  const [phase, setPhase] = useState('setup');   // 'setup' | 'connecting' | 'active' | 'ended'
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionDropped, setConnectionDropped] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState('');
  const [sessionSummary, setSessionSummary] = useState('');

  // Form state for setup
  const [jobTitle, setJobTitle] = useState(context?.jobTitle || '');
  const [companyName, setCompanyName] = useState(context?.companyName || '');
  const [offeredSalary, setOfferedSalary] = useState(context?.offeredSalary ? String(context.offeredSalary) : '');
  const [desiredSalary, setDesiredSalary] = useState(context?.desiredSalary ? String(context.desiredSalary) : '');
  const [seniorityLevel, setSeniorityLevel] = useState(context?.seniorityLevel || '');
  const [location, setLocation] = useState(context?.location || '');

  // Refs
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const playbackQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const heartbeatRef = useRef(null);
  const userEndedRef = useRef(false);
  const transcriptRef = useRef([]);
  const currentResponseTextRef = useRef('');
  const currentUserTextRef = useRef('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('talendro_token') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ── Audio playback engine ──────────────────────────────────────────────────
  const playNextChunk = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || isPlayingRef.current || playbackQueueRef.current.length === 0) return;
    isPlayingRef.current = true;
    const chunk = playbackQueueRef.current.shift();
    const buffer = ctx.createBuffer(1, chunk.length, AUDIO_SAMPLE_RATE);
    buffer.getChannelData(0).set(chunk);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      isPlayingRef.current = false;
      if (playbackQueueRef.current.length > 0) playNextChunk();
      else setIsSpeaking(false);
    };
    source.start();
    setIsSpeaking(true);
  }, []);

  const enqueueAudio = useCallback((base64) => {
    const float32 = base64PCM16ToFloat32(base64);
    playbackQueueRef.current.push(float32);
    if (!isPlayingRef.current) playNextChunk();
  }, [playNextChunk]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null; }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  // ── Append transcript turn ─────────────────────────────────────────────────
  const appendTurn = useCallback((role, text) => {
    const clean = typeof text === 'string' ? text.trim() : '';
    if (!clean) return;
    const last = transcriptRef.current[transcriptRef.current.length - 1];
    if (last && last.role === role && last.text === clean) return;
    const entry = { role, text: clean, ts: Date.now() };
    transcriptRef.current.push(entry);
    setTranscript(prev => [...prev, entry]);
  }, []);

  // ── End session ────────────────────────────────────────────────────────────
  const endSession = useCallback(async () => {
    userEndedRef.current = true;
    cleanup();
    setIsConnected(false);
    setIsSpeaking(false);
    setPhase('ended');

    // Build summary from transcript
    const summary = transcriptRef.current
      .map(t => `${t.role === 'user' ? 'You' : 'Jordan (Recruiter)'}: ${t.text}`)
      .join('\n\n');
    setSessionSummary(summary);
    onSessionEnd?.({ transcript: transcriptRef.current, summary });
  }, [cleanup, onSessionEnd]);

  // ── Start voice session ────────────────────────────────────────────────────
  const startVoiceSession = useCallback(async () => {
    setError('');
    setIsConnecting(true);
    setPhase('connecting');
    transcriptRef.current = [];
    setTranscript([]);
    currentResponseTextRef.current = '';
    currentUserTextRef.current = '';
    userEndedRef.current = false;

    try {
      // 1. Get microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 2. Fetch ephemeral voice token
      const tokenRes = await fetch('/api/negotiation/voice-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      });
      const tokenData = await tokenRes.json();
      const token = tokenData?.token;
      if (!tokenRes.ok || !token) throw new Error(tokenData?.error || 'Failed to get voice token');

      // 3. Build instructions
      const instructions = buildNegotiationInstructions({
        jobTitle, companyName,
        offeredSalary: offeredSalary ? parseInt(offeredSalary.replace(/[^0-9]/g, ''), 10) : undefined,
        desiredSalary: desiredSalary ? parseInt(desiredSalary.replace(/[^0-9]/g, ''), 10) : undefined,
        seniorityLevel, location,
      });

      // 4. Create AudioContext
      const audioCtx = new AudioContext({ sampleRate: AUDIO_SAMPLE_RATE });
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      audioContextRef.current = audioCtx;

      // 5. Connect WebSocket
      const ws = new WebSocket(GROK_WS_URL, [`xai-client-secret.${token}`]);
      wsRef.current = ws;

      ws.onopen = () => {
        // Configure session
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            voice: GROK_VOICE,
            instructions,
            audio: {
              input: { format: { type: 'audio/pcm', rate: AUDIO_SAMPLE_RATE } },
              output: { format: { type: 'audio/pcm', rate: AUDIO_SAMPLE_RATE } },
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1500,
            },
          },
        }));

        // Jordan opens the call
        const greeting = `Hi, this is Jordan calling from ${companyName || 'the company'}. I'm reaching out to follow up on the offer we extended for the ${jobTitle || 'position'}. Do you have a few minutes to talk?`;
        ws.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [{ type: 'input_text', text: `[SYSTEM: Begin the negotiation call. Say the following out loud:] ${greeting}` }],
          },
        }));
        ws.send(JSON.stringify({ type: 'response.create' }));

        setIsConnecting(false);
        setIsConnected(true);
        setPhase('active');

        // Start heartbeat
        heartbeatRef.current = setInterval(() => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            setConnectionDropped(true);
          }
        }, HEARTBEAT_INTERVAL);

        // Start mic capture
        const source = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        processor.onaudioprocess = (e) => {
          if (isMuted || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
          const base64 = float32ToBase64PCM16(e.inputBuffer.getChannelData(0));
          wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64 }));
        };
        source.connect(processor);
        processor.connect(audioCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'response.audio.delta':
            case 'response.output_audio.delta':
              if (msg.delta) enqueueAudio(msg.delta);
              break;
            case 'response.audio_transcript.delta':
            case 'response.output_audio_transcript.delta':
              if (msg.delta) currentResponseTextRef.current += msg.delta;
              break;
            case 'response.audio_transcript.done':
            case 'response.output_audio_transcript.done': {
              const fullText = msg.transcript || currentResponseTextRef.current;
              if (fullText) appendTurn('assistant', fullText);
              currentResponseTextRef.current = '';
              break;
            }
            case 'conversation.item.input_audio_transcription.completed':
              if (msg.transcript) appendTurn('user', msg.transcript);
              break;
            case 'input_audio_buffer.speech_started':
              playbackQueueRef.current = [];
              setIsSpeaking(false);
              break;
            case 'response.done':
              setIsSpeaking(false);
              break;
            case 'error':
              console.error('[NegotiationVoice] xAI error:', msg.error);
              break;
            default:
              break;
          }
        } catch (e) {
          console.warn('[NegotiationVoice] Failed to parse WS message:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('[NegotiationVoice] WebSocket error:', err);
        setError('Connection error. Please try again.');
        setIsConnecting(false);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsSpeaking(false);
        setIsConnecting(false);
        cleanup();
        if (!userEndedRef.current && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          setConnectionDropped(true);
          setReconnectAttempts(prev => prev + 1);
        }
      };

    } catch (err) {
      console.error('[NegotiationVoice] startVoiceSession error:', err);
      setError(err.message || 'Failed to start voice session');
      setIsConnecting(false);
      setPhase('setup');
      cleanup();
    }
  }, [jobTitle, companyName, offeredSalary, desiredSalary, seniorityLevel, location, isMuted, enqueueAudio, appendTurn, cleanup, reconnectAttempts]);

  // ─── Render: Setup ──────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 32 }}>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>
            🎙️ Voice Salary Negotiation Role-Play
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: C.gray }}>
            You will speak live with Jordan, an AI recruiter. Practice your negotiation before the real call.
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: C.redBg, border: `1px solid ${C.red}`, borderRadius: 8, color: C.red, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Job Title', value: jobTitle, setter: setJobTitle, placeholder: 'e.g. Senior Product Manager' },
            { label: 'Company Name', value: companyName, setter: setCompanyName, placeholder: 'e.g. Acme Corp' },
            { label: 'Offered Salary ($)', value: offeredSalary, setter: setOfferedSalary, placeholder: 'e.g. 120000' },
            { label: 'Your Target Salary ($)', value: desiredSalary, setter: setDesiredSalary, placeholder: 'e.g. 140000' },
            { label: 'Seniority Level', value: seniorityLevel, setter: setSeniorityLevel, placeholder: 'e.g. Senior, Director' },
            { label: 'Location', value: location, setter: setLocation, placeholder: 'e.g. New York, NY (Remote)' },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.slate, marginBottom: 6 }}>{label}</label>
              <input
                type="text"
                value={value}
                onChange={e => setter(e.target.value)}
                placeholder={placeholder}
                style={{ width: '100%', border: `1.5px solid ${C.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>

        <div style={{ background: '#FFF7ED', border: `1px solid ${C.amber}`, borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#92400E' }}>
          <strong>Before you start:</strong> Make sure your microphone is connected and you are in a quiet space. Jordan will open the call — just respond naturally.
        </div>

        <button
          onClick={startVoiceSession}
          style={{ width: '100%', padding: '14px', background: C.aqua, color: C.white, border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
        >
          Start Negotiation Call →
        </button>
      </div>
    );
  }

  // ─── Render: Connecting ─────────────────────────────────────────────────────
  if (phase === 'connecting') {
    return (
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📞</div>
        <p style={{ fontSize: 15, color: C.gray }}>Connecting to Jordan...</p>
        <p style={{ fontSize: 13, color: C.gray, marginTop: 6 }}>Setting up your voice session. This takes a few seconds.</p>
      </div>
    );
  }

  // ─── Render: Active ─────────────────────────────────────────────────────────
  if (phase === 'active') {
    return (
      <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', height: 560 }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: isConnected ? C.green : C.amber, boxShadow: isConnected ? `0 0 0 4px ${C.greenBg}` : 'none' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.slate }}>Jordan — {companyName || 'Recruiter'}</div>
              <div style={{ fontSize: 12, color: C.gray }}>{isSpeaking ? 'Speaking...' : isConnected ? 'Listening' : 'Connecting...'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setIsMuted(m => !m)}
              style={{ padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${isMuted ? C.red : C.border}`, background: isMuted ? C.redBg : C.white, color: isMuted ? C.red : C.slate, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              {isMuted ? '🔇 Muted' : '🎙️ Live'}
            </button>
            <button
              onClick={endSession}
              style={{ padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${C.red}`, background: C.redBg, color: C.red, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              End Call
            </button>
          </div>
        </div>

        {/* Transcript */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {transcript.length === 0 && (
            <div style={{ textAlign: 'center', color: C.gray, fontSize: 13, marginTop: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📞</div>
              Jordan is about to speak. Get ready to respond naturally.
            </div>
          )}
          {transcript.map((turn, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: turn.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '78%',
                padding: '10px 14px',
                borderRadius: turn.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: turn.role === 'user' ? C.blue : C.lightBg,
                color: turn.role === 'user' ? C.white : C.slate,
                fontSize: 13,
                lineHeight: 1.6,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, opacity: 0.7 }}>
                  {turn.role === 'user' ? 'You' : 'Jordan (Recruiter)'}
                </div>
                {turn.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {connectionDropped && (
          <div style={{ padding: '10px 24px', background: '#FEF3C7', borderTop: `1px solid ${C.amber}`, fontSize: 13, color: '#92400E', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Connection dropped.
            <button onClick={startVoiceSession} style={{ padding: '6px 14px', background: C.amber, color: C.white, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Reconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Render: Ended ──────────────────────────────────────────────────────────
  return (
    <div style={{ background: C.white, borderRadius: 16, border: `1px solid ${C.border}`, padding: 32 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.slate, fontFamily: "'Montserrat', sans-serif" }}>
          Negotiation Session Complete
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: C.gray }}>
          Great work. Here is a transcript of your negotiation call.
        </p>
      </div>

      {transcript.length > 0 && (
        <div style={{ background: C.lightBg, borderRadius: 10, padding: 20, maxHeight: 320, overflowY: 'auto', marginBottom: 20 }}>
          {transcript.map((turn, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: turn.role === 'user' ? C.blue : C.slate, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {turn.role === 'user' ? 'You' : 'Jordan (Recruiter)'}
              </div>
              <div style={{ fontSize: 13, color: C.slate, lineHeight: 1.6 }}>{turn.text}</div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => { setPhase('setup'); setTranscript([]); transcriptRef.current = []; setReconnectAttempts(0); }}
        style={{ width: '100%', padding: '12px', background: C.aqua, color: C.white, border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
      >
        Start Another Session
      </button>
    </div>
  );
}
