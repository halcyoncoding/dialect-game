// ──────────────────── COMPONENT ──────────────────────────────────

interface AgeTransitionProps {
  fromAge: number;
  toAge: number;
  isHost: boolean;
  onAdvance: () => void;
  onCancel: () => void;
}

/**
 * Modal prompt for Age advancement. Reminds the group to evolve
 * an Aspect before proceeding.
 *
 * @param fromAge - Current age
 * @param toAge - Age to advance to
 * @param isHost - Whether the viewing user is the Host
 * @param onAdvance - Callback to confirm advancement
 * @param onCancel - Callback to cancel
 */
const AgeTransition = ({
  fromAge,
  toAge,
  isHost,
  onAdvance,
  onCancel,
}: AgeTransitionProps) => {

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
      <div className="bg-storm-900 border border-storm-700 rounded-xl p-8 max-w-md w-full text-center space-y-4">
        <h2 className="text-2xl font-heading font-bold text-orange">
          Ready for Age {toAge}?
        </h2>
        <p className="text-storm-300 font-body">
          Before advancing, your group should evolve one of the Aspects
          to reflect how it has changed.
        </p>

        <div className="bg-storm-700/50 rounded-lg p-3 text-left">
          <p className="text-storm-400 text-sm font-body">
            Checklist:
          </p>
          <ul className="text-storm-300 text-sm font-body mt-1 space-y-1">
            <li>• Discuss how an Aspect has evolved</li>
            <li>• Scribe updates the Aspect name</li>
            <li>• Host confirms advancement</li>
          </ul>
        </div>

        {isHost ? (
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-storm-700 text-storm-300 rounded-lg
                         hover:bg-storm-500 transition-colors font-body
                         focus:outline-none focus:ring-2 focus:ring-storm-500"
              tabIndex={0}
              aria-label="Cancel age advancement"
            >
              Not Yet
            </button>
            <button
              onClick={onAdvance}
              className="px-6 py-2 bg-orange text-storm-900 font-bold rounded-lg
                         hover:bg-orange/90 transition-colors font-body
                         focus:outline-none focus:ring-2 focus:ring-orange/50"
              tabIndex={0}
              aria-label={`Advance to age ${toAge}`}
            >
              Advance to Age {toAge}
            </button>
          </div>
        ) : (
          <p className="text-storm-500 text-sm font-body">
            Waiting for Host to advance...
          </p>
        )}
      </div>
    </div>
  );
};

export default AgeTransition;
