import { motion } from "framer-motion";
import { Box } from "@mui/material";
import cardBackImage from "../../../assets/card-back.png";

interface CardDrawAnimationProps {
  startBounds: DOMRect;
  endBounds: DOMRect; // Keep for compatibility but unused
  onComplete: () => void;
}

export const CardDrawAnimation = ({
  startBounds,
  onComplete,
}: CardDrawAnimationProps) => {
  const startX = startBounds.left + startBounds.width / 2;
  const startY = startBounds.top + startBounds.height / 2;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 10000,
      }}
    >
      <motion.div
        initial={{
          position: "absolute",
          left: startX - startBounds.width / 2,
          top: startY - startBounds.height / 2,
          width: startBounds.width,
          height: startBounds.height,
          opacity: 1,
        }}
        animate={{
          top: startY - startBounds.height / 2 + 200,
          opacity: 0,
        }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
        onAnimationComplete={onComplete}
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.8)",
        }}
      >
        <img
          src={cardBackImage}
          alt="Drawing card"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </motion.div>
    </Box>
  );
};
