import { Card } from "../cards";

export interface PlayerState {
  id: string;
  hp: number;
  deck: Card[];
  hand: Card[];
  lanes: Array<Card | null>; // 3 creature lanes
  support: Card | null;
  graveyard: Card[];
}

export function createPlayerState(id: string, deck: Card[]): PlayerState {
  return {
    id,
    hp: 20,
    deck: [...deck],
    hand: [],
    lanes: [null, null, null],
    support: null,
    graveyard: [],
  };
}
