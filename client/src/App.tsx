import { GameProvider } from './contexts/GameContext';
import { useGameState } from './hooks/useGameState';
import Lobby from './components/Lobby';
import { useRef, useEffect, useState } from 'react';
import { createSocket } from './socket';
import type { Socket } from 'socket.io-client';

// ────────────────── PHASE ROUTER ──────────────────────────────────

/**
 * Routes to the correct view based on the current game session phase.
 * Passes the socket instance to components that need direct event access.
 */
const PhaseRouter = ({ socket }: { socket: Socket | null }) => {
  const { state, isConnected } = useGameState();

  // Not connected yet — show loading
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-storm-900 text-storm-100 font-body flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-storm-300">Connecting to server...</p>
        </div>
      </div>
    );
  }

  // No state received yet
  if (!state) {
    return (
      <div className="min-h-screen bg-storm-900 text-storm-100 font-body flex items-center justify-center">
        <p className="text-storm-300">Loading game state...</p>
      </div>
    );
  }

  // Route based on session phase
  switch (state.session.phase) {
    case 'lobby':
      return <Lobby socket={socket} />;

    case 'setup':
    case 'playing':
    case 'legacy':
      return (
        <div className="min-h-screen bg-storm-900 text-storm-100 font-body flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-heading font-bold text-orange mb-4">
              Dialect
            </h1>
            <p className="text-storm-300 text-lg">
              Game View — {state.session.phase} phase (Coming Soon)
            </p>
            <p className="text-storm-500 text-sm mt-2">
              State v{state.version} — {state.players.length} players — Age {state.session.age}
            </p>
          </div>
        </div>
      );

    case 'ended':
      return (
        <div className="min-h-screen bg-storm-900 text-storm-100 font-body flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-heading font-bold text-orange mb-4">
              Game Over
            </h1>
            <p className="text-storm-300">The story has been told.</p>
          </div>
        </div>
      );

    default:
      return null;
  }
};

// ──────────────────── ROOT APP ────────────────────────────────────

/**
 * Root application component for the Dialect Digital Tableau.
 * Creates the socket connection and wraps everything in GameProvider.
 */
const App = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = createSocket();
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <GameProvider>
      <PhaseRouter socket={socket} />
    </GameProvider>
  );
};

export default App;
