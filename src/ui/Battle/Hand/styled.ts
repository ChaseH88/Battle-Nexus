import { styled, keyframes } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

export const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px rgba(34, 211, 238, 0.4), 0 0 10px rgba(34, 211, 238, 0.3);
  }
  50% {
    box-shadow: 0 0 15px rgba(34, 211, 238, 0.8), 0 0 25px rgba(34, 211, 238, 0.5);
  }
`;

export const HandZone = styled(Box)(() => ({
  background: "rgba(0, 0, 0, 0.3)",
  borderRadius: "15px",
  padding: "20px",
  marginBottom: "20px",
  position: "relative",
  zIndex: 200,
  overflow: "visible",
}));

export const HandTitle = styled(Typography)(() => ({
  marginBottom: "15px",
  fontSize: "1.2rem",
  color: "#fff",
  fontWeight: "bold",
}));

export const HandCards = styled(Box)(() => ({
  display: "flex",
  justifyContent: "center",
  gap: "25px",
  padding: "10px",
  "&::-webkit-scrollbar": {
    height: "8px",
  },
  "&::-webkit-scrollbar-track": {
    background: "rgba(0, 0, 0, 0.2)",
    borderRadius: "10px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(255, 255, 255, 0.3)",
    borderRadius: "10px",
    "&:hover": {
      background: "rgba(255, 255, 255, 0.5)",
    },
  },
}));
