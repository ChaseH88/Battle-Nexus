import { DeckContainer, DeckCard, EmptyDeck } from "./styled";
import cardBackImage from "../../../assets/card-back.png";
import { TextOutline } from "../../Common/TextOutline";

interface DeckDisplayProps {
  deckSize: number;
  onDraw?: () => void;
  canDraw?: boolean;
  isDrawPhase?: boolean;
  isOpponent?: boolean;
}

export const DeckDisplay = ({
  deckSize,
  onDraw,
  canDraw = false,
  isDrawPhase = false,
  isOpponent = false,
}: DeckDisplayProps) => {
  const visibleLayers = Math.min(deckSize, 5);

  if (deckSize === 0) {
    return (
      <EmptyDeck>
        <div className="empty-text">Deck Empty</div>
      </EmptyDeck>
    );
  }

  return (
    <DeckContainer
      onClick={canDraw && deckSize > 0 ? onDraw : undefined}
      sx={{
        cursor: canDraw && deckSize > 0 ? "pointer" : "default",
        ...(canDraw &&
          isDrawPhase &&
          deckSize > 0 && {
            animation: "pulse 1.5s infinite",
            boxShadow: "0 0 20px rgba(255, 200, 0, 0.6)",
            "@keyframes pulse": {
              "0%, 100%": {
                opacity: 1,
              },
              "50%": {
                opacity: 0.7,
              },
            },
          }),
        "&:hover":
          canDraw && deckSize > 0
            ? {
                transform: "scale(1.05)",
                transition: "transform 0.2s ease",
              }
            : {},
      }}
      data-testid={isOpponent ? "opponent-deck" : "player-deck"}
    >
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
