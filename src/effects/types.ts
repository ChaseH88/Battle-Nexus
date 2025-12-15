import { Affinity, CardId, CardType, ComboKeyword } from "../cards";

/** When can the player choose to activate (or does it auto-fire)? */
export type EffectTiming = "QUICK" | "NORMAL" | "PERSIST";

/** What event causes the effect to be eligible to resolve? */
export type EffectTrigger =
  | "ON_PLAY"
  | "ON_ATTACK"
  | "ON_DEFEND"
  | "ON_DESTROY"
  | "ON_DRAW"
  | "CONTINUOUS";

/** Who/what the effect is allowed to target */
export type EffectTarget =
  | "SELF_CARD"
  | "ALLY_CREATURE"
  | "ENEMY_CREATURE"
  | "ALL_CREATURES"
  | "PLAYER"
  | "OPPONENT";

/** Common filter/query you can reuse everywhere */
export interface CardFilter {
  type?: CardType; // CREATURE/SUPPORT/ACTION
  affinity?: Affinity;
  keywords?: ComboKeyword[];
  lane?: number; // for creature lanes 0..2
  supportSlot?: number; // for support slots 0..2
  idIn?: CardId[]; // optional explicit allow-list
}

/** Optional duration model (keeps it extensible) */
export type Duration =
  | { kind: "TURNS"; turns: number }
  | { kind: "UNTIL_END_OF_TURN" }
  | { kind: "PERMANENT" };

/* -------------------- ACTIONS -------------------- */

export interface StatModifierAction {
  type: "STAT_MOD";
  mode: "BOOST" | "REDUCE";
  target: EffectTarget;
  filter?: CardFilter;
  atk?: number;
  def?: number;
  duration?: Duration;
}

export interface MoveAction {
  type: "MOVE";
  target: EffectTarget;
  filter?: CardFilter;
  destination: "GRAVEYARD" | "HAND" | "DECK_TOP" | "DECK_BOTTOM";
}

export interface DamageAction {
  type: "HP_CHANGE";
  target: EffectTarget; // PLAYER or OPPONENT usually, but can allow card damage later
  amount: number; // positive = damage, negative = heal (or enforce separate mode)
}

export interface DrawDiscardAction {
  type: "HAND_SIZE_CHANGE";
  mode: "DRAW" | "DISCARD_RANDOM" | "DISCARD_CHOOSE";
  target: "PLAYER" | "OPPONENT";
  amount: number;
}

export interface KeywordAction {
  type: "KEYWORD";
  mode: "ADD" | "REMOVE";
  target: EffectTarget;
  filter?: CardFilter;
  keywords: ComboKeyword[];
  duration?: Duration;
}

/* -------------------- CONDITIONS -------------------- */

export type Condition =
  | { check: "AFFINITY_MATCH"; affinity: Affinity } // usually compares source vs target
  | { check: "KEYWORD_PRESENT"; keyword: ComboKeyword }
  | {
      check: "HP_THRESHOLD";
      target: "PLAYER" | "OPPONENT";
      op: "<=" | ">=";
      hp: number;
    }
  | {
      check: "KO_COUNT";
      target: "PLAYER" | "OPPONENT";
      op: "<=" | ">=";
      kos: number;
    };

export interface ConditionalAction {
  type: "IF";
  condition: Condition;
  then: EffectAction[];
  else?: EffectAction[];
}

export type EffectAction =
  | StatModifierAction
  | MoveAction
  | DamageAction
  | DrawDiscardAction
  | KeywordAction
  | ConditionalAction;

/* -------------------- EFFECT DEFINITIONS -------------------- */

export interface EffectDefinition {
  id: string;
  name: string;
  timing: EffectTiming;
  trigger: EffectTrigger;
  actions: EffectAction[];

  stackable?: boolean; // multiple copies active
  chainable?: boolean; // can add to effect stack
}

/* -------------------- RUNTIME STATE -------------------- */

/** What event kicked off this resolution */
export type EffectEvent =
  | { type: "PLAY"; playerIndex: 0 | 1; cardId: CardId }
  | { type: "ATTACK"; playerIndex: 0 | 1; lane: number; attackerId: CardId }
  | { type: "DEFEND"; playerIndex: 0 | 1; lane: number; defenderId: CardId }
  | { type: "DESTROY"; playerIndex: 0 | 1; cardId: CardId }
  | { type: "DRAW"; playerIndex: 0 | 1; cardId: CardId }
  | { type: "CONTINUOUS_TICK"; turn: number };

/** Active (applied) effect instance for durations */
export interface ActiveEffect {
  effectId: string;
  sourceCardId: CardId;
  sourcePlayerIndex: 0 | 1;
  appliedTurn: number;
  expiresOnTurn?: number;

  // optional resolved/locked target data
  target?: {
    playerIndex: 0 | 1;
    lane?: number;
    supportSlot?: number;
    cardId?: CardId;
  };
}

export interface EffectState {
  activeEffects: ActiveEffect[];
  resolvingStack: Array<{
    effectId: string;
    sourceCardId: CardId;
    sourcePlayerIndex: 0 | 1;
    event: EffectEvent;
  }>;
}
