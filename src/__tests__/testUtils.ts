import cards from "@static/card-data/bn-core.json";
import { CardInterface, CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";
import { ActionCard } from "@cards/ActionCard";
import { SupportCard } from "@cards/SupportCard";
import { BattleEngine } from "@battle/BattleEngine";
import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";

/**
 * Factory function to create typed card instances from raw JSON data
 */
export function cardFactory(raw: any): CardInterface {
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

/**
 * Pre-built decks from card data for testing
 */
export const testDeck1 = (cards as any[]).map(cardFactory);
export const testDeck2 = (cards as any[]).map(cardFactory);

/**
 * Helper to draw multiple cards at once
 */
export function drawMany(
  engine: BattleEngine,
  playerIndex: number,
  count: number
): void {
  for (let i = 0; i < count; i++) {
    engine.draw(playerIndex);
  }
}

/**
 * Creates a basic game setup with two players and a battle engine
 */
export function createTestGame(
  deck1 = testDeck1,
  deck2 = testDeck2
): {
  p1: ReturnType<typeof createPlayerState>;
  p2: ReturnType<typeof createPlayerState>;
  game: ReturnType<typeof createGameState>;
  engine: BattleEngine;
} {
  const p1 = createPlayerState("P1", deck1);
  const p2 = createPlayerState("P2", deck2);
  const game = createGameState(p1, p2);
  const engine = new BattleEngine(game);

  return { p1, p2, game, engine };
}
