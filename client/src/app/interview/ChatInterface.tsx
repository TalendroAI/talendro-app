import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, User, Bot, Loader2, Pause, Play, Mic, MicOff, Check } from 'lucide-react';
import { Button } // Button -> use <button> with Tailwind;
import { Textarea } // Textarea -> use <textarea> with Tailwind;

import { SessionType, SESSION_CONFIGS, DocumentInputs } from './session.ts';
import { sendAIMessage } from './api.js';
import { useToast } from './useToast.js';
import { cn } from './utils.js';
import { CompleteSessionButton } from './CompleteSessionButton';
import { useChatSessionPersistence } from './useChatSessionPersistence.js';

// ─── Web Speech API type declarations ───────────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}
// ────────────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface HeaderPauseState {
  showButton: boolean;
  isPaused: boolean;
  isPausing: boolean;
  isResuming: boolean;
}

interface ChatInterfaceProps {
  sessionType: SessionType;
  isActive: boolean;
  sessionId?: string;
  documents: DocumentInputs;
  onInterviewComplete?: (messages: Message[]) => void;
  onCompleteSession: () => void;
  isCompletingSession: boolean;
  isSessionCompleted: boolean;
  isContentReady: boolean;
  userEmail?: string;
  resumeFromPause?: boolean;
  onPauseStateChange?: (isPaused: boolean) => void;
  onHeaderPauseStateChange?: (state: HeaderPauseState) => void;
  onRegisterPauseHandlers?: (handlers: { onPause?: () => void; onResume?: () => void; onEnd?: () => void }) => void;
}

