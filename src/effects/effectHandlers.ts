import { GameState } from "../battle/GameState";
import { CardInterface, CardType, CreatureCard } from "../cards";
import { BattleEngine } from "../battle/BattleEngine";

/**
 * Effect Context - provides access to all game state and utility functions
 */
export interface EffectContext {
  // Game state
  state: GameState;
  engine: BattleEngine;

  // Effect source info
  sourceCard: CardInterface;
  ownerIndex: 0 | 1;

  // Event info
  trigger:
    | "ON_PLAY"
    | "ON_ATTACK"
    | "ON_DEFEND"
    | "ON_DESTROY"
    | "ON_DRAW"
    | "CONTINUOUS";
  eventData?: {
    lane?: number;
    targetLane?: number;
    targetPlayer?: 0 | 1;
  };

  // Utility functions
  utils: EffectUtils;
}

export interface EffectUtils {
  // Get creatures
  getAllyCreatures: (playerIndex: 0 | 1) => CreatureCard[];
  getEnemyCreatures: (playerIndex: 0 | 1) => CreatureCard[];
  getAllCreatures: () => CreatureCard[];
  getCreatureInLane: (playerIndex: 0 | 1, lane: number) => CreatureCard | null;

  // Modify stats
  modifyCreatureStats: (
    creature: CreatureCard,
    atk?: number,
    def?: number
  ) => void;
  modifyCreatureHP: (creature: CreatureCard, hpChange: number) => void;

  // Card manipulation
  drawCards: (playerIndex: 0 | 1, count: number) => void;
  discardCards: (playerIndex: 0 | 1, count: number, random?: boolean) => void;

  // Filter creatures
  filterByAffinity: (
    creatures: CreatureCard[],
    affinity: string
  ) => CreatureCard[];
  filterByKeywords: (
    creatures: CreatureCard[],
    keywords: string[]
  ) => CreatureCard[];

  // Logging
  log: (message: string) => void;

  // Active effects
  addActiveEffect: (
    effectId: string,
    name: string,
    sourceCard: CardInterface,
    playerIndex: 0 | 1,
    turns?: number,
    description?: string,
    affectedCardIds?: string[],
    statModifiers?: { atk?: number; def?: number }
  ) => void;
}

/**
 * Create utility functions for effect execution
 */
export function createEffectUtils(
  state: GameState,
  engine: BattleEngine
): EffectUtils {
  return {
    getAllyCreatures: (playerIndex: 0 | 1) => {
      return state.players[playerIndex].lanes.filter(
        (c) => c !== null && c.type === CardType.Creature
      ) as unknown as CreatureCard[];
    },

    getEnemyCreatures: (playerIndex: 0 | 1) => {
      const opponentIndex = playerIndex === 0 ? 1 : 0;
      return state.players[opponentIndex].lanes.filter(
        (c) => c !== null && c.type === CardType.Creature
      ) as unknown as CreatureCard[];
    },

    getAllCreatures: () => {
      const allCreatures: CreatureCard[] = [];
      [0, 1].forEach((playerIndex) => {
        state.players[playerIndex].lanes.forEach((card) => {
          if (card && card.type === CardType.Creature) {
            allCreatures.push(card as unknown as CreatureCard);
          }
        });
      });
      return allCreatures;
    },

    getCreatureInLane: (playerIndex: 0 | 1, lane: number) => {
      const card = state.players[playerIndex].lanes[lane];
      if (card && card.type === CardType.Creature) {
        return card as unknown as CreatureCard;
      }
      return null;
    },

    modifyCreatureStats: (
      creature: CreatureCard,
      atk?: number,
      def?: number
    ) => {
      const c = creature as any;
      if (atk !== undefined) {
        const oldAtk = c.atk;
        c.atk += atk;
        state.log.push(`  ${c.name}: ATK ${oldAtk} → ${c.atk}`);
      }
      if (def !== undefined) {
        const oldDef = c.def;
        c.def += def;
        state.log.push(`  ${c.name}: DEF ${oldDef} → ${c.def}`);
      }
    },

    modifyCreatureHP: (creature: CreatureCard, hpChange: number) => {
      const c = creature as any;
      const oldHP = c.currentHp;
      c.currentHp += hpChange;
      c.currentHp = Math.max(0, Math.min(c.currentHp, c.hp));
      state.log.push(`  ${c.name}: HP ${oldHP} → ${c.currentHp}`);
    },

    drawCards: (playerIndex: 0 | 1, count: number) => {
      const player = state.players[playerIndex];
      for (let i = 0; i < count; i++) {
        if (player.deck.length > 0) {
          const card = player.deck.shift()!;
          player.hand.push(card);
          state.log.push(`  ${player.id} drew ${card.name}`);
        }
      }
    },

    discardCards: (playerIndex: 0 | 1, count: number, random = true) => {
      const player = state.players[playerIndex];
      const actualCount = Math.min(count, player.hand.length);

      for (let i = 0; i < actualCount; i++) {
        const index = random
          ? Math.floor(Math.random() * player.hand.length)
          : 0;
        const card = player.hand.splice(index, 1)[0];
        player.discardPile.push(card);
        state.log.push(`  ${player.id} discarded ${card.name}`);
      }
    },

    filterByAffinity: (creatures: CreatureCard[], affinity: string) => {
      return creatures.filter((c) => c.affinity === affinity);
    },

    filterByKeywords: (creatures: CreatureCard[], keywords: string[]) => {
      return creatures.filter((c) =>
        keywords.every((kw) => c.keywords.includes(kw as any))
      );
    },

    log: (message: string) => {
      state.log.push(message);
    },

    addActiveEffect: (
      effectId: string,
      name: string,
      sourceCard: CardInterface,
      playerIndex: 0 | 1,
      turns?: number,
      description?: string,
      affectedCardIds?: string[],
      statModifiers?: { atk?: number; def?: number }
    ) => {
      engine.addActiveEffect(
        effectId,
        name,
        sourceCard,
        playerIndex,
        turns,
        description,
        affectedCardIds,
        statModifiers
      );
    },
  };
}

