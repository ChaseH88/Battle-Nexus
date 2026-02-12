import { Box, Typography } from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import { GameButton } from "../Common/Button";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
`;

const blink = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
`;

export const WelcomeContainer = styled(Box)(() => ({
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
  zIndex: 9999,
}));

export const LoaderContainer = styled(Box)(({ theme }) => ({
  width: "min(400px, 80vw)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(3),
  animation: `${fadeIn} 1s ease-out 0.3s backwards`,
}));

export const LoadingText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "1rem",
  fontWeight: 300,
  animation: `${pulse} 2s ease-in-out infinite`,
}));

export const ProgressBarContainer = styled(Box)({
  width: "100%",
  position: "relative",
});

export const ProgressText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "0.875rem",
  marginTop: theme.spacing(1),
  textAlign: "center",
}));

export const GameButtonStyled = styled(GameButton)(() => ({
  fontSize: "1.25rem",
  padding: "12px 24px",
  animation: `${fadeIn} 0.5s ease-out`,
}));

export const ReadyToPlayTextStyled = styled(Typography)(() => ({
  color: "#fff",
  fontSize: "1.2rem",
  fontWeight: 300,
  marginBottom: 16,
  animation: `${blink} 2s ease-in-out infinite`,
}));
