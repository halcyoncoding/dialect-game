import { useContext } from 'react';
import { GameContext } from '../contexts/GameContext';
import type { GameContextValue } from '../types';

// ──────────────────── GAME STATE HOOK ─────────────────────────────

/**
 * Returns the full game context including state, dispatch, connection info.
 * Must be used within a GameProvider.
 *
 * @returns GameContextValue with state, dispatch, undo, redo, connection status
 * @throws Error if used outside of GameProvider
 *
 * @example
 * const { state, dispatch, isConnected } = useGameState();
 */
export const useGameState = (): GameContextValue => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within a <GameProvider>');
  }
  return context;
};

// ──────────────────── PLAYER HOOK ─────────────────────────────────

/**
 * Returns the current player object from game state.
 *
 * @returns The current Player object, or null if not yet assigned
 */
export const usePlayer = () => {
  const { state, playerId } = useGameState();
  if (!state || !playerId) return null;
  return state.players.find((p) => p.id === playerId) || null;
};

// ──────────────────── ROLE HOOKS ──────────────────────────────────

/**
 * Returns whether the current player is the Host.
 *
 * @returns true if the current player is the Host
 */
export const useIsHost = (): boolean => {
  const { state, playerId } = useGameState();
  if (!state || !playerId) return false;
  return state.roles.host === playerId;
};

/**
 * Returns whether the current player is the Scribe.
 *
 * @returns true if the current player is the Scribe
 */
export const useIsScribe = (): boolean => {
  const { state, playerId } = useGameState();
  if (!state || !playerId) return false;
  return state.roles.scribe === playerId;
};
