import { CardType, CreatureCard } from "@cards/index";
import { createTestGame, drawMany } from "@/__tests__/testUtils";
import { getEffectTiming } from "@effects/registry";

/**
 * Tests for creature effect activation from lanes
 * Creatures with effectId can activate their effects once (ONE_TIME) or multiple times (CONTINUOUS)
 */
// TODO: Update these tests to account for momentum/cost system
describe.skip("BattleEngine – Creature Effects", () => {
  it("allows creatures with effects to activate from lanes", () => {
    const { p1, engine } = createTestGame();

    drawMany(engine, 0, 10);

    // Find a creature with an effect (e.g., Blaze Fox with draw effect)
    const creatureWithEffect = p1.hand.find(
      (c) =>
        c.type === CardType.Creature &&
        (c as CreatureCard).effectId !== undefined
    );

    if (creatureWithEffect) {
      const creature = creatureWithEffect as CreatureCard;
      engine.playCreature(0, 0, creature.id);

      const laneCreature = p1.lanes[0] as CreatureCard;
      expect(laneCreature.hasActivatableEffect).toBe(true);
      expect(laneCreature.canActivateEffect).toBe(true);

      // Activate the effect
      const initialHandSize = p1.hand.length;
      const result = engine.activateCreatureEffect(0, 0);

      expect(result).toBe(true);

      // For draw effects, hand should increase
      if (laneCreature.effectId === "draw_on_play") {
        expect(p1.hand.length).toBeGreaterThan(initialHandSize);
      }
    }
  });

  it("prevents ONE_TIME effects from activating twice", () => {
    const { p1, engine } = createTestGame();

    drawMany(engine, 0, 10);

    // Find a creature with ONE_TIME effect (cinder_vixen or umbral_wisp)
    const creatureWithEffect = p1.hand.find(
      (c) =>
        c.type === CardType.Creature &&
        (c as CreatureCard).effectId !== undefined &&
        getEffectTiming(c) === "ONE_TIME"
    ) as CreatureCard | undefined;

    // If no ONE_TIME creature found, skip gracefully
    if (!creatureWithEffect) {
      console.warn("No ONE_TIME effect creature found in hand, test skipped");
      return;
    }

    engine.playCreature(0, 0, creatureWithEffect.id);

    const laneCreature = p1.lanes[0] as CreatureCard;

    // First activation should succeed
    const result1 = engine.activateCreatureEffect(0, 0);
    expect(result1).toBe(true);
    expect(laneCreature.hasActivatedEffect).toBe(true);

    // Second activation should fail because it's ONE_TIME
    expect(laneCreature.canActivateEffect).toBe(false);
    const result2 = engine.activateCreatureEffect(0, 0);
    expect(result2).toBe(false);
  });

  it("allows CONTINUOUS effects to activate multiple times", () => {
    const { p1, engine } = createTestGame();

    drawMany(engine, 0, 10);

    // Find a creature with CONTINUOUS effect
    const creatureWithEffect = p1.hand.find(
      (c) =>
        c.type === CardType.Creature &&
        (c as CreatureCard).effectId !== undefined &&
        getEffectTiming(c) === "CONTINUOUS"
    );

    if (creatureWithEffect) {
      const creature = creatureWithEffect as CreatureCard;
      engine.playCreature(0, 0, creature.id);

      const laneCreature = p1.lanes[0] as CreatureCard;

      // First activation
      expect(laneCreature.canActivateEffect).toBe(true);
      const result1 = engine.activateCreatureEffect(0, 0);
      expect(result1).toBe(true);

      // CONTINUOUS effects can still be activated
      expect(laneCreature.canActivateEffect).toBe(true);
    }
  });

  it("fails gracefully when activating effect from empty lane", () => {
    const { engine } = createTestGame();

    const result = engine.activateCreatureEffect(0, 0);
    expect(result).toBe(false);
  });

  it("fails when trying to activate effect from creature without effect", () => {
    const { p1, engine } = createTestGame();

    drawMany(engine, 0, 10);

    // Find a creature without an effect
    const creatureWithoutEffect = p1.hand.find(
      (c) =>
        c.type === CardType.Creature &&
        (c as CreatureCard).effectId === undefined
    );

    if (creatureWithoutEffect) {
      engine.playCreature(0, 0, creatureWithoutEffect.id);

      const laneCreature = p1.lanes[0] as CreatureCard;
      expect(laneCreature.hasActivatableEffect).toBe(false);

      const result = engine.activateCreatureEffect(0, 0);
      expect(result).toBe(false);
    }
  });

  it("requires main phase to activate creature effects", () => {
    const { p1, game, engine } = createTestGame();

    drawMany(engine, 0, 10);

    const creatureWithEffect = p1.hand.find(
      (c) =>
        c.type === CardType.Creature &&
        (c as CreatureCard).effectId !== undefined
    );

    if (creatureWithEffect) {
      engine.playCreature(0, 0, creatureWithEffect.id);

      // Reset to draw phase
      game.phase = "DRAW";
      game.hasDrawnThisTurn = false;

      const result = engine.activateCreatureEffect(0, 0);
      expect(result).toBe(false);
    }
  });

  it("checks activation requirements using metadata system", () => {
    const { p1, engine } = createTestGame();

    drawMany(engine, 0, 10);

    // Find a creature with effect that has activation requirements
    // (e.g., purge_opponent_support requires opponent to have support)
    const creatureWithEffect = p1.hand.find(
      (c) =>
        c.type === CardType.Creature &&
        (c as CreatureCard).effectId === "purge_opponent_support"
    );

    if (creatureWithEffect) {
      engine.playCreature(0, 0, creatureWithEffect.id);

      // Try to activate without opponent having support - should fail
      const result = engine.activateCreatureEffect(0, 0);
      expect(result).toBe(false);
    }
  });

  it("does not auto-trigger creature effects when played", () => {
    const { p1, engine } = createTestGame();

    drawMany(engine, 0, 10);

    // Find a creature with draw effect (cinder_vixen)
    const drawCreature = p1.hand.find(
      (c) =>
        c.type === CardType.Creature &&
        (c as CreatureCard).effectId === "draw_on_play"
    ) as CreatureCard | undefined;

    // If no draw creature found, skip gracefully
    if (!drawCreature) {
      console.warn("No draw_on_play creature found in hand, test skipped");
      return;
    }

    const handSizeBefore = p1.hand.length;

    // Play the creature
    engine.playCreature(0, 0, drawCreature.id);

    // Hand size should be reduced by 1 (the creature was removed from hand)
    // If effect auto-triggered, it would draw 1 card, keeping hand size the same
    expect(p1.hand.length).toBe(handSizeBefore - 1);

    // Verify creature has NOT activated its effect yet
    const laneCreature = p1.lanes[0] as CreatureCard;
    expect(laneCreature.hasActivatedEffect).toBe(false);

    // Try to activate the effect manually
    const result = engine.activateCreatureEffect(0, 0);
    expect(result).toBe(true);

    // After manual activation, hand should have increased
    expect(p1.hand.length).toBe(handSizeBefore);
    expect(laneCreature.hasActivatedEffect).toBe(true);
  });
});
