import { motion, AnimatePresence } from "framer-motion";
import { CardInterface } from "@cards/types";
import { Card } from "../Card";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { useEffect } from "react";

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1000;
`;

const CenteredCardContainer = styled(motion.div)`
  position: relative;
  filter: drop-shadow(0 20px 60px rgba(0, 0, 0, 0.5));
`;

interface CardActivationEffectProps {
  card: CardInterface | null;
  isActivating: boolean;
  originBounds?: DOMRect;
  onComplete?: () => void;
}

export const CardActivationEffect = ({
  card,
  isActivating,
  originBounds,
  onComplete,
}: CardActivationEffectProps) => {
  // Auto-trigger exit animation after the animation duration (1.2s)
  useEffect(() => {
    if (isActivating) {
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 1200); // Match the animation duration

      return () => clearTimeout(timer);
    }
  }, [isActivating, onComplete]);

  if (!card || !originBounds) return null;

  // Calculate the transform needed to move from origin to center
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const originX = originBounds.left + originBounds.width / 2;
  const originY = originBounds.top + originBounds.height / 2;

  return createPortal(
    <AnimatePresence mode="wait">
      {isActivating && (
        <Overlay
          key="card-activation-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CenteredCardContainer
            key="card-activation-card"
            initial={{
              x: originX - centerX,
              y: originY - centerY,
              scale: 0.8,
            }}
            animate={{
              x: 0,
              y: 0,
              scale: [0.8, 1.5, 1.3],
              rotateY: [0, 5, -5, 0],
              filter: [
                "brightness(1) drop-shadow(0 0 0px rgba(72, 187, 120, 0))",
                "brightness(1.5) drop-shadow(0 0 40px rgba(72, 187, 120, 1))",
                "brightness(1.5) drop-shadow(0 0 40px rgba(72, 187, 120, 1))",
                "brightness(1) drop-shadow(0 0 0px rgba(72, 187, 120, 0))",
              ],
            }}
            exit={{
              x: originX - centerX,
              y: originY - centerY,
              scale: 0.8,
            }}
            transition={{
              duration: 1.2,
              times: [0, 0.3, 0.7, 1],
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            <Card card={card} disableHover />
          </CenteredCardContainer>
        </Overlay>
      )}
    </AnimatePresence>,
    document.body
  );
};
