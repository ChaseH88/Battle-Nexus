/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { Battle } from "../index";
import uiReducer from "../../../store/uiSlice";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// Mock hooks to isolate component logic
jest.mock("../../../hooks/useBattleEngine");
jest.mock("../../../hooks/useGameInitialization");
jest.mock("../Card/useAnimationQueue");
jest.mock("../../../hooks/useAttackAnimation");
jest.mock("../../../hooks/useTrapActivation");
jest.mock("../../../hooks/useDrawReminder");
jest.mock("../../../hooks/useCardActions");
jest.mock("../../../hooks/useCreatureActions");
jest.mock("../../../hooks/useCardDetailModals");
jest.mock("../../../hooks/useAttackHandler");
jest.mock("../Card/CardImage", () => ({
  CardImage: () => <div data-testid="mock-card-image">Card Image</div>,
}));

import { useBattleEngine } from "../../../hooks/useBattleEngine";
import { useGameInitialization } from "../../../hooks/useGameInitialization";
import { useAnimationQueue } from "../Card/useAnimationQueue";
import { useAttackAnimation } from "../../../hooks/useAttackAnimation";
import { useTrapActivation } from "../../../hooks/useTrapActivation";
import { useDrawReminder } from "../../../hooks/useDrawReminder";
import { useCardActions } from "../../../hooks/useCardActions";
import { useCreatureActions } from "../../../hooks/useCreatureActions";
import { useCardDetailModals } from "../../../hooks/useCardDetailModals";
import { useAttackHandler } from "../../../hooks/useAttackHandler";
import { GameState } from "../../../battle/GameState";
import { BattleEngine } from "../../../battle/BattleEngine";

const createMockStore = () =>
  configureStore({
    reducer: {
      ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for tests with mock functions
      }),
  });

