/**
 * Interview Coach API service
 * Replaces the Supabase-based api.ts from talendro-interview-coach.
 * All calls go to our Express backend at /api/interview/*.
 */

function getAuthToken() {
  return localStorage.getItem('authToken') || localStorage.getItem('talendro_token') || '';
}

/**
 * Send a message to the AI coach.
 * Replaces supabase.functions.invoke('ai-coach', ...) from api.ts.
 */
export async function sendAIMessage(
  sessionId,
  sessionType,
  message,
  resume,
  jobDescription,
  companyUrl,
  isInitial,
  firstName
) {
  const token = getAuthToken();
  const res = await fetch('/api/interview/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      session_type: sessionType,
      session_id: sessionId,
      messages: message ? [{ role: 'user', content: message }] : [],
      documents: {
        firstName: firstName || '',
        resume: resume || '',
        jobDescription: jobDescription || '',
        companyUrl: companyUrl || '',
      },
      is_initial: isInitial || false,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `AI coach request failed (${res.status})`);
  }

  const data = await res.json();
  return data?.message || '';
}

/**
 * Verify payment / check subscription access.
 * In the integrated app, this is handled by the auth middleware on the backend.
 * This stub always returns success since tier gating is done server-side.
 */
export async function verifyPayment(sessionType, email) {
  // Tier access is enforced by the /api/interview/chat endpoint via JWT + User.plan
  // No client-side payment verification needed in the integrated app
  return { success: true, sessionType };
}
