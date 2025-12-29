import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

export const GameLogContainer = styled(Box)(()  => ({
  position: "relative",
  background:
    "linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)",
  borderRadius: "16px",
  padding: "25px",
  maxHeight: "350px",
  overflowY: "auto",
  border: "2px solid rgba(99, 102, 241, 0.3)",
  boxShadow:
    "0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
  "&::-webkit-scrollbar": {
    width: "8px",
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

export const GameLogTitle = styled(Typography)(()  => ({
  marginBottom: "18px",
  fontSize: "1.4rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "2px",
  background: "linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
}));

export const LogEntries = styled(Box)(()  => ({
  display: "flex",
  flexDirection: "column",
  gap: "10px",
}));

export const LogEntry = styled(Box)(()  => ({
  padding: "12px 16px",
  background: "rgba(0, 0, 0, 0.3)",
  borderLeft: "4px solid #6366f1",
  borderRadius: "8px",
  fontSize: "0.95rem",
  fontFamily: "'Courier New', monospace",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
  transition: "all 0.2s",
  color: "#fff",
  "&:hover": {
    background: "rgba(0, 0, 0, 0.4)",
    borderLeftColor: "#818cf8",
    transform: "translateX(4px)",
  },
}));
