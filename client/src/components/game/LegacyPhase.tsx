import { useState, useCallback } from 'react';
import { useGameState } from '../../hooks/useGameState';
import type { DictionaryEntry } from '../../types';

// ──────────────────── COMPONENT ──────────────────────────────────

interface LegacyPhaseProps {
  isHost: boolean;
}

/**
 * The Legacy Phase conclusion UI. Replaces the main game board with
 * memorial-style prompts, a dictionary summary, and final narrative inputs.
 *
 * @param isHost - Whether the viewing user is the Host
 */
const LegacyPhase = ({ isHost }: LegacyPhaseProps) => {
  const { state, dispatch } = useGameState();

  if (!state) return null;

  /** Ends the game and locks the state. */
  const handleEndGame = useCallback(() => {
    dispatch({ type: 'END_GAME' });
  }, [dispatch]);

  // Group words by age
  const wordsByAge = state.dictionary.reduce<Record<number, DictionaryEntry[]>>((acc, entry) => {
    if (!acc[entry.age]) acc[entry.age] = [];
    acc[entry.age].push(entry);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-storm-900 text-storm-100 font-body p-6 flex flex-col items-center">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center pt-8">
          <h1 className="text-4xl font-heading font-bold text-storm-200 mb-2">
            The Legacy
          </h1>
          <p className="text-storm-400 text-lg font-body">
            Your language has lived. Now, what remains?
          </p>
        </div>

        {/* Aspects Summary */}
        <div className="space-y-3">
          <h2 className="text-lg font-heading text-storm-300">Our Aspects</h2>
          {state.aspects.map((aspect) => (
            <div
              key={aspect.id}
              className={`bg-storm-700/30 rounded-lg p-4 border-l-4
                         ${aspect.status === 'faded' ? 'border-storm-500 opacity-60' : 'border-spruce'}`}
            >
              <h3 className="font-heading font-bold text-storm-200">
                {aspect.name}
                {aspect.evolution && (
                  <span className="text-spruce font-normal"> → {aspect.evolution}</span>
                )}
              </h3>
              <p className="text-storm-400 text-sm mt-1">
                {aspect.status === 'faded' ? 'This aspect faded from the language.' : 'This aspect endured.'}
              </p>
            </div>
          ))}
        </div>

        {/* Dictionary Summary */}
        <div className="space-y-3">
          <h2 className="text-lg font-heading text-storm-300">
            Our Dictionary ({state.dictionary.length} words)
          </h2>
          {[1, 2, 3].map((age) => {
            const words = wordsByAge[age] || [];
            if (words.length === 0) return null;
            return (
              <div key={age}>
                <h3 className="text-sm font-body text-amber mb-1">Age {age}</h3>
                <div className="space-y-1">
                  {words.map((word) => (
                    <div key={word.id} className="flex gap-3 text-sm bg-storm-700/20 rounded px-3 py-1.5">
                      <span className="text-storm-100 font-bold">{word.word}</span>
                      <span className="text-storm-500 font-mono text-xs">{word.ipa}</span>
                      <span className="text-storm-400 flex-1">{word.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {state.dictionary.length === 0 && (
            <p className="text-storm-500 text-sm">No words were created.</p>
          )}
        </div>

        {/* End Game */}
        {isHost && (
          <div className="text-center pt-4">
            <button
              onClick={handleEndGame}
              className="px-8 py-3 bg-oxide text-white font-heading font-bold rounded-lg
                         hover:bg-oxide/80 transition-colors
                         focus:outline-none focus:ring-2 focus:ring-oxide/50"
              tabIndex={0}
              aria-label="End the game"
            >
              End the Story
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LegacyPhase;
