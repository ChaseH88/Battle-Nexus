import {
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
  Button,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

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

const WelcomeContainer = styled(Box)(() => ({
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

const LogoText = styled(Typography)(({ theme }) => ({
  fontSize: "clamp(3rem, 12vw, 8rem)",
  fontWeight: 700,
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  marginBottom: theme.spacing(6),
  animation: `${fadeIn} 1s ease-out`,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
}));

const LoaderContainer = styled(Box)(({ theme }) => ({
  width: "min(400px, 80vw)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(3),
  animation: `${fadeIn} 1s ease-out 0.3s backwards`,
}));

const LoadingText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "1rem",
  fontWeight: 300,
  animation: `${pulse} 2s ease-in-out infinite`,
}));

const ProgressBarContainer = styled(Box)({
  width: "100%",
  position: "relative",
});

const ProgressText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: "0.875rem",
  marginTop: theme.spacing(1),
  textAlign: "center",
}));

const StartButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(1.5, 6),
  fontSize: "1.25rem",
  fontWeight: 700,
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#fff",
  border: "none",
  borderRadius: theme.spacing(1),
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  cursor: "pointer",
  transition: "all 0.3s ease",
  animation: `${fadeIn} 0.5s ease-out`,
  "&:hover": {
    background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
    transform: "translateY(-2px)",
    boxShadow: "0 8px 20px rgba(102, 126, 234, 0.4)",
  },
  "&:active": {
    transform: "translateY(0)",
  },
}));

interface WelcomeScreenProps {
  progress: number;
  error?: string | null;
  onStart?: () => void;
}

/**
 * Welcome screen displayed while assets are loading
 * Shows the Nexis logo with an animated loader and progress bar
 * Once complete, shows a start button for the user to enter the game
 */
export const WelcomeScreen = ({
  progress,
  error,
  onStart,
}: WelcomeScreenProps) => {
  const isComplete = progress === 100 && !error;

  return (
    <WelcomeContainer>
      <LogoText variant="h1">Nexis</LogoText>

      <LoaderContainer>
        {error ? (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        ) : isComplete ? (
          <>
            <Typography
              sx={{
                color: "text.secondary",
                fontSize: "1.2rem",
                fontWeight: 300,
                marginBottom: 2,
              }}
            >
              Ready to play
            </Typography>
            <StartButton onClick={onStart} variant="contained">
              Start Game
            </StartButton>
          </>
        ) : (
          <>
            <CircularProgress
              size={60}
              thickness={4}
              sx={{
                color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              }}
            />
            <LoadingText>Loading game assets...</LoadingText>

            <ProgressBarContainer>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 4,
                    background:
                      "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                  },
                }}
              />
              <ProgressText variant="caption">{progress}%</ProgressText>
            </ProgressBarContainer>
          </>
        )}
      </LoaderContainer>
    </WelcomeContainer>
  );
};
