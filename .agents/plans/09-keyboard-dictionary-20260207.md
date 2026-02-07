# Feature: Phonetic Keyboard & Dialect Dictionary

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Implement the linguistic tools at the core of Dialect: the sound set selection modal (during setup, choose one of ~4 predefined sets as primary, with the rest as secondary), the phonetic keyboard for inputting non-standard symbols, pronunciation tooltips, and the evolving Dialect Dictionary sidebar. The Dictionary grows as the game progresses, supports word variants/evolution, and can be exported at game end.

## User Story

As a Scribe
I want to select our group's primary sound set and input non-standard phonetic symbols quickly
So that the group doesn't lose narrative momentum during Word Building

As a group
We want an automated Dialect Dictionary that grows as we play
So that we can track and reference our invented language throughout the game

## Problem Statement

Dialect's gameplay revolves around creating a unique language. Players invent words with specific phonetic properties, and these words need to be recorded with their pronunciation, meaning, and the Aspect they relate to. Standard keyboards can't input IPA (International Phonetic Alphabet) symbols, and without a structured dictionary, the language gets lost or confused over the course of a multi-hour game.

## Solution Statement

During setup, present a modal where the group selects one of ~4 predefined sound sets from the Dialect rules. The chosen set becomes the **primary tier** — always visible at the top of the keyboard. The remaining sets are accessible as **secondary tiers** (collapsed/expandable). The keyboard inserts symbols into a text field. The Dictionary is a persistent sidebar that records every word with its IPA pronunciation, meaning, Age, and parent word (for variants). Words can evolve into variants, creating a visual tree of linguistic change.

## Feature Metadata

| Attribute | Value |
|-----------|-------|
| **Feature Type** | New Capability |
| **Complexity** | High |
| **Affected Systems** | Client (keyboard UI, dictionary sidebar, setup modal), Server (dictionary state, word actions) |
| **Dependencies** | Feature #7 (Tableau — game context), Feature #8 (Game Flow — setup wizard for sound set selection) |

---

## CONTEXT REFERENCES

### Relevant Codebase Files

**IMPORTANT: Read these files before implementing!**

