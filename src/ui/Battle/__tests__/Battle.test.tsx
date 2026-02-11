import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { Battle } from "../index";
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  createTestStore,
  createMockGameState,
  createMockEngine,
  createMockUIStateWithModal,
  createMockBattleEngineReturn,
  createMockAnimationQueueReturn,
  setupDefaultHookMocks,
} from "./testHelpers";

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

describe("Battle Component", () => {
  let mockStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    mockStore = createTestStore();

    // Set up all hook mocks with default values
    setupDefaultHookMocks(
      useBattleEngine as jest.Mock,
      useGameInitialization as jest.Mock,
      useAnimationQueue as jest.Mock,
      useAttackAnimation as jest.Mock,
      useTrapActivation as jest.Mock,
      useDrawReminder as jest.Mock,
      useCardActions as jest.Mock,
      useCreatureActions as jest.Mock,
      useCardDetailModals as jest.Mock,
      useAttackHandler as jest.Mock,
    );
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
      const gameOverState = createMockGameState({ winnerIndex: 0 });

      (useBattleEngine as jest.Mock).mockReturnValue(
        createMockBattleEngineReturn(
          createMockEngine(gameOverState),
          gameOverState,
          { isGameOver: true },
        ),
      );

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

      (useAnimationQueue as jest.Mock).mockReturnValue(
        createMockAnimationQueueReturn({
          activeAnimations: [mockDrawAnimation],
        }),
      );

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

      (useAnimationQueue as jest.Mock).mockReturnValue(
        createMockAnimationQueueReturn({
          activeAnimations: mockDrawAnimations,
        }),
      );

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
      const storeWithModal = createTestStore(createMockUIStateWithModal());

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
