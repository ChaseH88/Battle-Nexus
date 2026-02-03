import { CardInterface, CardId, CardType, Rarity } from "./types";

export abstract class Card {
  readonly id: CardId;
  readonly name: string;
  readonly description: string;
  readonly type: CardType;
  readonly cost: number;
  readonly rarity: Rarity;
  readonly set: "Base";
  readonly effectId?: string;
  readonly effectType?: "ONE_TIME" | "CONTINUOUS";
  readonly image?: string;
  instanceId: string; // Unique ID for this specific instance of the card

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
    this.image = args.image;
    // Generate unique instance ID: cardId + timestamp + random
    this.instanceId = `${args.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
