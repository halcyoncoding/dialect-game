import { createContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { createSocket } from '../socket';
import type { GameState, GameAction, GameContextValue } from '../types';
import type { Socket } from 'socket.io-client';

// ────────────────────── CONTEXT DEFINITION ────────────────────────

/** React Context for game state and dispatch functions. */
export const GameContext = createContext<GameContextValue | null>(null);

// ──────────────────── PROVIDER COMPONENT ──────────────────────────

interface GameProviderProps {
  children: ReactNode;
  sessionToken?: string;
}

/**
 * Provides game state and dispatch functions to all child components.
 * Manages the Socket.io connection lifecycle, listens for state updates,
 * and exposes undo/redo capabilities.
 *
 * @param children - Child React nodes
 * @param sessionToken - Optional session token for authentication
 *
 * @example
 * <GameProvider sessionToken="abc-123">
 *   <App />
 * </GameProvider>
 */
export const GameProvider = ({ children, sessionToken }: GameProviderProps) => {
  const [state, setState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // ── Socket Lifecycle ──────────────────────────────────────────

  useEffect(() => {
    const socket = createSocket(sessionToken);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Receive full state from server after every mutation
    socket.on('state:update', (newState: GameState) => {
      setState(newState);
    });

    // Handle errors from invalid actions
    socket.on('state:error', (data: { error: string }) => {
      console.warn('[State Error]', data.error);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionToken]);

  // ── Dispatch ──────────────────────────────────────────────────

  /** Sends a game action to the server for validation and application. */
  const dispatch = useCallback((action: GameAction) => {
    socketRef.current?.emit('action:dispatch', action);
  }, []);

  /** Requests the server to undo the last action. */
  const handleUndo = useCallback(() => {
    socketRef.current?.emit('action:undo');
  }, []);

  /** Requests the server to redo the last undone action. */
  const handleRedo = useCallback(() => {
    socketRef.current?.emit('action:redo');
  }, []);

  // ── Context Value ─────────────────────────────────────────────

  const value: GameContextValue = {
    state,
    dispatch,
    undo: handleUndo,
    redo: handleRedo,
    isConnected,
    playerId,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};
