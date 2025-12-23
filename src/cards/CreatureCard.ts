import { Card } from "./Card";
import { Affinity, CardInterface, CardType } from "./types";

export type EffectType = "ONE_TIME" | "CONTINUOUS";

export interface CreatureCardArgs extends CardInterface {
  atk: number;
  def: number;
  hp: number;
  affinity: Affinity;
  onSummonEffectId?: string;
  onAttackEffectId?: string;
  effectId?: string; // Support-mode effect ID
  effectType?: EffectType; // Support-mode effect type
}

export class CreatureCard extends Card {
  readonly baseAtk: number;
  readonly baseDef: number;
  readonly hp: number;
  currentHp: number;
  hasAttackedThisTurn: boolean;
  hasChangedModeThisTurn: boolean;
  mode: "ATTACK" | "DEFENSE";
  isFaceDown: boolean;
  readonly affinity: Affinity;
  readonly onSummonEffectId?: string;
  readonly onAttackEffectId?: string;
  readonly effectId?: string;
  readonly effectType?: EffectType;

  // Effect activation tracking (for creatures with support-like effects)
  hasActivatedEffect: boolean; // Track if effect has been activated this game (ONE_TIME only)
  hasActivatedEffectThisTurn: boolean; // Track if effect has been activated this turn

  // Current stats (modified by effects)
  atk: number;
  def: number;

  constructor(args: CreatureCardArgs) {
    super({ ...args, type: CardType.Creature });
    this.baseAtk = args.atk;
    this.baseDef = args.def;
    this.atk = args.atk;
    this.def = args.def;
    this.hp = args.hp;
    this.currentHp = args.hp;
    this.hasAttackedThisTurn = false;
    this.hasChangedModeThisTurn = false;
    this.mode = "ATTACK"; // Default to attack mode
    this.isFaceDown = false; // Default to face-up
    this.affinity = args.affinity;
    this.onSummonEffectId = args.onSummonEffectId;
    this.onAttackEffectId = args.onAttackEffectId;
    this.effectId = args.effectId;
    this.effectType = args.effectType;
    this.hasActivatedEffect = false;
    this.hasActivatedEffectThisTurn = false;
  }

  // Check if stats are modified
  get isAtkModified(): boolean {
    return this.atk !== this.baseAtk;
  }

  get isDefModified(): boolean {
    return this.def !== this.baseDef;
  }

  // Check if creature has an activatable effect
  get hasActivatableEffect(): boolean {
    return !!this.effectId;
  }

  // Check if creature can activate its effect (hasn't been used yet for ONE_TIME effects)
  get canActivateEffect(): boolean {
    if (!this.effectId) return false;
    // Can't activate if already activated this turn
    if (this.hasActivatedEffectThisTurn) return false;
    // ONE_TIME effects can only be activated once per game
    if (this.effectType === "ONE_TIME") {
      return !this.hasActivatedEffect;
    }
    // CONTINUOUS effects can be activated once per turn
    return true;
  }
}