- `server/src/types.ts` - Why: DictionaryEntry interface, GameAction SAVE_WORD / EVOLVE_WORD types
- `server/src/state.ts` - Why: applyAction for dictionary mutations
- `client/src/components/setup/SetupWizard.tsx` (from Feature #8) - Why: Sound set selection is Step 4 of setup
- `dialect_prd.md` (lines 77-92) - Why: Two-Tier Phonetic Keyboard user story
- `dialect_prd.md` (lines 176-188) - Why: Dictionary Management user story
- `dialect_prd.md` (lines 239-253) - Why: Linguistic Evolution (word variants) user story
- `Dialect.pdf` - Why: Contains the actual sound sets/phonetic inventories to extract
- `.cursor/guides/brand_guide/user_interfaces/brand_guide_webapp.md` - Why: Modal, sidebar, input patterns
- `.cursor/guides/ux_design/ux_guide_general.md` - Why: Input patterns, tooltip behavior

### New Files to Create

- `client/src/data/sound-sets.ts` - Predefined sound set definitions (from Dialect rules)
- `client/src/components/setup/SoundSetModal.tsx` - Sound set selection during setup
- `client/src/components/keyboard/PhoneticKeyboard.tsx` - Main keyboard component
- `client/src/components/keyboard/SoundSetTier.tsx` - Individual sound set tier (primary/secondary)
- `client/src/components/keyboard/SymbolButton.tsx` - Individual phonetic symbol button with tooltip
- `client/src/components/dictionary/Dictionary.tsx` - Main dictionary sidebar
- `client/src/components/dictionary/DictionaryEntry.tsx` - Individual word entry display
- `client/src/components/dictionary/WordForm.tsx` - Add/edit word form
- `client/src/components/dictionary/WordTree.tsx` - Word evolution tree visualization
- `client/src/components/dictionary/DictionaryExport.tsx` - Export dictionary to text file

### Relevant Documentation

- [IPA Chart](https://www.internationalphoneticassociation.org/content/ipa-chart) - Why: Standard IPA symbols reference
- Dialect PDF Sound Set pages - Why: The 4 predefined sound inventories to use

### Patterns to Follow

**Sound Set Data Structure:**
```typescript
interface SoundSet {
  id: string;
  name: string;        // e.g., "Set A: Flowing Sounds"
  description: string;  // e.g., "Smooth, vowel-heavy sounds for a melodic language"
  symbols: PhoneticSymbol[];
}

interface PhoneticSymbol {
  char: string;         // The IPA character
  name: string;         // e.g., "sh"
  example: string;      // e.g., "like 'shoe'"
  category: 'consonant' | 'vowel' | 'modifier';
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Sound Set Data

Define the predefined sound sets from the Dialect rules.

**Tasks:**
- Extract the ~4 sound set options from the Dialect PDF
- Create data file with all symbols, names, and pronunciation guides
- Add sound set selection to game state

### Phase 2: Sound Set Selection (Setup)

Integrate sound set selection into the setup wizard.

**Tasks:**
- Create selection modal with visual previews
- Wire up to game state
- Show primary vs secondary tiers based on selection

### Phase 3: Phonetic Keyboard

Build the two-tier keyboard for inputting IPA symbols.

**Tasks:**
- Primary tier (selected sound set — always visible)
- Secondary tiers (other sets — collapsible)
- Symbol buttons with hover tooltips
- Insert into active text field on click

### Phase 4: Dictionary Sidebar

Build the persistent dictionary that tracks all words.

**Tasks:**
- Dictionary sidebar with word list
- Add word form (with phonetic keyboard integration)
- Word display with IPA, meaning, Age, Aspect
- Sort by Age (chronological)
- Search functionality

### Phase 5: Word Evolution

Add variant/evolution functionality for linguistic change tracking.

**Tasks:**
- "Evolve Word" button on existing entries
- Parent-child word linking
- Visual tree showing word evolution paths
- Age tagging on variants

### Phase 6: Export

Enable exporting the dictionary at game end.

**Tasks:**
- Export to .txt or .json file
- Include all words, IPA, meanings, relationships
- Download button in dictionary sidebar and Legacy Phase

---

## STEP-BY-STEP TASKS

**IMPORTANT:** Execute every task in order, top to bottom. Each task is atomic.

---

### CREATE `client/src/data/sound-sets.ts` [parallel_group: 1]

- **IMPLEMENT**: Define the predefined sound sets:
  - At least 4 sound sets with distinct phonetic inventories
  - Each set has 8-12 core symbols (consonants and vowels)
  - Each symbol includes: character, name, example word, category
  - Sets should feel distinct: one flowing/melodic, one guttural, one clicked/percussive, one tonal
  - Example sets (adjust based on actual Dialect PDF content):
    - **Set A: Flowing** — /ʃ/, /l/, /m/, /n/, /a/, /i/, /u/, /θ/, /w/, /j/
    - **Set B: Guttural** — /k/, /g/, /x/, /ɣ/, /ʔ/, /q/, /ɑ/, /ɔ/, /r/, /ʁ/
    - **Set C: Percussive** — /t/, /d/, /p/, /b/, /ts/, /tʃ/, /ɛ/, /ɪ/, /ʊ/, /s/
    - **Set D: Nasal** — /ŋ/, /ɲ/, /m/, /n/, /ã/, /ẽ/, /ĩ/, /õ/, /ũ/, /f/, /v/
  - Also include a "Full IPA Library" with 40+ common symbols (per PRD)
- **GOTCHA**: Sound sets should be sourced from the actual Dialect PDF if possible. These are placeholder examples.
- **VALIDATE**: `cd client && npx tsc -b`

---

### ADD sound set fields to state types [parallel_group: 1]

- **IMPLEMENT**: Add to `server/src/types.ts`:
  ```typescript
  // In Session:
  primarySoundSet: string | null;  // sound set ID selected during setup
  ```
- **IMPLEMENT**: Add action:
  ```typescript
  | { type: 'SET_SOUND_SET'; soundSetId: string }
  ```
- **IMPLEMENT**: Mirror in `client/src/types.ts`
- **VALIDATE**: `cd server && npx tsc --noEmit`

---

### UPDATE `server/src/state.ts` [parallel_group: 1]

- **IMPLEMENT**: Add `SET_SOUND_SET` handler: set `session.primarySoundSet` to the chosen ID
- **VALIDATE**: `cd server && npx tsc --noEmit`

---

### CREATE `client/src/components/setup/SoundSetModal.tsx` [parallel_group: 2]

- **IMPLEMENT**: Sound set selection modal:
  - Grid of 4 sound set cards, each showing:
    - Set name and description
    - Preview of 4-5 example symbols
    - "Select" button
  - Selected set has highlighted border (Orange)
  - Confirm button: "Use This Sound Set"
  - On confirm: dispatches `SET_SOUND_SET` action
  - Accessible: keyboard navigation between options, aria-selected, focus management
- **GUIDES**: brand_guide_webapp.md for modal patterns (Storm-900 backdrop, rounded corners)
- **VALIDATE**: `cd client && npx tsc -b`

---

### UPDATE `client/src/components/setup/SetupWizard.tsx` [parallel_group: 2]

- **IMPLEMENT**: Wire Step 4 (previously placeholder) to `SoundSetModal`:
  - Show SoundSetModal when wizard reaches Step 4
  - Display selected sound set name after confirmation
  - Allow changing selection (re-open modal)
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/keyboard/SymbolButton.tsx` [parallel_group: 3]

- **IMPLEMENT**: Individual phonetic symbol button:
  - Displays the IPA character prominently (large, clear font)
  - Hover tooltip: shows name + example (e.g., "sh — like 'shoe'")
  - Click: calls `onSymbolClick(char)` callback
  - Keyboard accessible: tabindex, Enter/Space to activate, aria-label
  - Visual states: default, hover, active, focus
- **GOTCHA**: IPA characters may need a specialized font. Use "Noto Sans" or "Charis SIL" which have broad IPA coverage. Fall back to system fonts.
- **GUIDES**: Storm-200 background, Storm-900 text, Orange focus ring
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/keyboard/SoundSetTier.tsx` [parallel_group: 3]

- **IMPLEMENT**: Sound set tier component:
  - Header with set name (collapsible via click)
  - Grid of `SymbolButton` components
  - Primary tier: expanded by default, visually prominent
  - Secondary tiers: collapsed by default, expandable
  - Collapse/expand animation (smooth height transition)
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/keyboard/PhoneticKeyboard.tsx` [parallel_group: 4]

- **IMPLEMENT**: Main keyboard component:
  - Props: `onInsert: (char: string) => void`, `primarySetId: string`
  - Primary tier at top (the selected sound set, always expanded)
  - Divider line
  - Secondary tiers below (other 3 sets, collapsed)
  - "Full IPA" expandable section at the bottom (40+ symbols)
  - Compact layout that doesn't overwhelm the word form
  - Close/minimize button
- **GOTCHA**: The keyboard should be a floating panel near the word input, not a full-screen overlay
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/dictionary/WordForm.tsx` [parallel_group: 4]

- **IMPLEMENT**: Word creation/editing form:
  - Text input: Word (standard characters)
  - Text input: IPA pronunciation (with PhoneticKeyboard integration)
    - Clicking a symbol on the keyboard inserts it at cursor position
  - Text input: Meaning/definition
  - Dropdown: Associated Aspect (from current Aspects)
  - Auto-tags with current Age
  - Submit button: "Save Word"
  - On submit: dispatches `SAVE_WORD` action
  - Only visible to Host or Scribe
- **GOTCHA**: The IPA input field must support combining characters (diacritics that stack on base characters) without layout breaking
- **GUIDES**: Storm focus rings, Orange submit button
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/dictionary/DictionaryEntry.tsx` [parallel_group: 5]

- **IMPLEMENT**: Individual dictionary entry display:
  - Word in large text
  - IPA pronunciation in brackets (e.g., /ʃɑːk/)
  - Meaning/definition
  - Metadata: Age badge, Aspect tag, created by player name
  - "Evolve Word" button (visible to Host/Scribe)
  - If variant: indented with line connecting to parent word
  - Click to expand/collapse full details
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/dictionary/WordTree.tsx` [parallel_group: 5]

- **IMPLEMENT**: Word evolution tree visualization:
  - Shows parent word at root
  - Variants branch below with connector lines
  - Each node shows: word, Age badge, brief meaning
  - Click on a node to see full entry
  - Uses simple CSS-based tree layout (nested divs with border-left connectors)
  - Handles multiple levels of evolution (parent → child → grandchild)
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/dictionary/DictionaryExport.tsx` [parallel_group: 5]

- **IMPLEMENT**: Export functionality:
  - "Export Dictionary" button
  - Generates a formatted text file:
    ```
    === DIALECT DICTIONARY ===
    Session: {backdrop name}
    Date: {date}

    --- AGE 1 ---
    shäk /ʃɑːk/ — "the dust that settles before dawn"
      └ shäku /ʃɑːku/ — "the dust that never settles" (Age 2 variant)

    --- AGE 2 ---
    ...
    ```
  - Also offers JSON export (full data with IDs and relationships)
  - Uses browser download API (`URL.createObjectURL` + anchor click)
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/dictionary/Dictionary.tsx` [parallel_group: 6]

- **IMPLEMENT**: Main dictionary sidebar:
  - Persistent left sidebar (collapsible on mobile)
  - Header: "Dialect Dictionary" with word count
  - Search bar: filter words by text
  - Sort: chronological by default (Age 1 → 2 → 3), with option for alphabetical
  - Word list: `DictionaryEntry` components
  - Words with variants shown as `WordTree` nodes
  - "Add Word" button (opens `WordForm` with `PhoneticKeyboard`)
  - Export button at the bottom
  - Scrollable word list
  - Empty state: "No words yet. The Scribe will add words during gameplay."
- **GUIDES**: brand_guide_webapp.md for sidebar, Storm background
- **VALIDATE**: `cd client && npx tsc -b`

---

### UPDATE `client/src/App.tsx` [parallel_group: 7]

- **IMPLEMENT**: Add `Dictionary` sidebar to the game layout:
  - Layout: Dictionary (left) | Tableau (center) | HostAdmin (right, Host only)
  - Dictionary visible during `'playing'` and `'legacy'` phases
  - Collapsible on mobile (hamburger toggle)
- **VALIDATE**: `npm run dev`, see dictionary sidebar in game view

---

## TESTING STRATEGY

### Unit Tests

- Sound set data integrity (all symbols have name + example)
- SAVE_WORD creates entry with correct fields
- EVOLVE_WORD links to parent correctly
- Dictionary search filters correctly
- Export format matches expected output

### Integration Tests

- Select sound set during setup, verify primary tier in keyboard
- Type a word using phonetic keyboard symbols
- Save word, see it appear in dictionary for all players
- Create variant, see tree structure
- Export dictionary, verify file contents

### Edge Cases

- Combining IPA characters (diacritics on base chars)
- Very long word names (truncation in list, full in detail)
- Searching with IPA characters
- Duplicate word names (allowed — may have different meanings per Age)
- Empty dictionary export (should still produce valid file)
- Sound set with overlapping symbols between sets

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
- During setup, select a sound set
- Verify primary tier shows selected set symbols
- Open "Add Word" form
- Click symbols on keyboard, verify they insert into IPA field
- Save a word, verify it appears in dictionary
- Create a variant of the word
- Verify word tree shows parent-child relationship
- Export dictionary, verify file downloads with correct content

---

## ACCEPTANCE CRITERIA

- [ ] Sound set selection modal shows ~4 options during setup
- [ ] Selected sound set becomes the primary (always visible) tier
- [ ] Remaining sound sets are accessible as secondary (collapsed) tiers
- [ ] Hovering over a symbol shows a pronunciation tooltip
- [ ] IPA input field supports combining characters without layout breaking
- [ ] Words are saved with: word, IPA, meaning, Age, Aspect, creator
- [ ] Dictionary is searchable by all players
- [ ] Dictionary is sorted chronologically by default (Age 1 → 2 → 3)
- [ ] Word variants are linked to parent words
- [ ] Dictionary displays word evolution as a visual tree
- [ ] Variants are automatically tagged with the current Age
- [ ] Exporting dictionary to text file is available at game end
- [ ] Only Host/Scribe can add or edit words

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed
- [ ] All validation commands successful
- [ ] No linting or type errors
- [ ] Manual testing confirms keyboard and dictionary work
- [ ] Accessibility verified (keyboard navigation, tooltips)
- [ ] Code reviewed for quality

---

## NOTES

- **Sound set sourcing:** The 4 sound sets should ideally be extracted from the Dialect PDF. If the PDF doesn't have clear digital data for these, define reasonable sets based on common IPA categories that match Dialect's themes.
- **IPA font:** IPA characters need good font support. Google Fonts "Noto Sans" has excellent IPA coverage. Add it alongside Poppins/Inter in the font stack.
- **Combining characters:** IPA uses combining diacritics (e.g., nasal tilde ◌̃ on a vowel). The input field must handle these correctly. Test with `ã`, `ẽ`, `ĩ` etc.
- **Word form placement:** The "Add Word" form with the phonetic keyboard should appear as a modal or slide-out panel, not inline, to avoid cluttering the dictionary sidebar.
- **Dictionary is read-only for Players:** Only Host and Scribe can add/edit words. All players can read, search, and export.
