import { CardInterface } from "../../../cards";

interface DiscardPileProps {
  cards: CardInterface[];
}

export const DiscardPile = ({ cards }: DiscardPileProps) => (
  <div className="discard-pile-display">
    <h4>Discard Pile ({cards.length})</h4>
    <div className="discard-pile-cards">
      {cards.slice(-3).map((card, i) => (
        <div key={i} className="discard-pile-card-mini">
          {card.name}
        </div>
      ))}
    </div>
  </div>
);
