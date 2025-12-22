import { GameState } from "../../../battle/GameState";
import { ControlsContainer, ControlButton } from "./styled";

interface ControlsProps extends Pick<GameState, "phase"> {
  isGameOver: boolean;
  handleDraw: () => void;
  handleEndTurn: () => void;
  startNewGame: () => void;
  deckSize: number;
}

export const Controls = ({
  phase,
  isGameOver,
  handleDraw,
  handleEndTurn,
  startNewGame,
  deckSize,
}: ControlsProps) => (
  <ControlsContainer>
    <ControlButton
      onClick={handleDraw}
      disabled={isGameOver || phase !== "DRAW" || deckSize === 0}
      highlight={phase === "DRAW" && deckSize > 0}
    >
      {phase === "DRAW" && deckSize === 0
        ? "No Cards to Draw"
        : phase === "DRAW"
        ? "⚠️ Draw Card (Required)"
        : "Draw Card"}
    </ControlButton>
    <ControlButton onClick={handleEndTurn} disabled={isGameOver}>
      End Turn
    </ControlButton>
    <ControlButton onClick={startNewGame}>New Game</ControlButton>
  </ControlsContainer>
);
