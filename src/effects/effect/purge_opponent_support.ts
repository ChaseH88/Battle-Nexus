import { EffectContext } from "@effects/handler";
import { GameState, getOpponentIndex } from "@battle/GameState";
import { EffectMetadata } from "@effects/metadata";
import { Targeting } from "@effects/Targeting";

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

  // Remove any active effects from this support card before discarding
  const effectsToRemove = ctx.state.activeEffects.filter(
    (e) => e.sourceCardId === card.id,
  );
  effectsToRemove.forEach((e) => {
    ctx.engine.removeActiveEffect(e.id);
  });

  // Move to discard pile
  opponent.support[slotToRemove] = null;
  opponent.discardPile.push(card);
  ctx.utils.log(
    `  ${card.name} was removed from opponent's support slot ${slotToRemove}`,
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

  targeting: Targeting.enemySupports().buildWithExecutor(
    "Select opponent support card to remove",
  ),
} as EffectMetadata;
