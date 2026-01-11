import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";
import { BattleEngine } from "@battle/BattleEngine";
import { createTestDeck1, createTestDeck2 } from "@/__tests__/testUtils";

/**
 * Stress Tests
 * Tests system behavior under load and extreme conditions
 */
describe("BattleEngine – Performance", () => {
  it("handles many turns without performance degradation", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    const startTime = Date.now();

    // Simulate 100 turns
    for (let i = 0; i < 100; i++) {
      if (p1.deck.length > 0) engine.draw(0);
      engine.endTurn();
      if (p2.deck.length > 0) engine.draw(1);
      engine.endTurn();
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete in reasonable time (< 1 second)
    expect(duration).toBeLessThan(1000);
    expect(game.turn).toBeGreaterThan(50);
  });

  it("handles large game log without memory issues", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    // Generate many log entries
    for (let i = 0; i < 1000; i++) {
      engine.log(`Test log entry ${i}`);
    }

    expect(game.log.getEvents().length).toBeGreaterThanOrEqual(1000);
    expect(game.log.getMessages().length).toBeGreaterThanOrEqual(1000);
  });

  it("maintains event log across many operations", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    // Perform many operations
    for (let i = 0; i < 50; i++) {
      if (p1.deck.length > 0) engine.draw(0);
      engine.endTurn();
      if (p2.deck.length > 0) engine.draw(1);
      engine.endTurn();
    }

    const events = game.log.getEvents();
    // Events should be tracked (check that we have events)
    expect(events.length).toBeGreaterThan(0);
  });
});
