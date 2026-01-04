import { EffectContext } from "@effects/handler";

/**
 * Effect Handler for Flame Aura Global
 * Gives +100 ATK to all Fire creatures permanently (global effect)
 * This effect persists even after the source action card is sent to the discard pile
 */
export const flame_aura_global = (ctx: EffectContext) => {
  const allies = ctx.utils.getAllyCreatures(ctx.ownerIndex);
  const fireCreatures = ctx.utils.filterByAffinity(allies, "FIRE");

  fireCreatures.forEach((creature) => {
    ctx.utils.modifyCreatureStats(creature, 100, undefined);
  });

  // Add as permanent global effect with tracking
  // Use a unique ID based on player and timestamp to allow stacking
  const effectId = `flame_aura_global_p${ctx.ownerIndex}_${Date.now()}`;
  ctx.utils.addActiveEffect(
    effectId,
    "Flame Aura",
    ctx.sourceCard,
    ctx.ownerIndex,
    undefined, // permanent
    "+100 ATK to all Fire creatures",
    fireCreatures.map((c) => c.id),
    { atk: 100 },
    true // mark as global effect
  );

  ctx.utils.log(
    `${ctx.sourceCard.name}: All Fire creatures gain +100 ATK permanently!`
  );
};
