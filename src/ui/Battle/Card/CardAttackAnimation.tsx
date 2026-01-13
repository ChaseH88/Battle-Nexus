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

const AnimatedCardContainer = styled(motion.div)`
  position: relative;
  filter: drop-shadow(0 10px 30px rgba(255, 0, 0, 0.5));
`;

interface CardAttackAnimationProps {
  card: CardInterface | null;
  isAttacking: boolean;
  attackerBounds?: DOMRect;
  defenderBounds?: DOMRect;
  onComplete?: () => void;
}

export const CardAttackAnimation = ({
  card,
  isAttacking,
  attackerBounds,
  defenderBounds,
  onComplete,
}: CardAttackAnimationProps) => {
  // Auto-trigger exit animation after the animation duration (0.8s)
  useEffect(() => {
    if (isAttacking) {
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 800); // Match the animation duration

      return () => clearTimeout(timer);
    }
  }, [isAttacking, onComplete]);

  if (!card || !attackerBounds || !defenderBounds) return null;

  // Calculate positions
  const attackerX = attackerBounds.left + attackerBounds.width / 2;
  const attackerY = attackerBounds.top + attackerBounds.height / 2;
  const defenderX = defenderBounds.left + defenderBounds.width / 2;
  const defenderY = defenderBounds.top + defenderBounds.height / 2;

  // Calculate the offset from attacker to defender
  const deltaX = defenderX - attackerX;
  const deltaY = defenderY - attackerY;

  return createPortal(
    <AnimatePresence mode="wait">
      {isAttacking && (
        <Overlay
          key="card-attack-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <AnimatedCardContainer
            key="card-attack-card"
            initial={{
              x: attackerX - window.innerWidth / 2,
              y: attackerY - window.innerHeight / 2,
              scale: 1,
            }}
            animate={{
              x: [
                attackerX - window.innerWidth / 2,
                attackerX - window.innerWidth / 2 + deltaX * 0.7,
                attackerX - window.innerWidth / 2,
              ],
              y: [
                attackerY - window.innerHeight / 2,
                attackerY - window.innerHeight / 2 + deltaY * 0.7,
                attackerY - window.innerHeight / 2,
              ],
              scale: [1, 1.2, 1],
              filter: [
                "brightness(1) drop-shadow(0 0 0px rgba(255, 0, 0, 0))",
                "brightness(1.3) drop-shadow(0 0 30px rgba(255, 0, 0, 1))",
                "brightness(1) drop-shadow(0 0 0px rgba(255, 0, 0, 0))",
              ],
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
            }}
            transition={{
              duration: 0.8,
              times: [0, 0.5, 1],
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            <Card card={card} disableHover />
          </AnimatedCardContainer>
        </Overlay>
      )}
    </AnimatePresence>,
    document.body
  );
};
