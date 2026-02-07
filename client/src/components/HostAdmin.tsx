import { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useIsHost } from '../hooks/useGameState';
import PlayerManager from './admin/PlayerManager';
import DeckControls from './admin/DeckControls';
import ActionLog from './admin/ActionLog';
import JoinLink from './admin/JoinLink';

// ──────────────────── TAB TYPES ──────────────────────────────────

type AdminTab = 'players' | 'decks' | 'log' | 'share';

// ──────────────────── COMPONENT ──────────────────────────────────

/**
 * Collapsible admin sidebar panel accessible only to the Host.
 * Provides controls for player management, deck operations,
 * action log with undo/redo, and join link sharing.
 */
const HostAdmin = () => {
  const isHost = useIsHost();
  const { state, dispatch, undo, redo } = useGameState();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('players');

  // Don't render for non-Host
  if (!isHost || !state) return null;

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'players', label: 'Players', icon: '👥' },
    { id: 'decks', label: 'Decks', icon: '🃏' },
    { id: 'log', label: 'Log', icon: '📋' },
    { id: 'share', label: 'Share', icon: '🔗' },
  ];

  return (
    <>
      {/* Toggle Button — always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 right-4 z-50 w-10 h-10 rounded-lg
                   flex items-center justify-center transition-colors
                   focus:outline-none focus:ring-2 focus:ring-orange/50
                   ${isOpen ? 'bg-storm-700 text-orange' : 'bg-orange text-storm-900'}`}
        tabIndex={0}
        aria-label={isOpen ? 'Close admin panel' : 'Open admin panel'}
        aria-expanded={isOpen}
      >
        {isOpen ? '✕' : '⚙'}
      </button>

      {/* Panel Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-storm-900 border-l border-storm-700
                   z-40 transform transition-transform duration-300 ease-in-out
                   ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label="Host Admin Panel"
      >
        {/* Header */}
        <div className="px-4 pt-16 pb-3 border-b border-storm-700">
          <h2 className="text-orange font-heading font-bold text-sm">
            Host Admin
          </h2>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-storm-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-xs font-body transition-colors
                         focus:outline-none
                         ${activeTab === tab.id
                           ? 'text-orange border-b-2 border-orange'
                           : 'text-storm-500 hover:text-storm-300'
                         }`}
              tabIndex={0}
              aria-label={tab.label}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              <span className="block text-base">{tab.icon}</span>
              <span className="block mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
          {activeTab === 'players' && (
            <PlayerManager
              players={state.players}
              roles={state.roles}
              currentTurnIndex={state.session.turnIndex}
              dispatch={dispatch}
            />
          )}

          {activeTab === 'decks' && (
            <DeckControls state={state} dispatch={dispatch} />
          )}

          {activeTab === 'log' && (
            <ActionLog
              log={state.actionLog}
              onUndo={undo}
              onRedo={redo}
            />
          )}

          {activeTab === 'share' && <JoinLink />}
        </div>
      </div>
    </>
  );
};

export default HostAdmin;
