import { styled } from "@mui/material/styles";
import { Box, Button, Typography } from "@mui/material";

export const ModalOverlay = styled(Box)(() => ({
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

export const ModalContent = styled(Box)(() => ({
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

export const ModalTitle = styled(Typography)(() => ({
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

export const ModalMessage = styled(Typography)(() => ({
  fontSize: "1.25rem",
  marginBottom: "30px",
  textAlign: "center",
  lineHeight: 1.8,
  color: "#e2e8f0",
  fontWeight: 600,
}));

export const ModalActions = styled(Box)(() => ({
  display: "flex",
  gap: "18px",
  justifyContent: "center",
  flexWrap: "wrap",
}));

export const ModalButton = styled(Button)<{
  buttonType?: "confirm" | "cancel";
}>(({ buttonType = "confirm" }) => ({
  padding: "14px 36px",
  fontSize: "1.15rem",
  fontWeight: 800,
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  minWidth: "120px",
  textTransform: "uppercase",
  letterSpacing: "1.5px",
  position: "relative",
  overflow: "hidden",
  ...(buttonType === "confirm" && {
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "white",
    boxShadow: "0 4px 16px rgba(34, 197, 94, 0.4)",
    "&:hover": {
      background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
      transform: "translateY(-3px) scale(1.05)",
      boxShadow: "0 8px 24px rgba(34, 197, 94, 0.6)",
    },
  }),
  ...(buttonType === "cancel" && {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "white",
    boxShadow: "0 4px 16px rgba(239, 68, 68, 0.4)",
    "&:hover": {
      background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
      transform: "translateY(-3px) scale(1.05)",
      boxShadow: "0 8px 24px rgba(239, 68, 68, 0.6)",
    },
  }),
  "&::before": {
    content: '""',
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 0,
    height: 0,
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.3)",
    transform: "translate(-50%, -50%)",
    transition: "width 0.6s, height 0.6s",
  },
  "&:hover::before": {
    width: "300px",
    height: "300px",
  },
  "&:active": {
    transform: "translateY(-1px) scale(1.02)",
  },
}));
