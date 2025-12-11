import { GameState } from "./GameState";
import { Card } from "../cards";

export interface EffectContext {
  state: GameState;
  ownerIndex: number;
  source: Card;
}

export type CardEffect = (ctx: EffectContext) => void;

export const effects: Record<string, CardEffect> = {
  // "boost_fire_and_extend_ignite": (ctx) => { ... }
};
