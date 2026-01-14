import { CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";
import { flame_aura_global } from "@effects/effect/flame_aura_global";
import { createEffectUtils } from "@effects/handler";
import { createTestGame, drawMany } from "@/__tests__/testUtils";

/**
 * Flame Aura Global Effect Tests
 * Tests the flame_aura_global effect: All Fire creatures gain +10 ATK permanently
 */
describe("Effect: flame_aura_global", () => {
  it("boosts ATK of all Fire creatures permanently", () => {
    const { p1, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

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
      flame_aura_global({
        state: game,
        engine,
        sourceCard: creature1,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Should have boosted ATK
      expect(playedCreature.atk).toBe(initialAtk + 10);
    }
  });

  it("only boosts Fire creatures, not other affinities", () => {
    const { p1, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

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
      flame_aura_global({
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
      expect(playedFire.atk).toBe(fireInitialAtk + 10);
    }
  });

  it("does nothing when no Fire creatures are on the field", () => {
    const { p1, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

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
      flame_aura_global({
        state: game,
        engine,
        sourceCard: waterCreature,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Water creature should not be boosted
      expect(playedWater.atk).toBe(initialAtk);
    }
  });

  it("boosts multiple Fire creatures at once", () => {
    const { p1, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

    drawMany(engine, 0, 15);

    // Play multiple Fire creatures
    const fireCreatures = p1.hand.filter(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "FIRE"
    );

    if (fireCreatures.length >= 2) {
      engine.playCreature(0, 0, fireCreatures[0].id);
      engine.playCreature(0, 1, fireCreatures[1].id);

      const creature1 = p1.lanes[0] as CreatureCard;
      const creature2 = p1.lanes[1] as CreatureCard;

      const initialAtk1 = creature1.atk;
      const initialAtk2 = creature2.atk;

      // Execute the effect
      flame_aura_global({
        state: game,
        engine,
        sourceCard: fireCreatures[0],
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Both should be boosted
      expect(creature1.atk).toBe(initialAtk1 + 10);
      expect(creature2.atk).toBe(initialAtk2 + 10);
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
        c.type === CardType.Creature && (c as CreatureCard).affinity === "FIRE"
    );

    if (fireCreature) {
      engine.playCreature(0, 0, fireCreature.id);

      const initialEffectsCount = game.activeEffects.length;

      // Execute the effect
      flame_aura_global({
        state: game,
        engine,
        sourceCard: fireCreature,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Should have added an active effect
      expect(game.activeEffects.length).toBe(initialEffectsCount + 1);

      const addedEffect = game.activeEffects[initialEffectsCount];
      expect(addedEffect.name).toBe("Flame Aura");
      expect(addedEffect.isGlobal).toBe(true);
      expect(addedEffect.statModifiers?.atk).toBe(10);
    }
  });

  it("allows stacking multiple flame aura effects", () => {
    const { p1, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

    drawMany(engine, 0, 10);

    const fireCreature = p1.hand.find(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "FIRE"
    );

    if (fireCreature) {
      engine.playCreature(0, 0, fireCreature.id);

      const playedCreature = p1.lanes[0] as CreatureCard;
      const initialAtk = playedCreature.atk;

      // Execute the effect twice
      flame_aura_global({
        state: game,
        engine,
        sourceCard: fireCreature,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Wait a moment to ensure unique timestamp
      const firstAtk = playedCreature.atk;
      expect(firstAtk).toBe(initialAtk + 10);

      // Execute again
      flame_aura_global({
        state: game,
        engine,
        sourceCard: fireCreature,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Should stack (another +10)
      expect(playedCreature.atk).toBe(initialAtk + 20);
    }
  });

  it("only affects the owner's Fire creatures, not opponent's", () => {
    const { p1, p2, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

    drawMany(engine, 0, 10);
    drawMany(engine, 1, 10);

    // Play Fire creatures for both players
    const p1FireCreature = p1.hand.find(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "FIRE"
    );
    const p2FireCreature = p2.hand.find(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "FIRE"
    );

    if (p1FireCreature && p2FireCreature) {
      engine.playCreature(0, 0, p1FireCreature.id);
      engine.playCreature(1, 0, p2FireCreature.id);

      const p1Creature = p1.lanes[0] as CreatureCard;
      const p2Creature = p2.lanes[0] as CreatureCard;

      const p1InitialAtk = p1Creature.atk;
      const p2InitialAtk = p2Creature.atk;

      // Execute the effect for player 1
      flame_aura_global({
        state: game,
        engine,
        sourceCard: p1FireCreature,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // P1's creature should be boosted, P2's should not
      expect(p1Creature.atk).toBe(p1InitialAtk + 10);
      expect(p2Creature.atk).toBe(p2InitialAtk);
    }
  });
});
