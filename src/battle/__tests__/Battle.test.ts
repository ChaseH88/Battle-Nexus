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

    // KO count should be 1, no winner yet
    expect(game.koCount[0]).toBe(1);
    expect(game.koCount[1]).toBe(0);
    expect(game.winnerIndex).toBeNull();

    // ---------- KO #2 ----------
    // New defender: Aqua Sprite (P2, lane 0) - also needs DEFENSE mode
    const aquaP2 = getFromHand(p2, "aqua_sprite");
    const playedAqua = engine.playCreature(1, 0, aquaP2.id);
    expect(playedAqua).toBe(true);
    expect(p2.lanes[0]).toBeInstanceOf(CreatureCard);

    const aqua = p2.lanes[0] as CreatureCard;
    aqua.mode = "DEFENSE"; // 600 HP, 250 DEF - takes 150 damage per hit

    // Need 4 attacks to destroy (600 / 150 = 4)
    for (let i = 0; i < 4; i++) {
      engine.endTurn(); // P2's turn
      engine.draw(1);
      engine.endTurn(); // Back to P1's turn
      engine.draw(0);
      engine.attack(0, 0);
    }

    expect(p2.lanes[0]).toBeNull();
    expect(game.koCount[0]).toBe(2);
    expect(game.winnerIndex).toBeNull();

    // ---------- KO #3 (winning blow) ----------
    // New defender: Ember Lion (P2, lane 0) - 800 HP, 250 DEF
    const lionP2 = getFromHand(p2, "ember_lion");
    const playedLion = engine.playCreature(1, 0, lionP2.id);
    expect(playedLion).toBe(true);
    expect(p2.lanes[0]).toBeInstanceOf(CreatureCard);

    const lion = p2.lanes[0] as CreatureCard;
    lion.mode = "DEFENSE"; // Takes 150 damage per hit

    // Attack multiple times to get the 3rd KO (800 / 150 = ~6 attacks)
    for (let i = 0; i < 6; i++) {
      engine.endTurn(); // P2's turn
      engine.draw(1);
      engine.endTurn(); // Back to P1's turn
      engine.draw(0);
      engine.attack(0, 0);
      if (p2.lanes[0] === null) break;
    }

    expect(p2.lanes[0]).toBeNull();
    expect(game.koCount[0]).toBe(3);
    expect(game.winnerIndex).toBe(0); // P1 wins by 3 KOs    // ---------- LOG CHECK ----------
    const logText = game.log.getMessages().join(" | ");
    expect(logText).toContain("destroyed");
    expect(logText).toContain("wins by reaching 3 KOs");
  });
});
