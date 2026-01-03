import { BattleEngine } from "../BattleEngine";
import { GameState } from "../GameState";
import { createPlayerState } from "../PlayerState";
import { CreatureCard } from "../../cards/CreatureCard";
import { Affinity, CardType } from "../../cards/types";

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
    momentumCost?: number
  ): CreatureCard => {
    return new CreatureCard({
      id,
      name,
      type: CardType.Creature,
      cost,
      rarity: "C",
      set: "Base",
      description: "Test creature",
      atk,
      def,
      hp,
      affinity: Affinity.Fire,
      isMax,
      momentumCost,
    });
  };

  beforeEach(() => {
    const p1Deck = [
      createTestCreature("c1", "Weak Fighter", 1, 100, 50, 500),
      createTestCreature("c2", "Medium Fighter", 3, 200, 100, 800),
      createTestCreature("c3", "Strong Fighter", 5, 300, 150, 1200),
    ];
    const p2Deck = [
      createTestCreature("c4", "Enemy Weak", 1, 80, 40, 400),
      createTestCreature("c5", "Enemy Medium", 3, 180, 90, 700),
      createTestCreature("c6", "Enemy Strong", 5, 280, 140, 1100),
    ];

    const p1MaxDeck = [
      createTestCreature("max1", "MAX Fighter", 0, 500, 250, 2000, true, 5),
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
      500
    );
    state.players[1].lanes[0] = createTestCreature(
      "c4",
      "Enemy Weak",
      1,
      80,
      40,
      400
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
        1000
      );
      state.players[1].lanes[0] = createTestCreature(
        "weak",
        "Weak",
        1,
        50,
        20,
        100
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
        2000
      );
      state.players[1].lanes[0] = createTestCreature(
        "s2",
        "Enemy Tank",
        5,
        100,
        200,
        2000
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
        800
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
        800
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
        1200
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
        0,
        500,
        250,
        2000,
        true,
        5
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
        0,
        500,
        250,
        2000,
        true,
        5
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
        0,
        500,
        250,
        2000,
        true,
        5
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
        0,
        100,
        50,
        100,
        true,
        5
      );
      state.players[0].lanes[1] = maxCreature;
      state.players[1].lanes[1] = createTestCreature(
        "killer",
        "Killer",
        3,
        500,
        200,
        1000
      );

      engine.attack(1, 1, 1);

      expect(state.players[0].lanes[1]).toBeNull();
      expect(state.players[0].removedFromGame).toContainEqual(
        expect.objectContaining({ id: "max1", isMax: true })
      );
      expect(state.players[0].discardPile).not.toContainEqual(
        expect.objectContaining({ id: "max1" })
      );
    });
  });
});
