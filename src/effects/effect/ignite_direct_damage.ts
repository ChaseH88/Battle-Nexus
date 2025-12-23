import { EffectContext } from "@effects/handler";

/**
 * Effect Handler for Ignite Direct Damage
 * Deals direct damage to opponent
 * (Currently just logs since player HP is not implemented)
 */
export const ignite_direct_damage = (ctx: EffectContext) => {
  // Since we don't have player HP, we could implement this differently
  // For now, just log it
  ctx.utils.log(`  ${ctx.sourceCard.name} deals 2 direct damage to opponent`);
};
