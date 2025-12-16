import { Card } from "./Card";
import { CardInterface, CardType } from "./types";

export class SupportCard extends Card {
  isActive: boolean;

  constructor(args: CardInterface) {
    super({ ...args, type: CardType.Support });
    this.isActive = false;
  }
}