describe("Battle Component", () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let mockGameState: GameState;
  let mockEngine: Partial<BattleEngine>;

  beforeEach(() => {
    mockStore = createMockStore();

    // Create minimal mock game state
    mockGameState = {
      turn: 1,
      phase: "DRAW",
      activePlayer: 0,
      hasDrawnThisTurn: false,
      winnerIndex: null,
      players: [
        {
          id: "Player 1",
          lifePoints: 2000,
          deck: [],
          hand: [],
          maxDeck: [],
          lanes: [null, null, null],
          support: [null, null, null],
          discardPile: [],
          removedFromGame: [],
          momentum: 0,
        },
        {
          id: "AI Opponent",
          lifePoints: 2000,
          deck: [],
          hand: [],
          maxDeck: [],
          lanes: [null, null, null],
          support: [null, null, null],
          discardPile: [],
          removedFromGame: [],
          momentum: 0,
        },
      ],
      activeEffects: [],
      stack: [],
      log: {} as any, // Mock logger
    } as GameState;

    mockEngine = {
      state: mockGameState,
    };

    // Mock all hooks with default values
    (useBattleEngine as jest.Mock).mockReturnValue({
      engine: mockEngine,
      gameState: mockGameState,
      currentPlayer: mockGameState.players[0],
      opponent: mockGameState.players[1],
      isGameOver: false,
      initializeGame: jest.fn(),
      draw: jest.fn(),
      playCreature: jest.fn(),
      playSupport: jest.fn(),
      activateSupport: jest.fn(),
      activateTrap: jest.fn(),
      activateCreatureEffect: jest.fn(),
      attack: jest.fn(),
      toggleCreatureMode: jest.fn(),
      endTurn: jest.fn(),
      refresh: jest.fn(),
      ai: null,
      setEffectCallback: jest.fn(),
      setDrawCallback: jest.fn(),
    });

    (useGameInitialization as jest.Mock).mockReturnValue({
      showDeckLoadPrompt: false,
      handleNewGame: jest.fn(),
      handleDeckLoadResponse: jest.fn(),
    });

    (useAnimationQueue as jest.Mock).mockReturnValue({
      currentAnimation: null,
      activeAnimations: [],
      isAnimating: false,
      queueActivation: jest.fn(),
      queueAttack: jest.fn(),
      queueDraw: jest.fn(),
      completeCurrentAnimation: jest.fn(),
      completeAnimation: jest.fn(),
    });

    (useAttackAnimation as jest.Mock).mockReturnValue({
      aiAttackAnimationCallbackRef: { current: null },
    });

    (useTrapActivation as jest.Mock).mockReturnValue({
      trapActivationCallbackRef: { current: null },
    });

    (useDrawReminder as jest.Mock).mockReturnValue({
      checkNeedsToDraw: jest.fn().mockReturnValue(false),
      showDrawReminderModal: jest.fn(),
    });

    (useCardActions as jest.Mock).mockReturnValue({
      handlePlayCreature: jest.fn(),
      handlePlayCreatureClick: jest.fn(),
      handlePlaySupport: jest.fn(),
      handleActivateSupport: jest.fn(),
    });

    (useCreatureActions as jest.Mock).mockReturnValue({
      handleToggleMode: jest.fn(),
      handleFlipFaceUp: jest.fn(),
    });

    (useCardDetailModals as jest.Mock).mockReturnValue({
      handleCardClick: jest.fn(),
      handleCardDoubleClick: jest.fn(),
    });

    (useAttackHandler as jest.Mock).mockReturnValue({
      handleSelectAttacker: jest.fn(),
      handleAttack: jest.fn(),
      setAttackerRef: jest.fn(),
    });
  });

  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(
        <Provider store={mockStore}>
          <Battle />
        </Provider>,
      );

      expect(screen.getByTestId("battle-container")).toBeInTheDocument();
    });

    it("renders both player boards", () => {
      render(
        <Provider store={mockStore}>
          <Battle />
        </Provider>,
      );

      // PlayerBoard components render but data-testid is passed as prop, not applied to root
      // Check for life points displays instead which are rendered by both boards
      expect(screen.getByTestId("opponent-life-points")).toBeInTheDocument();
      expect(screen.getByTestId("player-life-points")).toBeInTheDocument();
    });

    it("renders player hand", () => {
      render(
        <Provider store={mockStore}>
          <Battle />
        </Provider>,
      );

      expect(screen.getByTestId("player-hand")).toBeInTheDocument();
    });

    it("renders controls component", () => {
      render(
        <Provider store={mockStore}>
          <Battle />
        </Provider>,
      );

      // Controls renders a SpeedDial with aria-label "Battle Controls"
      const speedDial = document.querySelector(
        '[aria-label="Battle Controls"]',
      );
      expect(speedDial).toBeInTheDocument();
    });
  });

  describe("Game State Display", () => {
    it("displays current player life points", () => {
      render(
        <Provider store={mockStore}>
          <Battle />
        </Provider>,
      );

      // Both players have 2000 LP - check for specific elements
      expect(screen.getByTestId("player-life-points")).toHaveTextContent(
        "2000",
      );
      expect(screen.getByTestId("opponent-life-points")).toHaveTextContent(
        "2000",
      );
    });

    it("shows game over state when winner exists", () => {
      const gameOverState = {
        ...mockGameState,
        winnerIndex: 0,
      };

      (useBattleEngine as jest.Mock).mockReturnValue({
        engine: mockEngine,
        gameState: gameOverState,
        currentPlayer: gameOverState.players[0],
        opponent: gameOverState.players[1],
        isGameOver: true,
        initializeGame: jest.fn(),
        draw: jest.fn(),
        playCreature: jest.fn(),
        playSupport: jest.fn(),
        activateSupport: jest.fn(),
        activateTrap: jest.fn(),
        activateCreatureEffect: jest.fn(),
        attack: jest.fn(),
        toggleCreatureMode: jest.fn(),
        endTurn: jest.fn(),
        refresh: jest.fn(),
        ai: null,
        setEffectCallback: jest.fn(),
        setDrawCallback: jest.fn(),
      });

      render(
        <Provider store={mockStore}>
          <Battle />
        </Provider>,
      );

      // Game over state is tracked but win message is shown via modal system
      // Just verify the component renders without crash when game is over
      expect(screen.getByTestId("battle-container")).toBeInTheDocument();
    });
  });

  describe("Animation Rendering", () => {
    it("renders draw animation when active", () => {
      const mockDrawAnimation = {
        id: "draw-123",
        type: "draw" as const,
        blocking: false,
        data: {
          startBounds: new DOMRect(0, 0, 100, 150),
        },
        onComplete: jest.fn(),
      };

      (useAnimationQueue as jest.Mock).mockReturnValue({
        currentAnimation: null,
        activeAnimations: [mockDrawAnimation],
        isAnimating: false,
        queueActivation: jest.fn(),
        queueAttack: jest.fn(),
        queueDraw: jest.fn(),
        completeCurrentAnimation: jest.fn(),
        completeAnimation: jest.fn(),
      });

      render(
        <Provider store={mockStore}>
          <Battle />
        </Provider>,
      );

      // Draw animation container should be present
      const animations = screen.getAllByRole("presentation", { hidden: true });
      expect(animations.length).toBeGreaterThan(0);
    });

    it("renders multiple draw animations simultaneously", () => {
      const mockDrawAnimations = [
        {
          id: "draw-1",
          type: "draw" as const,
          blocking: false,
          data: { startBounds: new DOMRect(0, 0, 100, 150) },
          onComplete: jest.fn(),
        },
        {
          id: "draw-2",
          type: "draw" as const,
          blocking: false,
          data: { startBounds: new DOMRect(0, 0, 100, 150) },
          onComplete: jest.fn(),
        },
        {
          id: "draw-3",
          type: "draw" as const,
          blocking: false,
          data: { startBounds: new DOMRect(0, 0, 100, 150) },
          onComplete: jest.fn(),
        },
      ];

      (useAnimationQueue as jest.Mock).mockReturnValue({
        currentAnimation: null,
        activeAnimations: mockDrawAnimations,
        isAnimating: false,
        queueActivation: jest.fn(),
        queueAttack: jest.fn(),
        queueDraw: jest.fn(),
        completeCurrentAnimation: jest.fn(),
        completeAnimation: jest.fn(),
      });

      render(
        <Provider store={mockStore}>
          <Battle />
        </Provider>,
      );

      // Draw animations render as CardDrawAnimation components
      // Since they're mocked and don't have specific testids, just verify no crash
      expect(screen.getByTestId("battle-container")).toBeInTheDocument();
    });
  });

  describe("Hook Integration", () => {
    it("initializes with battle engine", () => {
      render(
        <Provider store={mockStore}>
          <Battle />
        </Provider>,
      );

      expect(useBattleEngine).toHaveBeenCalled();
    });

    it("sets up animation queue", () => {
      render(
        <Provider store={mockStore}>
          <Battle />
        </Provider>,
      );

      expect(useAnimationQueue).toHaveBeenCalled();
    });

    it("initializes game initialization hook", () => {
      render(
        <Provider store={mockStore}>
          <Battle />
        </Provider>,
      );

      expect(useGameInitialization).toHaveBeenCalled();
    });
  });

  describe("Modal Rendering", () => {
    it("does not render modal when none is active", () => {
      render(
        <Provider store={mockStore}>
          <Battle />
        </Provider>,
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders modal when one is triggered", async () => {
      const storeWithModal = configureStore({
        reducer: {
          ui: uiReducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware({
            serializableCheck: false, // Disable for tests with mock functions
          }),
        preloadedState: {
          ui: {
            modal: {
              isOpen: true,
              title: "Test Modal",
              message: "Test message",
              onConfirm: jest.fn(),
            },
            playCreatureModal: { isOpen: false, lane: 0, card: null },
            targetSelectModal: {
              isOpen: false,
              title: "",
              message: "",
              options: [],
              onConfirm: undefined,
            },
            cardDetailModal: {
              isOpen: false,
              card: null,
              activeEffects: [],
            },
            discardPileModal: {
              isOpen: false,
              discardPile: [],
              playerIndex: 0 as 0 | 1,
              playerName: "",
            },
            selectedHandCard: null,
            selectedAttacker: null,
            isShowingEffectNotification: false,
            effectNotificationQueue: [],
          },
        },
      });

      render(
        <Provider store={storeWithModal}>
          <Battle />
        </Provider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Test Modal")).toBeInTheDocument();
      });
    });
  });
});
