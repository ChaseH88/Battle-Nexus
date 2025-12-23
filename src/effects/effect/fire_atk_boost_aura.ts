import { EffectContext } from "@effects/handler";

/**
 * Effect Handler for Fire ATK Boost Aura
 * Gives +100 ATK to all Fire creatures
 */
export const fire_atk_boost_aura = (ctx: EffectContext) => {
  const allies = ctx.utils.getAllyCreatures(ctx.ownerIndex);
  const fireCreatures = ctx.utils.filterByAffinity(allies, "FIRE");

  fireCreatures.forEach((creature) => {
    ctx.utils.modifyCreatureStats(creature, 100, undefined);
  });

  // Add as persistent effect with tracking
  ctx.utils.addActiveEffect(
    `fire_atk_boost_aura_${ctx.sourceCard.id}`,
    "Flame Surge",
    ctx.sourceCard,
    ctx.ownerIndex,
    undefined, // permanent
    "+100 ATK to Fire creatures",
    fireCreatures.map((c) => c.id),
    { atk: 100 }
  );
};
