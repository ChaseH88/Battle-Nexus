import { CardInterface } from "../cards";
import { PlayerState } from "./PlayerState";
import { GameLogger } from "./GameLog";

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
  log: GameLogger; // Changed from string[] to GameLogger
  stack: CardInterface[];
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
    log: new GameLogger(),
    stack: [],
    winnerIndex: null,
    activeEffects: [],
  };
}

export function getOpponentIndex(i: 0 | 1): 0 | 1 {
  return i === 0 ? 1 : 0;
}
