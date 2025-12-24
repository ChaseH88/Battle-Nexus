import { GameState } from "../battle/GameState";
import { ActivationRequirement, TargetingConfig } from "./types";
import { purge_opponent_support } from "./effect/purge_opponent_support";
import { boost_fire_atk } from "./effect/boost_fire_atk";

/**
 * Centralized Effect Metadata
 * All effect-specific logic (requirements, targeting, validation) in one place
 * Both BattleEngine and UI components query this instead of hardcoding
 *
 * NOTE: Each effect is a handler function with metadata attached as a static property.
 * This file simply collects them in a registry for easy lookup.
 */

export interface EffectMetadata {
  id: string;
  name: string;
  description: string;

  // Activation requirements - checked before card can be activated
  activationRequirements?: ActivationRequirement[];

  // Targeting configuration - defines what UI prompts to show
  targeting?: TargetingConfig;

  // Validation function - returns true if effect can be activated
  canActivate?: (
    state: GameState,
    ownerIndex: 0 | 1
  ) => {
    canActivate: boolean;
    reason?: string;
  };

  // Get valid targets for selection - returns options for UI dropdown
  getValidTargets?: (
    state: GameState,
    ownerIndex: 0 | 1
  ) => Array<{
    label: string;
    value: number;
    metadata?: any;
  }>;
}

/**
 * Effect Metadata Registry
 * Automatically populated from individual effect files
 *
 * To add a new effect:
 * 1. Create your effect handler in /src/effects/effect/your_effect.ts
 * 2. Attach metadata as a static property: handler.metadata = { ... }
 * 3. Import and register it here
 */
export const effectMetadata: Record<string, EffectMetadata> = {
  purge_opponent_support: purge_opponent_support.metadata!,
  boost_fire_atk: boost_fire_atk.metadata!,

  // Add new effects here
};

/**
 * Get metadata for an effect
 */
export function getEffectMetadata(
  effectId: string
): EffectMetadata | undefined {
  return effectMetadata[effectId];
}

/**
 * Check if an effect can be activated
 */
export function canActivateEffect(
  effectId: string,
  state: GameState,
  ownerIndex: 0 | 1
): { canActivate: boolean; reason?: string } {
  const metadata = getEffectMetadata(effectId);

  if (!metadata) {
    return { canActivate: true }; // No metadata = no restrictions
  }

  if (metadata.canActivate) {
    return metadata.canActivate(state, ownerIndex);
  }

  return { canActivate: true };
}

/**
 * Check if an effect requires targeting
 */
export function effectRequiresTargeting(effectId: string): boolean {
  const metadata = getEffectMetadata(effectId);
  return metadata?.targeting?.required ?? false;
}

/**
 * Get valid targets for an effect
 */
export function getEffectTargets(
  effectId: string,
  state: GameState,
  ownerIndex: 0 | 1
): Array<{ label: string; value: number; metadata?: any }> {
  const metadata = getEffectMetadata(effectId);

  if (!metadata || !metadata.getValidTargets) {
    return [];
  }

  return metadata.getValidTargets(state, ownerIndex);
}