export function ChatInterface({ 
  sessionType, 
  isActive, 
  sessionId, 
  documents, 
  onInterviewComplete, 
  onCompleteSession, 
  isCompletingSession, 
  isSessionCompleted, 
  isContentReady,
  userEmail,
  resumeFromPause = false,
  onPauseStateChange,
  onHeaderPauseStateChange,
  onRegisterPauseHandlers,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  // ── Speech-to-text state ──────────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const baseTextRef = useRef(''); // text in box before mic was activated
  // ─────────────────────────────────────────────────────────────────────────

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const config = SESSION_CONFIGS[sessionType];
  const { toast } = useToast();
  
  // Real-time persistence hook
  const { appendMessage, pauseSession, resumeSession, getHistory } = useChatSessionPersistence(sessionId, userEmail);

  // ── Detect speech support on mount ───────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  // ── Speech-to-text toggle ─────────────────────────────────────────────────
  const toggleListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Stop if already listening
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;       // keep listening until manually stopped
    recognition.interimResults = true;   // show words as they're spoken
    recognition.lang = 'en-US';

    // Capture the text already in the box so we can append to it
    baseTextRef.current = input;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript += text + ' ';
        } else {
          interimTranscript += text;
        }
      }

      if (finalTranscript) {
        // Confirmed speech — append to base text and update the base for next segment
        const updated = (baseTextRef.current + ' ' + finalTranscript).trimStart();
        baseTextRef.current = updated.trimEnd();
        setInput(updated.trimEnd());
      } else if (interimTranscript) {
        // In-progress speech — show it but don't commit yet
        setInput((baseTextRef.current + ' ' + interimTranscript).trimStart());
      }
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.error('[Speech] Error:', e.error);
      setIsListening(false);
      if (e.error === 'not-allowed') {
        toast({
          variant: 'destructive',
          title: 'Microphone Access Denied',
          description: 'Please allow microphone access in your browser settings and try again.',
        });
      } else if (e.error !== 'aborted') {
        toast({
          variant: 'destructive',
          title: 'Speech Recognition Error',
          description: 'Could not process your speech. Please try again or type your response.',
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, input, toast]);

  // Stop listening automatically when paused, loading, or interview ends
  useEffect(() => {
    if ((isPaused || isLoading || isInterviewComplete) && isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  }, [isPaused, isLoading, isInterviewComplete, isListening]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  // Check if the interview is complete by looking for the completion marker
  const checkInterviewComplete = (content: string) => {
    const completionMarkers = ['## INTERVIEW COMPLETE', '**INTERVIEW COMPLETE**', 'INTERVIEW COMPLETE'];
    return completionMarkers.some(marker => content.toUpperCase().includes(marker.toUpperCase()));
  };

  const scrollToTop = useCallback(() => {
    document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'auto' });
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    if (messages.length === 1 && messages[0].role === 'assistant') {
      scrollToTop();
      return;
    }
    scrollToBottom();
  }, [messages, scrollToTop, scrollToBottom]);

  // Handle resume from pause
  useEffect(() => {
    if (resumeFromPause && isActive && sessionId && !isInitialized) {
      handleResumeFromPause();
    }
  }, [resumeFromPause, isActive, sessionId, isInitialized]);

  // Initialize the session with AI
  useEffect(() => {
    if (isActive && !isInitialized && sessionId && !resumeFromPause) {
      initializeSession();
    }
  }, [isActive, isInitialized, sessionId, resumeFromPause]);

  // Update header pause state whenever relevant state changes
  useEffect(() => {
    const showButton = isInitialized && !isInterviewComplete && !isSessionCompleted;
    onHeaderPauseStateChange?.({
      showButton,
      isPaused,
      isPausing,
      isResuming,
    });
  }, [isInitialized, isInterviewComplete, isSessionCompleted, isPaused, isPausing, isResuming, onHeaderPauseStateChange]);

  const handleResumeFromPause = async () => {
    setIsResuming(true);
    try {
      const result = await resumeSession();
      
      if (!result) throw new Error('Failed to resume session');
      
      if (result.expired) {
        toast({
          variant: 'destructive',
          title: 'Session Expired',
          description: 'Your paused session has expired. Please start a new session.',
        });
        return;
      }
      
      if (result.messages.length > 0) {
        const lastMessage = result.messages[result.messages.length - 1];
        const userAnswerCount = result.messages.filter((m: Message) => m.role === 'user').length;
        
        const welcomeContent = lastMessage.role === 'assistant'
          ? `Welcome back! I have your previous answers saved. Let's continue with your response to the last question I presented.`
          : `Welcome back! I have your previous answers saved. You've answered ${userAnswerCount} questions so far. Let's continue the interview.`;
        
        const welcomeBackMessage: Message = {
          id: `resume-${Date.now()}`,
          role: 'assistant',
          content: welcomeContent,
          timestamp: new Date(),
        };
        
        setMessages([...result.messages, welcomeBackMessage]);
        setIsInitialized(true);
        
        const lastAssistant = result.messages.filter((m: Message) => m.role === 'assistant').pop();
        if (lastAssistant && checkInterviewComplete(lastAssistant.content)) {
          setIsInterviewComplete(true);
          onInterviewComplete?.(result.messages);
        }
        
        toast({ title: 'Session Resumed', description: 'Welcome back! Continuing from where you left off.' });
      } else {
        initializeSession();
      }
    } catch (err) {
      console.error('Error resuming session:', err);
      toast({ variant: 'destructive', title: 'Resume Failed', description: 'Could not resume your session. Starting fresh.' });
      initializeSession();
    } finally {
      setIsResuming(false);
    }
  };

  const initializeSession = async () => {
    setIsLoading(true);
    try {
      const response = await sendAIMessage(
        sessionId, sessionType, undefined,
        documents.resume, documents.jobDescription, documents.companyUrl,
        true, documents.firstName
      );
      const initialMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing session:', error);
      const msg = error instanceof Error ? error.message : 'Failed to start the coaching session. Please try again.';
      toast({ title: 'AI Error', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseInterview = useCallback(async () => {
    setIsPausing(true);
    try {
      const success = await pauseSession();
      if (success) {
        setIsPaused(true);
        onPauseStateChange?.(true);
        toast({ title: 'Interview Paused', description: 'Your progress is saved. You can resume within 24 hours.' });
      } else {
        throw new Error('Failed to pause session');
      }
    } catch (err) {
      console.error('Error pausing interview:', err);
      toast({ variant: 'destructive', title: 'Pause Failed', description: 'Could not pause the interview. Please try again.' });
    } finally {
      setIsPausing(false);
    }
  }, [pauseSession, toast, onPauseStateChange]);

  const handleResumeInterview = useCallback(async () => {
    setIsResuming(true);
    try {
      const result = await resumeSession();
      if (!result) throw new Error('Failed to resume session');
      if (result.expired) {
        toast({ variant: 'destructive', title: 'Session Expired', description: 'Your paused session has expired (24 hour limit).' });
        return;
      }
      setIsPaused(false);
      onPauseStateChange?.(false);
      const historyMessages = result.messages.length > 0 ? result.messages : messages;
      const userAnswerCount = historyMessages.filter((m: Message) => m.role === 'user').length;
      const nextQuestionNumber = userAnswerCount + 1;
      const welcomeBackMessage: Message = {
        id: `resume-${Date.now()}`,
        role: 'assistant',
        content: `Welcome back! We were on Question ${nextQuestionNumber} of 10. Let's continue where we left off.`,
        timestamp: new Date(),
      };
      if (result.messages.length > 0) {
        setMessages([...result.messages, welcomeBackMessage]);
      } else {
        setMessages([...messages, welcomeBackMessage]);
      }
      toast({ title: 'Interview Resumed', description: 'Let\'s continue where we left off.' });
    } catch (err) {
      console.error('Error resuming interview:', err);
      toast({ variant: 'destructive', title: 'Resume Failed', description: 'Could not resume the interview. Please try again.' });
    } finally {
      setIsResuming(false);
    }
  }, [resumeSession, messages, toast, onPauseStateChange]);

  const handleEndInterview = useCallback(() => {
    setIsInterviewComplete(true);
    onInterviewComplete?.(messages);
    toast({ title: 'Interview Ended', description: 'Click "Complete Session & Get Results" to receive your report.' });
  }, [messages, onInterviewComplete, toast]);

  useEffect(() => {
    onRegisterPauseHandlers?.({
      onPause: handlePauseInterview,
      onResume: handleResumeInterview,
      onEnd: handleEndInterview,
    });
  }, [onRegisterPauseHandlers, handlePauseInterview, handleResumeInterview, handleEndInterview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isPaused) return;

    // Stop listening if mic is active when user submits
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    baseTextRef.current = '';
    setIsLoading(true);

    try {
      const response = await sendAIMessage(sessionId, sessionType, userMessage.content);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      if (checkInterviewComplete(response) && !isInterviewComplete) {
        setIsInterviewComplete(true);
        setMessages((currentMessages) => {
          onInterviewComplete?.(currentMessages);
          return currentMessages;
        });
        toast({ title: 'Interview Complete!', description: 'Click "Complete Session & Get Results" to receive your detailed report.' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const msg = error instanceof Error ? error.message : 'Failed to get a response. Please try again.';
      toast({ title: 'AI Error', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isActive) return null;

  // Whether the mic button should be interactive
  const micDisabled = isLoading || !isInitialized || isPaused || isInterviewComplete;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat Header */}
      <div id="chat-session-top" className="p-4 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-foreground">
                {config.name} Session
              </h3>
              <p className="text-sm text-muted-foreground">
                {isPaused ? (
                  <span className="text-warning font-medium">Interview Paused</span>
                ) : (
                  'AI Interview Coach'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Paused Overlay */}
      {isPaused && (
        <div className="bg-warning/10 border-b border-warning/30 p-4 text-center">
          <p className="text-warning font-medium">
            Interview is paused. Your progress is saved for 24 hours.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Click "Resume Interview" when you're ready to continue.
          </p>
        </div>
      )}

      {/* Resuming State */}
      {isResuming && !isInitialized && (
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-lg mx-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center animate-pulse">
                <Play className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Resuming Session</h3>
                <p className="text-sm text-muted-foreground">Loading your previous progress...</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Loading your previous progress...</span>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div 
        id="chat-messages-container"
        ref={messagesContainerRef}
        className={cn(
          "overflow-y-auto px-4 py-2 space-y-3",
          isPaused && "opacity-75"
        )}
      >
        {!isInitialized && isLoading && !isResuming && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Starting session...</span>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 animate-slide-up",
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gradient-to-br from-primary to-secondary text-primary-foreground'
              )}
            >
              {message.role === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-md'
                  : 'bg-muted text-foreground rounded-tl-md'
              )}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
              <p
                className={cn(
                  "text-xs mt-2 opacity-70",
                  message.role === 'user' ? 'text-right' : 'text-left'
                )}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && isInitialized && (
          <div className="flex gap-3 animate-fade-in">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Complete Session Button at end of messages */}
        {isInterviewComplete && (
          <div className="flex justify-center py-6">
            <CompleteSessionButton
              onClick={onCompleteSession}
              isLoading={isCompletingSession}
              isDisabled={!isContentReady}
              isCompleted={isSessionCompleted}
              className="min-w-[280px]"
            />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-card flex-shrink-0">
        <div className="flex gap-2 items-end">

          {/* ── Mic button ──────────────────────────────────────────────── */}
          {speechSupported && (
            <Button
              type="button"
              size="icon"
              variant={isListening ? 'destructive' : 'outline'}
              onClick={toggleListening}
              disabled={micDisabled}
              title={isListening ? 'Stop listening' : 'Speak your answer'}
              className={cn(
                'h-[50px] w-[50px] flex-shrink-0 transition-all',
                isListening && 'animate-pulse shadow-lg shadow-destructive/30'
              )}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
          {/* ─────────────────────────────────────────────────────────────── */}

          <div className="relative flex-1">
            <Textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                baseTextRef.current = e.target.value;
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                isPaused
                  ? 'Interview paused — click Resume to continue'
                  : isListening
                  ? 'Listening… speak now'
                  : 'Type your response or tap the mic to speak…'
              }
              className={cn(
                'min-h-[50px] max-h-[120px] resize-none',
                isListening && 'border-destructive ring-1 ring-destructive/40'
              )}
              disabled={isLoading || !isInitialized || isPaused}
            />
          </div>

          {/* Send button */}
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading || !isInitialized || isPaused}
            className="h-[50px] w-[50px] flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Status hint */}
        <p className="text-xs text-muted-foreground mt-1.5 text-center">
          {isListening ? (
            <span className="text-destructive font-medium animate-pulse">
              🔴 Listening — tap the mic again to stop
            </span>
          ) : speechSupported ? (
            'Tap mic to speak • Type to respond • Enter to send'
          ) : (
            'Type your response • Enter to send'
          )}
        </p>
      </form>
    </div>
  );
}
