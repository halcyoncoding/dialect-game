# Feature: Master State Engine & Socket.io Backbone

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Implement the core state management system and real-time networking backbone for the Dialect Digital Tableau. This includes the Master State TypeScript types, the 30-step undo/redo history engine using `structuredClone()`, the Socket.io event handling system (server-side validation + broadcast), session token generation, and the client-side React context that receives and exposes state.

## User Story

As a Host
I want a reliable state management system with undo/redo and real-time sync
So that all players see the same game state and I can revert mistakes without breaking anything

## Problem Statement

Dialect is a collaborative storytelling game where state consistency is critical. If one player sees a different card or word than another, the narrative breaks. We need a system where the Host is the single source of truth, all mutations are validated server-side, and every client always has the latest state. Additionally, the Host needs the ability to undo mistakes (up to 30 steps) without causing de-syncs.

## Solution Statement

Implement a centralized `globalState` object on the server. Every state-mutating action from any client is sent to the server, validated, applied to the master state (with a `structuredClone` snapshot pushed to the history stack first), and then the full updated state is broadcast to all clients. The client-side React app receives state via Socket.io and stores it in a React Context. Session tokens prevent unauthorized access.

## Feature Metadata

| Attribute | Value |
|-----------|-------|
| **Feature Type** | New Capability |
| **Complexity** | High |
| **Affected Systems** | Server (state engine, socket handlers), Client (context, hooks) |
| **Dependencies** | Feature #1 (Scaffolding) — Express + Socket.io must be running |

---

## CONTEXT REFERENCES

### Relevant Codebase Files

**IMPORTANT: Read these files before implementing!**

