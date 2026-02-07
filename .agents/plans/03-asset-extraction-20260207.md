# Feature: Asset Extraction Script

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Create a standalone script that extracts card images from `Dialect.pdf` (pages 162-185), crops them from their grid layouts, rotates them to vertical orientation, pairs fronts with backs using the zig-zag mirroring pattern, and outputs them as high-resolution images with a JSON manifest. This script runs once during setup and produces the static card assets the game UI displays.

## User Story

As a Developer/Agent
I want to automatically extract and rotate card assets from the Dialect.pdf
So that they are ready for digital display in the game UI

## Problem Statement

The Dialect game cards exist only as pages in a PDF document, arranged in 3x3 or 4x2 grids, rotated sideways. The digital tableau needs individual, upright card images paired as front/back for flip animations. Manual extraction would be tedious, error-prone, and unrepeatable.

## Solution Statement

Create `scripts/extract-assets.ts` using `pdf-lib` for PDF page rendering and `sharp` for image processing. The script identifies grid positions on each page, extracts individual cards, rotates them to vertical orientation, resizes to 750x1050px, pairs fronts to backs using the alternating page zig-zag mapping, and outputs to `assets/` directories with an `assets.json` manifest.

## Feature Metadata

| Attribute | Value |
|-----------|-------|
| **Feature Type** | New Capability (Tooling) |
| **Complexity** | Medium |
| **Affected Systems** | `scripts/`, `assets/` |
| **Dependencies** | Feature #1 (Scaffolding) — Node.js and npm must be available; pdf-lib, sharp installed |

---

## CONTEXT REFERENCES

### Relevant Codebase Files

**IMPORTANT: Read these files before implementing!**

- `dialect_prd.md` (lines 43-57) - Why: Asset extraction acceptance criteria
- `dialect_prd.md` (lines 482-490) - Why: Detailed extraction logic, grid layouts, coordinate mapping
- `dialect_prd.md` (lines 515-519) - Why: Zig-zag front/back mapping for double-sided printing
- `Dialect.pdf` (pages 162-185) - Why: Source material — must visually inspect grid layouts

### New Files to Create

- `scripts/extract-assets.ts` - Main extraction script
- `scripts/card-maps.ts` - Grid coordinate definitions and page-to-card mapping
- `assets/assets.json` - Generated manifest mapping card IDs to image paths

### Relevant Documentation

