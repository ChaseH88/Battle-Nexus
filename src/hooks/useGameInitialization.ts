import { useState, useEffect, useCallback } from "react";
import { CardInterface, CardType } from "../cards/types";
import { CreatureCard } from "../cards/CreatureCard";
import { ActionCard } from "../cards/ActionCard";
import { TrapCard } from "../cards/TrapCard";
import cardsData from "../static/card-data/bn-core.json";
import {
  loadDeckFromLocalStorage,
  hasSavedDeck,
  loadAIDeck,
} from "../utils/deckLoader";

function cardFactory(raw: any): CardInterface {
  switch (raw.type) {
    case CardType.Creature:
      return new CreatureCard(raw);
    case CardType.Action:
      return new ActionCard(raw);
    case CardType.Trap:
      return new TrapCard(raw);
    default:
      throw new Error(`Unknown card type: ${raw.type}`);
  }
}

const allCards = (cardsData as any[])
  .map(cardFactory)
  .sort(() => 0.5 - Math.random());

interface UseGameInitializationProps {
  initializeGame: (
    deck1: CardInterface[],
    deck2: CardInterface[],
    aiSkillLevel: number,
    trapCallback: (
      defenderIndex: 0 | 1,
      attackerLane: number,
      targetLane: number,
    ) => Promise<boolean>,
    aiAttackCallback: (
      attackerLane: number,
      targetLane: number | null,
    ) => Promise<void>,
  ) => void;
  aiSkillLevel: number;
  trapActivationCallbackRef: React.MutableRefObject<
    | ((
        defenderIndex: 0 | 1,
        attackerLane: number,
        targetLane: number,
      ) => Promise<boolean>)
    | undefined
  >;
  aiAttackAnimationCallbackRef: React.MutableRefObject<
    | ((attackerLane: number, targetLane: number | null) => Promise<void>)
    | undefined
  >;
  onClearUIState: () => void;
}

export const useGameInitialization = ({
  initializeGame,
  aiSkillLevel,
  trapActivationCallbackRef,
  aiAttackAnimationCallbackRef,
  onClearUIState,
}: UseGameInitializationProps) => {
  const [showDeckLoadPrompt, setShowDeckLoadPrompt] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const startNewGame = useCallback(() => {
    const deck1 = allCards.map(cardFactory).sort(() => 0.5 - Math.random());
    const deck2 = loadAIDeck();

    // Wrap trap callback in a function that uses the ref
    const trapCallback = async (
      defenderIndex: 0 | 1,
      attackerLane: number,
      targetLane: number,
    ): Promise<boolean> => {
      if (trapActivationCallbackRef.current) {
        return trapActivationCallbackRef.current(
          defenderIndex,
          attackerLane,
          targetLane,
        );
      }
      return false;
    };

    // Wrap AI attack animation callback in a function that uses the ref
    const aiAttackCallback = async (
      attackerLane: number,
      targetLane: number | null,
    ): Promise<void> => {
      if (aiAttackAnimationCallbackRef.current) {
        return aiAttackAnimationCallbackRef.current(attackerLane, targetLane);
      }
    };

    initializeGame(deck1, deck2, aiSkillLevel, trapCallback, aiAttackCallback);
    onClearUIState();
  }, [
    initializeGame,
    aiSkillLevel,
    trapActivationCallbackRef,
    aiAttackAnimationCallbackRef,
    onClearUIState,
  ]);

  const startNewGameWithCustomDeck = useCallback(() => {
    const customDeck = loadDeckFromLocalStorage();

    if (customDeck && customDeck.length < 20) {
      alert(
        `Your saved deck has ${customDeck.length} cards. You need exactly 20 cards to use it. Please update your deck in the Deck Builder.`,
      );
      startNewGame();
      return;
    }

    const deck1 =
      customDeck && customDeck.length >= 20
        ? [...customDeck].sort(() => 0.5 - Math.random())
        : allCards.map(cardFactory).sort(() => 0.5 - Math.random());
    const deck2 = loadAIDeck();

    // Wrap trap callback in a function that uses the ref
    const trapCallback = async (
      defenderIndex: 0 | 1,
      attackerLane: number,
      targetLane: number,
    ): Promise<boolean> => {
      if (trapActivationCallbackRef.current) {
        return trapActivationCallbackRef.current(
          defenderIndex,
          attackerLane,
          targetLane,
        );
      }
      return false;
    };

    // Wrap AI attack animation callback in a function that uses the ref
    const aiAttackCallback = async (
      attackerLane: number,
      targetLane: number | null,
    ): Promise<void> => {
      if (aiAttackAnimationCallbackRef.current) {
        return aiAttackAnimationCallbackRef.current(attackerLane, targetLane);
      }
    };

    initializeGame(deck1, deck2, aiSkillLevel, trapCallback, aiAttackCallback);
    onClearUIState();
  }, [
    initializeGame,
    aiSkillLevel,
    trapActivationCallbackRef,
    aiAttackAnimationCallbackRef,
    onClearUIState,
    startNewGame,
  ]);

  const handleNewGame = useCallback(() => {
    if (hasSavedDeck()) {
      setShowDeckLoadPrompt(true);
    } else {
      startNewGame();
    }
  }, [startNewGame]);

  // Auto-initialize on mount
  useEffect(() => {
    if (!isInitialized) {
      if (hasSavedDeck()) {
        setShowDeckLoadPrompt(true);
      } else {
        startNewGame();
      }
      setIsInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeckLoadResponse = useCallback(
    (useCustomDeck: boolean) => {
      setShowDeckLoadPrompt(false);
      if (useCustomDeck) {
        startNewGameWithCustomDeck();
      } else {
        startNewGame();
      }
    },
    [startNewGameWithCustomDeck, startNewGame],
  );

  return {
    showDeckLoadPrompt,
    handleNewGame,
    handleDeckLoadResponse,
  };
};
