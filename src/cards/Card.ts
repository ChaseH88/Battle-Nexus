import { BaseCardArgs, CardId, CardType } from "./types";

export abstract class Card {
  readonly id: CardId;
  readonly name: string;
  readonly description: string;
  readonly type: CardType;
  readonly cost: number;

  protected constructor(args: BaseCardArgs & { type: CardType }) {
    this.id = args.id;
    this.name = args.name;
    this.description = args.description ?? "";
    this.type = args.type;
    this.cost = args.cost ?? 0;
  }
}
