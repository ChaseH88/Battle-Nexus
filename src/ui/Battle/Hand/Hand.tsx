import { useState } from "react";
import { CardInterface } from "../../../cards/types";
import { Card } from "../Card";
import { HandZone, HandTitle, HandCards } from "./styled";
import { Box } from "@mui/material";

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
}: HandProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <HandZone
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box sx={{ opacity: isHovered ? 1 : 1, transition: "opacity 0.3s" }}>
        <HandCards height={305}>
          {hand.map((card) => (
            <div
              key={card.id}
              data-testid="hand-card"
              data-card-name={card.name}
              data-card-type={card.type}
            >
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
      </Box>
    </HandZone>
  );
};
