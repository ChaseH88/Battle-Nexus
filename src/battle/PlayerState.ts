import { CardInterface } from "../cards";
import { CreatureCard } from "../cards/CreatureCard";
import { SupportCard } from "../cards/SupportCard";
import { ActionCard } from "../cards/ActionCard";

export interface PlayerState {
  id: string;
  lifePoints: number;
  momentum: number; // Momentum resource (0-10)

  deck: CardInterface[];
  hand: CardInterface[];
  maxDeck: CardInterface[]; // MAX cards (max 10, never drawn, always visible)

  lanes: Array<CreatureCard | null>; // 3 creature lanes
  support: Array<SupportCard | ActionCard | null>; // 3 support lanes

  discardPile: CardInterface[];
  removedFromGame: CardInterface[]; // MAX cards go here when they leave play
}

export function createPlayerState(
  id: string,
  deck: CardInterface[],
  maxDeck: CardInterface[] = []
): PlayerState {
  return {
    id,
    lifePoints: 200,
    momentum: 0, // Start at 0 momentum
    deck: [...deck],
    hand: [],
    maxDeck: [...maxDeck].slice(0, 10), // Max 10 MAX cards
    lanes: [null, null, null],
    support: [null, null, null],
    discardPile: [],
    removedFromGame: [], // MAX cards removed from game
  };
}
