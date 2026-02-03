// @ts-nocheck - jest-dom types not being recognized in test environment
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import DeckBuilder from "../DeckBuilder";
import { Rarity } from "@/cards";

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

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock card data
jest.mock("../../../static/card-data/bn-core.json", () => [
  {
    id: "BN-CORE-001",
    type: "CREATURE",
    name: "Fire Dragon",
    description: "A mighty fire dragon",
    cost: 5,
    atk: 2000,
    def: 1500,
    hp: 3000,
    affinity: "FIRE",
    rarity: Rarity.Rare,
    set: "BN-CORE",
  },
  {
    id: "BN-CORE-002",
    type: "CREATURE",
    name: "Water Sprite",
    description: "A graceful water creature",
    cost: 3,
    atk: 1200,
    def: 1000,
    hp: 2000,
    affinity: "WATER",
    rarity: Rarity.Common,
    set: "BN-CORE",
  },
  {
    id: "BN-CORE-003",
    type: "SUPPORT",
    name: "Healing Wave",
    description: "Restores health",
    cost: 2,
    affinity: "WATER",
    rarity: Rarity.Common,
    set: "BN-CORE",
  },
  {
    id: "BN-CORE-004",
    type: "ACTION",
    name: "Fireball",
    description: "Deals damage",
    cost: 4,
    affinity: "FIRE",
    rarity: Rarity.UltraRare,
    set: "BN-CORE",
  },
]);

