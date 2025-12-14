import { Card } from "./Card";
import { Affinity, CardInterface, CardType, ComboKeyword } from "./types";

export interface CreatureCardArgs extends CardInterface {
  atk: number;
  def: number;
  affinity: Affinity;
  keywords?: ComboKeyword[];
  onSummonEffectId?: string;
  onAttackEffectId?: string;
}

export class CreatureCard extends Card {
  readonly atk: number;
  readonly def: number;
  readonly affinity: Affinity;
  readonly keywords: ComboKeyword[];
  readonly onSummonEffectId?: string;
  readonly onAttackEffectId?: string;

  constructor(args: CreatureCardArgs) {
    super({ ...args, type: CardType.Creature });
    this.atk = args.atk;
    this.def = args.def;
    this.affinity = args.affinity;
    this.keywords = args.keywords ?? [];
    this.onSummonEffectId = args.onSummonEffectId;
    this.onAttackEffectId = args.onAttackEffectId;
  }
}
