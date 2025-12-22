import { EffectContext } from "../handler";

/**
 * Effect Handler for Draw on Play
 * Draws cards when the card is played
 */
export const draw_on_play = (ctx: EffectContext) => {
  ctx.utils.drawCards(ctx.ownerIndex, 1);
};