/**
 * Effect Handler - custom callback function for each effect
 */
export type EffectHandler = (context: EffectContext) => void;

/**
 * Registry of custom effect handlers
 * Each effect ID can have a custom handler function that executes custom logic
 */
export const effectHandlers: Record<string, EffectHandler> = {
  // Fire ATK boost aura - gives +100 ATK to all Fire creatures
  fire_atk_boost_aura: (ctx) => {
    const allies = ctx.utils.getAllyCreatures(ctx.ownerIndex);
    const fireCreatures = ctx.utils.filterByAffinity(allies, "FIRE");

    fireCreatures.forEach((creature) => {
      ctx.utils.modifyCreatureStats(creature, 100, undefined);
    });

    // Add as persistent effect with tracking
    ctx.utils.addActiveEffect(
      `fire_atk_boost_aura_${ctx.sourceCard.id}`,
      "Flame Surge",
      ctx.sourceCard,
      ctx.ownerIndex,
      undefined, // permanent
      "+100 ATK to Fire creatures",
      fireCreatures.map((c) => c.id),
      { atk: 100 }
    );
  },

  // Global fire buff - Burning Field effect
  global_fire_buff: (ctx) => {
    const allies = ctx.utils.getAllyCreatures(ctx.ownerIndex);
    const fireCreatures = ctx.utils.filterByAffinity(allies, "FIRE");

    fireCreatures.forEach((creature) => {
      ctx.utils.modifyCreatureStats(creature, 100, undefined);
    });

    // Add as persistent effect with tracking
    ctx.utils.addActiveEffect(
      `global_fire_buff_${ctx.sourceCard.id}`,
      "Burning Field",
      ctx.sourceCard,
      ctx.ownerIndex,
      undefined, // permanent while card is active
      "+100 ATK to Fire creatures",
      fireCreatures.map((c) => c.id),
      { atk: 100 }
    );
  },

  // Draw cards effect
  draw_on_play: (ctx) => {
    ctx.utils.drawCards(ctx.ownerIndex, 1);
  },

  // Direct damage to opponent
  ignite_direct_damage: (ctx) => {
    // Since we don't have player HP, we could implement this differently
    // For now, just log it
    ctx.utils.log(`  ${ctx.sourceCard.name} deals 2 direct damage to opponent`);
  },

  // Conditional fire bonus
  conditional_fire_bonus: (ctx) => {
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
  },

  // Heal on combat KO - but repurposed as card draw since no player HP
  heal_on_combat_ko: (ctx) => {
    ctx.utils.drawCards(ctx.ownerIndex, 1);
    ctx.utils.log(`  ${ctx.sourceCard.name} triggers: draw 1 card`);
  },
};

/**
 * Execute an effect by ID with the given context
 */
export function executeEffect(
  effectId: string,
  context: EffectContext
): boolean {
  const handler = effectHandlers[effectId];

  if (!handler) {
    context.utils.log(`Effect handler not found: ${effectId}`);
    return false;
  }

  try {
    context.utils.log(`Effect activated: ${effectId}`);
    handler(context);
    return true;
  } catch (error) {
    context.utils.log(`Effect error (${effectId}): ${error}`);
    return false;
  }
}
