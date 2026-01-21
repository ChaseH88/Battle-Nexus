/**
 * Momentum Pressure System
 *
 * A global game rule that dynamically buffs all creatures based on their owner's Momentum.
 * This is a DERIVED effect - it does not permanently modify creature stats.
 *
 * Momentum Scale:
 * 1-2:  No buffs
 * 3-5:  +10 HP / +10 ATK / +10 DEF
 * 6-9:  +20 HP / +20 ATK / +20 DEF
 * 10:   +30 HP / +30 ATK / +30 DEF
 */

export interface MomentumBuff {
  hp: number;
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
    return { hp: 30, atk: 30, def: 30 };
  } else if (momentum >= 6) {
    return { hp: 20, atk: 20, def: 20 };
  } else if (momentum >= 3) {
    return { hp: 10, atk: 10, def: 10 };
  } else {
    return { hp: 0, atk: 0, def: 0 };
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
  momentum: number
): { atk: number; def: number; currentHp: number; maxHp: number } {
  const buff = getMomentumGlobalBuff(momentum);

  // ATK: Base + Momentum Buff (minimum 0)
  const effectiveAtk = Math.max(0, baseAtk + buff.atk);

  // DEF: Base + Momentum Buff (minimum 0)
  const effectiveDef = Math.max(0, baseDef + buff.def);

  // Max HP: Base + Momentum Buff (no minimum - hp is always positive)
  const effectiveMaxHp = maxHp + buff.hp;

  // Current HP: Clamp to effective max HP, but NEVER below 10 due to Momentum Pressure
  // If momentum drops and max HP decreases, current HP must not kill the creature
  let effectiveCurrentHp = currentHp;

  // If creature's current HP exceeds new max (momentum dropped), clamp it
  if (effectiveCurrentHp > effectiveMaxHp) {
    effectiveCurrentHp = effectiveMaxHp;
  }

  // CRITICAL RULE: Momentum Pressure alone cannot reduce HP below 10
  // This prevents momentum loss from destroying creatures
  if (effectiveCurrentHp < 10) {
    effectiveCurrentHp = 10;
  }

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
  playerMomentum: number
): { atk: number; def: number; currentHp: number; maxHp: number } {
  return applyMomentumPressure(
    creature.atk,
    creature.def,
    creature.currentHp,
    creature.hp,
    playerMomentum
  );
}
