import { Typography, CircularProgress, LinearProgress } from "@mui/material";
import { TextOutline } from "../Common/TextOutline";
import {
  LoaderContainer,
  LoadingText,
  ProgressBarContainer,
  ProgressText,
  WelcomeContainer,
  GameButtonStyled,
  ReadyToPlayTextStyled,
} from "./styled";

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
      <TextOutline
        text="Nexis"
        fontSize="10rem"
        color="#fff"
        fontWeight={300}
      />

      <LoaderContainer>
        {error ? (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        ) : isComplete ? (
          <>
            <ReadyToPlayTextStyled>Ready to play</ReadyToPlayTextStyled>
            <GameButtonStyled variant="primary" size="large" onClick={onStart}>
              Start Game
            </GameButtonStyled>
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
