# Feature: Tableau & Card Interaction

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Build the central Tableau — the shared game board where cards are played to Aspects. Players drag cards from their private hand onto Aspect slots, triggering a reveal event across all clients. Cards are grouped by Aspect, connections are tracked in state, and the Isolation/Backdrop summary is always visible as a tooltip. This is the visual heart of the game.

## User Story

As a Player
I want to play a card face-up to an Aspect so that the group can see the concept I am using for my turn

As a Player
I want to see a tooltip reminder of our Isolation and Aspects at all times so I stay grounded in the narrative

## Problem Statement

Dialect's gameplay revolves around playing cards to Aspects — shared narrative concepts that the language evolves around. The physical game uses a central table for this. The digital version needs an equivalent: a shared visual space where cards appear, grouped by Aspect, visible to everyone simultaneously, with smooth interactions that don't break the narrative flow.

## Solution Statement

Create a `Tableau` component that displays 3 Aspect columns (plus a 4th if needed). Each Aspect column shows its name, connected cards, and an "evolution" indicator for later Ages. Players can drag a card from their `PlayerHand` onto an Aspect, which triggers a socket event that the server validates, applies, and broadcasts. The card animates into position. A persistent header/tooltip shows the Isolation summary and current Aspect states.

## Feature Metadata

| Attribute | Value |
|-----------|-------|
| **Feature Type** | New Capability |
| **Complexity** | High |
| **Affected Systems** | Client (Tableau, drag-drop, animations), Server (connection tracking, card play validation) |
| **Dependencies** | Feature #5 (Deck Engine — cards in hand), Feature #6 (Host Admin — for aspect management) |

---

## CONTEXT REFERENCES

### Relevant Codebase Files

**IMPORTANT: Read these files before implementing!**

