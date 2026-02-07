// ─────────────────── CLIENT-SIDE TYPE DEFINITIONS ─────────────────
// Mirrors server/src/types.ts for client use.
// StateHistory and ActionResult are server-internal and excluded.

// ─────────────────────── SESSION METADATA ─────────────────────────

export interface Session {
  id: string;
  age: 1 | 2 | 3;
  turnIndex: number;
  backdrop: string | null;
  isolationSummary: string;
  isLocked: boolean;
  phase: 'lobby' | 'setup' | 'playing' | 'legacy' | 'ended';
  primarySoundSet: string | null;
}

// ─────────────────────── ROLE ASSIGNMENTS ─────────────────────────

export interface Roles {
  host: string;
  scribe: string | null;
}

// ──────────────────────── PLAYER INFO ─────────────────────────────

export interface Player {
  id: string;
  name: string;
  hand: string[];
  archetype: string | null;
  color: string;
  isConnected: boolean;
  socketId: string;
}

// ─────────────────────── PENDING PLAYER ───────────────────────────

export interface PendingPlayer {
  id: string;
  name: string;
  color: string;
  socketId: string;
  sessionId: string;
}

// ────────────────────── CARD DEFINITION ───────────────────────────

export interface Card {
  id: string;
  age: 1 | 2 | 3 | 'archetype';
  frontImage: string;
  backImage: string;
  connectionId: string | null;
}

// ──────────────────── DICTIONARY ENTRY ────────────────────────────

export interface DictionaryEntry {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  age: 1 | 2 | 3;
  aspectId: string | null;
  parentWordId: string | null;
  createdBy: string;
}

// ──────────────────────── ASPECT ──────────────────────────────────

export interface Aspect {
  id: string;
  name: string;
  evolution: string | null;
  ageEvolved: number | null;
  status: 'active' | 'faded';
}

// ─────────────────── CARD CONNECTION ──────────────────────────────

export interface CardConnection {
  cardId: string;
  aspectId: string;
  playerId: string;
  notes: string;
}

// ─────────────────── ACTION LOG ENTRY ─────────────────────────────

export interface ActionLogEntry {
  timestamp: number;
  description: string;
  playerId: string | null;
}

// ──────────────────── MASTER GAME STATE ───────────────────────────

export interface GameState {
  version: number;
  session: Session;
  roles: Roles;
  decks: {
    age1: string[];
    age2: string[];
    age3: string[];
    archetypes: string[];
    discard: string[];
  };
  cards: Record<string, Card>;
  players: Player[];
  pendingPlayers: PendingPlayer[];
  dictionary: DictionaryEntry[];
  aspects: Aspect[];
  connections: CardConnection[];
  actionLog: ActionLogEntry[];
}

// ────────────────────── GAME ACTIONS ──────────────────────────────

export type GameAction =
  | { type: 'DRAW_CARD'; playerId: string; deck: 'age1' | 'age2' | 'age3' | 'archetypes' }
  | { type: 'PLAY_CARD'; playerId: string; cardId: string; aspectId: string; notes: string }
  | { type: 'SAVE_WORD'; entry: Omit<DictionaryEntry, 'id'> }
  | { type: 'EVOLVE_WORD'; parentWordId: string; entry: Omit<DictionaryEntry, 'id' | 'parentWordId'> }
  | { type: 'SET_SCRIBE'; playerId: string }
  | { type: 'ADVANCE_AGE' }
  | { type: 'ADD_ASPECT'; name: string }
  | { type: 'EVOLVE_ASPECT'; aspectId: string; newName: string }
  | { type: 'FADE_ASPECT'; aspectId: string }
  | { type: 'NEXT_TURN' }
  | { type: 'SET_TURN'; turnIndex: number }
  | { type: 'LOCK_SESSION' }
  | { type: 'UNLOCK_SESSION' }
  | { type: 'UPDATE_ISOLATION'; text: string }
  | { type: 'DEAL_ARCHETYPES' }
  | { type: 'SET_BACKDROP'; backdropId: string }
  | { type: 'SET_SOUND_SET'; soundSetId: string }
  | { type: 'BEGIN_LEGACY' }
  | { type: 'END_GAME' }
  | { type: 'START_GAME' }
  | { type: 'PLAYER_JOIN_REQUEST'; name: string; color: string; sessionId: string; socketId: string }
  | { type: 'APPROVE_PLAYER'; playerId: string }
  | { type: 'REJECT_PLAYER'; playerId: string }
  | { type: 'PLAYER_DISCONNECT'; playerId: string }
  | { type: 'PLAYER_RECONNECT'; sessionId: string; socketId: string }
  | { type: 'REORDER_PLAYERS'; playerIds: string[] }
  | { type: 'FORCE_DRAW'; playerId: string; deck: string }
  | { type: 'RETURN_CARD_TO_DECK'; playerId: string; cardId: string; deck: string };

// ─────────────────── GAME CONTEXT VALUE ───────────────────────────

/** Shape of the value provided by GameContext to all consuming components. */
export interface GameContextValue {
  state: GameState | null;
  dispatch: (action: GameAction) => void;
  undo: () => void;
  redo: () => void;
  isConnected: boolean;
  playerId: string | null;
}
