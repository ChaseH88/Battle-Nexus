import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";
import { BattleEngine } from "@battle/BattleEngine";
import { draw_on_play } from "@effects/effect/draw_on_play";
import { createEffectUtils } from "@effects/handler";
import { createTestGame, testDeck1 } from "@/__tests__/testUtils";

/**
 * Draw On Play Effect Tests
 * Tests the draw_on_play effect
 */
describe("Effect: draw_on_play", () => {
  it("draws 1 card when triggered", () => {
    const { p1, game, engine } = createTestGame();

    const initialHandSize = p1.hand.length;
    const initialDeckSize = p1.deck.length;

    const testCard = testDeck1[0];

    // Execute the effect
    draw_on_play({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_PLAY",
      utils: createEffectUtils(game, engine),
    });

    // Should draw 1 card
    expect(p1.hand.length).toBe(initialHandSize + 1);
    expect(p1.deck.length).toBe(initialDeckSize - 1);
  });

  it("handles empty deck gracefully", () => {
    const p1 = createPlayerState("P1", []);
    const p2 = createPlayerState("P2", testDeck1);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    const initialHandSize = p1.hand.length;
    const testCard = testDeck1[0];

    // Execute the effect with empty deck
    expect(() => {
      draw_on_play({
        state: game,
        engine,
        sourceCard: testCard,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });
    }).not.toThrow();

    // Hand size should not increase
    expect(p1.hand.length).toBe(initialHandSize);
  });

  it("draws for correct player", () => {
    const { p1, p2, game, engine } = createTestGame();

    const p1InitialHand = p1.hand.length;
    const p2InitialHand = p2.hand.length;

    const testCard = testDeck1[0];

    // Execute effect for player 1
    draw_on_play({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_PLAY",
      utils: createEffectUtils(game, engine),
    });

    // Only player 1 should draw
    expect(p1.hand.length).toBe(p1InitialHand + 1);
    expect(p2.hand.length).toBe(p2InitialHand);
  });

  it("can be triggered multiple times", () => {
    const { p1, game, engine } = createTestGame();

    const initialHandSize = p1.hand.length;
    const testCard = testDeck1[0];

    // Execute effect 3 times
    for (let i = 0; i < 3; i++) {
      draw_on_play({
        state: game,
        engine,
        sourceCard: testCard,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });
    }

    // Should draw 3 cards total
    expect(p1.hand.length).toBe(initialHandSize + 3);
  });
});
