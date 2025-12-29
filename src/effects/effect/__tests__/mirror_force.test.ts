import { CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";
import { mirror_force } from "@effects/effect/mirror_force";
import { createEffectUtils } from "@effects/handler";
import { createTestGame } from "@/__tests__/testUtils";

/**
 * Mirror Force Effect Tests
 * Tests the mirror_force trap effect (Mirror Force)
 * Destroys all opponent's attack position creatures when activated
 */
describe("Effect: mirror_force", () => {
  it("destroys all opponent's creatures in attack mode", () => {
    const { p2, game, engine } = createTestGame();

    // P2 (opponent) plays three creatures in attack mode
    const creature1 = p2.hand.find((c) => c.type === CardType.Creature);
    const creature2 = p2.hand.find(
      (c) => c.type === CardType.Creature && c.id !== creature1?.id
    );
    const creature3 = p2.hand.find(
      (c) =>
        c.type === CardType.Creature &&
        c.id !== creature1?.id &&
        c.id !== creature2?.id
    );

    if (creature1 && creature2 && creature3) {
      engine.playCreature(1, 0, creature1.id, false, "ATTACK");
      engine.playCreature(1, 1, creature2.id, false, "ATTACK");
      engine.playCreature(1, 2, creature3.id, false, "ATTACK");

      const initialP2DiscardCount = p2.discardPile.length;

      // Execute Mirror Force effect (P1 is the owner)
      mirror_force({
        state: game,
        engine,
        sourceCard: creature1, // Doesn't matter for trap
        ownerIndex: 0, // P1 owns the trap
        trigger: "ON_DEFEND",
        utils: createEffectUtils(game, engine),
      });

      // All opponent's creatures should be destroyed
      expect(p2.lanes[0]).toBeNull();
      expect(p2.lanes[1]).toBeNull();
      expect(p2.lanes[2]).toBeNull();

      // All creatures should be in discard pile
      expect(p2.discardPile.length).toBe(initialP2DiscardCount + 3);
    }
  });

  it("only destroys attack mode creatures, not defense mode", () => {
    const { p2, game, engine } = createTestGame();

    // P2 plays creatures: 2 in attack mode, 1 in defense mode
    const creatures = p2.hand.filter((c) => c.type === CardType.Creature);

    if (creatures.length >= 3) {
      engine.playCreature(1, 0, creatures[0].id, false, "ATTACK");
      engine.playCreature(1, 1, creatures[1].id, false, "DEFENSE");
      engine.playCreature(1, 2, creatures[2].id, false, "ATTACK");

      const defenseCreatureId = p2.lanes[1]?.id;

      // Execute Mirror Force effect
      mirror_force({
        state: game,
        engine,
        sourceCard: creatures[0],
        ownerIndex: 0,
        trigger: "ON_DEFEND",
        utils: createEffectUtils(game, engine),
      });

      // Attack mode creatures should be destroyed
      expect(p2.lanes[0]).toBeNull();
      expect(p2.lanes[2]).toBeNull();

      // Defense mode creature should survive
      expect(p2.lanes[1]).not.toBeNull();
      expect(p2.lanes[1]?.id).toBe(defenseCreatureId);
      expect((p2.lanes[1] as CreatureCard).mode).toBe("DEFENSE");
    }
  });

  it("does nothing when opponent has no attack mode creatures", () => {
    const { p2, game, engine } = createTestGame();

    // P2 plays creatures only in defense mode
    const creatures = p2.hand.filter((c) => c.type === CardType.Creature);

    if (creatures.length >= 2) {
      engine.playCreature(1, 0, creatures[0].id, false, "DEFENSE");
      engine.playCreature(1, 1, creatures[1].id, false, "DEFENSE");

      const initialDiscardCount = p2.discardPile.length;
      const creature1Id = p2.lanes[0]?.id;
      const creature2Id = p2.lanes[1]?.id;

      // Execute Mirror Force effect
      mirror_force({
        state: game,
        engine,
        sourceCard: creatures[0],
        ownerIndex: 0,
        trigger: "ON_DEFEND",
        utils: createEffectUtils(game, engine),
      });

      // No creatures should be destroyed
      expect(p2.lanes[0]).not.toBeNull();
      expect(p2.lanes[1]).not.toBeNull();
      expect(p2.lanes[0]?.id).toBe(creature1Id);
      expect(p2.lanes[1]?.id).toBe(creature2Id);

      // Discard pile should remain unchanged
      expect(p2.discardPile.length).toBe(initialDiscardCount);
    }
  });

  it("does nothing when opponent has no creatures at all", () => {
    const { p2, game, engine } = createTestGame();

    // P2 has no creatures on field
    expect(p2.lanes.every((c) => c === null)).toBe(true);

    const initialDiscardCount = p2.discardPile.length;
    const dummyCard = p2.hand[0];

    // Execute Mirror Force effect
    mirror_force({
      state: game,
      engine,
      sourceCard: dummyCard,
      ownerIndex: 0,
      trigger: "ON_DEFEND",
      utils: createEffectUtils(game, engine),
    });

    // No creatures to destroy
    expect(p2.lanes.every((c) => c === null)).toBe(true);
    expect(p2.discardPile.length).toBe(initialDiscardCount);
  });

  it("destroys partial board (some lanes occupied)", () => {
    const { p2, game, engine } = createTestGame();

    // P2 plays creatures in only 2 lanes
    const creatures = p2.hand.filter((c) => c.type === CardType.Creature);

    if (creatures.length >= 2) {
      engine.playCreature(1, 0, creatures[0].id, false, "ATTACK");
      engine.playCreature(1, 2, creatures[1].id, false, "ATTACK");

      // Lane 1 is empty
      expect(p2.lanes[1]).toBeNull();

      const initialDiscardCount = p2.discardPile.length;

      // Execute Mirror Force effect
      mirror_force({
        state: game,
        engine,
        sourceCard: creatures[0],
        ownerIndex: 0,
        trigger: "ON_DEFEND",
        utils: createEffectUtils(game, engine),
      });

      // Occupied lanes should be cleared
      expect(p2.lanes[0]).toBeNull();
      expect(p2.lanes[2]).toBeNull();

      // Lane 1 should still be empty
      expect(p2.lanes[1]).toBeNull();

      // Both creatures should be in discard
      expect(p2.discardPile.length).toBe(initialDiscardCount + 2);
    }
  });

  it("logs destruction count correctly", () => {
    const { p2, game, engine } = createTestGame();

    // Play 2 attack mode creatures
    const creatures = p2.hand.filter((c) => c.type === CardType.Creature);

    if (creatures.length >= 2) {
      engine.playCreature(1, 0, creatures[0].id, false, "ATTACK");
      engine.playCreature(1, 1, creatures[1].id, false, "ATTACK");

      const initialLogLength = game.log.getEvents().length;

      // Execute Mirror Force effect
      mirror_force({
        state: game,
        engine,
        sourceCard: creatures[0],
        ownerIndex: 0,
        trigger: "ON_DEFEND",
        utils: createEffectUtils(game, engine),
      });

      // Should have logged destruction messages
      const newLogs = game.log.getEvents().slice(initialLogLength);
      const destructionLog = newLogs.find((entry) =>
        entry.message.includes("Mirror Force destroyed")
      );

      expect(destructionLog).toBeDefined();
      expect(destructionLog?.message).toContain("2 creatures");
    }
  });

  it("does not affect P1's (owner's) creatures", () => {
    const { p1, p2, game, engine } = createTestGame();

    // P1 plays creatures in attack mode
    const p1Creatures = p1.hand.filter((c) => c.type === CardType.Creature);
    // P2 plays creatures in attack mode
    const p2Creatures = p2.hand.filter((c) => c.type === CardType.Creature);

    if (p1Creatures.length >= 1 && p2Creatures.length >= 1) {
      engine.playCreature(0, 0, p1Creatures[0].id, false, "ATTACK");
      engine.playCreature(1, 0, p2Creatures[0].id, false, "ATTACK");

      const p1CreatureId = p1.lanes[0]?.id;

      // Execute Mirror Force effect (P1 is the owner)
      mirror_force({
        state: game,
        engine,
        sourceCard: p1Creatures[0],
        ownerIndex: 0, // P1 owns the trap
        trigger: "ON_DEFEND",
        utils: createEffectUtils(game, engine),
      });

      // P1's creature should survive
      expect(p1.lanes[0]).not.toBeNull();
      expect(p1.lanes[0]?.id).toBe(p1CreatureId);

      // P2's creature should be destroyed
      expect(p2.lanes[0]).toBeNull();
    }
  });
});
