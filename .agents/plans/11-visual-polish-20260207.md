# Feature: Visual Polish & Theming

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Add the visual polish layer: CSS theme transitions that shift the UI atmosphere from "Hopeful" (Age 1) to "Stable" (Age 2) to "Decaying" (Age 3), a high-contrast "Memorial" theme for the Legacy Phase, markdown support in narrative text fields, and a responsive mobile layout for players using phones as their "Private Hand" device.

## User Story

As a Player
I want the visual atmosphere to shift as the Ages progress so that the declining narrative is reflected in the UI

As a Player
I want to use my phone as my private hand viewer so I don't need a laptop

## Problem Statement

Dialect's narrative arc goes from hopeful beginning to inevitable decline. The current UI has a static visual style. Without visual theming that mirrors the story's progression, the digital experience feels flat. Additionally, some players may only have a phone available, so the UI must work responsively as a "hand viewer" on small screens.

## Solution Statement

Implement CSS custom properties that change based on the current Age, creating smooth visual transitions between thematic stages. Add a memorial theme for the Legacy Phase. Implement markdown rendering for narrative text fields (Aspect descriptions, Isolation summary, connection notes). Create a responsive mobile layout that prioritizes the player's hand and essential controls.

## Feature Metadata

| Attribute | Value |
|-----------|-------|
| **Feature Type** | Enhancement |
| **Complexity** | Low |
| **Affected Systems** | Client (CSS theming, markdown renderer, responsive layout) |
| **Dependencies** | Feature #8 (Game Flow — Age progression triggers), Feature #9 (Dictionary — narrative text) |

---

## CONTEXT REFERENCES

### Relevant Codebase Files

**IMPORTANT: Read these files before implementing!**

- `client/src/index.css` - Why: Base theme tokens defined here (Tailwind @theme)
- `client/src/App.tsx` - Why: Root component where theme class is applied
- `client/src/components/Tableau.tsx` - Why: Main visual area that changes with themes
- `client/src/components/IsolationBanner.tsx` - Why: Narrative text that needs markdown
- `client/src/components/dictionary/DictionaryEntry.tsx` - Why: Word meanings with potential markdown
- `.cursor/guides/brand_guide/user_interfaces/brand_guide_webapp.md` - Why: Feather Design System color tokens
- `.cursor/guides/brand_guide/brand_guide_general.md` - Why: Base brand colors
- `dialect_prd.md` (lines 404-406) - Why: Visual themes P2 requirement

### New Files to Create

- `client/src/themes/age-themes.css` - Age-specific CSS custom property overrides
- `client/src/components/MarkdownText.tsx` - Markdown renderer component
- `client/src/hooks/useAgeTheme.ts` - Hook that applies theme based on current Age
- `client/src/styles/mobile.css` - Mobile-specific responsive overrides

### Relevant Documentation