describe("DeckBuilder Component", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("Rendering", () => {
    it("renders the deck builder title", () => {
      render(<DeckBuilder />);
      expect(screen.getByText("Deck Builder")).toBeInTheDocument();
    });

    it("displays all available cards", () => {
      render(<DeckBuilder />);
      expect(screen.getByText("Fire Dragon")).toBeInTheDocument();
      expect(screen.getByText("Water Sprite")).toBeInTheDocument();
      expect(screen.getByText("Healing Wave")).toBeInTheDocument();
      expect(screen.getByText("Fireball")).toBeInTheDocument();
    });

    it("shows card counter starting at 0/3", () => {
      render(<DeckBuilder />);
      const counters = screen.getAllByText("0/3");
      expect(counters.length).toBeGreaterThan(0);
    });

    it("displays total card count starting at 0/20", () => {
      render(<DeckBuilder />);
      expect(screen.getByText(/0 \/ 20 Cards/)).toBeInTheDocument();
    });
  });

  describe("Card Addition", () => {
    it("adds a card to the deck when clicked", () => {
      render(<DeckBuilder />);
      const fireDragon = screen.getByText("Fire Dragon").closest("div");

      fireEvent.click(fireDragon!);

      // Should show 1/3 now
      expect(screen.getByText("1/3")).toBeInTheDocument();
      expect(screen.getByText(/1 \/ 20 Cards/)).toBeInTheDocument();
    });

    it("increments card count up to 3 copies", () => {
      render(<DeckBuilder />);
      const fireDragon = screen.getByText("Fire Dragon").closest("div");

      // Add 3 times
      fireEvent.click(fireDragon!);
      fireEvent.click(fireDragon!);
      fireEvent.click(fireDragon!);

      expect(screen.getByText("3/3")).toBeInTheDocument();
      expect(screen.getByText(/3 \/ 20 Cards/)).toBeInTheDocument();
    });

    it("does not add more than 3 copies of the same card", () => {
      render(<DeckBuilder />);
      const fireDragon = screen.getByText("Fire Dragon").closest("div");

      // Try to add 4 times
      fireEvent.click(fireDragon!);
      fireEvent.click(fireDragon!);
      fireEvent.click(fireDragon!);
      fireEvent.click(fireDragon!);

      // Should still be 3/3
      expect(screen.getByText("3/3")).toBeInTheDocument();
      expect(screen.getByText(/3 \/ 20 Cards/)).toBeInTheDocument();
    });

    it("can add multiple different cards", () => {
      render(<DeckBuilder />);
      const fireDragon = screen.getByText("Fire Dragon").closest("div");
      const waterSprite = screen.getByText("Water Sprite").closest("div");

      fireEvent.click(fireDragon!);
      fireEvent.click(waterSprite!);
      fireEvent.click(waterSprite!);

      expect(screen.getByText(/3 \/ 20 Cards/)).toBeInTheDocument();
    });
  });

  describe("Card Removal", () => {
    it("removes a card from the deck when X button clicked", () => {
      render(<DeckBuilder />);
      const fireDragon = screen.getByText("Fire Dragon").closest("div");

      // Add a card first
      fireEvent.click(fireDragon!);
      expect(screen.getByText(/1 \/ 20 Cards/)).toBeInTheDocument();

      // Find and click remove button in deck list
      const removeButton = screen.getByRole("button", { name: /remove/i });
      fireEvent.click(removeButton);

      expect(screen.getByText(/0 \/ 20 Cards/)).toBeInTheDocument();
    });

    it("decrements count when removing one copy", () => {
      render(<DeckBuilder />);
      const fireDragon = screen.getByText("Fire Dragon").closest("div");

      // Add 2 copies
      fireEvent.click(fireDragon!);
      fireEvent.click(fireDragon!);
      expect(screen.getByText("2/3")).toBeInTheDocument();

      // Remove 1
      const removeButton = screen.getByRole("button", { name: /remove/i });
      fireEvent.click(removeButton);

      expect(screen.getByText("1/3")).toBeInTheDocument();
    });
  });

  describe("Search and Filters", () => {
    it("filters cards by search term", () => {
      render(<DeckBuilder />);
      const searchInput = screen.getByLabelText(/search cards/i);

      fireEvent.change(searchInput, { target: { value: "Dragon" } });

      expect(screen.getByText("Fire Dragon")).toBeInTheDocument();
      expect(screen.queryByText("Water Sprite")).not.toBeInTheDocument();
    });

    it("filters by card type", async () => {
      render(<DeckBuilder />);

      // Open type filter and select CREATURE
      const typeFilter = screen.getByLabelText(/type/i);
      fireEvent.mouseDown(typeFilter);

      const creatureOption = await screen.findByText("Creature");
      fireEvent.click(creatureOption);

      // Should show creatures only
      expect(screen.getByText("Fire Dragon")).toBeInTheDocument();
      expect(screen.getByText("Water Sprite")).toBeInTheDocument();
      expect(screen.queryByText("Healing Wave")).not.toBeInTheDocument();
    });

    it("filters by affinity", async () => {
      render(<DeckBuilder />);

      // Open affinity filter and select FIRE
      const affinityFilter = screen.getByLabelText(/affinity/i);
      fireEvent.mouseDown(affinityFilter);

      const fireOption = await screen.findByText("Fire");
      fireEvent.click(fireOption);

      // Should show fire cards only
      expect(screen.getByText("Fire Dragon")).toBeInTheDocument();
      expect(screen.getByText("Fireball")).toBeInTheDocument();
      expect(screen.queryByText("Water Sprite")).not.toBeInTheDocument();
    });

    it("combines search and filters", async () => {
      render(<DeckBuilder />);

      const searchInput = screen.getByLabelText(/search cards/i);
      fireEvent.change(searchInput, { target: { value: "Fire" } });

      const typeFilter = screen.getByLabelText(/type/i);
      fireEvent.mouseDown(typeFilter);

      const creatureOption = await screen.findByText("Creature");
      fireEvent.click(creatureOption);

      // Should only show Fire Dragon (Fire + Creature)
      expect(screen.getByText("Fire Dragon")).toBeInTheDocument();
      expect(screen.queryByText("Fireball")).not.toBeInTheDocument();
    });
  });

  describe("Save and Load", () => {
    it("saves deck to localStorage when save button clicked", async () => {
      render(<DeckBuilder />);
      const fireDragon = screen.getByText("Fire Dragon").closest("div");

      // Add a card
      fireEvent.click(fireDragon!);

      // Click save
      const saveButton = screen.getByRole("button", { name: /save deck/i });
      fireEvent.click(saveButton);

      // Check localStorage
      const savedDeck = localStorageMock.getItem("battle-nexus-deck");
      expect(savedDeck).toBeTruthy();

      const parsedDeck = JSON.parse(savedDeck!);
      expect(parsedDeck).toEqual([{ cardId: "BN-CORE-001", count: 1 }]);

      // Should show success message
      await waitFor(() => {
        expect(
          screen.getByText(/deck saved successfully/i),
        ).toBeInTheDocument();
      });
    });

    it("loads saved deck from localStorage on mount", () => {
      // Pre-populate localStorage
      const savedDeck = [
        { cardId: "BN-CORE-001", count: 2 },
        { cardId: "BN-CORE-002", count: 1 },
      ];
      localStorageMock.setItem("battle-nexus-deck", JSON.stringify(savedDeck));

      render(<DeckBuilder />);

      // Should show loaded deck
      expect(screen.getByText(/3 \/ 20 Cards/)).toBeInTheDocument();
      expect(screen.getByText("2/3")).toBeInTheDocument();
      expect(screen.getByText("1/3")).toBeInTheDocument();
    });

    it("clears deck and removes from localStorage", async () => {
      render(<DeckBuilder />);
      const fireDragon = screen.getByText("Fire Dragon").closest("div");

      // Add a card and save
      fireEvent.click(fireDragon!);

      const clearButton = screen.getByRole("button", { name: /clear deck/i });
      fireEvent.click(clearButton);

      // Deck should be empty
      expect(screen.getByText(/0 \/ 20 Cards/)).toBeInTheDocument();

      // localStorage should be cleared
      const savedDeck = localStorageMock.getItem("battle-nexus-deck");
      expect(savedDeck).toBeNull();

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/deck cleared/i)).toBeInTheDocument();
      });
    });
  });

  describe("Deck Statistics", () => {
    it("calculates total cost correctly", () => {
      render(<DeckBuilder />);

      // Add Fire Dragon (cost 5) twice and Water Sprite (cost 3) once = 13 total
      const fireDragon = screen.getByText("Fire Dragon").closest("div");
      const waterSprite = screen.getByText("Water Sprite").closest("div");

      fireEvent.click(fireDragon!);
      fireEvent.click(fireDragon!);
      fireEvent.click(waterSprite!);

      // Should show total cost (5+5+3 = 13)
      expect(screen.getByText(/13/)).toBeInTheDocument();
    });

    it("displays deck composition by type", () => {
      render(<DeckBuilder />);

      const fireDragon = screen.getByText("Fire Dragon").closest("div");
      const healingWave = screen.getByText("Healing Wave").closest("div");

      fireEvent.click(fireDragon!);
      fireEvent.click(healingWave!);

      // Should show type breakdown
      expect(screen.getByText(/CREATURE: 1/)).toBeInTheDocument();
      expect(screen.getByText(/SUPPORT: 1/)).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles invalid localStorage data gracefully", () => {
      localStorageMock.setItem("battle-nexus-deck", "invalid json");

      // Should not crash
      expect(() => render(<DeckBuilder />)).not.toThrow();
    });

    it("handles missing cards in localStorage data", () => {
      const savedDeck = [
        { cardId: "INVALID-ID", count: 2 },
        { cardId: "BN-CORE-001", count: 1 },
      ];
      localStorageMock.setItem("battle-nexus-deck", JSON.stringify(savedDeck));

      render(<DeckBuilder />);

      // Should only load valid card
      expect(screen.getByText(/1 \/ 20 Cards/)).toBeInTheDocument();
    });
  });
});
