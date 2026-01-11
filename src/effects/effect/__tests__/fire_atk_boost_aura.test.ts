import { CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";
import { fire_atk_boost_aura } from "@effects/effect/fire_atk_boost_aura";
import { createEffectUtils } from "@effects/handler";
import { createTestGame, drawMany } from "@/__tests__/testUtils";

/**
 * Fire ATK Boost Aura Effect Tests
 * Tests the fire_atk_boost_aura effect
 */
// TODO: Update these tests to account for momentum/cost system
describe.skip("Effect: fire_atk_boost_aura", () => {
  it("boosts ATK of all Fire creatures", () => {
    const { p1, game, engine } = createTestGame();

    drawMany(engine, 0, 10);

    // Find and play Fire creatures
    const fireCreatures = p1.hand.filter(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "FIRE"
    );

    if (fireCreatures.length > 0) {
      const creature1 = fireCreatures[0] as CreatureCard;
      engine.playCreature(0, 0, creature1.id);

      const playedCreature = p1.lanes[0] as CreatureCard;
      const initialAtk = playedCreature.atk;

      // Execute the effect
      fire_atk_boost_aura({
        state: game,
        engine,
        sourceCard: creature1,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Should have boosted ATK
      expect(playedCreature.atk).toBe(initialAtk + 100);
    }
  });

  it("only boosts Fire creatures, not other affinities", () => {
    const { p1, game, engine } = createTestGame();

    drawMany(engine, 0, 15);

    // Play a mix of creatures
    const waterCreature = p1.hand.find(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "WATER"
    );
    const fireCreature = p1.hand.find(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "FIRE"
    );

    if (waterCreature && fireCreature) {
      engine.playCreature(0, 0, waterCreature.id);
      engine.playCreature(0, 1, fireCreature.id);

      const playedWater = p1.lanes[0] as CreatureCard;
      const playedFire = p1.lanes[1] as CreatureCard;

      const waterInitialAtk = playedWater.atk;
      const fireInitialAtk = playedFire.atk;

      // Execute the effect
      fire_atk_boost_aura({
        state: game,
        engine,
        sourceCard: fireCreature,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Water creature should not be boosted
      expect(playedWater.atk).toBe(waterInitialAtk);
      // Fire creature should be boosted
      expect(playedFire.atk).toBe(fireInitialAtk + 100);
    }
  });

  it("does nothing when no Fire creatures are on the field", () => {
    const { p1, game, engine } = createTestGame();

    drawMany(engine, 0, 10);

    const waterCreature = p1.hand.find(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "WATER"
    );

    if (waterCreature) {
      engine.playCreature(0, 0, waterCreature.id);

      const playedWater = p1.lanes[0] as CreatureCard;
      const initialAtk = playedWater.atk;

      // Execute the effect
      fire_atk_boost_aura({
        state: game,
        engine,
        sourceCard: waterCreature,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Should not affect water creature
      expect(playedWater.atk).toBe(initialAtk);
    }
  });

  it("boosts multiple Fire creatures at once", () => {
    const { p1, game, engine } = createTestGame();

    drawMany(engine, 0, 15);

    // Play multiple Fire creatures
    const fireCreatures = p1.hand
      .filter(
        (c) =>
          c.type === CardType.Creature &&
          (c as CreatureCard).affinity === "FIRE"
      )
      .slice(0, 3);

    if (fireCreatures.length >= 2) {
      engine.playCreature(0, 0, fireCreatures[0].id);
      engine.playCreature(0, 1, fireCreatures[1].id);

      const creature1 = p1.lanes[0] as CreatureCard;
      const creature2 = p1.lanes[1] as CreatureCard;

      const atk1 = creature1.atk;
      const atk2 = creature2.atk;

      // Execute the effect
      fire_atk_boost_aura({
        state: game,
        engine,
        sourceCard: fireCreatures[0],
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Both should be boosted
      expect(creature1.atk).toBe(atk1 + 100);
      expect(creature2.atk).toBe(atk2 + 100);
    }
  });

  it("adds active effect tracking", () => {
    const { p1, game, engine } = createTestGame();

    drawMany(engine, 0, 10);

    const fireCreature = p1.hand.find(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "FIRE"
    );

    if (fireCreature) {
      engine.playCreature(0, 0, fireCreature.id);

      const initialEffectCount = game.activeEffects.length;

      // Execute the effect
      fire_atk_boost_aura({
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
});
