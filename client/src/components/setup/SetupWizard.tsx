import { useState, useCallback } from 'react';
import { useGameState } from '../../hooks/useGameState';
import type { Socket } from 'socket.io-client';

// ──────────────────── SETUP STEPS ────────────────────────────────

const STEPS = ['Backdrop', 'Aspects', 'Archetypes', 'Sound Set', 'Start'];

// ──────────────────── COMPONENT ──────────────────────────────────

interface SetupWizardProps {
  isHost: boolean;
  socket: Socket | null;
}

/**
 * Multi-step setup wizard for game initialization.
 * Host configures Backdrop, Aspects, Archetypes, and Sound Set.
 * Players see a read-only view of the setup progress.
 *
 * @param isHost - Whether the viewing user is the Host
 * @param socket - Socket.io client for lobby events
 */
const SetupWizard = ({ isHost, socket }: SetupWizardProps) => {
  const { state, dispatch } = useGameState();
  const [step, setStep] = useState(0);
  const [aspectNames, setAspectNames] = useState(['', '', '']);

  if (!state) return null;

  /** Adds 3 named Aspects to the game state. */
  const handleSubmitAspects = useCallback(() => {
    for (const name of aspectNames) {
      if (name.trim()) {
        dispatch({ type: 'ADD_ASPECT', name: name.trim() });
      }
    }
    setStep(2);
  }, [aspectNames, dispatch]);

  /** Deals archetype cards to all players. */
  const handleDealArchetypes = useCallback(() => {
    dispatch({ type: 'DEAL_ARCHETYPES' });
    setStep(3);
  }, [dispatch]);

  /** Starts the game. */
  const handleStartGame = useCallback(() => {
    socket?.emit('lobby:startGame');
  }, [socket]);

  return (
    <div className="min-h-screen bg-storm-900 text-storm-100 font-body flex flex-col items-center justify-center p-6">
      {/* Header */}
      <h1 className="text-3xl font-heading font-bold text-orange mb-2">
        Game Setup
      </h1>

      {/* Step Indicators */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((name, idx) => (
          <div
            key={name}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-body
                       ${idx === step
                         ? 'bg-orange text-storm-900 font-bold'
                         : idx < step
                           ? 'bg-spruce/20 text-spruce'
                           : 'bg-storm-700/50 text-storm-500'
                       }`}
          >
            {idx < step && '✓ '}
            {name}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="w-full max-w-lg">

        {/* Step 0: Backdrop */}
        {step === 0 && (
          <div className="text-center space-y-4">
            <h2 className="text-xl font-heading text-storm-200">Choose Your Backdrop</h2>
            <p className="text-storm-400 text-sm">
              Select the Isolation scenario that will frame your story.
            </p>
            {isHost ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {['The Outpost', 'The Expedition', 'The Colony', 'The Refuge'].map((name) => (
                    <button
                      key={name}
                      onClick={() => {
                        dispatch({ type: 'SET_BACKDROP', backdropId: name });
                        setStep(1);
                      }}
                      className="p-4 bg-storm-700/50 border border-storm-500 rounded-lg
                                 hover:border-orange transition-colors text-storm-200 font-body
                                 focus:outline-none focus:ring-2 focus:ring-orange/50"
                      tabIndex={0}
                      aria-label={`Select ${name} backdrop`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-storm-500 text-sm hover:text-storm-300 transition-colors"
                >
                  Skip for now →
                </button>
              </>
            ) : (
              <p className="text-storm-500 text-sm">Host is choosing a Backdrop...</p>
            )}
          </div>
        )}

        {/* Step 1: Name Aspects */}
        {step === 1 && (
          <div className="text-center space-y-4">
            <h2 className="text-xl font-heading text-storm-200">Name Your Aspects</h2>
            <p className="text-storm-400 text-sm">
              Aspects are the core concepts your language will develop around.
            </p>
            {isHost ? (
              <>
                <div className="space-y-3">
                  {aspectNames.map((name, idx) => (
                    <input
                      key={idx}
                      value={name}
                      onChange={(e) => {
                        const updated = [...aspectNames];
                        updated[idx] = e.target.value;
                        setAspectNames(updated);
                      }}
                      placeholder={`Aspect ${idx + 1} name...`}
                      className="w-full px-4 py-3 bg-storm-700 text-storm-100 rounded-lg
                                 border border-storm-500 focus:border-orange focus:outline-none
                                 focus:ring-2 focus:ring-orange/30 font-body placeholder-storm-500"
                      aria-label={`Aspect ${idx + 1} name`}
                    />
                  ))}
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setStep(0)}
                    className="px-4 py-2 bg-storm-700 text-storm-300 rounded-lg
                               hover:bg-storm-500 transition-colors font-body"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSubmitAspects}
                    disabled={!aspectNames.some((n) => n.trim())}
                    className="px-6 py-2 bg-orange text-storm-900 font-bold rounded-lg
                               hover:bg-orange/90 transition-colors font-body
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    tabIndex={0}
                    aria-label="Confirm aspects"
                  >
                    Confirm Aspects
                  </button>
                </div>
              </>
            ) : (
              <p className="text-storm-500 text-sm">Host is naming the Aspects...</p>
            )}
          </div>
        )}

        {/* Step 2: Deal Archetypes */}
        {step === 2 && (
          <div className="text-center space-y-4">
            <h2 className="text-xl font-heading text-storm-200">Deal Archetypes</h2>
            <p className="text-storm-400 text-sm">
              Each player will receive an Archetype card that inspires their character.
            </p>
            {isHost ? (
              <button
                onClick={handleDealArchetypes}
                className="px-6 py-3 bg-orange text-storm-900 font-heading font-bold rounded-lg
                           hover:bg-orange/90 transition-colors
                           focus:outline-none focus:ring-2 focus:ring-orange/50"
                tabIndex={0}
                aria-label="Deal archetype cards"
              >
                Deal Archetype Cards
              </button>
            ) : (
              <p className="text-storm-500 text-sm">Host is dealing Archetypes...</p>
            )}
          </div>
        )}

        {/* Step 3: Sound Set (Placeholder for Feature #9) */}
        {step === 3 && (
          <div className="text-center space-y-4">
            <h2 className="text-xl font-heading text-storm-200">Choose Sound Set</h2>
            <p className="text-storm-400 text-sm">
              Select the primary sound system for your language.
            </p>
            <p className="text-storm-500 text-xs">(Sound set selection will be added in a later update)</p>
            <button
              onClick={() => setStep(4)}
              className="px-4 py-2 bg-storm-700 text-storm-300 rounded-lg
                         hover:bg-storm-500 transition-colors font-body"
            >
              Skip for Now →
            </button>
          </div>
        )}

        {/* Step 4: Start Game */}
        {step === 4 && (
          <div className="text-center space-y-4">
            <h2 className="text-xl font-heading text-storm-200">Ready to Begin?</h2>
            <p className="text-storm-400 text-sm">
              {state.players.length} players · {state.aspects.length} aspects · Age 1
            </p>
            {isHost ? (
              <button
                onClick={handleStartGame}
                className="px-8 py-3 bg-spruce text-white font-heading font-bold text-lg rounded-lg
                           hover:bg-spruce/80 transition-colors
                           focus:outline-none focus:ring-2 focus:ring-spruce/50"
                tabIndex={0}
                aria-label="Start the game"
              >
                Start the Game
              </button>
            ) : (
              <p className="text-storm-500 text-sm">Waiting for Host to start...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupWizard;
