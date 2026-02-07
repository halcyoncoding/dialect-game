import { useState } from 'react';

// ──────────────────── PLAYER COLORS ──────────────────────────────

/** Preset color choices for player avatars. */
const PLAYER_COLORS = [
  { hex: '#FF6B6B', label: 'Coral' },
  { hex: '#4ECDC4', label: 'Teal' },
  { hex: '#45B7D1', label: 'Sky' },
  { hex: '#96CEB4', label: 'Sage' },
  { hex: '#FFEAA7', label: 'Gold' },
  { hex: '#DDA0DD', label: 'Plum' },
  { hex: '#FF9A0D', label: 'Amber' },
  { hex: '#A8E6CF', label: 'Mint' },
];

// ──────────────────── COMPONENT ──────────────────────────────────

interface JoinFormProps {
  onSubmit: (name: string, color: string) => void;
  existingNames: string[];
  isSubmitting: boolean;
  error?: string | null;
}

/**
 * Form for entering a display name and choosing a color avatar
 * to join the game lobby.
 *
 * @param onSubmit - Callback when the form is submitted with name and color
 * @param existingNames - Names already taken (for duplicate check)
 * @param isSubmitting - Whether a join request is in progress
 * @param error - Error message to display
 */
const JoinForm = ({ onSubmit, existingNames, isSubmitting, error }: JoinFormProps) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PLAYER_COLORS[0].hex);
  const [validationError, setValidationError] = useState<string | null>(null);

  /** Validates name input and submits the join request. */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setValidationError('Please enter a display name');
      return;
    }

    if (trimmed.length > 20) {
      setValidationError('Name must be 20 characters or less');
      return;
    }

    // Client-side duplicate check (case-insensitive)
    const nameTaken = existingNames.some(
      (n) => n.toLowerCase() === trimmed.toLowerCase()
    );
    if (nameTaken) {
      setValidationError('That name is already taken');
      return;
    }

    onSubmit(trimmed, selectedColor);
  };

  const displayError = validationError || error;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm mx-auto space-y-6"
    >
      {/* Name Input */}
      <div>
        <label
          htmlFor="player-name"
          className="block text-storm-300 text-sm font-body mb-2"
        >
          Display Name
        </label>
        <input
          id="player-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name..."
          maxLength={20}
          autoFocus
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-storm-700 text-storm-100 rounded-lg
                     border border-storm-500 focus:border-orange focus:outline-none
                     focus:ring-2 focus:ring-orange/30 font-body
                     placeholder-storm-500 disabled:opacity-50"
          aria-label="Display name"
          aria-describedby={displayError ? 'name-error' : undefined}
        />
      </div>

      {/* Color Picker */}
      <div>
        <span className="block text-storm-300 text-sm font-body mb-2">
          Choose Your Color
        </span>
        <div className="flex gap-3 flex-wrap justify-center" role="radiogroup" aria-label="Player color">
          {PLAYER_COLORS.map(({ hex, label }) => (
            <button
              key={hex}
              type="button"
              onClick={() => setSelectedColor(hex)}
              disabled={isSubmitting}
              className={`w-10 h-10 rounded-full border-2 transition-all
                         focus:outline-none focus:ring-2 focus:ring-orange/50
                         ${selectedColor === hex
                           ? 'border-white scale-110 shadow-lg'
                           : 'border-transparent hover:border-storm-500'
                         }
                         disabled:opacity-50`}
              style={{ backgroundColor: hex }}
              tabIndex={0}
              role="radio"
              aria-checked={selectedColor === hex}
              aria-label={`Select ${label} color`}
            />
          ))}
        </div>
      </div>

      {/* Error Message */}
      {displayError && (
        <p
          id="name-error"
          className="text-oxide text-sm text-center font-body"
          role="alert"
        >
          {displayError}
        </p>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-orange text-storm-900 font-heading font-bold
                   rounded-lg hover:bg-orange/90 transition-colors
                   focus:outline-none focus:ring-2 focus:ring-orange/50
                   disabled:opacity-50 disabled:cursor-not-allowed"
        tabIndex={0}
        aria-label="Request to join the game"
      >
        {isSubmitting ? 'Requesting...' : 'Request to Join'}
      </button>
    </form>
  );
};

export default JoinForm;
