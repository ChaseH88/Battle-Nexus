import { EffectContext } from "@effects/handler";
import { GameState } from "@battle/GameState";
import { EffectMetadata } from "@effects/metadata";
import { Affinity } from "@cards";

/**
 * Ignite Burst Effect
 * Boosts a Fire creature with +200 ATK
 *
 * Handler function with metadata as static properties
 */
export const boost_fire_atk = (ctx: EffectContext) => {
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
  ctx.utils.log(`  ${(target as any).name} gained +200 ATK`);

  // Track as an active persistent effect while the source card remains
  ctx.utils.addActiveEffect(
    `boost_fire_atk_${ctx.sourceCard.id}`,
    "Ignite Burst",
    ctx.sourceCard,
    ctx.ownerIndex,
    undefined, // permanent while source is on field
    "+200 ATK (while on field)",
    [(target as any).id],
    { atk: 200 }
  );
};

// Attach metadata as static properties on the function
boost_fire_atk.metadata = {
  id: "boost_fire_atk",
  name: "Ignite Burst",
  description: "+200 ATK and IGNITE to target Fire creature",

  canActivate: (state: GameState, ownerIndex: 0 | 1) => {
    const player = state.players[ownerIndex];
    const fireCreatures = player.lanes.filter(
      (c) => c !== null && c.affinity === Affinity.Fire
    );

    return {
      canActivate: fireCreatures.length > 0,
      reason:
        fireCreatures.length > 0
          ? undefined
          : "You have no Fire creatures on the field",
    };
  },

  targeting: {
    required: true,
    targetType: "ALLY_FIRE_CREATURE" as const,
    description: "Select Fire creature to boost",
    allowMultiple: false,
    filter: { affinity: Affinity.Fire },
  },

  getValidTargets: (state: GameState, ownerIndex: 0 | 1) => {
    const player = state.players[ownerIndex];

    return player.lanes
      .map((creature, lane) => ({
        creature,
        lane,
      }))
      .filter(
        (item) => item.creature && item.creature.affinity === Affinity.Fire
      )
      .map(({ creature, lane }) => ({
        label: `${creature!.name} (Lane ${lane + 1}) - ${creature!.atk} ATK`,
        value: lane,
        metadata: { lane, creature },
      }));
  },
} as EffectMetadata;
