import { EffectHandler } from "../handler";
import { GameState } from "../../battle/GameState";
import { Targeting } from "@effects/Targeting";

// Minor Reinforcement: Target creature gains +20 HP
export const minor_reinforcement: EffectHandler = (context) => {
  const { state, utils, targetCard, eventData } = context;

  // Check if targetLane is provided from eventData (UI selection)
  let targetCreature = targetCard;

  if (!targetCreature && eventData?.targetLane !== undefined) {
    // Get creature from the specified lane
    const ownerIndex = context.ownerIndex;
    const creature = state.players[ownerIndex].lanes[eventData.targetLane];
    if (creature) {
      targetCreature = creature;
    }
  }

  // If no target was selected, do nothing
  if (!targetCreature) {
    utils.log("Minor Reinforcement: No target selected.");
    return;
  }

  // Find the creature on the field (verify it's still there)
  const foundCreature = utils.findCreatureById(targetCreature.id);

  if (!foundCreature) {
    utils.log(
      `Minor Reinforcement: Target creature ${targetCreature.name} not found on field.`,
    );
    return;
  }

  // Add 20 HP to the creature's current HP
  foundCreature.currentHp += 20;

  utils.log(
    `Minor Reinforcement resolved: ${targetCreature.name} gains 20 HP (now ${foundCreature.currentHp} HP).`,
  );
};

// Attach metadata for UI targeting
minor_reinforcement.metadata = {
  id: "minor_reinforcement",
  name: "Minor Reinforcement",
  description: "Target creature gains +20 HP",

  canActivate: (state: GameState, ownerIndex: 0 | 1) => {
    const player = state.players[ownerIndex];
    const allyCreatures = player.lanes.filter((c) => c !== null);

    return {
      canActivate: allyCreatures.length > 0,
      reason:
        allyCreatures.length > 0
          ? undefined
          : "You have no creatures on the field to target",
    };
  },

  targeting: Targeting.allyCreatures()
    .formatWithStats("hp")
    .buildWithExecutor("Select creature to reinforce"),
};
