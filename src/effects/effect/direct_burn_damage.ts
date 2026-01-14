import { EffectHandler } from "../handler";
import { getOpponentIndex } from "../../battle/GameState";

/**
 * direct_burn_damage
 * Deal 30 damage directly to opponent, or 50 if you control a Fire creature
 */
export const direct_burn_damage: EffectHandler = ({
  state,
  ownerIndex,
  sourceCard,
  engine,
}) => {
  const opponent = state.players[getOpponentIndex(ownerIndex)];
  const player = state.players[ownerIndex];

  // Check if player controls any Fire creatures
  const hasFireCreature = player.lanes.some(
    (creature) => creature !== null && creature.affinity === "FIRE"
  );

  const damage = hasFireCreature ? 50 : 30;

  // Deal damage to opponent
  opponent.lifePoints -= damage;

  engine?.log(
    `${sourceCard.name} deals ${damage} direct damage to ${opponent.id}! (LP: ${opponent.lifePoints})`
  );
};
