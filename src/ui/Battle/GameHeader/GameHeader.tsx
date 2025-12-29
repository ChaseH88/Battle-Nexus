import {
  GameHeaderContainer,
  GameOverBox,
  GameOverTitle,
  NewGameButton,
  TurnInfo,
  PhaseIndicator,
} from "./styled";
import logo from "../../../assets/battle-nexus.png";
import { Box } from "@mui/material";

interface GameHeaderProps {
  isGameOver: boolean;
  winnerName: string;
  turn: number;
  currentPlayerName: string;
  phase: string;
  onNewGame: () => void;
}

export const GameHeader = ({
  isGameOver,
  winnerName,
  turn,
  currentPlayerName,
  phase,
  onNewGame,
}: GameHeaderProps) => (
  <GameHeaderContainer>
    <Box mb={2}>
      <img
        src={logo}
        alt="Battle Nexus Logo"
        style={{ height: 100, border: "1px solid #ffffff30" }}
      />
    </Box>
    {isGameOver ? (
      <GameOverBox>
        <GameOverTitle variant="h2" data-testid="winner-message">
          Game Over! {winnerName} Wins!
        </GameOverTitle>
        <NewGameButton onClick={onNewGame}>New Game</NewGameButton>
      </GameOverBox>
    ) : (
      <TurnInfo>
        <span>Turn: {turn}</span>
        <span>Active: {currentPlayerName}</span>
        <PhaseIndicator phase={phase.toLowerCase()}>
          Phase: {phase}
        </PhaseIndicator>
      </TurnInfo>
    )}
  </GameHeaderContainer>
);
