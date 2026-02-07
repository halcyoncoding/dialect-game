import { Server, Socket } from 'socket.io';
import { applyAction, getState } from '../state.js';
import type { GameState } from '../types.js';

// ─────────────── LOBBY SOCKET EVENT HANDLERS ─────────────────────

/**
 * Handles a player join request from a client.
 * Validates the name and creates a pending player entry.
 *
 * @param io - Socket.io server instance
 * @param socket - The requesting client's socket
 * @param data - Join request payload: { name, color, sessionId }
 */
export const handleJoinRequest = (
  io: Server,
  socket: Socket,
  data: { name: string; color: string; sessionId: string }
): void => {
  const { name, color, sessionId } = data;

  // Validate name
  if (!name || name.trim().length === 0) {
    socket.emit('lobby:error', { error: 'Name cannot be empty' });
    return;
  }

  if (name.trim().length > 20) {
    socket.emit('lobby:error', { error: 'Name must be 20 characters or less' });
    return;
  }

  // Check if this sessionId is a reconnecting player
  const state = getState();
  const existingPlayer = state.players.find(
    (p) => p.socketId === sessionId || p.id === sessionId
  );

  if (existingPlayer) {
    // Reconnection — update socket ID and mark connected
    handleReconnect(io, socket, sessionId);
    return;
  }

  // Apply join request through state engine
  const result = applyAction({
    type: 'PLAYER_JOIN_REQUEST',
    name: name.trim(),
    color,
    sessionId,
    socketId: socket.id,
  });

  if (result.ok) {
    socket.emit('lobby:waitingApproval', { name: name.trim() });
    broadcastState(io);

    // Notify Host specifically
    const hostSocket = findHostSocket(io, result.state);
    if (hostSocket) {
      hostSocket.emit('lobby:newPendingPlayer', { name: name.trim(), color });
    }
  } else {
    socket.emit('lobby:error', { error: result.error });
  }
};

/**
 * Handles Host approving a pending player.
 *
 * @param io - Socket.io server instance
 * @param socket - The Host's socket
 * @param playerId - The pending player's ID to approve
 */
export const handleApprovePlayer = (
  io: Server,
  socket: Socket,
  playerId: string
): void => {
  // Verify sender is Host
  if (!isHost(socket)) {
    socket.emit('lobby:error', { error: 'Only the Host can approve players' });
    return;
  }

  // Find the pending player's socket before approval
  const state = getState();
  const pending = state.pendingPlayers.find((p) => p.id === playerId);
  const pendingSocketId = pending?.socketId;

  const result = applyAction({ type: 'APPROVE_PLAYER', playerId });

  if (result.ok) {
    broadcastState(io);

    // Notify the approved player
    if (pendingSocketId) {
      const playerSocket = io.sockets.sockets.get(pendingSocketId);
      if (playerSocket) {
        // Send their player ID so they know who they are
        const approvedPlayer = result.state.players.find(
          (p) => p.socketId === pendingSocketId
        );
        playerSocket.emit('lobby:approved', {
          playerId: approvedPlayer?.id || playerId,
        });
      }
    }
  } else {
    socket.emit('lobby:error', { error: result.error });
  }
};

/**
 * Handles Host rejecting a pending player.
 *
 * @param io - Socket.io server instance
 * @param socket - The Host's socket
 * @param playerId - The pending player's ID to reject
 */
export const handleRejectPlayer = (
  io: Server,
  socket: Socket,
  playerId: string
): void => {
  if (!isHost(socket)) {
    socket.emit('lobby:error', { error: 'Only the Host can reject players' });
    return;
  }

  // Find the pending player's socket before rejection
  const state = getState();
  const pending = state.pendingPlayers.find((p) => p.id === playerId);
  const pendingSocketId = pending?.socketId;

  const result = applyAction({ type: 'REJECT_PLAYER', playerId });

  if (result.ok) {
    broadcastState(io);

    // Notify the rejected player
    if (pendingSocketId) {
      const playerSocket = io.sockets.sockets.get(pendingSocketId);
      if (playerSocket) {
        playerSocket.emit('lobby:rejected', {
          reason: 'The Host declined your join request',
        });
      }
    }
  } else {
    socket.emit('lobby:error', { error: result.error });
  }
};

