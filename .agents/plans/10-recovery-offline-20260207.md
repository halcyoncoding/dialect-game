# Feature: Recovery & Offline Mode

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Implement the "Ironclad" recovery system: automatic localStorage saves on every state change, a "Panic Export" button for one-click JSON backup, restore from JSON upload, and a "Tabletop Mode" for single-screen play (screen-sharing or physical proximity). These features ensure the game can survive network failures, browser crashes, and device swaps without losing any state.

## User Story

As a Host
I want the system to automatically save the game state so that I can recover from any failure

As a Host
I want a "Panic Export" button that saves the current game state to a local JSON file

As a Host
I want a single-screen "Tabletop Mode" for when we are playing in person

## Problem Statement

Network connections fail. Browsers crash. Devices die. A multi-hour Dialect game represents significant creative investment — losing that state would be devastating. Additionally, some groups play in person around a single screen, which requires a different UI layout than the distributed P2P mode.

## Solution Statement

Implement three layers of state resilience: (1) automatic `localStorage` saves on the Host's browser after every state version change, (2) a manual "Panic Export" that downloads the full state as JSON, and (3) an "Import/Restore" function that uploads a JSON file to resume. Additionally, implement "Tabletop Mode" — a UI toggle that hides private hands behind click-to-reveal overlays and maximizes the Tableau for a single large screen.

## Feature Metadata

| Attribute | Value |
|-----------|-------|
| **Feature Type** | New Capability |
| **Complexity** | Medium |
| **Affected Systems** | Client (auto-save, export/import UI, tabletop layout), Server (state restore) |
| **Dependencies** | Feature #2 (State Engine — state object to save/restore) |

---

## CONTEXT REFERENCES

### Relevant Codebase Files

**IMPORTANT: Read these files before implementing!**

- `server/src/types.ts` - Why: GameState type (what gets saved/restored)
- `server/src/state.ts` - Why: State engine (restore function needed)
- `client/src/contexts/GameContext.tsx` - Why: State subscription for auto-save
- `dialect_prd.md` (lines 110-124) - Why: Panic Export user story
- `dialect_prd.md` (lines 255-269) - Why: Tabletop Mode user story (first instance)
- `dialect_prd.md` (lines 304-318) - Why: Tabletop Mode user story (second, detailed)
- `dialect_prd.md` (lines 288-302) - Why: Redo after Undo user story
- `dialect_prd.md` (lines 505-509) - Why: Zero Data Loss success metric

### New Files to Create

- `client/src/hooks/useAutoSave.ts` - localStorage auto-save hook
- `client/src/components/admin/RecoveryControls.tsx` - Export/Import UI for admin panel
- `client/src/components/admin/TabletopToggle.tsx` - Tabletop mode toggle
- `client/src/components/TabletopOverlay.tsx` - Click-to-reveal overlay for private info
- `server/src/handlers/recovery.ts` - Server-side state restore handler

### Patterns to Follow

**Auto-Save Pattern:**
```typescript
// useEffect that watches state.version
// On every version change, save full state to localStorage
// Key: 'dialect-state-{sessionId}'

useEffect(() => {
  if (state && isHost) {
    localStorage.setItem(
      `dialect-state-${state.session.id}`,
      JSON.stringify(state)
    );
  }
}, [state?.version]);
```

---

## IMPLEMENTATION PLAN

### Phase 1: Auto-Save

Implement automatic localStorage persistence on the Host's browser.

**Tasks:**
- Create auto-save hook that watches state version
- Save to localStorage with session-specific key
- Show "Saved" indicator in the UI
- Handle localStorage quota limits

### Phase 2: Export / Import

Create the manual backup and restore functionality.

**Tasks:**
- "Panic Export" button that downloads state as JSON
- "Restore" button that uploads JSON and replaces state
- File validation (correct structure, version compatibility)
- Server-side restore handler

### Phase 3: Tabletop Mode

Create the single-screen UI optimized for in-person play.

