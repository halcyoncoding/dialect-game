import { useState, useCallback } from 'react';
import type { Session, Aspect } from '../types';

// ──────────────────── COMPONENT ──────────────────────────────────

interface IsolationBannerProps {
  session: Session;
  aspects: Aspect[];
  isEditable: boolean;
  onUpdateIsolation?: (text: string) => void;
}

/**
 * Persistent banner showing the Backdrop, Isolation summary, current Age,
 * and Aspect status. Editable by Host/Scribe.
 *
 * @param session - Current session metadata
 * @param aspects - All game aspects
 * @param isEditable - Whether the current user can edit the isolation text
 * @param onUpdateIsolation - Callback when isolation text is updated
 */
const IsolationBanner = ({
  session,
  aspects,
  isEditable,
  onUpdateIsolation,
}: IsolationBannerProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(session.isolationSummary);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    if (editText !== session.isolationSummary) {
      onUpdateIsolation?.(editText);
    }
  }, [editText, session.isolationSummary, onUpdateIsolation]);

  return (
    <div className="bg-storm-700/50 rounded-lg px-4 py-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {session.backdrop && (
            <span className="text-orange text-xs font-heading font-bold uppercase">
              {session.backdrop}
            </span>
          )}
          <span className="text-amber text-xs font-heading font-bold">
            Age {session.age}
          </span>
        </div>

        {/* Aspect pills */}
        <div className="flex gap-2">
          {aspects.map((aspect) => (
            <span
              key={aspect.id}
              className={`px-2 py-0.5 rounded-full text-[10px] font-body
                         ${aspect.status === 'active'
                           ? 'bg-spruce/20 text-spruce'
                           : 'bg-storm-500/20 text-storm-500'
                         }`}
            >
              {aspect.evolution || aspect.name}
            </span>
          ))}
        </div>
      </div>

      {/* Isolation summary */}
      {isEditing ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSave(); }}
          className="w-full bg-storm-900 text-storm-200 text-sm font-body rounded px-2 py-1
                     border border-storm-500 focus:border-orange focus:outline-none resize-none"
          rows={2}
          autoFocus
          aria-label="Isolation summary text"
        />
      ) : (
        <p
          className={`text-storm-300 text-sm font-body ${isEditable ? 'cursor-pointer hover:text-storm-200' : ''}`}
          onClick={() => isEditable && setIsEditing(true)}
          role={isEditable ? 'button' : undefined}
          tabIndex={isEditable ? 0 : undefined}
          onKeyDown={(e) => {
            if (isEditable && (e.key === 'Enter' || e.key === ' ')) setIsEditing(true);
          }}
          aria-label={isEditable ? 'Click to edit isolation summary' : 'Isolation summary'}
        >
          {session.isolationSummary || (isEditable ? 'Click to describe your Isolation...' : 'No Isolation summary set.')}
        </p>
      )}
    </div>
  );
};

export default IsolationBanner;
