import { CardInterface } from "../../../cards/types";
import { Card } from "../Card";
import { HandZone, HandTitle, HandCards } from "./styled";

interface HandProps {
  hand: CardInterface[];
  selectedHandCard: string | null;
  onSelectCard: (cardId: string) => void;
}

export const Hand = ({ hand, selectedHandCard, onSelectCard }: HandProps) => (
  <HandZone>
    <HandTitle>Your Hand</HandTitle>
    <HandCards>
      {hand.map((card) => (
        <div key={card.id}>
          <Card
            card={card}
            onClick={() => onSelectCard(card.id)}
            selectedHandCard={selectedHandCard}
          />
        </div>
      ))}
    </HandCards>
  </HandZone>
);
