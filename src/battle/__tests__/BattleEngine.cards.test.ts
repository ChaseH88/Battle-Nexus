import cards from "@static/card-data/bn-core.json";
import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";
import { BattleEngine } from "@battle/BattleEngine";
import { CardInterface, CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";
import { ActionCard } from "@cards/ActionCard";
import { SupportCard } from "@cards/SupportCard";
import { TrapCard } from "@cards/TrapCard";

function cardFactory(raw: any): CardInterface {
  switch (raw.type) {
    case CardType.Creature:
      return new CreatureCard(raw);
    case CardType.Action:
      return new ActionCard(raw);
    case CardType.Support:
      return new SupportCard(raw);
    case CardType.Trap:
      return new TrapCard(raw);
    default:
      throw new Error(`Unknown card type: ${raw.type}`);
  }
}

const deck1 = (cards as any[]).map(cardFactory);
const deck2 = (cards as any[]).map(cardFactory);

function drawMany(engine: BattleEngine, playerIndex: number, count: number) {
  for (let i = 0; i < count; i++) {
    engine.draw(playerIndex);
  }
}

/**
 * Card State & Validation Tests
 * Tests card validation, hand management, and discard
 */
describe("BattleEngine – Card State", () => {
  it("validates card is in hand before playing", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 3);

    // Try to play card not in hand
    const handSize = p1.hand.length;
    engine.playCreature(0, 0, "invalid_card_id");

    // Should not change hand or board
    expect(p1.hand.length).toBe(handSize);
    expect(p1.lanes[0]).toBeNull();
  });

  it("removes card from hand when played", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 6);

    const creature = p1.hand.find((c) => c.id === "quake_stag");
    const initialHandSize = p1.hand.length;

    if (creature) {
      engine.playCreature(0, 0, creature.id);

      expect(p1.hand.length).toBe(initialHandSize - 1);
      expect(p1.hand.find((c) => c.id === creature.id)).toBeUndefined();
    }
  });

  it("maintains discard pile structure", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);

    // Discard pile exists
    expect(Array.isArray(p1.discardPile)).toBe(true);
    expect(Array.isArray(p2.discardPile)).toBe(true);
  });

  it("handles empty deck gracefully", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    // Empty the deck
    p1.deck = [];

    const handSize = p1.hand.length;
    engine.draw(0);

    // Hand should not change
    expect(p1.hand.length).toBe(handSize);
  });

  it("validates support card before playing", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 10);

    const support = p1.hand.find(
      (c) => c.type === CardType.Support
    ) as SupportCard;

    if (support) {
      const initialHandSize = p1.hand.length;

      // Try to play to invalid slot
      engine.playSupport(0, 5, support.id);

      // Should not play
      expect(p1.hand.length).toBe(initialHandSize);
      expect(p1.support[5]).toBeUndefined();
    }
  });
});
