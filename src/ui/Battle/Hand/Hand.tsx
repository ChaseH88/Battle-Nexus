import { useState } from "react";
import { CardInterface } from "../../../cards/types";
import { Card } from "../Card";
import { HandZone, HandCards } from "./styled";
import { motion, AnimatePresence } from "framer-motion";
import { CARD_DIMENSIONS } from "../Card/cardDimensions";

interface HandProps {
  hand: CardInterface[];
  onSelectCard: (id: string) => void;
  onCardDoubleClick?: (card: CardInterface) => void;
  onDragStart?: (cardId: string) => void;
  onDragEnd?: () => void;
  onCardDropped?: (cardId: string, x: number, y: number) => void;
  playerMomentum?: number;
}

export const Hand = ({
  hand,
  onSelectCard,
  onCardDoubleClick,
  onDragStart,
  onDragEnd,
  onCardDropped,
  playerMomentum = 0,
}: HandProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const totalCards = hand.length;
  const midPoint = (totalCards - 1) / 2;

  const getVerticalOffset = () => {
    switch (true) {
      case totalCards <= 3:
        return 6;
      case totalCards <= 5:
        return 8.5;
      default:
        return 3;
    }
  };

  const getCardAnimation = (index: number) => {
    const distanceFromCenter = index - midPoint;

    // Create a fan spread - cards further from center are more rotated
    const maxRotation = 8; // degrees
    const baseRotation =
      (distanceFromCenter / Math.max(totalCards - 1, 1)) * maxRotation * 2;

    // Create natural hand-holding effect:
    // - Center card(s) are at the top (y = 0)
    // - Cards further from center are progressively lower
    // - Each step away from center adds more vertical distance
    const verticalStepSize = getVerticalOffset(); // pixels per step from center
    const normalizedDistance = Math.abs(distanceFromCenter);
    // Use quadratic function for more natural curve (cards drop faster at edges)
    const baseYOffset = Math.pow(normalizedDistance, 1.8) * verticalStepSize;

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
    <HandZone
      isHovering={isHovering}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        if (isDragging) return;
        setIsHovering(false);
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <HandCards height={305}>
          <AnimatePresence mode="popLayout">
            {hand.map((card, index) => {
              const isHoveringThis = hoveredCardIndex === index;
              const canAfford = playerMomentum >= card.cost;

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
                  drag={canAfford}
                  dragSnapToOrigin={true}
                  dragElastic={0}
                  dragMomentum={false}
                  dragTransition={{ bounceStiffness: 300, bounceDamping: 25 }}
                  whileHover={{
                    scale: 1.5,
                    y: -100,
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
                      setIsDragging(true);
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
                      setIsDragging(false);
                      setIsHovering(false);
                    }
                  }}
                  style={{
                    cursor: canAfford ? "grab" : "not-allowed",
                    position: "relative",
                    zIndex: isHoveringThis ? 1000 : 1,
                    opacity: canAfford ? 1 : 0.6,
                    height: CARD_DIMENSIONS.HEIGHT,
                    width: CARD_DIMENSIONS.WIDTH,
                  }}
                  className="draggable-card"
                >
                  <motion.div
                    animate={{
                      boxShadow: canAfford
                        ? [
                            "0 0 5px rgba(34, 211, 238, 0.4), 0 0 10px rgba(34, 211, 238, 0.3)",
                            "0 0 15px rgba(34, 211, 238, 0.8), 0 0 25px rgba(34, 211, 238, 0.5)",
                            "0 0 5px rgba(34, 211, 238, 0.4), 0 0 10px rgba(34, 211, 238, 0.3)",
                          ]
                        : "0 4px 8px rgba(0, 0, 0, 0.3)",
                    }}
                    transition={{
                      boxShadow: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }}
                    style={{
                      borderRadius: "8px",
                      width: CARD_DIMENSIONS.WIDTH,
                      height: CARD_DIMENSIONS.HEIGHT,
                    }}
                  >
                    <Card
                      card={card}
                      playerMomentum={playerMomentum}
                      onClick={() => onSelectCard(card.id)}
                      onDoubleClick={
                        onCardDoubleClick
                          ? () => onCardDoubleClick(card)
                          : undefined
                      }
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
