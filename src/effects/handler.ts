import { GameState, getOpponentIndex } from "../battle/GameState";
import { CardInterface, CardType, CreatureCard } from "../cards";
import { BattleEngine } from "../battle/BattleEngine";
import { fire_atk_boost_aura } from "./effect/fire_atk_boost_aura";
import { flame_aura_global } from "./effect/flame_aura_global";
import { draw_on_play } from "./effect/draw_on_play";
import { boost_fire_atk } from "./effect/boost_fire_atk";
import { void_wisp_boost } from "./effect/void_wisp_boost";
import { purge_opponent_support } from "./effect/purge_opponent_support";
import { mirror_force } from "./effect/mirror_force";
import { direct_burn_damage } from "./effect/direct_burn_damage";
import { quick_assessment } from "./effect/quick_assessment";
import { battle_rage } from "./effect/battle_rage";
import { callHomeHandler } from "./effect/call_home";
import { fusion_drive } from "./effect/fusion_drive";
import { minor_reinforcement } from "./effect/minor_reinforcement";

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
    | "CONTINUOUS"
    | "MANUAL";
  eventData?: {
    lane?: number;
    targetLane?: number;
    targetPlayer?: 0 | 1;
  };

  // Target card (for effects that require targeting)
  targetCard?: CardInterface;

  // Utility functions
  utils: EffectUtils;
}

export interface EffectUtils {
  // Get creatures
  getAllyCreatures: (playerIndex: 0 | 1) => CreatureCard[];
  getEnemyCreatures: (playerIndex: 0 | 1) => CreatureCard[];
  getAllCreatures: () => CreatureCard[];
  getCreatureInLane: (playerIndex: 0 | 1, lane: number) => CreatureCard | null;
  findCreatureById: (cardId: string) => CreatureCard | null;

  // Modify stats
  modifyCreatureStats: (
    creature: CreatureCard,
    atk?: number,
    def?: number,
  ) => void;
  modifyCreatureHP: (creature: CreatureCard, hpChange: number) => void;

  // Card manipulation
  drawCards: (playerIndex: 0 | 1, count: number) => void;
  discardCards: (playerIndex: 0 | 1, count: number, random?: boolean) => void;

  // Filter creatures
  filterByAffinity: (
    creatures: CreatureCard[],
    affinity: string,
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
    statModifiers?: { atk?: number; def?: number },
    isGlobal?: boolean,
  ) => void;

  // Support card cleanup
  checkAndRemoveTargetedSupports: (
    targetPlayerIndex: 0 | 1,
    targetLane: number,
    removedCardId?: string,
  ) => void;
}

/**
 * Create utility functions for effect execution
 */
