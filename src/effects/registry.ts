import { GameState } from "../battle/GameState";
import { CardInterface } from "../cards";
import effectsJson from "./data.json";
import { EffectDefinition } from "./types";

export type EffectsRegistry = Record<string, EffectDefinition>;

export const effectsRegistry: EffectsRegistry = Object.fromEntries(
  (effectsJson as EffectDefinition[]).map((e) => [e.id, e])
);

/**
 * Get the effect timing for a card based on its effectId.
 * Returns "ONE_TIME" if the effect has timing: "NORMAL" or "QUICK"
 * Returns "CONTINUOUS" if the effect has timing: "PERSIST"
 * Falls back to card.effectType if effect not found or no effectId
 */
export function getEffectTiming(
  card: CardInterface
): "ONE_TIME" | "CONTINUOUS" | undefined {
  // Fallback to card's effectType if present (backward compatibility)
  if (!card.effectId) {
    return card.effectType;
  }

  const effect = effectsRegistry[card.effectId];
  if (!effect) {
    return card.effectType;
  }

  // Map effect timing to card effect type
  return effect.timing === "PERSIST" ? "CONTINUOUS" : "ONE_TIME";
}

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
