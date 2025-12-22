import { EffectContext } from "../handler";
import { Zone } from "../../battle/zones";

/**
 * Effect Handler for Purge Beacon
 * - Removes one card from an opponent's support slot.
 * - Prefers explicit target via eventData.targetPlayer and eventData.targetLane (support slot index).
 * - If no explicit target provided, removes the first occupied support slot.
 */
export const purge_opponent_support = (ctx: EffectContext) => {
  // Determine target player (opponent) - allow explicit override
  let targetPlayer: 0 | 1 = ctx.ownerIndex === 0 ? 1 : 0;
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
