import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

export const DiscardPileDisplay = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "5px",
}));

export const DiscardPileTitle = styled(Typography)(({ theme }) => ({
  fontSize: "0.9rem",
  margin: 0,
  color: "rgba(200, 200, 200, 0.9)",
}));

export const DiscardPileCards = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "3px",
  maxHeight: "80px",
  overflowY: "auto",
  background: "rgba(0, 0, 0, 0.3)",
  padding: "5px",
  borderRadius: "5px",
}));

export const DiscardPileCardMini = styled(Box)(({ theme }) => ({
  fontSize: "0.75rem",
  padding: "3px 8px",
  background: "rgba(100, 100, 100, 0.4)",
  borderRadius: "3px",
  borderLeft: "3px solid #999",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  color: "#fff",
}));
