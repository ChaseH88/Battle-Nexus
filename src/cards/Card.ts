import { CardInterface, CardId, CardType } from "./types";

export abstract class Card {
  readonly id: CardId;
  readonly name: string;
  readonly description: string;
  readonly type: CardType;
  readonly cost: number;
  readonly rarity: "C" | "R" | "SR" | "UR";
  readonly set: "Base";
  readonly effectId?: string;
  readonly effectType?: "ONE_TIME" | "CONTINUOUS";

  protected constructor(args: CardInterface) {
    this.id = args.id;
    this.name = args.name;
    this.description = args.description ?? "";
    this.type = args.type;
    this.cost = args.cost ?? 0;
    this.rarity = args.rarity;
    this.set = args.set;
    this.effectId = args.effectId;
    this.effectType = args.effectType;
  }
}
