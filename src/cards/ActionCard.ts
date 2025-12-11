import { Card } from "./Card";
import { BaseCardArgs, CardType } from "./types";

export type ActionSpeed = "NORMAL" | "QUICK";

export interface ActionCardArgs extends BaseCardArgs {
  speed?: ActionSpeed;
  effectId: string;
}

export class ActionCard extends Card {
  readonly speed: ActionSpeed;
  readonly effectId: string;

  constructor(args: ActionCardArgs) {
    super({ ...args, type: CardType.Action });
    this.speed = args.speed ?? "NORMAL";
    this.effectId = args.effectId;
  }
}
