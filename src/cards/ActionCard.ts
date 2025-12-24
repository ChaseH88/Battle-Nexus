import { Card } from "./Card";
import { CardInterface, CardType } from "./types";

export type ActionSpeed = "NORMAL" | "QUICK";

export interface ActionCardArgs extends CardInterface {
  speed?: ActionSpeed;
  effectId: string;
}

/**
 * ActionCard - Represents one-time action cards
 *
 * Action cards must be played face-down and activated manually.
 * When activated, they resolve their effect once and are always sent to the discard pile.
 *
 * Players cannot manually discard action cards.
 */
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
