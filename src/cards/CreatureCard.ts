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
  readonly atk: number;
  readonly def: number;
  readonly hp: number;
  currentHp: number;
  hasAttackedThisTurn: boolean;
  mode: "ATTACK" | "DEFENSE";
  readonly affinity: Affinity;
  readonly keywords: ComboKeyword[];
  readonly onSummonEffectId?: string;
  readonly onAttackEffectId?: string;

  constructor(args: CreatureCardArgs) {
    super({ ...args, type: CardType.Creature });
    this.atk = args.atk;
    this.def = args.def;
    this.hp = args.hp;
    this.currentHp = args.hp;
    this.hasAttackedThisTurn = false;
    this.mode = "ATTACK"; // Default to attack mode
    this.affinity = args.affinity;
    this.keywords = args.keywords ?? [];
    this.onSummonEffectId = args.onSummonEffectId;
    this.onAttackEffectId = args.onAttackEffectId;
  }
}
