/**
 * Asset Extraction Script — Extracts card images from Dialect.pdf.
 *
 * Renders PDF pages to images, slices grids into individual cards,
 * rotates to vertical orientation, pairs fronts with backs, and
 * generates an assets.json manifest.
 *
 * Usage:
 *   npx tsx scripts/extract-assets.ts
 *   npx tsx scripts/extract-assets.ts --debug    (saves full-page renders)
 *   npx tsx scripts/extract-assets.ts --upscale  (enhance low-res source)
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

import {
  PAGE_RANGES,
  CARD_TARGET_SIZE,
  RENDER_DPI,
  mapFrontToBack,
} from './card-maps.js';
import type { PageRange, GridLayout } from './card-maps.js';

// ─────────────────────────── CONSTANTS ───────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PDF_PATH = path.join(PROJECT_ROOT, 'Dialect.pdf');
const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets');
const DEBUG_DIR = path.join(ASSETS_DIR, 'debug');

// Parse CLI flags
const DEBUG = process.argv.includes('--debug');
const UPSCALE = process.argv.includes('--upscale');

// ────────────────────── TYPES ────────────────────────────────────

interface CardManifestEntry {
  id: string;
  type: 'archetype' | 'age';
  age: number | null;
  front: string;
  back: string;
}

interface AssetManifest {
  cards: CardManifestEntry[];
  metadata: {
    extractedAt: string;
    sourceFile: string;
    totalCards: number;
    targetSize: { width: number; height: number };
  };
}

// ─────────────────── DIRECTORY SETUP ─────────────────────────────

/**
 * Creates all required output directories if they don't exist.
 */
const ensureDirectories = (): void => {
  const dirs = [
    ASSETS_DIR,
    path.join(ASSETS_DIR, 'archetypes'),
    path.join(ASSETS_DIR, 'age1'),
    path.join(ASSETS_DIR, 'age2'),
    path.join(ASSETS_DIR, 'age3'),
    path.join(ASSETS_DIR, 'backdrops'),
  ];

  if (DEBUG) dirs.push(DEBUG_DIR);

  for (const dir of dirs) {
    mkdirSync(dir, { recursive: true });
  }
};

// ────────────────── PDF PAGE RENDERING ───────────────────────────

/**
 * Dynamically imports pdf-to-img and renders specific pages to buffers.
 *
 * @param pdfPath - Path to the PDF file
 * @param pageIndices - 0-based page indices to render
 * @returns Map of page index to PNG buffer
 */
const renderPdfPages = async (
  pdfPath: string,
  pageIndices: number[]
): Promise<Map<number, Buffer>> => {
  // pdf-to-img is ESM-only, use dynamic import
  const { pdf } = await import('pdf-to-img');

  const pdfBuffer = readFileSync(pdfPath);
  const pages = new Map<number, Buffer>();

  console.log(`  Rendering ${pageIndices.length} unique pages from PDF...`);

  let pageIdx = 0;
  const neededSet = new Set(pageIndices);

  // pdf-to-img returns a promise of an async iterable — await it first
  const document = await pdf(pdfBuffer, {
    scale: RENDER_DPI / 72, // 72 DPI is the PDF default
  });

  for await (const image of document) {
    if (neededSet.has(pageIdx)) {
      pages.set(pageIdx, Buffer.from(image));
      console.log(`    Page ${pageIdx} rendered (${Buffer.from(image).length} bytes)`);

      if (DEBUG) {
        const debugPath = path.join(DEBUG_DIR, `page-${pageIdx}.png`);
        writeFileSync(debugPath, Buffer.from(image));
      }
    }
    pageIdx++;
  }

  return pages;
};

// ─────────────── GRID SLICING + CARD EXTRACTION ──────────────────

/**
 * Extracts individual card images from a rendered page image by slicing the grid.
 *
 * @param pageBuffer - PNG buffer of the full rendered page
 * @param grid - Grid layout definition
 * @returns Array of { row, col, buffer } for each extracted card
 */
const sliceGrid = async (
  pageBuffer: Buffer,
  grid: GridLayout
): Promise<{ row: number; col: number; buffer: Buffer }[]> => {
  const metadata = await sharp(pageBuffer).metadata();
  const pageWidth = metadata.width || 0;
  const pageHeight = metadata.height || 0;

  // Usable area after offsets
  const usableWidth = pageWidth - 2 * grid.offsetX;
  const usableHeight = pageHeight - 2 * grid.offsetY;

  // Card dimensions within the grid
  const cardWidth = Math.floor(
    (usableWidth - (grid.cols - 1) * grid.marginX) / grid.cols
  );
  const cardHeight = Math.floor(
    (usableHeight - (grid.rows - 1) * grid.marginY) / grid.rows
  );

  const cards: { row: number; col: number; buffer: Buffer }[] = [];

  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const left = grid.offsetX + col * (cardWidth + grid.marginX);
      const top = grid.offsetY + row * (cardHeight + grid.marginY);

      // Clamp to page bounds
      const safeWidth = Math.min(cardWidth, pageWidth - left);
      const safeHeight = Math.min(cardHeight, pageHeight - top);

      if (safeWidth <= 0 || safeHeight <= 0) continue;

      const buffer = await sharp(pageBuffer)
        .extract({
          left,
          top,
          width: safeWidth,
          height: safeHeight,
        })
        .toBuffer();

      cards.push({ row, col, buffer });
    }
  }

  return cards;
};

// ────────────────── CARD PROCESSING ──────────────────────────────

