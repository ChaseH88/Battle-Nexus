import {
  DiscardContainer,
  DiscardCard,
  CardCount,
  EmptyDiscard,
} from "./DiscardDisplay.styled";
import { CardInterface } from "../../../cards/types";
import { Card } from "../Card/Card";

interface DiscardDisplayProps {
  discardPile: CardInterface[];
  playerIndex: number;
  onCardClick?: () => void;
}

export const DiscardDisplay = ({
  discardPile,
  playerIndex,
  onCardClick,
}: DiscardDisplayProps) => {
  // Calculate how many card layers to show (max 3 for visual effect)
  const visibleLayers = Math.min(discardPile.length, 3);
  const topCard = discardPile[discardPile.length - 1];

  if (discardPile.length === 0) {
    return (
      <EmptyDiscard>
        <div className="empty-text">Discard Pile</div>
      </EmptyDiscard>
    );
  }

  return (
    <DiscardContainer onClick={onCardClick} clickable={!!onCardClick}>
      {/* Render stacked cards - show the top card with layers beneath */}
      {Array.from({ length: visibleLayers }).map((_, index) => {
        const cardIndex = discardPile.length - visibleLayers + index;
        const card = discardPile[cardIndex];

        return (
          <DiscardCard
            key={`${card.id}-${index}`}
            style={{
              transform: `translateY(${index * 2}px) translateX(${index * -1}px)`,
              zIndex: index,
              opacity: index === visibleLayers - 1 ? 1 : 0.5 - index * 0.15,
            }}
          >
            {index === visibleLayers - 1 && topCard ? (
              <div style={{ pointerEvents: "none", transform: "scale(0.95)" }}>
                <Card
                  card={topCard}
                  isSelected={false}
                  showFaceDown={false}
                  canActivate={false}
                  playerIndex={playerIndex as 0 | 1}
                  activeEffects={[]}
                />
              </div>
            ) : (
              <div className="card-placeholder" />
            )}
          </DiscardCard>
        );
      })}

      {/* Card count overlay */}
      {discardPile.length > 1 && <CardCount>{discardPile.length}</CardCount>}
    </DiscardContainer>
  );
};
