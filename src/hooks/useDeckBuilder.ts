import React, { useState } from "react";

const DECK_STORAGE_KEY = "nexis-deck";

export interface UseDeckBuilderReturn {
  selectedCards: Map<string, number>;
  addCardToDeck: (cardId: string) => void;
  removeCardFromDeck: (cardId: string) => void;
  saveDeckToLocalStorage: () => void;
  clearDeck: () => void;
  snackbarMessage: string;
  setSnackbarMessage: React.Dispatch<React.SetStateAction<string>>;
  snackbarSeverity: "success" | "error";
  setSnackbarSeverity: React.Dispatch<
    React.SetStateAction<"success" | "error">
  >;
  snackbarOpen: boolean;
  setSnackbarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useDeckBuilder = (): UseDeckBuilderReturn => {
  const [selectedCards, setSelectedCards] = useState<Map<string, number>>(
    () => {
      const savedDeck = localStorage.getItem(DECK_STORAGE_KEY);
      if (savedDeck) {
        try {
          const deckArray = JSON.parse(savedDeck) as Array<{
            cardId: string;
            count: number;
          }>;
          return new Map(deckArray.map((item) => [item.cardId, item.count]));
        } catch (error) {
          console.error("Failed to load deck from localStorage:", error);
          return new Map();
        }
      }
      return new Map();
    },
  );
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success",
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const saveDeckToLocalStorage = () => {
    const totalCards = Array.from(selectedCards.values()).reduce(
      (sum, count) => sum + count,
      0,
    );

    if (totalCards !== 20) {
      setSnackbarMessage(
        `Cannot save deck! You have ${totalCards} cards. You need exactly 20 cards to save.`,
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const deckArray = Array.from(selectedCards.entries()).map(
      ([cardId, count]) => ({
        cardId,
        count,
      }),
    );
    localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(deckArray));
    setSnackbarMessage("Deck saved successfully!");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const clearDeck = () => {
    setSelectedCards(new Map());
    localStorage.removeItem(DECK_STORAGE_KEY);
    setSnackbarMessage("Deck cleared!");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const addCardToDeck = (cardId: string) => {
    const currentCount = selectedCards.get(cardId) || 0;
    if (currentCount < 3) {
      const newMap = new Map(selectedCards);
      newMap.set(cardId, currentCount + 1);
      setSelectedCards(newMap);
    }
  };

  const removeCardFromDeck = (cardId: string) => {
    const currentCount = selectedCards.get(cardId) || 0;
    if (currentCount > 0) {
      const newMap = new Map(selectedCards);
      if (currentCount === 1) {
        newMap.delete(cardId);
      } else {
        newMap.set(cardId, currentCount - 1);
      }
      setSelectedCards(newMap);
    }
  };

  return {
    selectedCards,
    addCardToDeck,
    removeCardFromDeck,
    saveDeckToLocalStorage,
    clearDeck,
    snackbarMessage,
    setSnackbarMessage,
    snackbarSeverity,
    setSnackbarSeverity,
    snackbarOpen,
    setSnackbarOpen,
  };
};
