import { styled } from "@mui/material/styles";
import { Box, Button } from "@mui/material";

export const ControlsContainer = styled(Box)(({ theme }) => ({
  position: "fixed",
  zIndex: 1000,
  bottom: "20px",
  right: "20px",
  display: "flex",
  justifyContent: "center",
  gap: "20px",
  marginBottom: "20px",
  flexWrap: "wrap",
  "@media (max-width: 768px)": {
    flexDirection: "column",
  },
}));

export const ControlButton = styled(Button)<{ highlight?: boolean }>(
  ({ theme, highlight }) => ({
    background: highlight
      ? "linear-gradient(145deg, #ffc800, #ff9800)"
      : "linear-gradient(145deg, #4299e1, #3182ce)",
    color: "white",
    padding: "12px 30px",
    fontSize: "1rem",
    borderRadius: "8px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "1px",
    transition: "all 0.3s ease",
    border: "none",
    ...(highlight && {
      animation: "pulse 1.5s infinite",
      boxShadow: "0 0 20px rgba(255, 200, 0, 0.6)",
    }),
    "&:hover": {
      background: highlight
        ? "linear-gradient(145deg, #ff9800, #ff6b00)"
        : "linear-gradient(145deg, #3182ce, #2c5282)",
      transform: "translateY(-2px)",
      boxShadow: "0 5px 15px rgba(66, 153, 225, 0.4)",
    },
    "&:disabled": {
      background: "#4a5568",
      cursor: "not-allowed",
      opacity: 0.5,
      "&:hover": {
        transform: "none",
        boxShadow: "none",
      },
    },
    "@keyframes pulse": {
      "0%, 100%": {
        opacity: 1,
      },
      "50%": {
        opacity: 0.6,
      },
    },
    "@media (max-width: 768px)": {
      width: "100%",
    },
  })
);
