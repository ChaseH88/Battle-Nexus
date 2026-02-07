import { useCallback } from "react";
import { GameState } from "../battle/GameState";
import { CardInterface } from "../cards/types";
import { useAppDispatch } from "../store/hooks";
import { openCardDetailModal } from "../store/uiSlice";

interface UseCardDetailModalsProps {
  gameState: GameState | null;
}

export const useCardDetailModals = ({
  gameState,
}: UseCardDetailModalsProps) => {
  const dispatch = useAppDispatch();

  const handleCreatureDoubleClick = useCallback(
    (lane: number, playerIndex: 0 | 1) => {
      if (!gameState) return;
      const player = gameState.players[playerIndex];
      const card = player.lanes[lane];
      if (!card) return;

      // Get active effects that affect this card
      const cardEffects = gameState.activeEffects.filter((effect) =>
        effect.affectedCardIds?.includes(card.instanceId),
      );

      dispatch(
        openCardDetailModal({
          card,
          activeEffects: cardEffects,
        }),
      );
    },
    [gameState, dispatch],
  );

  const handleSupportDoubleClick = useCallback(
    (slot: number, playerIndex: 0 | 1) => {
      if (!gameState) return;
      const player = gameState.players[playerIndex];
      const card = player.support[slot];
      if (!card) return;

      // Get active effects that affect this card
      const cardEffects = gameState.activeEffects.filter((effect) =>
        effect.affectedCardIds?.includes(card.instanceId),
      );

      dispatch(
        openCardDetailModal({
          card,
          activeEffects: cardEffects,
        }),
      );
    },
    [gameState, dispatch],
  );

  const handleHandCardDoubleClick = useCallback(
    (card: CardInterface) => {
      // Hand cards don't have active effects on them yet
      dispatch(
        openCardDetailModal({
          card,
          activeEffects: [],
        }),
      );
    },
    [dispatch],
  );

  return {
    handleCreatureDoubleClick,
    handleSupportDoubleClick,
    handleHandCardDoubleClick,
  };
};
