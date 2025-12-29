import cards from "@static/card-data/bn-core.json";
import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";
import { BattleEngine } from "@battle/BattleEngine";
import { CardInterface, CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";
import { ActionCard } from "@cards/ActionCard";
import { SupportCard } from "@cards/SupportCard";

function cardFactory(raw: any): CardInterface {
  switch (raw.type) {
    case CardType.Creature:
      return new CreatureCard(raw);
    case CardType.Action:
      return new ActionCard(raw);
    case CardType.Support:
      return new SupportCard(raw);
    default:
      throw new Error(`Unknown card type: ${raw.type}`);
  }
}

const deck1 = (cards as any[]).map(cardFactory);
const deck2 = (cards as any[]).map(cardFactory);

/**
 * Life Points & Win Condition Tests
 * Tests life point tracking and victory determination
 * Note: Most win condition logic is tested in Battle.test.ts
 * These tests verify edge cases and life point tracking
 */
describe("BattleEngine – Win Conditions", () => {
  it("tracks life points independently for each player", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);

    // Initial life points should be 2000
    expect(p1.lifePoints).toBe(2000);
    expect(p2.lifePoints).toBe(2000);
  });

  it("initializes with no winner", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
    const game = createGameState(p1, p2);

    expect(game.winnerIndex).toBeNull();
  });

  it("prevents draws when game has a winner", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
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
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);

    // Each player has life points
    expect(typeof p1.lifePoints).toBe("number");
    expect(typeof p2.lifePoints).toBe("number");
    expect(p1.lifePoints).toBeGreaterThan(0);
    expect(p2.lifePoints).toBeGreaterThan(0);
  });
});