/**
 * Rotates, resizes, and converts a card image to the target specification.
 *
 * @param buffer - Raw card image buffer
 * @param isFront - Whether this is a front (rotate CW) or back (rotate CCW)
 * @returns Processed card image buffer in webp format
 */
const processCard = async (
  buffer: Buffer,
  isFront: boolean
): Promise<Buffer> => {
  let pipeline = sharp(buffer);

  // Rotate: fronts 90 CW, backs 90 CCW
  pipeline = pipeline.rotate(isFront ? 90 : -90);

  // Resize to target dimensions
  pipeline = pipeline.resize(
    CARD_TARGET_SIZE.width,
    CARD_TARGET_SIZE.height,
    { fit: 'fill' }
  );

  // Upscale enhancement if flag is set
  if (UPSCALE) {
    pipeline = pipeline.sharpen({ sigma: 1.5 });
  }

  // Convert to webp
  return pipeline.webp({ quality: 90 }).toBuffer();
};

// ──────────────── MAIN EXTRACTION PIPELINE ───────────────────────

const main = async (): Promise<void> => {
  console.log('\n  Dialect Asset Extraction');
  console.log('  ────────────────────────\n');

  // Verify PDF exists
  if (!existsSync(PDF_PATH)) {
    console.error(`  ERROR: Dialect.pdf not found at ${PDF_PATH}`);
    console.error('  Place the PDF in the project root directory.');
    process.exit(1);
  }

  ensureDirectories();

  // Collect all unique page indices we need to render
  const allPageIndices = new Set<number>();
  for (const range of PAGE_RANGES) {
    allPageIndices.add(range.frontsPage);
    allPageIndices.add(range.backsPage);
  }

  // Render all needed PDF pages
  const pageImages = await renderPdfPages(
    PDF_PATH,
    Array.from(allPageIndices).sort((a, b) => a - b)
  );

  // Track card numbering per category
  const cardCounters: Record<string, number> = {};
  const manifest: CardManifestEntry[] = [];
  let totalExtracted = 0;

  // Process each page range
  for (const range of PAGE_RANGES) {
    const { category, outputDir, frontsPage, backsPage, grid } = range;

    console.log(`  Processing ${category} (pages ${frontsPage}-${backsPage})...`);

    const frontsImage = pageImages.get(frontsPage);
    const backsImage = pageImages.get(backsPage);

    if (!frontsImage || !backsImage) {
      console.warn(`    WARNING: Missing page image for ${category}. Skipping.`);
      continue;
    }

    // Slice both pages into grids
    const frontCards = await sliceGrid(frontsImage, grid);
    const backCards = await sliceGrid(backsImage, grid);

    // Build lookup for back cards by position
    const backCardMap = new Map<string, Buffer>();
    for (const card of backCards) {
      backCardMap.set(`${card.row}-${card.col}`, card.buffer);
    }

    // Process each front card and pair with its back
    if (!cardCounters[category]) cardCounters[category] = 0;

    for (const frontCard of frontCards) {
      cardCounters[category]++;
      const cardNum = String(cardCounters[category]).padStart(2, '0');
      const cardId = category === 'archetype'
        ? `archetype-${cardNum}`
        : `${category}-${cardNum}`;

      // Find the matching back card using zig-zag mapping
      const backPos = mapFrontToBack(frontCard.row, frontCard.col, grid.cols);
      const backBuffer = backCardMap.get(`${backPos.row}-${backPos.col}`);

      if (!backBuffer) {
        console.warn(`    WARNING: No back card found for ${cardId} at back position (${backPos.row}, ${backPos.col}). Skipping.`);
        continue;
      }

      // Process front and back images
      const frontProcessed = await processCard(frontCard.buffer, true);
      const backProcessed = await processCard(backBuffer, false);

      // Save to disk
      const frontFilename = `${cardId}-front.webp`;
      const backFilename = `${cardId}-back.webp`;
      const frontPath = path.join(ASSETS_DIR, outputDir, frontFilename);
      const backPath = path.join(ASSETS_DIR, outputDir, backFilename);

      writeFileSync(frontPath, frontProcessed);
      writeFileSync(backPath, backProcessed);

      // Add to manifest
      const ageNum = category.startsWith('age')
        ? parseInt(category.replace('age', ''))
        : null;

      manifest.push({
        id: cardId,
        type: category === 'archetype' ? 'archetype' : 'age',
        age: ageNum,
        front: `${outputDir}/${frontFilename}`,
        back: `${outputDir}/${backFilename}`,
      });

      totalExtracted++;
    }

    console.log(`    Extracted ${frontCards.length} cards from ${category}`);
  }

  // Write manifest
  const manifestData: AssetManifest = {
    cards: manifest,
    metadata: {
      extractedAt: new Date().toISOString(),
      sourceFile: 'Dialect.pdf',
      totalCards: totalExtracted,
      targetSize: CARD_TARGET_SIZE,
    },
  };

  const manifestPath = path.join(ASSETS_DIR, 'assets.json');
  writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));

  console.log(`\n  Extraction complete!`);
  console.log(`  ─────────────────────`);
  console.log(`  Total cards: ${totalExtracted}`);
  console.log(`  Manifest: ${manifestPath}`);
  console.log(`  Output: ${ASSETS_DIR}\n`);
};

// ─────────────────────── RUN ─────────────────────────────────────

main().catch((err) => {
  console.error('  Extraction failed:', err);
  process.exit(1);
});
