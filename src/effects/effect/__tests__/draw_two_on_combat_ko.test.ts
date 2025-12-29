import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";
import { BattleEngine } from "@battle/BattleEngine";
import { draw_two_on_combat_ko } from "@effects/effect/draw_two_on_combat_ko";
import { createEffectUtils } from "@effects/handler";
import { createTestGame, testDeck1 } from "@/__tests__/testUtils";

/**
 * Draw Two On Combat KO Effect Tests
 * Tests the draw_two_on_combat_ko effect
 */
describe("Effect: draw_two_on_combat_ko", () => {
  it("draws 1 card when triggered", () => {
    const { p1, game, engine } = createTestGame();

    const initialHandSize = p1.hand.length;
    const initialDeckSize = p1.deck.length;

    const testCard = testDeck1[0];

    // Execute the effect
    draw_two_on_combat_ko({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_DESTROY",
      utils: createEffectUtils(game, engine),
    });

    // Should draw 1 card
    expect(p1.hand.length).toBe(initialHandSize + 1);
    expect(p1.deck.length).toBe(initialDeckSize - 1);
  });

  it("logs the effect trigger", () => {
    const { game, engine } = createTestGame();

    const testCard = testDeck1[0];
    const initialEventCount = game.log.getEvents().length;

    // Execute the effect
    draw_two_on_combat_ko({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_DESTROY",
      utils: createEffectUtils(game, engine),
    });

    // Should have logged something
    expect(game.log.getEvents().length).toBeGreaterThan(initialEventCount);
  });

  it("draws for the correct player", () => {
    const { p1, p2, game, engine } = createTestGame();

    const p1InitialHand = p1.hand.length;
    const p2InitialHand = p2.hand.length;

    const testCard = testDeck1[0];

    // Execute effect for player 1
    draw_two_on_combat_ko({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_DESTROY",
      utils: createEffectUtils(game, engine),
    });

    // Only player 1 should draw
    expect(p1.hand.length).toBe(p1InitialHand + 1);
    expect(p2.hand.length).toBe(p2InitialHand);
  });

  it("handles empty deck gracefully", () => {
    const p1 = createPlayerState("P1", []);
    const p2 = createPlayerState("P2", testDeck1);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    const testCard = testDeck1[0];

    // Should not throw with empty deck
    expect(() => {
      draw_two_on_combat_ko({
        state: game,
        engine,
        sourceCard: testCard,
        ownerIndex: 0,
        trigger: "ON_DESTROY",
        utils: createEffectUtils(game, engine),
      });
    }).not.toThrow();
  });

  it("logs with card name", () => {
    const { game, engine } = createTestGame();

    const testCard = testDeck1[0];

    draw_two_on_combat_ko({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_DESTROY",
      utils: createEffectUtils(game, engine),
    });

    const messages = game.log.getMessages();
    const hasCardName = messages.some((msg) => msg.includes(testCard.name));

    expect(hasCardName).toBe(true);
  });
});
