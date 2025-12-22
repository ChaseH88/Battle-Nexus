import { Card } from "./Card";
import { CardInterface, CardType } from "./types";

export type ActionSpeed = "NORMAL" | "QUICK";

export interface ActionCardArgs extends CardInterface {
  speed?: ActionSpeed;
  effectId: string;
}

export class ActionCard extends Card {
  readonly speed: ActionSpeed;
  readonly effectId: string;
  isActive: boolean;
  isFaceDown: boolean;

  constructor(args: ActionCardArgs) {
    super({ ...args, type: CardType.Action });
    this.speed = args.speed ?? "NORMAL";
    this.effectId = args.effectId;
    this.isActive = false;
    this.isFaceDown = false;
  }
}
