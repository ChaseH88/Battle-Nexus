import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

export const DeckContainer = styled(Box)(() => ({
  position: "relative",
  width: "120px",
  height: "168px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "default",
}));

export const DeckCard = styled(Box)(() => ({
  position: "absolute",
  width: "100%",
  height: "100%",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.6)",
  transition: "all 0.3s ease",

  "& img": {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
}));

export const CardCount = styled(Box)(() => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  zIndex: 10,
  fontSize: "3.5rem",
  fontWeight: 900,
  color: "#fff",
  "-webkit-text-stroke": "1px black",
  "text-stroke": "1px black",
  pointerEvents: "none",
  background: "linear-gradient(135deg, #fff 0%, #fff 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))",
}));

export const EmptyDeck = styled(Box)(() => ({
  width: "120px",
  height: "168px",
  border: "3px dashed rgba(255, 255, 255, 0.3)",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0, 0, 0, 0.3)",

  "& .empty-text": {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "rgba(255, 255, 255, 0.4)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    textAlign: "center",
  },
}));