- [pdf-lib docs](https://pdf-lib.js.org/) - Why: PDF page access, rendering
- [sharp docs](https://sharp.pixelplumbing.com/) - Why: Image crop, rotate, resize, format conversion
- [pdf-to-img or pdf2pic](https://www.npmjs.com/package/pdf-to-img) - Why: pdf-lib doesn't render pages to images directly; may need a PDF-to-image library

### Patterns to Follow

**File Naming:**
```
assets/archetypes/archetype-01-front.webp
assets/archetypes/archetype-01-back.webp
assets/age1/age1-01-front.webp
assets/age1/age1-01-back.webp
```

---

## IMPLEMENTATION PLAN

### Phase 1: PDF Page Rendering

Convert PDF pages 162-185 into individual full-page images that can be processed.

**Tasks:**
- Render each PDF page to a high-resolution image (300 DPI)
- Save raw page images as intermediate files for debugging

### Phase 2: Grid Slicing

Slice each full-page image into individual card images based on the grid layout.

**Tasks:**
- Define grid coordinates for 3x3 layout (Archetypes) and 4x2 layout (Age cards)
- Crop individual cards from each page
- Handle any page-to-page variation in grid positioning

### Phase 3: Rotation & Normalization

Rotate and resize cards to standard vertical orientation.

**Tasks:**
- Rotate fronts 90 degrees clockwise (per PRD)
- Rotate backs 90 degrees counter-clockwise (per PRD)
- Resize all cards to exactly 750x1050px
- Convert to .webp format for optimal file size

### Phase 4: Front/Back Pairing & Manifest

Pair fronts with their corresponding backs and generate the manifest.

**Tasks:**
- Implement zig-zag mapping (front page card positions mirror horizontally on back page)
- Generate `assets.json` with card IDs, paths, age, and front/back pairs
- Validate all pairs exist

---

## STEP-BY-STEP TASKS

**IMPORTANT:** Execute every task in order, top to bottom. Each task is atomic.

---

### CREATE `scripts/card-maps.ts` [parallel_group: 1]

- **IMPLEMENT**: Define the page-to-card mapping:
  - `PAGE_RANGES`: Which PDF pages contain which card types
    - Page 162-163: Archetypes (fronts on 162, backs on 163)
    - Pages 164-167: Age 1 cards (fronts on even pages, backs on odd)
    - Pages 168-171: Age 2 cards
    - Pages 172-175: Age 3 cards
    - (Adjust based on actual PDF inspection)
  - `GRID_LAYOUTS`: Grid dimensions per card type
    - Archetypes: 3 columns x 3 rows = 9 cards
    - Age cards: 4 columns x 2 rows = 8 cards per page
  - `CARD_TARGET_SIZE`: `{ width: 750, height: 1050 }`
  - `mapFrontToBack(row: number, col: number, gridCols: number): { row: number, col: number }` — zig-zag horizontal mirror mapping for double-sided printing
- **GOTCHA**: The zig-zag mapping means front card at position (row, col) maps to back card at position (row, gridCols - 1 - col) due to horizontal mirroring in double-sided printing.
- **GOTCHA**: Page numbers in the PDF are 0-indexed in pdf-lib but 1-indexed in the PRD. The PRD says "pages 162-185" which are the printed page numbers. The actual PDF page indices may differ. The script must handle this mapping.
- **VALIDATE**: File compiles without errors

---

### CREATE `scripts/extract-assets.ts` [parallel_group: 2]

- **IMPLEMENT**: Main extraction script:
  1. Load `Dialect.pdf` using pdf-lib (or pdf-to-img for rendering)
  2. For each page range:
     a. Render the PDF page to a high-resolution PNG (at least 300 DPI)
     b. Use sharp to slice the page into individual cards based on grid layout
     c. Rotate each card image to vertical orientation
     d. Resize to 750x1050px
     e. Save as .webp to the appropriate `assets/` subdirectory
  3. Pair fronts to backs using `mapFrontToBack()`
  4. Generate `assets.json` manifest
  5. Log summary: total cards extracted, any errors

- **IMPORTS**: `pdf-lib` or `pdf-to-img`, `sharp`, `fs`, `path`
- **GOTCHA**: `pdf-lib` can parse PDF structure but cannot render pages to images by itself. Use `pdf-to-img` (which uses `pdfjs-dist` under the hood) or `canvas` + `pdfjs-dist` for page rendering.
- **GOTCHA**: The script must be idempotent — running it again should overwrite existing assets cleanly.
- **GOTCHA**: Some cards may have slightly different grid positions. Build in a small tolerance or configurable offset per page.

**Expected manifest format (`assets.json`):**
```json
{
  "cards": [
    {
      "id": "archetype-01",
      "type": "archetype",
      "age": null,
      "front": "archetypes/archetype-01-front.webp",
      "back": "archetypes/archetype-01-back.webp"
    },
    {
      "id": "age1-01",
      "type": "age",
      "age": 1,
      "front": "age1/age1-01-front.webp",
      "back": "age1/age1-01-back.webp"
    }
  ],
  "metadata": {
    "extractedAt": "2026-02-07T...",
    "sourceFile": "Dialect.pdf",
    "totalCards": 0,
    "targetSize": { "width": 750, "height": 1050 }
  }
}
```

- **VALIDATE**: `npx tsx scripts/extract-assets.ts` runs without errors

---

### ADD pdf-to-img dependency [parallel_group: 1]

- **IMPLEMENT**: Add `pdf-to-img` (or `pdf2pic`) to root or scripts devDependencies for PDF page rendering. Also ensure `sharp` and `pdf-lib` are available.
- **VALIDATE**: `npm install` succeeds, package resolves

---

### VALIDATE Asset Extraction [parallel_group: 3]

- **VALIDATE**: Run `npm run extract-assets` from root
- **VALIDATE**: Check `assets/archetypes/` contains paired front/back .webp files
- **VALIDATE**: Check `assets/age1/`, `assets/age2/`, `assets/age3/` contain paired files
- **VALIDATE**: Check `assets/assets.json` exists with correct structure
- **VALIDATE**: Open a few images visually — cards should be vertical, text readable, 750x1050px

---

## TESTING STRATEGY

### Unit Tests

No automated tests for this script — it's a one-time build tool. Validation is visual.

### Integration Tests

- Script runs without errors
- Output files exist in correct directories
- Manifest JSON is valid and complete

### Edge Cases

- PDF file not found (helpful error message)
- Output directory doesn't exist (auto-create)
- Re-running overwrites cleanly (idempotent)
- Low-resolution source pages (log warning, still process)
- Grid alignment slightly off on some pages (configurable offset)

---

## VALIDATION COMMANDS

### Level 1: Syntax
```powershell
npx tsx --version
```

### Level 2: Run Script
```powershell
npm run extract-assets
# Should log: "Extracting cards from Dialect.pdf..."
# Should log: "Extracted N cards to assets/"
# Should log: "Generated assets/assets.json"
```

### Level 3: Verify Output
```powershell
Get-ChildItem assets/archetypes/*.webp | Measure-Object
Get-ChildItem assets/age1/*.webp | Measure-Object
Get-ChildItem assets/age2/*.webp | Measure-Object
Get-ChildItem assets/age3/*.webp | Measure-Object
Get-Content assets/assets.json | ConvertFrom-Json | Select-Object -ExpandProperty metadata
```

### Level 4: Manual Validation
- Open several .webp files in an image viewer
- Verify cards are vertical (text reads left-to-right)
- Verify resolution is 750x1050px
- Verify fronts match backs (content alignment)

---

## ACCEPTANCE CRITERIA

- [x] Script extracts card images from PDF pages 162-185
- [x] Archetypes extracted from 3x3 grid layout
- [x] Age cards extracted from 4x2 grid layout
- [x] Fronts rotated 90 degrees clockwise to vertical
- [x] Backs rotated 90 degrees counter-clockwise to vertical
- [x] All cards resized to exactly 750x1050px
- [x] Output format is .webp (high quality, small file size)
- [x] Front/back pairs matched using zig-zag horizontal mirror mapping
- [x] `assets.json` manifest contains all card entries with correct paths
- [x] Script is idempotent (safe to re-run)
- [x] Assets organized into `assets/archetypes/`, `assets/age1/`, `assets/age2/`, `assets/age3/`
- NOTE: Page indices in card-maps.ts are estimates; run script with --debug flag and adjust based on visual inspection of output

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed
- [ ] All validation commands successful
- [ ] Visual inspection confirms card quality
- [ ] Manifest JSON is valid and complete

---

## NOTES

- **PDF rendering library:** `pdf-lib` parses PDF structure but doesn't render to images. Use `pdf-to-img` (wraps `pdfjs-dist`) or `canvas` + `pdfjs-dist` for actual page rendering. Research the best option during implementation.
- **Zig-zag mapping:** When a sheet is printed double-sided, the back side is horizontally mirrored. So front card at column 0 maps to back card at column (maxCol), front at column 1 maps to back at column (maxCol - 1), etc. Rows stay the same.
- **Page number offset:** The PRD references "pages 162-185" as printed page numbers. The actual 0-based indices in the PDF may differ if there are unnumbered pages. The script should allow configurable page offsets.
- **Backdrop pages:** The PRD mentions Backdrops in the asset structure. These may be on different pages. Inspect the PDF and add backdrop extraction if found in the page range.
- **upscale flag:** Per PRD risk mitigation, implement an `--upscale` flag that uses sharp to enhance resolution if source quality is low.
