import { DeckContainer, DeckCard, EmptyDeck } from "./DeckDisplay.styled";
import cardBackImage from "../../../assets/card-back.png";
import { TextOutline } from "../Common/TextOutline";

interface DeckDisplayProps {
  deckSize: number;
}

export const DeckDisplay = ({ deckSize }: DeckDisplayProps) => {
  const visibleLayers = Math.min(deckSize, 5);

  if (deckSize === 0) {
    return (
      <EmptyDeck>
        <div className="empty-text">Deck Empty</div>
      </EmptyDeck>
    );
  }

  return (
    <DeckContainer>
      {Array.from({ length: visibleLayers }).map((_, index) => (
        <DeckCard
          key={index}
          style={{
            transform: `translateY(${index * -2}px) translateX(${index * 1}px)`,
            zIndex: index,
          }}
        >
          <img src={cardBackImage} alt="Card back" />
        </DeckCard>
      ))}
      <TextOutline text={deckSize.toString()} />
    </DeckContainer>
  );
};
