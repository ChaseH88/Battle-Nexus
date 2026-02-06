import { CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";
import { boost_fire_atk } from "@effects/effect/boost_fire_atk";
import { createEffectUtils } from "@effects/handler";
import { createTestGame, drawMany } from "@/__tests__/testUtils";

/**
 * Boost Fire Effect Tests
 * Tests the boost_fire_atk effect (Ignite Burst)
 * Now only boosts Fire creature ATK
 */
describe("Effect: boost_fire_atk", () => {
  it("boosts Fire creature ATK by +20", () => {
    const { p1, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

    drawMany(engine, 0, 10);

    const fireCreature = p1.hand.find(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "FIRE",
    );

    if (fireCreature) {
      engine.playCreature(0, 0, fireCreature.id);
      const creature = p1.lanes[0] as CreatureCard;
      const initialAtk = creature.atk;

      // Execute the effect
      boost_fire_atk({
        state: game,
        engine,
        sourceCard: fireCreature,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Should have +20 ATK
      expect(creature.atk).toBe(initialAtk + 20);
    }
  });

  it("targets specific lane when provided in eventData", () => {
    const { p1, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

    drawMany(engine, 0, 15);

    const fireCreatures = p1.hand
      .filter(
        (c) =>
          c.type === CardType.Creature &&
          (c as CreatureCard).affinity === "FIRE",
      )
      .slice(0, 2);

    if (fireCreatures.length >= 2) {
      engine.playCreature(0, 0, fireCreatures[0].id);
      engine.playCreature(0, 1, fireCreatures[1].id);

      const creature0 = p1.lanes[0] as CreatureCard;
      const creature1 = p1.lanes[1] as CreatureCard;

      const atk0 = creature0.atk;
      const atk1 = creature1.atk;

      // Target lane 1 specifically
      boost_fire_atk({
        state: game,
        engine,
        sourceCard: fireCreatures[0],
        ownerIndex: 0,
        trigger: "ON_PLAY",
        eventData: { lane: 1 },
        utils: createEffectUtils(game, engine),
      });

      // Only creature in lane 1 should be boosted
      expect(creature0.atk).toBe(atk0);
      expect(creature1.atk).toBe(atk1 + 20);
    }
  });

  it("fails gracefully when no Fire creatures exist", () => {
    const { p1, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

    drawMany(engine, 0, 10);

    const waterCreature = p1.hand.find(
      (c) =>
        c.type === CardType.Creature &&
        (c as CreatureCard).affinity === "WATER",
    );

    if (waterCreature) {
      engine.playCreature(0, 0, waterCreature.id);

      // Execute effect with no Fire creatures
      expect(() => {
        boost_fire_atk({
          state: game,
          engine,
          sourceCard: waterCreature,
          ownerIndex: 0,
          trigger: "ON_PLAY",
          utils: createEffectUtils(game, engine),
        });
      }).not.toThrow();
    }
  });

  it("targets highest ATK Fire creature when auto-targeting", () => {
    const { p1, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

    drawMany(engine, 0, 15);

    const fireCreatures = p1.hand
      .filter(
        (c) =>
          c.type === CardType.Creature &&
          (c as CreatureCard).affinity === "FIRE",
      )
      .slice(0, 2);

    if (fireCreatures.length >= 2) {
      engine.playCreature(0, 0, fireCreatures[0].id);
      engine.playCreature(0, 1, fireCreatures[1].id);

      const creature0 = p1.lanes[0] as CreatureCard;
      const creature1 = p1.lanes[1] as CreatureCard;

      // Determine which has higher ATK
      const higherAtkCreature =
        creature0.atk >= creature1.atk ? creature0 : creature1;
      const initialAtk = higherAtkCreature.atk;

      // Execute without specifying lane (auto-target)
      boost_fire_atk({
        state: game,
        engine,
        sourceCard: fireCreatures[0],
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Highest ATK creature should be boosted
      expect(higherAtkCreature.atk).toBe(initialAtk + 20);
    }
  });

  it("adds active effect tracking", () => {
    const { p1, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

    drawMany(engine, 0, 10);

    const fireCreature = p1.hand.find(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "FIRE",
    );

    if (fireCreature) {
      engine.playCreature(0, 0, fireCreature.id);

      const initialEffectCount = game.activeEffects.length;

      // Execute the effect
      boost_fire_atk({
        state: game,
        engine,
        sourceCard: fireCreature,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Should have added an active effect
      expect(game.activeEffects.length).toBeGreaterThan(initialEffectCount);
    }
  });

  it("has metadata for activation requirements", () => {
    expect(boost_fire_atk.metadata).toBeDefined();
    expect(boost_fire_atk.metadata?.canActivate).toBeDefined();
    expect(boost_fire_atk.metadata?.targeting).toBeDefined();
    // getValidTargets is optional now - targeting can be a function instead
  });
});
