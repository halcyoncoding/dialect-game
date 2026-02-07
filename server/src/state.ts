import { v4 as uuidv4 } from 'uuid';
import type {
  GameState,
  GameAction,
  StateHistory,
  ActionResult,
  ActionLogEntry,
} from './types.js';

// ─────────────────────────── CONSTANTS ───────────────────────────

/** Maximum number of undo snapshots kept in history. */
const MAX_HISTORY = 30;

// ────────────────────── MODULE-LEVEL STATE ────────────────────────

let globalState: GameState = createInitialState();

const history: StateHistory = {
  past: [],
  future: [],
};

// ──────────────────── INITIAL STATE FACTORY ───────────────────────

/**
 * Creates a fresh GameState with default values for a new session.
 *
 * @returns A new GameState object ready for a lobby phase
 */
export function createInitialState(): GameState {
  return {
    version: 0,
    session: {
      id: uuidv4(),
      age: 1,
      turnIndex: 0,
      backdrop: null,
      isolationSummary: '',
      isLocked: false,
      phase: 'lobby',
      primarySoundSet: null,
    },
    roles: {
      host: '',
      scribe: null,
    },
    decks: {
      age1: [],
      age2: [],
      age3: [],
      archetypes: [],
      discard: [],
    },
    cards: {},
    players: [],
    pendingPlayers: [],
    dictionary: [],
    aspects: [],
    connections: [],
    actionLog: [],
  };
}

// ──────────────────── HISTORY MANAGEMENT ──────────────────────────

/**
 * Pushes a deep clone of the current state onto the undo stack.
 * Clears the redo stack (future) since a new action invalidates it.
 * Caps the history at MAX_HISTORY entries.
 */
function pushHistory(): void {
  history.past.push(structuredClone(globalState));

  // Cap at MAX_HISTORY
  if (history.past.length > MAX_HISTORY) {
    history.past.shift();
  }

  // New action clears redo path
  history.future = [];
}

/**
 * Undoes the last action by restoring the previous state from history.
 *
 * @returns The restored state, or null if there is nothing to undo
 */
export function undo(): GameState | null {
  const previous = history.past.pop();
  if (!previous) return null;

  // Save current state for potential redo
  history.future.push(structuredClone(globalState));
  globalState = previous;

  return globalState;
}

/**
 * Redoes the last undone action by restoring from the future stack.
 *
 * @returns The restored state, or null if there is nothing to redo
 */
export function redo(): GameState | null {
  const next = history.future.pop();
  if (!next) return null;

  // Save current state for potential re-undo
  history.past.push(structuredClone(globalState));
  globalState = next;

  return globalState;
}

// ──────────────────── STATE ACCESSORS ─────────────────────────────

/** Returns the current global game state. */
export function getState(): GameState {
  return globalState;
}

/** Replaces the current state entirely (used for restore from backup). */
export function restoreState(state: GameState): void {
  globalState = state;
  history.past = [];
  history.future = [];
}

// ──────────────────── ACTION LOG ──────────────────────────────────

const MAX_LOG_ENTRIES = 20;

/**
 * Adds an entry to the action log, capping at MAX_LOG_ENTRIES.
 */
function logAction(description: string, playerId: string | null): void {
  const entry: ActionLogEntry = {
    timestamp: Date.now(),
    description,
    playerId,
  };

  globalState.actionLog.unshift(entry);

  if (globalState.actionLog.length > MAX_LOG_ENTRIES) {
    globalState.actionLog.pop();
  }
}

// ──────────────────── ACTION DISPATCHER ───────────────────────────

/**
 * Validates and applies a game action to the global state.
 * Pushes a history snapshot before mutation for undo support.
 * Increments the state version on success.
 *
 * @param action - The action to apply
 * @returns ActionResult indicating success (with new state) or failure (with error message)
 */
export function applyAction(action: GameAction): ActionResult {
  // Snapshot for undo before any mutation
  pushHistory();

  try {
    const result = processAction(globalState, action);

    if (!result.ok) {
      // Revert the history push since we didn't actually change state
      history.past.pop();
      return result;
    }

    // Increment version
    globalState.version += 1;

    // Log the action
    logAction(result.description, getActionPlayerId(action));

    return { ok: true, state: globalState, description: result.description };
  } catch (err) {
    // Revert history push on unexpected error
    history.past.pop();
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { ok: false, error: message };
  }
}