- `server/src/index.ts` (from Feature #1) - Why: Socket.io already attached here; add event handlers
- `dialect_prd.md` (lines 418-472) - Why: Master State data model definition
- `dialect_prd.md` (lines 476-480) - Why: Networking logic — push model, failover, latency handling
- `.cursor/rules/universal/code-conventions.mdc` - Why: Naming patterns, error handling

### New Files to Create

- `server/src/types.ts` - Shared TypeScript type definitions for Master State
- `server/src/state.ts` - State engine (create, mutate, undo, redo, history)
- `server/src/handlers/connection.ts` - Socket.io connection handler with session tokens
- `client/src/types.ts` - Client-side type definitions (mirrored from server)
- `client/src/socket.ts` - Socket.io client connection manager
- `client/src/contexts/GameContext.tsx` - React context provider for game state
- `client/src/hooks/useGameState.ts` - Hook for consuming game state in components

### Relevant Documentation

- [Socket.io Server API](https://socket.io/docs/v4/server-api/) - Why: Event handling, rooms, namespaces
- [Socket.io Client API](https://socket.io/docs/v4/client-api/) - Why: Connection, reconnection, events
- [structuredClone MDN](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone) - Why: Deep clone for history snapshots

### Patterns to Follow

**State Mutation Pattern:**
```typescript
// Every mutation follows this pattern:
// 1. Validate the action
// 2. Push current state to history (structuredClone)
// 3. Apply the mutation
// 4. Increment version
// 5. Broadcast full state to all clients
```

**Socket Event Naming:**
```typescript
// Client → Server (actions/intents):
'action:drawCard', 'action:playCard', 'action:saveWord', etc.

// Server → Client (state updates):
'state:update' (full state broadcast)
'state:error' (validation failure message)

// System events:
'session:join', 'session:leave', 'session:reconnect'
```

---

## IMPLEMENTATION PLAN

### Phase 1: Type Definitions

Define the complete Master State TypeScript interfaces matching the PRD data model. These types are shared between server and client.

**Tasks:**
- Define `GameState`, `Session`, `Roles`, `Player`, `DictionaryEntry`, `Aspect`, `Connection`, `Card` interfaces
- Define `ActionType` union type for all possible state mutations
- Define `HistoryEntry` type for undo/redo stack

### Phase 2: State Engine (Server)

Implement the state management module with create, mutate, undo, redo, and history tracking.

**Tasks:**
- Create initial state factory function
- Implement `pushHistory()` using `structuredClone()`
- Implement `applyAction()` dispatcher
- Implement `undo()` and `redo()` with history pointer
- Cap history at 30 entries

### Phase 3: Socket.io Event Handling (Server)

Wire up Socket.io event handlers that validate actions, apply them via the state engine, and broadcast results.

**Tasks:**
- Generate session tokens on server start
- Validate session token on every socket connection
- Handle `action:*` events through the state engine
- Broadcast `state:update` after every mutation
- Handle `request:latestState` for reconnecting clients

### Phase 4: Client Socket & Context

Create the client-side Socket.io connection and React Context that makes game state available to all components.

**Tasks:**
- Create socket connection manager with auto-reconnect
- Create React Context with state and dispatch function
- Create `useGameState` hook for components
- Handle `state:update` events to update React state
- Handle connection/disconnection UI feedback

---

## STEP-BY-STEP TASKS

**IMPORTANT:** Execute every task in order, top to bottom. Each task is atomic.

---

### CREATE `server/src/types.ts` [parallel_group: 1]

- **IMPLEMENT**: Complete TypeScript interfaces for the Master State:

```typescript
// Session metadata
interface Session {
  id: string;
  age: 1 | 2 | 3;
  turnIndex: number;
  backdrop: string | null;
  isolationSummary: string;
  isLocked: boolean;
  phase: 'lobby' | 'setup' | 'playing' | 'legacy' | 'ended';
}

// Role assignments
interface Roles {
  host: string;       // PlayerID
  scribe: string | null; // PlayerID
}

// Player info
interface Player {
  id: string;
  name: string;
  hand: string[];     // CardID[]
  archetype: string | null; // CardID
  color: string;      // Hex color for avatar
  isConnected: boolean;
  sessionToken: string;
}

// Card definition
interface Card {
  id: string;
  age: 1 | 2 | 3 | 'archetype';
  frontImage: string;  // path to front image
  backImage: string;   // path to back image
  connectionId: string | null; // aspectId if played
}

// Dictionary entry
interface DictionaryEntry {
  id: string;
  word: string;
  ipa: string;
  meaning: string;
  age: 1 | 2 | 3;
  aspectId: string | null;
  parentWordId: string | null; // for variants/evolution
  createdBy: string;  // PlayerID
}

// Aspect on the tableau
interface Aspect {
  id: string;
  name: string;
  evolution: string | null;
  ageEvolved: number | null;
  status: 'active' | 'faded';
}

// Card-to-Aspect connection
interface CardConnection {
  cardId: string;
  aspectId: string;
  playerId: string;
  notes: string;
}

// The full Master State
interface GameState {
  version: number;
  session: Session;
  roles: Roles;
  decks: {
    age1: string[];    // CardID[]
    age2: string[];
    age3: string[];
    archetypes: string[];
    discard: string[];
  };
  cards: Record<string, Card>; // All cards by ID
  players: Player[];
  dictionary: DictionaryEntry[];
  aspects: Aspect[];
  connections: CardConnection[];
}

// Action types for state mutations
type GameAction =
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
  | { type: 'BEGIN_LEGACY' }
  | { type: 'END_GAME' };

// State history for undo/redo
interface StateHistory {
  past: GameState[];      // up to 30 entries
  future: GameState[];    // cleared on new action
}
```

- **GOTCHA**: Export all types. These will be copied/shared to client in a later step.
- **VALIDATE**: `cd server && npx tsc --noEmit`

---

### CREATE `client/src/types.ts` [parallel_group: 1]

- **IMPLEMENT**: Mirror the server types for client use. In a future iteration, these could be shared via a `shared/` package, but for now, maintain a copy.
- **GOTCHA**: Client types don't need `StateHistory` (that's server-internal). Include `GameState`, `GameAction`, `Player`, `Card`, `DictionaryEntry`, `Aspect`, `CardConnection`, `Session`, `Roles`.
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `server/src/state.ts` [parallel_group: 2]

- **IMPLEMENT**: State engine module with:
  - `createInitialState(): GameState` — factory for a fresh game state
  - `MAX_HISTORY = 30` constant
  - `stateHistory: StateHistory` — module-level history object
  - `pushHistory(state: GameState): void` — clone and push to past, clear future, cap at 30
  - `applyAction(state: GameState, action: GameAction): GameState` — dispatcher that validates and applies mutations. Returns new state reference.
  - `undo(): GameState | null` — pop from past, push current to future
  - `redo(): GameState | null` — pop from future, push current to past
  - `getState(): GameState` — returns current state
  - `getActionLog(): string[]` — returns last N action descriptions for the UI log
- **PATTERN**: Use `structuredClone()` for deep cloning (Node.js 17+ built-in)
- **GOTCHA**: `applyAction` must validate before mutating. E.g., can't draw from empty deck, can't play card not in hand. Return error string on invalid actions.
- **GOTCHA**: History stores full state snapshots (not diffs) per PRD. Monitor memory but it should be fine for a turn-based game.
- **VALIDATE**: `cd server && npx tsc --noEmit`

---

### CREATE `server/src/handlers/connection.ts` [parallel_group: 3]

- **IMPLEMENT**: Socket.io connection handler:
  - `generateSessionToken(): string` — UUID-based session token
  - `handleConnection(io: Server, socket: Socket): void`:
    - Validate session token from handshake auth
    - On `action:dispatch` — validate action, push history, apply, broadcast `state:update`
    - On `request:latestState` — send current state to requesting socket
    - On `action:undo` — call undo(), broadcast if successful
    - On `action:redo` — call redo(), broadcast if successful
    - On `disconnect` — mark player as disconnected in state, broadcast
  - `broadcastState(io: Server, state: GameState): void` — emits full state to all connected clients
  - Private hand filtering: when broadcasting, each client receives the full state BUT other players' hands are replaced with card counts (not card IDs) for privacy
- **IMPORTS**: `Server, Socket` from `socket.io`, state engine functions from `../state`
- **GOTCHA**: The Host can see all hands (admin view). Other players only see their own hand + card counts for others.
- **VALIDATE**: `cd server && npx tsc --noEmit`

---

### UPDATE `server/src/index.ts` [parallel_group: 3]

- **IMPLEMENT**: Wire up the connection handler:
  - Import `handleConnection` from `./handlers/connection`
  - On `io.on('connection', ...)` call `handleConnection(io, socket)`
  - Generate and log the session token at startup
  - Add `/api/session` endpoint that returns the session token (Host only, secured by origin check)
- **VALIDATE**: Server starts and accepts socket connections

---

### CREATE `client/src/socket.ts` [parallel_group: 4]

- **IMPLEMENT**: Socket.io client connection manager:
  - `createSocket(sessionToken: string): Socket` — creates and returns socket instance
  - Connects to server with `auth: { token: sessionToken }`
  - Configures auto-reconnect (30 second timeout per PRD)
  - Exports socket instance and connection status
  - Emits `request:latestState` on reconnection
- **IMPORTS**: `io` from `socket.io-client`
- **GOTCHA**: In dev mode, socket connects to the Vite proxy (same origin). In production, connects to Express directly.
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/contexts/GameContext.tsx` [parallel_group: 4]

- **IMPLEMENT**: React Context provider:
  - `GameContext` with `state: GameState | null`, `dispatch: (action: GameAction) => void`, `isConnected: boolean`, `playerId: string | null`
  - `GameProvider` component that:
    - Manages socket connection lifecycle
    - Listens for `state:update` events and updates React state
    - Provides `dispatch` function that emits `action:dispatch` to server
    - Tracks connection status
    - Provides undo/redo functions that emit `action:undo` / `action:redo`
- **IMPORTS**: React context/provider, socket module, types
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/hooks/useGameState.ts` [parallel_group: 4]

- **IMPLEMENT**: Convenience hook:
  - `useGameState()` — returns full context (state, dispatch, isConnected, playerId)
  - `usePlayer()` — returns the current player object from state
  - `useIsHost()` — returns boolean if current player is Host
  - `useIsScribe()` — returns boolean if current player is Scribe
  - Throws helpful error if used outside `GameProvider`
- **VALIDATE**: `cd client && npx tsc -b`

---

### UPDATE `client/src/App.tsx` [parallel_group: 5]

- **IMPLEMENT**: Wrap the app in `GameProvider`. Show connection status. Display minimal state debug info (version number, player count) to confirm the pipeline works end-to-end.
- **VALIDATE**: `npm run dev`, open browser, see connection status and state version

---

## TESTING STRATEGY

### Unit Tests

- State engine: `createInitialState()` returns valid state
- State engine: `applyAction()` with valid actions returns updated state
- State engine: `applyAction()` with invalid actions returns error
- State engine: `undo()` restores previous state, `redo()` restores undone state
- State engine: History caps at 30 entries

### Integration Tests

- Client connects to server via Socket.io
- Client receives state on connection
- Client dispatches action, receives updated state
- Two clients see same state after action
- Undo broadcasts reverted state to all clients

### Edge Cases

- Undo when history is empty (should no-op)
- Redo when future is empty (should no-op)
- New action after undo clears redo stack
- 31st action drops oldest history entry
- Client reconnects and gets latest state
- Invalid session token rejected

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```powershell
cd server
npx tsc --noEmit
cd ../client
npx tsc -b
```

### Level 2: Server Starts
```powershell
cd server
npx tsx src/index.ts
# Should log session token and listen address
```

### Level 3: Full Stack
```powershell
npm run dev
# Open http://localhost:5173
# Should see "Connected" status and state version 0
```

### Level 4: Manual Validation
- Open two browser tabs to http://localhost:5173
- Both should show connected status
- DevTools console: no errors, no failed socket connections

---

## ACCEPTANCE CRITERIA

- [ ] `GameState` type matches PRD data model (Section 5)
- [ ] State engine creates valid initial state
- [ ] `applyAction` validates before mutating
- [ ] History maintains up to 30 `structuredClone` snapshots
- [ ] Undo restores previous state and broadcasts to all clients
- [ ] Redo restores undone state (cleared on new action)
- [ ] Socket.io connection requires valid session token
- [ ] Server broadcasts full state after every mutation
- [ ] Client receives state updates and renders via React Context
- [ ] Player hands are private (other players see card counts only)
- [ ] Reconnecting client receives latest state
- [ ] TypeScript compiles without errors on both server and client

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed
- [ ] All validation commands successful
- [ ] No linting or type errors
- [ ] Manual testing confirms socket connection and state sync
- [ ] Code reviewed for quality

---

## NOTES

- **No optimistic UI:** The PRD explicitly disables optimistic updates. All state changes wait for server validation and broadcast. This is correct for a turn-based narrative game where consistency matters more than speed.
- **Full state broadcast:** The PRD specifies broadcasting the entire state object (not diffs). This is acceptable because the state for a Dialect game is small (dozens of cards, a few players, a dictionary of maybe 50-100 words).
- **Privacy filtering:** The broadcast function must strip other players' hand contents. The Host sees everything. This is per the PRD's "Host retains Super-Admin rights" requirement.
- **structuredClone:** Available in Node.js 17+ and all modern browsers. No polyfill needed.
