import { CardInterface } from "../cards/types";
import cardData from "../static/card-data/bn-core.json";
import { CreatureCard } from "../cards/CreatureCard";
import { ActionCard } from "../cards/ActionCard";
import { SupportCard } from "../cards/SupportCard";

const DECK_STORAGE_KEY = "battle-nexus-deck";

function cardFactory(raw: CardInterface): CardInterface {
  switch (raw.type) {
    case "CREATURE":
      return new CreatureCard(raw as any);
    case "ACTION":
      return new ActionCard(raw as any);
    case "SUPPORT":
      return new SupportCard(raw as any);
    default:
      throw new Error(`Unknown card type: ${raw.type}`);
  }
}

export function loadDeckFromLocalStorage(): CardInterface[] | null {
  const savedDeck = localStorage.getItem(DECK_STORAGE_KEY);
  if (!savedDeck) return null;

  try {
    const deckArray = JSON.parse(savedDeck) as Array<{
      cardId: string;
      count: number;
    }>;

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
