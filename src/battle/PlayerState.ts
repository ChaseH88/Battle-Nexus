import { CardInterface } from "../cards";
import { CreatureCard } from "../cards/CreatureCard";
import { SupportCard } from "../cards/SupportCard";
import { ActionCard } from "../cards/ActionCard";

export interface PlayerState {
  id: string;

  deck: CardInterface[];
  hand: CardInterface[];

  lanes: Array<CreatureCard | null>; // 3 creature lanes
  support: Array<SupportCard | ActionCard | null>; // 3 support lanes

  discardPile: CardInterface[];
}

export function createPlayerState(
  id: string,
  deck: CardInterface[]
): PlayerState {
  return {
    id,
    deck: [...deck],
    hand: [],
    lanes: [null, null, null],
    support: [null, null, null],
    discardPile: [],
  };
}
