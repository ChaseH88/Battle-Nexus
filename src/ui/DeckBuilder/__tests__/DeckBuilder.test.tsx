// @ts-nocheck - jest-dom types not being recognized in test environment
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import DeckBuilder from "../DeckBuilder";
import uiReducer from "../../../store/uiSlice";

// Mock CardImage component since it uses Vite's import.meta.glob
jest.mock("../../Battle/Card/CardImage", () => ({
  CardImage: (_props: any) => (
    <div data-testid="mock-card-image">Card Image</div>
  ),
}));

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
    rarity: "R",
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
    rarity: "C",
    set: "BN-CORE",
  },
  {
    id: "BN-CORE-003",
    type: "ACTION",
    name: "Healing Wave",
    description: "Restores health",
    cost: 2,
    affinity: "WATER",
    rarity: "C",
    set: "BN-CORE",
  },
  {
    id: "BN-CORE-004",
    type: "ACTION",
    name: "Fireball",
    description: "Deals damage",
    cost: 4,
    affinity: "FIRE",
    rarity: "UR",
    set: "BN-CORE",
  },
  {
    id: "BN-CORE-005",
    type: "CREATURE",
    name: "Earth Golem",
    description: "A sturdy earth creature",
    cost: 4,
    atk: 1500,
    def: 2000,
    hp: 3500,
    affinity: "EARTH",
    rarity: "C",
    set: "BN-CORE",
  },
  {
    id: "BN-CORE-006",
    type: "CREATURE",
    name: "Wind Eagle",
    description: "A swift wind creature",
    cost: 3,
    atk: 1800,
    def: 1000,
    hp: 2200,
    affinity: "WIND",
    rarity: "C",
    set: "BN-CORE",
  },
  {
    id: "BN-CORE-007",
    type: "ACTION",
    name: "Lightning Bolt",
    description: "Quick damage spell",
    cost: 3,
    affinity: "WIND",
    rarity: "C",
    set: "BN-CORE",
  },
]);

const createMockStore = () =>
  configureStore({
    reducer: {
      ui: uiReducer,
    },
  });

