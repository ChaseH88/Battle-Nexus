import cards from "../../static/card-data/bn-core.json";

import { createPlayerState } from "../PlayerState";
import { createGameState } from "../GameState";
import { BattleEngine } from "../BattleEngine";

import { CreatureCard } from "../../cards/CreatureCard";
import { ActionCard } from "../../cards/ActionCard";
import { SupportCard } from "../../cards/SupportCard";
import { CardType } from "../../cards/types";

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

const deck1 = (cards as any[]).map(cardFactory);
const deck2 = (cards as any[]).map(cardFactory);

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

    // ---------- KO #1 ----------
    // Defender: Terra Beetle (P2, lane 0)
    const terraP2 = getFromHand(p2, "terra_beetle");
    const playedTerra = engine.playCreature(1, 0, terraP2.id);
    expect(playedTerra).toBe(true);
    expect(p2.lanes[0]).toBeInstanceOf(CreatureCard);

    const p2HpBeforeFirst = p2.hp;

    engine.attack(0, 0); // Quake Stag vs Terra Beetle

    // Terra Beetle destroyed, lane cleared
    expect(p2.lanes[0]).toBeNull();

    // Extra damage = 400 - 250 = 150
    const expectedHpAfterFirst = p2HpBeforeFirst - (quake.atk - terraP2.def);
    expect(p2.hp).toBe(expectedHpAfterFirst);

    // KO count should be 1, no winner yet
    expect(game.koCount[0]).toBe(1);
    expect(game.koCount[1]).toBe(0);
    expect(game.winnerIndex).toBeNull();

    // ---------- KO #2 ----------
    // New defender: Aqua Sprite (P2, lane 0 again)
    const aquaP2 = getFromHand(p2, "aqua_sprite");
    const playedAqua = engine.playCreature(1, 0, aquaP2.id);
    expect(playedAqua).toBe(true);
    expect(p2.lanes[0]).toBeInstanceOf(CreatureCard);

    engine.attack(0, 0); // Quake Stag vs Aqua Sprite

    expect(p2.lanes[0]).toBeNull();
    expect(game.koCount[0]).toBe(2);
    expect(game.winnerIndex).toBeNull();

    // ---------- KO #3 (winning blow) ----------
    // New defender: Ember Cub (P2, lane 0)
    const emberP2 = getFromHand(p2, "ember_cub");
    const playedEmber = engine.playCreature(1, 0, emberP2.id);
    expect(playedEmber).toBe(true);
    expect(p2.lanes[0]).toBeInstanceOf(CreatureCard);

    engine.attack(0, 0); // Quake Stag vs Ember Cub

    expect(p2.lanes[0]).toBeNull();
    expect(game.koCount[0]).toBe(3);
    expect(game.winnerIndex).toBe(0); // P1 wins by 3 KOs

    // ---------- LOG CHECK ----------
    const logText = game.log.join(" | ");
    expect(logText).toContain("destroyed");
    expect(logText).toContain("wins by reaching 3 KOs");
  });
});
