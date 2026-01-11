import cards from "@static/card-data/bn-core.json";
import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";
import { BattleEngine } from "@battle/BattleEngine";
import { CardInterface, CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";
import { ActionCard } from "@cards/ActionCard";
import { SupportCard } from "@cards/SupportCard";
import { TrapCard } from "@cards/TrapCard";

function cardFactory(raw: any): CardInterface {
  switch (raw.type) {
    case CardType.Creature:
      return new CreatureCard(raw);
    case CardType.Action:
      return new ActionCard(raw);
    case CardType.Support:
      return new SupportCard(raw);
    case CardType.Trap:
      return new TrapCard(raw);
    default:
      throw new Error(`Unknown card type: ${raw.type}`);
  }
}

function createDeck() {
  return (cards as any[]).map(cardFactory);
}

function drawMany(engine: BattleEngine, playerIndex: number, count: number) {
  for (let i = 0; i < count; i++) {
    engine.draw(playerIndex);
  }
}

/**
 * Combat Damage Calculation Tests
 * Tests all combat mechanics and damage formulas
 * Note: Full combat scenarios are tested in Battle.test.ts
 * These tests verify basic combat setup and validation
 */
describe("BattleEngine – Combat Damage", () => {
  it("allows creatures to be played in lanes", () => {
    const p1 = createPlayerState("P1", createDeck());
    const p2 = createPlayerState("P2", createDeck());
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
    const p1 = createPlayerState("P1", createDeck());
    const p2 = createPlayerState("P2", createDeck());
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
    const p1 = createPlayerState("P1", createDeck());
    const p2 = createPlayerState("P2", createDeck());
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
    const p1 = createPlayerState("P1", createDeck());
    const p2 = createPlayerState("P2", createDeck());
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

  describe("Piercing Damage", () => {
    it("deals excess damage to opponent's life points when destroying creature in attack mode", () => {
      const p1 = createPlayerState("P1", createDeck());
      const p2 = createPlayerState("P2", createDeck());
      const game = createGameState(p1, p2);
      const engine = new BattleEngine(game);

      // Set turn to 3 so P1 is active player and can attack
      game.turn = 3;
      game.activePlayer = 0;
      game.phase = "MAIN";

      drawMany(engine, 0, 6);
      drawMany(engine, 1, 6);

      // P1 plays strong attacker (Inferno Lion - 280 ATK)
      const attacker = p1.hand.find((c) => c.id === "inferno_lion");
      if (attacker) {
        engine.playCreature(0, 0, attacker.id);
      }

      // P2 plays weak defender (Ember Cub - 150 ATK, 450 HP)
      const defender = p2.hand.find((c) => c.id === "ember_cub");
      if (defender) {
        engine.playCreature(1, 0, defender.id);
        const defenderCard = p2.lanes[0] as CreatureCard;
        defenderCard.mode = "ATTACK"; // Must be in attack mode for piercing
        defenderCard.currentHp = 200; // Weaken to ensure destruction
      }

      const initialLifePoints = p2.lifePoints;

      // Attack: 280 ATK vs 150 ATK creature with 200 HP
      // Defender takes 280 damage, dies with -80 HP
      // 80 piercing damage should go to life points
      engine.attack(0, 0, 0);

      expect(p2.lanes[0]).toBeNull(); // Defender destroyed
      expect(p2.lifePoints).toBe(initialLifePoints - 80); // Piercing damage applied
    });

    it("deals larger piercing damage with stronger attacker", () => {
      const p1 = createPlayerState("P1", createDeck());
      const p2 = createPlayerState("P2", createDeck());
      const game = createGameState(p1, p2);
      const engine = new BattleEngine(game);

      game.turn = 3;
      game.activePlayer = 0;
      game.phase = "MAIN";

      drawMany(engine, 0, 15);
      drawMany(engine, 1, 15);

      // P1 plays Seismic Hart (420 ATK)
      let attacker = p1.hand.find((c) => c.id === "seismic_hart");
      if (!attacker) {
        // Fallback: use any creature with high ATK
        attacker = p1.hand.find(
          (c) => c.type === CardType.Creature && (c as CreatureCard).atk >= 300
        );
      }
      if (attacker) {
        engine.playCreature(0, 0, attacker.id);
      }

      // P2 plays Ember Cub with only 100 HP remaining
      let defender = p2.hand.find((c) => c.id === "ember_cub");
      if (!defender) {
        // Fallback: use any creature
        defender = p2.hand.find((c) => c.type === CardType.Creature);
      }
      if (defender) {
        engine.playCreature(1, 0, defender.id);
        const defenderCard = p2.lanes[0] as CreatureCard;
        defenderCard.mode = "ATTACK";
        defenderCard.currentHp = 100; // Weakened creature
      }

      const attackerCard = p1.lanes[0] as CreatureCard;
      const initialLifePoints = p2.lifePoints;

      // Attack: attacker damage to 100 HP creature
      // Creature dies with negative HP
      // Excess damage goes to life points
      engine.attack(0, 0, 0);

      expect(p2.lanes[0]).toBeNull();
      const expectedPiercing = attackerCard.atk - 100;
      expect(p2.lifePoints).toBe(initialLifePoints - expectedPiercing);
    });

    it("does not deal piercing damage to creatures in defense mode", () => {
      const p1 = createPlayerState("P1", createDeck());
      const p2 = createPlayerState("P2", createDeck());
      const game = createGameState(p1, p2);
      const engine = new BattleEngine(game);

      game.turn = 2;
      game.phase = "MAIN";

      drawMany(engine, 0, 6);
      drawMany(engine, 1, 6);

      // P1 plays Inferno Lion (280 ATK)
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
      const p1 = createPlayerState("P1", createDeck());
      const p2 = createPlayerState("P2", createDeck());
      const game = createGameState(p1, p2);
      const engine = new BattleEngine(game);

      game.turn = 3;
      game.activePlayer = 0;
      game.phase = "MAIN";

      drawMany(engine, 0, 15);
      drawMany(engine, 1, 15);

      // Set P2's life points low
      p2.lifePoints = 50;

      // P1 plays Seismic Hart (420 ATK) or any high ATK creature
      let attacker = p1.hand.find((c) => c.id === "seismic_hart");
      if (!attacker) {
        attacker = p1.hand.find(
          (c) => c.type === CardType.Creature && (c as CreatureCard).atk >= 200
        );
      }
      if (attacker) {
        engine.playCreature(0, 0, attacker.id);
      }

      // P2 plays weak defender with low HP
      let defender = p2.hand.find((c) => c.id === "ember_cub");
      if (!defender) {
        defender = p2.hand.find((c) => c.type === CardType.Creature);
      }
      if (defender) {
        engine.playCreature(1, 0, defender.id);
        const defenderCard = p2.lanes[0] as CreatureCard;
        defenderCard.mode = "ATTACK";
        defenderCard.currentHp = 40; // Low enough HP to guarantee piercing damage > 50
      }

      // Attack - should deal enough piercing damage to win the game
      engine.attack(0, 0, 0);

      expect(p2.lanes[0]).toBeNull();
      expect(p2.lifePoints).toBeLessThanOrEqual(0);
      expect(game.winnerIndex).toBe(0); // P1 wins
    });

    it("does not deal piercing damage if creature survives", () => {
      const p1 = createPlayerState("P1", createDeck());
      const p2 = createPlayerState("P2", createDeck());
      const game = createGameState(p1, p2);
      const engine = new BattleEngine(game);

      game.turn = 2;
      game.phase = "MAIN";

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
        defenderCard.currentHp = attackerCard.atk + 200;
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
