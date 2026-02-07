import { useState } from 'react';

// ──────────────────── SESSION ID HOOK ─────────────────────────────

/**
 * Manages a persistent session ID in sessionStorage for reconnection.
 * Generates a new UUID if none exists. Survives page refresh within the same tab.
 *
 * @returns { sessionId, clearSession }
 *
 * @example
 * const { sessionId } = useSessionId();
 * socket.emit('lobby:joinRequest', { name, color, sessionId });
 */
export const useSessionId = () => {
  const [sessionId] = useState<string>(() => {
    const stored = sessionStorage.getItem('dialect-session-id');
    if (stored) return stored;

    const newId = crypto.randomUUID();
    sessionStorage.setItem('dialect-session-id', newId);
    return newId;
  });

  /** Clears the stored session ID (e.g., when leaving a game). */
  const clearSession = () => {
    sessionStorage.removeItem('dialect-session-id');
  };

  return { sessionId, clearSession };
};
