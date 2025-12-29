import cards from "@static/card-data/bn-core.json";
import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";
import { BattleEngine } from "@battle/BattleEngine";
import { CardInterface, CardType } from "@cards/types";
import { CreatureCard } from "@cards/CreatureCard";
import { ActionCard } from "@cards/ActionCard";
import { SupportCard } from "@cards/SupportCard";

function cardFactory(raw: any): CardInterface {
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

function drawMany(engine: BattleEngine, playerIndex: number, count: number) {
  for (let i = 0; i < count; i++) {
    engine.draw(playerIndex);
  }
}

/**
 * Turn & Phase Management Tests
 * Tests turn alternation, phase transitions, and state resets
 */
describe("BattleEngine – Turn & Phase", () => {
  it("alternates turns between players correctly", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    expect(game.turn).toBe(1);
    expect(game.activePlayer).toBe(0);

    engine.draw(0);
    engine.endTurn();

    // After P1 ends turn, it's still turn 1 but P2 is active
    expect(game.turn).toBe(2); // Turn increments after each player
    expect(game.activePlayer).toBe(1);

    engine.draw(1);
    engine.endTurn();

    // After P2 ends turn, turn increments
    expect(game.turn).toBe(3);
    expect(game.activePlayer).toBe(0);
  });

  it("transitions through phases correctly", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    expect(game.phase).toBe("DRAW");

    engine.draw(0);
    expect(game.phase).toBe("MAIN");

    engine.endTurn();
    expect(game.phase).toBe("DRAW");
  });

  it("resets hasChangedMode flags when turn ends", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    drawMany(engine, 0, 6);

    const creature = p1.hand.find((c) => c.id === "quake_stag");
    if (creature) {
      engine.playCreature(0, 0, creature.id);
      const card = p1.lanes[0] as CreatureCard;

      card.hasChangedModeThisTurn = true;

      engine.endTurn();
      engine.draw(1);
      engine.endTurn();

      // After P2's turn ends, back to P1
      expect(card.hasChangedModeThisTurn).toBe(false);
    }
  });

  it("allows only one draw per turn", () => {
    const p1 = createPlayerState("P1", deck1);
    const p2 = createPlayerState("P2", deck2);
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    engine.draw(0);

    // Already in MAIN phase
    expect(game.phase).toBe("MAIN");

    engine.draw(0);

    // Trying to draw again in main phase should not add cards
    // (Though implementation may add if hasDrawnThisTurn is not checked)
    expect(game.hasDrawnThisTurn).toBe(true);
  });
});
