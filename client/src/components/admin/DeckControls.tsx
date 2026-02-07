import type { GameState, GameAction } from '../../types';

// ──────────────────── COMPONENT ──────────────────────────────────

interface DeckControlsProps {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

/**
 * Admin deck management controls: card counts, deal archetypes,
 * and draw-for-player functionality.
 *
 * @param state - Current game state
 * @param dispatch - Dispatch function for state actions
 */
const DeckControls = ({ state, dispatch }: DeckControlsProps) => {
  const { decks, session, players } = state;

  const isSetup = session.phase === 'setup';
  const isPlaying = session.phase === 'playing';

  /** Deals one archetype card to each player. */
  const handleDealArchetypes = () => {
    dispatch({ type: 'DEAL_ARCHETYPES' });
  };

  /** Draws a card for a specific player from the current age deck. */
  const handleDrawForPlayer = (playerId: string) => {
    const deckName = `age${session.age}` as 'age1' | 'age2' | 'age3';
    dispatch({ type: 'DRAW_CARD', playerId, deck: deckName });
  };

  return (
    <div className="space-y-3">
      {/* Deck Counts */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Archetypes', count: decks.archetypes.length, color: 'text-orange' },
          { label: `Age ${session.age}`, count: decks[`age${session.age}` as keyof typeof decks].length, color: 'text-spruce' },
          { label: 'Discard', count: decks.discard.length, color: 'text-storm-500' },
          { label: 'Total Hands', count: players.reduce((sum, p) => sum + p.hand.length, 0), color: 'text-amber' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-storm-700/30 rounded px-3 py-2 text-center">
            <span className={`text-lg font-heading font-bold ${color}`}>{count}</span>
            <p className="text-storm-500 text-[10px] font-body">{label}</p>
          </div>
        ))}
      </div>

      {/* Deal Archetypes */}
      {isSetup && decks.archetypes.length > 0 && (
        <button
          onClick={handleDealArchetypes}
          className="w-full py-2 bg-orange text-storm-900 text-sm font-body font-bold
                     rounded hover:bg-orange/90 transition-colors
                     focus:outline-none focus:ring-2 focus:ring-orange/50"
          tabIndex={0}
          aria-label="Deal archetype cards to all players"
        >
          Deal Archetypes ({decks.archetypes.length} cards)
        </button>
      )}

      {/* Draw for Player */}
      {isPlaying && players.length > 0 && (
        <div className="space-y-1">
          <p className="text-storm-500 text-xs font-body">Draw for player:</p>
          <div className="flex flex-wrap gap-1">
            {players.map((player) => (
              <button
                key={player.id}
                onClick={() => handleDrawForPlayer(player.id)}
                className="px-2 py-1 bg-storm-700 text-storm-300 text-xs rounded
                           hover:bg-storm-500 transition-colors font-body
                           focus:outline-none focus:ring-1 focus:ring-storm-500"
                tabIndex={0}
                aria-label={`Draw card for ${player.name}`}
              >
                {player.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckControls;
