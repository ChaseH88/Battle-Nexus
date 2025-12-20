import { GameState } from "../../../battle/GameState";

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
  <div className="controls">
    <button
      onClick={handleDraw}
      disabled={isGameOver || phase !== "DRAW"}
      className={phase === "DRAW" ? "highlight" : ""}
    >
      {phase === "DRAW" ? "⚠️ Draw Card (Required)" : "Draw Card"}
    </button>
    <button onClick={handleEndTurn} disabled={isGameOver}>
      End Turn
    </button>
    <button onClick={startNewGame}>New Game</button>
  </div>
);
