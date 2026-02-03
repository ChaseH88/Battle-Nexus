/**
 * Momentum System
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
export function createMomentumBuffEffect(
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
    baseAtk?: number;
    baseDef?: number;
    currentHp: number;
    hp: number;
    id: string;
    instanceId: string;
  },
  activeEffects: ActiveEffect[],
  playerIndex: 0 | 1,
): { atk: number; def: number; currentHp: number; maxHp: number } {
  // Start from base stats if available, otherwise use current stats
  // This prevents double-counting when effects modify creature.atk directly
  let atk = creature.baseAtk ?? creature.atk;
  let def = creature.baseDef ?? creature.def;

  // Apply all relevant active effects
  const scope = playerIndex === 0 ? "player1" : "player2";

  activeEffects.forEach((effect) => {
    // If effect has specific affected cards, ONLY apply to those cards
    if (effect.affectedCardIds && effect.affectedCardIds.length > 0) {
      // Targeted effect - only apply if this creature's instanceId is in the list
      if (effect.affectedCardIds.includes(creature.instanceId)) {
        if (effect.statModifiers) {
          if (effect.statModifiers.atk !== undefined) {
            atk += effect.statModifiers.atk;
          }
          if (effect.statModifiers.def !== undefined) {
            def += effect.statModifiers.def;
          }
        }
      }
    } else {
      // Global/area effect - apply if scope matches this player
      const appliesToThisPlayer =
        effect.scope === "global" || effect.scope === scope;

      if (appliesToThisPlayer) {
        if (effect.statModifiers) {
          if (effect.statModifiers.atk !== undefined) {
            atk += effect.statModifiers.atk;
          }
          if (effect.statModifiers.def !== undefined) {
            def += effect.statModifiers.def;
          }
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

  return result;
}
