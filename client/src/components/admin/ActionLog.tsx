import type { ActionLogEntry, GameAction } from '../../types';

// ──────────────────── COMPONENT ──────────────────────────────────

interface ActionLogProps {
  log: ActionLogEntry[];
  onUndo: () => void;
  onRedo: () => void;
}

/**
 * Displays the recent action log with undo/redo controls.
 * Most recent actions appear at the top.
 *
 * @param log - Array of action log entries (most recent first)
 * @param onUndo - Callback for undo button
 * @param onRedo - Callback for redo button
 */
const ActionLog = ({ log, onUndo, onRedo }: ActionLogProps) => {

  /** Formats a timestamp to a short time string. */
  const formatTime = (ts: number): string => {
    return new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-2">
      {/* Undo / Redo */}
      <div className="flex gap-2">
        <button
          onClick={onUndo}
          className="flex-1 py-1.5 bg-storm-700 text-storm-300 text-xs rounded
                     hover:bg-storm-500 transition-colors font-body
                     focus:outline-none focus:ring-1 focus:ring-storm-500"
          tabIndex={0}
          aria-label="Undo last action"
        >
          ↩ Undo
        </button>
        <button
          onClick={onRedo}
          className="flex-1 py-1.5 bg-storm-700 text-storm-300 text-xs rounded
                     hover:bg-storm-500 transition-colors font-body
                     focus:outline-none focus:ring-1 focus:ring-storm-500"
          tabIndex={0}
          aria-label="Redo last undone action"
        >
          ↪ Redo
        </button>
      </div>

      {/* Log Entries */}
      <div className="max-h-48 overflow-y-auto space-y-1">
        {log.length === 0 ? (
          <p className="text-storm-500 text-xs text-center py-4 font-body">
            No actions yet
          </p>
        ) : (
          log.map((entry, idx) => (
            <div
              key={`${entry.timestamp}-${idx}`}
              className="flex gap-2 text-xs py-1 border-b border-storm-700/50"
            >
              <span className="text-storm-500 font-mono shrink-0">
                {formatTime(entry.timestamp)}
              </span>
              <span className="text-storm-300 font-body">
                {entry.description}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActionLog;
