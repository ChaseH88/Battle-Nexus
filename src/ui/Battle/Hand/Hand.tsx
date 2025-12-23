import { CardInterface } from "../../../cards/types";
import { Card } from "../Card";
import { HandZone, HandTitle, HandCards } from "./styled";

interface HandProps {
  hand: CardInterface[];
  selectedHandCard: string | null;
  onSelectCard: (cardId: string) => void;
  onCardDoubleClick?: (card: CardInterface) => void;
}

export const Hand = ({
  hand,
  selectedHandCard,
  onSelectCard,
  onCardDoubleClick,
}: HandProps) => (
  <HandZone>
    <HandTitle>Your Hand</HandTitle>
    <HandCards>
      {hand.map((card) => (
        <div key={card.id}>
          <Card
            card={card}
            onClick={() => onSelectCard(card.id)}
            onDoubleClick={
              onCardDoubleClick ? () => onCardDoubleClick(card) : undefined
            }
            selectedHandCard={selectedHandCard}
          />
        </div>
      ))}
    </HandCards>
  </HandZone>
);
