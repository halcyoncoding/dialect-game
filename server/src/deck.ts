import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Card, GameState } from './types.js';

// ─────────────────────────── CONSTANTS ───────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_ASSETS_PATH = path.join(PROJECT_ROOT, 'assets', 'assets.json');

// ──────────────────── ASSET MANIFEST TYPE ─────────────────────────

interface AssetManifestEntry {
  id: string;
  type: 'archetype' | 'age';
  age: number | null;
  front: string;
  back: string;
}

interface AssetManifest {
  cards: AssetManifestEntry[];
  metadata: {
    extractedAt: string;
    sourceFile: string;
    totalCards: number;
    targetSize: { width: number; height: number };
  };
}

// ──────────────────── CARD LOADING ───────────────────────────────

/**
 * Loads card definitions from the assets.json manifest file.
 * Returns a record of Card objects keyed by ID.
 *
 * @param assetsJsonPath - Path to assets.json (defaults to project assets dir)
 * @returns Record of Card objects keyed by card ID
 * @throws Error if assets.json is missing or malformed
 *
 * @example
 * const cards = loadCards();
 * console.log(cards['age1-01'].frontImage); // "age1/age1-01-front.webp"
 */
export const loadCards = (
  assetsJsonPath: string = DEFAULT_ASSETS_PATH
): Record<string, Card> => {
  if (!existsSync(assetsJsonPath)) {
    console.warn(
      `[Deck] assets.json not found at ${assetsJsonPath}. ` +
      'Run "npm run extract-assets" to generate card images first. ' +
      'Using empty card set.'
    );
    return {};
  }

  const raw = readFileSync(assetsJsonPath, 'utf-8');
  const manifest: AssetManifest = JSON.parse(raw);
  const cards: Record<string, Card> = {};

  for (const entry of manifest.cards) {
    cards[entry.id] = {
      id: entry.id,
      age: entry.type === 'archetype'
        ? 'archetype'
        : (entry.age as 1 | 2 | 3),
      frontImage: `/assets/${entry.front}`,
      backImage: `/assets/${entry.back}`,
      connectionId: null,
    };
  }

  return cards;
};

// ──────────────────── FISHER-YATES SHUFFLE ───────────────────────

/**
 * Shuffles an array of card IDs in place using the Fisher-Yates algorithm.
 * Returns a new shuffled copy — does not mutate the input.
 *
 * @param cardIds - Array of card ID strings to shuffle
 * @returns A new array with the same elements in random order
 *
 * @example
 * const shuffled = shuffleDeck(['a', 'b', 'c']);
 */
export const shuffleDeck = (cardIds: string[]): string[] => {
  const deck = [...cardIds];

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

// ──────────────────── DECK INITIALIZATION ─────────────────────────

/**
 * Initializes all game decks from the loaded card definitions.
 * Sorts cards into their age-specific decks and shuffles each deck.
 *
 * @param state - The current game state to populate
 * @param cards - Record of Card objects from loadCards()
 * @returns Updated state with populated and shuffled decks
 *
 * @example
 * const cards = loadCards();
 * const updatedState = initializeDecks(state, cards);
 */
export const initializeDecks = (
  state: GameState,
  cards: Record<string, Card>
): GameState => {
  // Store all card definitions in state
  state.cards = { ...cards };

  // Sort card IDs into their respective decks
  const age1Ids: string[] = [];
  const age2Ids: string[] = [];
  const age3Ids: string[] = [];
  const archetypeIds: string[] = [];

  for (const card of Object.values(cards)) {
    switch (card.age) {
      case 1:
        age1Ids.push(card.id);
        break;
      case 2:
        age2Ids.push(card.id);
        break;
      case 3:
        age3Ids.push(card.id);
        break;
      case 'archetype':
        archetypeIds.push(card.id);
        break;
    }
  }

  // Shuffle each deck independently
  state.decks.age1 = shuffleDeck(age1Ids);
  state.decks.age2 = shuffleDeck(age2Ids);
  state.decks.age3 = shuffleDeck(age3Ids);
  state.decks.archetypes = shuffleDeck(archetypeIds);
  state.decks.discard = [];

  return state;
};

// ──────────────── CARD COUNT INVARIANT CHECK ─────────────────────

/**
 * Verifies the card count invariant: total cards across all locations
 * equals the total cards loaded from assets.json.
 *
 * @param state - The current game state
 * @returns { valid: boolean, expected: number, actual: number }
 */
export const verifyCardCount = (
  state: GameState
): { valid: boolean; expected: number; actual: number } => {
  const expected = Object.keys(state.cards).length;

  let actual = 0;

  // Cards in decks
  actual += state.decks.age1.length;
  actual += state.decks.age2.length;
  actual += state.decks.age3.length;
  actual += state.decks.archetypes.length;
  actual += state.decks.discard.length;

  // Cards in player hands
  for (const player of state.players) {
    actual += player.hand.length;
  }

  // Cards assigned as archetypes
  for (const player of state.players) {
    if (player.archetype) actual += 1;
  }

  // Cards played to connections
  actual += state.connections.length;

  return { valid: actual === expected, expected, actual };
};
