import { io, Socket } from 'socket.io-client';

// ────────────────────── SOCKET CONNECTION ─────────────────────────

/**
 * Creates and returns a Socket.io client instance configured with
 * auto-reconnect and optional session token authentication.
 *
 * @param sessionToken - Optional session token for authentication
 * @returns A configured Socket.io client instance
 *
 * @example
 * const socket = createSocket('abc-123');
 * socket.on('state:update', (state) => console.log(state));
 */
export const createSocket = (sessionToken?: string): Socket => {
  const socket = io({
    // In dev, Vite proxy handles routing to localhost:3000
    // In production, connects to same origin
    auth: sessionToken ? { token: sessionToken } : {},
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    // 30-second reconnection timeout per PRD
    reconnectionDelayMax: 30000,
  });

  // On successful reconnection, request the latest state
  socket.on('connect', () => {
    if (socket.recovered) {
      socket.emit('request:latestState');
    }
  });

  return socket;
};
