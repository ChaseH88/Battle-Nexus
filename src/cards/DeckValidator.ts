import { CardInterface } from "@cards/types";

/**
 * Configuration for deck building rules
 */
export const DECK_RULES = {
  MIN_DECK_SIZE: 20,
  MAX_DECK_SIZE: 20,
  MAX_TOTAL_COST: 50,
} as const;

/**
 * Result of deck validation
 */
export interface DeckValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    cardCount: number;
    totalCost: number;
    averageCost: number;
  };
}

/**
 * Validates a deck against the game rules
 *
 * Rules:
 * - Deck must contain exactly 20 cards
 * - Total cost of all cards must not exceed 50
 * - All cards must have a valid cost property
 *
 * @param deck Array of cards to validate
 * @returns Validation result with errors, warnings, and stats
 */
export function validateDeck(deck: CardInterface[]): DeckValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check deck size
  if (deck.length < DECK_RULES.MIN_DECK_SIZE) {
    errors.push(
      `Deck has too few cards: ${deck.length}/${DECK_RULES.MIN_DECK_SIZE} minimum`
    );
  } else if (deck.length > DECK_RULES.MAX_DECK_SIZE) {
    errors.push(
      `Deck has too many cards: ${deck.length}/${DECK_RULES.MAX_DECK_SIZE} maximum`
    );
  }

  // Calculate total cost and validate individual card costs
  let totalCost = 0;
  const cardsWithoutCost: string[] = [];

  deck.forEach((card, index) => {
    if (card.cost === undefined || card.cost === null) {
      cardsWithoutCost.push(`${card.name} (index ${index})`);
    } else {
      totalCost += card.cost;
    }
  });

  if (cardsWithoutCost.length > 0) {
    errors.push(`Cards without cost value: ${cardsWithoutCost.join(", ")}`);
  }

  // Check total cost
  if (totalCost > DECK_RULES.MAX_TOTAL_COST) {
    errors.push(
      `Total deck cost exceeds limit: ${totalCost}/${DECK_RULES.MAX_TOTAL_COST}`
    );
  }

  // Add warnings for edge cases
  if (
    totalCost < DECK_RULES.MAX_TOTAL_COST * 0.6 &&
    deck.length >= DECK_RULES.MIN_DECK_SIZE
  ) {
    warnings.push(
      `Deck cost is quite low (${totalCost}/${DECK_RULES.MAX_TOTAL_COST}). Consider adding stronger cards.`
    );
  }

  const averageCost = deck.length > 0 ? totalCost / deck.length : 0;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      cardCount: deck.length,
      totalCost,
      averageCost: Math.round(averageCost * 100) / 100,
    },
  };
}

/**
 * Calculates the total cost of a deck
 *
 * @param deck Array of cards
 * @returns Total cost of all cards in the deck
 */
export function calculateDeckCost(deck: CardInterface[]): number {
  return deck.reduce((total, card) => {
    return total + (card.cost ?? 0);
  }, 0);
}

/**
 * Checks if adding a card to the deck would exceed the cost limit
 *
 * @param currentDeck Current deck
 * @param cardToAdd Card to potentially add
 * @returns Object with canAdd boolean and reason if false
 */
export function canAddCardToDeck(
  currentDeck: CardInterface[],
  cardToAdd: CardInterface
): { canAdd: boolean; reason?: string } {
  if (currentDeck.length >= DECK_RULES.MAX_DECK_SIZE) {
    return {
      canAdd: false,
      reason: `Deck is full (${DECK_RULES.MAX_DECK_SIZE} cards maximum)`,
    };
  }

  const currentCost = calculateDeckCost(currentDeck);
  const newCardCost = cardToAdd.cost ?? 0;
  const newTotalCost = currentCost + newCardCost;

  if (newTotalCost > DECK_RULES.MAX_TOTAL_COST) {
    return {
      canAdd: false,
      reason: `Adding this card would exceed cost limit (${newTotalCost}/${DECK_RULES.MAX_TOTAL_COST})`,
    };
  }

  return { canAdd: true };
}

/**
 * Gets remaining cost budget for a deck
 *
 * @param deck Current deck
 * @returns Remaining cost that can be added to the deck
 */
export function getRemainingCostBudget(deck: CardInterface[]): number {
  const currentCost = calculateDeckCost(deck);
  return Math.max(0, DECK_RULES.MAX_TOTAL_COST - currentCost);
}
