import { CardInterface } from "../../../cards";
import {
  DiscardPileDisplay,
  DiscardPileTitle,
  DiscardPileCards,
  DiscardPileCardMini,
} from "./DiscardPile.styled";

interface DiscardPileProps {
  cards: CardInterface[];
}

export const DiscardPile = ({ cards }: DiscardPileProps) => (
  <DiscardPileDisplay>
    <DiscardPileTitle>Discard Pile ({cards.length})</DiscardPileTitle>
    <DiscardPileCards>
      {cards.slice(-3).map((card, i) => (
        <DiscardPileCardMini key={i}>{card.name}</DiscardPileCardMini>
      ))}
    </DiscardPileCards>
  </DiscardPileDisplay>
);
