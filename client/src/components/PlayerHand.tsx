import { useState } from 'react';
import CardDisplay from './CardDisplay';
import type { Card } from '../types';

// ──────────────────── COMPONENT ──────────────────────────────────

interface PlayerHandProps {
  handCardIds: string[];
  cards: Record<string, Card>;
  isOwnHand: boolean;
  playerName: string;
  playerColor: string;
  onSelectCard?: (cardId: string) => void;
  selectedCardId?: string | null;
}

/**
 * Displays a player's hand of cards. For the current player, shows
 * actual card images in a fan layout. For other players, shows card
 * backs with a count badge.
 *
 * @param handCardIds - Array of card IDs in the hand
 * @param cards - Full card definitions from game state
 * @param isOwnHand - Whether this is the viewing player's own hand
 * @param playerName - The player's display name
 * @param playerColor - The player's avatar color
 * @param onSelectCard - Callback when a card is clicked (own hand only)
 * @param selectedCardId - Currently selected card ID
 */
const PlayerHand = ({
  handCardIds,
  cards,
  isOwnHand,
  playerName,
  playerColor,
  onSelectCard,
  selectedCardId,
}: PlayerHandProps) => {

  // Other player's hand — show count only
  if (!isOwnHand) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-storm-700/30 rounded-lg">
        <div
          className="w-6 h-6 rounded-full border border-storm-500"
          style={{ backgroundColor: playerColor }}
          aria-label={`${playerName}'s color`}
        />
        <span className="text-storm-300 text-sm font-body">{playerName}</span>
        <span className="text-storm-500 text-xs font-body ml-auto">
          {handCardIds.length} card{handCardIds.length !== 1 ? 's' : ''}
        </span>
      </div>
    );
  }

  // Own hand — show actual cards
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-full border border-storm-300"
          style={{ backgroundColor: playerColor }}
        />
        <h3 className="text-storm-300 text-sm font-body">Your Hand</h3>
        <span className="text-storm-500 text-xs font-body">
          ({handCardIds.length} card{handCardIds.length !== 1 ? 's' : ''})
        </span>
      </div>

      {handCardIds.length === 0 ? (
        <p className="text-storm-500 text-sm font-body text-center py-4">
          No cards in hand
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
          {handCardIds.map((cardId) => {
            const card = cards[cardId] || null;
            const isHidden = cardId === 'hidden';

            if (isHidden) return null;

            return (
              <div key={cardId} className="flex-shrink-0 snap-start">
                <CardDisplay
                  card={card}
                  showFront={true}
                  size="small"
                  isSelected={selectedCardId === cardId}
                  onClick={() => onSelectCard?.(cardId)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlayerHand;
