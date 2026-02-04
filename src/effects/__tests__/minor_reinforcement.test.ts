import { describe, it, expect, beforeEach } from "@jest/globals";
import { BattleEngine } from "@battle/BattleEngine";
import { GameState, createGameState } from "@battle/GameState";
import { createPlayerState } from "@battle/PlayerState";
import { minor_reinforcement } from "../effect/minor_reinforcement";
import { createEffectUtils, EffectContext } from "../handler";
import { createTestMagic, createTestCreature } from "@/__tests__/testUtils";
import { CreatureCard } from "@cards/CreatureCard";

describe("Minor Reinforcement Effect", () => {
  let engine: BattleEngine;
  let gameState: GameState;
  let targetCreature: CreatureCard;

  beforeEach(() => {
    const minorReinforcementCard = createTestMagic({
      id: "minor_reinforcement_action",
      name: "Minor Reinforcement",
      effectId: "minor_reinforcement",
      cost: 1,
    });

    // Create test creature with 60 HP
    targetCreature = createTestCreature({
      id: "target_creature",
      name: "Target Creature",
      hp: 60,
      atk: 20,
      def: 20,
    });

    // Create players
    const player1 = createPlayerState("Player 1", []);
    const player2 = createPlayerState("Player 2", []);

    // Add card to player 1's hand
    player1.hand.push(minorReinforcementCard);

    // Place creature in player 1's lane 0
    player1.lanes[0] = targetCreature;

    // Create game state
    gameState = createGameState(player1, player2);
    engine = new BattleEngine(gameState);
  });

  it("should add 20 HP to target creature", () => {
    const ownerIndex: 0 | 1 = 0;
    const actionCard = gameState.players[ownerIndex].hand[0];

    // Initial HP should be 60
    expect(targetCreature.currentHp).toBe(60);

    // Create effect context with target
    const utils = createEffectUtils(gameState, engine);
    const context: EffectContext = {
      state: gameState,
      engine,
      sourceCard: actionCard,
      ownerIndex,
      trigger: "ON_PLAY",
      utils,
      targetCard: targetCreature,
    };

    // Execute effect
    minor_reinforcement(context);

    // HP should now be 80 (60 + 20)
    expect(targetCreature.currentHp).toBe(80);
  });

  it("should work with creatures at different HP values", () => {
    const ownerIndex: 0 | 1 = 0;
    const actionCard = gameState.players[ownerIndex].hand[0];

    // Set creature to low HP
    targetCreature.currentHp = 10;

    const utils = createEffectUtils(gameState, engine);
    const context: EffectContext = {
      state: gameState,
      engine,
      sourceCard: actionCard,
      ownerIndex,
      trigger: "ON_PLAY",
      utils,
      targetCard: targetCreature,
    };

    // Execute effect
    minor_reinforcement(context);

    // HP should now be 30 (10 + 20)
    expect(targetCreature.currentHp).toBe(30);
  });

  it("should do nothing if no target is provided", () => {
    const ownerIndex: 0 | 1 = 0;
    const actionCard = gameState.players[ownerIndex].hand[0];

    // Store original HP
    const originalHp = targetCreature.currentHp;

    // Create effect context WITHOUT target
    const utils = createEffectUtils(gameState, engine);
    const context: EffectContext = {
      state: gameState,
      engine,
      sourceCard: actionCard,
      ownerIndex,
      trigger: "ON_PLAY",
      utils,
      targetCard: undefined,
    };

    // Execute effect
    minor_reinforcement(context);

    // HP should remain unchanged
    expect(targetCreature.currentHp).toBe(originalHp);
  });

  it("should do nothing if target creature is not on the field", () => {
    const ownerIndex: 0 | 1 = 0;
    const actionCard = gameState.players[ownerIndex].hand[0];

    // Create a creature that's NOT on the field
    const nonFieldCreature = createTestCreature({
      id: "not_on_field",
      name: "Not On Field",
      hp: 50,
    });

    const utils = createEffectUtils(gameState, engine);
    const context: EffectContext = {
      state: gameState,
      engine,
      sourceCard: actionCard,
      ownerIndex,
      trigger: "ON_PLAY",
      utils,
      targetCard: nonFieldCreature,
    };

    // Execute effect
    minor_reinforcement(context);

    // Non-field creature HP should remain unchanged
    expect(nonFieldCreature.currentHp).toBe(50);
  });

  it("should stack with existing HP increases", () => {
    const ownerIndex: 0 | 1 = 0;
    const actionCard = gameState.players[ownerIndex].hand[0];

    // Creature already has boosted HP
    targetCreature.currentHp = 100;

    const utils = createEffectUtils(gameState, engine);
    const context: EffectContext = {
      state: gameState,
      engine,
      sourceCard: actionCard,
      ownerIndex,
      trigger: "ON_PLAY",
      utils,
      targetCard: targetCreature,
    };

    // Execute effect
    minor_reinforcement(context);

    // HP should stack: 100 + 20 = 120
    expect(targetCreature.currentHp).toBe(120);
  });

  it("should work when targeting opponent's creature (if allowed)", () => {
    const ownerIndex: 0 | 1 = 0;
    const actionCard = gameState.players[ownerIndex].hand[0];

    // Create opponent creature
    const opponentCreature = createTestCreature({
      id: "opponent_creature",
      name: "Opponent Creature",
      hp: 40,
    });

    // Place in opponent's field
    gameState.players[1].lanes[0] = opponentCreature;

    const utils = createEffectUtils(gameState, engine);
    const context: EffectContext = {
      state: gameState,
      engine,
      sourceCard: actionCard,
      ownerIndex,
      trigger: "ON_PLAY",
      utils,
      targetCard: opponentCreature,
    };

    // Execute effect
    minor_reinforcement(context);

    // Opponent creature should gain HP (40 + 20 = 60)
    expect(opponentCreature.currentHp).toBe(60);
  });
});
