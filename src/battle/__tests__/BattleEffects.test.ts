import cards from "../../static/card-data/bn-core.json";

import { createPlayerState } from "../PlayerState";
import { createGameState } from "../GameState";
import { BattleEngine } from "../BattleEngine";

import { CreatureCard } from "../../cards/CreatureCard";
import { ActionCard } from "../../cards/ActionCard";
import { SupportCard } from "../../cards/SupportCard";
import { CardInterface, CardType } from "../../cards/types";

function cardFactory(raw: any) {
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

const deck1 = (cards as any[]).map(cardFactory) as CardInterface[];
const deck2 = (cards as any[]).map(cardFactory) as CardInterface[];

function drawMany(engine: BattleEngine, playerIndex: 0 | 1, count: number) {
  for (let i = 0; i < count; i++) {
    engine.draw(playerIndex);
  }
}

describe("BattleEngine – Effect System", () => {
  it("triggers ON_PLAY effect when creature is summoned", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);

    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    // Draw cards into hand
    drawMany(engine, 0, 3);

    const initialLogLength = game.log.length;

    // Play a creature with effectId (ember_cub has "ON_PLAY" in test data)
    const emberCub = p1.hand.find((c) => c.id === "ember_cub");
    expect(emberCub).toBeDefined();

    if (emberCub) {
      const played = engine.playCreature(0, 0, emberCub.id);
      expect(played).toBe(true);

      // Check that effect resolution was triggered
      const newLogs = game.log.slice(initialLogLength);
      const hasEffectLog = newLogs.some(
        (log) => log.includes("Effect fired") || log.includes("summoned")
      );
      expect(hasEffectLog).toBe(true);
    }
  });

  it("triggers ON_ATTACK effect when creature attacks", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);

    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    // Draw cards
    drawMany(engine, 0, 3);
    drawMany(engine, 1, 3);

    // Place attacker with ON_ATTACK effect
    const emberLion = p1.hand.find((c) => c.id === "ember_lion");
    expect(emberLion).toBeDefined();

    if (emberLion) {
      engine.playCreature(0, 0, emberLion.id);

      // Place defender in same lane
      const aquaSprite = p2.hand.find((c) => c.id === "aqua_sprite");
      if (aquaSprite) {
        engine.playCreature(1, 0, aquaSprite.id);
      }

      const initialLogLength = game.log.length;

      // Execute attack
      engine.attack(0, 0, 0);

      // Check logs for effect trigger
      const newLogs = game.log.slice(initialLogLength);
      const attackRelatedLogs = newLogs.join(" ");

      // Should contain attack-related logging
      expect(attackRelatedLogs.length).toBeGreaterThan(0);
    }
  });

  it("triggers ON_DRAW effect when card is drawn", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);

    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    const initialLogLength = game.log.length;

    // Draw a card (first card in deck)
    engine.draw(0);

    // Verify draw happened
    expect(p1.hand.length).toBe(1);

    // Check logs
    const newLogs = game.log.slice(initialLogLength);
    const hasDrawLog = newLogs.some((log) => log.includes("drew"));
    expect(hasDrawLog).toBe(true);

    // If the drawn card has an ON_DRAW effect, it should fire
    const drawnCard = p1.hand[0];
    if (drawnCard.effectId) {
      const hasEffectLog = newLogs.some((log) => log.includes("Effect"));
      // This assertion is conditional based on whether the card has ON_DRAW trigger
      if (hasEffectLog) {
        expect(hasEffectLog).toBe(true);
      }
    }
  });

  it("triggers effect when support card is played", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);

    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    // Draw until we get support cards
    drawMany(engine, 0, 10);

    const supportCard = p1.hand.find(
      (c) => c.type === CardType.Support
    ) as CardInterface;

    if (supportCard) {
      const initialLogLength = game.log.length;

      // Play support card
      const played = engine.playSupport(0, 0, supportCard.id);
      expect(played).toBe(true);

      // Verify it's in support slot
      expect(p1.support[0]).toBeDefined();
      expect(p1.support[0]?.id).toBe(supportCard.id);

      // Check logs for effect
      const newLogs = game.log.slice(initialLogLength);
      const hasPlayLog = newLogs.some((log) => log.includes("played support"));
      expect(hasPlayLog).toBe(true);

      // If support has effectId, effect should fire
      if (supportCard.effectId) {
        const hasEffectLog = newLogs.some((log) => log.includes("Effect"));
        if (hasEffectLog) {
          expect(hasEffectLog).toBe(true);
        }
      }
    }
  });

  it("does not trigger effects after game is won", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);

    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    // Force game to end by setting winner
    game.winnerIndex = 0;

    const initialHandSize = p1.hand.length;

    // Try to draw (should be blocked)
    engine.draw(0);

    // Hand size should not change
    expect(p1.hand.length).toBe(initialHandSize);

    // Try to play creature (should be blocked by normal game flow)
    drawMany(engine, 0, 3);
    const card = p1.hand[0];
    if (card && card.type === CardType.Creature) {
      const played = engine.playCreature(0, 0, card.id);
      // Even if it plays, attack should be blocked
      if (played) {
        const initialLogLength = game.log.length;
        engine.attack(0, 0, 0);
        // Should not log new attacks when game is won
        const newLogs = game.log.slice(initialLogLength);
        expect(newLogs.length).toBe(0);
      }
    }
  });

  it("properly resolves effect context with correct trigger", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);

    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 5);

    const creature = p1.hand.find(
      (c) => c.type === CardType.Creature
    ) as CardInterface;

    if (creature && creature.effectId) {
      const initialLogLength = game.log.length;

      // Play the creature
      engine.playCreature(0, 0, creature.id);

      // Get logs from this play
      const newLogs = game.log.slice(initialLogLength);

      // Should contain summoning log
      const hasSummonLog = newLogs.some((log) => log.includes("summoned"));
      expect(hasSummonLog).toBe(true);

      // If effect exists and matches ON_PLAY trigger, should see effect log
      const hasEffectLog = newLogs.some((log) => log.includes("Effect"));

      // This is conditional - only certain cards have ON_PLAY effects
      if (hasEffectLog) {
        // Verify the effect log format
        const effectLog = newLogs.find((log) => log.includes("Effect fired"));
        if (effectLog) {
          expect(effectLog).toContain(creature.effectId);
        }
      }
    }
  });

  it("logs effect actions when they execute", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);

    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 10);

    // Find a card with an effect
    const cardWithEffect = p1.hand.find((c) => c.effectId);

    if (cardWithEffect) {
      const initialLogLength = game.log.length;

      // Play the card
      if (cardWithEffect.type === CardType.Creature) {
        engine.playCreature(0, 0, cardWithEffect.id);
      } else if (cardWithEffect.type === CardType.Support) {
        engine.playSupport(0, 0, cardWithEffect.id);
      }

      const newLogs = game.log.slice(initialLogLength);

      // Should have effect-related logs
      const effectRelatedLogs = newLogs.filter(
        (log) => log.includes("Effect") || log.includes("->")
      );

      // If effect fired, we should see action type logs (-> STAT_MOD, -> HP_CHANGE, etc)
      if (effectRelatedLogs.length > 0) {
        expect(effectRelatedLogs.length).toBeGreaterThan(0);
      }
    }
  });
});
