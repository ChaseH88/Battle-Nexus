import { direct_burn_damage } from "@effects/effect/direct_burn_damage";
import { createEffectUtils } from "@effects/handler";
import { createTestGame, cardFactory } from "@/__tests__/testUtils";
import { CardType, CreatureCard } from "@cards";

/**
 * Direct Burn Damage Effect Tests
 * Tests the direct_burn_damage effect (Blazing Strike)
 */
describe("Effect: direct_burn_damage", () => {
  it("deals 300 damage to opponent when no Fire creatures are controlled", () => {
    const { p2, game, engine } = createTestGame();

    const initialLP = p2.lifePoints;
    const testCard = cardFactory({
      id: "blazing_strike",
      type: CardType.Action,
      name: "Blazing Strike",
    });

    // Execute the effect (no Fire creatures on field)
    direct_burn_damage({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_PLAY",
      utils: createEffectUtils(game, engine),
    });

    // Should deal 300 damage
    expect(p2.lifePoints).toBe(initialLP - 300);
  });

  it("deals 500 damage to opponent when controlling a Fire creature", () => {
    const { p1, p2, game, engine } = createTestGame();

    const initialLP = p2.lifePoints;

    // Add a Fire creature to P1's field
    const fireCreature = cardFactory({
      id: "fire_creature",
      type: CardType.Creature,
      name: "Fire Beast",
      affinity: "FIRE",
      atk: 200,
      def: 150,
      hp: 600,
    }) as CreatureCard;
    p1.lanes[0] = fireCreature;

    const testCard = cardFactory({
      id: "blazing_strike",
      type: CardType.Action,
      name: "Blazing Strike",
    });

    // Execute the effect with Fire creature present
    direct_burn_damage({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_PLAY",
      utils: createEffectUtils(game, engine),
    });

    // Should deal 500 damage
    expect(p2.lifePoints).toBe(initialLP - 500);
  });

  it("checks all lanes for Fire creatures", () => {
    const { p1, p2, game, engine } = createTestGame();

    const initialLP = p2.lifePoints;

    // Add Fire creature in lane 2 (not lane 0)
    const fireCreature = cardFactory({
      id: "fire_creature",
      type: CardType.Creature,
      name: "Fire Beast",
      affinity: "FIRE",
      atk: 200,
      def: 150,
      hp: 600,
    }) as CreatureCard;
    p1.lanes[2] = fireCreature;

    const testCard = cardFactory({
      id: "blazing_strike",
      type: CardType.Action,
      name: "Blazing Strike",
    });

    // Execute the effect
    direct_burn_damage({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_PLAY",
      utils: createEffectUtils(game, engine),
    });

    // Should deal 500 damage (found Fire creature in lane 2)
    expect(p2.lifePoints).toBe(initialLP - 500);
  });

  it("only checks controlling player's creatures, not opponent's", () => {
    const { p2, game, engine } = createTestGame();

    const initialLP = p2.lifePoints;

    // Add Fire creature to OPPONENT'S field (should not count)
    const fireCreature = cardFactory({
      id: "fire_creature",
      type: CardType.Creature,
      name: "Fire Beast",
      affinity: "FIRE",
      atk: 200,
      def: 150,
      hp: 600,
    }) as CreatureCard;
    p2.lanes[0] = fireCreature;

    const testCard = cardFactory({
      id: "blazing_strike",
      type: CardType.Action,
      name: "Blazing Strike",
    });

    // Execute the effect
    direct_burn_damage({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_PLAY",
      utils: createEffectUtils(game, engine),
    });

    // Should deal 300 damage (opponent's Fire creature doesn't count)
    expect(p2.lifePoints).toBe(initialLP - 300);
  });

  it("deals bonus damage with multiple Fire creatures", () => {
    const { p1, p2, game, engine } = createTestGame();

    const initialLP = p2.lifePoints;

    // Add multiple Fire creatures
    const fireCreature1 = cardFactory({
      id: "fire_creature_1",
      type: CardType.Creature,
      name: "Fire Beast 1",
      affinity: "FIRE",
      atk: 200,
      def: 150,
      hp: 600,
    }) as CreatureCard;
    const fireCreature2 = cardFactory({
      id: "fire_creature_2",
      type: CardType.Creature,
      name: "Fire Beast 2",
      affinity: "FIRE",
      atk: 300,
      def: 200,
      hp: 800,
    }) as CreatureCard;

    p1.lanes[0] = fireCreature1;
    p1.lanes[1] = fireCreature2;

    const testCard = cardFactory({
      id: "blazing_strike",
      type: CardType.Action,
      name: "Blazing Strike",
    });

    // Execute the effect
    direct_burn_damage({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_PLAY",
      utils: createEffectUtils(game, engine),
    });

    // Should still deal 500 damage (not scaled by count)
    expect(p2.lifePoints).toBe(initialLP - 500);
  });

  it("works with mixed affinity creatures (Fire + Water)", () => {
    const { p1, p2, game, engine } = createTestGame();

    const initialLP = p2.lifePoints;

    // Add Fire and Water creatures
    const fireCreature = cardFactory({
      id: "fire_creature",
      type: CardType.Creature,
      name: "Fire Beast",
      affinity: "FIRE",
      atk: 200,
      def: 150,
      hp: 600,
    }) as CreatureCard;
    const waterCreature = cardFactory({
      id: "water_creature",
      type: CardType.Creature,
      name: "Water Beast",
      affinity: "WATER",
      atk: 150,
      def: 250,
      hp: 700,
    }) as CreatureCard;

    p1.lanes[0] = fireCreature;
    p1.lanes[1] = waterCreature;

    const testCard = cardFactory({
      id: "blazing_strike",
      type: CardType.Action,
      name: "Blazing Strike",
    });

    // Execute the effect
    direct_burn_damage({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_PLAY",
      utils: createEffectUtils(game, engine),
    });

    // Should deal 500 damage (has at least one Fire creature)
    expect(p2.lifePoints).toBe(initialLP - 500);
  });

  it("logs the damage dealt", () => {
    const { game, engine } = createTestGame();

    const testCard = cardFactory({
      id: "blazing_strike",
      type: CardType.Action,
      name: "Blazing Strike",
    });

    const initialEventCount = game.log.getEvents().length;

    direct_burn_damage({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_PLAY",
      utils: createEffectUtils(game, engine),
    });

    // Should have logged something
    expect(game.log.getEvents().length).toBeGreaterThan(initialEventCount);
  });
});
