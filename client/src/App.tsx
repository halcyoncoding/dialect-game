import { GameProvider } from './contexts/GameContext';
import { useGameState } from './hooks/useGameState';

// ────────────────────── INNER APP CONTENT ─────────────────────────

/**
 * Inner component that consumes game state and renders connection
 * status. Will be replaced with phase-based routing in Feature #4.
 */
const AppContent = () => {
  const { state, isConnected } = useGameState();

  return (
    <div className="min-h-screen bg-storm-900 text-storm-100 font-body flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-heading font-bold text-orange mb-4">
          Dialect
        </h1>
        <p className="text-storm-300 text-lg mb-6">
          Digital Tableau
        </p>

        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-spruce' : 'bg-oxide'
            }`}
            aria-label={isConnected ? 'Connected' : 'Disconnected'}
          />
          <span className="text-storm-500 text-sm">
            {isConnected ? 'Connected to server' : 'Connecting...'}
          </span>
        </div>

        {/* State Debug Info */}
        {state && (
          <div className="text-storm-500 text-xs space-y-1">
            <p>State v{state.version} — Phase: {state.session.phase}</p>
            <p>Players: {state.players.length} — Age: {state.session.age}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ──────────────────── ROOT APP COMPONENT ──────────────────────────

/**
 * Root application component for the Dialect Digital Tableau.
 * Wraps the app in GameProvider for state management.
 */
const App = () => {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
};

export default App;
