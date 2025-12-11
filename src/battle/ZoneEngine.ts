// src/battle/ZoneEngine.ts
import { GameState } from "./GameState";
import { Zone, isLane, laneIndexFromZone } from "./zones";
import { Card } from "../cards";

interface MoveOptions {
  fromLane?: number;
  toLane?: number;
}

/**
 * Move a card by id between zones for a given player.
 * For lanes, you can either pass Lane0/1/2 or use fromLane/toLane.
 */
export function moveCard(
  state: GameState,
  playerIndex: number,
  from: Zone,
  to: Zone,
  cardId: string,
  options: MoveOptions = {}
): Card | null {
  const player = state.players[playerIndex];

  const removeFromZone = (): Card | null => {
    if (from === Zone.Deck) {
      const idx = player.deck.findIndex((c) => c.id === cardId);
      if (idx === -1) return null;
      const [card] = player.deck.splice(idx, 1);
      return card;
    }

    if (from === Zone.Hand) {
      const idx = player.hand.findIndex((c) => c.id === cardId);
      if (idx === -1) return null;
      const [card] = player.hand.splice(idx, 1);
      return card;
    }

    if (isLane(from)) {
      const lane = options.fromLane ?? laneIndexFromZone(from);
      const card = player.lanes[lane];
      if (!card || card.id !== cardId) return null;
      player.lanes[lane] = null;
      return card;
    }

    if (from === Zone.Support) {
      const card = player.support;
      if (!card || card.id !== cardId) return null;
      player.support = null;
      return card;
    }

    if (from === Zone.Graveyard) {
      const idx = player.graveyard.findIndex((c) => c.id === cardId);
      if (idx === -1) return null;
      const [card] = player.graveyard.splice(idx, 1);
      return card;
    }

    if (from === Zone.Stack) {
      const idx = state.stack.findIndex((c) => c.id === cardId);
      if (idx === -1) return null;
      const [card] = state.stack.splice(idx, 1);
      return card;
    }

    return null;
  };

  const placeIntoZone = (card: Card): void => {
    if (to === Zone.Deck) {
      // top of deck
      player.deck.unshift(card);
      return;
    }

    if (to === Zone.Hand) {
      player.hand.push(card);
      return;
    }

    if (isLane(to)) {
      const lane = options.toLane ?? laneIndexFromZone(to);
      if (player.lanes[lane] !== null) {
        throw new Error(`Lane ${lane} is already occupied`);
      }
      player.lanes[lane] = card;
      return;
    }

    if (to === Zone.Support) {
      if (player.support !== null) {
        throw new Error("Support zone is already occupied");
      }
      player.support = card;
      return;
    }

    if (to === Zone.Graveyard) {
      player.graveyard.push(card);
      return;
    }

    if (to === Zone.Stack) {
      state.stack.push(card);
      return;
    }
  };

  const card = removeFromZone();
  if (!card) return null;
  placeIntoZone(card);
  return card;
}