- `server/src/types.ts` - Why: Aspect, CardConnection, GameAction types
- `server/src/state.ts` - Why: PLAY_CARD action handling
- `client/src/components/PlayerHand.tsx` (from Feature #5) - Why: Source of draggable cards
- `client/src/components/CardDisplay.tsx` (from Feature #5) - Why: Card rendering component
- `dialect_prd.md` (lines 94-108) - Why: Card play to Aspect user story
- `dialect_prd.md` (lines 334-349) - Why: Card-to-Aspect connection user story
- `dialect_prd.md` (lines 160-173) - Why: Isolation/Aspect tooltip user story
- `.cursor/guides/brand_guide/user_interfaces/brand_guide_webapp.md` - Why: Card layout, colors, spacing
- `.cursor/guides/ux_design/ux_guide_general.md` - Why: Drag interaction patterns

### New Files to Create

- `client/src/components/Tableau.tsx` - Main tableau board component
- `client/src/components/AspectColumn.tsx` - Individual Aspect column with cards
- `client/src/components/AspectHeader.tsx` - Aspect name/evolution display
- `client/src/components/IsolationBanner.tsx` - Persistent Isolation/Backdrop summary
- `client/src/components/CardDropZone.tsx` - Drop target for card play
- `client/src/hooks/useDragDrop.ts` - Custom drag-and-drop hook

### Patterns to Follow

**Drag-and-Drop Pattern (HTML5 DnD API):**
```typescript
// Use native HTML5 drag and drop for broad compatibility
// Drag source: PlayerHand cards
// Drop target: AspectColumn drop zones
// Data transfer: cardId via dataTransfer.setData

const handleDragStart = (e: DragEvent, cardId: string) => {
  e.dataTransfer?.setData('text/plain', cardId);
};

const handleDrop = (e: DragEvent, aspectId: string) => {
  const cardId = e.dataTransfer?.getData('text/plain');
  dispatch({ type: 'PLAY_CARD', playerId, cardId, aspectId, notes: '' });
};
```

---

## IMPLEMENTATION PLAN

### Phase 1: Aspect Management (Server)

Add Aspect CRUD operations to the state engine.

**Tasks:**
- `ADD_ASPECT` action handler
- `EVOLVE_ASPECT` action handler (for Age transitions)
- `FADE_ASPECT` action handler (for Age 3 declining Aspects)
- Initialize 3 default Aspects in game setup

### Phase 2: Tableau Layout (Client)

Build the static layout: Aspect columns, headers, and Isolation banner.

**Tasks:**
- Create Tableau grid layout (3+ columns)
- Create Aspect column with header and card list
- Create Isolation banner with editable summary text

### Phase 3: Drag & Drop Interaction

Implement the card drag-from-hand to drop-on-Aspect flow.

**Tasks:**
- Make PlayerHand cards draggable
- Create drop zones on Aspect columns
- Wire up the PLAY_CARD dispatch on drop
- Handle the "which Aspect?" prompt if needed

### Phase 4: Animations & Polish

Add reveal animations and visual feedback for card play.

**Tasks:**
- Card reveal animation (flip from back to front)
- Card slide animation into Aspect column
- Visual highlight on active drop zone during drag

---

## STEP-BY-STEP TASKS

**IMPORTANT:** Execute every task in order, top to bottom. Each task is atomic.

---

### UPDATE `server/src/state.ts` [parallel_group: 1]

- **IMPLEMENT**: Add/update action handlers:
  - `ADD_ASPECT`: Create new Aspect with unique ID, add to `aspects` array. Validate max 4 aspects.
  - `EVOLVE_ASPECT`: Update `aspect.evolution` and `aspect.ageEvolved`. Validate aspect exists.
  - `FADE_ASPECT`: Set `aspect.status = 'faded'`. Validate aspect exists.
  - `PLAY_CARD`: Validate card is in player's hand, remove from hand, set `card.connectionId = aspectId`, add to `connections` array. This should already exist from Feature #5; verify and extend.
  - `UPDATE_ISOLATION`: Update `session.isolationSummary` text. Validate sender is Host or Scribe.
- **VALIDATE**: `cd server && npx tsc --noEmit`

---

### CREATE `client/src/hooks/useDragDrop.ts` [parallel_group: 1]

- **IMPLEMENT**: Custom hook for drag-and-drop:
  - `useDragSource(cardId: string)` — returns `{ dragProps }` with `draggable`, `onDragStart`, `onDragEnd` handlers
  - `useDropTarget(aspectId: string, onDrop: (cardId: string) => void)` — returns `{ dropProps, isOver }` with `onDragOver`, `onDragEnter`, `onDragLeave`, `onDrop` handlers
  - Uses HTML5 Drag and Drop API (no external library)
  - `isOver` state for visual feedback on hover
- **GOTCHA**: Must call `e.preventDefault()` in `onDragOver` to allow dropping
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/IsolationBanner.tsx` [parallel_group: 2]

- **IMPLEMENT**: Persistent banner at the top of the Tableau:
  - Shows Backdrop name and Isolation summary text
  - Editable by Host/Scribe (click to edit, blur to save)
  - Shows current Age indicator ("Age 1", "Age 2", etc.)
  - Lists all Aspects with current names and status (active/evolved/faded)
  - Supports markdown-style emphasis (`*italic*`, `**bold**`) for key narrative terms
- **GUIDES**: Poppins for heading, Inter for body, Storm-900 background, Storm-100 text
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/AspectHeader.tsx` [parallel_group: 2]

- **IMPLEMENT**: Aspect column header:
  - Displays Aspect name prominently
  - Shows evolution name below (if evolved, with arrow indicator)
  - Status badge: "Active" (green), "Evolved" (blue), "Faded" (gray)
  - Editable name (Host/Scribe only) — click to edit inline
  - Color-coded border matching Aspect significance
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/CardDropZone.tsx` [parallel_group: 2]

- **IMPLEMENT**: Drop target area within each Aspect column:
  - Visual indicator when a card is being dragged over ("Drop here" text + border glow)
  - Uses `useDropTarget` hook
  - On drop: dispatches `PLAY_CARD` action with cardId and aspectId
  - Accessible: keyboard alternative (select card → select Aspect → confirm)
  - Disabled when it's not the current player's turn (visual dimming)
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/AspectColumn.tsx` [parallel_group: 3]

- **IMPLEMENT**: Individual Aspect column:
  - `AspectHeader` at the top
  - `CardDropZone` below the header
  - List of played cards (using `CardDisplay` component)
  - Each card shows the player who played it (name + color dot)
  - Cards stacked vertically with slight overlap
  - Connection notes shown as small text below each card
  - Empty state: "No cards played yet"
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/Tableau.tsx` [parallel_group: 4]

- **IMPLEMENT**: Main Tableau board:
  - `IsolationBanner` at the top
  - Grid of `AspectColumn` components (3 columns default, responsive)
  - Flexbox or CSS Grid layout: equal-width columns with gap
  - Scrollable if content overflows vertically
  - Background texture/color that shifts by Age (preparation for Feature #11)
  - Responsive: 3 columns on desktop, 2 on tablet, 1 on mobile (stacked)
- **GUIDES**: brand_guide_webapp.md for grid spacing, Storm-900 base
- **VALIDATE**: `cd client && npx tsc -b`

---

### UPDATE `client/src/components/PlayerHand.tsx` [parallel_group: 4]

- **IMPLEMENT**: Make cards draggable:
  - Add `useDragSource(cardId)` to each card
  - Visual feedback during drag (card becomes semi-transparent)
  - Only draggable when it's the current player's turn
  - Keyboard alternative: select card, then choose Aspect from a prompt
- **VALIDATE**: `cd client && npx tsc -b`

---

### UPDATE `client/src/App.tsx` [parallel_group: 5]

- **IMPLEMENT**: Add `Tableau` component to the main game view. Layout:
  - `IsolationBanner` at top
  - `Tableau` (Aspect columns) in the center
  - `PlayerHand` at the bottom
  - `HostAdmin` sidebar on the right (Host only)
- **VALIDATE**: `npm run dev`, see full game layout

---

## TESTING STRATEGY

### Unit Tests

- Aspect CRUD in state engine
- PLAY_CARD validation (card in hand, player exists)
- Drag-drop hook returns correct props

### Integration Tests

- Drag card from hand to Aspect column
- Card appears in Aspect column for all clients
- Undo card play returns card to hand
- Aspect name editing persists and syncs

### Edge Cases

- Drop card on non-Aspect area (no-op)
- Play card when it's not your turn (rejected)
- All Aspects faded (should still display)
- Very long Aspect names (truncation)
- Rapid card plays (server serializes correctly)

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
- Start game with 3 players
- Verify 3 Aspect columns are visible
- Drag a card from hand to an Aspect
- Card appears in Aspect column on all clients
- Edit Aspect name, verify sync
- Check Isolation banner shows correct summary

---

## ACCEPTANCE CRITERIA

- [ ] Tableau displays 3 Aspect columns with headers
- [ ] Cards can be dragged from PlayerHand to Aspect columns
- [ ] Card play triggers a reveal event across all connected clients
- [ ] Played cards are grouped under their Aspect
- [ ] Card play is validated server-side (card in hand, correct turn)
- [ ] Undo reverts a card connection without deleting the card from the game
- [ ] Isolation banner shows Backdrop name and Aspect summary
- [ ] Isolation summary is editable by Host/Scribe
- [ ] Aspect names are editable by Host/Scribe
- [ ] Keyboard alternative exists for card play (accessibility)

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed
- [ ] All validation commands successful
- [ ] No linting or type errors
- [ ] Manual testing confirms drag-and-drop works
- [ ] Accessibility verified (keyboard navigation)
- [ ] Code reviewed for quality

---

## NOTES

- **HTML5 DnD vs library:** Using native HTML5 Drag and Drop API to avoid adding a dependency (react-dnd, dnd-kit). If the native API proves too limiting (especially on mobile), this can be revisited in Feature #11 (Visual Polish).
- **Mobile drag:** HTML5 DnD doesn't work on mobile touch screens. For Feature #11, consider adding touch event handlers or a "select and tap" alternative flow.
- **Aspect count:** Dialect typically uses 3 Aspects, but the system supports up to 4 for flexibility. The Host can add/remove Aspects via the admin panel.
- **Card animation:** The reveal animation (flip + slide) uses CSS `transform: rotateY()` with `perspective`. Keep it simple — 300ms duration, ease-out timing.
