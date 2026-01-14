import { EffectContext } from "@effects/handler";
import { GameState } from "@battle/GameState";
import { EffectMetadata } from "@effects/metadata";
import { Affinity } from "@cards";

/**
 * Void Wisp Boost Effect
 * Boosts a Fire creature with +20 ATK (one-time activation)
 *
 * Handler function with metadata as static properties
 */
export const void_wisp_boost = (ctx: EffectContext) => {
  // Require explicit player choice via eventData.targetLane or eventData.lane
  let target: any | null = null;

  const chosenLane = ctx.eventData?.targetLane ?? ctx.eventData?.lane;
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
  } else {
    // No target selected - this shouldn't happen if UI properly requires targeting
    ctx.utils.log("  No target selected - effect fails");
    return;
  }

  // Apply persistent ATK boost
  ctx.utils.modifyCreatureStats(target, 20, undefined);
  ctx.utils.log(
    `  ${(target as any).name} gained +20 ATK from ${ctx.sourceCard.name}`
  );

  // Track as an active persistent effect (permanent boost, not tied to source card staying on field)
  ctx.utils.addActiveEffect(
    `void_wisp_boost_${ctx.sourceCard.id}`,
    "Void Boost",
    ctx.sourceCard,
    ctx.ownerIndex,
    undefined, // permanent
    "+20 ATK",
    [(target as any).id],
    { atk: 20 }
  );
};

// Attach metadata as static properties on the function
void_wisp_boost.metadata = {
  id: "void_wisp_boost",
  name: "Void Boost",
  description: "+20 ATK to target Fire creature (one-time activation)",

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
