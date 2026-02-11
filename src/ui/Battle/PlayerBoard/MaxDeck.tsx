import { CardInterface } from "../../../cards";
import { useState } from "react";
import { Card } from "../Card";
import {
  MaxDeckDisplay,
  MaxDeckTitle,
  MaxDeckGrid,
  MaxDeckModalOverlay,
  MaxDeckModalContent,
  MaxDeckModalHeader,
  MaxDeckModalCards,
  MaxDeckCardWrapper,
  MaxDeckCardCost,
} from "./MaxDeck.styled";
import { GameButton } from "../../Common/Button";

interface MaxDeckProps {
  cards: CardInterface[];
  playerMomentum: number;
  onPlayMaxCard?: (cardId: string) => void;
}

export const MaxDeck = ({
  cards,
  playerMomentum,
  onPlayMaxCard,
}: MaxDeckProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCardClick = (card: CardInterface) => {
    if (onPlayMaxCard && playerMomentum >= card.cost) {
      onPlayMaxCard(card.id);
      setIsOpen(false);
    }
  };

  return (
    <>
      <MaxDeckDisplay onClick={() => setIsOpen(true)}>
        <MaxDeckTitle>⚡ MAX Deck ({cards.length})</MaxDeckTitle>
        <MaxDeckGrid>
          {cards.slice(0, 3).map((card, i) => (
            <div
              key={i}
              style={{
                fontSize: "0.7rem",
                padding: "2px 4px",
                background: "rgba(96, 165, 250, 0.2)",
                borderRadius: "4px",
                border: "1px solid rgba(96, 165, 250, 0.4)",
              }}
            >
              {card.name.substring(0, 10)}
              {card.name.length > 10 ? "..." : ""}
            </div>
          ))}
          {cards.length > 3 && (
            <div style={{ fontSize: "0.8rem", color: "#60a5fa" }}>
              +{cards.length - 3} more
            </div>
          )}
        </MaxDeckGrid>
      </MaxDeckDisplay>

      {isOpen && (
        <MaxDeckModalOverlay onClick={() => setIsOpen(false)}>
          <MaxDeckModalContent onClick={(e) => e.stopPropagation()}>
            <MaxDeckModalHeader>
              <h2>MAX Deck</h2>
              <div>Current Momentum: ⚡ {playerMomentum}/10</div>
              <GameButton
                variant="danger"
                size="small"
                onClick={() => setIsOpen(false)}
                sx={{
                  minWidth: "40px",
                  width: "40px",
                  height: "40px",
                  padding: 0,
                  fontSize: "1.5rem",
                  lineHeight: 1,
                }}
              >
                ×
              </GameButton>
            </MaxDeckModalHeader>
            <MaxDeckModalCards>
              {cards.length === 0 ? (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    padding: "40px",
                    color: "#94a3b8",
                    fontSize: "1.2rem",
                  }}
                >
                  No MAX cards in deck yet
                </div>
              ) : (
                cards.map((card) => {
                  const canAfford = playerMomentum >= card.cost;
                  return (
                    <MaxDeckCardWrapper
                      key={card.id}
                      canafford={canAfford ? "true" : "false"}
                      onClick={() => canAfford && handleCardClick(card)}
                    >
                      <MaxDeckCardCost>⚡ {card.cost}</MaxDeckCardCost>
                      <Card
                        card={card}
                        playerMomentum={playerMomentum}
                        disableHover={true}
                      />
                      {!canAfford && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: "rgba(0,0,0,0.6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fc8181",
                            fontWeight: "bold",
                            fontSize: "1.2rem",
                          }}
                        >
                          Not Enough Momentum
                        </div>
                      )}
                    </MaxDeckCardWrapper>
                  );
                })
              )}
            </MaxDeckModalCards>
          </MaxDeckModalContent>
        </MaxDeckModalOverlay>
      )}
    </>
  );
};
