import { CardInterface } from "../../../cards/types";
import { Card } from "../Card";

interface HandProps {
  hand: CardInterface[];
  selectedHandCard: string | null;
  onSelectCard: (cardId: string) => void;
}

export const Hand = ({ hand, selectedHandCard, onSelectCard }: HandProps) => (
  <div className="hand-zone">
    <h4>Your Hand</h4>
    <div className="hand-cards">
      {hand.map((card) => (
        <div key={card.id}>
          <Card
            card={card}
            onClick={() => onSelectCard(card.id)}
            selectedHandCard={selectedHandCard}
          />
        </div>
      ))}
    </div>
  </div>
);
