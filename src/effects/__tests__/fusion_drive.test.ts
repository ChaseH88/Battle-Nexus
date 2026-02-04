import { describe, it, expect, beforeEach } from "@jest/globals";
import { BattleEngine } from "@battle/BattleEngine";
import { GameState, createGameState } from "@battle/GameState";
import { createPlayerState } from "@battle/PlayerState";
import { fusion_drive } from "../effect/fusion_drive";
import { createEffectUtils, EffectContext } from "../handler";
import { createTestAction } from "@/__tests__/testUtils";

describe("Fusion Drive Effect", () => {
  let engine: BattleEngine;
  let gameState: GameState;

  beforeEach(() => {
    const fusionDriveCard = createTestAction({
      id: "fusion_drive_action",
      name: "Fusion Drive",
      effectId: "fusion_drive",
      cost: 3,
    });

    // Create players with empty decks and hands
    const player1 = createPlayerState("Player 1", []);
    const player2 = createPlayerState("Player 2", []);

    // Set initial momentum
    player1.momentum = 0;
    player2.momentum = 0;

    // Add Fusion Drive to player 1's hand
    player1.hand.push(fusionDriveCard);

    // Create game state
    gameState = createGameState(player1, player2);
    engine = new BattleEngine(gameState);
  });

  it("should give 2 momentum to owner when played", () => {
    const ownerIndex: 0 | 1 = 0;
    const fusionDriveCard = gameState.players[ownerIndex].hand[0];
    const cardCost = fusionDriveCard.cost;

    // Create effect context
    const utils = createEffectUtils(gameState, engine);
    const context: EffectContext = {
      state: gameState,
      engine,
      sourceCard: fusionDriveCard,
      ownerIndex,
      trigger: "ON_PLAY",
      utils,
    };

    // Execute effect
    fusion_drive(context);

    // Verify momentum changes
    expect(gameState.players[0].momentum).toBe(2 + cardCost);
    expect(gameState.players[1].momentum).toBe(0);
  });

  it("should work when opponent plays it", () => {
    const ownerIndex: 0 | 1 = 1;
    const fusionDriveCard = createTestAction({
      id: "fusion_drive_action_2",
      name: "Fusion Drive",
      effectId: "fusion_drive",
      cost: 3,
    });
    const cardCost = fusionDriveCard.cost;

    // Create effect context with opponent as owner
    const utils = createEffectUtils(gameState, engine);
    const context: EffectContext = {
      state: gameState,
      engine,
      sourceCard: fusionDriveCard,
      ownerIndex,
      trigger: "ON_PLAY",
      utils,
    };

    // Execute effect
    fusion_drive(context);

    // Verify momentum changes
    expect(gameState.players[1].momentum).toBe(2 + cardCost); // Owner (player 1) gains 2
    expect(gameState.players[0].momentum).toBe(0); // Other player gains 0
  });

  it("should stack with existing momentum", () => {
    const ownerIndex: 0 | 1 = 0;
    const fusionDriveCard = gameState.players[ownerIndex].hand[0];

    // Set initial momentum
    gameState.players[0].momentum = 3;
    gameState.players[1].momentum = 1;

    // Create effect context
    const utils = createEffectUtils(gameState, engine);
    const context: EffectContext = {
      state: gameState,
      engine,
      sourceCard: fusionDriveCard,
      ownerIndex,
      trigger: "ON_PLAY",
      utils,
    };

    // Execute effect
    fusion_drive(context);

    // Verify momentum stacks correctly
    expect(gameState.players[0].momentum).toBe(5 + fusionDriveCard.cost); // 3 + 2
    expect(gameState.players[1].momentum).toBe(1); // unchanged
  });
});
