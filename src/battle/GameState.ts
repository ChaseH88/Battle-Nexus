import { CardInterface } from "../cards";
import { PlayerState } from "./PlayerState";
import { GameLogger } from "./GameLog";

export interface ActiveEffect {
  id: string;
  name: string;
  sourceCardId: string;
  sourceCardName: string;
  playerIndex: 0 | 1;
  scope: "player1" | "player2" | "global"; // Which player(s) this effect applies to
  turnsRemaining?: number;
  description: string;
  affectedCardIds?: string[]; // Track which cards are affected
  statModifiers?: {
    atk?: number;
    def?: number;
  };
  isGlobal?: boolean; // Global effects persist even after source card is removed
  effectDefinitionId?: string; // Store the effectId from the source card for global effects
  isMomentumEffect?: boolean; // Special flag for momentum pressure effects
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
