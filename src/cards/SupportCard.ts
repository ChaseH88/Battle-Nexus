import { Card } from "./Card";
import { CardInterface, CardType } from "./types";

export interface SupportCardArgs extends CardInterface {
  effectId: string;
}

/**
 * SupportCard - Represents support cards in the game
 *
 * Support cards can be played face-down and activated later.
 * When activated, they can either:
 * 1. Target-based: Stay active until the target leaves the field
 * 2. Persistent: Stay active indefinitely until removed by an effect
 *
 * Players cannot manually discard support cards.
 */
export class SupportCard extends Card {
  isActive: boolean;
  isFaceDown: boolean;

  // Target tracking for support cards that target specific creatures
  targetPlayerIndex?: 0 | 1;
  targetLane?: number; // Lane index (0-2) for creature targets
  targetCardId?: string; // ID of the targeted card (card definition ID)
  targetCardInstanceId?: string; // Instance ID of the targeted card (unique per instance)

  constructor(args: SupportCardArgs) {
    super({ ...args, type: CardType.Action });
    this.isActive = false;
    this.isFaceDown = false;
  }
}
