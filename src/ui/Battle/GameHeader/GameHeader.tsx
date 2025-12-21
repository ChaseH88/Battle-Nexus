import {
  GameHeaderContainer,
  GameTitle,
  GameOverBox,
  GameOverTitle,
  NewGameButton,
  TurnInfo,
  PhaseIndicator,
} from "./styled";

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
    <GameTitle variant="h1">Battle Nexus</GameTitle>
    {isGameOver ? (
      <GameOverBox>
        <GameOverTitle variant="h2">
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
