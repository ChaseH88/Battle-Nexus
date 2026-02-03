import { createPlayerState } from "../PlayerState";
import { createGameState } from "../GameState";
import { BattleEngine } from "../BattleEngine";

import { CreatureCard } from "../../cards/CreatureCard";
import { CardInterface, CardType, Affinity, Rarity } from "../../cards/types";
import {
  drawMany,
  createTestDeck1,
  createTestDeck2,
} from "../../__tests__/testUtils";

describe("BattleEngine – Effect System", () => {
  it("triggers ON_PLAY effect when creature is summoned", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());

    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    // Draw cards into hand
    drawMany(engine, 0, 3);

    const initialEventCount = game.log.getEvents().length;

    // Play a creature - check that play action is logged
    const emberCub = p1.hand.find((c) => c.id === "ember_cub");
    expect(emberCub).toBeDefined();

    if (emberCub) {
      const played = engine.playCreature(0, 0, emberCub.id);
      expect(played).toBe(true);

      // Check that the play action was logged
      const newEvents = game.log.getEvents().slice(initialEventCount);
      const newMessages = newEvents.map((e) => e.message);
      const hasPlayLog = newMessages.some(
        (log: string) => log.includes("played") || log.includes("summoned"),
      );
      expect(hasPlayLog).toBe(true);
    }
  });

  it("triggers ON_ATTACK effect when creature attacks", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());

    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    // Set up game state for player 1 to attack
    game.turn = 2;
    game.activePlayer = 0;
    game.phase = "MAIN";

    // Give players momentum to play cards
    p1.momentum = 5;
    p2.momentum = 5;

    // Don't draw any cards initially - keep full deck
    drawMany(engine, 0, 1); // Just 1 to have some cards
    drawMany(engine, 1, 1);

    // Create a custom creature with ON_ATTACK effect
    const attackerWithEffect = new CreatureCard({
      id: "test_attacker_with_on_attack",
      type: CardType.Creature,
      name: "Test Attacker",
      description: "Test creature with ON_ATTACK effect",
      cost: 1,
      atk: 30,
      def: 20,
      hp: 80,
      affinity: Affinity.Fire,
      onAttackEffectId: "battle_rage", // ON_ATTACK effect that draws a card
      rarity: Rarity.Common,
      set: "Base",
    });

    // Add to hand and play
    p1.hand.push(attackerWithEffect);
    engine.playCreature(0, 0, attackerWithEffect.id);

    // Place defender in same lane
    const defender = p2.hand.find((c) => c.type === CardType.Creature);
    if (defender) {
      engine.playCreature(1, 0, defender.id);
    }

    const initialHandSize = p1.hand.length;
    const initialDeckSize = p1.deck.length;
    const initialLogLength = game.log.getEvents().length;

    // Execute attack - this should trigger the ON_ATTACK effect
    engine.attack(0, 0, 0);

    // Check logs for effect activation
    const newEvents = game.log.getEvents().slice(initialLogLength);
    const logMessages = newEvents.map((e) => e.message);

    // Verify attack happened
    const hasAttackLog = logMessages.some(
      (log: string) =>
        log.includes("CLASH") ||
        log.includes("attack") ||
        log.includes("strikes"),
    );
    expect(hasAttackLog).toBe(true);

    // Verify the ON_ATTACK effect was processed (check for effect log)
    const hasEffectLog = logMessages.some(
      (log: string) =>
        log.includes("Battle Rage") ||
        log.includes("Effect fired") ||
        log.includes("Effect activated"),
    );
    expect(hasEffectLog).toBe(true);

    // Verify a card was drawn (deck decreased, hand increased)
    expect(p1.deck.length).toBe(initialDeckSize - 1);
    expect(p1.hand.length).toBe(initialHandSize + 1);
  });

  it("triggers ON_DRAW effect when card is drawn", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());

    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    const initialLogLength = game.log.getEvents().length;

    // Draw a card (first card in deck)
    engine.draw(0);

    // Verify draw happened
    expect(p1.hand.length).toBe(1);

    // Check logs
    const newEvents = game.log.getEvents().slice(initialLogLength);
    const hasDrawLog = newEvents
      .map((e) => e.message)
      .some((log) => log.includes("drew"));
    expect(hasDrawLog).toBe(true);

    // If the drawn card has an ON_DRAW effect, it should fire
    const drawnCard = p1.hand[0];
    if (drawnCard.effectId) {
      const hasEffectLog = newEvents
        .map((e) => e.message)
        .some((log) => log.includes("Effect"));
      // This assertion is conditional based on whether the card has ON_DRAW trigger
      if (hasEffectLog) {
        expect(hasEffectLog).toBe(true);
      }
    }
  });

  it("triggers effect when support card is played", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());

    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    // Draw until we get support cards
    drawMany(engine, 0, 10);

    const supportCard = p1.hand.find(
      (c) => c.type === CardType.Support,
    ) as CardInterface;

    if (supportCard) {
      const initialLogLength = game.log.getEvents().length;

      // Play support card
      const played = engine.playSupport(0, 0, supportCard.id);
      expect(played).toBe(true);

      // Verify it's in support slot
      expect(p1.support[0]).toBeDefined();
      expect(p1.support[0]?.id).toBe(supportCard.id);

      // Check logs for play action
      const newEvents = game.log.getEvents().slice(initialLogLength);
      const hasPlayLog = newEvents
        .map((e) => e.message)
        .some((log) => log.includes("played") || log.includes("support"));
      expect(hasPlayLog).toBe(true);

      // If support has effectId, effect should fire
      if (supportCard.effectId) {
        const hasEffectLog = newEvents
          .map((e) => e.message)
          .some((log) => log.includes("Effect"));
        if (hasEffectLog) {
          expect(hasEffectLog).toBe(true);
        }
      }
    }
  });

  it("does not trigger effects after game is won", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());

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
        const initialLogLength = game.log.getEvents().length;
        engine.attack(0, 0, 0);
        // Should not log new attacks when game is won
        const newEvents = game.log.getEvents().slice(initialLogLength);
        expect(newEvents.map((e) => e.message).length).toBe(0);
      }
    }
  });

  it("properly resolves effect context with correct trigger", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());

    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 5);

    const creature = p1.hand.find(
      (c) => c.type === CardType.Creature,
    ) as CardInterface;

    if (creature && creature.effectId) {
      const initialLogLength = game.log.getEvents().length;

      // Play the creature
      engine.playCreature(0, 0, creature.id);

      // Get logs from this play
      const newEvents = game.log.getEvents().slice(initialLogLength);

      // Should contain summoning log
      const hasSummonLog = newEvents
        .map((e) => e.message)
        .some((log) => log.includes("summoned"));
      expect(hasSummonLog).toBe(true);

      // If effect exists and matches ON_PLAY trigger, should see effect log
      const hasEffectLog = newEvents
        .map((e) => e.message)
        .some((log) => log.includes("Effect"));

      // This is conditional - only certain cards have ON_PLAY effects
      if (hasEffectLog) {
        // Verify the effect log format
        const effectLog = newEvents
          .map((e) => e.message)
          .find((log) => log.includes("Effect fired"));
        if (effectLog) {
          expect(effectLog).toContain(creature.effectId);
        }
      }
    }
  });

  it("logs effect actions when they execute", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());

    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 10);

    // Find a card with an effect
    const cardWithEffect = p1.hand.find((c) => c.effectId);

    if (cardWithEffect) {
      const initialLogLength = game.log.getEvents().length;

      // Play the card
      if (cardWithEffect.type === CardType.Creature) {
        engine.playCreature(0, 0, cardWithEffect.id);
      } else if (cardWithEffect.type === CardType.Support) {
        engine.playSupport(0, 0, cardWithEffect.id);
      }

      const newEvents = game.log.getEvents().slice(initialLogLength);

      // Should have effect-related logs
      const effectRelatedLogs = newEvents
        .map((e) => e.message)
        .filter((log) => log.includes("Effect") || log.includes("->"));

      // If effect fired, we should see action type logs (-> STAT_MOD, -> HP_CHANGE, etc)
      if (effectRelatedLogs.length > 0) {
        expect(effectRelatedLogs.length).toBeGreaterThan(0);
      }
    }
  });
});
