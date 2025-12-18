import { CardInterface } from "../cards";
import { PlayerState } from "./PlayerState";

export interface ActiveEffect {
  id: string;
  name: string;
  sourceCardId: string;
  sourceCardName: string;
  playerIndex: 0 | 1;
  turnsRemaining?: number;
  description: string;
  affectedCardIds?: string[]; // Track which cards are affected
  statModifiers?: {
    atk?: number;
    def?: number;
  };
}

export interface GameState {
  players: [PlayerState, PlayerState];
  turn: number;
  activePlayer: 0 | 1;
  phase: "DRAW" | "MAIN";
  hasDrawnThisTurn: boolean;
  log: string[];
  stack: CardInterface[];
  koCount: [number, number];
  winnerIndex: 0 | 1 | null;
  activeEffects: ActiveEffect[];
}

export function createGameState(p1: PlayerState, p2: PlayerState): GameState {
  return {
    players: [p1, p2],
    turn: 1,
    activePlayer: 0,
    phase: "DRAW",
    hasDrawnThisTurn: false,
    log: [],
    stack: [],
    koCount: [0, 0],
    winnerIndex: null,
    activeEffects: [],
  };
}

export function getOpponentIndex(i: 0 | 1): 0 | 1 {
  return i === 0 ? 1 : 0;
}
