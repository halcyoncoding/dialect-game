# Feature: Player Lobby & Networking

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Implement the player join flow, lobby UI, session management, and reconnection logic. Players navigate to the Host's IP address, enter a display name and choose a color avatar, then wait for Host approval. The Host can see all pending and connected players, lock the session, and manage the lobby. Reconnecting players are matched to their existing session via browser sessionID.

## User Story

As a Player
I want to join the game using a display name so that my private hand is correctly associated with my identity

As a Host
I want to manage who joins and lock the session once everyone is in

## Problem Statement

Dialect requires 3-5 players who all need to be in the same game session. Players connect via the Host's local IP, so the system needs a lobby where players identify themselves, the Host approves them, and the session can be locked to prevent uninvited guests. If a player's browser refreshes, they should reconnect seamlessly.

## Solution Statement

Create a lobby phase that is the first screen players see. The Host sees a lobby management view with player list, approve/reject controls, and a session lock toggle. Players enter their name, pick a color, and wait for approval. Session tokens and browser `sessionStorage` IDs enable secure reconnection. Once all players are in and the Host locks the session, the game transitions to the setup phase.

## Feature Metadata

| Attribute | Value |
|-----------|-------|
| **Feature Type** | New Capability |
| **Complexity** | Medium |
| **Affected Systems** | Server (lobby handlers, player management), Client (Lobby UI, connection flow) |
| **Dependencies** | Feature #1 (Scaffolding), Feature #2 (State Engine + Socket.io) |

---

## CONTEXT REFERENCES

### Relevant Codebase Files

**IMPORTANT: Read these files before implementing!**

