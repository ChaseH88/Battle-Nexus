import { useState, useCallback, useRef, useEffect } from "react";
import { BattleEngine } from "../battle/BattleEngine";
import {
  GameState,
  createGameState,
  getOpponentIndex,
} from "../battle/GameState";
import { createPlayerState } from "../battle/PlayerState";
import { AIPlayer } from "../battle/AIPlayer";
import { CardInterface } from "../cards/types";

export interface BattleEngineHookReturn {
  // Core state
  engine: BattleEngine | null;
  gameState: GameState | null;
  ai: AIPlayer | null;

  // Derived state (for easy access)
  currentPlayer: GameState["players"][0] | null;
  opponent: GameState["players"][0] | null;
  isPlayerTurn: boolean;
  isAITurn: boolean;
  isGameOver: boolean;
  winner: string | null;

  // Actions
  initializeGame: (
    player1Deck: CardInterface[],
    player2Deck: CardInterface[],
    aiSkillLevel?: number,
    trapCallback?: (
      defenderIndex: 0 | 1,
      attackerLane: number,
      targetLane: number
    ) => Promise<boolean>
  ) => void;
  draw: (playerIndex: number) => void;
  playCreature: (
    playerIndex: number,
    lane: number,
    cardId: string,
    faceDown?: boolean,
    mode?: "ATTACK" | "DEFENSE"
  ) => boolean;
  playSupport: (playerIndex: number, slot: number, cardId: string) => boolean;
  activateSupport: (playerIndex: number, slot: number) => boolean;
  activateTrap: (
    playerIndex: number,
    slot: number,
    eventData?: { lane?: number; targetLane?: number }
  ) => boolean;
  activateCreatureEffect: (playerIndex: number, lane: number) => boolean;
  attack: (
    playerIndex: number,
    attackerLane: number,
    targetLane: number
  ) => void;
  toggleCreatureMode: (playerIndex: number, lane: number) => boolean;
  endTurn: () => void;

  // Utility
  refresh: () => void;
}

/**
 * Custom hook to manage BattleEngine state reactively
 *
 * This hook wraps the BattleEngine class and ensures that all state changes
 * trigger React re-renders properly. It solves stale state issues by:
 *
 * 1. Using a version counter that increments on every state change
 * 2. Providing wrapper methods that call engine methods + trigger updates
 * 3. Automatically managing AI turn execution
 * 4. Exposing derived state that's always up-to-date
 */
