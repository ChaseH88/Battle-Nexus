import { useCallback, useRef, useEffect } from "react";
import { GameState } from "../battle/GameState";
import { BattleEngine } from "../battle/BattleEngine";
import { getEffectiveStatsFromActiveEffects } from "../battle/MomentumBuff";
import { CardInterface } from "../cards/types";

interface UseAttackAnimationProps {
  engine: BattleEngine | null;
  gameState: GameState | null;
  queueAttack: (
    attackerCard: CardInterface,
    attackerElement: HTMLElement,
    defenderElement: HTMLElement,
    damageToDefender: number,
    damageToAttacker: number,
    onComplete: () => void,
  ) => void;
}

export const useAttackAnimation = ({
  engine,
  gameState,
  queueAttack,
}: UseAttackAnimationProps) => {
  // Ref to store AI attack animation callback - needs to be stable and have access to latest state
  const aiAttackAnimationCallbackRef =
    useRef<(attackerLane: number, targetLane: number | null) => Promise<void>>(
      undefined,
    );

  // Create stable AI attack animation callback
  const aiAttackAnimationCallback = useCallback(
    async (attackerLane: number, targetLane: number | null): Promise<void> => {
      // Query DOM for attacker element (AI is player 1, opponent board)
      const attackerElement = document.querySelector(
        `[data-testid="opponent-creature-lane-${attackerLane}"] > div`,
      ) as HTMLElement | null;

      // Query DOM for defender element (player is player 0)
      const defenderElement =
        targetLane !== null
          ? (document.querySelector(
              `[data-testid="creature-lane-${targetLane}"] > div`,
            ) as HTMLElement | null)
          : null;

      if (!attackerElement || !gameState) {
        // Fallback: execute attack without animation
        if (engine) {
          engine.attack(
            1,
            attackerLane,
            targetLane === null ? undefined : targetLane,
          );
        }
        return;
      }

      const player2 = gameState.players[1]; // AI
      const player1 = gameState.players[0]; // Human
      const attackerCard = player2.lanes[attackerLane];
      const defenderCard =
        targetLane !== null ? player1.lanes[targetLane] : null;

      if (!attackerCard) {
        return;
      }

      // Calculate damage using effective stats with all active buffs
      let damageToDefender = 0;
      let damageToAttacker = 0;

      // Get effective stats with all active buffs (momentum + other effects)
      const attackerStats = getEffectiveStatsFromActiveEffects(
        attackerCard,
        gameState.activeEffects,
        1,
      );

      if (defenderCard && defenderElement) {
        const defenderStats = getEffectiveStatsFromActiveEffects(
          defenderCard,
          gameState.activeEffects,
          0,
        );

        // Combat damage calculation
        if (attackerCard.mode === "ATTACK" && defenderCard.mode === "ATTACK") {
          damageToDefender = attackerStats.atk;
          damageToAttacker = Math.max(0, defenderStats.atk - attackerStats.def);
        } else if (
          attackerCard.mode === "ATTACK" &&
          defenderCard.mode === "DEFENSE"
        ) {
          damageToDefender = Math.max(0, attackerStats.atk - defenderStats.def);
          damageToAttacker = 0;
        }
      } else {
        // Direct attack
        damageToDefender = attackerStats.atk;
        damageToAttacker = 0;
      }

      // Queue animation and wait for completion
      return new Promise<void>((resolve) => {
        // If no defender element (direct attack), use player's board center as target
        const targetElement =
          defenderElement ||
          (document.querySelector(
            '[data-testid="creature-lane-0"]',
          ) as HTMLElement);

        if (targetElement) {
          queueAttack(
            attackerCard,
            attackerElement,
            targetElement,
            damageToDefender,
            damageToAttacker,
            () => {
              // Execute the actual attack after animation
              if (engine) {
                engine.attack(
                  1,
                  attackerLane,
                  targetLane === null ? undefined : targetLane,
                );
              }
              resolve();
            },
          );
        } else {
          // Fallback
          if (engine) {
            engine.attack(
              1,
              attackerLane,
              targetLane === null ? undefined : targetLane,
            );
          }
          resolve();
        }
      });
    },
    [engine, gameState, queueAttack],
  );

  // Update ref whenever callback changes
  useEffect(() => {
    aiAttackAnimationCallbackRef.current = aiAttackAnimationCallback;
  }, [aiAttackAnimationCallback]);

  return {
    aiAttackAnimationCallback,
    aiAttackAnimationCallbackRef,
  };
};
