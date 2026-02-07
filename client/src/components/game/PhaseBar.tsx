// ──────────────────── COMPONENT ──────────────────────────────────

interface PhaseBarProps {
  currentPhase: string;
  currentAge: number;
}

const PHASES = [
  { id: 'setup', label: 'Setup' },
  { id: 'age1', label: 'Age 1' },
  { id: 'age2', label: 'Age 2' },
  { id: 'age3', label: 'Age 3' },
  { id: 'legacy', label: 'Legacy' },
];

/**
 * Compact progress bar showing the game's current phase.
 *
 * @param currentPhase - Current session phase
 * @param currentAge - Current game age (1-3)
 */
const PhaseBar = ({ currentPhase, currentAge }: PhaseBarProps) => {
  // Determine which phase ID is current
  const activePhaseId = currentPhase === 'playing'
    ? `age${currentAge}`
    : currentPhase;

  const activeIndex = PHASES.findIndex((p) => p.id === activePhaseId);

  return (
    <div className="flex gap-0.5 mb-3">
      {PHASES.map((phase, idx) => {
        const isPast = idx < activeIndex;
        const isCurrent = idx === activeIndex;

        return (
          <div
            key={phase.id}
            className={`flex-1 h-1.5 rounded-full transition-colors
                       ${isCurrent ? 'bg-orange' : isPast ? 'bg-spruce' : 'bg-storm-700'}`}
            title={phase.label}
            aria-label={`${phase.label}${isCurrent ? ' (current)' : isPast ? ' (complete)' : ''}`}
          />
        );
      })}
    </div>
  );
};

export default PhaseBar;
