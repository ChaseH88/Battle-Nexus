import {
  PlayerActiveEffectsContainer,
  EffectBadge,
  EffectName,
  EffectValue,
  EffectDuration,
} from "./styled";
import { ActiveEffect } from "../../../battle/GameState";

interface PlayerActiveEffectsProps {
  playerIndex: number;
  activeEffects: ActiveEffect[];
}

export const PlayerActiveEffects = ({
  playerIndex,
  activeEffects,
}: PlayerActiveEffectsProps) => {
  // Filter effects that apply to or are owned by this player
  const playerEffects = activeEffects.filter((effect) => {
    // For momentum effects, only show if they belong to this player
    if (effect.isMomentumEffect) {
      return effect.playerIndex === playerIndex;
    }

    // Show effects owned by this player
    if (effect.playerIndex === playerIndex) {
      return true;
    }

    // Show truly global effects (not momentum effects)
    if (
      (effect.scope === "global" || effect.isGlobal) &&
      !effect.isMomentumEffect
    ) {
      return true;
    }

    // Show effects specifically targeting this player
    const targetScope = `player${playerIndex + 1}` as "player1" | "player2";
    if (effect.scope === targetScope) {
      return true;
    }

    return false;
  });

  if (playerEffects.length === 0) {
    return null;
  }

  return (
    <PlayerActiveEffectsContainer>
      {playerEffects.map((effect, index) => (
        <EffectBadge key={`${effect.id}-${index}`}>
          <EffectName>
            {effect.name.replace(/_/g, " ").toLowerCase()}
          </EffectName>
          {effect.statModifiers?.atk && (
            <EffectValue>
              ATK {effect.statModifiers.atk > 0 ? "+" : ""}
              {effect.statModifiers.atk}
            </EffectValue>
          )}
          {effect.statModifiers?.def && (
            <EffectValue>
              DEF {effect.statModifiers.def > 0 ? "+" : ""}
              {effect.statModifiers.def}
            </EffectValue>
          )}
          {effect.turnsRemaining && effect.turnsRemaining > 0 && (
            <EffectDuration>{effect.turnsRemaining}t</EffectDuration>
          )}
        </EffectBadge>
      ))}
    </PlayerActiveEffectsContainer>
  );
};
