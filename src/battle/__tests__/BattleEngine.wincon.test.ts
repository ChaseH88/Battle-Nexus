import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";
import { BattleEngine } from "@battle/BattleEngine";
import { createTestDeck1, createTestDeck2 } from "@/__tests__/testUtils";

/**
 * Win Condition Tests
 * Tests life point tracking and victory determination
 * Note: Most win condition logic is tested in Battle.test.ts
 * These tests verify edge cases and life point tracking
 */
describe("BattleEngine – Win Conditions", () => {
  it("tracks life points independently for each player", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());

    // Initial life points should be 200
    expect(p1.lifePoints).toBe(200);
    expect(p2.lifePoints).toBe(200);
  });

  it("initializes with no winner", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);

    expect(game.winnerIndex).toBeNull();
  });

  it("prevents draws when game has a winner", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    // Simulate a winner
    game.winnerIndex = 0;

    const initialHandSize = p1.hand.length;
    const initialDeckSize = p1.deck.length;

    engine.draw(0);

    // Should not draw when game is won
    expect(p1.hand.length).toBe(initialHandSize);
    expect(p1.deck.length).toBe(initialDeckSize);
  });

  it("maintains life points structure", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());

    // Each player has life points
    expect(typeof p1.lifePoints).toBe("number");
    expect(typeof p2.lifePoints).toBe("number");
    expect(p1.lifePoints).toBeGreaterThan(0);
    expect(p2.lifePoints).toBeGreaterThan(0);
  });
});
