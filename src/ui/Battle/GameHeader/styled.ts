import { styled } from "@mui/material/styles";
import { Box, Button, Typography } from "@mui/material";

export const GameHeaderContainer = styled(Box)(() => ({
  textAlign: "center",
  marginBottom: "30px",
  background: "rgba(0, 0, 0, 0.3)",
  padding: "20px",
  borderRadius: "10px",
}));

export const GameTitle = styled(Typography)(() => ({
  fontSize: "2.5rem",
  marginBottom: "10px",
  textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
  fontWeight: "bold",
  color: "#fff",
}));

export const GameOverBox = styled(Box)(() => ({
  background: "rgba(255, 215, 0, 0.2)",
  padding: "20px",
  borderRadius: "10px",
  border: "2px solid gold",
}));

export const GameOverTitle = styled(Typography)(() => ({
  marginBottom: "15px",
  color: "gold",
  fontSize: "1.75rem",
  fontWeight: "bold",
}));

export const NewGameButton = styled(Button)(() => ({
  background: "linear-gradient(145deg, #4299e1, #3182ce)",
  color: "white",
  padding: "12px 30px",
  fontSize: "1rem",
  borderRadius: "8px",
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "1px",
  "&:hover": {
    background: "linear-gradient(145deg, #3182ce, #2c5282)",
    transform: "translateY(-2px)",
    boxShadow: "0 5px 15px rgba(66, 153, 225, 0.4)",
  },
}));

export const TurnInfo = styled(Box)(() => ({
  display: "flex",
  justifyContent: "center",
  gap: "30px",
  fontSize: "1.2rem",
  flexWrap: "wrap",
}));

export const PhaseIndicator = styled(Box)<{ phase?: string }>(({ phase }) => ({
  padding: "5px 15px",
  borderRadius: "5px",
  fontWeight: "bold",
  ...(phase === "draw" && {
    background: "rgba(255, 200, 0, 0.3)",
    border: "2px solid #ffc800",
    animation: "pulse 1.5s infinite",
  }),
  ...(phase === "main" && {
    background: "rgba(100, 255, 100, 0.3)",
    border: "2px solid #64ff64",
  }),
  "@keyframes pulse": {
    "0%, 100%": {
      opacity: 1,
    },
    "50%": {
      opacity: 0.6,
    },
  },
}));
