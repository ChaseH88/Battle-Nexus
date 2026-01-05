import { useState } from "react";
import { CardInterface } from "../../../cards/types";
import { Card } from "../Card";
import { HandZone, HandCards } from "./styled";
import { motion, AnimatePresence } from "framer-motion";

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
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);

  const totalCards = hand.length;
  const midPoint = (totalCards - 1) / 2;

  const getCardAnimation = (index: number) => {
    const distanceFromCenter = index - midPoint;

    // Create a fan spread - cards further from center are more rotated and lower
    const maxRotation = 8; // degrees
    const baseRotation =
      (distanceFromCenter / Math.max(totalCards - 1, 1)) * maxRotation * 2;

    // Create arc - cards on the edges are lower
    const arcDepth = 15; // pixels
    const normalizedDistance =
      Math.abs(distanceFromCenter) / Math.max(midPoint, 1);
    const baseYOffset = Math.pow(normalizedDistance, 1.5) * arcDepth;

    // X offset to create fan spread
    const fanSpread = totalCards > 5 ? -8 : -5;
    const baseXOffset = distanceFromCenter * fanSpread;

    // If this specific card is hovered, straighten it out and bring to front
    const isThisCardHovered = hoveredCardIndex === index;
    const rotation = isThisCardHovered ? 0 : baseRotation;
    const yOffset = isThisCardHovered ? 0 : baseYOffset;
    const xOffset = isThisCardHovered ? 0 : baseXOffset;

    return {
      rotate: rotation,
      y: yOffset,
      x: xOffset,
    };
  };

  return (
    <HandZone>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <HandCards height={305}>
          <AnimatePresence mode="popLayout">
            {hand.map((card, index) => {
              const isSelected = selectedHandCard === card.id;
              const isHoveringThis = hoveredCardIndex === index;

              return (
                <motion.div
                  key={`${card.id}-${index}`}
                  data-testid="hand-card"
                  data-card-name={card.name}
                  data-card-type={card.type}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    ...getCardAnimation(index),
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                    transition: { duration: 0.2 },
                  }}
                  transition={{
                    layout: { type: "spring", stiffness: 300, damping: 25 },
                    opacity: { delay: index * 0.05 },
                    rotate: { type: "spring", stiffness: 300, damping: 20 },
                    y: { type: "spring", stiffness: 300, damping: 20 },
                    x: { type: "spring", stiffness: 300, damping: 20 },
                  }}
                  drag
                  dragSnapToOrigin={true}
                  dragElastic={0}
                  dragMomentum={false}
                  dragTransition={{ bounceStiffness: 300, bounceDamping: 25 }}
                  whileHover={{
                    scale: 1.15,
                    y: -30,
                    rotate: 0,
                    zIndex: 1000,
                    transition: {
                      type: "spring",
                      stiffness: 400,
                      damping: 15,
                    },
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  whileDrag={{
                    scale: 1.1,
                    rotate: 5,
                    zIndex: 99999,
                    cursor: "grabbing",
                  }}
                  onHoverStart={() => setHoveredCardIndex(index)}
                  onHoverEnd={() => setHoveredCardIndex(null)}
                  onDragStart={() => {
                    if (onDragStart) {
                      onDragStart(card.id);
                    }
                  }}
                  onDragEnd={(event) => {
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
                    zIndex: isSelected ? 1001 : isHoveringThis ? 1000 : 1,
                  }}
                  className="draggable-card"
                >
                  <motion.div
                    animate={{
                      boxShadow: isSelected
                        ? "0 0 20px 5px rgba(34, 211, 238, 0.6)"
                        : "0 4px 8px rgba(0, 0, 0, 0.3)",
                    }}
                    style={{
                      borderRadius: "8px",
                    }}
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
                </motion.div>
              );
            })}
          </AnimatePresence>
        </HandCards>
      </motion.div>
    </HandZone>
  );
};
