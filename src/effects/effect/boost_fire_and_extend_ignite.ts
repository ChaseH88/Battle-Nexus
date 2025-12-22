import { EffectContext } from "../handler";

/**
 * Effect: Boost a Fire creature and extend Ignite combo
 * - Player can choose a target lane (UI integration). If no lane provided,
 *   auto-targets the allied Fire creature with highest ATK.
 * - Grants +200 ATK and adds the IGNITE keyword while the source card
 *   remains on the field (persistent).
 * - If no valid Fire creatures exist, the effect fails (card will be discarded by engine)
 */
export const boost_fire_and_extend_ignite = (ctx: EffectContext) => {
  // Prefer explicit player choice if provided via eventData.lane
  let target: any | null = null;

  const chosenLane = ctx.eventData?.lane;
  if (typeof chosenLane === "number") {
    target = ctx.utils.getCreatureInLane(ctx.ownerIndex, chosenLane) as any;
    if (!target) {
      ctx.utils.log(
        `  No creature in chosen lane ${chosenLane} - effect fails`
      );
      return;
    }
    // Verify it's a Fire creature
    if (target.affinity !== "FIRE") {
      ctx.utils.log(
        `  Creature in lane ${chosenLane} is not Fire type - effect fails`
      );
      return;
    }
  }

  // If no explicit choice, auto-target highest-ATK allied Fire creature
  if (!target) {
    const allies = ctx.utils.getAllyCreatures(ctx.ownerIndex);
    const fireCreatures = ctx.utils.filterByAffinity(allies, "FIRE");

    if (fireCreatures.length === 0) {
      ctx.utils.log("  No Fire creatures to target - effect fails");
      return;
    }

    target = fireCreatures.reduce((best, c) =>
      (c as any).atk > (best as any).atk ? c : best
    );
  }

  // Apply persistent ATK boost
  ctx.utils.modifyCreatureStats(target, 200, undefined);

  // Grant IGNITE keyword if not already present
  if (!(target as any).keywords.includes("IGNITE")) {
    (target as any).keywords.push("IGNITE");
    ctx.utils.log(`  ${(target as any).name} gained IGNITE`);
  }

  // Track as an active persistent effect while the source card remains
  ctx.utils.addActiveEffect(
    `boost_fire_and_extend_ignite_${ctx.sourceCard.id}`,
    "Ignite Burst",
    ctx.sourceCard,
    ctx.ownerIndex,
    undefined, // permanent while source is on field
    "+200 ATK and IGNITE (while on field)",
    [(target as any).id],
    { atk: 200 }
  );
};
