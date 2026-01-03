import { CardInterface } from "../cards";
import { CreatureCard } from "../cards/CreatureCard";
import { SupportCard } from "../cards/SupportCard";
import { ActionCard } from "../cards/ActionCard";
import { GameState } from "./GameState";
import {
  Zone,
  isLane,
  isSupport,
  laneIndexFromZone,
  supportIndexFromZone,
} from "./zones";

interface MoveOptions {
  fromLane?: number; // lane/support index override
  toLane?: number;
}

export function moveCard(
  state: GameState,
  playerIndex: number,
  from: Zone,
  to: Zone,
  cardId: string,
  options: MoveOptions = {}
): CardInterface | null {
  const player = state.players[playerIndex];

  const removeFromZone = (): CardInterface | null => {
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

    if (isSupport(from)) {
      const slot = options.fromLane ?? supportIndexFromZone(from);
      const card = player.support[slot];
      if (!card || card.id !== cardId) return null;
      player.support[slot] = null;
      return card;
    }

    if (from === Zone.DiscardPile) {
      const idx = player.discardPile.findIndex((c) => c.id === cardId);
      if (idx === -1) return null;
      const [card] = player.discardPile.splice(idx, 1);
      return card;
    }

    if (from === Zone.Stack) {
      const idx = state.stack.findIndex((c) => c.id === cardId);
      if (idx === -1) return null;
      const [card] = state.stack.splice(idx, 1);
      return card;
    }

    if (from === Zone.MaxDeck) {
      const idx = player.maxDeck.findIndex((c) => c.id === cardId);
      if (idx === -1) return null;
      const [card] = player.maxDeck.splice(idx, 1);
      return card;
    }

    if (from === Zone.RemovedFromGame) {
      const idx = player.removedFromGame.findIndex((c) => c.id === cardId);
      if (idx === -1) return null;
      const [card] = player.removedFromGame.splice(idx, 1);
      return card;
    }

    return null;
  };

  const placeIntoZone = (card: CardInterface): void => {
    if (to === Zone.Deck) {
      player.deck.unshift(card);
      return;
    }

    if (to === Zone.Hand) {
      player.hand.push(card);
      return;
    }

    if (isLane(to)) {
      const lane = options.toLane ?? laneIndexFromZone(to);
      if (player.lanes[lane] !== null) throw new Error(`Lane ${lane} occupied`);
      player.lanes[lane] = card as CreatureCard;
      return;
    }

    if (isSupport(to)) {
      const slot = options.toLane ?? supportIndexFromZone(to);
      if (player.support[slot] !== null)
        throw new Error(`Support ${slot} occupied`);
      player.support[slot] = card as SupportCard | ActionCard;
      return;
    }

    if (to === Zone.DiscardPile) {
      player.discardPile.push(card);
      return;
    }

    if (to === Zone.Stack) {
      state.stack.push(card);
      return;
    }

    if (to === Zone.MaxDeck) {
      player.maxDeck.push(card);
      return;
    }

    if (to === Zone.RemovedFromGame) {
      player.removedFromGame.push(card);
      return;
    }
  };

  const card = removeFromZone();
  if (!card) return null;

  placeIntoZone(card);
  return card;
}
