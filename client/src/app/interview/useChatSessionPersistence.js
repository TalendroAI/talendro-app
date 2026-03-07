/**
 * useChatSessionPersistence
 * Adapted from talendro-interview-coach for Express/MongoDB backend.
 * Replaces all supabase.functions.invoke('audio-session', ...) calls
 * with fetch('/api/interview/session', ...) calls.
 */
import { useCallback, useRef } from 'react';

function getAuthToken() {
  return localStorage.getItem('authToken') || localStorage.getItem('talendro_token') || '';
}

function apiCall(action, body) {
  const token = getAuthToken();
  return fetch('/api/interview/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...body }),
  }).then(r => r.json());
}

export function useChatSessionPersistence(sessionId, userEmail) {
  const pendingRef = useRef(null);
  const questionCountRef = useRef(0);

  const appendMessage = useCallback(async (message) => {
    if (!sessionId) return;
    if (message.role === 'assistant' && message.content.includes('?')) {
      questionCountRef.current += 1;
    }
    const prev = pendingRef.current ?? Promise.resolve();
    const task = prev.then(async () => {
      try {
        await apiCall('append_turn', {
          sessionId,
          turn: { role: message.role, content: message.content },
        });
      } catch (err) {
        console.error('[appendMessage] error:', err);
      }
    });
    pendingRef.current = task;
    await task;
  }, [sessionId]);

  const getHistory = useCallback(async () => {
    if (!sessionId) return [];
    try {
      const data = await fetch(`/api/interview/session/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      }).then(r => r.json());
      const entries = data?.session?.chatHistory || [];
      const assistantWithQuestions = entries.filter(
        e => e.role === 'assistant' && e.content.includes('?')
      );
      questionCountRef.current = assistantWithQuestions.length;
      return entries.map(e => ({
        id: e._id || String(Math.random()),
        role: e.role,
        content: e.content,
        timestamp: new Date(e.timestamp),
      }));
    } catch (err) {
      console.error('[getHistory] error:', err);
      return [];
    }
  }, [sessionId]);

  const pauseSession = useCallback(async () => {
    if (!sessionId) return false;
    try {
      await apiCall('pause', { sessionId });
      return true;
    } catch (err) {
      console.error('[pauseSession] error:', err);
      return false;
    }
  }, [sessionId]);

  const resumeSession = useCallback(async () => {
    if (!sessionId) return null;
    try {
      await apiCall('resume', { sessionId });
      const messages = await getHistory();
      return { messages };
    } catch (err) {
      console.error('[resumeSession] error:', err);
      return null;
    }
  }, [sessionId, getHistory]);

  return {
    appendMessage,
    getHistory,
    pauseSession,
    resumeSession,
    getQuestionCount: () => questionCountRef.current,
  };
}
