import { describe, it, expect, beforeEach } from "@jest/globals";
import { loadDeckFromLocalStorage, hasSavedDeck } from "../deckLoader";
import { CardType } from "../../cards/types";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("Deck Loader Utilities", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("hasSavedDeck", () => {
    it("returns false when no deck is saved", () => {
      expect(hasSavedDeck()).toBe(false);
    });

    it("returns true when a deck exists in localStorage", () => {
      localStorageMock.setItem(
        "battle-nexus-deck",
        JSON.stringify([{ cardId: "BN-CORE-001", count: 1 }])
      );
      expect(hasSavedDeck()).toBe(true);
    });

    it("returns false after deck is removed", () => {
      localStorageMock.setItem(
        "battle-nexus-deck",
        JSON.stringify([{ cardId: "BN-CORE-001", count: 1 }])
      );
      expect(hasSavedDeck()).toBe(true);

      localStorageMock.removeItem("battle-nexus-deck");
      expect(hasSavedDeck()).toBe(false);
    });
  });

  describe("loadDeckFromLocalStorage", () => {
    it("returns null when no deck is saved", () => {
      const deck = loadDeckFromLocalStorage();
      expect(deck).toBeNull();
    });

    it("loads a valid deck from localStorage", () => {
      const savedDeck = [
        { cardId: "ember_cub", count: 2 },
        { cardId: "riptide_pixie", count: 1 },
      ];
      localStorageMock.setItem("battle-nexus-deck", JSON.stringify(savedDeck));

      const deck = loadDeckFromLocalStorage();

      expect(deck).not.toBeNull();
      expect(deck).toHaveLength(3); // 2 + 1 = 3 cards
    });

    it("creates correct card instances with proper types", () => {
      const savedDeck = [
        { cardId: "ember_cub", count: 1 }, // Creature
        { cardId: "ignite_burst", count: 1 }, // Support
        { cardId: "card_draw_spell", count: 1 }, // Action
      ];
      localStorageMock.setItem("battle-nexus-deck", JSON.stringify(savedDeck));

      const deck = loadDeckFromLocalStorage();

      expect(deck).not.toBeNull();
      expect(deck).toHaveLength(3);

      // Check card types are properly instantiated
      const types = deck!.map((card) => card.type);
      expect(types).toContain(CardType.Creature);
      expect(types).toContain(CardType.Magic);
      expect(types).toContain(CardType.Magic);
    });

    it("expands card counts correctly", () => {
      const savedDeck = [{ cardId: "ember_cub", count: 3 }];
      localStorageMock.setItem("battle-nexus-deck", JSON.stringify(savedDeck));

      const deck = loadDeckFromLocalStorage();

      expect(deck).not.toBeNull();
      expect(deck).toHaveLength(3);

      // All three should be the same card
      const uniqueIds = new Set(deck!.map((card) => card.id));
      expect(uniqueIds.size).toBe(1);
    });

    it("handles multiple cards with different counts", () => {
      const savedDeck = [
        { cardId: "ember_cub", count: 3 },
        { cardId: "riptide_pixie", count: 2 },
        { cardId: "mossback_scarab", count: 1 },
      ];
      localStorageMock.setItem("battle-nexus-deck", JSON.stringify(savedDeck));

      const deck = loadDeckFromLocalStorage();

      expect(deck).not.toBeNull();
      expect(deck).toHaveLength(6); // 3 + 2 + 1 = 6
    });

    it("skips cards that don't exist in card data", () => {
      const savedDeck = [
        { cardId: "INVALID-CARD-ID", count: 2 },
        { cardId: "ember_cub", count: 1 },
      ];
      localStorageMock.setItem("battle-nexus-deck", JSON.stringify(savedDeck));

      // Mock console.warn to check it's called
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const deck = loadDeckFromLocalStorage();

      expect(deck).not.toBeNull();
      expect(deck).toHaveLength(1); // Only the valid card
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Card not found: INVALID-CARD-ID")
      );

      consoleSpy.mockRestore();
    });

    it("returns null and logs error on invalid JSON", () => {
      localStorageMock.setItem("battle-nexus-deck", "invalid json {");

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const deck = loadDeckFromLocalStorage();

      expect(deck).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to load deck"),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("returns null on corrupted deck data structure", () => {
      // Valid JSON but wrong structure
      localStorageMock.setItem(
        "battle-nexus-deck",
        JSON.stringify({ wrong: "format" })
      );

      const deck = loadDeckFromLocalStorage();

      expect(deck).toBeNull();
    });

    it("handles empty deck array", () => {
      localStorageMock.setItem("battle-nexus-deck", JSON.stringify([]));

      const deck = loadDeckFromLocalStorage();

      expect(deck).not.toBeNull();
      expect(deck).toHaveLength(0);
    });

    it("preserves card properties when loading", () => {
      const savedDeck = [{ cardId: "ember_cub", count: 1 }];
      localStorageMock.setItem("battle-nexus-deck", JSON.stringify(savedDeck));

      const deck = loadDeckFromLocalStorage();

      expect(deck).not.toBeNull();
      expect(deck![0]).toHaveProperty("id");
      expect(deck![0]).toHaveProperty("name");
      expect(deck![0]).toHaveProperty("type");
      expect(deck![0]).toHaveProperty("cost");
      expect(deck![0]).toHaveProperty("affinity");
    });

    it("creates independent card instances", () => {
      const savedDeck = [{ cardId: "ember_cub", count: 2 }];
      localStorageMock.setItem("battle-nexus-deck", JSON.stringify(savedDeck));

      const deck = loadDeckFromLocalStorage();

      expect(deck).not.toBeNull();
      expect(deck).toHaveLength(2);

      // Modify one card
      if (deck![0].type === CardType.Creature) {
        (deck![0] as any).currentHp = 100;
      }

      // Other card should remain unaffected (different instance)
      expect(deck![0]).not.toBe(deck![1]);
    });

    it("handles cards with zero count", () => {
      const savedDeck = [
        { cardId: "ember_cub", count: 0 },
        { cardId: "riptide_pixie", count: 1 },
      ];
      localStorageMock.setItem("battle-nexus-deck", JSON.stringify(savedDeck));

      const deck = loadDeckFromLocalStorage();

      expect(deck).not.toBeNull();
      expect(deck).toHaveLength(1); // Only the card with count > 0
    });

    it("handles negative count gracefully", () => {
      const savedDeck = [{ cardId: "ember_cub", count: -1 }];
      localStorageMock.setItem("battle-nexus-deck", JSON.stringify(savedDeck));

      const deck = loadDeckFromLocalStorage();

      // Should not crash, should handle gracefully
      expect(deck).not.toBeNull();
    });
  });

  describe("Integration with card types", () => {
    it("loads Creature cards with combat stats", () => {
      const savedDeck = [{ cardId: "ember_cub", count: 1 }];
      localStorageMock.setItem("battle-nexus-deck", JSON.stringify(savedDeck));

      const deck = loadDeckFromLocalStorage();
      const creature = deck![0];

      if (creature.type === CardType.Creature) {
        expect(creature).toHaveProperty("atk");
        expect(creature).toHaveProperty("def");
        expect(creature).toHaveProperty("hp");
      }
    });

    it("loads Support cards correctly", () => {
      const savedDeck = [{ cardId: "ignite_burst", count: 1 }];
      localStorageMock.setItem("battle-nexus-deck", JSON.stringify(savedDeck));

      const deck = loadDeckFromLocalStorage();

      expect(deck).not.toBeNull();
      expect(deck![0].type).toBe(CardType.Magic);
    });

    it("loads Action cards correctly", () => {
      const savedDeck = [{ cardId: "card_draw_spell", count: 1 }];
      localStorageMock.setItem("battle-nexus-deck", JSON.stringify(savedDeck));

      const deck = loadDeckFromLocalStorage();

      expect(deck).not.toBeNull();
      expect(deck![0].type).toBe(CardType.Magic);
    });
  });

  describe("Persistence", () => {
    it("survives multiple load operations", () => {
      const savedDeck = [{ cardId: "ember_cub", count: 2 }];
      localStorageMock.setItem("battle-nexus-deck", JSON.stringify(savedDeck));

      const deck1 = loadDeckFromLocalStorage();
      const deck2 = loadDeckFromLocalStorage();

      expect(deck1).toHaveLength(2);
      expect(deck2).toHaveLength(2);
      expect(deck1).not.toBe(deck2); // Different instances
    });

    it("doesn't modify localStorage when loading", () => {
      const savedDeck = [{ cardId: "BN-CORE-001", count: 1 }];
      const deckJSON = JSON.stringify(savedDeck);
      localStorageMock.setItem("battle-nexus-deck", deckJSON);

      loadDeckFromLocalStorage();

      const afterLoad = localStorageMock.getItem("battle-nexus-deck");
      expect(afterLoad).toBe(deckJSON);
    });
  });
});
