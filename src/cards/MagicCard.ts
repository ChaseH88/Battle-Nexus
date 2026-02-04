import { Card } from "./Card";
import { CardInterface, CardType } from "./types";

export type MagicSpeed = "NORMAL" | "QUICK";

export interface MagicCardArgs extends CardInterface {
  speed?: MagicSpeed;
  effectId: string;
}

/**
 * MagicCard - Represents magic cards in the game (formerly Action and Support cards)
 *
 * Magic cards can be played face-down and activated later.
 * When activated, they can either:
 * 1. One-time: Resolve their effect once and are sent to the discard pile
 * 2. Target-based: Stay active until the target leaves the field
 * 3. Persistent: Stay active indefinitely until removed by an effect
 *
 * Players cannot manually discard magic cards.
 */
export class MagicCard extends Card {
  readonly speed: MagicSpeed;
  readonly effectId: string;
  isActive: boolean;
  isFaceDown: boolean;

  // Target tracking for magic cards that target specific creatures
  targetPlayerIndex?: 0 | 1;
  targetLane?: number; // Lane index (0-2) for creature targets
  targetCardId?: string; // ID of the targeted card (card definition ID)
  targetCardInstanceId?: string; // Instance ID of the targeted card (unique per instance)

  constructor(args: MagicCardArgs) {
    super({ ...args, type: CardType.Magic });
    this.speed = args.speed ?? "NORMAL";
    this.effectId = args.effectId;
    this.isActive = false;
    this.isFaceDown = false;
  }
}