describe("DeckBuilder Component", () => {
  let mockStore: ReturnType<typeof createMockStore>;

  // Helper to render with Provider
  const renderWithProvider = () => {
    return render(
      <Provider store={mockStore}>
        <DeckBuilder />
      </Provider>,
    );
  };

  beforeEach(() => {
    mockStore = createMockStore();
  });
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("Rendering", () => {
    it("renders the deck builder title", () => {
      renderWithProvider();
      expect(screen.getByText("Deck Builder")).toBeInTheDocument();
    });

    it("displays all available cards", () => {
      renderWithProvider();
      expect(screen.getByText("Fire Dragon")).toBeInTheDocument();
      expect(screen.getByText("Water Sprite")).toBeInTheDocument();
      expect(screen.getByText("Healing Wave")).toBeInTheDocument();
      expect(screen.getByText("Fireball")).toBeInTheDocument();
    });

    it("shows card counter starting at 0/3", () => {
      renderWithProvider();
      const counters = screen.getAllByText("0/3");
      expect(counters.length).toBeGreaterThan(0);
    });

    it("displays total card count starting at 0/20", () => {
      renderWithProvider();
      expect(
        screen.getByText(
          (_, element) => element?.textContent === "Current Deck (0/20)",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Card Addition", () => {
    it("adds a card to the deck when clicked", () => {
      renderWithProvider();
      const fireDragon = screen.getByText("Fire Dragon").closest("div");

      fireEvent.click(fireDragon!);

      // Should show 1/3 now
      expect(screen.getByText("1/3")).toBeInTheDocument();
      expect(
        screen.getByText(
          (_, element) => element?.textContent === "Current Deck (1/20)",
        ),
      ).toBeInTheDocument();
    });

    it("increments card count up to 3 copies", () => {
      renderWithProvider();
      const fireDragon = screen.getByText("Fire Dragon").closest("div");

      // Add 3 times
      fireEvent.click(fireDragon!);
      fireEvent.click(fireDragon!);
      fireEvent.click(fireDragon!);

      expect(screen.getByText("3/3")).toBeInTheDocument();
      expect(screen.getByText(/Current Deck \(3\/20\)/)).toBeInTheDocument();
    });

    it("does not add more than 3 copies of the same card", () => {
      renderWithProvider();
      const fireDragon = screen.getByText("Fire Dragon").closest("div");

      // Try to add 4 times
      fireEvent.click(fireDragon!);
      fireEvent.click(fireDragon!);
      fireEvent.click(fireDragon!);
      fireEvent.click(fireDragon!);

      // Should still be 3/3
      expect(screen.getByText("3/3")).toBeInTheDocument();
      expect(screen.getByText(/Current Deck \(3\/20\)/)).toBeInTheDocument();
    });

    it("can add multiple different cards", () => {
      renderWithProvider();
      const fireDragon = screen.getByText("Fire Dragon").closest("div");
      const waterSprite = screen.getByText("Water Sprite").closest("div");

      fireEvent.click(fireDragon!);
      fireEvent.click(waterSprite!);
      fireEvent.click(waterSprite!);

      expect(screen.getByText(/Current Deck \(3\/20\)/)).toBeInTheDocument();
    });
  });

  describe("Card Removal", () => {
    it("removes a card from the deck when X button clicked", () => {
      renderWithProvider();
      const fireDragon = screen.getByText("Fire Dragon").closest("div");

      // Add a card first
      fireEvent.click(fireDragon!);
      expect(screen.getByText(/Current Deck \(1\/20\)/)).toBeInTheDocument();

      // Find and click remove button in deck list
      const removeButton = screen.getByRole("button", { name: /remove/i });
      fireEvent.click(removeButton);

      expect(screen.getByText(/Current Deck \(0\/20\)/)).toBeInTheDocument();
    });

    it("decrements count when removing one copy", () => {
      renderWithProvider();
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
      renderWithProvider();
      const searchInput = screen.getByLabelText(/search cards/i);

      fireEvent.change(searchInput, { target: { value: "Dragon" } });

      expect(screen.getByText("Fire Dragon")).toBeInTheDocument();
      expect(screen.queryByText("Water Sprite")).not.toBeInTheDocument();
    });

    it("filters by card type", async () => {
      renderWithProvider();

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
      renderWithProvider();

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
      renderWithProvider();

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
      renderWithProvider();

      // Get all card elements by test ID and click them to add 20 cards
      // We have 7 mock cards, so: 6 cards × 3 copies + 1 card × 2 copies = 20 total
      const cardIds = [
        "BN-CORE-001",
        "BN-CORE-002",
        "BN-CORE-003",
        "BN-CORE-004",
        "BN-CORE-005",
        "BN-CORE-006",
        "BN-CORE-007",
      ];

      // Add 3 copies of first 6 cards
      for (let i = 0; i < 6; i++) {
        const card = screen.getByTestId(`deck-card-${cardIds[i]}`);
        fireEvent.click(card);
        fireEvent.click(card);
        fireEvent.click(card);
      }

      // Add 2 copies of the 7th card
      const lastCard = screen.getByTestId(`deck-card-${cardIds[6]}`);
      fireEvent.click(lastCard);
      fireEvent.click(lastCard);

      // Verify we have 20 cards by checking the heading
      await waitFor(() => {
        const heading = screen.getByRole("heading", { level: 5 });
        expect(heading.textContent).toContain("Current Deck");
        expect(heading.textContent).toContain("20/20");
      });

      // Click save button
      const saveButton = screen.getByRole("button", { name: /save deck/i });
      fireEvent.click(saveButton);

      // Should save to localStorage
      await waitFor(() => {
        const savedDeck = localStorageMock.getItem("nexis-deck");
        expect(savedDeck).not.toBeNull();
      });

      // Verify the saved data
      const savedDeck = localStorageMock.getItem("nexis-deck");
      const parsedDeck = JSON.parse(savedDeck!);

      // Should have 7 different cards
      expect(parsedDeck).toHaveLength(7);

      // Should show success message
      await waitFor(() => {
        expect(
          screen.getByText(/deck saved successfully/i),
        ).toBeInTheDocument();
      });
    });

    it("loads saved deck from localStorage on mount", () => {
      // Pre-populate localStorage with valid 20-card deck
      const savedDeck = [
        { cardId: "BN-CORE-001", count: 3 },
        { cardId: "BN-CORE-002", count: 3 },
        { cardId: "BN-CORE-003", count: 3 },
        { cardId: "BN-CORE-004", count: 3 },
        { cardId: "BN-CORE-005", count: 3 },
        { cardId: "BN-CORE-006", count: 3 },
        { cardId: "BN-CORE-007", count: 2 },
      ];
      localStorageMock.setItem("nexis-deck", JSON.stringify(savedDeck));

      renderWithProvider();

      // Should show loaded deck with 20 cards
      const heading = screen.getByRole("heading", { level: 5 });
      expect(heading.textContent).toContain("Current Deck");
      expect(heading.textContent).toContain("20/20");
    });

    it("clears deck and removes from localStorage", async () => {
      renderWithProvider();
      const fireDragon = screen.getByText("Fire Dragon").closest("div");

      // Add a card and save
      fireEvent.click(fireDragon!);

      const clearButton = screen.getByRole("button", { name: /clear deck/i });
      fireEvent.click(clearButton);

      // Deck should be empty
      const heading = screen.getByRole("heading", { level: 5 });
      expect(heading.textContent).toContain("Current Deck");
      expect(heading.textContent).toContain("0/20");

      // localStorage should be cleared
      const savedDeck = localStorageMock.getItem("nexis-deck");
      expect(savedDeck).toBeNull();

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/deck cleared/i)).toBeInTheDocument();
      });
    });
  });

  describe("Deck Statistics", () => {
    it("calculates total cost correctly", () => {
      renderWithProvider();

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
      renderWithProvider();

      const fireDragon = screen.getByText("Fire Dragon").closest("div");
      const healingWave = screen.getByText("Healing Wave").closest("div");

      fireEvent.click(fireDragon!);
      fireEvent.click(healingWave!);

      // Should show type breakdown
      expect(screen.getByText(/CREATURE: 1/)).toBeInTheDocument();
      expect(screen.getByText(/ACTION: 1/)).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles invalid localStorage data gracefully", () => {
      localStorageMock.setItem("nexis-deck", "invalid json");

      // Suppress expected console.error
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Should not crash
      expect(() =>
        render(
          <Provider store={mockStore}>
            <DeckBuilder />
          </Provider>,
        ),
      ).not.toThrow();

      consoleErrorSpy.mockRestore();
    });

    it("handles missing cards in localStorage data", () => {
      const savedDeck = [
        { cardId: "INVALID-ID", count: 2 },
        { cardId: "BN-CORE-001", count: 3 },
      ];
      localStorageMock.setItem("nexis-deck", JSON.stringify(savedDeck));

      render(
        <Provider store={mockStore}>
          <DeckBuilder />
        </Provider>,
      );

      // Should only load valid card (3 copies)
      const heading = screen.getByRole("heading", { level: 5 });
      expect(heading.textContent).toContain("Current Deck");
      expect(heading.textContent).toContain("3/20");
    });
  });
});
