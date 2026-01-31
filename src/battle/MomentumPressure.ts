/**
 * Momentum Pressure System
 *
 * A global game rule that dynamically buffs all creatures based on their owner's Momentum.
 * This is a DERIVED effect - it does not permanently modify creature stats.
 *
 * Momentum Scale:
 * 1-2:  No buffs
 * 3-5:  +10 ATK / +10 DEF
 * 6-9:  +20 ATK / +20 DEF
 * 10:   +30 ATK / +30 DEF
 */

export interface MomentumBuff {
  atk: number;
  def: number;
}

/**
 * Calculate the global buff provided by a player's current Momentum value.
 * This buff applies to ALL creatures controlled by that player.
 *
 * @param momentum - Current momentum value (1-10)
 * @returns Buff amounts for HP, ATK, and DEF
 */
export function getMomentumGlobalBuff(momentum: number): MomentumBuff {
  if (momentum >= 10) {
    return { atk: 30, def: 30 };
  } else if (momentum >= 6) {
    return { atk: 20, def: 20 };
  } else if (momentum >= 3) {
    return { atk: 10, def: 10 };
  } else {
    return { atk: 0, def: 0 };
  }
}

/**
 * Apply Momentum Pressure buffs to a creature's effective stats.
 * This is a READ-ONLY operation - it returns buffed values without modifying the creature.
 *
 * @param baseAtk - Creature's current ATK (may already include card effect modifiers)
 * @param baseDef - Creature's current DEF (may already include card effect modifiers)
 * @param currentHp - Creature's current HP
 * @param maxHp - Creature's max HP (base hp)
 * @param momentum - Player's current momentum
 * @returns Effective stats with Momentum Pressure applied
 */
export function applyMomentumPressure(
  baseAtk: number,
  baseDef: number,
  currentHp: number,
  maxHp: number,
  momentum: number,
): { atk: number; def: number; currentHp: number; maxHp: number } {
  const buff = getMomentumGlobalBuff(momentum);

  // ATK: Base + Momentum Buff (minimum 0)
  const effectiveAtk = Math.max(0, baseAtk + buff.atk);

  // DEF: Base + Momentum Buff (minimum 0)
  const effectiveDef = Math.max(0, baseDef + buff.def);

  // HP: No momentum buff applied - HP remains unchanged
  const effectiveMaxHp = maxHp;
  const effectiveCurrentHp = currentHp;

  return {
    atk: effectiveAtk,
    def: effectiveDef,
    currentHp: effectiveCurrentHp,
    maxHp: effectiveMaxHp,
  };
}

/**
 * Get the effective stats for a creature with Momentum Pressure applied.
 * This should be used whenever displaying or calculating with creature stats.
 *
 * @param creature - The creature card
 * @param playerMomentum - The owning player's current momentum
 * @returns Object with effective stats
 */
export function getEffectiveCreatureStats(
  creature: { atk: number; def: number; currentHp: number; hp: number },
  playerMomentum: number,
): { atk: number; def: number; currentHp: number; maxHp: number } {
  return applyMomentumPressure(
    creature.atk,
    creature.def,
    creature.currentHp,
    creature.hp,
    playerMomentum,
  );
}
