import { describe, it, expect } from "@jest/globals";
import {
  validateDeck,
  calculateDeckCost,
  canAddCardToDeck,
  getRemainingCostBudget,
  DECK_RULES,
} from "../../cards/DeckValidator";
import { CreatureCard } from "../../cards/CreatureCard";
import { SupportCard } from "../../cards/SupportCard";
import { ActionCard } from "../../cards/ActionCard";
import { CardType, Affinity } from "../../cards/types";

function createCreatureCard(id: string, cost: number) {
  return new CreatureCard({
    id,
    name: `Creature ${id}`,
    type: CardType.Creature,
    description: "Test creature",
    cost,
    atk: 1000,
    def: 500,
    hp: 2000,
    affinity: Affinity.Fire,
    rarity: "C",
    set: "Base",
  });
}

function createSupportCard(id: string, cost: number) {
  return new SupportCard({
    id,
    name: `Support ${id}`,
    type: CardType.Support,
    description: "Test support",
    cost,
    affinity: Affinity.Water,
    rarity: "C",
    set: "Base",
    effectId: "test_effect",
  });
}

function createActionCard(id: string, cost: number) {
  return new ActionCard({
    id,
    name: `Action ${id}`,
    type: CardType.Action,
    description: "Test action",
    cost,
    affinity: Affinity.Grass,
    rarity: "C",
    set: "Base",
    effectId: "test_effect",
    speed: "NORMAL",
  });
}

describe("DeckValidator Integration Tests", () => {
  describe("Card Addition Logic", () => {
    it("can validate adding a card to an empty deck", () => {
      const deck: any[] = [];
      const card = createCreatureCard("card-1", 3);

      const canAdd = canAddCardToDeck(deck, card);

      expect(canAdd.canAdd).toBe(true);
      expect(calculateDeckCost([card])).toBe(3);
    });

    it("calculates deck cost correctly", () => {
      const deck = [
        createCreatureCard("card-1", 2),
        createCreatureCard("card-2", 3),
      ];

      const totalCost = calculateDeckCost(deck);

      expect(totalCost).toBe(5);
    });

    it("validates a valid 20-card deck", () => {
      const deck = Array.from({ length: 20 }, (_, i) =>
        createCreatureCard(`card-${i}`, 2)
      );

      const result = validateDeck(deck);

      expect(result.isValid).toBe(true);
    });
  });

  describe("Card Copy Limits", () => {
    it("allows adding cards up to deck size limit", () => {
      const card = createCreatureCard("card-1", 2);
      const fullDeck = Array.from({ length: 20 }, (_, i) =>
        createCreatureCard(`card-${i}`, 2)
      );

      const canAdd = canAddCardToDeck(fullDeck, card);

      expect(canAdd.canAdd).toBe(false);
      expect(canAdd.reason).toContain("Deck is full");
    });

    it("allows exactly 3 copies of the same card", () => {
      const card = createCreatureCard("card-1", 2);
      const deck = [card, card];

      const canAdd = canAddCardToDeck(deck, card);

      expect(canAdd.canAdd).toBe(true);
    });

    it("prevents exceeding cost limit", () => {
      // Deck with 50 cost
      const deck = Array.from({ length: 10 }, (_, i) =>
        createCreatureCard(`card-${i}`, 5)
      );

      const expensiveCard = createCreatureCard("expensive", 5);
      const canAdd = canAddCardToDeck(deck, expensiveCard);

      expect(canAdd.canAdd).toBe(false);
      expect(canAdd.reason).toContain("exceed cost limit");
    });

    it("calculates remaining cost budget", () => {
      const deck = [createCreatureCard("card-1", 10)];

      const remaining = getRemainingCostBudget(deck);

      expect(remaining).toBe(40);
    });

    it("works with different card types", () => {
      const deck = [
        createCreatureCard("creature", 2),
        createSupportCard("support", 3),
        createActionCard("action", 4),
      ];

      const totalCost = calculateDeckCost(deck);

      expect(totalCost).toBe(9);
      expect(deck).toHaveLength(3);
    });
  });

  describe("Deck Validation Rules", () => {
    it("rejects deck with too few cards", () => {
      const deck = Array.from({ length: 15 }, (_, i) =>
        createCreatureCard(`card-${i}`, 2)
      );

      const result = validateDeck(deck);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Deck has too few cards: 15/20 minimum");
    });

    it("accepts valid deck with exactly 20 cards", () => {
      const deck = Array.from({ length: 20 }, (_, i) =>
        createCreatureCard(`card-${i}`, 2)
      );

      const result = validateDeck(deck);

      expect(result.isValid).toBe(true);
      expect(result.stats.cardCount).toBe(20);
    });

    it("rejects deck when cost exceeds limit", () => {
      const deck = Array.from({ length: 20 }, (_, i) =>
        createCreatureCard(`card-${i}`, 3)
      );

      const result = validateDeck(deck);

      expect(result.stats.totalCost).toBe(60);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e: string) => e.includes("exceeds limit"))
      ).toBe(true);
    });

    it("provides accurate validation statistics", () => {
      const deck = Array.from({ length: 20 }, (_, i) =>
        createCreatureCard(`card-${i}`, 2)
      );

      const result = validateDeck(deck);
      const stats = result.stats;

      expect(stats.cardCount).toBe(20);
      expect(stats.totalCost).toBe(40);
      expect(stats.averageCost).toBe(2);
    });
  });

  describe("Edge Cases", () => {
    it("handles zero-cost cards", () => {
      const freeCard = createCreatureCard("free", 0);
      const deck = [freeCard];

      const cost = calculateDeckCost(deck);

      expect(cost).toBe(0);
    });

    it("maintains DECK_RULES constants", () => {
      expect(DECK_RULES.MIN_DECK_SIZE).toBe(20);
      expect(DECK_RULES.MAX_DECK_SIZE).toBe(20);
      expect(DECK_RULES.MAX_TOTAL_COST).toBe(50);
    });

    it("calculates remaining budget correctly at different levels", () => {
      const emptyDeck: any[] = [];
      const halfDeck = Array.from({ length: 10 }, (_, i) =>
        createCreatureCard(`card-${i}`, 2.5)
      );
      const fullDeck = Array.from({ length: 10 }, (_, i) =>
        createCreatureCard(`card-${i}`, 5)
      );

      expect(getRemainingCostBudget(emptyDeck)).toBe(50);
      expect(getRemainingCostBudget(halfDeck)).toBe(25);
      expect(getRemainingCostBudget(fullDeck)).toBe(0);
    });
  });
});