export function createEffectUtils(
  state: GameState,
  engine: BattleEngine,
): EffectUtils {
  return {
    getAllyCreatures: (playerIndex: 0 | 1) => {
      return state.players[playerIndex].lanes.filter(
        (c) => c !== null && c.type === CardType.Creature,
      ) as unknown as CreatureCard[];
    },

    getEnemyCreatures: (playerIndex: 0 | 1) => {
      const opponentIndex = getOpponentIndex(playerIndex);
      return state.players[opponentIndex].lanes.filter(
        (c) => c !== null && c.type === CardType.Creature,
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

    findCreatureById: (cardId: string) => {
      // Search both players' lanes for the creature
      for (const playerIndex of [0, 1] as const) {
        const creature = state.players[playerIndex].lanes.find(
          (card) => card?.id === cardId && card.type === CardType.Creature,
        );
        if (creature) {
          return creature as CreatureCard;
        }
      }
      return null;
    },

    modifyCreatureStats: (
      creature: CreatureCard,
      atk?: number,
      def?: number,
    ) => {
      const c = creature as any;
      if (atk !== undefined) {
        const oldAtk = c.atk;
        c.atk += atk;
        state.log.effectApplied(
          state.turn,
          state.phase,
          "Stat Change",
          `${c.name}: ATK ${oldAtk} → ${c.atk}`,
        );
      }
      if (def !== undefined) {
        const oldDef = c.def;
        c.def += def;
        state.log.effectApplied(
          state.turn,
          state.phase,
          "Stat Change",
          `${c.name}: DEF ${oldDef} → ${c.def}`,
        );
      }
    },

    modifyCreatureHP: (creature: CreatureCard, hpChange: number) => {
      const c = creature as any;
      const oldHP = c.currentHp;
      c.currentHp += hpChange;
      c.currentHp = Math.max(0, Math.min(c.currentHp, c.hp));
      state.log.effectApplied(
        state.turn,
        state.phase,
        "HP Change",
        `${c.name}: HP ${oldHP} → ${c.currentHp}`,
      );
    },

    drawCards: (playerIndex: 0 | 1, count: number) => {
      const player = state.players[playerIndex];
      let drawnCount = 0;
      for (let i = 0; i < count; i++) {
        if (player.deck.length > 0) {
          const card = player.deck.shift()!;
          player.hand.push(card);
          state.log.effectApplied(
            state.turn,
            state.phase,
            "Card Draw",
            `${player.id} drew ${card.name}`,
          );
          drawnCount++;
        }
      }
      // Log if couldn't draw all requested cards
      if (drawnCount < count) {
        const missed = count - drawnCount;
        state.log.effectApplied(
          state.turn,
          state.phase,
          "Card Draw",
          `${player.id} could not draw ${missed} card${
            missed > 1 ? "s" : ""
          } (deck empty)`,
        );
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
        state.log.effectApplied(
          state.turn,
          state.phase,
          "Card Discard",
          `${player.id} discarded ${card.name}`,
        );
      }
    },

    filterByAffinity: (creatures: CreatureCard[], affinity: string) => {
      return creatures.filter((c) => c.affinity === affinity);
    },

    log: (message: string) => {
      state.log.info(state.turn, state.phase, message);
    },

    addActiveEffect: (
      effectId: string,
      name: string,
      sourceCard: CardInterface,
      playerIndex: 0 | 1,
      turns?: number,
      description?: string,
      affectedCardIds?: string[],
      statModifiers?: { atk?: number; def?: number },
      isGlobal?: boolean,
    ) => {
      engine.addActiveEffect(
        effectId,
        name,
        sourceCard,
        playerIndex,
        turns,
        description,
        affectedCardIds,
        statModifiers,
        isGlobal,
      );
    },

    checkAndRemoveTargetedSupports: (
      targetPlayerIndex: 0 | 1,
      targetLane: number,
      removedCardId?: string,
    ) => {
      engine.checkAndRemoveTargetedSupports(
        targetPlayerIndex,
        targetLane,
        removedCardId,
      );
    },
  };
}

/**
 * Effect Handler - custom callback function for each effect
 */
export type EffectHandler = ((context: EffectContext) => void) & {
  metadata?: import("./metadata").EffectMetadata;
};

/**
 * Registry of custom effect handlers
 * Each effect ID can have a custom handler function that executes custom logic
 */
export const effectHandlers: Record<string, EffectHandler> = {
  battle_rage,
  boost_fire_atk,
  call_home: callHomeHandler,
  direct_burn_damage,
  draw_on_play: (ctx: EffectContext) => draw_on_play(ctx, 1),
  draw_on_play_plus: (ctx: EffectContext) => draw_on_play(ctx, 2),
  draw_on_play_plus_plus: (ctx: EffectContext) => draw_on_play(ctx, 3),
  fire_atk_boost_aura,
  flame_aura_global,
  fusion_drive,
  minor_reinforcement,
  mirror_force,
  purge_opponent_support,
  quick_assessment,
  void_wisp_boost,
};

/**
 * Execute an effect by ID with the given context
 */
export function executeEffect(
  effectId: string,
  context: EffectContext,
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
