/**
 * Card grid coordinate definitions and page-to-card mapping.
 * Defines how cards are arranged in the PDF and how fronts map to backs.
 *
 * NOTE: Page indices are 0-based (PDF page 162 in print = index 161).
 * Adjust PAGE_OFFSET if the PDF has unnumbered cover pages.
 */

// ─────────────────────────── CONSTANTS ───────────────────────────

/** Offset from printed page number to 0-based PDF index. */
export const PAGE_OFFSET = 1;

/** Target output resolution for each card image. */
export const CARD_TARGET_SIZE = { width: 750, height: 1050 };

/** DPI for rendering PDF pages to images (higher = better quality, slower). */
export const RENDER_DPI = 300;

// ─────────────────────── GRID LAYOUTS ────────────────────────────

/** Grid dimensions for different card types. */
export interface GridLayout {
  cols: number;
  rows: number;
  /** Margin around each card in the grid (px at rendered DPI), adjustable per page. */
  marginX: number;
  marginY: number;
  /** Offset from top-left of page to the first card (px at rendered DPI). */
  offsetX: number;
  offsetY: number;
}

/** Archetype cards: 3 columns x 3 rows = 9 cards per page. */
export const ARCHETYPE_GRID: GridLayout = {
  cols: 3,
  rows: 3,
  marginX: 0,
  marginY: 0,
  offsetX: 0,
  offsetY: 0,
};

/** Age cards: 4 columns x 2 rows = 8 cards per page. */
export const AGE_GRID: GridLayout = {
  cols: 4,
  rows: 2,
  marginX: 0,
  marginY: 0,
  offsetX: 0,
  offsetY: 0,
};

// ─────────────────── PAGE RANGE DEFINITIONS ──────────────────────

/** Defines a range of pages for a card category. */
export interface PageRange {
  /** Human-readable category name. */
  category: 'archetype' | 'age1' | 'age2' | 'age3' | 'backdrop';
  /** Output subdirectory name. */
  outputDir: string;
  /** 0-based PDF page index of the fronts page. */
  frontsPage: number;
  /** 0-based PDF page index of the backs page. */
  backsPage: number;
  /** Grid layout for this category. */
  grid: GridLayout;
  /** Expected number of cards on this page pair. */
  expectedCards: number;
}

/**
 * Page ranges mapping.
 *
 * IMPORTANT: These page indices are estimates based on the PRD description
 * (printed pages 162-185). After the first run, visually inspect the output
 * and adjust these values if cards don't align correctly.
 *
 * To inspect: run the script with --debug flag to output full page images.
 */
export const PAGE_RANGES: PageRange[] = [
  // Archetypes — printed pages 162-163
  {
    category: 'archetype',
    outputDir: 'archetypes',
    frontsPage: 161,
    backsPage: 162,
    grid: ARCHETYPE_GRID,
    expectedCards: 9,
  },
  // Age 1 — printed pages 164-167 (2 page-pairs)
  {
    category: 'age1',
    outputDir: 'age1',
    frontsPage: 163,
    backsPage: 164,
    grid: AGE_GRID,
    expectedCards: 8,
  },
  {
    category: 'age1',
    outputDir: 'age1',
    frontsPage: 165,
    backsPage: 166,
    grid: AGE_GRID,
    expectedCards: 8,
  },
  // Age 2 — printed pages 168-171
  {
    category: 'age2',
    outputDir: 'age2',
    frontsPage: 167,
    backsPage: 168,
    grid: AGE_GRID,
    expectedCards: 8,
  },
  {
    category: 'age2',
    outputDir: 'age2',
    frontsPage: 169,
    backsPage: 170,
    grid: AGE_GRID,
    expectedCards: 8,
  },
  // Age 3 — printed pages 172-175
  {
    category: 'age3',
    outputDir: 'age3',
    frontsPage: 171,
    backsPage: 172,
    grid: AGE_GRID,
    expectedCards: 8,
  },
  {
    category: 'age3',
    outputDir: 'age3',
    frontsPage: 173,
    backsPage: 174,
    grid: AGE_GRID,
    expectedCards: 8,
  },
];

// ───────────────── FRONT/BACK ZIG-ZAG MAPPING ────────────────────

/**
 * Maps a front card grid position to its corresponding back card position.
 * In double-sided printing, the back page is horizontally mirrored:
 * front (row, col) maps to back (row, gridCols - 1 - col).
 *
 * @param row - 0-based row index on the front page
 * @param col - 0-based column index on the front page
 * @param gridCols - Total number of columns in the grid
 * @returns The corresponding { row, col } on the back page
 *
 * @example
 * // In a 4-col grid, front (0, 0) maps to back (0, 3)
 * mapFrontToBack(0, 0, 4) // → { row: 0, col: 3 }
 */
export const mapFrontToBack = (
  row: number,
  col: number,
  gridCols: number
): { row: number; col: number } => {
  return {
    row,
    col: gridCols - 1 - col,
  };
};
