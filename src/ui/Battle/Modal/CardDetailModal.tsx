import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { closeCardDetailModal } from "../../../store/uiSlice";
import { ModalOverlay } from "./styled";
import { Card } from "../Card";
import { motion, AnimatePresence } from "framer-motion";

export const CardDetailModal = () => {
  const dispatch = useDispatch();
  const {
    isOpen,
    card,
    originRect,
    activeEffects = [],
    playerIndex,
  } = useSelector((state: RootState) => state.ui.cardDetailModal);

  if (!isOpen || !card) return null;

  // const cardEffects = activeEffects.filter((effect) =>
  //   effect.affectedCardIds?.includes(card.id)
  // );

  // Calculate animation start (originRect) and end (centered modal)
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const cardWidth = 193;
  const cardHeight = 281;
  const finalLeft = centerX - cardWidth / 2;
  const finalTop = centerY - cardHeight / 2;

  let initial = undefined;
  if (originRect) {
    initial = {
      x: originRect.left,
      y: originRect.top,
      width: originRect.width,
      height: originRect.height,
      opacity: 1,
      position: "fixed" as const,
      zIndex: 2000,
    };
  }

  return (
    <ModalOverlay onClick={() => dispatch(closeCardDetailModal())}>
      <AnimatePresence>
        <motion.div
          initial={initial}
          animate={{
            x: finalLeft,
            y: finalTop,
            width: cardWidth,
            height: cardHeight,
            opacity: 1,
            position: "fixed",
            zIndex: 2000,
          }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            left: 0,
            top: 0,
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              width: cardWidth,
              height: cardHeight,
              transform: "scale(1.75)",
              transition: "transform 1s ease",
            }}
          >
            <Card
              card={card}
              activeEffects={activeEffects}
              playerIndex={playerIndex}
              disableHover={true}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </ModalOverlay>
  );
};
