import { useState, useEffect, useCallback } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useSessionId } from '../hooks/useSessionId';
import JoinForm from './JoinForm';
import LobbyPlayerList from './LobbyPlayerList';
import type { Socket } from 'socket.io-client';

// ──────────────────── COMPONENT ──────────────────────────────────

interface LobbyProps {
  socket: Socket | null;
}

/**
 * Main lobby container that orchestrates the join flow.
 * Renders JoinForm for new players, waiting state for pending players,
 * and the full lobby view for approved players and Host.
 *
 * @param socket - The Socket.io client instance for direct lobby events
 */
const Lobby = ({ socket }: LobbyProps) => {
  const { state, playerId } = useGameState();
  const { sessionId } = useSessionId();
  const [joinStatus, setJoinStatus] = useState<'idle' | 'pending' | 'approved' | 'rejected'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(playerId);

  // ── Socket Event Listeners ────────────────────────────────────

  useEffect(() => {
    if (!socket) return;

    const handleApproved = (data: { playerId: string }) => {
      setJoinStatus('approved');
      setMyPlayerId(data.playerId);
    };

    const handleRejected = (data: { reason: string }) => {
      setJoinStatus('rejected');
      setError(data.reason);
    };

    const handleWaiting = () => {
      setJoinStatus('pending');
    };

    const handleLobbyError = (data: { error: string }) => {
      setError(data.error);
    };

    const handleNeedsJoin = () => {
      setJoinStatus('idle');
    };

    socket.on('lobby:approved', handleApproved);
    socket.on('lobby:rejected', handleRejected);
    socket.on('lobby:waitingApproval', handleWaiting);
    socket.on('lobby:error', handleLobbyError);
    socket.on('lobby:needsJoin', handleNeedsJoin);

    // Attempt reconnection on mount
    socket.emit('lobby:reconnect', { sessionId });

    return () => {
      socket.off('lobby:approved', handleApproved);
      socket.off('lobby:rejected', handleRejected);
      socket.off('lobby:waitingApproval', handleWaiting);
      socket.off('lobby:error', handleLobbyError);
      socket.off('lobby:needsJoin', handleNeedsJoin);
    };
  }, [socket, sessionId]);

  // Detect if we're already a player (reconnection)
  useEffect(() => {
    if (state && myPlayerId) {
      const isApproved = state.players.some((p) => p.id === myPlayerId);
      if (isApproved) {
        setJoinStatus('approved');
      }
    }
  }, [state, myPlayerId]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleJoinSubmit = useCallback((name: string, color: string) => {
    setError(null);
    socket?.emit('lobby:joinRequest', { name, color, sessionId });
  }, [socket, sessionId]);

  const handleApprove = useCallback((pid: string) => {
    socket?.emit('lobby:approve', { playerId: pid });
  }, [socket]);

  const handleReject = useCallback((pid: string) => {
    socket?.emit('lobby:reject', { playerId: pid });
  }, [socket]);

  const handleLock = useCallback(() => {
    socket?.emit('lobby:lock');
  }, [socket]);

  const handleUnlock = useCallback(() => {
    socket?.emit('lobby:unlock');
  }, [socket]);

  const handleStartGame = useCallback(() => {
    socket?.emit('lobby:startGame');
  }, [socket]);

  // ── Derived State ─────────────────────────────────────────────

  const isHost = state?.roles.host === myPlayerId;
  const playerCount = state?.players.length || 0;
  const canStart = playerCount >= 2;

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-storm-900 text-storm-100 font-body flex flex-col items-center justify-center p-6">

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-heading font-bold text-orange mb-2">
          Dialect
        </h1>
        <p className="text-storm-300">Digital Tableau — Lobby</p>
      </div>

      {/* Join Form — shown when player hasn't joined yet */}
      {joinStatus === 'idle' && (
        <JoinForm
          onSubmit={handleJoinSubmit}
          existingNames={state?.players.map((p) => p.name) || []}
          isSubmitting={false}
          error={error}
        />
      )}

      {/* Waiting for approval */}
      {joinStatus === 'pending' && (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-storm-300 font-body">
            Waiting for Host approval...
          </p>
        </div>
      )}

      {/* Rejected */}
      {joinStatus === 'rejected' && (
        <div className="text-center space-y-4">
          <p className="text-oxide font-body">{error || 'Request was declined'}</p>
          <button
            onClick={() => {
              setJoinStatus('idle');
              setError(null);
            }}
            className="px-6 py-2 bg-storm-700 text-storm-200 rounded-lg
                       hover:bg-storm-500 transition-colors font-body
                       focus:outline-none focus:ring-2 focus:ring-storm-500"
            tabIndex={0}
            aria-label="Try joining again"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Approved — full lobby view */}
      {joinStatus === 'approved' && state && (
        <div className="w-full max-w-lg space-y-6">

          {/* Player List */}
          <LobbyPlayerList
            players={state.players}
            pendingPlayers={state.pendingPlayers}
            isHost={isHost}
            onApprove={handleApprove}
            onReject={handleReject}
          />

          {/* Host Controls */}
          {isHost && (
            <div className="space-y-3 pt-4 border-t border-storm-700">

              {/* Lock Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-storm-300 text-sm font-body">
                  Session Lock
                </span>
                <button
                  onClick={state.session.isLocked ? handleUnlock : handleLock}
                  className={`px-4 py-2 rounded-lg text-sm font-body transition-colors
                             focus:outline-none focus:ring-2
                             ${state.session.isLocked
                               ? 'bg-oxide text-white focus:ring-oxide/50'
                               : 'bg-storm-700 text-storm-300 hover:bg-storm-500 focus:ring-storm-500'
                             }`}
                  tabIndex={0}
                  aria-label={state.session.isLocked ? 'Unlock session' : 'Lock session'}
                >
                  {state.session.isLocked ? 'Locked — Click to Unlock' : 'Lock Session'}
                </button>
              </div>

              {/* Start Game */}
              <button
                onClick={handleStartGame}
                disabled={!canStart}
                className="w-full py-3 bg-spruce text-white font-heading font-bold
                           rounded-lg hover:bg-spruce/80 transition-colors
                           focus:outline-none focus:ring-2 focus:ring-spruce/50
                           disabled:opacity-50 disabled:cursor-not-allowed"
                tabIndex={0}
                aria-label="Start the game"
              >
                {canStart
                  ? `Start Game (${playerCount} players)`
                  : `Need at least 2 players (${playerCount} joined)`
                }
              </button>
            </div>
          )}

          {/* Player waiting message */}
          {!isHost && (
            <p className="text-storm-500 text-center text-sm font-body">
              Waiting for Host to start the game...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Lobby;
