import { ActiveEffect } from "../../../battle/GameState";
import {
  ActiveEffectsPanel,
  EffectsTitle,
  EffectsList,
  EffectItem,
  EffectName,
  EffectSource,
  EffectDuration,
  EffectOwner,
  EffectStats,
  StatMod,
  AffectedCount,
} from "./styled";

interface ActiveEffectsProps {
  activeEffects: ActiveEffect[];
  players: Array<{ id: string }>;
}

export const ActiveEffects = ({
  activeEffects,
  players,
}: ActiveEffectsProps) => {
  if (activeEffects.length === 0) return null;

  return (
    <ActiveEffectsPanel>
      <EffectsTitle>⚡ Active Effects</EffectsTitle>
      <EffectsList>
        {activeEffects.map((effect, i) => (
          <EffectItem key={i}>
            <EffectName>{effect.name}</EffectName>
            <EffectSource>from {effect.sourceCardName}</EffectSource>
            {effect.statModifiers && (
              <EffectStats>
                {effect.statModifiers.atk && (
                  <StatMod stattype="atk">
                    +{effect.statModifiers.atk} ATK
                  </StatMod>
                )}
                {effect.statModifiers.def && (
                  <StatMod stattype="def">
                    +{effect.statModifiers.def} DEF
                  </StatMod>
                )}
              </EffectStats>
            )}
            {effect.affectedCardIds && effect.affectedCardIds.length > 0 && (
              <AffectedCount>
                ({effect.affectedCardIds.length} card
                {effect.affectedCardIds.length !== 1 ? "s" : ""})
              </AffectedCount>
            )}
            {effect.turnsRemaining !== undefined && (
              <EffectDuration>
                ({effect.turnsRemaining} turn
                {effect.turnsRemaining !== 1 ? "s" : ""})
              </EffectDuration>
            )}
            <EffectOwner playerindex={effect.playerIndex}>
              [{players[effect.playerIndex].id}]
            </EffectOwner>
          </EffectItem>
        ))}
      </EffectsList>
    </ActiveEffectsPanel>
  );
};
