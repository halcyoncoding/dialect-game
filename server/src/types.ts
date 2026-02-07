// ─────────────────────── SESSION METADATA ─────────────────────────

/** Tracks the current game session state, phase, and configuration. */
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

/** Maps special roles to player IDs. */
export interface Roles {
  host: string;
  scribe: string | null;
}

// ──────────────────────── PLAYER INFO ─────────────────────────────

/** A player in the game session. */
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

/** A player awaiting Host approval in the lobby. */
export interface PendingPlayer {
  id: string;
  name: string;
  color: string;
  socketId: string;
  sessionId: string;
}

// ────────────────────── CARD DEFINITION ───────────────────────────

/** A single game card with front/back images and connection state. */
export interface Card {
  id: string;
  age: 1 | 2 | 3 | 'archetype';
  frontImage: string;
  backImage: string;
  connectionId: string | null;
}

// ──────────────────── DICTIONARY ENTRY ────────────────────────────

/** A word in the Dialect dictionary. */
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

/** An Aspect on the tableau — a shared narrative concept. */
export interface Aspect {
  id: string;
  name: string;
  evolution: string | null;
  ageEvolved: number | null;
  status: 'active' | 'faded';
}

// ─────────────────── CARD CONNECTION ──────────────────────────────

/** Links a played card to an Aspect with narrative justification. */
export interface CardConnection {
  cardId: string;
  aspectId: string;
  playerId: string;
  notes: string;
}

// ─────────────────── ACTION LOG ENTRY ─────────────────────────────

/** A logged action for the Host's action history. */
export interface ActionLogEntry {
  timestamp: number;
  description: string;
  playerId: string | null;
}

// ──────────────────── MASTER GAME STATE ───────────────────────────

/** The singular source of truth for the entire game. */
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

/** All possible state-mutating actions dispatched through the state engine. */
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

// ─────────────────── STATE HISTORY ────────────────────────────────

/** Tracks undo/redo history for the state engine. Server-internal only. */
export interface StateHistory {
  past: GameState[];
  future: GameState[];
}

// ──────────────── ACTION RESULT ───────────────────────────────────

/** Result of applying an action — either success with new state or error. */
export type ActionResult =
  | { ok: true; state: GameState; description: string }
  | { ok: false; error: string };
