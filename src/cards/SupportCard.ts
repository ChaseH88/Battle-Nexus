import { Card } from "./Card";
import { CardInterface, CardType } from "./types";

export interface SupportCardArgs extends CardInterface {
  effectId: string;
}

export class SupportCard extends Card {
  isActive: boolean;

  constructor(args: SupportCardArgs) {
    super({ ...args, type: CardType.Support });
    this.isActive = false;
  }
}