- [Tailwind CSS v4 theming](https://tailwindcss.com/docs/theme) - Why: @theme block for custom properties
- [CSS View Transitions](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) - Why: Smooth theme transitions (progressive enhancement)

### Patterns to Follow

**Theme Transition Pattern:**
```css
/* Base theme applied via CSS custom properties on :root */
/* Age-specific overrides applied via data attribute on <html> */

html[data-age="1"] {
  --bg-primary: #1a2332;     /* Dark blue — hopeful */
  --accent: #4ECDC4;          /* Teal — growth */
}

html[data-age="2"] {
  --bg-primary: #2a1f2d;     /* Dark purple — tension */
  --accent: #627D98;          /* Storm — neutral */
}

html[data-age="3"] {
  --bg-primary: #1a1a1a;     /* Near-black — decay */
  --accent: #9B6B6B;          /* Iron/rust — decline */
}

html[data-age="legacy"] {
  --bg-primary: #0a0a0a;     /* Black — memorial */
  --accent: #F0F4F8;          /* White text — stark */
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Age Theming

Create CSS custom properties for each Age and apply them based on game state.

**Tasks:**
- Define theme variables for each Age (colors, backgrounds, accents)
- Create hook that applies the correct theme
- Add smooth transitions between themes
- Memorial theme for Legacy Phase

### Phase 2: Markdown Support

Add markdown rendering for narrative text fields.

**Tasks:**
- Create lightweight markdown renderer (no heavy dependency)
- Apply to Isolation summary, Aspect descriptions, connection notes
- Support bold, italic, and basic formatting only

### Phase 3: Mobile Responsive

Optimize the layout for phone-sized screens.

**Tasks:**
- Mobile-first responsive breakpoints
- Phone-optimized hand viewer
- Collapsible sections for Tableau and Dictionary
- Touch-friendly card interactions

---

## STEP-BY-STEP TASKS

**IMPORTANT:** Execute every task in order, top to bottom. Each task is atomic.

---

### CREATE `client/src/themes/age-themes.css` [parallel_group: 1]

- **IMPLEMENT**: Age-specific theme definitions:
  - **Age 1 (Hopeful):**
    - Background: Deep blue (`#1a2332`)
    - Accent: Teal/Spruce (`#4ECDC4`)
    - Card borders: Warm gold
    - Text: Light/warm tones
    - Subtle starfield or dawn gradient
  - **Age 2 (Stable/Tense):**
    - Background: Deep purple-gray (`#2a1f2d`)
    - Accent: Storm blue (`#627D98`)
    - Card borders: Cool silver
    - Text: Neutral tones
    - Muted, practical feel
  - **Age 3 (Decaying):**
    - Background: Near-black (`#1a1a1a`)
    - Accent: Iron/rust (`#9B6B6B`)
    - Card borders: Oxidized copper
    - Text: Fading/dim tones
    - Cracked or weathered texture hints
  - **Legacy (Memorial):**
    - Background: Pure black (`#0a0a0a`)
    - Accent: White (`#F0F4F8`)
    - Card borders: White/gold
    - Text: High contrast white
    - Stark, clean, respectful
  - All transitions use `transition: all 1.5s ease-in-out` for smooth shifts
- **VALIDATE**: CSS file parses without errors

---

### CREATE `client/src/hooks/useAgeTheme.ts` [parallel_group: 1]

- **IMPLEMENT**: Hook that manages theme application:
  - Reads `state.session.age` and `state.session.phase`
  - Sets `data-age` attribute on `<html>` element
  - Values: `"1"`, `"2"`, `"3"`, `"legacy"`
  - Triggers smooth CSS transition when age changes
  - Falls back to Age 1 theme if state is unavailable
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/components/MarkdownText.tsx` [parallel_group: 2]

- **IMPLEMENT**: Lightweight markdown renderer:
  - Props: `content: string`, `className?: string`
  - Supports: **bold**, *italic*, ~~strikethrough~~, `code`
  - No external library — simple regex replacement:
    - `**text**` → `<strong>`
    - `*text*` → `<em>`
    - `` `text` `` → `<code>`
    - `~~text~~` → `<del>`
  - Sanitizes HTML (no script injection)
  - Renders as a `<span>` or `<div>` depending on content
  - Does NOT support: images, links, headers, lists (keep it minimal)
- **GOTCHA**: Use `dangerouslySetInnerHTML` with sanitization, or build React elements from parsed tokens
- **VALIDATE**: `cd client && npx tsc -b`

---

### UPDATE `client/src/components/IsolationBanner.tsx` [parallel_group: 2]

- **IMPLEMENT**: Replace plain text display with `<MarkdownText>` for:
  - Isolation summary text
  - Aspect descriptions
- **VALIDATE**: `cd client && npx tsc -b`

---

### UPDATE `client/src/components/dictionary/DictionaryEntry.tsx` [parallel_group: 2]

- **IMPLEMENT**: Use `<MarkdownText>` for word meanings/definitions
- **VALIDATE**: `cd client && npx tsc -b`

---

### CREATE `client/src/styles/mobile.css` [parallel_group: 3]

- **IMPLEMENT**: Mobile-responsive styles:
  - **Breakpoints:**
    - `< 640px` (phone): Single-column layout, hand-focused
    - `640-1024px` (tablet): Two-column (tableau + sidebar)
    - `> 1024px` (desktop): Full three-panel layout
  - **Phone layout:**
    - Bottom tab bar: Hand | Tableau | Dictionary | (Admin if Host)
    - Player hand fills most of the screen
    - Tableau scrollable in a dedicated tab
    - Dictionary in a dedicated tab
    - Cards at medium size (180x252px)
    - Touch-friendly buttons (44px minimum tap targets)
  - **Tablet layout:**
    - Tableau and dictionary side-by-side
    - Hand at bottom
    - Admin as a sheet from right edge
  - **Touch interactions:**
    - Tap to select card (instead of drag)
    - Tap Aspect to play selected card (instead of drop)
    - Long-press for card detail view
- **GOTCHA**: HTML5 Drag and Drop doesn't work on mobile. The tap-to-select-then-tap-to-play pattern is the mobile alternative.
- **VALIDATE**: Responsive layout correct at 375px, 768px, 1280px widths

---

### UPDATE `client/src/index.css` [parallel_group: 3]

- **IMPLEMENT**: Import theme and mobile CSS files:
  ```css
  @import "tailwindcss";
  @import "./themes/age-themes.css";
  @import "./styles/mobile.css";
  ```
- **VALIDATE**: All CSS imports resolve

---

### UPDATE `client/src/App.tsx` [parallel_group: 4]

- **IMPLEMENT**:
  - Call `useAgeTheme()` hook to apply theme based on game state
  - Add mobile layout detection: use `window.innerWidth` or CSS media queries
  - Render mobile tab bar when on small screen
  - Import theme CSS
- **VALIDATE**: `npm run dev`, resize browser, verify responsive behavior

---

## TESTING STRATEGY

### Unit Tests

- MarkdownText renders bold, italic, code correctly
- MarkdownText sanitizes malicious HTML
- Theme hook sets correct data-age attribute
- Mobile breakpoints activate correct layouts

### Integration Tests

- Start at Age 1, verify hopeful theme
- Advance to Age 2, verify theme transitions smoothly
- Advance to Age 3, verify decay theme
- Enter Legacy, verify memorial theme
- Type markdown in Isolation summary, verify it renders

### Edge Cases

- Very rapid age changes (transition doesn't break)
- Phone in landscape vs portrait
- Extremely long text with markdown
- Theme applied before state loads (fallback)
- Markdown in dictionary export (strip formatting, keep plain text)

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
- Start game at Age 1, verify blue/teal theme
- Advance to Age 2, verify purple-gray theme with smooth transition
- Advance to Age 3, verify dark decay theme
- Enter Legacy Phase, verify memorial black/white theme
- Type `**bold**` in Isolation summary, verify it renders bold
- Open on phone-sized viewport (375px), verify single-column layout
- Open on tablet-sized viewport (768px), verify two-column layout
- Verify touch interactions work (tap select + tap play)

---

## ACCEPTANCE CRITERIA

- [ ] UI theme transitions from "Hopeful" (Age 1) to "Decaying" (Age 3)
- [ ] Theme change transitions are smooth (1.5s ease-in-out)
- [ ] Legacy Phase uses high-contrast "Memorial" theme
- [ ] Markdown emphasis renders in narrative text fields (bold, italic)
- [ ] Mobile layout works on phone screens (< 640px)
- [ ] Mobile uses tap-to-select instead of drag-and-drop
- [ ] Tablet layout uses two-column design
- [ ] Touch targets are at least 44px
- [ ] Cards are appropriately sized for each screen size
- [ ] Theme colors don't conflict with card image readability

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed
- [ ] All validation commands successful
- [ ] No linting or type errors
- [ ] Manual testing confirms themes and responsive layout
- [ ] Accessibility verified (contrast ratios, touch targets)
- [ ] Code reviewed for quality

---

## NOTES

- **No external markdown library:** The markdown support is intentionally minimal (bold, italic, code, strikethrough). This avoids adding a dependency like `marked` or `react-markdown` for just 4 formatting options.
- **CSS custom properties:** Using `data-age` attribute on `<html>` lets all components automatically pick up theme changes without prop drilling or context. Tailwind v4's `@theme` block can reference these custom properties.
- **Progressive enhancement:** CSS View Transitions API can enhance the age transition with page-level animation, but it's not supported in all browsers. Use it as progressive enhancement with `@supports`.
- **Mobile drag alternative:** The tap-to-select pattern replaces drag-and-drop on mobile. Player taps a card in hand (selected with highlight), then taps an Aspect column (card plays there). This is actually more intuitive on touch screens than trying to drag.
- **Performance:** CSS transitions on custom properties are GPU-accelerated. The 1.5s transition won't cause jank even on lower-end devices.
