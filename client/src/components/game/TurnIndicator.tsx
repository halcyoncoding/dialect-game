import type { Player } from '../../types';

// ──────────────────── COMPONENT ──────────────────────────────────

interface TurnIndicatorProps {
  players: Player[];
  turnIndex: number;
  currentPlayerId: string | null;
  age: number;
}

/**
 * Horizontal bar showing turn order with the active player highlighted.
 * Shows "Your Turn!" badge on the active player's screen.
 *
 * @param players - All players in turn order
 * @param turnIndex - Index of the active player
 * @param currentPlayerId - The viewing player's ID
 * @param age - Current game age
 */
const TurnIndicator = ({
  players,
  turnIndex,
  currentPlayerId,
  age,
}: TurnIndicatorProps) => {
  const isMyTurn = players[turnIndex]?.id === currentPlayerId;

  return (
    <div className="bg-storm-700/30 rounded-lg px-4 py-2 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-storm-500 text-xs font-body">Turn Order</span>
        <span className="text-amber text-xs font-body">Age {age}</span>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {players.map((player, idx) => {
          const isActive = idx === turnIndex;

          return (
            <div
              key={player.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body
                         transition-all shrink-0
                         ${isActive
                           ? 'bg-orange/20 text-orange ring-1 ring-orange/50 scale-105'
                           : 'text-storm-400'
                         }
                         ${!player.isConnected ? 'opacity-40' : ''}`}
            >
              <div
                className="w-4 h-4 rounded-full border border-storm-300/50"
                style={{ backgroundColor: player.color }}
              />
              <span>{player.name}</span>
              {isActive && isMyTurn && (
                <span className="text-orange font-bold animate-pulse ml-1">
                  ← Your Turn!
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TurnIndicator;