export function useBattleEngine(): BattleEngineHookReturn {
  const [engine, setEngine] = useState<BattleEngine | null>(null);
  const [ai, setAI] = useState<AIPlayer | null>(null);
  const [version, setVersion] = useState(0);
  const aiTurnInProgressRef = useRef(false);

  // Stable refresh callback that increments version
  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  // Stable refresh ref for AI to use
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  // Initialize a new game
  const initializeGame = useCallback(
    (
      player1Deck: CardInterface[],
      player2Deck: CardInterface[],
      aiSkillLevel: number = 5,
      trapCallback?: (
        defenderIndex: 0 | 1,
        attackerLane: number,
        targetLane: number
      ) => Promise<boolean>
    ) => {
      const p1 = createPlayerState("Player 1", [...player1Deck]);
      const p2 = createPlayerState("AI Opponent", [...player2Deck]);

      // Draw initial hands
      for (let i = 0; i < 5; i++) {
        const p1Card = p1.deck.shift();
        const p2Card = p2.deck.shift();
        if (p1Card) p1.hand.push(p1Card);
        if (p2Card) p2.hand.push(p2Card);
      }

      const gameState = createGameState(p1, p2);
      const newEngine = new BattleEngine(gameState);

      // Log initial state
      newEngine.logger.gameStart(1, 0, gameState);
      newEngine.logger.phaseChange(
        1,
        "DRAW",
        "Draw Phase - Draw a card to begin",
        gameState
      );

      setEngine(newEngine);

      // Initialize AI with refresh callback and trap callback
      const newAI = new AIPlayer(
        { skillLevel: aiSkillLevel, playerIndex: 1 },
        newEngine,
        () => refreshRef.current(),
        trapCallback
      );
      setAI(newAI);

      // Trigger initial render
      setVersion(0);
    },
    []
  );

  // Wrapper methods that call engine + refresh
  const draw = useCallback(
    (playerIndex: number) => {
      if (!engine) return;
      engine.draw(playerIndex);
      refresh();
    },
    [engine, refresh]
  );

  const playCreature = useCallback(
    (
      playerIndex: number,
      lane: number,
      cardId: string,
      faceDown: boolean = false,
      mode: "ATTACK" | "DEFENSE" = "ATTACK"
    ): boolean => {
      if (!engine) return false;
      const success = engine.playCreature(
        playerIndex as 0 | 1,
        lane,
        cardId,
        faceDown,
        mode
      );
      if (success) refresh();
      return success;
    },
    [engine, refresh]
  );

  const playSupport = useCallback(
    (playerIndex: number, slot: number, cardId: string): boolean => {
      if (!engine) return false;
      const success = engine.playSupport(playerIndex as 0 | 1, slot, cardId);
      if (success) refresh();
      return success;
    },
    [engine, refresh]
  );

  const activateSupport = useCallback(
    (playerIndex: number, slot: number): boolean => {
      if (!engine) return false;
      const success = engine.activateSupport(playerIndex as 0 | 1, slot);
      if (success) refresh();
      return success;
    },
    [engine, refresh]
  );

  const activateTrap = useCallback(
    (
      playerIndex: number,
      slot: number,
      eventData?: { lane?: number; targetLane?: number }
    ): boolean => {
      if (!engine) return false;
      const success = engine.activateTrap(
        playerIndex as 0 | 1,
        slot,
        eventData
      );
      if (success) refresh();
      return success;
    },
    [engine, refresh]
  );

  const activateCreatureEffect = useCallback(
    (playerIndex: number, lane: number): boolean => {
      if (!engine) return false;
      const success = engine.activateCreatureEffect(playerIndex as 0 | 1, lane);
      if (success) refresh();
      return success;
    },
    [engine, refresh]
  );

  const attack = useCallback(
    (playerIndex: number, attackerLane: number, targetLane: number) => {
      if (!engine) return;
      engine.attack(playerIndex, attackerLane, targetLane);
      refresh();
    },
    [engine, refresh]
  );

  const toggleCreatureMode = useCallback(
    (playerIndex: number, lane: number): boolean => {
      if (!engine) return false;
      const success = engine.toggleCreatureMode(playerIndex as 0 | 1, lane);
      if (success) refresh();
      return success;
    },
    [engine, refresh]
  );

  const endTurn = useCallback(() => {
    if (!engine) return;
    engine.endTurn();
    refresh();
  }, [engine, refresh]);

  // Auto-execute AI turn when it's AI's turn
  useEffect(() => {
    if (!engine || !ai) return;
    if (engine.state.winnerIndex !== null) return;
    if (engine.state.activePlayer !== 1) return;
    if (aiTurnInProgressRef.current) return;

    const executeAITurn = async () => {
      aiTurnInProgressRef.current = true;
      console.log("[useBattleEngine] AI taking turn...");

      try {
        await ai.takeTurn(engine.state);
        console.log("[useBattleEngine] AI turn complete");
        refresh();
      } catch (error) {
        console.error("[useBattleEngine] AI turn error:", error);
      } finally {
        aiTurnInProgressRef.current = false;
      }
    };

    const timer = setTimeout(executeAITurn, 1000);
    return () => clearTimeout(timer);
  }, [engine, ai, version, refresh]);

  // Derive state from engine (always current because it depends on version)
  const gameState = engine?.state || null;
  const currentPlayer = gameState
    ? gameState.players[gameState.activePlayer]
    : null;
  const opponent = gameState
    ? gameState.players[getOpponentIndex(gameState.activePlayer)]
    : null;
  const isPlayerTurn = gameState?.activePlayer === 0;
  const isAITurn = gameState?.activePlayer === 1;
  const isGameOver = gameState?.winnerIndex !== null;
  const winner =
    isGameOver && gameState
      ? gameState.players[gameState.winnerIndex!].id
      : null;

  return {
    // Core state
    engine,
    gameState,
    ai,

    // Derived state
    currentPlayer,
    opponent,
    isPlayerTurn,
    isAITurn,
    isGameOver,
    winner,

    // Actions
    initializeGame,
    draw,
    playCreature,
    playSupport,
    activateSupport,
    activateTrap,
    activateCreatureEffect,
    attack,
    toggleCreatureMode,
    endTurn,

    // Utility
    refresh,
    ai,
  };
}
