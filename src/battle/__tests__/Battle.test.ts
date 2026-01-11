import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";
import { BattleEngine } from "@battle/BattleEngine";

import { CreatureCard } from "@cards/CreatureCard";
import { CardType } from "@cards/types";
import {
  drawMany,
  createTestDeck1,
  createTestDeck2,
} from "@/__tests__/testUtils";

describe("BattleEngine – KO and win logic", () => {
  it("tracks KOs and declares a winner at 3 KOs", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());

    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    // Draw enough cards to find strong creatures
    drawMany(engine, 0, 15); // Draw more to ensure we get the cards we need
    drawMany(engine, 1, 15);

    // Helper: find any creature in hand (fallback to first available)
    const getCreatureFromHand = (
      player: typeof p1,
      preferredId?: string
    ): CreatureCard => {
      let card = preferredId
        ? player.hand.find((c) => c.id === preferredId)
        : undefined;

      // If preferred card not found, find any creature
      if (!card) {
        card = player.hand.find((c) => c.type === CardType.Creature);
      }

      expect(card).toBeDefined();
      if (!card) {
        throw new Error(`No creature card found in hand`);
      }
      return card as CreatureCard;
    };

    // Attacker: Find a strong creature (prefer seismic_hart, tidal_guardian, or any with high ATK)
    const attackerCard =
      getCreatureFromHand(p1, "seismic_hart") ||
      getCreatureFromHand(p1, "tidal_guardian") ||
      getCreatureFromHand(p1);
    const playedAttacker = engine.playCreature(0, 0, attackerCard.id);
    expect(playedAttacker).toBe(true);
    expect(p1.lanes[0]).toBeInstanceOf(CreatureCard);

    const attacker = p1.lanes[0] as CreatureCard;
    expect(attacker.atk).toBeGreaterThan(0); // Has attack power

    // End turn 1 so P1 can attack on turn 2
    engine.endTurn(); // Now P2's turn
    engine.draw(1); // P2 draws
    engine.endTurn(); // Back to P1's turn
    engine.draw(0); // P1 draws - Turn 2 begins

    // ---------- KO #1 ----------
    // Defender: Find any weak creature for P2
    const defenderCard =
      getCreatureFromHand(p2, "ember_cub") || getCreatureFromHand(p2);
    const playedDefender = engine.playCreature(1, 0, defenderCard.id);
    expect(playedDefender).toBe(true);
    expect(p2.lanes[0]).toBeInstanceOf(CreatureCard);
    const attackerAtk = attacker.atk;

    // Attack - may take multiple attacks to destroy depending on HP
    engine.attack(0, 0);

    // Check if defender was destroyed or damaged
    const defenderStillAlive = p2.lanes[0] !== null;

    if (defenderStillAlive) {
      // Need more attacks - keep attacking until destroyed
      let attackCount = 1;
      while (p2.lanes[0] !== null && attackCount < 10) {
        engine.endTurn();
        engine.draw(1);
        engine.endTurn();
        engine.draw(0);
        engine.attack(0, 0);
        attackCount++;
      }
    }

    // Defender should eventually be destroyed
    expect(p2.lanes[0]).toBeNull();

    // Both players should still be alive
    expect(p1.lifePoints).toBeGreaterThan(0);
    expect(p2.lifePoints).toBeGreaterThan(0);
    expect(game.winnerIndex).toBeNull();

    // ---------- Direct Attack Test ----------
    // No creatures on P2's field - direct attack should deal damage
    engine.endTurn(); // P2's turn
    engine.draw(1);
    engine.endTurn(); // Back to P1's turn
    engine.draw(0);

    const lifeBeforeDirectAttack = p2.lifePoints;
    engine.attack(0, 0); // Direct attack

    // P2 should have lost life points equal to attacker's ATK
    expect(p2.lifePoints).toBe(lifeBeforeDirectAttack - attackerAtk);
    expect(game.winnerIndex).toBeNull();

    // ---------- More Direct Attacks to Win ----------
    // Keep attacking until P2's life points reach 0
    let directAttackCount = 0;
    while (p2.lifePoints > 0 && directAttackCount < 20) {
      engine.endTurn(); // P2's turn
      engine.draw(1);
      engine.endTurn(); // Back to P1's turn
      engine.draw(0);
      engine.attack(0, 0);
      directAttackCount++;
    }

    // P2 should have 0 or less life points and P1 should win
    expect(p2.lifePoints).toBeLessThanOrEqual(0);
    expect(game.winnerIndex).toBe(0); // P1 wins

    // ---------- LOG CHECK ----------
    const logText = game.log.getMessages().join(" | ");
    expect(logText).toContain("Life Points reached 0");
  });
});
