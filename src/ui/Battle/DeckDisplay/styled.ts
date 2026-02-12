import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

export const DeckContainerStyled = styled(Box)(() => ({
  position: "relative",
  width: "120px",
  height: "168px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

export const DeckCardStyled = styled(Box)(() => ({
  position: "absolute",
  width: "100%",
  height: "100%",
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.6)",
  transition: "all 0.3s ease",
  userSelect: "none",
  pointerEvents: "none",

  "& img": {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
}));

export const EmptyDeckStyled = styled(Box)(() => ({
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
