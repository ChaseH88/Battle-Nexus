import { Card } from "./Card";
import { CardInterface, CardType } from "./types";

export type ActionSpeed = "NORMAL" | "QUICK";

export interface ActionCardArgs extends CardInterface {
  speed?: ActionSpeed;
  effectId: string;
}

/**
 * ActionCard - Represents action cards in the game (formerly Action and Support cards)
 *
 * Action cards can be played face-down and activated later.
 * When activated, they can either:
 * 1. One-time: Resolve their effect once and are sent to the discard pile
 * 2. Target-based: Stay active until the target leaves the field
 * 3. Persistent: Stay active indefinitely until removed by an effect
 *
 * Players cannot manually discard action cards.
 */
export class ActionCard extends Card {
  readonly speed: ActionSpeed;
  readonly effectId: string;
  isActive: boolean;
  isFaceDown: boolean;

  // Target tracking for action cards that target specific creatures
  targetPlayerIndex?: 0 | 1;
  targetLane?: number; // Lane index (0-2) for creature targets
  targetCardId?: string; // ID of the targeted card (card definition ID)
  targetCardInstanceId?: string; // Instance ID of the targeted card (unique per instance)

  constructor(args: ActionCardArgs) {
    super({ ...args, type: CardType.Action });
    this.speed = args.speed ?? "NORMAL";
    this.effectId = args.effectId;
    this.isActive = false;
    this.isFaceDown = false;
  }
}
