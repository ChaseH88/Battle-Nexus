import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";
import { BattleEngine } from "@battle/BattleEngine";
import { quick_assessment } from "@effects/effect/quick_assessment";
import { createEffectUtils } from "@effects/handler";
import { createTestGame, testDeck1, drawMany } from "@/__tests__/testUtils";
import { CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";

/**
 * Quick Assessment Effect Tests
 * Tests the quick_assessment effect: Draw 1 card. If you control no creatures, draw 2 instead.
 */
describe("Effect: quick_assessment", () => {
  it("draws 1 card when player controls creatures", () => {
    const { p1, game, engine } = createTestGame();

    drawMany(engine, 0, 10);

    // Place a creature on the field
    const creature = p1.hand.find((c) => c.type === CardType.Creature);
    if (creature) {
      engine.playCreature(0, 0, creature.id);
    }

    const initialHandSize = p1.hand.length;
    const initialDeckSize = p1.deck.length;

    const testCard = testDeck1[0];

    // Execute the effect
    quick_assessment({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_PLAY",
      utils: createEffectUtils(game, engine),
    });

    // Should draw 1 card (has creatures)
    expect(p1.hand.length).toBe(initialHandSize + 1);
    expect(p1.deck.length).toBe(initialDeckSize - 1);
  });

  it("draws 2 cards when player controls no creatures", () => {
    const { p1, game, engine } = createTestGame();

    const initialHandSize = p1.hand.length;
    const initialDeckSize = p1.deck.length;

    const testCard = testDeck1[0];

    // Execute the effect with no creatures on field
    quick_assessment({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_PLAY",
      utils: createEffectUtils(game, engine),
    });

    // Should draw 2 cards (no creatures)
    expect(p1.hand.length).toBe(initialHandSize + 2);
    expect(p1.deck.length).toBe(initialDeckSize - 2);
  });

  it("handles empty deck gracefully when drawing 1 card", () => {
    const p1 = createPlayerState("P1", [testDeck1[0]]);
    const p2 = createPlayerState("P2", testDeck1);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    // Place a creature
    const creature = p1.hand.find((c) => c.type === CardType.Creature) as
      | CreatureCard
      | undefined;
    if (creature) {
      p1.lanes[0] = creature;
    }

    // Empty the deck except for 1 card
    p1.hand = [];
    p1.deck = [testDeck1[1]];

    const initialHandSize = p1.hand.length;
    const testCard = testDeck1[0];

    // Execute the effect
    quick_assessment({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_PLAY",
      utils: createEffectUtils(game, engine),
    });

    // Should draw 1 card (can't draw more than what's in deck)
    expect(p1.hand.length).toBe(initialHandSize + 1);
    expect(p1.deck.length).toBe(0);
  });

  it("handles empty deck gracefully when drawing 2 cards", () => {
    const p1 = createPlayerState("P1", [testDeck1[0]]);
    const p2 = createPlayerState("P2", testDeck1);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    // Empty the deck except for 1 card
    p1.hand = [];
    p1.deck = [testDeck1[1]];

    const initialHandSize = p1.hand.length;
    const testCard = testDeck1[0];

    // Execute the effect with no creatures (should draw 2 but only 1 available)
    quick_assessment({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_PLAY",
      utils: createEffectUtils(game, engine),
    });

    // Should draw only 1 card (only 1 available in deck)
    expect(p1.hand.length).toBe(initialHandSize + 1);
    expect(p1.deck.length).toBe(0);
  });

  it("draws for the correct player", () => {
    const { p1, p2, game, engine } = createTestGame();

    const initialP1Hand = p1.hand.length;
    const initialP2Hand = p2.hand.length;
    const initialP2Deck = p2.deck.length;

    const testCard = testDeck1[0];

    // Execute the effect for player 2
    quick_assessment({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 1,
      trigger: "ON_PLAY",
      utils: createEffectUtils(game, engine),
    });

    // P2 should draw 2 cards (no creatures), P1 should be unchanged
    expect(p1.hand.length).toBe(initialP1Hand);
    expect(p2.hand.length).toBe(initialP2Hand + 2);
    expect(p2.deck.length).toBe(initialP2Deck - 2);
  });

  it("correctly detects creatures in any lane", () => {
    const { p1, game, engine } = createTestGame();

    drawMany(engine, 0, 10);

    // Place a creature in lane 2 (not lane 0)
    const creature = p1.hand.find((c) => c.type === CardType.Creature);
    if (creature) {
      engine.playCreature(0, 2, creature.id);
    }

    const initialHandSize = p1.hand.length;
    const testCard = testDeck1[0];

    // Execute the effect
    quick_assessment({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_PLAY",
      utils: createEffectUtils(game, engine),
    });

    // Should draw 1 card (has creature in lane 2)
    expect(p1.hand.length).toBe(initialHandSize + 1);
  });

  it("handles completely empty deck", () => {
    const { p1, game, engine } = createTestGame();

    // Empty the deck completely
    p1.deck = [];

    const initialHandSize = p1.hand.length;
    const testCard = testDeck1[0];

    // Execute the effect
    quick_assessment({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_PLAY",
      utils: createEffectUtils(game, engine),
    });

    // Should not crash, hand size unchanged
    expect(p1.hand.length).toBe(initialHandSize);
    expect(p1.deck.length).toBe(0);
  });
});
