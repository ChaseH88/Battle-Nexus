import { styled } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

export const ModalOverlayStyled = styled(Box)(() => ({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backdropFilter: "blur(2px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  animation: "fadeIn 0.3s ease",
  "@keyframes fadeIn": {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
}));

export const ModalContentStyled = styled(Box)(() => ({
  background: "#010015eb",
  padding: "30px",
  boxShadow:
    "0 20px 60px rgba(0, 0, 0, 0.8), 0 0 60px rgba(251, 191, 36, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
  animation: "modalSlideIn 0.3s ease",
  "@keyframes modalSlideIn": {
    from: {
      transform: "translateY(-50px)",
      opacity: 0,
    },
    to: {
      transform: "translateY(0)",
      opacity: 1,
    },
  },
}));

export const ModalTitleStyled = styled(Typography)(() => ({
  fontSize: "2rem",
  marginBottom: "20px",
  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  textAlign: "center",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "2px",
  textShadow: "0 4px 12px rgba(251, 191, 36, 0.5)",
}));

export const ModalMessageStyled = styled(Typography)(() => ({
  fontSize: "1.25rem",
  marginBottom: "30px",
  textAlign: "center",
  lineHeight: 1.8,
  color: "#e2e8f0",
  fontWeight: 600,
}));

export const ModalActionsStyled = styled(Box)(() => ({
  display: "flex",
  gap: "18px",
  justifyContent: "center",
  flexWrap: "wrap",
}));
