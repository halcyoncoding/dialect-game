import { useState } from 'react';
import type { Card } from '../types';

// ────────────────────── SIZE PRESETS ──────────────────────────────

const SIZE_MAP = {
  small: { width: 120, height: 168 },
  medium: { width: 180, height: 252 },
  large: { width: 240, height: 336 },
} as const;

// ──────────────────── COMPONENT ──────────────────────────────────

interface CardDisplayProps {
  card: Card | null;
  showFront?: boolean;
  size?: 'small' | 'medium' | 'large';
  isSelected?: boolean;
  onClick?: () => void;
}

/**
 * Displays a game card with front/back image and flip animation.
 * Uses CSS 3D transforms for a realistic card flip effect.
 *
 * @param card - The card data (null shows a placeholder)
 * @param showFront - Whether to show the front face (default: true)
 * @param size - Display size preset: 'small' | 'medium' | 'large'
 * @param isSelected - Whether the card is currently selected (raised + glow)
 * @param onClick - Click handler for card selection
 *
 * @example
 * <CardDisplay card={myCard} showFront={true} size="medium" onClick={handleSelect} />
 */
const CardDisplay = ({
  card,
  showFront = true,
  size = 'medium',
  isSelected = false,
  onClick,
}: CardDisplayProps) => {
  const [imgError, setImgError] = useState(false);
  const dimensions = SIZE_MAP[size];

  // Placeholder when no card data
  if (!card) {
    return (
      <div
        className="bg-storm-700 rounded-lg border-2 border-storm-500 flex items-center justify-center"
        style={{ width: dimensions.width, height: dimensions.height }}
        aria-label="Empty card slot"
      >
        <span className="text-storm-500 text-xs font-body">No Card</span>
      </div>
    );
  }

  const imageSrc = showFront ? card.frontImage : card.backImage;

  return (
    <div
      className="relative cursor-pointer perspective-1000"
      style={{ width: dimensions.width, height: dimensions.height }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      tabIndex={onClick ? 0 : -1}
      role={onClick ? 'button' : 'img'}
      aria-label={`Card ${card.id}${isSelected ? ' (selected)' : ''}`}
    >
      {/* Card Container with flip animation */}
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d
                    ${!showFront ? 'rotate-y-180' : ''}
                    ${isSelected ? '-translate-y-2 shadow-lg shadow-orange/30' : ''}
                    ${isSelected ? 'ring-2 ring-orange' : ''}`}
      >
        {/* Front Face */}
        <div className="absolute inset-0 backface-hidden rounded-lg overflow-hidden shadow-md">
          {imgError ? (
            <div className="w-full h-full bg-storm-700 flex items-center justify-center rounded-lg border border-storm-500">
              <span className="text-storm-500 text-xs font-body text-center px-2">
                {card.id}
              </span>
            </div>
          ) : (
            <img
              src={imageSrc}
              alt={`Card ${card.id} front`}
              className="w-full h-full object-cover rounded-lg"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          )}
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-lg overflow-hidden shadow-md">
          <img
            src={card.backImage}
            alt={`Card ${card.id} back`}
            className="w-full h-full object-cover rounded-lg"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

export default CardDisplay;
