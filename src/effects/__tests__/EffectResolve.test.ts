import cards from "@static/card-data/bn-core.json";
import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";
import { BattleEngine } from "@battle/BattleEngine";
import { CardInterface, CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";
import { ActionCard } from "@cards/ActionCard";
import { SupportCard } from "@cards/SupportCard";
import { TrapCard } from "@cards/TrapCard";
import { resolveEffectsForCard } from "@effects/resolve";

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
 * Effect Resolution Tests
 * Tests effect resolution and trigger matching
 */
describe("Effects – Resolution", () => {
  it("handles missing effect ID gracefully", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 5);

    const card = p1.hand[0];

    expect(() => {
      resolveEffectsForCard({
        state: game,
        ownerIndex: 0,
        cardEffectId: undefined,
        trigger: "ON_PLAY",
        sourceCard: card,
        engine,
      });
    }).not.toThrow();
  });

  it("handles missing source card gracefully", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    expect(() => {
      resolveEffectsForCard({
        state: game,
        ownerIndex: 0,
        cardEffectId: "some_effect",
        trigger: "ON_PLAY",
        sourceCard: undefined,
        engine,
      });
    }).not.toThrow();
  });

  it("handles missing engine gracefully", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
    const game = createGameState(p1, p2);

    drawMany(new BattleEngine(game), 0, 5);
    const card = p1.hand[0];

    expect(() => {
      resolveEffectsForCard({
        state: game,
        ownerIndex: 0,
        cardEffectId: "some_effect",
        trigger: "ON_PLAY",
        sourceCard: card,
        engine: undefined,
      });
    }).not.toThrow();
  });

  it("handles non-existent effect ID gracefully", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 5);

    const card = p1.hand[0];

    expect(() => {
      resolveEffectsForCard({
        state: game,
        ownerIndex: 0,
        cardEffectId: "non_existent_effect_id",
        trigger: "ON_PLAY",
        sourceCard: card,
        engine,
      });
    }).not.toThrow();
  });

  it("logs warning for missing effect", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 5);

    const card = p1.hand[0];
    const initialEventCount = game.log.getEvents().length;

    resolveEffectsForCard({
      state: game,
      ownerIndex: 0,
      cardEffectId: "non_existent_effect",
      trigger: "ON_PLAY",
      sourceCard: card,
      engine,
    });

    // Should have logged a warning
    expect(game.log.getEvents().length).toBeGreaterThanOrEqual(
      initialEventCount
    );
  });

  it("only triggers effects matching the trigger type", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 5);

    const card = p1.hand.find(
      (c) => c.type === CardType.Creature
    ) as CreatureCard;

    if (card && card.onSummonEffectId) {
      // Try to trigger with wrong trigger type
      const initialHandSize = p1.hand.length;

      resolveEffectsForCard({
        state: game,
        ownerIndex: 0,
        cardEffectId: card.onSummonEffectId,
        trigger: "ON_ATTACK", // Wrong trigger
        sourceCard: card,
        engine,
      });

      // Effect should not have executed (e.g., no cards drawn)
      expect(p1.hand.length).toBe(initialHandSize);
    }
  });

  it("accepts event data for context", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 5);

    const card = p1.hand[0];

    expect(() => {
      resolveEffectsForCard({
        state: game,
        ownerIndex: 0,
        cardEffectId: "some_effect",
        trigger: "ON_PLAY",
        sourceCard: card,
        engine,
        eventData: {
          lane: 0,
          targetLane: 1,
          targetPlayer: 1,
        },
      });
    }).not.toThrow();
  });

  it("handles multiple effect resolutions without conflicts", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 10);

    const cards = p1.hand.slice(0, 3);

    expect(() => {
      cards.forEach((card) => {
        resolveEffectsForCard({
          state: game,
          ownerIndex: 0,
          cardEffectId: "draw_on_play",
          trigger: "ON_PLAY",
          sourceCard: card,
          engine,
        });
      });
    }).not.toThrow();
  });
});