// ──────────────────── ACTION PLAYER ID ────────────────────────────

/** Extracts the playerId from an action if available. */
function getActionPlayerId(action: GameAction): string | null {
  if ('playerId' in action && typeof action.playerId === 'string') {
    return action.playerId;
  }
  return null;
}

// ──────────────────── ACTION PROCESSOR ────────────────────────────

/**
 * Processes a single action against the state. Mutates globalState directly.
 * Returns a result with a description on success or an error message on failure.
 */
function processAction(
  state: GameState,
  action: GameAction
): { ok: true; description: string } | { ok: false; error: string } {

  switch (action.type) {

    // ── Session & Lobby ──────────────────────────────────────────

    case 'LOCK_SESSION': {
      state.session.isLocked = true;
      return { ok: true, description: 'Session locked' };
    }

    case 'UNLOCK_SESSION': {
      state.session.isLocked = false;
      return { ok: true, description: 'Session unlocked' };
    }

    case 'UPDATE_ISOLATION': {
      state.session.isolationSummary = action.text;
      return { ok: true, description: 'Isolation summary updated' };
    }

    case 'SET_BACKDROP': {
      state.session.backdrop = action.backdropId;
      return { ok: true, description: `Backdrop set to ${action.backdropId}` };
    }

    case 'SET_SOUND_SET': {
      state.session.primarySoundSet = action.soundSetId;
      return { ok: true, description: `Sound set selected: ${action.soundSetId}` };
    }

    case 'START_GAME': {
      if (state.session.phase !== 'setup') {
        return { ok: false, error: 'Can only start game from setup phase' };
      }
      state.session.phase = 'playing';
      return { ok: true, description: 'Game started' };
    }

    // ── Player Management ────────────────────────────────────────

    case 'PLAYER_JOIN_REQUEST': {
      // Check for duplicate names (case-insensitive)
      const nameLower = action.name.toLowerCase();
      const nameExists = state.players.some(
        (p) => p.name.toLowerCase() === nameLower
      ) || state.pendingPlayers.some(
        (p) => p.name.toLowerCase() === nameLower
      );

      if (nameExists) {
        return { ok: false, error: 'A player with that name already exists' };
      }

      if (state.session.isLocked) {
        return { ok: false, error: 'Session is locked — no new players can join' };
      }

      state.pendingPlayers.push({
        id: uuidv4(),
        name: action.name,
        color: action.color,
        socketId: action.socketId,
        sessionId: action.sessionId,
      });

      return { ok: true, description: `${action.name} requested to join` };
    }

    case 'APPROVE_PLAYER': {
      const pendingIdx = state.pendingPlayers.findIndex(
        (p) => p.id === action.playerId
      );
      if (pendingIdx === -1) {
        return { ok: false, error: 'Pending player not found' };
      }

      const pending = state.pendingPlayers[pendingIdx];
      state.pendingPlayers.splice(pendingIdx, 1);

      state.players.push({
        id: pending.id,
        name: pending.name,
        hand: [],
        archetype: null,
        color: pending.color,
        isConnected: true,
        socketId: pending.socketId,
      });

      // First approved player becomes Host if no Host set
      if (!state.roles.host) {
        state.roles.host = pending.id;
      }

      return { ok: true, description: `${pending.name} approved` };
    }

    case 'REJECT_PLAYER': {
      const rejectIdx = state.pendingPlayers.findIndex(
        (p) => p.id === action.playerId
      );
      if (rejectIdx === -1) {
        return { ok: false, error: 'Pending player not found' };
      }

      const rejected = state.pendingPlayers[rejectIdx];
      state.pendingPlayers.splice(rejectIdx, 1);
      return { ok: true, description: `${rejected.name} rejected` };
    }

    case 'PLAYER_DISCONNECT': {
      const disconnecting = state.players.find(
        (p) => p.id === action.playerId
      );
      if (disconnecting) {
        disconnecting.isConnected = false;
        return { ok: true, description: `${disconnecting.name} disconnected` };
      }
      return { ok: false, error: 'Player not found' };
    }

    case 'PLAYER_RECONNECT': {
      const reconnecting = state.players.find(
        (p) => p.socketId === action.sessionId || p.id === action.sessionId
      );
      if (reconnecting) {
        reconnecting.isConnected = true;
        reconnecting.socketId = action.socketId;
        return { ok: true, description: `${reconnecting.name} reconnected` };
      }
      return { ok: false, error: 'Player not found for reconnection' };
    }

    case 'REORDER_PLAYERS': {
      const reordered: typeof state.players = [];
      for (const pid of action.playerIds) {
        const player = state.players.find((p) => p.id === pid);
        if (player) reordered.push(player);
      }
      state.players = reordered;
      return { ok: true, description: 'Player order updated' };
    }

    // ── Roles ────────────────────────────────────────────────────

    case 'SET_SCRIBE': {
      const scribePlayer = state.players.find(
        (p) => p.id === action.playerId
      );
      if (!scribePlayer) {
        return { ok: false, error: 'Player not found' };
      }
      state.roles.scribe = action.playerId;
      return { ok: true, description: `${scribePlayer.name} is now Scribe` };
    }

    // ── Card Operations ──────────────────────────────────────────

    case 'DRAW_CARD': {
      const deckKey = action.deck as keyof typeof state.decks;
      const deck = state.decks[deckKey];
      if (!deck || deck.length === 0) {
        return { ok: false, error: `Deck ${action.deck} is empty` };
      }

      const player = state.players.find((p) => p.id === action.playerId);
      if (!player) {
        return { ok: false, error: 'Player not found' };
      }

      const cardId = deck.shift()!;
      player.hand.push(cardId);
      return { ok: true, description: `${player.name} drew a card from ${action.deck}` };
    }

    case 'FORCE_DRAW': {
      const forceDeck = state.decks[action.deck as keyof typeof state.decks];
      if (!forceDeck || forceDeck.length === 0) {
        return { ok: false, error: `Deck ${action.deck} is empty` };
      }

      const forcePlayer = state.players.find((p) => p.id === action.playerId);
      if (!forcePlayer) {
        return { ok: false, error: 'Player not found' };
      }

      const forceCardId = forceDeck.shift()!;
      forcePlayer.hand.push(forceCardId);
      return { ok: true, description: `Host drew a card for ${forcePlayer.name}` };
    }

    case 'PLAY_CARD': {
      const playPlayer = state.players.find(
        (p) => p.id === action.playerId
      );
      if (!playPlayer) {
        return { ok: false, error: 'Player not found' };
      }

      const cardIdx = playPlayer.hand.indexOf(action.cardId);
      if (cardIdx === -1) {
        return { ok: false, error: 'Card not in player hand' };
      }

      const aspect = state.aspects.find((a) => a.id === action.aspectId);
      if (!aspect) {
        return { ok: false, error: 'Aspect not found' };
      }

      // Remove from hand
      playPlayer.hand.splice(cardIdx, 1);

      // Update card connection
      const card = state.cards[action.cardId];
      if (card) {
        card.connectionId = action.aspectId;
      }

      // Add connection record
      state.connections.push({
        cardId: action.cardId,
        aspectId: action.aspectId,
        playerId: action.playerId,
        notes: action.notes,
      });

      return { ok: true, description: `${playPlayer.name} played a card to ${aspect.name}` };
    }

    case 'RETURN_CARD_TO_DECK': {
      const returnPlayer = state.players.find(
        (p) => p.id === action.playerId
      );
      if (!returnPlayer) {
        return { ok: false, error: 'Player not found' };
      }

      const returnIdx = returnPlayer.hand.indexOf(action.cardId);
      if (returnIdx === -1) {
        return { ok: false, error: 'Card not in player hand' };
      }

      returnPlayer.hand.splice(returnIdx, 1);
      const returnDeck = state.decks[action.deck as keyof typeof state.decks];
      if (returnDeck) {
        returnDeck.unshift(action.cardId);
      }

      return { ok: true, description: `Card returned to ${action.deck}` };
    }

    case 'DEAL_ARCHETYPES': {
      if (state.decks.archetypes.length === 0) {
        return { ok: false, error: 'No archetype cards to deal' };
      }

      for (const player of state.players) {
        if (state.decks.archetypes.length === 0) break;
        const archId = state.decks.archetypes.shift()!;
        player.archetype = archId;
      }

      return { ok: true, description: 'Archetypes dealt to all players' };
    }

    // ── Aspects ──────────────────────────────────────────────────

    case 'ADD_ASPECT': {
      if (state.aspects.length >= 4) {
        return { ok: false, error: 'Maximum 4 aspects allowed' };
      }

      state.aspects.push({
        id: uuidv4(),
        name: action.name,
        evolution: null,
        ageEvolved: null,
        status: 'active',
      });

      return { ok: true, description: `Aspect "${action.name}" added` };
    }

    case 'EVOLVE_ASPECT': {
      const evolveAspect = state.aspects.find(
        (a) => a.id === action.aspectId
      );
      if (!evolveAspect) {
        return { ok: false, error: 'Aspect not found' };
      }

      evolveAspect.evolution = action.newName;
      evolveAspect.ageEvolved = state.session.age;
      return { ok: true, description: `Aspect evolved to "${action.newName}"` };
    }

    case 'FADE_ASPECT': {
      const fadeAspect = state.aspects.find(
        (a) => a.id === action.aspectId
      );
      if (!fadeAspect) {
        return { ok: false, error: 'Aspect not found' };
      }

      fadeAspect.status = 'faded';
      return { ok: true, description: `Aspect "${fadeAspect.name}" faded` };
    }

    // ── Dictionary ───────────────────────────────────────────────

    case 'SAVE_WORD': {
      state.dictionary.push({
        ...action.entry,
        id: uuidv4(),
      });
      return { ok: true, description: `Word "${action.entry.word}" added to dictionary` };
    }

    case 'EVOLVE_WORD': {
      const parent = state.dictionary.find(
        (d) => d.id === action.parentWordId
      );
      if (!parent) {
        return { ok: false, error: 'Parent word not found' };
      }

      state.dictionary.push({
        ...action.entry,
        id: uuidv4(),
        parentWordId: action.parentWordId,
      });

      return { ok: true, description: `Word variant of "${parent.word}" added` };
    }

    // ── Game Flow ────────────────────────────────────────────────

    case 'NEXT_TURN': {
      if (state.players.length === 0) {
        return { ok: false, error: 'No players in game' };
      }

      // Advance turn, skipping disconnected players
      let nextIdx = (state.session.turnIndex + 1) % state.players.length;
      let attempts = 0;

      while (!state.players[nextIdx].isConnected && attempts < state.players.length) {
        nextIdx = (nextIdx + 1) % state.players.length;
        attempts++;
      }

      state.session.turnIndex = nextIdx;
      return { ok: true, description: `Turn passed to ${state.players[nextIdx].name}` };
    }

    case 'SET_TURN': {
      if (action.turnIndex < 0 || action.turnIndex >= state.players.length) {
        return { ok: false, error: 'Invalid turn index' };
      }
      state.session.turnIndex = action.turnIndex;
      return { ok: true, description: `Turn set to ${state.players[action.turnIndex].name}` };
    }

    case 'ADVANCE_AGE': {
      if (state.session.age >= 3) {
        return { ok: false, error: 'Already at Age 3 — use BEGIN_LEGACY to continue' };
      }

      const newAge = (state.session.age + 1) as 1 | 2 | 3;
      state.session.age = newAge;
      return { ok: true, description: `Advanced to Age ${newAge}` };
    }

    case 'BEGIN_LEGACY': {
      if (state.session.age !== 3) {
        return { ok: false, error: 'Legacy Phase can only begin after Age 3' };
      }
      state.session.phase = 'legacy';
      return { ok: true, description: 'Legacy Phase has begun' };
    }

    case 'END_GAME': {
      state.session.phase = 'ended';
      return { ok: true, description: 'Game ended' };
    }

    default: {
      return { ok: false, error: `Unknown action type: ${(action as GameAction).type}` };
    }
  }
}
