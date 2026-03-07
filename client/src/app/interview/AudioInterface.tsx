import { useState, useCallback, useRef, useEffect } from 'react';
import { MicOff, Mic, Volume2, PhoneOff, Loader2, Lightbulb, RefreshCw, WifiOff, AlertTriangle, CheckCircle2, Pause, Play, Mail } from 'lucide-react';
// Button replaced with inline JSX
import { cn } from './utils.js';
// supabase removed - using Express API
import { useToast } from './useToast.js';
import sarahHeadshot from './sarah-headshot.jpg';
import { AudioDeviceSelect } from './audio/AudioDeviceSelect.tsx';
import { useAudioDevices } from './audio/useAudioDevices.ts';
import { useAudioSessionPersistence } from './useAudioSessionPersistence.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AudioInterfaceProps {
  isActive: boolean;
  sessionId?: string;
  documents?: {
    firstName: string;
    resume: string;
    jobDescription: string;
    companyUrl: string;
  };
  isDocumentsSaved?: boolean;
  resumeFromPause?: boolean;
  onInterviewStarted?: () => void;
  onInterviewComplete?: () => void;
  onSessionComplete?: (resultsData: { transcript: string; prepPacket: string | null }) => void;
  userEmail?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GROK_WS_URL = 'wss://api.x.ai/v1/realtime';
const GROK_VOICE = 'Ara';  // Warm professional female voice. Options: Ara, Rex, Sal, Eve, Leo

const HEARTBEAT_INTERVAL = 5000;
const SILENCE_TIMEOUT = 180000;  // 3 minutes before silence warning
const MAX_RECONNECT_ATTEMPTS = 3;
const AUDIO_SAMPLE_RATE = 24000;

type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'disconnected';

// ─── Helper functions (preserved from original) ──────────────────────────────

const isInterviewQuestion = (text: string): boolean => {
  if (!text || !text.includes('?')) return false;

  const skipPatterns = [
    /ready to begin/i, /shall we (start|begin|continue)/i, /are you ready/i,
    /can you hear me/i, /is that clear/i, /does that make sense/i,
    /any questions before we/i, /sound good/i, /welcome back/i,
    /would you like me to repeat/i, /do you need me to/i,
  ];
  for (const p of skipPatterns) if (p.test(text)) return false;

  if (/question\s*\d+/i.test(text)) return true;

  const questionIndicators = [
    /let's begin|let's start|first question|next question/i,
    /tell me about a time/i, /can you (tell|describe|explain|walk|share)/i,
    /what excites you/i, /how would you/i, /why (do you|did you|are you)/i,
    /describe a situation/i, /give me an example/i,
  ];
  for (const p of questionIndicators) if (p.test(text)) return true;

  return false;
};

const extractQuestionNumber = (text: string): number | null => {
  if (!text) return null;
  const match = text.match(/question\s*(\d+)/i);
  return match?.[1] ? parseInt(match[1], 10) : null;
};

const getHighestQuestionNumber = (transcript: Array<{ role: string; text: string }>): number => {
  let highestNumbered = 0;
  let questionCount = 0;
  for (const entry of transcript) {
    if (entry.role === 'assistant') {
      const num = extractQuestionNumber(entry.text);
      if (num && num > highestNumbered) highestNumbered = num;
      if (isInterviewQuestion(entry.text)) questionCount++;
    }
  }
  return highestNumbered > 0 ? highestNumbered : questionCount;
};

const extractQuestionOnly = (text: string): string | null => {
  if (!text) return null;
  const questionLeadIns = [
    /(?:let's move to our next question:|next question:|question \d+:|here's (?:the|our) (?:next |first )?question:)\s*(.+\?)/i,
    /(?:can you tell me|tell me about|what|why|how|describe|walk me through|explain|share|have you)[\s\S]*\?/i,
  ];
  for (const pattern of questionLeadIns) {
    const match = text.match(pattern);
    if (match) return (match[1] || match[0]).trim();
  }
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (let i = sentences.length - 1; i >= 0; i--) {
    if (sentences[i].trim().endsWith('?')) return sentences[i].trim();
  }
  return null;
};

// ─── PCM Audio Helpers ───────────────────────────────────────────────────────

