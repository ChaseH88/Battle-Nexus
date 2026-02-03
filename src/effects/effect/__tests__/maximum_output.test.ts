import { CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";
import { maximum_output } from "@effects/effect/maximum_output";
import { createEffectUtils } from "@effects/handler";
import { createTestGame, drawMany } from "@/__tests__/testUtils";

/**
 * Maximum Output Effect Tests
 * Tests the maximum_output effect: Consume all momentum. Target creature gains +10 ATK for each momentum consumed.
 */
describe("Effect: maximum_output", () => {
  it("boosts target creature by +10 ATK per momentum and consumes all momentum", () => {
    const { p1, game, engine } = createTestGame();

    // Give player momentum
    game.players[0].momentum = 5;
    game.players[1].momentum = 10;

    drawMany(engine, 0, 10);

    // Find and play a creature
    const creature = p1.hand.find((c) => c.type === CardType.Creature);

    if (creature) {
      engine.playCreature(0, 0, creature.id);

      const playedCreature = p1.lanes[0] as CreatureCard;
      const initialAtk = playedCreature.atk;
      const initialMomentum = game.players[0].momentum;

      // Execute the effect targeting lane 0
      maximum_output({
        state: game,
        engine,
        sourceCard: creature,
        ownerIndex: 0,
        trigger: "MANUAL",
        eventData: { targetLane: 0 },
        utils: createEffectUtils(game, engine),
      });

      // Should have boosted ATK by (momentum * 10)
      expect(playedCreature.atk).toBe(initialAtk + initialMomentum * 10);
      // Momentum should be consumed (set to 0)
      expect(game.players[0].momentum).toBe(0);
    }
  });

  it("boosts by different amounts based on momentum available", () => {
    const { p1, game, engine } = createTestGame();

    // Give player different momentum amounts
    game.players[0].momentum = 3;

    drawMany(engine, 0, 10);

    // Find and play a creature
    const creature = p1.hand.find((c) => c.type === CardType.Creature);

    if (creature) {
      engine.playCreature(0, 0, creature.id);

      const playedCreature = p1.lanes[0] as CreatureCard;
      const initialAtk = playedCreature.atk;

      // Execute the effect targeting lane 0
      maximum_output({
        state: game,
        engine,
        sourceCard: creature,
        ownerIndex: 0,
        trigger: "MANUAL",
        eventData: { targetLane: 0 },
        utils: createEffectUtils(game, engine),
      });

      // Should have boosted ATK by (3 * 10) = 30
      expect(playedCreature.atk).toBe(initialAtk + 30);
      expect(game.players[0].momentum).toBe(0);
    }
  });

  it("targets specific lane when provided in eventData", () => {
    const { p1, game, engine } = createTestGame();

    // Give player momentum
    game.players[0].momentum = 4;

    drawMany(engine, 0, 15);

    // Find and play creatures in multiple lanes
    const creatures = p1.hand.filter((c) => c.type === CardType.Creature);

    if (creatures.length >= 2) {
      engine.playCreature(0, 0, creatures[0].id);
      engine.playCreature(0, 1, creatures[1].id);

      const creature0 = p1.lanes[0] as CreatureCard;
      const creature1 = p1.lanes[1] as CreatureCard;

      const initialAtk0 = creature0.atk;
      const initialAtk1 = creature1.atk;

      // Execute the effect targeting lane 1 only
      maximum_output({
        state: game,
        engine,
        sourceCard: creatures[0],
        ownerIndex: 0,
        trigger: "MANUAL",
        eventData: { targetLane: 1 },
        utils: createEffectUtils(game, engine),
      });

      // Only creature in lane 1 should be boosted
      expect(creature0.atk).toBe(initialAtk0);
      expect(creature1.atk).toBe(initialAtk1 + 40); // 4 momentum * 10
      expect(game.players[0].momentum).toBe(0);
    }
  });

  it("fails when targeting empty lane", () => {
    const { p1, game, engine } = createTestGame();

    // Give player momentum
    game.players[0].momentum = 5;

    drawMany(engine, 0, 10);

    const creature = p1.hand.find((c) => c.type === CardType.Creature);

    if (creature) {
      // Don't play any creatures, target empty lane
      const initialLogLength = game.log.getEvents().length;
      const initialMomentum = game.players[0].momentum;

      maximum_output({
        state: game,
        engine,
        sourceCard: creature,
        ownerIndex: 0,
        trigger: "MANUAL",
        eventData: { targetLane: 0 },
        utils: createEffectUtils(game, engine),
      });

      // Should log failure message
      const newEvents = game.log.getEvents().slice(initialLogLength);
      const messages = newEvents.map((e) => e.message).join(" ");
      expect(messages).toContain("No creature in chosen lane");
      // Momentum should not be consumed
      expect(game.players[0].momentum).toBe(initialMomentum);
    }
  });

  it("fails when player has no momentum", () => {
    const { p1, game, engine } = createTestGame();

    // Set momentum to 0
    game.players[0].momentum = 0;

    drawMany(engine, 0, 10);

    const creature = p1.hand.find((c) => c.type === CardType.Creature);

    if (creature) {
      engine.playCreature(0, 0, creature.id);

      const playedCreature = p1.lanes[0] as CreatureCard;
      const initialAtk = playedCreature.atk;
      const initialLogLength = game.log.getEvents().length;

      // Try to execute the effect with no momentum
      maximum_output({
        state: game,
        engine,
        sourceCard: creature,
        ownerIndex: 0,
        trigger: "MANUAL",
        eventData: { targetLane: 0 },
        utils: createEffectUtils(game, engine),
      });

      // Should log failure message
      const newEvents = game.log.getEvents().slice(initialLogLength);
      const messages = newEvents.map((e) => e.message).join(" ");
      expect(messages).toContain("No momentum to consume");
      // ATK should not change
      expect(playedCreature.atk).toBe(initialAtk);
    }
  });

  it("fails when no target is selected", () => {
    const { p1, game, engine } = createTestGame();

    // Give player momentum
    game.players[0].momentum = 5;

    drawMany(engine, 0, 10);

    const creature = p1.hand.find((c) => c.type === CardType.Creature);

    if (creature) {
      engine.playCreature(0, 0, creature.id);

      const playedCreature = p1.lanes[0] as CreatureCard;
      const initialAtk = playedCreature.atk;
      const initialLogLength = game.log.getEvents().length;
      const initialMomentum = game.players[0].momentum;

      // Execute without targetLane in eventData
      maximum_output({
        state: game,
        engine,
        sourceCard: creature,
        ownerIndex: 0,
        trigger: "MANUAL",
        eventData: {},
        utils: createEffectUtils(game, engine),
      });

      // Should log failure message
      const newEvents = game.log.getEvents().slice(initialLogLength);
      const messages = newEvents.map((e) => e.message).join(" ");
      expect(messages).toContain("No target selected");
      // ATK should not change
      expect(playedCreature.atk).toBe(initialAtk);
      // Momentum should not be consumed
      expect(game.players[0].momentum).toBe(initialMomentum);
    }
  });

  it("works with high momentum values", () => {
    const { p1, game, engine } = createTestGame();

    // Give player high momentum
    game.players[0].momentum = 10;

    drawMany(engine, 0, 10);

    const creature = p1.hand.find((c) => c.type === CardType.Creature);

    if (creature) {
      engine.playCreature(0, 0, creature.id);

      const playedCreature = p1.lanes[0] as CreatureCard;
      const initialAtk = playedCreature.atk;

      // Execute the effect targeting lane 0
      maximum_output({
        state: game,
        engine,
        sourceCard: creature,
        ownerIndex: 0,
        trigger: "MANUAL",
        eventData: { targetLane: 0 },
        utils: createEffectUtils(game, engine),
      });

      // Should have boosted ATK by (10 * 10) = 100
      expect(playedCreature.atk).toBe(initialAtk + 100);
      expect(game.players[0].momentum).toBe(0);
    }
  });

  it("metadata.canActivate returns false when no momentum", () => {
    const { game, engine } = createTestGame();

    game.players[0].momentum = 0;

    // Play a creature
    drawMany(engine, 0, 10);
    const creature = game.players[0].hand.find(
      (c) => c.type === CardType.Creature,
    );
    if (creature) {
      engine.playCreature(0, 0, creature.id);

      const result = maximum_output.metadata?.canActivate?.(game, 0);
      expect(result?.canActivate).toBe(false);
      expect(result?.reason).toContain("no momentum");
    }
  });

  it("metadata.canActivate returns false when no creatures on field", () => {
    const { game } = createTestGame();

    game.players[0].momentum = 5;
    // Don't play any creatures

    const result = maximum_output.metadata?.canActivate?.(game, 0);
    expect(result?.canActivate).toBe(false);
    expect(result?.reason).toContain("no creatures");
  });

  it("metadata.canActivate returns true when momentum and creatures available", () => {
    const { game, engine } = createTestGame();

    game.players[0].momentum = 5;

    // Play a creature
    drawMany(engine, 0, 10);
    const creature = game.players[0].hand.find(
      (c) => c.type === CardType.Creature,
    );
    if (creature) {
      engine.playCreature(0, 0, creature.id);

      const result = maximum_output.metadata?.canActivate?.(game, 0);
      expect(result?.canActivate).toBe(true);
      expect(result?.reason).toBeUndefined();
    }
  });
});
