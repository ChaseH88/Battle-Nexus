import { GameState } from "../../../battle/GameState";
import { ControlsContainer, ControlButton } from "./styled";

interface ControlsProps extends Pick<GameState, "phase"> {
  isGameOver: boolean;
  handleDraw: () => void;
  handleEndTurn: () => void;
  startNewGame: () => void;
}

export const Controls = ({
  phase,
  isGameOver,
  handleDraw,
  handleEndTurn,
  startNewGame,
}: ControlsProps) => (
  <ControlsContainer>
    <ControlButton
      onClick={handleDraw}
      disabled={isGameOver || phase !== "DRAW"}
      highlight={phase === "DRAW"}
    >
      {phase === "DRAW" ? "⚠️ Draw Card (Required)" : "Draw Card"}
    </ControlButton>
    <ControlButton onClick={handleEndTurn} disabled={isGameOver}>
      End Turn
    </ControlButton>
    <ControlButton onClick={startNewGame}>New Game</ControlButton>
  </ControlsContainer>
);
