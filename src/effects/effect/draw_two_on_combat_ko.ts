import { EffectContext } from "../handler";

/**
 * Effect Handler for Heal on Combat KO
 * Repurposed as card draw since player HP is not implemented
 * Triggers when a creature is destroyed in combat
 */
export const draw_two_on_combat_ko = (ctx: EffectContext) => {
  ctx.utils.drawCards(ctx.ownerIndex, 1);
  ctx.utils.log(`  ${ctx.sourceCard.name} triggers: draw 1 card`);
};