**Tasks:**
- Toggle in settings to enable Tabletop Mode
- Hide private hands behind click-to-reveal overlays
- Maximize Tableau and Dictionary
- Increase font sizes for distance readability
- Move admin controls to floating action button

---

## STEP-BY-STEP TASKS

**IMPORTANT:** Execute every task in order, top to bottom. Each task is atomic.

---

### CREATE `client/src/hooks/useAutoSave.ts` [parallel_group: 1]

- **IMPLEMENT**: Auto-save hook:
  - Watches `state.version` via useEffect
  - Only saves if the current user is the Host (no point saving on client)
  - Saves `JSON.stringify(state)` to `localStorage` with key `dialect-state-{sessionId}`
  - Debounced: waits 500ms of inactivity before saving (prevents thrashing during rapid actions)
  - Returns `{ lastSaved: Date | null, isSaving: boolean }`
  - On mount: checks if there's a saved state and offers to restore
  - Handles localStorage quota exceeded (try/catch, warn user)
- **GOTCHA**: localStorage has a ~5MB limit. Monitor state size. The 30-step history is on the server only, not in the client state, so this should be well within limits.
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `server/src/handlers/recovery.ts` [parallel_group: 1]

- **IMPLEMENT**: Server-side state restore:
  - `handleRestoreState(io, socket, stateJson)`:
    - Validate the sender is Host
    - Parse JSON
    - Validate structure matches GameState type (basic field checks)
    - Replace current globalState with restored state
    - Reset history (new history starts from restored state)
    - Broadcast restored state to all clients
    - Log: "State restored from backup"
  - `handleExportRequest(io, socket)`:
    - Return current state as JSON to requesting socket
    - Only Host can request export
- **VALIDATE**: `cd server && npx tsc --noEmit`

---

### UPDATE `server/src/handlers/connection.ts` [parallel_group: 2]

- **IMPLEMENT**: Wire recovery handlers:
  - On `recovery:restore` → `handleRestoreState`
  - On `recovery:export` → `handleExportRequest`
- **VALIDATE**: `cd server && npx tsc --noEmit`

---

### CREATE `client/src/components/admin/RecoveryControls.tsx` [parallel_group: 2]

- **IMPLEMENT**: Recovery controls in admin panel:
  - **Export Section:**
    - "Export Session Backup" button
    - On click: triggers state download as `dialect-backup-{date}.json`
    - Uses `URL.createObjectURL(blob)` + anchor download pattern
    - Visual confirmation: "Downloaded!" toast
  - **Restore Section:**
    - "Restore from Backup" file input (accepts .json)
    - On file select: parse JSON, show preview (session ID, age, player count, word count)
    - "Confirm Restore" button
    - Warning: "This will replace the current game state for all players"
  - **Auto-Save Indicator:**
    - "Last saved: {timestamp}" display
    - Green dot when recently saved
  - **localStorage Restore:**
    - "Restore from Last Auto-Save" button
    - Shows timestamp of last auto-save
- **GUIDES**: Oxide (red/warning) color for restore warning, Storm for neutral UI
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/admin/TabletopToggle.tsx` [parallel_group: 3]

- **IMPLEMENT**: Tabletop mode toggle component:
  - Toggle switch with label "Tabletop / Screenshare Mode"
  - On toggle: sets a `tabletopMode` flag in game state (or local-only state)
  - Description text: "Optimizes the UI for a single shared screen"
  - Lives in the admin panel settings section
- **IMPLEMENT**: Add `tabletopMode: boolean` to Session type (or keep it client-local via context)
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/TabletopOverlay.tsx` [parallel_group: 3]

- **IMPLEMENT**: Click-to-reveal overlay for private information:
  - Covers private hand contents with a "Click to Reveal" button
  - On click: shows the hand for 10 seconds, then re-hides
  - Timer indicator showing how long until auto-hide
  - Used in Tabletop Mode to replace PlayerHand
  - Also replaces Archetype reveals (click to peek, auto-hide)
  - Accessible: keyboard activated, aria-label "Reveal your hand"
