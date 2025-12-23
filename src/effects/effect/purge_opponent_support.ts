import { EffectContext } from "@effects/handler";
import { GameState, getOpponentIndex } from "@battle/GameState";
import { EffectMetadata } from "@effects/metadata";

/**
 * Purge Beacon Effect
 * Removes one card from opponent's support zone
 *
 * Handler function with metadata as static properties
 */
export const purge_opponent_support = (ctx: EffectContext) => {
  // Determine target player (opponent) - allow explicit override
  let targetPlayer: 0 | 1 = getOpponentIndex(ctx.ownerIndex);
  if (typeof ctx.eventData?.targetPlayer === "number") {
    targetPlayer = ctx.eventData!.targetPlayer as 0 | 1;
  }

  const opponent = ctx.state.players[targetPlayer];

  // Find a chosen support slot if provided
  const chosenSlot =
    typeof ctx.eventData?.targetLane === "number"
      ? ctx.eventData!.targetLane
      : -1;

  let slotToRemove: number | null = null;

  if (chosenSlot >= 0) {
    if (opponent.support[chosenSlot]) slotToRemove = chosenSlot;
    else {
      ctx.utils.log(`  No support at chosen slot ${chosenSlot} to remove`);
      return;
    }
  } else {
    // Auto-pick the first occupied support slot
    for (let i = 0; i < opponent.support.length; i++) {
      if (opponent.support[i]) {
        slotToRemove = i;
        break;
      }
    }
    if (slotToRemove === null) {
      ctx.utils.log("  No opponent support cards to remove");
      return;
    }
  }

  const card = opponent.support[slotToRemove];
  if (!card) return;

  // Move to discard pile
  opponent.support[slotToRemove] = null;
  opponent.discardPile.push(card);
  ctx.utils.log(
    `  ${card.name} was removed from opponent's support slot ${slotToRemove}`
  );
};

// Attach metadata as static properties on the function
purge_opponent_support.metadata = {
  id: "purge_opponent_support",
  name: "Purge Beacon",
  description: "Remove one card from opponent's support zone",

  canActivate: (state: GameState, ownerIndex: 0 | 1) => {
    const opponentIndex = getOpponentIndex(ownerIndex);
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
    targetType: "OPPONENT_SUPPORT" as const,
    description: "Select opponent support card to remove",
    allowMultiple: false,
  },

  getValidTargets: (state: GameState, ownerIndex: 0 | 1) => {
    const opponentIndex = getOpponentIndex(ownerIndex);
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
} as EffectMetadata;
