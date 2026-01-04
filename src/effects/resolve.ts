import { GameState } from "../battle/GameState";
import { effectsRegistry } from "./registry";
import { EffectDefinition } from "./types";
import { CardInterface } from "../cards";
import { BattleEngine } from "../battle/BattleEngine";
import { executeEffect, createEffectUtils, EffectContext } from "./handler";

export function resolveEffectsForCard(params: {
  state: GameState;
  ownerIndex: 0 | 1;
  cardEffectId?: string;
  trigger: EffectDefinition["trigger"];
  sourceCard?: CardInterface;
  engine?: BattleEngine;
  eventData?: {
    lane?: number;
    targetLane?: number;
    targetPlayer?: 0 | 1;
  };
  onEffectActivated?: (card: CardInterface, effectName: string) => void;
}) {
  const {
    state,
    ownerIndex,
    cardEffectId,
    trigger,
    sourceCard,
    engine,
    eventData,
    onEffectActivated,
  } = params;

  if (!cardEffectId || !sourceCard || !engine) return;

  const effect = effectsRegistry[cardEffectId];
  if (!effect) {
    state.log.warning(
      state.turn,
      state.phase,
      `Effect missing: ${cardEffectId}`
    );
    return;
  }

  // Allow effects with matching trigger, or CONTINUOUS/MANUAL effects (always activatable)
  if (
    effect.trigger !== trigger &&
    effect.trigger !== "CONTINUOUS" &&
    effect.trigger !== "MANUAL"
  )
    return;

  state.log.effectApplied(
    state.turn,
    state.phase,
    effect.name,
    `Effect fired: ${effect.name} (${effect.id})`
  );

  // Notify that effect is activating
  if (onEffectActivated) {
    onEffectActivated(sourceCard, effect.name);
  }

  // Create effect context
  const context: EffectContext = {
    state,
    engine,
    sourceCard,
    ownerIndex,
    trigger,
    eventData,
    utils: createEffectUtils(state, engine),
  };

  // Execute the effect using the custom handler
  executeEffect(cardEffectId, context);
}
