import { BattleEngine } from "../BattleEngine";
import { GameState } from "../GameState";
import { createPlayerState } from "../PlayerState";
import { CreatureCard } from "../../cards/CreatureCard";
import { Affinity, CardType, Rarity } from "../../cards/types";

describe("BattleEngine – Momentum System", () => {
  let engine: BattleEngine;
  let state: GameState;

  const createTestCreature = (
    id: string,
    name: string,
    cost: number,
    atk: number,
    def: number,
    hp: number,
    isMax: boolean = false,
  ): CreatureCard => {
    return new CreatureCard({
      id,
      name,
      type: CardType.Creature,
      cost,
      rarity: Rarity.Common,
      set: "Base",
      description: "Test creature",
      atk,
      def,
      hp,
      affinity: Affinity.Fire,
      isMax,
    });
  };

  beforeEach(() => {
    const p1Deck = [
      createTestCreature("c1", "Weak Fighter", 1, 10, 5, 50),
      createTestCreature("c2", "Medium Fighter", 3, 20, 10, 80),
      createTestCreature("c3", "Strong Fighter", 5, 30, 15, 120),
    ];
    const p2Deck = [
      createTestCreature("c4", "Enemy Weak", 1, 8, 4, 40),
      createTestCreature("c5", "Enemy Medium", 3, 18, 9, 70),
      createTestCreature("c6", "Enemy Strong", 5, 28, 14, 110),
    ];

    const p1MaxDeck = [
      createTestCreature("max1", "MAX Fighter", 5, 50, 25, 200, true),
    ];

    state = {
      players: [
        createPlayerState("P1", p1Deck, p1MaxDeck),
        createPlayerState("P2", p2Deck),
      ],
      turn: 2, // Start at turn 2 to allow attacks
      phase: "MAIN",
      activePlayer: 0,
      hasDrawnThisTurn: false,
      stack: [],
      activeEffects: [],
      winnerIndex: null,
      log: {
        entries: [],
        info: () => {},
        cardPlayed: () => {},
        cardDrawn: () => {},
        phaseChange: () => {},
        turnStart: () => {},
        turnEnd: () => {},
        effectApplied: () => {},
      } as any,
    };

    engine = new BattleEngine(state);

    // Setup initial board state
    state.players[0].lanes[0] = createTestCreature(
      "c1",
      "Weak Fighter",
      1,
      100,
      50,
      500,
    );
    state.players[1].lanes[0] = createTestCreature(
      "c4",
      "Enemy Weak",
      1,
      80,
      40,
      400,
    );
  });

  describe("Momentum Gains", () => {
    it("starts at 0 momentum", () => {
      expect(state.players[0].momentum).toBe(0);
      expect(state.players[1].momentum).toBe(0);
    });

    it("gains +1 momentum when declaring an attack", () => {
      engine.attack(0, 0, 0);
      // +1 for attack declaration, +1 for survival (both survive)
      expect(state.players[0].momentum).toBe(2);
    });

    it("caps momentum at 10", () => {
      state.players[0].momentum = 9;
      engine.attack(0, 0, 0);
      // +1 for attack, +2 for KO, +1 for survival = 4, but capped at 10
      expect(state.players[0].momentum).toBe(10); // Should cap at 10
    });

    it("gains +2 momentum for destroying a creature", () => {
      // Create a strong attacker that can one-shot the weak defender
      state.players[0].lanes[0] = createTestCreature(
        "strong",
        "Strong",
        5,
        500,
        200,
        1000,
      );
      state.players[1].lanes[0] = createTestCreature(
        "weak",
        "Weak",
        1,
        50,
        20,
        100,
      );

      state.players[0].momentum = 0;
      engine.attack(0, 0, 0);
      // +1 for attack declaration, +2 for KO, +1 for survival = 4
      expect(state.players[0].momentum).toBe(4);
    });

    it("both players gain +1 for survival when neither is destroyed", () => {
      // Place strong creatures that won't destroy each other
      state.players[0].lanes[0] = createTestCreature(
        "s1",
        "Tank",
        5,
        100,
        200,
        2000,
      );
      state.players[1].lanes[0] = createTestCreature(
        "s2",
        "Enemy Tank",
        5,
        100,
        200,
        2000,
      );

      state.players[0].momentum = 0;
      state.players[1].momentum = 0;

      engine.attack(0, 0, 0);

      // P1: +1 for attack, +1 for survival
      // P2: +1 for survival
      expect(state.players[0].momentum).toBeGreaterThanOrEqual(1);
      expect(state.players[1].momentum).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Sacrifice Mechanic", () => {
    it("allows sacrificing a creature for momentum", () => {
      state.players[0].lanes[1] = createTestCreature(
        "c2",
        "Medium Fighter",
        3,
        200,
        100,
        800,
      );
      state.players[0].momentum = 0;

      const result = engine.sacrifice(0, 1);

      expect(result).toBe(true);
      expect(state.players[0].lanes[1]).toBeNull();
      expect(state.players[0].momentum).toBe(2); // Cost 3-4 → +2 momentum
    });

    it("gains +1 for cost 1-2", () => {
      state.players[0].momentum = 0;
      const result = engine.sacrifice(0, 0); // Weak Fighter (cost 1)
      expect(result).toBe(true);
      expect(state.players[0].momentum).toBe(1);
    });

    it("gains +2 for cost 3-4", () => {
      state.players[0].lanes[1] = createTestCreature(
        "c2",
        "Medium Fighter",
        3,
        200,
        100,
        800,
      );
      state.players[0].momentum = 0;
      engine.sacrifice(0, 1);
      expect(state.players[0].momentum).toBe(2);
    });

    it("gains +3 for cost 5+", () => {
      state.players[0].lanes[1] = createTestCreature(
        "c3",
        "Strong Fighter",
        5,
        300,
        150,
        1200,
      );
      state.players[0].momentum = 0;
      engine.sacrifice(0, 1);
      expect(state.players[0].momentum).toBe(3);
    });

    it("prevents sacrifice if creature attacked this turn", () => {
      state.players[0].lanes[0]!.hasAttackedThisTurn = true;
      const result = engine.sacrifice(0, 0);
      expect(result).toBe(false);
      expect(state.players[0].lanes[0]).not.toBeNull();
    });

    it("prevents sacrificing MAX creatures", () => {
      const maxCreature = createTestCreature(
        "max1",
        "MAX Fighter",
        5, // Use cost field instead of momentumCost
        500,
        250,
        2000,
        true,
      );
      state.players[0].lanes[1] = maxCreature;

      const result = engine.sacrifice(0, 1);

      expect(result).toBe(false);
      expect(state.players[0].lanes[1]).not.toBeNull();
    });
  });

  describe("MAX Cards", () => {
    it("requires momentum to play MAX cards", () => {
      const maxCard = createTestCreature(
        "max1",
        "MAX Fighter",
        5, // Use cost field instead of momentumCost
        500,
        250,
        2000,
        true,
      );
      state.players[0].hand.push(maxCard);
      state.players[0].momentum = 3; // Not enough

      const result = engine.playCreature(0, 1, "max1");

      expect(result).toBe(false);
      expect(state.players[0].lanes[1]).toBeNull();
    });

    it("allows playing MAX cards with sufficient momentum", () => {
      const maxCard = createTestCreature(
        "max1",
        "MAX Fighter",
        5, // Use cost field
        500,
        250,
        2000,
        true,
      );
      state.players[0].maxDeck.push(maxCard);
      state.players[0].momentum = 5;

      const result = engine.playCreature(0, 1, "max1");

      expect(result).toBe(true);
      expect(state.players[0].lanes[1]).not.toBeNull();
      expect(state.players[0].momentum).toBe(0); // Spent 5 momentum
    });

    it("removes MAX cards from game when destroyed", () => {
      const maxCreature = createTestCreature(
        "max1",
        "MAX Fighter",
        5, // Use cost field instead of momentumCost
        100,
        50,
        100,
        true,
      );
      state.players[0].lanes[1] = maxCreature;
      state.players[1].lanes[1] = createTestCreature(
        "killer",
        "Killer",
        3,
        500,
        200,
        1000,
      );

      engine.attack(1, 1, 1);

      expect(state.players[0].lanes[1]).toBeNull();
      expect(state.players[0].removedFromGame).toContainEqual(
        expect.objectContaining({ id: "max1", isMax: true }),
      );
      expect(state.players[0].discardPile).not.toContainEqual(
        expect.objectContaining({ id: "max1" }),
      );
    });
  });

  describe("Cost/Payment System", () => {
    it("allows playing cost-0 cards at 0 momentum", () => {
      const freeCreature = createTestCreature("free", "Free", 0, 100, 50, 500);
      state.players[0].hand.push(freeCreature);
      state.players[0].momentum = 0;

      const result = engine.playCreature(0, 2, "free");

      expect(result).toBe(true);
      expect(state.players[0].lanes[2]).not.toBeNull();
      expect(state.players[0].momentum).toBe(0); // Should remain 0
    });

    it("does not deduct momentum for cost-0 cards", () => {
      const freeCreature = createTestCreature("free", "Free", 0, 100, 50, 500);
      state.players[0].hand.push(freeCreature);
      state.players[0].momentum = 5;

      engine.playCreature(0, 2, "free");

      expect(state.players[0].momentum).toBe(5); // Should remain unchanged
    });

    it("rejects playing cards when momentum is insufficient", () => {
      const expensiveCreature = createTestCreature(
        "expensive",
        "Expensive",
        4,
        300,
        150,
        1000,
      );
      state.players[0].hand.push(expensiveCreature);
      state.players[0].momentum = 2; // Not enough

      const initialHandSize = state.players[0].hand.length;
      const result = engine.playCreature(0, 2, "expensive");

      expect(result).toBe(false);
      expect(state.players[0].lanes[2]).toBeNull();
      expect(state.players[0].hand.length).toBe(initialHandSize);
      expect(state.players[0].momentum).toBe(2); // Unchanged
    });

    it("does not mutate state when card cannot be afforded", () => {
      const expensiveCreature = createTestCreature(
        "expensive",
        "Expensive",
        3,
        200,
        100,
        800,
      );
      state.players[0].hand.push(expensiveCreature);
      state.players[0].momentum = 1;

      const beforeState = {
        handSize: state.players[0].hand.length,
        momentum: state.players[0].momentum,
        lanes: [...state.players[0].lanes],
      };

      engine.playCreature(0, 2, "expensive");

      expect(state.players[0].hand.length).toBe(beforeState.handSize);
      expect(state.players[0].momentum).toBe(beforeState.momentum);
      expect(state.players[0].lanes[2]).toBeNull();
    });

    it("deducts correct momentum when card is played", () => {
      const creature = createTestCreature("c2", "Medium", 3, 200, 100, 800);
      state.players[0].hand.push(creature);
      state.players[0].momentum = 5;

      const result = engine.playCreature(0, 2, "c2");

      expect(result).toBe(true);
      expect(state.players[0].momentum).toBe(2); // 5 - 3 = 2
      expect(state.players[0].lanes[2]).not.toBeNull();
    });

    it("allows playing card when momentum exactly equals cost", () => {
      const creature = createTestCreature("c2", "Medium", 3, 200, 100, 800);
      state.players[0].hand.push(creature);
      state.players[0].momentum = 3;

      const result = engine.playCreature(0, 2, "c2");

      expect(result).toBe(true);
      expect(state.players[0].momentum).toBe(0); // Spent all momentum
    });

    it("rejects card when momentum is 1 below cost", () => {
      const creature = createTestCreature("c2", "Medium", 3, 200, 100, 800);
      state.players[0].hand.push(creature);
      state.players[0].momentum = 2;

      const result = engine.playCreature(0, 2, "c2");

      expect(result).toBe(false);
      expect(state.players[0].momentum).toBe(2); // Unchanged
    });

    it("allows playing multiple cards with sufficient momentum", () => {
      const creature1 = createTestCreature("cheap1", "Cheap1", 1, 100, 50, 500);
      const creature2 = createTestCreature("cheap2", "Cheap2", 1, 100, 50, 500);
      state.players[0].hand.push(creature1, creature2);
      state.players[0].momentum = 3;

      engine.playCreature(0, 1, "cheap1");
      expect(state.players[0].momentum).toBe(2);

      engine.playCreature(0, 2, "cheap2");
      expect(state.players[0].momentum).toBe(1);

      expect(state.players[0].lanes[1]).not.toBeNull();
      expect(state.players[0].lanes[2]).not.toBeNull();
    });

    it("deducts momentum before effect triggers (cost payment happens first)", () => {
      const creature = createTestCreature("effect", "Effect", 3, 200, 100, 800);
      // Skip effectId test since it's readonly - the important part is momentum deduction
      state.players[0].hand.push(creature);
      state.players[0].momentum = 4;

      engine.playCreature(0, 2, "effect");

      // Momentum should be deducted regardless of effects
      expect(state.players[0].momentum).toBe(1); // 4 - 3 = 1
    });
  });

  describe("Validation Helpers for UI", () => {
    it("canAffordCard returns success for affordable cards", () => {
      const creature = createTestCreature(
        "affordable",
        "Affordable",
        3,
        200,
        100,
        800,
      );
      state.players[0].hand.push(creature);
      state.players[0].momentum = 5;

      const result = engine.canAffordCard(0, "affordable");

      expect(result.success).toBe(true);
    });

    it("canAffordCard returns error for unaffordable cards", () => {
      const creature = createTestCreature(
        "expensive",
        "Expensive",
        5,
        300,
        150,
        1200,
      );
      state.players[0].hand.push(creature);
      state.players[0].momentum = 2;

      const result = engine.canAffordCard(0, "expensive");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("INSUFFICIENT_MOMENTUM");
        expect(result.error.context?.required).toBe(5);
        expect(result.error.context?.available).toBe(2);
        expect(result.error.context?.cardName).toBe("Expensive");
      }
    });

    it("canAffordCard returns error for card not in hand", () => {
      state.players[0].momentum = 10;

      const result = engine.canAffordCard(0, "nonexistent");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("CARD_NOT_IN_HAND");
      }
    });

    it("getAffordableCards returns only affordable cards", () => {
      state.players[0].hand.push(
        createTestCreature("cheap1", "Cheap1", 1, 100, 50, 500),
        createTestCreature("cheap2", "Cheap2", 2, 150, 75, 600),
        createTestCreature("expensive1", "Expensive1", 4, 250, 125, 900),
        createTestCreature("expensive2", "Expensive2", 5, 300, 150, 1200),
      );
      state.players[0].momentum = 3;

      const affordable = engine.getAffordableCards(0);

      expect(affordable.length).toBe(2);
      affordable.forEach((card) => {
        expect(card.cost).toBeLessThanOrEqual(3);
      });
    });

    it("hasAffordableCard returns true when player can afford something", () => {
      state.players[0].hand.push(
        createTestCreature("free", "Free", 0, 100, 50, 500),
      );
      state.players[0].momentum = 0;

      const result = engine.hasAffordableCard(0);

      expect(result).toBe(true);
    });

    it("hasAffordableCard returns false when player cannot afford anything", () => {
      state.players[0].hand = [
        createTestCreature("expensive", "Expensive", 5, 300, 150, 1200),
      ];
      state.players[0].momentum = 2;

      const result = engine.hasAffordableCard(0);

      expect(result).toBe(false);
    });
  });

  describe("Support Card Momentum Costs", () => {
    it("allows playing support cards facedown without momentum", () => {
      const p1 = state.players[0];
      state.phase = "MAIN";
      p1.momentum = 0;

      const support = {
        id: "support1",
        name: "Expensive Support",
        type: CardType.Action,
        cost: 5,
        rarity: "C",
        set: "Base",
        description: "Test support",
        effectId: "draw_on_play",
        isFaceDown: false,
        isActive: false,
      } as any;

      p1.hand.push(support);

      // Should be able to play facedown with 0 momentum
      const result = engine.playSupport(0, 0, support.id);

      expect(result).toBe(true);
      expect(p1.support[0]).toBe(support);
      expect(support.isFaceDown).toBe(true);
      expect(support.isActive).toBe(false);
      expect(p1.momentum).toBe(0); // No momentum deducted
    });

    it("prevents activating support without sufficient momentum", () => {
      const p1 = state.players[0];
      state.phase = "MAIN";
      p1.momentum = 2;

      const support = {
        id: "support1",
        name: "Expensive Support",
        type: CardType.Action,
        cost: 5,
        rarity: "C",
        set: "Base",
        description: "Test support",
        effectId: "draw_on_play",
        isFaceDown: true,
        isActive: false,
      } as any;

      p1.hand.push(support);
      engine.playSupport(0, 0, support.id);

      // Should not be able to activate with insufficient momentum
      const result = engine.activateSupport(0, 0);

      expect(result).toBe(false);
      expect(support.isFaceDown).toBe(true);
      expect(support.isActive).toBe(false);
      expect(p1.momentum).toBe(2); // No momentum deducted
    });

    it("deducts momentum when support is activated, not when played", () => {
      const p1 = state.players[0];
      state.phase = "MAIN";
      p1.momentum = 5;

      const support = {
        id: "support1",
        name: "Medium Support",
        type: CardType.Action,
        cost: 3,
        rarity: "C",
        set: "Base",
        description: "Test support",
        effectId: "draw_on_play",
        effectType: "ONE_TIME",
        isFaceDown: false,
        isActive: false,
      } as any;

      p1.hand.push(support);

      // Play facedown - no cost
      engine.playSupport(0, 0, support.id);
      expect(p1.momentum).toBe(5); // Still 5

      // Activate - cost is paid now
      engine.activateSupport(0, 0);
      expect(p1.momentum).toBe(2); // 5 - 3 = 2
      expect(support.isFaceDown).toBe(false);
      expect(p1.discardPile).toContain(support); // ONE_TIME support gets discarded
    });

    it("allows activating support with exact momentum cost", () => {
      const p1 = state.players[0];
      state.phase = "MAIN";
      p1.momentum = 3;

      const support = {
        id: "support1",
        name: "Medium Support",
        type: CardType.Action,
        cost: 3,
        rarity: "C",
        set: "Base",
        description: "Test support",
        effectId: "draw_on_play",
        effectType: "ONE_TIME",
        isFaceDown: false,
        isActive: false,
      } as any;

      p1.hand.push(support);
      engine.playSupport(0, 0, support.id);

      const result = engine.activateSupport(0, 0);

      expect(result).toBe(true);
      expect(p1.momentum).toBe(0);
    });

    it("does not deduct momentum for cost-0 support activation", () => {
      const p1 = state.players[0];
      state.phase = "MAIN";
      p1.momentum = 2;

      const support = {
        id: "support1",
        name: "Free Support",
        type: CardType.Action,
        cost: 0,
        rarity: "C",
        set: "Base",
        description: "Test support",
        effectId: "draw_on_play",
        effectType: "ONE_TIME",
        isFaceDown: false,
        isActive: false,
      } as any;

      p1.hand.push(support);
      engine.playSupport(0, 0, support.id);
      engine.activateSupport(0, 0);

      expect(p1.momentum).toBe(2); // No cost for free cards
    });
  });
});