- **VALIDATE**: `cd client && npx tsc -b`

---

### UPDATE `client/src/App.tsx` [parallel_group: 4]

- **IMPLEMENT**: Tabletop Mode layout adjustments:
  - When `tabletopMode` is true:
    - Increase base font size by 20% (CSS `font-size` on root)
    - PlayerHand replaced with `TabletopOverlay`
    - Tableau takes up more screen real estate
    - HostAdmin moves to a floating action button (FAB) in corner
    - Cards render at "large" size (240x336px)
  - When false: normal layout
- **IMPLEMENT**: Add `useAutoSave` hook call (Host only)
- **VALIDATE**: `npm run dev`, toggle tabletop mode, verify layout changes

---

### UPDATE `client/src/components/HostAdmin.tsx` [parallel_group: 4]

- **IMPLEMENT**: Add new sections:
  - "Recovery" tab with `RecoveryControls`
  - "Settings" tab with `TabletopToggle`
- **VALIDATE**: `cd client && npx tsc -b`

---

## TESTING STRATEGY

### Unit Tests

- Auto-save writes to localStorage on state change
- Auto-save debounces rapid changes
- State restore validates JSON structure
- Tabletop mode flag toggles correctly

### Integration Tests

- Change state → verify localStorage updated
- Export state → verify file downloads with correct content
- Import state → verify all clients update to restored state
- Toggle tabletop mode → verify layout changes
- Click-to-reveal → shows hand, auto-hides after timer

### Edge Cases

- localStorage full (graceful error, not crash)
- Import malformed JSON (show error, don't crash)
- Import state from different session (warn user, allow override)
- Restore while players are mid-action
- Tabletop mode on very small screens
- Browser crash → reopen → auto-restore prompt

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
- Start game, play a few turns
- Check localStorage in DevTools: `dialect-state-{id}` key exists
- Click "Export Session Backup", verify JSON file downloads
- Refresh page → verify auto-restore prompt appears
- Upload the exported JSON via "Restore from Backup"
- Toggle Tabletop Mode, verify layout changes:
  - Larger fonts
  - Click-to-reveal on private hands
  - Tableau maximized

---

## ACCEPTANCE CRITERIA

- [ ] State is auto-saved to localStorage on every version change (Host browser)
- [ ] "Panic Export" downloads full state as JSON file
- [ ] JSON file includes deck order, discard pile, player hands, dictionary, and aspect states
- [ ] "Restore from Backup" uploads JSON and resumes the game
- [ ] Offline Mode UI disables networking but enables local multi-view
- [ ] Tabletop Mode hides private hands behind click-to-reveal overlays
- [ ] Tabletop Mode increases font sizes by 20% for readability
- [ ] Admin controls move to floating action button in Tabletop Mode
- [ ] Cards are larger and optimized for TV/monitor viewing in Tabletop Mode
- [ ] Recovery from localStorage takes less than 10 seconds
- [ ] State restore broadcasts to all connected clients

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed
- [ ] All validation commands successful
- [ ] No linting or type errors
- [ ] Manual testing confirms recovery and tabletop features
- [ ] Code reviewed for quality

---

## NOTES

- **Auto-save frequency:** Every state version change, debounced by 500ms. This means rapid undo/redo won't thrash localStorage.
- **localStorage vs state.json:** The PRD mentions both localStorage and a `state.json` file. The localStorage approach is simpler and works in-browser. The `state.json` file backup would require server-side file writes. For MVP, localStorage + JSON export covers the requirements. Server-side file backup can be added later.
- **Tabletop Mode scope:** This is a UI-only change. The networking still works the same — it just changes how information is displayed. Good for screen-sharing on Zoom/Discord too.
- **Click-to-reveal timer:** 10 seconds is enough to glance at your hand but short enough that others can't memorize it. This is adjustable.
