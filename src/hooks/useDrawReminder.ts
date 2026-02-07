import { useCallback } from "react";
import { GameState } from "../battle/GameState";
import { useAppDispatch } from "../store/hooks";
import { openModal, closeModal } from "../store/uiSlice";

interface UseDrawReminderProps {
  gameState: GameState | null;
  handleDraw: () => void;
}

export const useDrawReminder = ({
  gameState,
  handleDraw,
}: UseDrawReminderProps) => {
  const dispatch = useAppDispatch();

  const checkNeedsToDraw = useCallback((): boolean => {
    if (!gameState) return false;
    // Check if it's the current player's turn and they haven't drawn yet
    return (
      gameState.activePlayer === 0 &&
      !gameState.hasDrawnThisTurn &&
      gameState.phase === "DRAW"
    );
  }, [gameState]);

  const showDrawReminderModal = useCallback(() => {
    dispatch(
      openModal({
        title: "Draw Required",
        message: "You must draw a card before taking any actions this turn.",
        onConfirm: () => {
          handleDraw();
          dispatch(closeModal());
        },
      }),
    );
  }, [dispatch, handleDraw]);

  return {
    checkNeedsToDraw,
    showDrawReminderModal,
  };
};
