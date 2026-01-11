import { EffectContext } from "@effects/handler";

/**
 * Effect Handler for Battle Rage
 * Draws cards when the creature attacks
 */
export const battle_rage = (ctx: EffectContext) => {
  ctx.utils.drawCards(ctx.ownerIndex, 1);
};
