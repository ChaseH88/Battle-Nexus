import { CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";
import { void_wisp_boost } from "@effects/effect/void_wisp_boost";
import { createEffectUtils } from "@effects/handler";
import { createTestGame, drawMany } from "@/__tests__/testUtils";

/**
 * Void Wisp Boost Effect Tests
 * Tests the void_wisp_boost effect: Target Fire creature gains +200 ATK
 */
describe("Effect: void_wisp_boost", () => {
  it("boosts target Fire creature by +200 ATK", () => {
    const { p1, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

    drawMany(engine, 0, 10);

    // Find and play a Fire creature
    const fireCreature = p1.hand.find(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "FIRE"
    );

    if (fireCreature) {
      engine.playCreature(0, 0, fireCreature.id);

      const playedCreature = p1.lanes[0] as CreatureCard;
      const initialAtk = playedCreature.atk;

      // Execute the effect targeting lane 0
      void_wisp_boost({
        state: game,
        engine,
        sourceCard: fireCreature,
        ownerIndex: 0,
        trigger: "MANUAL",
        eventData: { targetLane: 0 },
        utils: createEffectUtils(game, engine),
      });

      // Should have boosted ATK by 200
      expect(playedCreature.atk).toBe(initialAtk + 200);
    }
  });

  it("targets specific lane when provided in eventData", () => {
    const { p1, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

    drawMany(engine, 0, 15);

    // Find and play Fire creatures in multiple lanes
    const fireCreatures = p1.hand.filter(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "FIRE"
    );

    if (fireCreatures.length >= 2) {
      engine.playCreature(0, 0, fireCreatures[0].id);
      engine.playCreature(0, 1, fireCreatures[1].id);

      const creature0 = p1.lanes[0] as CreatureCard;
      const creature1 = p1.lanes[1] as CreatureCard;

      const initialAtk0 = creature0.atk;
      const initialAtk1 = creature1.atk;

      // Execute the effect targeting lane 1 only
      void_wisp_boost({
        state: game,
        engine,
        sourceCard: fireCreatures[0],
        ownerIndex: 0,
        trigger: "MANUAL",
        eventData: { targetLane: 1 },
        utils: createEffectUtils(game, engine),
      });

      // Only creature in lane 1 should be boosted
      expect(creature0.atk).toBe(initialAtk0);
      expect(creature1.atk).toBe(initialAtk1 + 200);
    }
  });

  it("fails when targeting empty lane", () => {
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
      // Don't play any creatures, target empty lane
      const initialLogLength = game.log.getEvents().length;

      void_wisp_boost({
        state: game,
        engine,
        sourceCard: fireCreature,
        ownerIndex: 0,
        trigger: "MANUAL",
        eventData: { targetLane: 0 },
        utils: createEffectUtils(game, engine),
      });

      // Should log failure message
      const newEvents = game.log.getEvents().slice(initialLogLength);
      const messages = newEvents.map((e) => e.message).join(" ");
      expect(messages).toContain("No creature in chosen lane");
    }
  });

  it("fails when targeting non-Fire creature", () => {
    const { p1, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

    drawMany(engine, 0, 15);

    // Find and play a non-Fire creature
    const waterCreature = p1.hand.find(
      (c) =>
        c.type === CardType.Creature && (c as CreatureCard).affinity === "WATER"
    );

    if (waterCreature) {
      engine.playCreature(0, 0, waterCreature.id);

      const playedCreature = p1.lanes[0] as CreatureCard;
      const initialAtk = playedCreature.atk;
      const initialLogLength = game.log.getEvents().length;

      // Try to execute the effect on Water creature
      void_wisp_boost({
        state: game,
        engine,
        sourceCard: waterCreature,
        ownerIndex: 0,
        trigger: "MANUAL",
        eventData: { targetLane: 0 },
        utils: createEffectUtils(game, engine),
      });

      // Should not boost and should log failure
      expect(playedCreature.atk).toBe(initialAtk);

      const newEvents = game.log.getEvents().slice(initialLogLength);
      const messages = newEvents.map((e) => e.message).join(" ");
      expect(messages).toContain("not Fire type");
    }
  });

  it("fails when no target is selected", () => {
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
      const initialLogLength = game.log.getEvents().length;

      // Execute without eventData
      void_wisp_boost({
        state: game,
        engine,
        sourceCard: fireCreature,
        ownerIndex: 0,
        trigger: "MANUAL",
        utils: createEffectUtils(game, engine),
      });

      // Should not boost and should log failure
      expect(playedCreature.atk).toBe(initialAtk);

      const newEvents = game.log.getEvents().slice(initialLogLength);
      const messages = newEvents.map((e) => e.message).join(" ");
      expect(messages).toContain("No target selected");
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
      void_wisp_boost({
        state: game,
        engine,
        sourceCard: fireCreature,
        ownerIndex: 0,
        trigger: "MANUAL",
        eventData: { targetLane: 0 },
        utils: createEffectUtils(game, engine),
      });

      // Should have added an active effect
      expect(game.activeEffects.length).toBe(initialEffectsCount + 1);

      const addedEffect = game.activeEffects[initialEffectsCount];
      expect(addedEffect.name).toBe("Void Boost");
      expect(addedEffect.statModifiers?.atk).toBe(200);
    }
  });

  it("uses lane from eventData.lane if targetLane not provided", () => {
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
      engine.playCreature(0, 2, fireCreature.id);

      const playedCreature = p1.lanes[2] as CreatureCard;
      const initialAtk = playedCreature.atk;

      // Execute the effect using 'lane' instead of 'targetLane'
      void_wisp_boost({
        state: game,
        engine,
        sourceCard: fireCreature,
        ownerIndex: 0,
        trigger: "MANUAL",
        eventData: { lane: 2 },
        utils: createEffectUtils(game, engine),
      });

      // Should have boosted ATK
      expect(playedCreature.atk).toBe(initialAtk + 200);
    }
  });

  it("only affects owner's creatures, not opponent's", () => {
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

      // Execute the effect for player 1, targeting their lane 0
      void_wisp_boost({
        state: game,
        engine,
        sourceCard: p1FireCreature,
        ownerIndex: 0,
        trigger: "MANUAL",
        eventData: { targetLane: 0 },
        utils: createEffectUtils(game, engine),
      });

      // P1's creature should be boosted, P2's should not
      expect(p1Creature.atk).toBe(p1InitialAtk + 200);
      expect(p2Creature.atk).toBe(p2InitialAtk);
    }
  });
});
