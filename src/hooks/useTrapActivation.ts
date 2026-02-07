import { useCallback, useRef, useEffect } from "react";
import { GameState } from "../battle/GameState";
import { BattleEngine } from "../battle/BattleEngine";
import { AIPlayer } from "../battle/AIPlayer";
import { useAppDispatch } from "../store/hooks";
import { openModal, closeModal } from "../store/uiSlice";

interface UseTrapActivationProps {
  engine: BattleEngine | null;
  gameState: GameState | null;
  ai: AIPlayer | null;
  activateTrap: (
    playerIndex: 0 | 1,
    slot: number,
    params?: { targetLane?: number },
  ) => boolean;
}

export const useTrapActivation = ({
  engine,
  gameState,
  ai,
  activateTrap,
}: UseTrapActivationProps) => {
  const dispatch = useAppDispatch();

  // Ref to store trap activation callback - needs to be stable and have access to latest state
  const trapActivationCallbackRef =
    useRef<
      (
        defenderIndex: 0 | 1,
        attackerLane: number,
        targetLane: number,
      ) => Promise<boolean>
    >(undefined);

  // Create stable trap activation callback for ON_DEFEND triggers (combat)
  const trapActivationCallback = useCallback(
    async (
      defenderIndex: 0 | 1,
      attackerLane: number,
      targetLane: number,
    ): Promise<boolean> => {
      if (!engine || !gameState) return false;

      // Get traps that activate on defend (combat)
      const traps = engine.getActivatableTraps(defenderIndex, "ON_DEFEND");
      if (!traps || traps.length === 0) return false;

      const trap = traps[0];

      // If defender is AI (player 1), let AI decide
      if (defenderIndex === 1 && ai) {
        const shouldActivate = ai.shouldActivateTrap(
          gameState,
          trap.card,
          attackerLane,
          targetLane,
        );

        if (shouldActivate) {
          activateTrap(defenderIndex, trap.slot, { targetLane });
          return true;
        }
        return false;
      }

      // If defender is human (player 0), prompt them
      if (defenderIndex === 0) {
        return new Promise<boolean>((resolve) => {
          dispatch(
            openModal({
              title: "Trap Activation",
              message: `Your opponent is attacking! Activate ${trap.card.name}?`,
              onConfirm: () => {
                // Activate trap then resolve true
                activateTrap(defenderIndex, trap.slot, { targetLane });
                dispatch(closeModal());
                resolve(true);
              },
              onCancel: () => {
                // Don't activate trap
                dispatch(closeModal());
                resolve(false);
              },
            }),
          );
        });
      }

      return false;
    },
    [engine, gameState, ai, activateTrap, dispatch],
  );

  // Update ref whenever callback changes
  useEffect(() => {
    trapActivationCallbackRef.current = trapActivationCallback;
  }, [trapActivationCallback]);

  return {
    trapActivationCallback,
    trapActivationCallbackRef,
  };
};
