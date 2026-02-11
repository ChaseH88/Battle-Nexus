import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "../../../store/uiSlice";
import { RootState } from "../../../store/store";
import { GameState } from "../../../battle/GameState";
import { BattleEngine } from "../../../battle/BattleEngine";
import { PlayerState } from "../../../battle/PlayerState";
import { BattleEngineHookReturn } from "../../../hooks/useBattleEngine";

// Import animation types from useAnimationQueue
interface AnimationQueueItem {
  id: string;
  type: "activation" | "attack" | "draw";
  blocking: boolean;
  data: {
    card?: any;
    originBounds?: DOMRect;
    attackerBounds?: DOMRect;
    defenderBounds?: DOMRect;
    startBounds?: DOMRect;
    damage?: number;
    counterDamage?: number;
  };
  onComplete?: () => void;
}

interface UseAnimationQueueReturn {
  currentAnimation: AnimationQueueItem | null;
  activeAnimations: AnimationQueueItem[];
  isAnimating: boolean;
  queueActivation: (
    card: any,
    element: HTMLElement,
    onComplete?: () => void,
  ) => void;
  queueAttack: (
    card: any,
    attackerElement: HTMLElement,
    defenderElement: HTMLElement,
    damage: number,
    counterDamage: number,
    onComplete?: () => void,
  ) => void;
  queueDraw: (deckElement: HTMLElement, onComplete?: () => void) => void;
  completeCurrentAnimation: () => void;
  completeAnimation: (animationId: string) => void;
  clearQueue: () => void;
}

/**
 * Creates a Redux store configured for testing
 * Disables serializableCheck to allow mock functions in state
 */
export const createTestStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: {
      ui: uiReducer as any, // Type cast needed for test store configuration
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for tests with mock functions
      }),
    ...(preloadedState && { preloadedState }),
  });

/**
 * Creates a minimal mock player state
 */
export const createMockPlayer = (
  overrides?: Partial<PlayerState>,
): PlayerState => ({
  id: "Test Player",
  lifePoints: 2000,
  deck: [],
  hand: [],
  maxDeck: [],
  lanes: [null, null, null],
  support: [null, null, null],
  discardPile: [],
  removedFromGame: [],
  momentum: 0,
  ...overrides,
});

/**
 * Creates a minimal mock game state
 */
export const createMockGameState = (
  overrides?: Partial<GameState>,
): GameState => ({
  turn: 1,
  phase: "DRAW",
  activePlayer: 0,
  hasDrawnThisTurn: false,
  winnerIndex: null,
  players: [
    createMockPlayer({ id: "Player 1" }),
    createMockPlayer({ id: "AI Opponent" }),
  ],
  activeEffects: [],
  stack: [],
  log: {} as any, // Mock logger
  ...overrides,
});

/**
 * Creates a mock BattleEngine
 */
export const createMockEngine = (
  gameState?: GameState,
): Partial<BattleEngine> => ({
  state: gameState || createMockGameState(),
});

/**
 * Creates default mock return values for useBattleEngine hook
 */
export const createMockBattleEngineReturn = (
  engine?: Partial<BattleEngine>,
  gameState?: GameState,
  overrides?: Partial<BattleEngineHookReturn>,
): BattleEngineHookReturn => {
  const mockGameState = gameState || createMockGameState();
  const mockEngine = engine || createMockEngine(mockGameState);

  return {
    engine: mockEngine as BattleEngine,
    gameState: mockGameState,
    currentPlayer: mockGameState.players[0],
    opponent: mockGameState.players[1],
    isPlayerTurn: mockGameState.activePlayer === 0,
    isAITurn: mockGameState.activePlayer === 1,
    isGameOver: false,
    winner: null,
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
    ...overrides,
  };
};

interface UseGameInitializationReturn {
  showDeckLoadPrompt: boolean;
  handleNewGame: () => void;
  handleDeckLoadResponse: (response: boolean) => void;
}

/**
 * Creates default mock return values for useGameInitialization hook
 */
export const createMockGameInitializationReturn = (
  overrides?: Partial<UseGameInitializationReturn>,
): UseGameInitializationReturn => ({
  showDeckLoadPrompt: false,
  handleNewGame: jest.fn(),
  handleDeckLoadResponse: jest.fn(),
  ...overrides,
});

/**
 * Creates default mock return values for useAnimationQueue hook
 */
export const createMockAnimationQueueReturn = (
  overrides?: Partial<UseAnimationQueueReturn>,
): UseAnimationQueueReturn => ({
  currentAnimation: null,
  activeAnimations: [],
  isAnimating: false,
  queueActivation: jest.fn(),
  queueAttack: jest.fn(),
  queueDraw: jest.fn(),
  completeCurrentAnimation: jest.fn(),
  completeAnimation: jest.fn(),
  clearQueue: jest.fn(),
  ...overrides,
});

interface UseAttackAnimationReturn {
  aiAttackAnimationCallbackRef: React.MutableRefObject<
    | ((attackerLane: number, targetLane: number | null) => Promise<void>)
    | undefined
  >;
}

/**
 * Creates default mock return values for useAttackAnimation hook
 */
export const createMockAttackAnimationReturn = (
  overrides?: Partial<UseAttackAnimationReturn>,
): UseAttackAnimationReturn => ({
  aiAttackAnimationCallbackRef: { current: undefined },
  ...overrides,
});

interface UseTrapActivationReturn {
  trapActivationCallbackRef: React.MutableRefObject<
    | ((
        defenderIndex: 0 | 1,
        attackerLane: number,
        targetLane: number,
      ) => Promise<boolean>)
    | undefined
  >;
}

