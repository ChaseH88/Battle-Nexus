import { useState } from "react";
import { CardInterface } from "../../../cards/types";
import { Card } from "../Card";
import { HandZone, HandCards } from "./styled";
import { Box } from "@mui/material";
import { motion } from "framer-motion";

interface HandProps {
  hand: CardInterface[];
  selectedHandCard: string | null;
  onSelectCard: (id: string) => void;
  onCardDoubleClick?: (card: CardInterface) => void;
  onDragStart?: (cardId: string) => void;
  onDragEnd?: () => void;
  onCardDropped?: (cardId: string, x: number, y: number) => void;
}

export const Hand = ({
  hand,
  selectedHandCard,
  onSelectCard,
  onCardDoubleClick,
  onDragStart,
  onDragEnd,
  onCardDropped,
}: HandProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <HandZone
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box sx={{ opacity: isHovered ? 1 : 1, transition: "opacity 0.3s" }}>
        <HandCards height={305}>
          {hand.map((card, index) => {
            return (
              <motion.div
                key={`${card.id}-${index}`}
                data-testid="hand-card"
                data-card-name={card.name}
                data-card-type={card.type}
                drag
                dragSnapToOrigin={true}
                dragElastic={0}
                dragMomentum={false}
                dragTransition={{ bounceStiffness: 300, bounceDamping: 25 }}
                whileHover={{ scale: 1.05, y: -10 }}
                whileDrag={{
                  scale: 1.1,
                  rotate: 3,
                  zIndex: 99999,
                }}
                onDragStart={() => {
                  if (onDragStart) {
                    onDragStart(card.id);
                  }
                }}
                onDragEnd={(event, info) => {
                  // Use the pointer position from the event, not the card position
                  // The card might be animating back while we check
                  const pointerEvent = event as PointerEvent;
                  const x = pointerEvent.clientX;
                  const y = pointerEvent.clientY;

                  if (onCardDropped) {
                    onCardDropped(card.id, x, y);
                  }

                  if (onDragEnd) {
                    onDragEnd();
                  }
                }}
                style={{
                  cursor: "grab",
                  position: "relative",
                  zIndex: selectedHandCard === card.id ? 1000 : 1,
                }}
                className="draggable-card"
              >
                <Card
                  card={card}
                  onClick={() => onSelectCard(card.id)}
                  onDoubleClick={
                    onCardDoubleClick
                      ? () => onCardDoubleClick(card)
                      : undefined
                  }
                  selectedHandCard={selectedHandCard}
                />
              </motion.div>
            );
          })}
        </HandCards>
      </Box>
    </HandZone>
  );
};
