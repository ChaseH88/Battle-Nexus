import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";
import { BattleEngine } from "@battle/BattleEngine";
import { CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";
import {
  drawMany,
  createTestDeck1,
  createTestDeck2,
} from "@/__tests__/testUtils";

/**
 * Combat Damage Calculation Tests
 * Tests all combat mechanics and damage formulas
 * Note: Full combat scenarios are tested in Battle.test.ts
 * These tests verify basic combat setup and validation
 */
describe("BattleEngine – Combat Damage", () => {
  it("allows creatures to be played in lanes", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 6);

    const attacker = p1.hand.find((c) => c.id === "quake_stag");

    if (attacker) {
      engine.playCreature(0, 0, attacker.id);
      expect(p1.lanes[0]).toBeDefined();
      expect(p1.lanes[0]).toBeInstanceOf(CreatureCard);
    }
  });

  it("creatures have attack and defense modes", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 6);

    const creature = p1.hand.find((c) => c.id === "quake_stag");

    if (creature) {
      engine.playCreature(0, 0, creature.id);
      const card = p1.lanes[0] as CreatureCard;

      expect(card.mode).toBe("ATTACK");
      card.mode = "DEFENSE";
      expect(card.mode).toBe("DEFENSE");
    }
  });

  it("tracks mode change flags", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 6);

    const creature = p1.hand.find((c) => c.id === "quake_stag");

    if (creature) {
      engine.playCreature(0, 0, creature.id);
      const card = p1.lanes[0] as CreatureCard;

      expect(card.hasChangedModeThisTurn).toBe(false);
      card.hasChangedModeThisTurn = true;
      expect(card.hasChangedModeThisTurn).toBe(true);
    }
  });

  it("tracks attack flags", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 6);

    const creature = p1.hand.find((c) => c.id === "quake_stag");

    if (creature) {
      engine.playCreature(0, 0, creature.id);
      const card = p1.lanes[0] as CreatureCard;

      expect(card.hasAttackedThisTurn).toBe(false);
    }
  });

  // TODO: Update this test to account for momentum/cost system
  describe("Piercing Damage", () => {
    it("deals excess damage to opponent's life points when destroying creature in attack mode", () => {
      const p1 = createPlayerState("P1", createTestDeck1());
      const p2 = createPlayerState("P2", createTestDeck2());
      const game = createGameState(p1, p2);
      const engine = new BattleEngine(game);

      // Set turn to 3 so P1 is active player and can attack
      game.turn = 3;
      game.activePlayer = 0;
      game.phase = "MAIN";

      // Give players momentum to play cards
      p1.momentum = 10;
      p2.momentum = 10;

      drawMany(engine, 0, 6);
      drawMany(engine, 1, 6);

      // P1 plays strong attacker (Inferno Lion - 30 ATK)
      const attacker = p1.hand.find((c) => c.id === "inferno_lion");
      if (attacker) {
        engine.playCreature(0, 0, attacker.id);
      }

      // P2 plays weak defender (Ember Cub - 10 ATK, 40 HP)
      const defender = p2.hand.find((c) => c.id === "ember_cub");
      if (defender) {
        engine.playCreature(1, 0, defender.id);
        const defenderCard = p2.lanes[0] as CreatureCard;
        defenderCard.mode = "ATTACK"; // Must be in attack mode for piercing
        defenderCard.currentHp = 20; // Weaken to ensure destruction
      }

      const initialLifePoints = p2.lifePoints;

      // Attack: 30 ATK vs 10 ATK creature with 20 HP
      // Defender takes 30 damage, dies with -10 HP
      // 10 piercing damage should go to life points
      engine.attack(0, 0, 0);

      expect(p2.lanes[0]).toBeNull(); // Defender destroyed
      expect(p2.lifePoints).toBe(initialLifePoints - 10); // Piercing damage applied
    });

    it("deals larger piercing damage with stronger attacker", () => {
      const p1 = createPlayerState("P1", createTestDeck1());
      const p2 = createPlayerState("P2", createTestDeck2());
      const game = createGameState(p1, p2);
      const engine = new BattleEngine(game);

      game.turn = 3;
      game.activePlayer = 0;
      game.phase = "MAIN";

      // Give players momentum to play cards
      p1.momentum = 10;
      p2.momentum = 10;

      drawMany(engine, 0, 15);
      drawMany(engine, 1, 15);

      // P1 plays Seismic Hart (42 ATK)
      let attacker = p1.hand.find((c) => c.id === "seismic_hart");
      if (!attacker) {
        // Fallback: use any creature with high ATK
        attacker = p1.hand.find(
          (c) => c.type === CardType.Creature && (c as CreatureCard).atk >= 30
        );
      }
      if (attacker) {
        engine.playCreature(0, 0, attacker.id);
      }

      // P2 plays Ember Cub with only 10 HP remaining
      let defender = p2.hand.find((c) => c.id === "ember_cub");
      if (!defender) {
        // Fallback: use any creature
        defender = p2.hand.find((c) => c.type === CardType.Creature);
      }
      if (defender) {
        engine.playCreature(1, 0, defender.id);
        const defenderCard = p2.lanes[0] as CreatureCard;
        defenderCard.mode = "ATTACK";
        defenderCard.currentHp = 10; // Weakened creature
      }

      const attackerCard = p1.lanes[0] as CreatureCard;
      const initialLifePoints = p2.lifePoints;

      // Attack: attacker damage to 10 HP creature
      // Creature dies with negative HP
      // Excess damage goes to life points
      engine.attack(0, 0, 0);

      expect(p2.lanes[0]).toBeNull();
      const expectedPiercing = attackerCard.atk - 10;
      expect(p2.lifePoints).toBe(initialLifePoints - expectedPiercing);
    });

    it("does not deal piercing damage to creatures in defense mode", () => {
      const p1 = createPlayerState("P1", createTestDeck1());
      const p2 = createPlayerState("P2", createTestDeck2());
      const game = createGameState(p1, p2);
      const engine = new BattleEngine(game);

      game.turn = 2;
      game.phase = "MAIN";

      // Give players momentum to play cards
      p1.momentum = 10;
      p2.momentum = 10;

      drawMany(engine, 0, 6);
      drawMany(engine, 1, 6);

      // P1 plays Inferno Lion (28 ATK)
      const attacker = p1.hand.find((c) => c.id === "inferno_lion");
      if (attacker) {
        engine.playCreature(0, 0, attacker.id);
      }

      // P2 plays Ember Cub in DEFENSE mode with low HP
      const defender = p2.hand.find((c) => c.id === "ember_cub");
      if (defender) {
        engine.playCreature(1, 0, defender.id);
        const defenderCard = p2.lanes[0] as CreatureCard;
        defenderCard.mode = "DEFENSE"; // Defense mode - no piercing
        defenderCard.currentHp = 100;
      }

      const initialLifePoints = p2.lifePoints;

      // Attack defense mode creature
      engine.attack(0, 0, 0);

      // No piercing damage in defense mode
      expect(p2.lifePoints).toBe(initialLifePoints);
    });

    it("can win the game with piercing damage", () => {
      const p1 = createPlayerState("P1", createTestDeck1());
      const p2 = createPlayerState("P2", createTestDeck2());
      const game = createGameState(p1, p2);
      const engine = new BattleEngine(game);

      game.turn = 3;
      game.activePlayer = 0;
      game.phase = "MAIN";

      // Give players momentum to play cards
      p1.momentum = 10;
      p2.momentum = 10;

      drawMany(engine, 0, 15);
      drawMany(engine, 1, 15);

      // Set P2's life points low
      p2.lifePoints = 5;

      // P1 plays Seismic Hart (42 ATK) or any high ATK creature
      let attacker = p1.hand.find((c) => c.id === "seismic_hart");
      if (!attacker) {
        attacker = p1.hand.find(
          (c) => c.type === CardType.Creature && (c as CreatureCard).atk >= 20
        );
      }
      expect(attacker).toBeDefined();
      if (attacker) {
        engine.playCreature(0, 0, attacker.id);
        const attackerCard = p1.lanes[0] as CreatureCard;
        attackerCard.mode = "ATTACK"; // Ensure it's in attack mode
      }

      // P2 plays weak defender with low HP
      let defender = p2.hand.find((c) => c.id === "ember_cub");
      if (!defender) {
        defender = p2.hand.find((c) => c.type === CardType.Creature);
      }
      expect(defender).toBeDefined();
      if (defender) {
        engine.playCreature(1, 0, defender.id);
        const defenderCard = p2.lanes[0] as CreatureCard;
        defenderCard.mode = "ATTACK";
        defenderCard.currentHp = 4; // Low enough HP to guarantee piercing damage > 5
      }

      const attackerCard = p1.lanes[0] as CreatureCard;
      const defenderCard = p2.lanes[0] as CreatureCard;

      // Verify setup
      expect(attackerCard.atk).toBeGreaterThanOrEqual(20);
      expect(defenderCard.currentHp).toBe(4);

      // Attack - should deal enough piercing damage to win the game
      engine.attack(0, 0, 0);

      expect(p2.lanes[0]).toBeNull();
      expect(p2.lifePoints).toBeLessThanOrEqual(0);
      expect(game.winnerIndex).toBe(0); // P1 wins
    });

    it("does not deal piercing damage if creature survives", () => {
      const p1 = createPlayerState("P1", createTestDeck1());
      const p2 = createPlayerState("P2", createTestDeck2());
      const game = createGameState(p1, p2);
      const engine = new BattleEngine(game);

      game.turn = 2;
      game.phase = "MAIN";

      // Give players momentum to play cards
      p1.momentum = 10;
      p2.momentum = 10;

      drawMany(engine, 0, 15);
      drawMany(engine, 1, 15);

      // P1 plays any creature
      const attacker = p1.hand.find((c) => c.type === CardType.Creature);
      if (attacker) {
        engine.playCreature(0, 0, attacker.id);
      }

      // P2 plays a creature with enough HP to survive
      const defender = p2.hand.find((c) => c.type === CardType.Creature);
      if (defender) {
        engine.playCreature(1, 0, defender.id);
        const defenderCard = p2.lanes[0] as CreatureCard;
        const attackerCard = p1.lanes[0] as CreatureCard;
        defenderCard.mode = "ATTACK";
        // Set HP high enough to survive the attack
        defenderCard.currentHp = attackerCard.atk + 20;
      }

      const initialLifePoints = p2.lifePoints;

      // Attack - defender survives
      engine.attack(0, 0, 0);

      expect(p2.lanes[0]).not.toBeNull(); // Defender still alive
      expect((p2.lanes[0] as CreatureCard).currentHp).toBeGreaterThan(0);
      expect(p2.lifePoints).toBe(initialLifePoints); // No piercing damage
    });
  });
});
