import cards from "@static/card-data/bn-core.json";
import { CardInterface, CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";
import { ActionCard } from "@cards/ActionCard";
import { TrapCard } from "@cards/TrapCard";
import { BattleEngine } from "@battle/BattleEngine";
import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";
import { AIPlayer } from "@battle/AIPlayer";

/**
 * Factory function to create typed card instances from raw JSON data
 */
export function cardFactory(raw: any): CardInterface {
  switch (raw.type) {
    case CardType.Creature:
      return new CreatureCard(raw);
    case CardType.Action:
      return new ActionCard(raw);
    case CardType.Trap:
      return new TrapCard(raw);
    default:
      throw new Error(`Unknown card type: ${raw.type}`);
  }
}

/**
 * Pre-built decks from card data for testing
 * NOTE: These create FRESH instances to avoid test pollution
 */
export function createTestDeck1(): CardInterface[] {
  return (cards as any[]).map(cardFactory);
}

export function createTestDeck2(): CardInterface[] {
  return (cards as any[]).map(cardFactory);
}

export const testDeck1 = createTestDeck1();
export const testDeck2 = createTestDeck2();

/**
 * Helper to draw multiple cards at once
 */
export function drawMany(
  engine: BattleEngine,
  playerIndex: number,
  count: number,
): void {
  for (let i = 0; i < count; i++) {
    engine.draw(playerIndex);
  }
}

/**
 * Helper to advance to MAIN phase (calls draw once for player 0)
 */
export function enterMainPhase(engine: BattleEngine): void {
  engine.draw(0);
}

/**
 * Helper to create a test creature card
 */
export function createTestCreature(overrides: Partial<any> = {}): CreatureCard {
  return cardFactory({
    id: "test_creature",
    type: CardType.Creature,
    name: "Test Creature",
    atk: 1000,
    def: 800,
    affinity: "Fire",
    rarity: "Common",
    cost: 2,
    ...overrides,
  }) as CreatureCard;
}

/**
 * Helper to create a test action card (formerly support/action)
 */
export function createTestAction(overrides: Partial<any> = {}): ActionCard {
  return cardFactory({
    id: "test_action",
    type: CardType.Action,
    name: "Test Action",
    effectId: "draw_on_play",
    cost: 1,
    rarity: "Common",
    ...overrides,
  }) as ActionCard;
}

/**
 * Helper to add a card directly to a player's hand
 */
export function addCardToHand(
  engine: BattleEngine,
  playerIndex: 0 | 1,
  card: CardInterface,
): void {
  engine.state.players[playerIndex].hand.push(card);
}

/**
 * Helper to play a creature in a specific lane
 */
export function playCreatureInLane(
  engine: BattleEngine,
  playerIndex: 0 | 1,
  lane: number,
  creature?: CreatureCard,
  faceDown: boolean = false,
  mode: "ATTACK" | "DEFENSE" = "ATTACK",
): CreatureCard {
  const card = creature || createTestCreature({ id: `creature_${Date.now()}` });
  addCardToHand(engine, playerIndex, card);
  engine.playCreature(playerIndex, lane, card.id, faceDown, mode);
  return card;
}

/**
 * Helper to play a support card in a specific slot
 */
export function playSupportInSlot(
  engine: BattleEngine,
  playerIndex: 0 | 1,
  slot: number,
  support?: ActionCard,
): ActionCard {
  const card = support || createTestAction({ id: `support_${Date.now()}` });
  addCardToHand(engine, playerIndex, card);
  engine.playSupport(playerIndex, slot, card.id);
  return card;
}

/**
 * Creates a basic game setup with two players and a battle engine
 * Creates fresh decks by default to avoid test pollution
 */
export function createTestGame(
  deck1 = createTestDeck1(),
  deck2 = createTestDeck2(),
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

/**
 * Creates a test game with AI player
 * Creates fresh decks by default to avoid test pollution
 */
export function createTestGameWithAI(
  skillLevel: number = 5,
  deck1 = createTestDeck1(),
  deck2 = createTestDeck2(),
): {
  p1: ReturnType<typeof createPlayerState>;
  p2: ReturnType<typeof createPlayerState>;
  game: ReturnType<typeof createGameState>;
  engine: BattleEngine;
  ai: AIPlayer;
} {
  const { p1, p2, game, engine } = createTestGame(deck1, deck2);
  const ai = new AIPlayer({ skillLevel, playerIndex: 1 }, engine);

  return { p1, p2, game, engine, ai };
}
