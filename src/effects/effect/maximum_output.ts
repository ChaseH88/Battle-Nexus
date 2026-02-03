import { EffectContext } from "@effects/handler";
import { GameState } from "@battle/GameState";
import { EffectMetadata } from "@effects/metadata";

/**
 * Maximum Output Effect
 * Consume all momentum. Target creature gains +10 ATK for each momentum consumed.
 *
 * Handler function with metadata as static properties
 */
export const maximum_output = (ctx: EffectContext) => {
  // Require explicit player choice via eventData.targetLane or eventData.lane
  let target: any | null = null;

  const chosenLane = ctx.eventData?.targetLane ?? ctx.eventData?.lane;
  if (typeof chosenLane === "number") {
    target = ctx.utils.getCreatureInLane(ctx.ownerIndex, chosenLane) as any;
    if (!target) {
      ctx.utils.log(
        `  No creature in chosen lane ${chosenLane} - effect fails`,
      );
      return;
    }
  } else {
    // No target selected - this shouldn't happen if UI properly requires targeting
    ctx.utils.log("  No target selected - effect fails");
    return;
  }

  // Get current momentum
  const currentMomentum = ctx.state.players[ctx.ownerIndex].momentum;

  if (currentMomentum <= 0) {
    ctx.utils.log("  No momentum to consume - effect fails");
    return;
  }

  // Calculate ATK boost
  const atkBoost = currentMomentum * 10;

  // Apply permanent ATK boost
  ctx.utils.modifyCreatureStats(target, atkBoost, undefined);

  // Consume all momentum
  ctx.state.players[ctx.ownerIndex].momentum = 0;
  // Sync momentum pressure effect to reflect the momentum change
  ctx.engine.syncMomentumEffects(ctx.ownerIndex);

  ctx.utils.log(
    `  ${(target as any).name} gained +${atkBoost} ATK from ${ctx.sourceCard.name} (consumed ${currentMomentum} momentum)`,
  );

  // Track as an active persistent effect (permanent boost)
  ctx.utils.addActiveEffect(
    `maximum_output_${ctx.sourceCard.instanceId || ctx.sourceCard.id}`,
    "Maximum Output",
    ctx.sourceCard,
    ctx.ownerIndex,
    undefined, // permanent
    `+${atkBoost} ATK`,
    [(target as any).instanceId],
    { atk: atkBoost },
  );
};

// Attach metadata as static properties on the function
maximum_output.metadata = {
  id: "maximum_output",
  name: "Maximum Output",
  description:
    "Consume all momentum. Target creature gains +10 ATK for each momentum consumed.",

  canActivate: (state: GameState, ownerIndex: 0 | 1) => {
    const player = state.players[ownerIndex];
    const allyCreatures = player.lanes.filter((c) => c !== null);
    const hasMomentum = player.momentum > 0;

    return {
      canActivate: allyCreatures.length > 0 && hasMomentum,
      reason: !hasMomentum
        ? "You have no momentum to consume"
        : allyCreatures.length === 0
          ? "You have no creatures on the field to target"
          : undefined,
    };
  },

  targeting: {
    required: true,
    targetType: "ALLY_CREATURE" as const,
    description: "Select creature to boost",
    allowMultiple: false,
  },

  getValidTargets: (state: GameState, ownerIndex: 0 | 1) => {
    const player = state.players[ownerIndex];
    const momentum = player.momentum;

    return player.lanes
      .map((creature, lane) => ({
        creature,
        lane,
      }))
      .filter((item) => item.creature !== null)
      .map(({ creature, lane }) => ({
        label: `${creature!.name} (Lane ${lane + 1}) - ${creature!.atk} ATK (Will gain +${momentum * 10} ATK)`,
        value: lane,
        metadata: { lane, creature },
      }));
  },
} satisfies EffectMetadata;
