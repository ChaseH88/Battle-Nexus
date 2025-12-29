import { ignite_direct_damage } from "@effects/effect/ignite_direct_damage";
import { createEffectUtils } from "@effects/handler";
import { createTestGame, testDeck1 } from "@/__tests__/testUtils";

/**
 * Ignite Direct Damage Effect Tests
 * Tests the ignite_direct_damage effect
 */
describe("Effect: ignite_direct_damage", () => {
  it("executes without errors", () => {
    const { game, engine } = createTestGame();

    const testCard = testDeck1[0];

    // Should execute without throwing
    expect(() => {
      ignite_direct_damage({
        state: game,
        engine,
        sourceCard: testCard,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });
    }).not.toThrow();
  });

  it("logs damage message", () => {
    const { game, engine } = createTestGame();

    const testCard = testDeck1[0];
    const initialEventCount = game.log.getEvents().length;

    // Execute the effect
    ignite_direct_damage({
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

  it("can be triggered multiple times", () => {
    const { game, engine } = createTestGame();

    const testCard = testDeck1[0];

    // Should not throw when called multiple times
    expect(() => {
      for (let i = 0; i < 3; i++) {
        ignite_direct_damage({
          state: game,
          engine,
          sourceCard: testCard,
          ownerIndex: 0,
          trigger: "ON_PLAY",
          utils: createEffectUtils(game, engine),
        });
      }
    }).not.toThrow();
  });

  it("logs with correct card name", () => {
    const { game, engine } = createTestGame();

    const testCard = testDeck1[0];

    ignite_direct_damage({
      state: game,
      engine,
      sourceCard: testCard,
      ownerIndex: 0,
      trigger: "ON_PLAY",
      utils: createEffectUtils(game, engine),
    });

    const messages = game.log.getMessages();
    const hasCardName = messages.some((msg) => msg.includes(testCard.name));

    expect(hasCardName).toBe(true);
  });
});
