import { useState, useMemo, useCallback } from "react";
import {
  validateDeck,
  calculateDeckCost,
  canAddCardToDeck,
  getRemainingCostBudget,
  DECK_RULES,
  DeckValidationResult,
} from "@cards/DeckValidator";
import { CardInterface } from "@cards/types";

export interface UseDeckValidatorReturn {
  // State
  deck: CardInterface[];
  validationResult: DeckValidationResult;

  // Computed values
  totalCost: number;
  remainingCost: number;
  cardCount: number;
  isValid: boolean;
  canAddMore: boolean;

  // Actions
  addCard: (card: CardInterface) => { success: boolean; reason?: string };
  removeCard: (cardId: string) => void;
  clearDeck: () => void;
  setDeck: (cards: CardInterface[]) => void;
}

/**
 * React hook for managing and validating a deck in real-time
 *
 * @param initialDeck Optional initial deck to start with
 * @returns Deck state, validation results, and deck management functions
 *
 * @example
 * ```tsx
 * const {
 *   deck,
 *   validationResult,
 *   totalCost,
 *   remainingCost,
 *   isValid,
 *   addCard,
 *   removeCard
 * } = useDeckValidator();
 *
 * // Add a card to the deck
 * const { success, reason } = addCard(myCard);
 * if (!success) {
 *   console.log(reason); // "Deck is full (20 cards maximum)"
 * }
 *
 * // Display validation errors
 * {!isValid && (
 *   <div>
 *     {validationResult.errors.map(error => (
 *       <p key={error}>{error}</p>
 *     ))}
 *   </div>
 * )}
 * ```
 */
export function useDeckValidator(
  initialDeck: CardInterface[] = []
): UseDeckValidatorReturn {
  const [deck, setDeck] = useState<CardInterface[]>(initialDeck);

  // Validate deck whenever it changes
  const validationResult = useMemo(() => validateDeck(deck), [deck]);

  // Calculate derived values
  const totalCost = useMemo(() => calculateDeckCost(deck), [deck]);
  const remainingCost = useMemo(() => getRemainingCostBudget(deck), [deck]);
  const cardCount = deck.length;
  const isValid = validationResult.isValid;
  const canAddMore = cardCount < DECK_RULES.MAX_DECK_SIZE;

  /**
   * Adds a card to the deck if it doesn't violate rules
   */
  const addCard = useCallback(
    (card: CardInterface): { success: boolean; reason?: string } => {
      const { canAdd, reason } = canAddCardToDeck(deck, card);

      if (!canAdd) {
        return { success: false, reason };
      }

      setDeck((prevDeck) => [...prevDeck, card]);
      return { success: true };
    },
    [deck]
  );

  /**
   * Removes a card from the deck by its ID
   */
  const removeCard = useCallback((cardId: string): void => {
    setDeck((prevDeck) => {
      const index = prevDeck.findIndex((card) => card.id === cardId);
      if (index === -1) return prevDeck;

      return [...prevDeck.slice(0, index), ...prevDeck.slice(index + 1)];
    });
  }, []);

  /**
   * Clears all cards from the deck
   */
  const clearDeck = useCallback((): void => {
    setDeck([]);
  }, []);

  /**
   * Sets the entire deck at once (replaces current deck)
   */
  const setDeckCallback = useCallback((cards: CardInterface[]): void => {
    setDeck(cards);
  }, []);

  return {
    // State
    deck,
    validationResult,

    // Computed values
    totalCost,
    remainingCost,
    cardCount,
    isValid,
    canAddMore,

    // Actions
    addCard,
    removeCard,
    clearDeck,
    setDeck: setDeckCallback,
  };
}
