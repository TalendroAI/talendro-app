/**
 * useAudioSessionPersistence
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

export function useAudioSessionPersistence(sessionId, userEmail) {
  const pendingRef = useRef(null);

  const appendTurn = useCallback(async (turn) => {
    if (!sessionId) return;
    const prev = pendingRef.current ?? Promise.resolve();
    const task = prev.then(async () => {
      try {
        await apiCall('append_turn', {
          sessionId,
          turn: { role: turn.role, content: turn.text },
        });
      } catch (err) {
        console.error('[appendTurn] error:', err);
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
      return (data?.session?.chatHistory || []).map(e => ({
        id: e._id || String(Math.random()),
        role: e.role,
        content: e.content,
        created_at: e.timestamp,
        question_number: null,
      }));
    } catch (err) {
      console.error('[getHistory] error:', err);
      return [];
    }
  }, [sessionId]);

  const logEvent = useCallback(async (params) => {
    // No-op in Express version — events are logged server-side
    console.log('[logEvent]', params.eventType, params.message);
  }, []);

  return { appendTurn, getHistory, logEvent };
}
