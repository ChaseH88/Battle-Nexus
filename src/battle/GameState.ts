import { PlayerState } from "./PlayerState";
import { Card } from "../cards";

export interface GameState {
  players: [PlayerState, PlayerState];
  turn: number;
  /**
   * Index of the active player (0 or 1)
   */
  activePlayer: number;
  log: string[];
  stack: Card[];
  /**
   * KOs done by Player 0 and Player 1
   */
  koCount: [number, number];
  winnerIndex: 0 | 1 | null;
}

export function createGameState(p1: PlayerState, p2: PlayerState): GameState {
  return {
    players: [p1, p2],
    turn: 1,
    activePlayer: 0,
    log: [],
    stack: [],
    koCount: [0, 0],
    winnerIndex: null,
  };
}

export function getOpponentIndex(active: number): number {
  return active === 0 ? 1 : 0;
}
