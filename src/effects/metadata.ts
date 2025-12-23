import { GameState } from "../battle/GameState";
import { ActivationRequirement, TargetingConfig } from "./types";

/**
 * Centralized Effect Metadata
 * All effect-specific logic (requirements, targeting, validation) in one place
 * Both BattleEngine and UI components query this instead of hardcoding
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
 * Add new effects here with their requirements and targeting logic
 */
export const effectMetadata: Record<string, EffectMetadata> = {
  // Purge Beacon - Removes opponent support card
  purge_opponent_support: {
    id: "purge_opponent_support",
    name: "Purge Beacon",
    description: "Remove one card from opponent's support zone",

    canActivate: (state, ownerIndex) => {
      const opponentIndex = ownerIndex === 0 ? 1 : 0;
      const opponent = state.players[opponentIndex];
      const hasSupport = opponent.support.some((s) => s !== null);

      return {
        canActivate: hasSupport,
        reason: hasSupport
          ? undefined
          : "Opponent has no support cards to remove",
      };
    },

    targeting: {
      required: true,
      targetType: "OPPONENT_SUPPORT",
      description: "Select opponent support card to remove",
      allowMultiple: false,
    },

    getValidTargets: (state, ownerIndex) => {
      const opponentIndex = ownerIndex === 0 ? 1 : 0;
      const opponent = state.players[opponentIndex];

      return opponent.support
        .map((card, index) => ({
          label: card
            ? card.isFaceDown
              ? `Face-down card in slot ${index + 1}`
              : card.name
            : null,
          value: index,
          metadata: { slot: index, card },
        }))
        .filter((option) => option.label !== null) as Array<{
        label: string;
        value: number;
        metadata: any;
      }>;
    },
  },

  // Ignite Burst - Boost Fire creature
  boost_fire_and_extend_ignite: {
    id: "boost_fire_and_extend_ignite",
    name: "Ignite Burst",
    description: "+200 ATK and IGNITE to target Fire creature",

    canActivate: (state, ownerIndex) => {
      const player = state.players[ownerIndex];
      const fireCreatures = player.lanes.filter(
        (c) => c !== null && c.affinity === "FIRE"
      );

      return {
        canActivate: fireCreatures.length > 0,
        reason:
          fireCreatures.length > 0
            ? undefined
            : "You have no Fire creatures on the field",
      };
    },

    targeting: {
      required: true,
      targetType: "ALLY_FIRE_CREATURE",
      description: "Select Fire creature to boost",
      allowMultiple: false,
      filter: { affinity: "FIRE" },
    },

    getValidTargets: (state, ownerIndex) => {
      const player = state.players[ownerIndex];

      return player.lanes
        .map((creature, lane) => ({
          creature,
          lane,
        }))
        .filter((item) => item.creature && item.creature.affinity === "FIRE")
        .map(({ creature, lane }) => ({
          label: `${creature!.name} (Lane ${lane + 1}) - ${creature!.atk} ATK`,
          value: lane,
          metadata: { lane, creature },
        }));
    },
  },

  // Add more effects here as they're created
  // Each effect's logic is self-contained in this file
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
