import { Card } from "./Card";
import { BaseCardArgs, CardType } from "./types";

export interface SupportCardArgs extends BaseCardArgs {
  continuousEffectId: string;
  oncePerTurn?: boolean;
}

export class SupportCard extends Card {
  readonly continuousEffectId: string;
  readonly oncePerTurn: boolean;

  constructor(args: SupportCardArgs) {
    super({ ...args, type: CardType.Support });
    this.continuousEffectId = args.continuousEffectId;
    this.oncePerTurn = args.oncePerTurn ?? false;
  }
}
