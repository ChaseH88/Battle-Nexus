import { useCallback, useRef } from "react";
import { GameState } from "../battle/GameState";
import { BattleEngine } from "../battle/BattleEngine";
import { CardInterface } from "../cards/types";
import { useAppDispatch } from "../store/hooks";
import {
  setSelectedAttacker,
  setSelectedHandCard,
  openModal,
  closeModal,
} from "../store/uiSlice";
import { getEffectiveStatsFromActiveEffects } from "../battle/MomentumBuff";

interface UseAttackHandlerProps {
  engine: BattleEngine | null;
  gameState: GameState | null;
  selectedAttacker: number | null;
  isShowingEffectNotification: boolean;
  checkNeedsToDraw: () => boolean;
  showDrawReminderModal: () => void;
  attack: (
    playerIndex: 0 | 1,
    attackerLane: number,
    targetLane?: number,
  ) => boolean;
  activateTrap: (
    playerIndex: 0 | 1,
    slot: number,
    params?: { targetLane?: number },
  ) => boolean;
  queueAttack: (
    attackerCard: CardInterface,
    attackerElement: HTMLElement,
    defenderElement: HTMLElement,
    damageToDefender: number,
    damageToAttacker: number,
    onComplete: () => void,
  ) => void;
}

export const useAttackHandler = ({
  engine,
  gameState,
  selectedAttacker,
  isShowingEffectNotification,
  checkNeedsToDraw,
  showDrawReminderModal,
  attack,
  activateTrap,
  queueAttack,
}: UseAttackHandlerProps) => {
  const dispatch = useAppDispatch();
  const attackerRef = useRef<HTMLElement | null>(null);

  const handleSelectAttacker = useCallback(
    (lane: number) => {
      if (checkNeedsToDraw()) {
        showDrawReminderModal();
        return;
      }
      if (!gameState) return;
      const player1 = gameState.players[0];
      const creature = player1.lanes[lane];
      if (!creature) return;

      // Cannot select creatures in defense mode as attackers
      if (creature.mode === "DEFENSE") {
        return;
      }

      dispatch(setSelectedAttacker(lane));
      dispatch(setSelectedHandCard(null));
    },
    [checkNeedsToDraw, showDrawReminderModal, gameState, dispatch],
  );

  const handleAttack = useCallback(
    (targetLane: number | undefined, defenderElement?: HTMLElement) => {
      if (isShowingEffectNotification) return;
      if (selectedAttacker === null || !gameState || !engine) return;

      const player1 = gameState.players[0];
      const player2 = gameState.players[1];

      // Determine defender index
      const defenderIndex = gameState.activePlayer === 0 ? 1 : 0;

      const executeAttack = () => {
        // Only animate if it's the human player's turn (player 0) and we have both elements
        if (
          gameState.activePlayer === 0 &&
          attackerRef.current &&
          defenderElement
        ) {
          const attackerCard = player1.lanes[selectedAttacker];
          const defenderCard =
            targetLane !== undefined && targetLane !== null
              ? player2.lanes[targetLane]
              : null;

          if (attackerCard) {
            // Get effective stats with all active buffs (momentum + other effects)
            const attackerStats = getEffectiveStatsFromActiveEffects(
              attackerCard,
              gameState.activeEffects,
              0,
            );

            // Calculate damage that will be dealt to defender
            let damageToDefender = 0;
            let damageToAttacker = 0; // Counter damage
            if (defenderCard) {
              const defenderStats = getEffectiveStatsFromActiveEffects(
                defenderCard,
                gameState.activeEffects,
                1,
              );

              // Combat damage calculation
              if (
                attackerCard.mode === "ATTACK" &&
                defenderCard.mode === "ATTACK"
              ) {
                // ATTACK vs ATTACK: both deal damage, calculate net counter damage
                damageToDefender = attackerStats.atk;
                // Counter damage is defender's ATK minus attacker's DEF
                damageToAttacker = Math.max(
                  0,
                  defenderStats.atk - attackerStats.def,
                );
              } else if (
                attackerCard.mode === "ATTACK" &&
                defenderCard.mode === "DEFENSE"
              ) {
                // ATTACK vs DEFENSE: only attacker deals damage (ATK - DEF)
                damageToDefender = Math.max(
                  0,
                  attackerStats.atk - defenderStats.def,
                );
                damageToAttacker = 0;
              }
            } else {
              // Direct attack
              damageToDefender = attackerStats.atk;
              damageToAttacker = 0;
            }

            // Store refs for animation then clear immediately to prevent re-triggers
            const attackerElement = attackerRef.current;
            attackerRef.current = null; // Clear immediately!

            // Queue attack animation with callback to execute attack after animation
            queueAttack(
              attackerCard,
              attackerElement,
              defenderElement,
              damageToDefender,
              damageToAttacker,
              () => {
                attack(gameState.activePlayer, selectedAttacker, targetLane);
                dispatch(setSelectedAttacker(null));
              },
            );
            return;
          }
        }
        // No animation - execute attack immediately
        // Clear refs
        attackerRef.current = null;
        attack(gameState.activePlayer, selectedAttacker, targetLane);
        dispatch(setSelectedAttacker(null));
      };

      // If defender is human (player 0) and they have face-down traps, prompt them
      const traps = engine?.getActivatableTraps(defenderIndex) || [];
      if (traps.length > 0 && defenderIndex === 0) {
        const trap = traps[0];
        dispatch(
          openModal({
            title: "Trap Activation",
            message: `Your opponent is attacking! Activate ${trap.card.name}?`,
            onConfirm: () => {
              // Activate the trap (will resolve and be discarded)
              activateTrap(defenderIndex, trap.slot, { targetLane });
              dispatch(closeModal());
              // Proceed with the attack after trap resolution
              executeAttack();
            },
            onCancel: () => {
              dispatch(closeModal());
              // Don't activate trap, just proceed with attack
              executeAttack();
            },
          }),
        );
        return;
      }

      // No trap prompt needed — proceed with attack
      executeAttack();
    },
    [
      isShowingEffectNotification,
      selectedAttacker,
      gameState,
      engine,
      attack,
      activateTrap,
      queueAttack,
      dispatch,
    ],
  );

  const setAttackerRef = useCallback((element: HTMLElement | null) => {
    attackerRef.current = element;
  }, []);

  return {
    handleSelectAttacker,
    handleAttack,
    setAttackerRef,
  };
};
