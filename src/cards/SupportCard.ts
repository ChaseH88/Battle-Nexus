import { Card } from "./Card";
import { CardInterface, CardType } from "./types";

export class SupportCard extends Card {
  constructor(args: CardInterface) {
    super({ ...args, type: CardType.Support });
  }
}
