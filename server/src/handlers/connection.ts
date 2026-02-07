import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { getState, applyAction, undo, redo } from '../state.js';
import type { GameAction, GameState, Player } from '../types.js';

// ─────────────────────── SESSION TOKEN ────────────────────────────

/** The session token for this server instance. Players need this to connect. */
let sessionToken: string = uuidv4();

/**
 * Returns the current session token.
 *
 * @returns The UUID session token string
 */
export const getSessionToken = (): string => sessionToken;

/**
 * Regenerates the session token. Used when starting a new game.
 *
 * @returns The new session token string
 */
export const regenerateSessionToken = (): string => {
  sessionToken = uuidv4();
  return sessionToken;
};

// ──────────────────── PRIVACY FILTERING ───────────────────────────

/**
 * Creates a filtered copy of the game state for a specific player.
 * Other players' hand contents are replaced with card counts for privacy.
 * The Host sees all hands (admin visibility).
 *
 * @param state - The full game state
 * @param playerId - The player this state is being sent to
 * @returns A filtered copy safe to send to the specified player
 */
function filterStateForPlayer(state: GameState, playerId: string): GameState {
  const isHost = state.roles.host === playerId;

  // Host sees everything
  if (isHost) return state;

  // Clone and filter other players' hands
  const filtered = structuredClone(state);

  for (const player of filtered.players) {
    if (player.id !== playerId) {
      // Replace hand with empty array — client uses length for card count
      const cardCount = player.hand.length;
      player.hand = new Array(cardCount).fill('hidden');
    }
  }

  return filtered;
}

// ──────────────────── STATE BROADCAST ─────────────────────────────

/**
 * Broadcasts the current game state to all connected clients.
 * Each client receives a privacy-filtered version of the state.
 *
 * @param io - The Socket.io server instance
 */
function broadcastState(io: Server): void {
  const state = getState();

  // Get all connected sockets
  for (const [socketId, socket] of io.sockets.sockets) {
    // Find the player associated with this socket
    const player = state.players.find((p) => p.socketId === socketId);
    const playerId = player?.id || '';

    const filteredState = filterStateForPlayer(state, playerId);
    socket.emit('state:update', filteredState);
  }
}

// ─────────────────── CONNECTION HANDLER ───────────────────────────

/**
 * Handles a new Socket.io connection. Wires up all event listeners
 * for actions, undo/redo, and state requests.
 *
 * @param io - The Socket.io server instance
 * @param socket - The newly connected socket
 */
export function handleConnection(io: Server, socket: Socket): void {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Send current state to newly connected client on connection
  const currentState = getState();
  socket.emit('state:update', currentState);

  // ── Action Dispatch ──────────────────────────────────────────

  socket.on('action:dispatch', (action: GameAction) => {
    const result = applyAction(action);

    if (result.ok) {
      broadcastState(io);
    } else {
      socket.emit('state:error', { error: result.error });
    }
  });

  // ── Undo / Redo ──────────────────────────────────────────────

  socket.on('action:undo', () => {
    const restored = undo();
    if (restored) {
      broadcastState(io);
    } else {
      socket.emit('state:error', { error: 'Nothing to undo' });
    }
  });

  socket.on('action:redo', () => {
    const restored = redo();
    if (restored) {
      broadcastState(io);
    } else {
      socket.emit('state:error', { error: 'Nothing to redo' });
    }
  });

  // ── State Request (reconnection) ─────────────────────────────

  socket.on('request:latestState', () => {
    const state = getState();
    const player = state.players.find((p) => p.socketId === socket.id);
    const playerId = player?.id || '';
    const filtered = filterStateForPlayer(state, playerId);
    socket.emit('state:update', filtered);
  });

  // ── Disconnect ───────────────────────────────────────────────

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);

    const state = getState();
    const player = state.players.find((p) => p.socketId === socket.id);

    if (player) {
      applyAction({ type: 'PLAYER_DISCONNECT', playerId: player.id });
      broadcastState(io);
    }
  });
}
