import { EffectContext } from "@effects/handler";
import { CardType } from "@cards";
import { Zone } from "@battle/zones";
import { moveCard } from "@battle/ZoneEngine";

/**
 * Mirror Force Effect
 * When an opponent's creature attacks, destroy all of the opponent's attack position creatures
 * This is a trap card that activates during the opponent's attack
 */
export const mirror_force = (ctx: EffectContext) => {
  const opponentIndex = ctx.ownerIndex === 0 ? 1 : 0;
  const opponent = ctx.state.players[opponentIndex];

  let destroyedCount = 0;

  // Destroy all opponent's creatures in attack mode
  opponent.lanes.forEach((creature, lane) => {
    if (creature && creature.type === CardType.Creature) {
      const creatureCard = creature as any;
      if (creatureCard.mode === "ATTACK") {
        ctx.utils.log(`  ${creatureCard.name} was destroyed by Mirror Force!`);

        // Move creature to discard pile
        moveCard(
          ctx.state,
          opponentIndex,
          Zone.Lane0,
          Zone.DiscardPile,
          creature.id,
          { fromLane: lane }
        );

        destroyedCount++;
      }
    }
  });

  if (destroyedCount === 0) {
    ctx.utils.log(
      "  Mirror Force activated but no attack position creatures to destroy"
    );
  } else {
    ctx.utils.log(
      `  Mirror Force destroyed ${destroyedCount} creature${
        destroyedCount > 1 ? "s" : ""
      }!`
    );
  }
};
