import { GameState } from "../battle/GameState";
import { CardInterface } from "../cards";
import effectsJson from "./data.json";
import { EffectDefinition } from "./types";

export type EffectsRegistry = Record<string, EffectDefinition>;

export const effectsRegistry: EffectsRegistry = Object.fromEntries(
  (effectsJson as EffectDefinition[]).map((e) => [e.id, e])
);

export interface EffectContext {
  state: GameState;
  ownerIndex: 0 | 1;
  source: CardInterface;
  event: {
    type: "PLAY" | "ATTACK" | "DEFEND" | "DESTROY" | "DRAW" | "CONTINUOUS_TICK";
    lane?: number;
    opponentIndex?: 0 | 1;
  };
}
