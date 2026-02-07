import { useCallback } from "react";
import { GameState } from "../battle/GameState";
import { BattleEngine } from "../battle/BattleEngine";
import { useAppDispatch } from "../store/hooks";
import { openModal, closeModal } from "../store/uiSlice";

interface UseCreatureActionsProps {
  engine: BattleEngine | null;
  gameState: GameState | null;
  checkNeedsToDraw: () => boolean;
  showDrawReminderModal: () => void;
  toggleCreatureMode: (playerIndex: 0 | 1, lane: number) => boolean;
}

export const useCreatureActions = ({
  engine,
  gameState,
  checkNeedsToDraw,
  showDrawReminderModal,
  toggleCreatureMode,
}: UseCreatureActionsProps) => {
  const dispatch = useAppDispatch();

  const handleToggleMode = useCallback(
    (lane: number) => {
      if (checkNeedsToDraw()) {
        showDrawReminderModal();
        return;
      }
      if (!gameState) return;
      toggleCreatureMode(gameState.activePlayer, lane);
    },
    [checkNeedsToDraw, showDrawReminderModal, gameState, toggleCreatureMode],
  );

  const handleFlipFaceUp = useCallback(
    (lane: number) => {
      if (checkNeedsToDraw()) {
        showDrawReminderModal();
        return;
      }
      if (!gameState || !engine) return;
      const player1 = gameState.players[0];
      const creature = player1.lanes[lane];
      if (!creature || !creature.isFaceDown) return;

      dispatch(
        openModal({
          title: "Flip Creature Face-Up",
          message: `Do you want to flip ${creature.name} face-up? This action cannot be reversed.`,
          onConfirm: () => {
            engine.flipCreatureFaceUp(gameState.activePlayer, lane);
            dispatch(closeModal());
          },
        }),
      );
    },
    [checkNeedsToDraw, showDrawReminderModal, gameState, engine, dispatch],
  );

  return {
    handleToggleMode,
    handleFlipFaceUp,
  };
};