- `server/src/types.ts` (from Feature #2) - Why: Player interface, Session interface (phase field)
- `server/src/state.ts` (from Feature #2) - Why: State engine for adding/removing players
- `server/src/handlers/connection.ts` (from Feature #2) - Why: Socket connection handler to extend
- `client/src/contexts/GameContext.tsx` (from Feature #2) - Why: Game state context
- `dialect_prd.md` (lines 369-383) - Why: Player join user story and acceptance criteria
- `dialect_prd.md` (lines 322-333) - Why: Session lock user story
- `.cursor/guides/brand_guide/user_interfaces/brand_guide_webapp.md` - Why: Form inputs, buttons, modals
- `.cursor/guides/ux_design/ux_guide_general.md` - Why: Input patterns, emphasis hierarchy

### New Files to Create

- `server/src/handlers/lobby.ts` - Lobby-specific socket event handlers
- `client/src/components/Lobby.tsx` - Main lobby view (split for Host vs Player)
- `client/src/components/JoinForm.tsx` - Name + color entry form
- `client/src/components/LobbyPlayerList.tsx` - Connected player list display
- `client/src/hooks/useSessionId.ts` - Browser sessionStorage ID management

### Patterns to Follow

**Component Structure:**
```tsx
// Each component file exports a single default component
// Props interfaces defined above the component
// Event handlers prefixed with "handle"
// Early returns for loading/error states

interface LobbyProps {
  // ...
}

const Lobby = ({ ... }: LobbyProps) => {
  // early returns
  // hooks
  // handlers
  // render
};

export default Lobby;
```

---

## IMPLEMENTATION PLAN

### Phase 1: Session ID & Join Flow (Server)

Add server-side handlers for player join requests, approval, and session management.

**Tasks:**
- Add `action:joinRequest` socket event handler
- Add `action:approvePlayer` and `action:rejectPlayer` for Host
- Add `action:lockSession` and `action:unlockSession`
- Handle reconnection via session ID matching

### Phase 2: Join Form (Client)

Create the form players see when they first connect — name input, color picker, submit.

**Tasks:**
- Create `JoinForm` component with name field and color selector
- Validate: no duplicate names, name not empty
- Store session ID in browser sessionStorage for reconnection
- Submit sends `action:joinRequest` via socket

### Phase 3: Lobby View (Client)

Create the lobby waiting room that both Host and Players see.

**Tasks:**
- Create `Lobby` component showing connected players
- Host view: approve/reject buttons, Lock Session toggle, Start Game button
- Player view: waiting for approval message, player list
- Real-time updates as players join/leave

### Phase 4: App Routing

Wire up the lobby as the first screen, transitioning to the game view when the session phase changes.

**Tasks:**
- Update `App.tsx` to route based on `session.phase`
- `lobby` phase → Lobby component
- `setup`/`playing`/`legacy` phases → Game component (placeholder for now)

---

## STEP-BY-STEP TASKS

**IMPORTANT:** Execute every task in order, top to bottom. Each task is atomic.

---

### ADD lobby actions to `server/src/types.ts` [parallel_group: 1]

- **IMPLEMENT**: Add new action types to `GameAction`:
  ```typescript
  | { type: 'PLAYER_JOIN_REQUEST'; name: string; color: string; sessionId: string }
  | { type: 'APPROVE_PLAYER'; playerId: string }
  | { type: 'REJECT_PLAYER'; playerId: string }
  | { type: 'PLAYER_DISCONNECT'; playerId: string }
  | { type: 'PLAYER_RECONNECT'; sessionId: string; socketId: string }
  ```
- **IMPLEMENT**: Add `pendingPlayers` array to `GameState` for players awaiting approval
- **VALIDATE**: `cd server && npx tsc --noEmit`

---

### UPDATE `server/src/state.ts` [parallel_group: 1]

- **IMPLEMENT**: Add action handlers in `applyAction` for:
  - `PLAYER_JOIN_REQUEST`: Add to `pendingPlayers`, validate name uniqueness
  - `APPROVE_PLAYER`: Move from `pendingPlayers` to `players`
  - `REJECT_PLAYER`: Remove from `pendingPlayers`
  - `PLAYER_DISCONNECT`: Set `player.isConnected = false`
  - `PLAYER_RECONNECT`: Match by sessionId, set `isConnected = true`
- **GOTCHA**: Duplicate name check must be case-insensitive
- **VALIDATE**: `cd server && npx tsc --noEmit`

---

### CREATE `server/src/handlers/lobby.ts` [parallel_group: 2]

- **IMPLEMENT**: Lobby-specific socket handlers:
  - `handleJoinRequest(io, socket, data)`: Validate name, create pending player, notify Host
  - `handleApprovePlayer(io, socket, playerId)`: Validate Host is sender, move player to active
  - `handleRejectPlayer(io, socket, playerId)`: Validate Host, remove pending player, notify rejected socket
  - `handleLockSession(io, socket)`: Set `session.isLocked = true`, reject future joins
  - `handleReconnect(io, socket, sessionId)`: Find player by sessionId, reassociate socket
- **GOTCHA**: When session is locked and a new connection attempts to join, send `session:locked` event with a "Session in Progress" message
- **VALIDATE**: `cd server && npx tsc --noEmit`

---

### UPDATE `server/src/handlers/connection.ts` [parallel_group: 2]

- **IMPLEMENT**: Wire lobby handlers into the connection handler:
  - On `lobby:joinRequest` → `handleJoinRequest`
  - On `lobby:approve` → `handleApprovePlayer`
  - On `lobby:reject` → `handleRejectPlayer`
  - On `lobby:lock` → `handleLockSession`
  - On `lobby:unlock` → `handleUnlockSession`
  - On `lobby:reconnect` → `handleReconnect`
- **VALIDATE**: `cd server && npx tsc --noEmit`

---

### CREATE `client/src/hooks/useSessionId.ts` [parallel_group: 3]

- **IMPLEMENT**: Hook that manages browser session identity:
  - Check `sessionStorage` for existing session ID
  - If none, generate a UUID and store it
  - Return `{ sessionId, clearSession }`
  - This enables reconnection after page refresh
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/JoinForm.tsx` [parallel_group: 3]

- **IMPLEMENT**: Join form component:
  - Text input for display name (required, max 20 chars)
  - Color picker with 8 preset color swatches (accessible, tabindex, aria-label)
  - Submit button: "Request to Join"
  - Validation: name not empty, name not taken (client-side check against current player list)
  - On submit: emit `lobby:joinRequest` with `{ name, color, sessionId }`
  - After submit: show "Waiting for Host approval..." state
- **GUIDES**: Storm focus rings on inputs, Orange CTA for submit button
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/LobbyPlayerList.tsx` [parallel_group: 3]

- **IMPLEMENT**: Player list component showing:
  - Player name with color avatar circle
  - Connection status indicator (green dot = connected)
  - For Host: Approve/Reject buttons next to pending players
  - Approved players shown with checkmark
- **GUIDES**: Use Inter font, Storm color palette for list items
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/Lobby.tsx` [parallel_group: 4]

- **IMPLEMENT**: Main lobby container:
  - If not yet joined: show `JoinForm`
  - If waiting for approval: show waiting message with spinner
  - If approved: show `LobbyPlayerList` with all connected players
  - **Host-specific UI:**
    - "Lock Session" toggle button
    - "Start Game" button (only enabled when 3+ players approved)
    - Pending players with approve/reject controls
  - **Player-specific UI:**
    - Player list (read-only)
    - "Waiting for Host to start..." message
  - Display Host's local IP address prominently (for sharing)
- **GUIDES**: brand_guide_webapp.md for card layout, modal patterns
- **VALIDATE**: `cd client && npx tsc -b`

---

### UPDATE `client/src/App.tsx` [parallel_group: 5]

- **IMPLEMENT**: Phase-based routing:
  - `session.phase === 'lobby'` → `<Lobby />`
  - `session.phase === 'setup'` or `'playing'` or `'legacy'` → `<div>Game View (Coming Soon)</div>`
  - No state yet (not connected) → Connection screen / loading
- **VALIDATE**: `npm run dev`, navigate to http://localhost:5173, see lobby or loading state

---

### UPDATE `client/src/types.ts` [parallel_group: 1]

- **IMPLEMENT**: Mirror the new action types and `pendingPlayers` field from server types
- **VALIDATE**: `cd client && npx tsc -b`

---

## TESTING STRATEGY

### Unit Tests

- Name uniqueness validation (case-insensitive)
- Session ID generation and storage
- Color picker selection state

### Integration Tests

- Player connects and sees JoinForm
- Player submits name, Host sees pending request
- Host approves, player moves to lobby list
- Host rejects, player sees rejection message
- Session lock prevents new joins
- Page refresh reconnects via sessionId

### Edge Cases

- Two players submit the same name simultaneously
- Host refreshes (should maintain Host status)
- Player joins after session is locked (rejected with message)
- All players disconnect (Host's state preserved)
- Very long player name (truncated at 20 chars)

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```powershell
cd server
npx tsc --noEmit
cd ../client
npx tsc -b
```

### Level 2: Full Stack
```powershell
npm run dev
```

### Level 3: Manual Validation
- Open http://localhost:5173 in two browser windows
- First window: see lobby as Host
- Second window: enter name, pick color, submit
- First window: see pending player, click Approve
- Both windows: see player in lobby list
- First window: toggle Lock Session
- Third window: attempt to join, see "Session in Progress" message

---

## ACCEPTANCE CRITERIA

- [x] Players can enter a display name and choose a color avatar
- [x] Host sees pending players and can approve or reject them
- [x] Duplicate names are prevented (case-insensitive)
- [x] Session can be locked/unlocked by Host
- [x] Locked sessions reject new join attempts with a message
- [x] Player names are persisted in `globalState.players`
- [x] Browser refresh reconnects via sessionStorage ID
- [x] App routes based on session phase (lobby → setup → playing)
- [x] UI follows Feather brand guide (Orange CTAs, Storm inputs, Inter/Poppins fonts)

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed
- [ ] All validation commands successful
- [ ] No linting or type errors
- [ ] Manual testing confirms join flow works end-to-end
- [ ] Code reviewed for quality

---

## NOTES

- **Host detection:** The first player to connect (or the one who launched the server) is automatically the Host. This is determined by the server checking if `roles.host` is unset.
- **Color palette:** Provide 8 distinct, accessible colors for player avatars. These should be visually distinguishable and work on both light and dark backgrounds.
- **Session persistence:** The `sessionStorage` ID survives page refreshes within the same tab but not across tabs. This is intentional — each tab is a separate "device."
- **Lobby to game transition:** When the Host clicks "Start Game," the server sets `session.phase = 'setup'` and broadcasts. All clients transition from Lobby to the game setup view.
