import { useCallback } from 'react';
import { useDropTarget } from '../hooks/useDragDrop';
import CardDisplay from './CardDisplay';
import type { Aspect, CardConnection, Card, Player } from '../types';

// ──────────────────── COMPONENT ──────────────────────────────────

interface AspectColumnProps {
  aspect: Aspect;
  connections: CardConnection[];
  cards: Record<string, Card>;
  players: Player[];
  canDrop: boolean;
  onPlayCard: (cardId: string, aspectId: string) => void;
}

/**
 * A single Aspect column in the Tableau. Shows the Aspect header,
 * a drop zone for card play, and all cards connected to this Aspect.
 *
 * @param aspect - The Aspect this column represents
 * @param connections - Card connections to this Aspect
 * @param cards - All card definitions
 * @param players - All players (for connection attribution)
 * @param canDrop - Whether card dropping is enabled
 * @param onPlayCard - Callback when a card is dropped
 */
const AspectColumn = ({
  aspect,
  connections,
  cards,
  players,
  canDrop,
  onPlayCard,
}: AspectColumnProps) => {
  const handleDrop = useCallback(
    (cardId: string) => onPlayCard(cardId, aspect.id),
    [aspect.id, onPlayCard]
  );

  const { dropProps, isOver } = useDropTarget(handleDrop, canDrop);

  const isFaded = aspect.status === 'faded';

  return (
    <div
      className={`flex flex-col bg-storm-700/20 rounded-lg border transition-colors
                 ${isOver ? 'border-orange bg-orange/5' : 'border-storm-700'}
                 ${isFaded ? 'opacity-60' : ''}`}
    >
      {/* Aspect Header */}
      <div className="px-4 py-3 border-b border-storm-700/50">
        <h3 className="text-storm-100 font-heading font-bold text-sm">
          {aspect.name}
        </h3>
        {aspect.evolution && (
          <p className="text-spruce text-xs font-body mt-0.5">
            → {aspect.evolution}
          </p>
        )}
        <span
          className={`text-[10px] font-body
                     ${aspect.status === 'active' ? 'text-spruce' : 'text-storm-500'}`}
        >
          {aspect.status === 'faded' ? 'Faded' : 'Active'}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        {...dropProps}
        className={`mx-3 my-2 py-4 border-2 border-dashed rounded-lg text-center transition-colors
                   ${isOver
                     ? 'border-orange bg-orange/10 text-orange'
                     : 'border-storm-500/30 text-storm-500'
                   }
                   ${!canDrop ? 'opacity-30' : ''}`}
        role="region"
        aria-label={`Drop zone for ${aspect.name}`}
      >
        <span className="text-xs font-body">
          {isOver ? 'Release to play' : 'Drop a card here'}
        </span>
      </div>

      {/* Connected Cards */}
      <div className="px-3 pb-3 space-y-2 flex-1">
        {connections.length === 0 ? (
          <p className="text-storm-500 text-xs text-center py-2 font-body">
            No cards played
          </p>
        ) : (
          connections.map((conn) => {
            const card = cards[conn.cardId];
            const player = players.find((p) => p.id === conn.playerId);

            return (
              <div key={conn.cardId} className="space-y-1">
                <CardDisplay card={card || null} showFront={true} size="small" />
                <div className="flex items-center gap-1">
                  {player && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: player.color }}
                    />
                  )}
                  <span className="text-storm-500 text-[10px] font-body">
                    {player?.name || 'Unknown'}
                  </span>
                </div>
                {conn.notes && (
                  <p className="text-storm-500 text-[10px] font-body italic">
                    {conn.notes}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AspectColumn;
