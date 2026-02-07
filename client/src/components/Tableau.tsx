import { useCallback } from 'react';
import { useGameState } from '../hooks/useGameState';
import IsolationBanner from './IsolationBanner';
import AspectColumn from './AspectColumn';
import PlayerHand from './PlayerHand';
import type { GameAction } from '../types';

// ──────────────────── COMPONENT ──────────────────────────────────

interface TableauProps {
  currentPlayerId: string | null;
}

/**
 * Main game board showing the Isolation banner, Aspect columns with
 * card drop zones, and the player's hand. This is the visual heart of
 * the Dialect experience.
 *
 * @param currentPlayerId - The viewing player's ID
 */
const Tableau = ({ currentPlayerId }: TableauProps) => {
  const { state, dispatch } = useGameState();

  if (!state) return null;

  const isHostOrScribe =
    currentPlayerId === state.roles.host ||
    currentPlayerId === state.roles.scribe;

  const isMyTurn =
    state.players[state.session.turnIndex]?.id === currentPlayerId;

  const currentPlayer = state.players.find((p) => p.id === currentPlayerId);

  /** Dispatches a PLAY_CARD action when a card is dropped on an Aspect. */
  const handlePlayCard = useCallback((cardId: string, aspectId: string) => {
    if (!currentPlayerId) return;
    dispatch({
      type: 'PLAY_CARD',
      playerId: currentPlayerId,
      cardId,
      aspectId,
      notes: '',
    });
  }, [currentPlayerId, dispatch]);

  /** Updates the isolation summary text. */
  const handleUpdateIsolation = useCallback((text: string) => {
    dispatch({ type: 'UPDATE_ISOLATION', text });
  }, [dispatch]);

  return (
    <div className="flex flex-col h-full">
      {/* Isolation Banner */}
      <IsolationBanner
        session={state.session}
        aspects={state.aspects}
        isEditable={isHostOrScribe}
        onUpdateIsolation={handleUpdateIsolation}
      />

      {/* Aspect Columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {state.aspects.map((aspect) => {
          const aspectConnections = state.connections.filter(
            (c) => c.aspectId === aspect.id
          );

          return (
            <AspectColumn
              key={aspect.id}
              aspect={aspect}
              connections={aspectConnections}
              cards={state.cards}
              players={state.players}
              canDrop={isMyTurn}
              onPlayCard={handlePlayCard}
            />
          );
        })}

        {/* Empty state when no aspects */}
        {state.aspects.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-storm-500 font-body">
              No Aspects defined yet. The Host will set them up.
            </p>
          </div>
        )}
      </div>

      {/* Player Hand */}
      {currentPlayer && (
        <div className="border-t border-storm-700 pt-4">
          <PlayerHand
            handCardIds={currentPlayer.hand}
            cards={state.cards}
            isOwnHand={true}
            playerName={currentPlayer.name}
            playerColor={currentPlayer.color}
          />
        </div>
      )}
    </div>
  );
};

export default Tableau;
