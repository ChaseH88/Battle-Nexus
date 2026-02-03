import { CardInterface } from "../cards/types";
import cardData from "../static/card-data/bn-core.json";
import { cardFactory } from "./cardFactory";

const DECK_STORAGE_KEY = "battle-nexus-deck";

// Hardcoded AI deck configuration
const AI_DECK_CONFIG = {
  deck1: [
    { cardId: "ember_cub", count: 3 },
    { cardId: "riptide_pixie", count: 3 },
    { cardId: "mossback_scarab", count: 3 },
    { cardId: "lumen_sprite", count: 3 },
    { cardId: "inferno_lion", count: 3 },
    { cardId: "card_draw_spell", count: 3 },
    { cardId: "granite_colossus", count: 2 },
  ],
  deck2: [
    { cardId: "ember_cub", count: 3 },
    { cardId: "riptide_pixie", count: 3 },
    { cardId: "mossback_scarab", count: 3 },
    { cardId: "lumen_sprite", count: 3 },
    { cardId: "inferno_lion", count: 3 },
    { cardId: "card_draw_spell", count: 3 },
    { cardId: "granite_colossus", count: 2 },
  ],
} as const;

const getAiDeck = (): CardInterface[] => {
  const deckNames = Object.keys(AI_DECK_CONFIG);
  if (deckNames.length === 0) return [];

  const randomName = deckNames[Math.floor(Math.random() * deckNames.length)];
  const chosenList = AI_DECK_CONFIG[randomName as keyof typeof AI_DECK_CONFIG];

  const cardMap = new Map((cardData as any[]).map((c) => [c.id, c]));
  const deck: CardInterface[] = [];

  for (const { cardId, count } of chosenList) {
    const cardRaw = cardMap.get(cardId);
    if (!cardRaw) {
      console.warn(`AI deck card not found: ${cardId} (deck: ${randomName})`);
      continue;
    }

    for (let i = 0; i < count; i++) {
      deck.push(cardFactory(cardRaw));
    }
  }

  return ((arr: CardInterface[]): CardInterface[] => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  })(deck);
};

export function loadDeckFromLocalStorage(): CardInterface[] | null {
  const savedDeck = localStorage.getItem(DECK_STORAGE_KEY);
  if (!savedDeck) return null;

  try {
    const deckArray = JSON.parse(savedDeck) as Array<{
      cardId: string;
      count: number;
    }>;

    // Validate that deckArray is actually an array
    if (!Array.isArray(deckArray)) {
      console.error("Saved deck is not an array:", deckArray);
      return null;
    }

    const deck: CardInterface[] = [];
    const cardMap = new Map((cardData as any[]).map((card) => [card.id, card]));

    for (const { cardId, count } of deckArray) {
      const cardRaw = cardMap.get(cardId);
      if (!cardRaw) {
        console.warn(`Card not found: ${cardId}`);
        continue;
      }

      for (let i = 0; i < count; i++) {
        deck.push(cardFactory(cardRaw));
      }
    }

    return deck;
  } catch (error) {
    console.error("Failed to load deck from localStorage:", error);
    return null;
  }
}

export function hasSavedDeck(): boolean {
  return localStorage.getItem(DECK_STORAGE_KEY) !== null;
}

export function loadAIDeck(): CardInterface[] {
  return getAiDeck();
}
