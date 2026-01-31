import { EffectContext } from "@effects/handler";

/**
 * Effect Handler for Draw on Play
 * Draws cards when the card is played
 */
export const draw_on_play = (ctx: EffectContext, amount: number = 1) => {
  ctx.utils.drawCards(ctx.ownerIndex, amount);
};
