import { CardType } from "@cards/types";
import { ActionCard } from "@cards/ActionCard";
import { purge_opponent_support } from "@effects/effect/purge_opponent_support";
import { createEffectUtils } from "@effects/handler";
import { createTestGame, drawMany, testDeck1 } from "@/__tests__/testUtils";

/**
 * Purge Opponent Support Effect Tests
 * Tests the purge_opponent_support effect (Purge Beacon)
 */
describe("Effect: purge_opponent_support", () => {
  it("removes support card from opponent's support zone", () => {
    const { p2, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

    drawMany(engine, 0, 10);
    drawMany(engine, 1, 10);

    const supportCard = p2.hand.find((c) => c.type === CardType.Action);

    if (supportCard) {
      // Play support card for opponent
      engine.playSupport(1, 0, supportCard.id);

      expect(p2.support[0]).not.toBeNull();

      const testCard = testDeck1[0];

      // Execute the effect
      purge_opponent_support({
        state: game,
        engine,
        sourceCard: testCard,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Support should be removed
      expect(p2.support[0]).toBeNull();
    }
  });

  it("moves removed card to discard pile", () => {
    const { p2, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

    drawMany(engine, 0, 10);
    drawMany(engine, 1, 10);

    const supportCard = p2.hand.find((c) => c.type === CardType.Action);

    if (supportCard) {
      engine.playSupport(1, 0, supportCard.id);

      const initialDiscardSize = p2.discardPile.length;
      const testCard = testDeck1[0];

      // Execute the effect
      purge_opponent_support({
        state: game,
        engine,
        sourceCard: testCard,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Should be in discard pile
      expect(p2.discardPile.length).toBe(initialDiscardSize + 1);
      expect(p2.discardPile[p2.discardPile.length - 1].id).toBe(supportCard.id);
    }
  });

  it("targets specific slot when provided in eventData", () => {
    const { p2, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

    drawMany(engine, 0, 10);
    drawMany(engine, 1, 15);

    const supportCards = p2.hand.filter(
      (c) => c.type === CardType.Action,
    ) as ActionCard[];

    if (supportCards.length >= 2) {
      engine.playSupport(1, 0, supportCards[0].id);
      engine.playSupport(1, 1, supportCards[1].id);

      const testCard = testDeck1[0];

      // Target slot 1 specifically
      purge_opponent_support({
        state: game,
        engine,
        sourceCard: testCard,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        eventData: { targetLane: 1 },
        utils: createEffectUtils(game, engine),
      });

      // Slot 0 should still have card, slot 1 should be empty
      expect(p2.support[0]).not.toBeNull();
      expect(p2.support[1]).toBeNull();
    }
  });

  it("auto-targets first occupied slot when no target specified", () => {
    const { p2, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

    drawMany(engine, 0, 10);
    drawMany(engine, 1, 15);

    const supportCards = p2.hand.filter(
      (c) => c.type === CardType.Action,
    ) as ActionCard[];

    if (supportCards.length >= 1) {
      // Play support in slot 1 (leaving slot 0 empty)
      engine.playSupport(1, 1, supportCards[0].id);

      const testCard = testDeck1[0];

      // Execute without specifying target
      purge_opponent_support({
        state: game,
        engine,
        sourceCard: testCard,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // First occupied slot should be removed
      expect(p2.support[1]).toBeNull();
    }
  });

  it("does nothing when opponent has no support cards", () => {
    const { p2, game, engine } = createTestGame();

    const testCard = testDeck1[0];

    // Execute when opponent has no support
    expect(() => {
      purge_opponent_support({
        state: game,
        engine,
        sourceCard: testCard,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });
    }).not.toThrow();

    // Support zone should still be empty
    expect(p2.support.every((s) => s === null)).toBe(true);
  });

  it("logs removal message", () => {
    const { p2, game, engine } = createTestGame();

    // Give players momentum to play cards
    game.players[0].momentum = 10;
    game.players[1].momentum = 10;

    drawMany(engine, 0, 10);
    drawMany(engine, 1, 10);

    const supportCard = p2.hand.find((c) => c.type === CardType.Action);

    if (supportCard) {
      engine.playSupport(1, 0, supportCard.id);

      const initialEventCount = game.log.getEvents().length;
      const testCard = testDeck1[0];

      // Execute the effect
      purge_opponent_support({
        state: game,
        engine,
        sourceCard: testCard,
        ownerIndex: 0,
        trigger: "ON_PLAY",
        utils: createEffectUtils(game, engine),
      });

      // Should have logged something
      expect(game.log.getEvents().length).toBeGreaterThan(initialEventCount);
    }
  });

  it("has metadata for activation requirements", () => {
    expect(purge_opponent_support.metadata).toBeDefined();
    expect(purge_opponent_support.metadata?.canActivate).toBeDefined();
    expect(purge_opponent_support.metadata?.targeting).toBeDefined();
    // getValidTargets is optional now - targeting can be a function instead
  });

  it("validates targeting constraints", () => {
    const { game } = createTestGame();

    const metadata = purge_opponent_support.metadata;

    if (metadata?.canActivate) {
      // Should return false when no support cards
      const result = metadata.canActivate(game, 0);
      expect(result.canActivate).toBe(false);
      expect(result.reason).toBeDefined();
    }
  });
});
