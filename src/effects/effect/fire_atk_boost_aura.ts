import { EffectContext } from "@effects/handler";

/**
 * Effect Handler for Fire ATK Boost Aura
 * Gives +10 ATK to all Fire creatures while support remains active
 */
export const fire_atk_boost_aura = (ctx: EffectContext) => {
  const allies = ctx.utils.getAllyCreatures(ctx.ownerIndex);
  const fireCreatures = ctx.utils.filterByAffinity(allies, "FIRE");

  fireCreatures.forEach((creature) => {
    ctx.utils.modifyCreatureStats(creature, 10, undefined);
  });

  // Add as persistent effect with tracking
  ctx.utils.addActiveEffect(
    `fire_atk_boost_aura_${ctx.sourceCard.id}`,
    "Flame Surge",
    ctx.sourceCard,
    ctx.ownerIndex,
    undefined, // permanent while support is active
    "+10 ATK to Fire creatures",
    fireCreatures.map((c) => c.id),
    { atk: 10 }
  );
};