/**
 * Handles Host locking the session (no new joins).
 */
export const handleLockSession = (
  io: Server,
  socket: Socket
): void => {
  if (!isHost(socket)) {
    socket.emit('lobby:error', { error: 'Only the Host can lock the session' });
    return;
  }

  const result = applyAction({ type: 'LOCK_SESSION' });
  if (result.ok) {
    broadcastState(io);
  }
};

/**
 * Handles Host unlocking the session.
 */
export const handleUnlockSession = (
  io: Server,
  socket: Socket
): void => {
  if (!isHost(socket)) {
    socket.emit('lobby:error', { error: 'Only the Host can unlock the session' });
    return;
  }

  const result = applyAction({ type: 'UNLOCK_SESSION' });
  if (result.ok) {
    broadcastState(io);
  }
};

/**
 * Handles a player reconnecting after a page refresh.
 * Matches the session ID to an existing player and reassociates the socket.
 */
export const handleReconnect = (
  io: Server,
  socket: Socket,
  sessionId: string
): void => {
  const result = applyAction({
    type: 'PLAYER_RECONNECT',
    sessionId,
    socketId: socket.id,
  });

  if (result.ok) {
    const player = result.state.players.find((p) => p.socketId === socket.id);
    if (player) {
      socket.emit('lobby:approved', { playerId: player.id });
    }
    broadcastState(io);
  } else {
    // Not a known player — they'll need to join fresh
    socket.emit('lobby:needsJoin');
  }
};

/**
 * Handles Host starting the game (transition from lobby/setup to playing).
 */
export const handleStartGame = (
  io: Server,
  socket: Socket
): void => {
  if (!isHost(socket)) {
    socket.emit('lobby:error', { error: 'Only the Host can start the game' });
    return;
  }

  const state = getState();
  if (state.players.length < 2) {
    socket.emit('lobby:error', { error: 'Need at least 2 players to start' });
    return;
  }

  // Transition to setup phase first
  const lockResult = applyAction({ type: 'LOCK_SESSION' });
  if (!lockResult.ok) {
    socket.emit('lobby:error', { error: lockResult.error });
    return;
  }

  // Move to setup phase — we change phase directly in state
  const currentState = getState();
  currentState.session.phase = 'setup';
  currentState.version += 1;

  broadcastState(io);
};

// ─────────────────── HELPER FUNCTIONS ────────────────────────────

/** Checks if the given socket belongs to the Host. */
const isHost = (socket: Socket): boolean => {
  const state = getState();
  const hostPlayer = state.players.find((p) => p.id === state.roles.host);
  return hostPlayer?.socketId === socket.id;
};

/** Finds the Host's socket instance. */
const findHostSocket = (io: Server, state: GameState): Socket | undefined => {
  const hostPlayer = state.players.find((p) => p.id === state.roles.host);
  if (!hostPlayer) return undefined;
  return io.sockets.sockets.get(hostPlayer.socketId);
};

/** Broadcasts the current state to all connected clients (privacy-filtered). */
const broadcastState = (io: Server): void => {
  const state = getState();
  const isHostId = state.roles.host;

  for (const [socketId, socket] of io.sockets.sockets) {
    const player = state.players.find((p) => p.socketId === socketId);
    const playerId = player?.id || '';

    // Host sees everything, others get filtered hands
    if (playerId === isHostId) {
      socket.emit('state:update', state);
    } else {
      const filtered = structuredClone(state);
      for (const p of filtered.players) {
        if (p.id !== playerId) {
          const count = p.hand.length;
          p.hand = new Array(count).fill('hidden');
        }
      }
      socket.emit('state:update', filtered);
    }
  }
};
