import { CardInterface } from "../cards";

export interface PlayerState {
  id: string;
  hp: number;

  deck: CardInterface[];
  hand: CardInterface[];

  lanes: Array<CardInterface | null>; // 3 creature lanes
  support: Array<CardInterface | null>; // 3 support lanes

  graveyard: CardInterface[];
}

export function createPlayerState(
  id: string,
  deck: CardInterface[]
): PlayerState {
  return {
    id,
    hp: 20,
    deck: [...deck],
    hand: [],
    lanes: [null, null, null],
    support: [null, null, null],
    graveyard: [],
  };
}
