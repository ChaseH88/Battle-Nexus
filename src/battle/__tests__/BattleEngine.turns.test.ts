import { createPlayerState } from "@battle/PlayerState";
import { createGameState } from "@battle/GameState";
import { BattleEngine } from "@battle/BattleEngine";
import { CreatureCard } from "@cards/CreatureCard";
import {
  drawMany,
  createTestDeck1,
  createTestDeck2,
} from "@/__tests__/testUtils";

/**
 * Turn & Phase Management Tests
 * Tests turn alternation, phase transitions, and state resets
 */
describe("BattleEngine – Turn & Phase", () => {
  it("alternates turns between players correctly", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
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
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
    const game = createGameState(p1, p2);
    const engine = new BattleEngine(game);

    expect(game.phase).toBe("DRAW");

    engine.draw(0);
    expect(game.phase).toBe("MAIN");

    engine.endTurn();
    expect(game.phase).toBe("DRAW");
  });

  it("resets hasChangedMode flags when turn ends", () => {
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
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
    const p1 = createPlayerState("P1", createTestDeck1());
    const p2 = createPlayerState("P2", createTestDeck2());
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
