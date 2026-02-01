import { motion, AnimatePresence } from "framer-motion";
import { CardInterface } from "@cards/types";
import { Card } from "../Card";
import { createPortal } from "react-dom";
import styled from "styled-components";

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

const DamageNumber = styled(motion.div)`
  position: absolute;
  font-size: 48px;
  font-weight: bold;
  color: #ff0000;
  text-shadow:
    0 0 10px rgba(255, 0, 0, 0.8),
    0 0 20px rgba(255, 0, 0, 0.6),
    2px 2px 4px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  z-index: 1002;
  user-select: none;
  left: 0;
  top: 0;
`;

interface CardAttackAnimationProps {
  card: CardInterface | null;
  attackerBounds?: DOMRect;
  defenderBounds?: DOMRect;
  damage?: number;
  counterDamage?: number;
  onComplete?: () => void;
}

export const CardAttackAnimation = ({
  card,
  attackerBounds,
  defenderBounds,
  damage,
  counterDamage,
  onComplete,
}: CardAttackAnimationProps) => {
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
          onAnimationComplete={() => {
            if (onComplete) {
              onComplete();
            }
          }}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          <Card card={card} disableHover />
        </AnimatedCardContainer>

        {/* Damage number overlay at defender position */}
        {typeof damage === "number" && (
          <DamageNumber
            key="damage-number"
            initial={{
              x: defenderX,
              y: defenderY,
              opacity: 0,
              scale: 0.5,
            }}
            animate={{
              x: defenderX,
              y: defenderY - 50,
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.5, 1.5, 1],
            }}
            transition={{
              duration: 0.6,
              delay: 0.4, // Start at 0.4s to sync with attack midpoint
              times: [0, 0.2, 0.8, 1],
              ease: "easeOut",
            }}
          >
            -{damage}
          </DamageNumber>
        )}

        {/* Counter damage number overlay at attacker position */}
        {typeof counterDamage === "number" && counterDamage > 0 && (
          <DamageNumber
            key="counter-damage-number"
            initial={{
              x: attackerX,
              y: attackerY,
              opacity: 0,
              scale: 0.5,
            }}
            animate={{
              x: attackerX,
              y: attackerY - 50,
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.5, 1.5, 1],
            }}
            transition={{
              duration: 0.6,
              delay: 0.4, // Start at 0.4s to sync with attack midpoint
              times: [0, 0.2, 0.8, 1],
              ease: "easeOut",
            }}
          >
            -{counterDamage}
          </DamageNumber>
        )}
      </Overlay>
    </AnimatePresence>,
    document.body,
  );
};
