import {
  DiscardContainer,
  DiscardCard,
  EmptyDiscard,
} from "./DiscardDisplay.styled";
import { CardInterface } from "../../../cards/types";
import { Card } from "../Card/Card";
import { TextOutline } from "../../Common/TextOutline";

interface DiscardDisplayProps {
  discardPile: CardInterface[];
  playerIndex: number;
  onDiscardClick?: () => void;
}

export const DiscardDisplay = ({
  discardPile,
  playerIndex,
  onDiscardClick,
}: DiscardDisplayProps) => {
  const visibleLayers = Math.min(discardPile.length, 3);
  const topCard = discardPile[discardPile.length - 1];
  const isClickable = discardPile.length > 0 && !!onDiscardClick;

  if (discardPile.length === 0) {
    return (
      <EmptyDiscard>
        <div className="empty-text">Discard Pile</div>
      </EmptyDiscard>
    );
  }

  return (
    <DiscardContainer onClick={onDiscardClick} $clickable={isClickable}>
      {Array.from({ length: visibleLayers }).map((_, index) => {
        const cardIndex = discardPile.length - visibleLayers + index;
        const card = discardPile[cardIndex];

        return (
          <DiscardCard
            key={`${card.id}-${index}`}
            style={{
              transform: `rotate(${(index - (visibleLayers - 1) / 1.25) * 3}deg) translateY(${index * -1}px) translateX(${index * -1}px)`,
              zIndex: index,
            }}
          >
            {index === visibleLayers - 1 && topCard ? (
              <div
                style={{
                  pointerEvents: "none",
                  transform: "scale(0.95)",
                  filter: "grayscale(100%)",
                }}
              >
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
      <TextOutline
        text={discardPile.length ? discardPile.length.toString() : "0"}
      />
    </DiscardContainer>
  );
};
