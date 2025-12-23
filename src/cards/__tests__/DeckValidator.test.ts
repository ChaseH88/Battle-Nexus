import { describe, it, expect } from "@jest/globals";
import {
  validateDeck,
  calculateDeckCost,
  canAddCardToDeck,
  getRemainingCostBudget,
  DECK_RULES,
} from "@cards/DeckValidator";
import { CardInterface, CardType, Affinity } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";

function createMockCard(id: string, name: string, cost: number): CardInterface {
  return new CreatureCard({
    id,
    name,
    type: CardType.Creature,
    description: "Test card",
    cost,
    atk: 100,
    def: 100,
    hp: 500,
    affinity: Affinity.Fire,
    rarity: "C",
    set: "Base",
  });
}

describe("Deck Validation System", () => {
  describe("validateDeck", () => {
    it("accepts a valid deck with 20 cards and cost <= 50", () => {
      const deck: CardInterface[] = Array.from({ length: 20 }, (_, i) =>
        createMockCard(`card_${i}`, `Card ${i}`, 2)
      ); // Total cost: 40

      const result = validateDeck(deck);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.cardCount).toBe(20);
      expect(result.stats.totalCost).toBe(40);
      expect(result.stats.averageCost).toBe(2);
    });

    it("rejects deck with fewer than 20 cards", () => {
      const deck: CardInterface[] = Array.from({ length: 15 }, (_, i) =>
        createMockCard(`card_${i}`, `Card ${i}`, 2)
      );

      const result = validateDeck(deck);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Deck has too few cards: 15/20 minimum");
    });

    it("rejects deck with more than 20 cards", () => {
      const deck: CardInterface[] = Array.from({ length: 25 }, (_, i) =>
        createMockCard(`card_${i}`, `Card ${i}`, 2)
      );

      const result = validateDeck(deck);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Deck has too many cards: 25/20 maximum");
    });

    it("rejects deck with total cost exceeding 50", () => {
      const deck: CardInterface[] = Array.from({ length: 20 }, (_, i) =>
        createMockCard(`card_${i}`, `Card ${i}`, 3)
      ); // Total cost: 60

      const result = validateDeck(deck);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("exceeds limit"))).toBe(true);
      expect(result.stats.totalCost).toBe(60);
    });

    it("accepts deck at exactly 50 total cost", () => {
      // Mix of costs that add up to exactly 50
      const deck: CardInterface[] = [
        ...Array.from({ length: 10 }, (_, i) =>
          createMockCard(`card_${i}`, `Card ${i}`, 3)
        ), // 30
        ...Array.from({ length: 10 }, (_, i) =>
          createMockCard(`card_${i + 10}`, `Card ${i + 10}`, 2)
        ), // 20
      ]; // Total: 50

      const result = validateDeck(deck);

      expect(result.isValid).toBe(true);
      expect(result.stats.totalCost).toBe(50);
    });

    it("warns when deck cost is very low", () => {
      const deck: CardInterface[] = Array.from({ length: 20 }, (_, i) =>
        createMockCard(`card_${i}`, `Card ${i}`, 1)
      ); // Total cost: 20

      const result = validateDeck(deck);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.includes("cost is quite low"))).toBe(
        true
      );
    });

    it("handles cards without cost property", () => {
      const cardWithoutCost = {
        ...createMockCard("test", "Test", 1),
        cost: undefined,
      };
      const deck: CardInterface[] = [
        cardWithoutCost,
        ...Array.from({ length: 19 }, (_, i) =>
          createMockCard(`card_${i}`, `Card ${i}`, 2)
        ),
      ];

      const result = validateDeck(deck);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("without cost"))).toBe(true);
    });

    it("calculates average cost correctly", () => {
      const deck: CardInterface[] = [
        ...Array.from({ length: 10 }, (_, i) =>
          createMockCard(`card_${i}`, `Card ${i}`, 1)
        ), // 10
        ...Array.from({ length: 10 }, (_, i) =>
          createMockCard(`card_${i + 10}`, `Card ${i + 10}`, 3)
        ), // 30
      ]; // Total: 40, Average: 2

      const result = validateDeck(deck);

      expect(result.stats.averageCost).toBe(2);
    });
  });

  describe("calculateDeckCost", () => {
    it("calculates total cost correctly", () => {
      const deck: CardInterface[] = [
        createMockCard("1", "Card 1", 5),
        createMockCard("2", "Card 2", 3),
        createMockCard("3", "Card 3", 2),
      ];

      const totalCost = calculateDeckCost(deck);

      expect(totalCost).toBe(10);
    });

    it("handles empty deck", () => {
      const totalCost = calculateDeckCost([]);

      expect(totalCost).toBe(0);
    });

    it("treats undefined cost as 0", () => {
      const deck: CardInterface[] = [
        createMockCard("1", "Card 1", 5),
        { ...createMockCard("2", "Card 2", 3), cost: undefined },
      ];

      const totalCost = calculateDeckCost(deck);

      expect(totalCost).toBe(5);
    });
  });

  describe("canAddCardToDeck", () => {
    it("allows adding card when under cost limit", () => {
      const deck: CardInterface[] = Array.from({ length: 19 }, (_, i) =>
        createMockCard(`card_${i}`, `Card ${i}`, 2)
      ); // Total: 38

      const cardToAdd = createMockCard("new", "New Card", 5);
      const result = canAddCardToDeck(deck, cardToAdd);

      expect(result.canAdd).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("prevents adding card when it would exceed cost limit", () => {
      const deck: CardInterface[] = Array.from({ length: 19 }, (_, i) =>
        createMockCard(`card_${i}`, `Card ${i}`, 2)
      ); // Total: 38

      const cardToAdd = createMockCard("new", "New Card", 15); // Would make 53
      const result = canAddCardToDeck(deck, cardToAdd);

      expect(result.canAdd).toBe(false);
      expect(result.reason).toContain("exceed cost limit");
    });

    it("prevents adding card when deck is full", () => {
      const deck: CardInterface[] = Array.from({ length: 20 }, (_, i) =>
        createMockCard(`card_${i}`, `Card ${i}`, 1)
      );

      const cardToAdd = createMockCard("new", "New Card", 1);
      const result = canAddCardToDeck(deck, cardToAdd);

      expect(result.canAdd).toBe(false);
      expect(result.reason).toContain("Deck is full");
    });

    it("allows adding card at exact cost limit", () => {
      const deck: CardInterface[] = Array.from({ length: 19 }, (_, i) =>
        createMockCard(`card_${i}`, `Card ${i}`, 2)
      ); // Total: 38

      const cardToAdd = createMockCard("new", "New Card", 12); // Makes exactly 50
      const result = canAddCardToDeck(deck, cardToAdd);

      expect(result.canAdd).toBe(true);
    });
  });

  describe("getRemainingCostBudget", () => {
    it("calculates remaining budget correctly", () => {
      const deck: CardInterface[] = Array.from({ length: 10 }, (_, i) =>
        createMockCard(`card_${i}`, `Card ${i}`, 3)
      ); // Total: 30

      const remaining = getRemainingCostBudget(deck);

      expect(remaining).toBe(20);
    });

    it("returns 0 when at cost limit", () => {
      const deck: CardInterface[] = Array.from({ length: 20 }, (_, i) =>
        createMockCard(`card_${i}`, `Card ${i}`, 2.5)
      ); // Total: 50

      const remaining = getRemainingCostBudget(deck);

      expect(remaining).toBe(0);
    });

    it("returns 0 when over cost limit", () => {
      const deck: CardInterface[] = Array.from({ length: 20 }, (_, i) =>
        createMockCard(`card_${i}`, `Card ${i}`, 3)
      ); // Total: 60

      const remaining = getRemainingCostBudget(deck);

      expect(remaining).toBe(0);
    });

    it("returns full budget for empty deck", () => {
      const remaining = getRemainingCostBudget([]);

      expect(remaining).toBe(DECK_RULES.MAX_TOTAL_COST);
    });
  });
});
