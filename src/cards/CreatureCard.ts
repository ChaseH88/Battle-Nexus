import { Card } from "./Card";
import { Affinity, CardInterface, CardType, ComboKeyword } from "./types";

export interface CreatureCardArgs extends CardInterface {
  atk: number;
  def: number;
  hp: number;
  affinity: Affinity;
  keywords?: ComboKeyword[];
  onSummonEffectId?: string;
  onAttackEffectId?: string;
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
  readonly keywords: ComboKeyword[];
  readonly onSummonEffectId?: string;
  readonly onAttackEffectId?: string;

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
    this.keywords = args.keywords ?? [];
    this.onSummonEffectId = args.onSummonEffectId;
    this.onAttackEffectId = args.onAttackEffectId;
  }

  // Check if stats are modified
  get isAtkModified(): boolean {
    return this.atk !== this.baseAtk;
  }

  get isDefModified(): boolean {
    return this.def !== this.baseDef;
  }
}
