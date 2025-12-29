import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
import {
  ModalOverlay,
  ModalContent,
  ModalTitle,
  ModalMessage,
  ModalButton,
} from "../Modal/styled";

export const PlayCreatureModalContent = styled(ModalContent)(() => ({
  maxWidth: "650px",
}));

export const PlayOptions = styled(Box)(() => ({
  display: "flex",
  gap: "25px",
  marginBottom: "25px",
  flexWrap: "wrap",
}));

export const PlayOptionGroup = styled(Box)(() => ({
  flex: 1,
  minWidth: "250px",
  background: "rgba(0, 0, 0, 0.4)",
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.3)",
}));

export const PlayOptionTitle = styled(Typography)(() => ({
  textAlign: "center",
  marginBottom: "18px",
  fontSize: "1.3rem",
  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "1.5px",
}));

export const PlayOptionButton = styled(ModalButton)<{
  mode?: "attack" | "defense";
}>(({ mode }) => ({
  width: "100%",
  marginBottom: "12px",
  padding: "16px",
  fontSize: "1.05rem",
  "&:last-child": {
    marginBottom: 0,
  },
  ...(mode === "attack" && {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    boxShadow: "0 4px 16px rgba(239, 68, 68, 0.4)",
    "&:hover": {
      background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
      transform: "translateY(-3px) scale(1.02)",
      boxShadow: "0 8px 24px rgba(239, 68, 68, 0.6)",
    },
  }),
  ...(mode === "defense" && {
    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    boxShadow: "0 4px 16px rgba(59, 130, 246, 0.4)",
    "&:hover": {
      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
      transform: "translateY(-3px) scale(1.02)",
      boxShadow: "0 8px 24px rgba(59, 130, 246, 0.6)",
    },
  }),
}));

export { ModalOverlay, ModalTitle, ModalMessage };

export const CancelButton = styled(ModalButton)(() => ({
  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  color: "white",
  boxShadow: "0 4px 16px rgba(239, 68, 68, 0.4)",
  "&:hover": {
    background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
    transform: "translateY(-3px) scale(1.05)",
    boxShadow: "0 8px 24px rgba(239, 68, 68, 0.6)",
  },
}));
