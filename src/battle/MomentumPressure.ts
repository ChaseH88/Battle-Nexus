/**
 * Momentum Pressure System
 *
 * A global game rule that dynamically buffs all creatures based on their owner's Momentum.
 * This system now works through ActiveEffects that are updated each turn.
 *
 * Momentum Scale:
 * 1-2:  No buffs
 * 3-5:  +10 ATK / +10 DEF
 * 6-9:  +20 ATK / +20 DEF
 * 10:   +30 ATK / +30 DEF
 */

import { ActiveEffect } from "./GameState";

export interface MomentumBuff {
  atk: number;
  def: number;
}

/**
 * Calculate the global buff provided by a player's current Momentum value.
 * This buff applies to ALL creatures controlled by that player.
 *
 * @param momentum - Current momentum value (1-10)
 * @returns Buff amounts for ATK and DEF
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
 * Create or update Momentum active effect for a player.
 * This should be called whenever momentum changes.
 *
 * @param playerIndex - The player whose momentum effect to create/update
 * @param momentum - The player's current momentum value
 * @returns ActiveEffect representing the momentum buff
 */
export function createMomentumPressureEffect(
  playerIndex: 0 | 1,
  momentum: number,
): ActiveEffect {
  const buff = getMomentumGlobalBuff(momentum);
  const scope = playerIndex === 0 ? "player1" : "player2";

  return {
    id: `momentum-pressure-${playerIndex}`,
    name: `${momentum === 10 ? "Max" : ""} Momentum${momentum === 10 ? "!" : ""}`,
    sourceCardId: "system",
    sourceCardName: "",
    playerIndex,
    scope,
    description: `+${buff.atk} ATK, +${buff.def} DEF from ${momentum} Momentum`,
    statModifiers: buff,
    isGlobal: true,
    isMomentumEffect: true,
  };
}

/**
 * Apply Momentum Pressure buffs to a creature's effective stats.
 * This is a READ-ONLY operation - it returns buffed values without modifying the creature.
 *
 * DEPRECATED: Use getEffectiveStatsFromActiveEffects instead.
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
 * DEPRECATED: Use getEffectiveStatsFromActiveEffects instead.
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

/**
 * Calculate effective stats from active effects.
 * This is the new preferred method that reads from the activeEffects array.
 *
 * @param creature - The creature card
 * @param activeEffects - Array of active effects from game state
 * @param playerIndex - The player who owns this creature
 * @returns Object with effective stats
 */
export function getEffectiveStatsFromActiveEffects(
  creature: {
    atk: number;
    def: number;
    currentHp: number;
    hp: number;
    id: string;
    instanceId: string;
  },
  activeEffects: ActiveEffect[],
  playerIndex: 0 | 1,
): { atk: number; def: number; currentHp: number; maxHp: number } {
  let atk = creature.atk;
  let def = creature.def;

  // Apply all relevant active effects
  const scope = playerIndex === 0 ? "player1" : "player2";

  console.log("getEffectiveStatsFromActiveEffects called:", {
    creatureId: creature.id,
    baseAtk: creature.atk,
    baseDef: creature.def,
    playerIndex,
    scope,
    totalActiveEffects: activeEffects.length,
    activeEffects: activeEffects.map((e) => ({
      id: e.id,
      name: e.name,
      scope: e.scope,
      affectedCardIds: e.affectedCardIds,
      statModifiers: e.statModifiers,
      isMomentumEffect: e.isMomentumEffect,
    })),
  });

  activeEffects.forEach((effect) => {
    // Apply if effect is global OR matches this player's scope OR specifically targets this card
    const appliesToThisPlayer =
      effect.scope === "global" || effect.scope === scope;
    const appliesToThisCard = effect.affectedCardIds?.includes(
      creature.instanceId,
    );

    console.log("Effect evaluation:", {
      effectName: effect.name,
      effectScope: effect.scope,
      targetScope: scope,
      appliesToThisPlayer,
      appliesToThisCard,
      affectedCardIds: effect.affectedCardIds,
      creatureId: creature.id,
      willApply: appliesToThisPlayer || appliesToThisCard,
    });

    if (appliesToThisPlayer || appliesToThisCard) {
      if (effect.statModifiers) {
        console.log("Applying effect:", {
          effectName: effect.name,
          effectScope: effect.scope,
          isMomentum: effect.isMomentumEffect,
          atkMod: effect.statModifiers.atk,
          defMod: effect.statModifiers.def,
        });
        if (effect.statModifiers.atk !== undefined) {
          atk += effect.statModifiers.atk;
        }
        if (effect.statModifiers.def !== undefined) {
          def += effect.statModifiers.def;
        }
      }
    }
  });

  const result = {
    atk: Math.max(0, atk),
    def: Math.max(0, def),
    currentHp: creature.currentHp,
    maxHp: creature.hp,
  };

  console.log("Final effective stats:", result);

  return result;
}