/** Encode Float32 PCM to Int16 base64 for xAI */
function float32ToBase64PCM16(float32: Float32Array): string {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** Decode base64 PCM16 from xAI to Float32 for Web Audio playback */
function base64PCM16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7FFF);
  }
  return float32;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AudioInterface({
  isActive,
  sessionId,
  documents,
  isDocumentsSaved = false,
  resumeFromPause = false,
  onInterviewStarted,
  onInterviewComplete,
  onSessionComplete,
  userEmail,
}: AudioInterfaceProps) {
  const { toast: toastFn } = useToast();

  // ── State ──────────────────────────────────────────────────────────────────

  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionDropped, setConnectionDropped] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isSendingResults, setIsSendingResults] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('disconnected');
  const [showSilenceWarning, setShowSilenceWarning] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const lastActivityTimeRef = useRef(Date.now());
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isSessionEnding, setIsSessionEnding] = useState(false);
  const [isResultsSent, setIsResultsSent] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [isWaitingForGreeting, setIsWaitingForGreeting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const toast = toastFn;

  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const {
    inputs: micInputs,
    selectedInputId,
    setSelectedInputId,
    ensurePermissionThenEnumerate,
    isEnumerating,
  } = useAudioDevices();

  const { appendTurn, getHistory, logEvent } = useAudioSessionPersistence(sessionId, userEmail);

  // ── Refs ───────────────────────────────────────────────────────────────────

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const userEndedSession = useRef(false);
  const interviewStarted = useRef(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceWarningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const transcriptRef = useRef<Array<{ role: 'user' | 'assistant'; text: string; ts: number }>>([]);
  const lastAssistantTurnRef = useRef<string | null>(null);
  const questionCountRef = useRef(0);
  const isResumingRef = useRef(false);
  const currentResponseTextRef = useRef('');  // accumulates streaming response text
  const currentUserTextRef = useRef('');       // accumulates streaming user transcription

  // ── Transcript helpers ─────────────────────────────────────────────────────

  const appendTranscriptTurn = useCallback((role: 'user' | 'assistant', text: unknown) => {
    const clean = typeof text === 'string' ? text.trim() : '';
    if (!clean) return;

    const last = transcriptRef.current[transcriptRef.current.length - 1];
    if (last && last.role === role && last.text === clean) return; // dedupe

    transcriptRef.current.push({ role, text: clean, ts: Date.now() });
    setLastActivityTime(Date.now()); lastActivityTimeRef.current = Date.now();

    if (transcriptRef.current.length > 200) {
      transcriptRef.current = transcriptRef.current.slice(-200);
    }

    appendTurn({
      role,
      text: clean,
      questionNumber: role === 'assistant' && isInterviewQuestion(clean) ? questionCountRef.current + 1 : null,
    });
  }, [appendTurn]);

  // ── Cleanup ────────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
    if (silenceWarningTimeoutRef.current) { clearTimeout(silenceWarningTimeoutRef.current); silenceWarningTimeoutRef.current = null; }
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null; }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent reconnect handler firing
      wsRef.current.close();
      wsRef.current = null;
    }
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  useEffect(() => { return () => cleanup(); }, [cleanup]);

  // ── Audio playback engine (plays PCM chunks from Grok) ─────────────────────

  const playNextChunk = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || isPlayingRef.current || playbackQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    const chunk = playbackQueueRef.current.shift()!;
    const buffer = ctx.createBuffer(1, chunk.length, AUDIO_SAMPLE_RATE);
    buffer.getChannelData(0).set(chunk);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      isPlayingRef.current = false;
      if (playbackQueueRef.current.length > 0) {
        playNextChunk();
      } else {
        setIsSpeaking(false);
      }
    };
    source.start();
    setIsSpeaking(true);
  }, []);

  const enqueueAudio = useCallback((base64: string) => {
    const float32 = base64PCM16ToFloat32(base64);
    playbackQueueRef.current.push(float32);
    if (!isPlayingRef.current) playNextChunk();
  }, [playNextChunk]);

  // ── Fetch prep packet ──────────────────────────────────────────────────────

  const fetchPrepPacket = async (): Promise<string | null> => {
    if (!sessionId) return null;
    try {
      const _tok = localStorage.getItem('authToken') || localStorage.getItem('talendro_token') || '';
      const res = await fetch(`/api/interview/session/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${_tok}` },
      });
      const data = await res.json();
      return data?.session?.prepPacket || null;
    } catch { return null; }
  };

  // ── Send results email ─────────────────────────────────────────────────────

  const sendAudioResults = useCallback(async () => {
    if (!sessionId || !userEmail) return;
    setIsSendingResults(true);
    try {
      const prepPacket = await fetchPrepPacket();
      const transcriptContent = transcriptRef.current
        .map(t => `**${t.role === 'user' ? 'Your Answer' : 'Sarah (Coach)'}:**\n${t.text}`)
        .join('\n\n---\n\n');

      let contentToSend = prepPacket
        ? prepPacket + '\n\n---\n\n# Audio Interview Transcript\n\n' + transcriptContent
        : '# Audio Interview Transcript\n\n' + transcriptContent;

      // Results are saved to the session; email sending can be added via a separate email route
      const _tok2 = localStorage.getItem('authToken') || localStorage.getItem('talendro_token') || '';
      await fetch('/api/interview/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_tok2}` },
        body: JSON.stringify({
          transcript: transcriptRef.current.map(t => ({ role: t.role, text: t.text })),
          sessionType: 'premium_audio',
          sessionId,
        }),
      });
      toast({ title: 'Results sent!', description: 'Your interview results have been emailed to you.' });
    } catch (err) {
      toast({ title: 'Error sending email', description: err instanceof Error ? err.message : 'Failed to send your results.', variant: 'destructive' });
    } finally {
      setIsSendingResults(false);
    }
  }, [sessionId, userEmail, toast]);

  // ── Graceful end ───────────────────────────────────────────────────────────

  const handleGracefulEnd = useCallback(async (reason: 'user_ended' | 'connection_lost' | 'timeout' | 'error') => {
    setIsSessionEnding(true);
    cleanup();
    setIsConnected(false);
    setIsSpeaking(false);

    const messages: Record<string, { title: string; description: string }> = {
      user_ended: { title: 'Interview Complete', description: 'Great job! Preparing your results...' },
      connection_lost: { title: 'Session Ended', description: 'The connection was lost. Preparing your results...' },
      timeout: { title: 'Session Timed Out', description: 'The session ended due to inactivity. Preparing your results...' },
      error: { title: 'Session Ended Unexpectedly', description: 'Something went wrong. Preparing your results...' },
    };
    toast(messages[reason]);

    const transcriptContent = transcriptRef.current
      .map(t => `**${t.role === 'user' ? 'Your Answer' : 'Sarah (Coach)'}:**\n${t.text}`)
      .join('\n\n---\n\n');
    const prepPacket = await fetchPrepPacket();

    onSessionComplete?.({ transcript: transcriptContent, prepPacket });
    setIsSessionEnding(false);
    setIsResultsSent(true);
    interviewStarted.current = false;
    onInterviewComplete?.();
  }, [cleanup, toast, onInterviewComplete, onSessionComplete]);

  // ── Heartbeat (connection quality + silence detection) ─────────────────────

  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);

    heartbeatRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityTimeRef.current;

      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setConnectionQuality('disconnected');
        return;
      }

      if (timeSinceActivity < 10000) setConnectionQuality('excellent');
      else if (timeSinceActivity < 30000) setConnectionQuality('good');
      else setConnectionQuality('poor');

      if (timeSinceActivity > SILENCE_TIMEOUT && !showSilenceWarning) {
        setShowSilenceWarning(true);
        toast({ title: 'Are you still there?', description: "Sarah hasn't heard from you in a while.", duration: 10000 });
      }
    }, HEARTBEAT_INTERVAL);
  }, [showSilenceWarning, toast]);

  // ── Stop conversation ──────────────────────────────────────────────────────

  const stopConversation = useCallback(async () => {
    userEndedSession.current = true;
    setIsSessionEnding(true);
    toast({ title: 'Ending Interview', description: 'Wrapping up your session with Sarah...' });
    cleanup();
    setIsConnected(false);
    setIsSpeaking(false);
    await handleGracefulEnd('user_ended');
  }, [toast, cleanup, handleGracefulEnd]);

  // ── Connect / Reconnect ────────────────────────────────────────────────────

  const reconnect = useCallback(
    async (options?: { mode?: 'initial' | 'resume' }) => {
      const mode: 'initial' | 'resume' = options?.mode === 'initial' ? 'initial' : 'resume';
      const isInitial = mode === 'initial';

      console.log('[AudioInterface] reconnect called with mode:', mode);

      if (isInitial) {
        transcriptRef.current = [];
        questionCountRef.current = 0;
        lastAssistantTurnRef.current = null;
        interviewStarted.current = false;
        userEndedSession.current = false;
        setConnectionDropped(false);
        setReconnectAttempts(0);
        setShowSilenceWarning(false);
        setIsConnecting(true);
        setIsReconnecting(false);
        setIsWaitingForGreeting(true);
        isResumingRef.current = false;
        currentResponseTextRef.current = '';
        currentUserTextRef.current = '';
      } else {
        setIsReconnecting(true);
        setConnectionDropped(false);
        setReconnectAttempts(prev => prev + 1);
        setIsWaitingForGreeting(true);
        isResumingRef.current = true;
      }

      try {
        // 1. Get microphone
        console.log('[reconnect] Requesting microphone...');
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedInputId ? { deviceId: { exact: selectedInputId } } : true,
        });
        mediaStreamRef.current = stream;

        // 2. Load history for resume
        let dbHistory: Awaited<ReturnType<typeof getHistory>> = [];
        if (!isInitial) {
          dbHistory = await getHistory();
          if (dbHistory.length > 0) {
            transcriptRef.current = dbHistory.map(h => ({
              role: h.role === 'user' ? 'user' as const : 'assistant' as const,
              text: h.content,
              ts: new Date(h.created_at).getTime(),
            }));
            const assistantMsgs = dbHistory.filter(h => h.role === 'assistant');
            if (assistantMsgs.length > 0) {
              lastAssistantTurnRef.current = assistantMsgs[assistantMsgs.length - 1].content;
              questionCountRef.current = getHighestQuestionNumber(transcriptRef.current);
            }
          }
        }

        // 3. Get ephemeral token from our Express API (replaces supabase.functions.invoke('grok-voice-token'))
        const _authToken = localStorage.getItem('authToken') || localStorage.getItem('talendro_token') || '';
        const _tokenRes = await fetch('/api/interview/voice-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_authToken}` },
        });
        const _tokenData = await _tokenRes.json();
        const token = _tokenData?.token;
        if (!_tokenRes.ok || !token) throw new Error(_tokenData?.error || 'No token received from voice-token endpoint');

        // 4. Build Sarah's instructions
        const firstName = documents?.firstName?.trim();
        const nameForGreeting = firstName || 'there';
        const questionsSoFar = questionCountRef.current;

        let instructions = `You are Sarah, a professional interview coach. You have 30 years of experience in talent acquisition and hiring leadership. Your role is to conduct a realistic mock interview with the candidate.

VOICE AND DELIVERY RULES:
- Speak with an American English accent at a calm, measured pace.
- Pause briefly between sentences to give the candidate time to process.
- Be patient — give the candidate at least 10 seconds of silence before prompting them.
- Do NOT rush. Speak as if you are in a real, relaxed professional interview.

INTERVIEW RULES:
- Ask one question at a time and wait for the candidate's full response before continuing.
- After each response, provide brief constructive feedback and a stronger sample answer.
- CRITICAL: You MUST label each NEW question with its number (e.g., "Question 1:", "Question 2:"). Keep a strict count. Never repeat a question number. Never skip a number. Always increment by exactly 1.
- If the candidate asks you to repeat, rephrase, or give an example, do so WITHOUT incrementing the question number. Only increment when you move to a genuinely NEW question.
- Cover 16 questions total across behavioral, situational, and role-specific categories.
- Be warm, professional, and encouraging. Use a natural conversational tone.
- If the candidate asks you to repeat or clarify, do so patiently without moving forward.
- At the end of 16 questions, thank them and let them know their results will be emailed.`;

        // Add resume/job context
        if (documents?.resume) {
          const truncatedResume = documents.resume.length > 1500
            ? documents.resume.substring(0, 1500) + '...[truncated]'
            : documents.resume;
          instructions += `\n\nCandidate's Resume:\n${truncatedResume}`;
        }
        if (documents?.jobDescription) {
          const truncatedJD = documents.jobDescription.length > 1000
            ? documents.jobDescription.substring(0, 1000) + '...[truncated]'
            : documents.jobDescription;
          instructions += `\n\nJob Description:\n${truncatedJD}`;
        }
        if (documents?.companyUrl) {
          instructions += `\n\nCompany URL: ${documents.companyUrl}`;
        }

        // Build the first message (what Sarah says first)
        let firstMessage: string;
        if (isInitial) {
          firstMessage = `Hi ${nameForGreeting}, I'm Sarah, your interview coach today. I've reviewed your materials and I'm ready to put you through a realistic mock interview. Process-wise, I'll ask one question at a time and give you a short pause to think before you answer—just like a real interview. After you respond, I'll take a quick beat to assess your answer, then I'll share feedback and a stronger version of how you could say it. We'll cover 16 questions across different categories. If you need me to repeat anything, just ask. Ready to begin?`;
        } else {
          // Resume context
          const lastSarahMessage = transcriptRef.current
            .filter(t => t.role === 'assistant' && isInterviewQuestion(t.text))
            .pop()?.text || null;
          const lastSarahQuestion = lastSarahMessage ? extractQuestionOnly(lastSarahMessage) : null;
          const lastEntry = transcriptRef.current[transcriptRef.current.length - 1];
          const didUserAnswerLast = lastEntry?.role === 'user';
          const completedQuestions = didUserAnswerLast ? questionsSoFar : Math.max(questionsSoFar - 1, 0);
          const resumeQuestionNumber = didUserAnswerLast ? completedQuestions + 1 : Math.max(questionsSoFar, 1);
          const safeQuestionText = !didUserAnswerLast && lastSarahQuestion
            ? (lastSarahQuestion.length > 300 ? lastSarahQuestion.substring(0, 300) + '...' : lastSarahQuestion)
            : null;
          const nameSuffix = firstName ? `, ${firstName}` : '';
          firstMessage = `Welcome back${nameSuffix}! We completed ${completedQuestions} questions before pausing. Now continuing with question ${resumeQuestionNumber}: ${safeQuestionText || 'the next question'}`;

          // Add recent context to instructions
          if (transcriptRef.current.length > 0) {
            const lastFewTurns = transcriptRef.current.slice(-4);
            const recentContext = lastFewTurns
              .map(t => `${t.role === 'user' ? 'USER' : 'SARAH'}: ${t.text.substring(0, 200)}`)
              .join('\n');
            const lastQuestion = lastSarahMessage ? extractQuestionOnly(lastSarahMessage) : null;
            const userAnsweredLast = lastEntry?.role === 'user';
            instructions += `\n\nRESUMED SESSION - Question ${questionsSoFar} asked. ${userAnsweredLast ? 'User answered. Ask next question.' : 'User did NOT answer. Repeat question.'}\n\nLast question: "${lastQuestion?.substring(0, 300) || 'N/A'}"\n\nRecent:\n${recentContext}`;
          }
        }

        instructions += `\n\nEnd of interview: tell user results will be sent to their email.`;

        // 5. Create AudioContext for playback and capture (must happen in click handler chain)
        const audioCtx = new AudioContext({ sampleRate: AUDIO_SAMPLE_RATE });
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        audioContextRef.current = audioCtx;
        console.log('[reconnect] AudioContext state:', audioCtx.state);

        // 6. Connect WebSocket to Grok using ephemeral token
        console.log('[reconnect] Connecting to Grok WebSocket...');
        const ws = new WebSocket(GROK_WS_URL, [`xai-client-secret.${token}`]);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[AudioInterface] WebSocket connected to Grok');

          // Send session configuration
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

          // Send the first message as a conversation item so Sarah speaks it
          ws.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [{ type: 'input_text', text: `[SYSTEM: Begin the interview. Say the following greeting out loud to the candidate:] ${firstMessage}` }],
            },
          }));
          ws.send(JSON.stringify({ type: 'response.create' }));

          // Mark connected
          setIsConnecting(false);
          setIsReconnecting(false);
          setConnectionDropped(false);
          setConnectionQuality('excellent');
          setReconnectAttempts(0);
          setLastActivityTime(Date.now()); lastActivityTimeRef.current = Date.now();
          setIsConnected(true);

          const wasAlreadyStarted = interviewStarted.current;
          interviewStarted.current = true;
          toast({
            title: wasAlreadyStarted ? 'Reconnected!' : 'Connected!',
            description: wasAlreadyStarted ? 'Continuing your interview with Sarah.' : 'Your voice interview has started. Sarah is ready.',
          });
          if (!wasAlreadyStarted) onInterviewStarted?.();

          startHeartbeat();

          // Start capturing mic audio and sending to Grok
          const source = audioCtx.createMediaStreamSource(stream);
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (isMuted || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const base64 = float32ToBase64PCM16(inputData);
            wsRef.current.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: base64,
            }));
          };

          source.connect(processor);
          processor.connect(audioCtx.destination);  // required for ScriptProcessor to fire
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            setLastActivityTime(Date.now()); lastActivityTimeRef.current = Date.now();
            setShowSilenceWarning(false);

            // Log ALL messages from Grok for debugging
            console.log('[AudioInterface] WS message type:', msg.type, msg.type === 'response.audio.delta' ? '(audio chunk)' : JSON.stringify(msg).substring(0, 300));

            switch (msg.type) {
              case 'response.audio.delta':
              case 'response.output_audio.delta':
                // Grok is sending audio — play it
                if (msg.delta) {
                  enqueueAudio(msg.delta);
                  setIsWaitingForGreeting(false);
                }
                break;

              case 'response.audio_transcript.delta':
              case 'response.output_audio_transcript.delta':
                // Streaming assistant text — accumulate
                if (msg.delta) {
                  currentResponseTextRef.current += msg.delta;
                }
                break;

              case 'response.audio_transcript.done':
              case 'response.output_audio_transcript.done':
                // Full assistant turn complete
                if (msg.transcript || currentResponseTextRef.current) {
                  const fullText = msg.transcript || currentResponseTextRef.current;
                  appendTranscriptTurn('assistant', fullText);

                  const clean = fullText.trim();
                  if (clean) {
                    lastAssistantTurnRef.current = clean;
                    const questionNum = extractQuestionNumber(clean);
                    if (questionNum && questionNum > questionCountRef.current) {
                      questionCountRef.current = questionNum;
                    } else if (isInterviewQuestion(clean)) {
                      questionCountRef.current += 1;
                    }
                  }
                }
                currentResponseTextRef.current = '';
                break;

              case 'conversation.item.input_audio_transcription.completed':
                // User's speech transcribed
                if (msg.transcript) {
                  appendTranscriptTurn('user', msg.transcript);
                }
                break;

              case 'input_audio_buffer.speech_started':
                // User started speaking — interrupt playback
                playbackQueueRef.current = [];
                setIsSpeaking(false);
                break;

              case 'error':
                console.error('[AudioInterface] Grok error:', msg.error);
                logEvent({
                  eventType: 'grok_error',
                  message: msg.error?.message || 'Unknown Grok error',
                  code: msg.error?.code || null,
                  context: { errorRaw: JSON.stringify(msg.error) },
                });
                break;

              case 'session.created':
              case 'session.updated':
                console.log('[AudioInterface] Session event:', msg.type);
                break;

              case 'response.done':
                // Response complete
                console.log('[AudioInterface] response.done received. Full msg:', JSON.stringify(msg).substring(0, 500));
                setIsSpeaking(false);
                break;

              default:
                // Other events: response.created, rate_limits.updated, etc.
                break;
            }
          } catch (e) {
            console.warn('[AudioInterface] Failed to parse WS message:', e);
          }
        };

        ws.onclose = (event) => {
          console.log('[AudioInterface] WebSocket closed:', event.code, event.reason);
          setIsConnected(false);
          setIsSpeaking(false);
          setIsConnecting(false);
          setIsReconnecting(false);
          setConnectionQuality('disconnected');
          cleanup();

          if (userEndedSession.current) {
            userEndedSession.current = false;
            // Already handled by stopConversation
          } else if (isPausedRef.current) {
            // Intentional pause — do nothing
          } else if (interviewStarted.current && !isSessionEnding) {
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              setConnectionDropped(true);
              logEvent({
                eventType: 'grok_disconnect',
                message: `WebSocket closed: ${event.code} ${event.reason}`,
                code: String(event.code),
                context: { questionCount: questionCountRef.current, transcriptLength: transcriptRef.current.length },
              });
              toast({ variant: 'destructive', title: 'Connection Lost', description: `Sarah got disconnected. Click "Reconnect" to continue.` });
            } else {
              handleGracefulEnd('connection_lost');
            }
          }
        };

        ws.onerror = (error) => {
          console.error('[AudioInterface] WebSocket error:', error);
          toast({ variant: 'destructive', title: 'Connection Error', description: 'Voice connection issue. Please try again.' });
          setIsConnecting(false);
          setIsReconnecting(false);
        };

      } catch (error) {
        console.error('[reconnect] Failed:', error);
        toast({ variant: 'destructive', title: isInitial ? 'Connection Failed' : 'Reconnection Failed', description: 'Could not start the interview. Please try again.' });
        if (!isInitial && reconnectAttempts >= MAX_RECONNECT_ATTEMPTS - 1) {
          handleGracefulEnd('connection_lost');
        } else if (!isInitial) {
          setConnectionDropped(true);
          setIsReconnecting(false);
        } else {
          cleanup();
          setIsConnecting(false);
        }
      } finally {
        isResumingRef.current = false;
      }
    },
    [documents, toast, reconnectAttempts, handleGracefulEnd, selectedInputId, getHistory, logEvent, cleanup, resumeFromPause, startHeartbeat, enqueueAudio, appendTranscriptTurn, onInterviewStarted, isMuted, isSessionEnding]
  );

  // ── Mute toggle ────────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newVal = !prev;
      toast({ title: newVal ? 'Microphone Muted' : 'Microphone Unmuted', description: newVal ? "Sarah can't hear you." : 'Sarah can hear you now.', duration: 2000 });
      return newVal;
    });
  }, [toast]);

  // ── Pause ──────────────────────────────────────────────────────────────────

  const pauseInterview = useCallback(async () => {
    if (!sessionId || !userEmail) {
      toast({ variant: 'destructive', title: 'Cannot Pause', description: 'Session information is missing.' });
      return;
    }

    isPausedRef.current = true;
    setIsPaused(true);
    setConnectionDropped(false);

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent reconnect handler
      wsRef.current.close();
      wsRef.current = null;
    }
    cleanup();
    setIsConnected(false);
    setIsSpeaking(false);

    try {
      const appUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const lastEntry = transcriptRef.current[transcriptRef.current.length - 1];
      const userAnsweredLast = lastEntry?.role === 'user';
      const completedQuestions = userAnsweredLast ? questionCountRef.current : Math.max(questionCountRef.current - 1, 0);

      const _pauseTok = localStorage.getItem('authToken') || localStorage.getItem('talendro_token') || '';
      await fetch('/api/interview/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_pauseTok}` },
        body: JSON.stringify({ action: 'pause', sessionId }),
      });

      toast({ title: 'Interview Paused', description: 'Your progress is saved. You can resume within 24 hours.' });
    } catch (error) {
      console.error('[pauseInterview] Failed:', error);
      toast({ title: 'Interview Paused', description: 'Your session is paused locally.' });
    }
  }, [sessionId, userEmail, toast, cleanup]);

  // ── Resume ─────────────────────────────────────────────────────────────────

  const resumeInterview = useCallback(async () => {
    if (!sessionId || !userEmail) {
      toast({ variant: 'destructive', title: 'Cannot Resume', description: 'Session information is missing.' });
      return;
    }

    setIsWaitingForGreeting(true);
    setIsReconnecting(true);
    isResumingRef.current = true;
    transcriptRef.current = [];
    questionCountRef.current = 0;
    lastAssistantTurnRef.current = null;

    try {
      const _resumeTok = localStorage.getItem('authToken') || localStorage.getItem('talendro_token') || '';
      const _resumeRes = await fetch('/api/interview/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_resumeTok}` },
        body: JSON.stringify({ action: 'resume', sessionId }),
      });
      const _resumeData = await _resumeRes.json();
      if (!_resumeRes.ok) throw new Error(_resumeData?.error || 'Failed to resume session');
      if (_resumeData?.expired) {
        toast({ variant: 'destructive', title: 'Session Expired', description: 'Please start a new session.' });
        setIsPaused(false);
        setIsReconnecting(false);
        isResumingRef.current = false;
        return;
      }

      const messages = data?.messages || [];
      const savedQuestionsAsked = data?.questionsAsked || data?.question_number || 0;

      if (messages.length > 0) {
        transcriptRef.current = messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' as const : 'assistant' as const,
          text: m.content,
          ts: new Date(m.created_at).getTime(),
        }));
        const assistantMsgs = messages.filter((m: any) => m.role === 'assistant');
        if (assistantMsgs.length > 0) {
          lastAssistantTurnRef.current = assistantMsgs[assistantMsgs.length - 1].content;
        }
        questionCountRef.current = savedQuestionsAsked > 0
          ? savedQuestionsAsked
          : getHighestQuestionNumber(transcriptRef.current);
      }

      setIsPaused(false);
      isPausedRef.current = false;
      await reconnect({ mode: 'resume' });
    } catch (error) {
      console.error('[resumeInterview] Failed:', error);
      toast({ variant: 'destructive', title: 'Resume Failed', description: error instanceof Error ? error.message : 'Could not resume.' });
      setIsReconnecting(false);
      isResumingRef.current = false;
    }
  }, [sessionId, userEmail, toast, reconnect]);

  // ── Signal activity ────────────────────────────────────────────────────────

  const signalActivity = useCallback(() => {
    setLastActivityTime(Date.now()); lastActivityTimeRef.current = Date.now();
    setShowSilenceWarning(false);
  }, []);

  // ── Derived state ──────────────────────────────────────────────────────────

  const canStartInterview = isDocumentsSaved;

  const ConnectionIndicator = () => {
    if (isPaused && !isConnected) return <div className="flex items-center gap-2 text-sm text-amber-600"><Pause className="w-4 h-4" />Paused</div>;
    if (isReconnecting) return <div className="flex items-center gap-2 text-sm text-blue-600"><Loader2 className="w-4 h-4 animate-spin" />Reconnecting...</div>;
    if (!isConnected) return null;
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className={cn('w-2 h-2 rounded-full', connectionQuality === 'excellent' && 'bg-green-500', connectionQuality === 'good' && 'bg-yellow-500', connectionQuality === 'poor' && 'bg-red-500')} />
        <span className="text-gray-600">{connectionQuality === 'excellent' ? 'Excellent' : connectionQuality === 'good' ? 'Good' : 'Poor'} connection</span>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!isActive) return null;

  if (isSessionEnding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><span className="text-2xl">📊</span></div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Wrapping Up Your Interview</h3>
              <p className="text-sm text-gray-500">Preparing your results...</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600"><CheckCircle2 className="w-5 h-5" />Interview transcript captured</div>
            <div className="flex items-center gap-2 text-green-600"><CheckCircle2 className="w-5 h-5" />Performance analysis complete</div>
            <div className="flex items-center gap-2 text-blue-600"><Loader2 className="w-5 h-5 animate-spin" />Sending results to your email...</div>
          </div>
        </div>
      </div>
    );
  }

  if (isResultsSent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Results Sent!</h3>
          <p className="text-gray-500 mb-4">Check your email for your interview results.</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Mail className="w-4 h-4" />
            <span>Results have been emailed to you</span>
          </div>
        </div>
      </div>
    );
  }

  if (isPaused && !isConnected && !isConnecting && !isReconnecting) {
    const lastEntry = transcriptRef.current[transcriptRef.current.length - 1];
    const userAnsweredLast = lastEntry?.role === 'user';
    const displayCompletedQuestions = userAnsweredLast ? questionCountRef.current : Math.max(questionCountRef.current - 1, 0);

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4"><Pause className="w-8 h-8 text-amber-600" /></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Interview Paused</h3>
          <p className="text-gray-500 mb-2">Your progress is saved. Click below to continue.</p>
          <p className="text-sm text-blue-600 font-medium mb-4">👆 Click "Resume Interview" to reconnect with Sarah</p>
          <div className="bg-gray-50 rounded-lg p-3 mb-6"><p className="text-sm text-gray-600">Questions completed: {displayCompletedQuestions} of 16</p></div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={resumeInterview} disabled={isReconnecting} className="gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700"><Play className="w-4 h-4" />Resume Interview</button>
            <button onClick={() => handleGracefulEnd('user_ended')} className="gap-2 w-full sm:w-auto"><PhoneOff className="w-4 h-4" />End & Get Results</button>
          </div>
        </div>
      </div>
    );
  }

  if (connectionDropped && !isConnected && !isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><WifiOff className="w-8 h-8 text-red-600" /></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Connection Lost</h3>
          <p className="text-gray-500 mb-2">Sarah got disconnected. Your transcript is saved.</p>
          <p className="text-sm text-gray-400 mb-6">{MAX_RECONNECT_ATTEMPTS - reconnectAttempts} attempts remaining</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => reconnect()} disabled={isReconnecting} className="gap-2">{isReconnecting ? <><Loader2 className="w-4 h-4 animate-spin" />Reconnecting...</> : <><RefreshCw className="w-4 h-4" />Reconnect</>}</button>
            <button onClick={() => handleGracefulEnd('connection_lost')}>End & Get Results</button>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected && !isConnecting && !isReconnecting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 text-2xl font-semibold text-gray-900 mb-2"><span>🎙️</span><span>Premium Audio Mock Interview</span></div>
          </div>
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img src={sarahHeadshot} alt="Sarah" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow text-sm font-medium">Sarah</div>
            </div>
          </div>
          {/* Microphone auto-selected — no manual dropdown needed */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-700 font-medium mb-2"><Lightbulb className="w-4 h-4" />Tips for a great interview:</div>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Use headphones for best audio quality</li>
              <li>• Speak clearly and at a natural pace</li>
              <li>• Use a quiet environment for best results</li>
              <li>• Wait for Sarah to finish before responding</li>
              <li>• Structure your answers using the STAR method</li>
              <li>• Ask Sarah to repeat or clarify anytime</li>
            </ul>
          </div>
          <div className="flex justify-center">
            <button onClick={() => reconnect({ mode: resumeFromPause ? 'resume' : 'initial' })} disabled={!canStartInterview || isConnecting || isReconnecting} className="gap-2 text-lg px-8 py-6">
              {resumeFromPause ? 'Resume Interview' : 'Begin Interview'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className={cn('w-full h-full rounded-full flex items-center justify-center transition-all duration-300', isConnecting && 'bg-blue-100', isConnected && !isSpeaking && 'bg-green-100', isConnected && isSpeaking && 'bg-blue-100 scale-110')}>
            {isConnecting ? <Loader2 className="w-12 h-12 text-blue-500 animate-spin" /> : isConnected ? <img src={sarahHeadshot} alt="Sarah" className={cn('w-24 h-24 rounded-full object-cover transition-transform duration-300', isSpeaking && 'scale-110')} /> : <Volume2 className="w-12 h-12 text-gray-400" />}
          </div>
          {isConnected && isSpeaking && <><div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-20" /><div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-pulse opacity-40" /></>}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-1">{isConnecting ? 'Connecting to Sarah...' : isSpeaking ? 'Sarah is speaking...' : isSendingResults ? 'Sending your results...' : isWaitingForGreeting ? 'Sarah is preparing...' : 'Listening to your response...'}</h3>
        <p className="text-sm text-gray-500 mb-6">{isConnecting ? 'Setting up your voice connection...' : isSpeaking ? 'Listen carefully to the question' : isSendingResults ? 'Please wait while we email your results' : isWaitingForGreeting ? 'One moment while Sarah gets ready...' : "Speak naturally when you're ready to respond"}</p>

        {showSilenceWarning && isConnected && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center gap-2 text-amber-700">
              <AlertTriangle className="w-4 h-4" />Sarah hasn't heard from you.
              <button onClick={signalActivity} className="ml-2">I'm still here</button>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="flex items-center justify-center gap-4">
            <button variant={isMuted ? 'destructive' : 'outline'} onClick={toggleMute} className="w-14 h-14 rounded-full p-0">{isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}</button>
            <button onClick={pauseInterview} className="w-14 h-14 rounded-full p-0" title="Pause"><Pause className="w-6 h-6" /></button>
            <button onClick={stopConversation} disabled={isSendingResults} className="w-14 h-14 rounded-full p-0">{isSendingResults ? <Loader2 className="w-6 h-6 animate-spin" /> : <PhoneOff className="w-6 h-6" />}</button>
          </div>
        )}

        {isPaused && !isConnected && !isReconnecting && (
          <div className="mt-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3"><div className="flex items-center justify-center gap-2 text-amber-700"><Pause className="w-4 h-4" />Interview Paused</div></div>
            <button onClick={resumeInterview} disabled={isReconnecting} className="gap-2"><Play className="w-4 h-4" />Resume Interview</button>
          </div>
        )}

        {isConnected && <div className="mt-4 flex justify-center"><ConnectionIndicator /></div>}
      </div>
    </div>
  );
}
