import { EffectHandler } from "../handler";

// Fusion Drive: when played, gain 2 momentum
export const fusion_drive: EffectHandler = (context) => {
  const { ownerIndex, state, utils } = context;
  const cardCost = context.sourceCard.cost;
  const totalMomentumGain = 2 + cardCost;
  // Add 2 momentum to owner
  state.players[ownerIndex].momentum += totalMomentumGain;
  utils.log(
    `Fusion Drive resolved: Player ${ownerIndex + 1} gains 2 momentum.`
  );
};
