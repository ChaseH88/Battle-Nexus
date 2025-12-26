import { GameState } from "../../../battle/GameState";
import { ControlsContainer, ControlButton } from "./styled";

interface ControlsProps extends Pick<GameState, "phase"> {
  isGameOver: boolean;
  handleDraw: () => void;
  handleEndTurn: () => void;
  startNewGame: () => void;
  deckSize: number;
  isPlayerTurn?: boolean;
  showEndTurnButton?: boolean;
  isShowingEffectNotification?: boolean;
}

export const Controls = ({
  phase,
  isGameOver,
  handleDraw,
  handleEndTurn,
  startNewGame,
  deckSize,
  isPlayerTurn = true,
  isShowingEffectNotification = false,
}: ControlsProps) => (
  <ControlsContainer>
    {isPlayerTurn && (
      <>
        <ControlButton
          data-testid="draw-button"
          onClick={handleDraw}
          disabled={
            isGameOver ||
            phase !== "DRAW" ||
            deckSize === 0 ||
            isShowingEffectNotification
          }
          highlight={phase === "DRAW" && deckSize > 0}
        >
          {phase === "DRAW" && deckSize === 0
            ? "Deck Empty"
            : `Draw (${deckSize})`}
        </ControlButton>
        <ControlButton
          data-testid="end-turn-button"
          onClick={handleEndTurn}
          disabled={
            isGameOver || phase === "DRAW" || isShowingEffectNotification
          }
        >
          End Turn
        </ControlButton>
      </>
    )}
    <ControlButton
      data-testid="new-game-button"
      onClick={startNewGame}
      disabled={!isPlayerTurn || isShowingEffectNotification}
    >
      New Game
    </ControlButton>
  </ControlsContainer>
);
