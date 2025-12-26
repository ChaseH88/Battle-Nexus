import cards from "@static/card-data/bn-core.json";

import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";
import { BattleEngine } from "@battle/BattleEngine";

import { CreatureCard } from "@cards/CreatureCard";
import { ActionCard } from "@cards/ActionCard";
import { SupportCard } from "@cards/SupportCard";
import { CardInterface, CardType } from "@cards/types";

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

describe("BattleEngine – KO and win logic", () => {
  it("tracks KOs and declares a winner at 3 KOs", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);

    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    // Draw enough so all key creatures are in hand
    drawMany(engine, 0, 6); // ember_cub, ember_lion, aqua_sprite, tidal_guardian, terra_beetle, quake_stag
    drawMany(engine, 1, 6);

    // Helper: safely pull card from hand by ID
    const getFromHand = (player: typeof p1, id: string): CreatureCard => {
      const card = player.hand.find((c) => c.id === id) as
        | CreatureCard
        | undefined;
      expect(card).toBeDefined();
      if (!card) {
        throw new Error(`Expected card ${id} in hand`);
      }
      return card;
    };

    // Attacker for all KOs: Quake Stag (P1, lane 0)
    const quakeP1 = getFromHand(p1, "quake_stag");
    const playedQuake = engine.playCreature(0, 0, quakeP1.id);
    expect(playedQuake).toBe(true);
    expect(p1.lanes[0]).toBeInstanceOf(CreatureCard);

    const quake = p1.lanes[0] as CreatureCard;
    expect(quake.atk).toBe(400); // sanity from JSON

    // End turn 1 so P1 can attack on turn 2
    engine.endTurn(); // Now P2's turn
    engine.draw(1); // P2 draws
    engine.endTurn(); // Back to P1's turn
    engine.draw(0); // P1 draws - Turn 2 begins

    // ---------- KO #1 ----------
    // Defender: Ember Cub (P2, lane 0) - set to DEFENSE mode so it takes more damage
    const emberP2 = getFromHand(p2, "ember_cub");
    const playedEmber = engine.playCreature(1, 0, emberP2.id);
    expect(playedEmber).toBe(true);
    expect(p2.lanes[0]).toBeInstanceOf(CreatureCard);

    const emberCub = p2.lanes[0] as CreatureCard;
    emberCub.mode = "DEFENSE"; // 500 HP, 150 DEF - will take 400-150=250 damage, survives with 250 HP

    engine.attack(0, 0); // Quake Stag (400 ATK) vs Ember Cub (DEFENSE)

    // Ember Cub survives but is weakened
    expect(p2.lanes[0]).not.toBeNull();

    // Attack again after ending turn
    engine.endTurn(); // P2's turn
    engine.draw(1);
    engine.endTurn(); // Back to P1's turn
    engine.draw(0);
    engine.attack(0, 0); // Second attack kills it (250 - 250 = 0)

    // Ember Cub destroyed, lane cleared
    expect(p2.lanes[0]).toBeNull();

    // Both players should still have 2000 life points (no direct attacks)
    expect(p1.lifePoints).toBe(2000);
    expect(p2.lifePoints).toBe(2000);
    expect(game.winnerIndex).toBeNull();

    // ---------- Direct Attack Test ----------
    // No creatures on P2's field - direct attack should deal damage
    engine.endTurn(); // P2's turn
    engine.draw(1);
    engine.endTurn(); // Back to P1's turn
    engine.draw(0);
    engine.attack(0, 0); // Direct attack with 400 ATK creature

    // P2 should have lost 400 life points
    expect(p2.lifePoints).toBe(1600);
    expect(game.winnerIndex).toBeNull();

    // ---------- More Direct Attacks ----------
    // Attack 4 more times to bring P2 to 0 life points (1600 / 400 = 4)
    for (let i = 0; i < 4; i++) {
      engine.endTurn(); // P2's turn
      engine.draw(1);
      engine.endTurn(); // Back to P1's turn
      engine.draw(0);
      engine.attack(0, 0);
    }

    // P2 should have 0 life points and P1 should win
    expect(p2.lifePoints).toBe(0);
    expect(game.winnerIndex).toBe(0); // P1 wins    // ---------- LOG CHECK ----------
    const logText = game.log.getMessages().join(" | ");
    expect(logText).toContain("destroyed");
    expect(logText).toContain("Life Points reached 0");
  });
});
