import { CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";
import { conditional_fire_bonus } from "@effects/effect/conditional_fire_bonus";
import { createEffectUtils } from "@effects/handler";
import { createTestGame, drawMany } from "@/__tests__/testUtils";

/**
 * Conditional Fire Bonus Effect Tests
 * Tests the conditional_fire_bonus effect
 */
describe("Effect: conditional_fire_bonus", () => {
  it("grants +200 ATK to Fire creatures", () => {
    const { p1, p2, game, engine } = createTestGame();

    drawMany(engine, 0, 10);

    const fireCreature = p1.hand.find(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "FIRE"
    );

    if (fireCreature) {
      engine.playCreature(0, 0, fireCreature.id);
      const creature = p1.lanes[0] as CreatureCard;
      const initialAtk = creature.atk;

      // Execute the effect
      conditional_fire_bonus({
        state: game,
        engine,
        sourceCard: creature,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Should have +200 ATK
      expect(creature.atk).toBe(initialAtk + 200);
    }
  });

  it("does not boost non-Fire creatures", () => {
    const { p1, p2, game, engine } = createTestGame();

    drawMany(engine, 0, 10);

    const waterCreature = p1.hand.find(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "WATER"
    );

    if (waterCreature) {
      engine.playCreature(0, 0, waterCreature.id);
      const creature = p1.lanes[0] as CreatureCard;
      const initialAtk = creature.atk;

      // Execute the effect
      conditional_fire_bonus({
        state: game,
        engine,
        sourceCard: creature,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Should not boost non-Fire creature
      expect(creature.atk).toBe(initialAtk);
    }
  });

  it("only affects Creature card types", () => {
    const { p1, p2, game, engine } = createTestGame();

    drawMany(engine, 0, 10);

    const supportCard = p1.hand.find((c) => c.type === CardType.Support);

    if (supportCard) {
      // Execute effect with non-creature card
      expect(() => {
        conditional_fire_bonus({
          state: game,
          engine,
          sourceCard: supportCard,
          ownerIndex: 0,
          trigger: "ON_PLAY",
          utils: createEffectUtils(game, engine),
        });
      }).not.toThrow();
    }
  });

  it("adds active effect tracking for Fire creatures", () => {
    const { p1, p2, game, engine } = createTestGame();

    drawMany(engine, 0, 10);

    const fireCreature = p1.hand.find(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "FIRE"
    );

    if (fireCreature) {
      engine.playCreature(0, 0, fireCreature.id);
      const creature = p1.lanes[0] as CreatureCard;

      const initialEffectCount = game.activeEffects.length;

      // Execute the effect
      conditional_fire_bonus({
        state: game,
        engine,
        sourceCard: creature,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Should have added an active effect
      expect(game.activeEffects.length).toBeGreaterThan(initialEffectCount);
    }
  });

  it("applies temporary boost (1 turn duration)", () => {
    const { p1, p2, game, engine } = createTestGame();

    drawMany(engine, 0, 10);

    const fireCreature = p1.hand.find(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "FIRE"
    );

    if (fireCreature) {
      engine.playCreature(0, 0, fireCreature.id);
      const creature = p1.lanes[0] as CreatureCard;

      // Execute the effect
      conditional_fire_bonus({
        state: game,
        engine,
        sourceCard: creature,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Check that effect has a duration
      const activeEffect = game.activeEffects.find((e) =>
        e.id.includes("conditional_fire_bonus")
      );

      expect(activeEffect).toBeDefined();
      if (activeEffect) {
        expect(activeEffect.turnsRemaining).toBe(1);
      }
    }
  });
});
