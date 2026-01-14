import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";
import { BattleEngine } from "@battle/BattleEngine";
import { CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";
import { createEffectUtils, executeEffect } from "@effects/handler";
import {
  drawMany,
  createTestDeck1,
  createTestDeck2,
} from "@/__tests__/testUtils";

/**
 * Effect Handler Tests
 * Tests the effect handler utilities and execution
 */
describe("Effects – Handler", () => {
  it("creates effect utils with all utility functions", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    const utils = createEffectUtils(game, engine);

    expect(utils).toHaveProperty("getAllyCreatures");
    expect(utils).toHaveProperty("getEnemyCreatures");
    expect(utils).toHaveProperty("getAllCreatures");
    expect(utils).toHaveProperty("getCreatureInLane");
    expect(utils).toHaveProperty("modifyCreatureStats");
    expect(utils).toHaveProperty("modifyCreatureHP");
    expect(utils).toHaveProperty("drawCards");
    expect(utils).toHaveProperty("discardCards");
    expect(utils).toHaveProperty("filterByAffinity");
    expect(utils).toHaveProperty("log");
    expect(utils).toHaveProperty("addActiveEffect");

    expect(typeof utils.getAllyCreatures).toBe("function");
    expect(typeof utils.getEnemyCreatures).toBe("function");
    expect(typeof utils.getAllCreatures).toBe("function");
  });

  it("getAllyCreatures returns creatures for player", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 5);

    const creature = p1.hand.find((c) => c.type === CardType.Creature);
    if (creature) {
      engine.playCreature(0, 0, creature.id);

      const utils = createEffectUtils(game, engine);
      const allies = utils.getAllyCreatures(0);

      expect(allies.length).toBeGreaterThan(0);
      expect(allies[0]).toBeInstanceOf(CreatureCard);
    }
  });

  it("getEnemyCreatures returns opponent creatures", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 5);
    drawMany(engine, 1, 5);

    const creature = p2.hand.find((c) => c.type === CardType.Creature);
    if (creature) {
      engine.playCreature(1, 0, creature.id);

      const utils = createEffectUtils(game, engine);
      const enemies = utils.getEnemyCreatures(0);

      expect(enemies.length).toBeGreaterThan(0);
      expect(enemies[0]).toBeInstanceOf(CreatureCard);
    }
  });

  it("getAllCreatures returns all creatures on board", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 5);
    drawMany(engine, 1, 5);

    const p1Creature = p1.hand.find((c) => c.type === CardType.Creature);
    const p2Creature = p2.hand.find((c) => c.type === CardType.Creature);

    if (p1Creature && p2Creature) {
      engine.playCreature(0, 0, p1Creature.id);
      engine.playCreature(1, 0, p2Creature.id);

      const utils = createEffectUtils(game, engine);
      const all = utils.getAllCreatures();

      expect(all.length).toBe(2);
      expect(all.every((c) => c instanceof CreatureCard)).toBe(true);
    }
  });

  it("getCreatureInLane returns creature at specific lane", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 5);

    const creature = p1.hand.find((c) => c.type === CardType.Creature);
    if (creature) {
      engine.playCreature(0, 1, creature.id);

      const utils = createEffectUtils(game, engine);
      const creatureInLane = utils.getCreatureInLane(0, 1);

      expect(creatureInLane).not.toBeNull();
      expect(creatureInLane).toBeInstanceOf(CreatureCard);
    }
  });

  it("getCreatureInLane returns null for empty lane", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    const utils = createEffectUtils(game, engine);
    const creatureInLane = utils.getCreatureInLane(0, 0);

    expect(creatureInLane).toBeNull();
  });

  it("filterByAffinity returns creatures with matching affinity", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 10);

    // Play multiple creatures
    const creatures = p1.hand.filter((c) => c.type === CardType.Creature);
    creatures.slice(0, 3).forEach((creature, i) => {
      engine.playCreature(0, i, creature.id);
    });

    const utils = createEffectUtils(game, engine);
    const allCreatures = utils.getAllyCreatures(0);
    const fireCreatures = utils.filterByAffinity(allCreatures, "FIRE");

    expect(Array.isArray(fireCreatures)).toBe(true);
    fireCreatures.forEach((creature) => {
      expect(creature.affinity).toBe("FIRE");
    });
  });

  it("drawCards adds cards to player hand", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    const initialHandSize = p1.hand.length;

    const utils = createEffectUtils(game, engine);
    utils.drawCards(0, 3);

    expect(p1.hand.length).toBe(initialHandSize + 3);
  });

  it("modifyCreatureStats changes creature stats", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 5);

    const creature = p1.hand.find((c) => c.type === CardType.Creature);
    if (creature) {
      engine.playCreature(0, 0, creature.id);
      const playedCreature = p1.lanes[0] as CreatureCard;

      const initialAtk = playedCreature.atk;
      const initialDef = playedCreature.def;

      const utils = createEffectUtils(game, engine);
      utils.modifyCreatureStats(playedCreature, 10, 5);

      expect(playedCreature.atk).toBe(initialAtk + 10);
      expect(playedCreature.def).toBe(initialDef + 5);
    }
  });

  it("handles effect execution without errors", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 5);

    const creature = p1.hand.find((c) => c.type === CardType.Creature);
    if (creature) {
      // Should not throw
      expect(() => {
        executeEffect("non_existent_effect", {
          state: game,
          engine,
          sourceCard: creature,
          ownerIndex: 0,
          trigger: "ON_PLAY",
          utils: createEffectUtils(game, engine),
        });
      }).not.toThrow();
    }
  });
});
