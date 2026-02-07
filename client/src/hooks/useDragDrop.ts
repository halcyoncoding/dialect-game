import { useState, useCallback } from 'react';

// ──────────────── DRAG SOURCE HOOK ───────────────────────────────

/**
 * Provides HTML5 drag props for a draggable card.
 *
 * @param cardId - The card ID to attach to the drag data
 * @param enabled - Whether dragging is allowed (e.g. only on player's turn)
 * @returns Object with dragProps to spread on the draggable element
 *
 * @example
 * const { dragProps, isDragging } = useDragSource('age1-01', true);
 * <div {...dragProps}>Card</div>
 */
export const useDragSource = (cardId: string, enabled: boolean = true) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!enabled) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  }, [cardId, enabled]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const dragProps = {
    draggable: enabled,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
  };

  return { dragProps, isDragging };
};

// ──────────────── DROP TARGET HOOK ───────────────────────────────

/**
 * Provides HTML5 drop target props for an Aspect column.
 *
 * @param onDrop - Callback fired with the dropped card ID
 * @param enabled - Whether dropping is allowed
 * @returns Object with dropProps and isOver state
 *
 * @example
 * const { dropProps, isOver } = useDropTarget((cardId) => handlePlay(cardId), true);
 * <div {...dropProps}>Drop Zone</div>
 */
export const useDropTarget = (
  onDrop: (cardId: string) => void,
  enabled: boolean = true
) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!enabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, [enabled]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (!enabled) return;
    e.preventDefault();
    setIsOver(true);
  }, [enabled]);

  const handleDragLeave = useCallback(() => {
    setIsOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);

    if (!enabled) return;

    const cardId = e.dataTransfer.getData('text/plain');
    if (cardId) {
      onDrop(cardId);
    }
  }, [enabled, onDrop]);

  const dropProps = {
    onDragOver: handleDragOver,
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  };

  return { dropProps, isOver };
};
