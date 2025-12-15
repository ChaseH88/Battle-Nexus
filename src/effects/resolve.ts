import { GameState } from "../battle/GameState";
import { effectsRegistry } from "./effects";
import { EffectDefinition } from "./types";

export function resolveEffectsForCard(params: {
  state: GameState;
  ownerIndex: 0 | 1;
  cardEffectId?: string;
  trigger: EffectDefinition["trigger"];
}) {
  const { state, ownerIndex, cardEffectId, trigger } = params;
  if (!cardEffectId) return;

  const effect = effectsRegistry[cardEffectId];
  if (!effect) {
    state.log.push(`Effect missing: ${cardEffectId}`);
    return;
  }

  if (effect.trigger !== trigger && effect.trigger !== "CONTINUOUS") return;

  state.log.push(`Effect fired: ${effect.name} (${effect.id})`);
  for (const action of effect.actions) {
    state.log.push(`  -> ${action.type}`);
  }
}