/**
 * Creates default mock return values for useTrapActivation hook
 */
export const createMockTrapActivationReturn = (
  overrides?: Partial<UseTrapActivationReturn>,
): UseTrapActivationReturn => ({
  trapActivationCallbackRef: { current: undefined },
  ...overrides,
});

interface UseDrawReminderReturn {
  checkNeedsToDraw: () => boolean;
  showDrawReminderModal: () => void;
}

/**
 * Creates default mock return values for useDrawReminder hook
 */
export const createMockDrawReminderReturn = (
  overrides?: Partial<UseDrawReminderReturn>,
): UseDrawReminderReturn => ({
  checkNeedsToDraw: jest.fn().mockReturnValue(false),
  showDrawReminderModal: jest.fn(),
  ...overrides,
});

interface UseCardActionsReturn {
  handlePlayCreature: (cardId: string, lane: number) => void;
  handlePlayCreatureClick: (cardId: string) => void;
  handlePlaySupport: (cardId: string, slot: number) => void;
  handleActivateSupport: (slot: number) => void;
}

/**
 * Creates default mock return values for useCardActions hook
 */
export const createMockCardActionsReturn = (
  overrides?: Partial<UseCardActionsReturn>,
): UseCardActionsReturn => ({
  handlePlayCreature: jest.fn(),
  handlePlayCreatureClick: jest.fn(),
  handlePlaySupport: jest.fn(),
  handleActivateSupport: jest.fn(),
  ...overrides,
});

interface UseCreatureActionsReturn {
  handleToggleMode: (playerIndex: 0 | 1, lane: number) => void;
  handleFlipFaceUp: (playerIndex: 0 | 1, lane: number) => void;
}

/**
 * Creates default mock return values for useCreatureActions hook
 */
export const createMockCreatureActionsReturn = (
  overrides?: Partial<UseCreatureActionsReturn>,
): UseCreatureActionsReturn => ({
  handleToggleMode: jest.fn(),
  handleFlipFaceUp: jest.fn(),
  ...overrides,
});

interface UseCardDetailModalsReturn {
  handleCardClick: (card: any, activeEffects?: any[]) => void;
  handleCardDoubleClick: (card: any, activeEffects?: any[]) => void;
}

/**
 * Creates default mock return values for useCardDetailModals hook
 */
export const createMockCardDetailModalsReturn = (
  overrides?: Partial<UseCardDetailModalsReturn>,
): UseCardDetailModalsReturn => ({
  handleCardClick: jest.fn(),
  handleCardDoubleClick: jest.fn(),
  ...overrides,
});

interface UseAttackHandlerReturn {
  handleSelectAttacker: (playerIndex: 0 | 1, lane: number) => void;
  handleAttack: (targetPlayerIndex: 0 | 1, targetLane: number | null) => void;
  setAttackerRef: (
    playerIndex: 0 | 1,
    lane: number,
    element: HTMLElement | null,
  ) => void;
}

/**
 * Creates default mock return values for useAttackHandler hook
 */
export const createMockAttackHandlerReturn = (
  overrides?: Partial<UseAttackHandlerReturn>,
): UseAttackHandlerReturn => ({
  handleSelectAttacker: jest.fn(),
  handleAttack: jest.fn(),
  setAttackerRef: jest.fn(),
  ...overrides,
});

/**
 * Creates a draw animation mock object
 */
export const createMockDrawAnimation = (
  id: string,
  overrides?: Partial<AnimationQueueItem>,
): AnimationQueueItem => ({
  id,
  type: "draw" as const,
  blocking: false,
  data: {
    startBounds: new DOMRect(0, 0, 100, 150),
  },
  onComplete: jest.fn(),
  ...overrides,
});

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
}

/**
 * Creates a mock UI state with modal open
 */
export const createMockUIStateWithModal = (
  modalOverrides?: Partial<ModalState>,
  uiOverrides?: Partial<RootState["ui"]>,
): Partial<RootState> => ({
  ui: {
    modal: {
      isOpen: true,
      title: "Test Modal",
      message: "Test message",
      onConfirm: jest.fn(),
      ...modalOverrides,
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
    ...uiOverrides,
  },
});

/**
 * Sets up all hook mocks with default values
 * Call this in beforeEach to reset mocks between tests
 */
export const setupDefaultHookMocks = (
  useBattleEngine: jest.Mock,
  useGameInitialization: jest.Mock,
  useAnimationQueue: jest.Mock,
  useAttackAnimation: jest.Mock,
  useTrapActivation: jest.Mock,
  useDrawReminder: jest.Mock,
  useCardActions: jest.Mock,
  useCreatureActions: jest.Mock,
  useCardDetailModals: jest.Mock,
  useAttackHandler: jest.Mock,
) => {
  useBattleEngine.mockReturnValue(createMockBattleEngineReturn());
  useGameInitialization.mockReturnValue(createMockGameInitializationReturn());
  useAnimationQueue.mockReturnValue(createMockAnimationQueueReturn());
  useAttackAnimation.mockReturnValue(createMockAttackAnimationReturn());
  useTrapActivation.mockReturnValue(createMockTrapActivationReturn());
  useDrawReminder.mockReturnValue(createMockDrawReminderReturn());
  useCardActions.mockReturnValue(createMockCardActionsReturn());
  useCreatureActions.mockReturnValue(createMockCreatureActionsReturn());
  useCardDetailModals.mockReturnValue(createMockCardDetailModalsReturn());
  useAttackHandler.mockReturnValue(createMockAttackHandlerReturn());
};
