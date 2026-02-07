import type { Player, PendingPlayer } from '../types';

// ──────────────────── COMPONENT ──────────────────────────────────

interface LobbyPlayerListProps {
  players: Player[];
  pendingPlayers: PendingPlayer[];
  isHost: boolean;
  onApprove?: (playerId: string) => void;
  onReject?: (playerId: string) => void;
}

/**
 * Displays the list of connected and pending players in the lobby.
 * Host sees approve/reject controls for pending players.
 *
 * @param players - Array of approved players
 * @param pendingPlayers - Array of players awaiting Host approval
 * @param isHost - Whether the viewing user is the Host
 * @param onApprove - Callback when Host approves a player
 * @param onReject - Callback when Host rejects a player
 */
const LobbyPlayerList = ({
  players,
  pendingPlayers,
  isHost,
  onApprove,
  onReject,
}: LobbyPlayerListProps) => {

  return (
    <div className="w-full max-w-md mx-auto space-y-4">

      {/* Pending Players (Host only) */}
      {isHost && pendingPlayers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-storm-300 text-sm font-body uppercase tracking-wide">
            Pending Approval
          </h3>
          {pendingPlayers.map((pending) => (
            <div
              key={pending.id}
              className="flex items-center justify-between bg-storm-700/50 rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {/* Color avatar */}
                <div
                  className="w-8 h-8 rounded-full border-2 border-storm-500"
                  style={{ backgroundColor: pending.color }}
                  aria-label={`${pending.name}'s color`}
                />
                <span className="text-storm-200 font-body">{pending.name}</span>
                <span className="text-amber text-xs font-body">Waiting...</span>
              </div>

              {/* Approve/Reject controls */}
              <div className="flex gap-2">
                <button
                  onClick={() => onApprove?.(pending.id)}
                  className="px-3 py-1 bg-spruce text-white text-sm rounded
                             hover:bg-spruce/80 transition-colors
                             focus:outline-none focus:ring-2 focus:ring-spruce/50"
                  tabIndex={0}
                  aria-label={`Approve ${pending.name}`}
                >
                  Approve
                </button>
                <button
                  onClick={() => onReject?.(pending.id)}
                  className="px-3 py-1 bg-oxide text-white text-sm rounded
                             hover:bg-oxide/80 transition-colors
                             focus:outline-none focus:ring-2 focus:ring-oxide/50"
                  tabIndex={0}
                  aria-label={`Reject ${pending.name}`}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connected Players */}
      {players.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-storm-300 text-sm font-body uppercase tracking-wide">
            Players ({players.length})
          </h3>
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 bg-storm-700/30 rounded-lg px-4 py-3"
            >
              {/* Color avatar */}
              <div
                className="w-8 h-8 rounded-full border-2 border-storm-300"
                style={{ backgroundColor: player.color }}
                aria-label={`${player.name}'s color`}
              />

              {/* Name */}
              <span className="text-storm-100 font-body flex-1">
                {player.name}
              </span>

              {/* Connection indicator */}
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  player.isConnected ? 'bg-spruce' : 'bg-oxide'
                }`}
                aria-label={player.isConnected ? 'Connected' : 'Disconnected'}
              />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {players.length === 0 && pendingPlayers.length === 0 && (
        <p className="text-storm-500 text-center font-body text-sm py-8">
          No players have joined yet. Share the link to invite others.
        </p>
      )}
    </div>
  );
};

export default LobbyPlayerList;
