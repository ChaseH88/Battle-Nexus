import { CardType, CreatureCard } from "@cards";
import { EffectContext } from "@effects/handler";

/**
 * Effect Handler for Conditional Fire Bonus
 * Grants bonus ATK if the creature has Fire affinity
 */
export const conditional_fire_bonus = (ctx: EffectContext) => {
  if (ctx.sourceCard.type === CardType.Creature) {
    const creature = ctx.sourceCard as unknown as CreatureCard;
    if (creature.affinity === "FIRE") {
      ctx.utils.modifyCreatureStats(creature, 200, undefined);

      // Add temporary effect for end of turn
      ctx.utils.addActiveEffect(
        `conditional_fire_bonus_${ctx.sourceCard.id}`,
        "Fire Bonus",
        ctx.sourceCard,
        ctx.ownerIndex,
        1, // 1 turn
        "+200 ATK (Fire affinity)"
      );
    }
  }
};
