import type { Player, Roles, GameAction } from '../../types';

// ──────────────────── COMPONENT ──────────────────────────────────

interface PlayerManagerProps {
  players: Player[];
  roles: Roles;
  currentTurnIndex: number;
  dispatch: (action: GameAction) => void;
}

/**
 * Admin view showing all players with controls for Scribe assignment,
 * turn management, and hand visibility.
 *
 * @param players - All players in the game
 * @param roles - Current role assignments
 * @param currentTurnIndex - Index of the player whose turn it is
 * @param dispatch - Dispatch function for state actions
 */
const PlayerManager = ({
  players,
  roles,
  currentTurnIndex,
  dispatch,
}: PlayerManagerProps) => {

  /** Toggles the Scribe role for a player. */
  const handleToggleScribe = (playerId: string) => {
    dispatch({ type: 'SET_SCRIBE', playerId });
  };

  /** Moves a player up in the turn order. */
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const ids = players.map((p) => p.id);
    [ids[index], ids[index - 1]] = [ids[index - 1], ids[index]];
    dispatch({ type: 'REORDER_PLAYERS', playerIds: ids });
  };

  /** Moves a player down in the turn order. */
  const handleMoveDown = (index: number) => {
    if (index === players.length - 1) return;
    const ids = players.map((p) => p.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    dispatch({ type: 'REORDER_PLAYERS', playerIds: ids });
  };

  return (
    <div className="space-y-2">
      {players.map((player, idx) => (
        <div
          key={player.id}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                     ${idx === currentTurnIndex ? 'bg-storm-700 ring-1 ring-orange/50' : 'bg-storm-700/30'}`}
        >
          {/* Color + Status */}
          <div className="relative">
            <div
              className="w-7 h-7 rounded-full border border-storm-300"
              style={{ backgroundColor: player.color }}
            />
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-storm-900
                         ${player.isConnected ? 'bg-spruce' : 'bg-oxide'}`}
            />
          </div>

          {/* Name + Badges */}
          <div className="flex-1 min-w-0">
            <span className="text-storm-100 font-body truncate block">
              {player.name}
            </span>
            <div className="flex gap-1">
              {player.id === roles.host && (
                <span className="text-orange text-[10px] font-body">Host</span>
              )}
              {player.id === roles.scribe && (
                <span className="text-spruce text-[10px] font-body">Scribe</span>
              )}
              {idx === currentTurnIndex && (
                <span className="text-amber text-[10px] font-body">Turn</span>
              )}
            </div>
          </div>

          {/* Cards count */}
          <span className="text-storm-500 text-xs">{player.hand.length}c</span>

          {/* Scribe toggle */}
          <button
            onClick={() => handleToggleScribe(player.id)}
            className={`px-2 py-0.5 text-[10px] rounded transition-colors
                       ${player.id === roles.scribe
                         ? 'bg-spruce text-white'
                         : 'bg-storm-500/30 text-storm-400 hover:bg-storm-500/50'
                       }`}
            tabIndex={0}
            aria-label={`${player.id === roles.scribe ? 'Remove' : 'Set'} ${player.name} as Scribe`}
          >
            S
          </button>

          {/* Reorder */}
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => handleMoveUp(idx)}
              disabled={idx === 0}
              className="text-storm-500 hover:text-storm-200 text-[10px] disabled:opacity-30"
              tabIndex={0}
              aria-label={`Move ${player.name} up`}
            >
              ▲
            </button>
            <button
              onClick={() => handleMoveDown(idx)}
              disabled={idx === players.length - 1}
              className="text-storm-500 hover:text-storm-200 text-[10px] disabled:opacity-30"
              tabIndex={0}
              aria-label={`Move ${player.name} down`}
            >
              ▼
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlayerManager;
