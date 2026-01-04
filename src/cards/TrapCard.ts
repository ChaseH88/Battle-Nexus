import { Card } from "./Card";
import { CardInterface, CardType } from "./types";

export interface TrapCardArgs extends CardInterface {
  effectId: string;
}

/**
 * TrapCard - Represents trap cards in the game
 *
 * Trap cards are played face-down in support zones and can only be activated
 * when their trigger condition is met (e.g., ON_DEFEND when opponent attacks).
 *
 * Traps cannot be manually activated by players - they must be triggered by
 * specific game events as defined by their effect's trigger property.
 *
 * After activation, traps are always sent to the discard pile.
 */
export class TrapCard extends Card {
  isActive: boolean;
  isFaceDown: boolean;

  constructor(args: TrapCardArgs) {
    super({ ...args, type: CardType.Trap });
    this.isActive = false;
    this.isFaceDown = false;
  }
}
