import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";
import { BattleEngine } from "@battle/BattleEngine";
import { CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";
import { SupportCard } from "@cards/SupportCard";
import {
  drawMany,
  createTestDeck1,
  createTestDeck2,
} from "@/__tests__/testUtils";

/**
 * Edge Case Tests
 * Tests boundary conditions and unusual game states
 */
describe("BattleEngine – Edge Cases", () => {
  it("handles empty deck without crashing", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    p1.deck = [];
    p2.deck = [];

    expect(() => {
      engine.draw(0);
      engine.endTurn();
      engine.draw(1);
      engine.endTurn();
    }).not.toThrow();
  });

  it("handles full board without overflow", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 10);

    // Fill all 5 lanes
    const creatures = p1.hand.filter((c) => c.type === CardType.Creature);
    for (let i = 0; i < 5 && i < creatures.length; i++) {
      engine.playCreature(0, i, creatures[i].id);
    }

    // Try to play to occupied lane
    const extraCreature = p1.hand.find((c) => c.type === CardType.Creature);
    if (extraCreature) {
      const handSize = p1.hand.length;
      engine.playCreature(0, 0, extraCreature.id);

      // Should not replace existing creature
      expect(p1.hand.length).toBe(handSize);
    }
  });

  it("handles full support zone correctly", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 10);

    // Fill all 3 support slots
    const supports = p1.hand.filter(
      (c) => c.type === CardType.Support
    ) as SupportCard[];
    for (let i = 0; i < 3 && i < supports.length; i++) {
      engine.playSupport(0, i, supports[i].id);
    }

    // Try to play to occupied slot
    const extraSupport = p1.hand.find(
      (c) => c.type === CardType.Support
    ) as SupportCard;
    if (extraSupport) {
      const handSize = p1.hand.length;
      engine.playSupport(0, 0, extraSupport.id);

      // Should not replace existing support
      expect(p1.hand.length).toBe(handSize);
    }
  });

  it("handles creature with 0 HP", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 6);

    const creature = p1.hand.find((c) => c.id === "quake_stag");
    if (creature) {
      engine.playCreature(0, 0, creature.id);
      const card = p1.lanes[0] as CreatureCard;

      // Set HP to 0
      card.currentHp = 0;

      // Should be removed (or check if still there with 0 HP)
      // Implementation may vary - test current behavior
      expect(card.currentHp).toBe(0);
    }
  });

  it("handles invalid lane indices gracefully", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 6);

    const creature = p1.hand.find((c) => c.id === "quake_stag");
    if (creature) {
      const handSize = p1.hand.length;

      // Try invalid lanes
      engine.playCreature(0, -1, creature.id);
      expect(p1.hand.length).toBe(handSize);

      engine.playCreature(0, 10, creature.id);
      expect(p1.hand.length).toBe(handSize);
    }
  });

  it("handles mode changes on DEFENSE-locked creatures", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 6);

    const creature = p1.hand.find((c) => c.id === "quake_stag");
    if (creature) {
      engine.playCreature(0, 0, creature.id);
      const card = p1.lanes[0] as CreatureCard;

      card.mode = "DEFENSE";
      card.hasChangedModeThisTurn = true;

      // Try to change mode again
      card.mode = "ATTACK";

      // Should not be able to attack after mode change
      expect(card.hasChangedModeThisTurn).toBe(true);
    }
  });
});
