import { EffectContext } from "../handler";

/**
 * Effect Handler for Global Fire Buff
 * Burning Field effect - gives +100 ATK to all Fire creatures
 */
export const global_fire_buff = (ctx: EffectContext) => {
  const allies = ctx.utils.getAllyCreatures(ctx.ownerIndex);
  const fireCreatures = ctx.utils.filterByAffinity(allies, "FIRE");

  fireCreatures.forEach((creature) => {
    ctx.utils.modifyCreatureStats(creature, 100, undefined);
  });

  // Add as persistent effect with tracking
  ctx.utils.addActiveEffect(
    `global_fire_buff_${ctx.sourceCard.id}`,
    "Burning Field",
    ctx.sourceCard,
    ctx.ownerIndex,
    undefined, // permanent while card is active
    "+100 ATK to Fire creatures",
    fireCreatures.map((c) => c.id),
    { atk: 100 }
  );
};
