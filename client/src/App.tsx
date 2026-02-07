import { GameProvider } from './contexts/GameContext';
import { useGameState } from './hooks/useGameState';
import Lobby from './components/Lobby';
import HostAdmin from './components/HostAdmin';
import SetupWizard from './components/setup/SetupWizard';
import Tableau from './components/Tableau';
import PhaseBar from './components/game/PhaseBar';
import TurnIndicator from './components/game/TurnIndicator';
import LegacyPhase from './components/game/LegacyPhase';
import { useEffect, useState } from 'react';
import { createSocket } from './socket';
import type { Socket } from 'socket.io-client';

// ────────────────── PHASE ROUTER ──────────────────────────────────

/**
 * Routes to the correct view based on the current game session phase.
 * Passes the socket instance to components that need direct event access.
 */
const PhaseRouter = ({ socket }: { socket: Socket | null }) => {
  const { state, isConnected, playerId } = useGameState();

  // Not connected yet
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

  // No state yet
  if (!state) {
    return (
      <div className="min-h-screen bg-storm-900 text-storm-100 font-body flex items-center justify-center">
        <p className="text-storm-300">Loading game state...</p>
      </div>
    );
  }

  const isHost = state.roles.host === playerId;

  // Route based on session phase
  switch (state.session.phase) {
    case 'lobby':
      return <Lobby socket={socket} />;

    case 'setup':
      return (
        <>
          <HostAdmin />
          <SetupWizard isHost={isHost} socket={socket} />
        </>
      );

    case 'playing':
      return (
        <div className="min-h-screen bg-storm-900 text-storm-100 font-body p-4">
          <HostAdmin />
          <div className="max-w-6xl mx-auto">
            <PhaseBar currentPhase="playing" currentAge={state.session.age} />
            <TurnIndicator
              players={state.players}
              turnIndex={state.session.turnIndex}
              currentPlayerId={playerId}
              age={state.session.age}
            />
            <Tableau currentPlayerId={playerId} />
          </div>
        </div>
      );

    case 'legacy':
      return (
        <>
          <HostAdmin />
          <LegacyPhase isHost={isHost} />
        </>
      );

    case 'ended':
      return (
        <div className="min-h-screen bg-storm-900 text-storm-100 font-body flex items-center justify-center">
          <div className="text-center max-w-lg">
            <h1 className="text-4xl font-heading font-bold text-storm-200 mb-4">
              The Story Has Been Told
            </h1>
            <p className="text-storm-400 mb-2">
              {state.dictionary.length} words created · {state.aspects.length} aspects explored
            </p>
            <p className="text-storm-500 text-sm">
              Thank you for playing Dialect.
            </p>
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
