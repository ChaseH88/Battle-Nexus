import { EffectContext } from "../handler";
import { Zone } from "../../battle/zones";
import { moveCard } from "../../battle/ZoneEngine";
import { EffectMetadata } from "../metadata";
import { GameState } from "../../battle/GameState";

/**
 * Call Home - Return one of your creatures to your hand
 *
 * Effect: Returns a targeted ally creature from the field back to the owner's hand
 * Trigger: ON_PLAY (manual activation)
 * Target: ALLY_CREATURE
 */
export const callHomeHandler = (ctx: EffectContext) => {
  const { state, ownerIndex, eventData, engine } = ctx;
  const player = state.players[ownerIndex];

  // Validate target lane is provided
  if (eventData?.targetLane === undefined) {
    engine?.log("Call Home: No target specified");
    return;
  }

  const targetLane = eventData.targetLane;
  const targetCreature = player.lanes[targetLane];

  // Validate target exists
  if (!targetCreature) {
    engine?.log(`Call Home: No creature in lane ${targetLane} to return`);
    return;
  }

  // Restore creature to full health (benefit of Call Home)
  if (targetCreature.type === "CREATURE") {
    targetCreature.currentHp = targetCreature.hp;
  }

  // Move creature from lane to hand
  moveCard(state, ownerIndex, Zone.Lane0, Zone.Hand, targetCreature.id, {
    fromLane: targetLane,
  });

  engine?.log(
    `${player.id} used Call Home to return ${targetCreature.name} to their hand (restored to full HP)`,
  );

  // Remove any support cards that were targeting this creature
  if (engine) {
    engine.checkAndRemoveTargetedSupports(
      ownerIndex,
      targetLane,
      targetCreature.instanceId,
    );
  }
};

// Attach metadata for UI targeting
callHomeHandler.metadata = {
  id: "call_home",
  name: "Call Home",
  description:
    "Return one of your creatures to your hand and restore it to full health",

  canActivate: (state: GameState, ownerIndex: 0 | 1) => {
    const player = state.players[ownerIndex];
    const allyCreatures = player.lanes.filter((c) => c !== null);

    return {
      canActivate: allyCreatures.length > 0,
      reason:
        allyCreatures.length > 0
          ? undefined
          : "You have no creatures on the field to return",
    };
  },

  targeting: {
    required: true,
    targetType: "ALLY_CREATURE" as const,
    description: "Select a creature to return to your hand",
    allowMultiple: false,
  },

  getValidTargets: (state: GameState, ownerIndex: 0 | 1) => {
    const player = state.players[ownerIndex];

    return player.lanes
      .map((creature, lane) => ({
        creature,
        lane,
      }))
      .filter((item) => item.creature !== null)
      .map(({ creature, lane }) => ({
        label: `${creature!.name} (Lane ${lane + 1})${
          creature!.isFaceDown ? " [Face-Down]" : ""
        }${creature!.hasAttackedThisTurn ? " [Attacked]" : ""}`,
        value: lane,
        metadata: { lane, creature },
      }));
  },
} as EffectMetadata;
