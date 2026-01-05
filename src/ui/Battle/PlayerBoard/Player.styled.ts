import { styled, Box } from "@mui/material";

interface PlayerContainerProps {
  isOpponent?: boolean;
}

export const PlayerContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isOpponent",
})<PlayerContainerProps>(({ isOpponent }) => ({
  position: "fixed",
  ...(isOpponent
    ? { right: "8px", top: "8px" }
    : { left: "8px", bottom: "8px" }),
  zIndex: 1000,
  background:
    "linear-gradient(135deg, rgba(20, 30, 40, 0.95) 0%, rgba(10, 20, 30, 0.95) 100%)",
  border: "2px solid rgba(34, 211, 238, 0.4)",
  borderRadius: "3px",
  padding: "5px 10px",
  marginBottom: "20px",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
}));

export const PlayerContent = styled(Box)({
  position: "relative",
  zIndex: 2,
});

export const PlayerName = styled(Box)({
  fontSize: "1.1rem",
  fontWeight: "bold",
  color: "#ffffff",
  marginBottom: "0",
  textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
});

export const LifePointsContainer = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "0",
});

interface LifePointsTextProps {
  lifePointsColor?: string;
}

export const LifePointsText = styled(Box, {
  shouldForwardProp: (prop) => prop !== "lifePointsColor",
})<LifePointsTextProps>(({ lifePointsColor }) => ({
  fontSize: ".9rem",
  fontWeight: "bold",
  color: lifePointsColor || "#ffffff",
  textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
  position: "relative",
  right: "2px",
}));

export const MomentumBarContainer = styled(Box)({
  display: "inline-flex",
  gap: "4.5px",
  padding: "4px 5px",
  background: "rgba(0, 0, 0, 0.6)",
  borderRadius: "4px",
  border: "2px solid rgba(255, 255, 255, 0.15)",
  boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.5)",
});

interface MomentumBoxProps {
  isEmpty: boolean;
  boxColor: string;
}

export const getMomentumBoxStyles = ({
  isEmpty,
  boxColor,
}: MomentumBoxProps) => ({
  width: "12px",
  height: "16px",
  borderRadius: "2px",
  border: isEmpty
    ? "1px solid rgba(255, 255, 255, 0.1)"
    : "2px solid rgba(255, 255, 255, 0.3)",
  boxShadow: isEmpty
    ? "inset 0 2px 5px rgba(0, 0, 0, 0.6)"
    : `0 0 12px ${boxColor}99, inset 0 1px 3px rgba(255, 255, 255, 0.4)`,
});

export const getMomentumBoxAnimation = (index: number, boxColor: string) => ({
  initial: { scale: 0.5, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    skewX: -12,
    backgroundColor: boxColor,
  },
  transition: {
    duration: 0.4,
    delay: index * 0.04,
    type: "spring" as const,
    stiffness: 200,
  },
});

// Legacy styles for PlayerBoard
export const PlayerBoardContainer = styled(Box)<{ isopponent?: string }>(
  ({ isopponent }) => ({
    background: "rgba(0, 0, 0, 0.2)",
    borderRadius: "15px",
    padding: "20px",
    marginBottom: "20px",
    border: `2px solid ${
      isopponent === "true"
        ? "rgba(255, 100, 100, 0.5)"
        : "rgba(100, 255, 100, 0.5)"
    }`,
    position: "relative",
  })
);

export const PlayerInfo = styled(Box)(() => ({
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  background: "rgba(0, 0, 0, 0.3)",
  padding: "15px",
  borderRadius: "10px",
  marginBottom: "15px",
  flexWrap: "wrap",
  gap: "10px",
  position: "relative",
}));

export const PlayerStat = styled(Box)(() => ({
  fontSize: "1.1rem",
  padding: "5px 15px",
  background: "rgba(255, 255, 255, 0.1)",
  borderRadius: "5px",
  color: "#fff",
  "&.kos": {
    color: "#ffd700",
    fontWeight: "bold",
  },
  "&.hp": {
    color: "#ff6b6b",
    fontWeight: "bold",
  },
}));
