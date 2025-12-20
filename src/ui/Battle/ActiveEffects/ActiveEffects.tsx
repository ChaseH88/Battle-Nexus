import { ActiveEffect } from "../../../battle/GameState";

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
    <div className="active-effects-panel">
      <h4>⚡ Active Effects</h4>
      <div className="effects-list">
        {activeEffects.map((effect, i) => (
          <div key={i} className="effect-item">
            <span className="effect-name">{effect.name}</span>
            <span className="effect-source">from {effect.sourceCardName}</span>
            {effect.statModifiers && (
              <span className="effect-stats">
                {effect.statModifiers.atk && (
                  <span className="stat-mod atk">
                    +{effect.statModifiers.atk} ATK
                  </span>
                )}
                {effect.statModifiers.def && (
                  <span className="stat-mod def">
                    +{effect.statModifiers.def} DEF
                  </span>
                )}
              </span>
            )}
            {effect.affectedCardIds && effect.affectedCardIds.length > 0 && (
              <span className="affected-count">
                ({effect.affectedCardIds.length} card
                {effect.affectedCardIds.length !== 1 ? "s" : ""})
              </span>
            )}
            {effect.turnsRemaining !== undefined && (
              <span className="effect-duration">
                ({effect.turnsRemaining} turn
                {effect.turnsRemaining !== 1 ? "s" : ""})
              </span>
            )}
            <span className={`effect-owner p${effect.playerIndex}`}>
              [{players[effect.playerIndex].id}]
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
