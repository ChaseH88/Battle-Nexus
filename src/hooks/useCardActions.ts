import { useCallback } from "react";
import { GameState } from "../battle/GameState";
import { BattleEngine } from "../battle/BattleEngine";
import { CardInterface, CardType } from "../cards/types";
import { useAppDispatch } from "../store/hooks";
import {
  setSelectedHandCard,
  closePlayCreatureModal,
  openPlayCreatureModal,
  openModal,
  closeModal,
  openTargetSelectModal,
} from "../store/uiSlice";
import { getEffectMetadata } from "../effects/metadata";
import { effectsRegistry } from "../effects/registry";

interface UseCardActionsProps {
  engine: BattleEngine | null;
  gameState: GameState | null;
  selectedHandCard: string | null;
  isShowingEffectNotification: boolean;
  checkNeedsToDraw: () => boolean;
  showDrawReminderModal: () => void;
  playCreature: (
    playerIndex: 0 | 1,
    lane: number,
    cardId: string,
    faceDown?: boolean,
    mode?: "ATTACK" | "DEFENSE",
  ) => boolean;
  playSupport: (playerIndex: 0 | 1, slot: number, cardId: string) => boolean;
  activateSupport: (playerIndex: 0 | 1, slot: number) => boolean;
  refresh: () => void;
  queueActivation: (
    card: CardInterface,
    element: HTMLElement,
    onComplete: () => void,
  ) => void;
}

export const useCardActions = ({
  engine,
  gameState,
  selectedHandCard,
  isShowingEffectNotification,
  checkNeedsToDraw,
  showDrawReminderModal,
  playCreature,
  playSupport,
  activateSupport,
  refresh,
  queueActivation,
}: UseCardActionsProps) => {
  const dispatch = useAppDispatch();

  const handlePlayCreature = useCallback(
    (
      lane: number,
      faceDown: boolean = false,
      mode: "ATTACK" | "DEFENSE" = "ATTACK",
    ) => {
      if (isShowingEffectNotification || !gameState) return;
      if (!selectedHandCard) return;
      const player1 = gameState.players[0];
      const card = player1.hand.find((c) => c.id === selectedHandCard);
      if (card?.type === CardType.Creature) {
        const success = playCreature(
          gameState.activePlayer,
          lane,
          selectedHandCard,
          faceDown,
          mode,
        );
        if (success) {
          dispatch(setSelectedHandCard(null));
          dispatch(closePlayCreatureModal());
        }
      }
    },
    [
      isShowingEffectNotification,
      gameState,
      selectedHandCard,
      playCreature,
      dispatch,
    ],
  );

  const handlePlayCreatureClick = useCallback(
    (lane: number) => {
      if (isShowingEffectNotification || !gameState) return;
      if (checkNeedsToDraw()) {
        showDrawReminderModal();
        return;
      }
      if (!selectedHandCard) return;
      const player1 = gameState.players[0];
      const card = player1.hand.find((c) => c.id === selectedHandCard);
      if (card?.type === CardType.Creature) {
        dispatch(
          openPlayCreatureModal({
            lane,
            creatureName: card.name,
          }),
        );
      }
    },
    [
      isShowingEffectNotification,
      gameState,
      selectedHandCard,
      checkNeedsToDraw,
      showDrawReminderModal,
      dispatch,
    ],
  );

  const handlePlaySupport = useCallback(
    (slot: number) => {
      if (isShowingEffectNotification || !gameState) return;
      if (checkNeedsToDraw()) {
        showDrawReminderModal();
        return;
      }
      if (!selectedHandCard) return;
      const player1 = gameState.players[0];
      const card = player1.hand.find((c) => c.id === selectedHandCard);
      if (card?.type === CardType.Action || card?.type === CardType.Trap) {
        const success = playSupport(0, slot, selectedHandCard);
        if (success) {
          dispatch(setSelectedHandCard(null));
        }
      }
    },
    [
      isShowingEffectNotification,
      gameState,
      selectedHandCard,
      checkNeedsToDraw,
      showDrawReminderModal,
      playSupport,
      dispatch,
    ],
  );

  const handleActivateSupport = useCallback(
    (slot: number, element?: HTMLElement) => {
      if (isShowingEffectNotification || !gameState || !engine) return;
      if (checkNeedsToDraw()) {
        showDrawReminderModal();
        return;
      }
      const player1 = gameState.players[0];
      const card = player1.support[slot];
      if (!card || card.isActive) return;

      // Check if card is face down - must flip and activate
      if (card.isFaceDown) {
        // Check if this is a TRAP card type - cannot be manually activated
        if (card.type === CardType.Trap) {
          dispatch(
            openModal({
              title: "Cannot Activate",
              message: `${card.name} is a Trap card and can only be activated when its trigger condition is met.`,
              onConfirm: () => {
                dispatch(closeModal());
              },
            }),
          );
          return;
        }

        // Check if this card has a reactive trigger - cannot be manually activated
        if (card.effectId) {
          const effectDef = effectsRegistry[card.effectId];
          const reactiveTriggers = [
            "ON_DEFEND",
            "ON_ATTACK",
            "ON_DESTROY",
            "ON_DRAW",
          ];
          if (
            effectDef &&
            effectDef.trigger &&
            reactiveTriggers.includes(effectDef.trigger)
          ) {
            dispatch(
              openModal({
                title: "Cannot Activate",
                message: `${card.name} can only be activated when its trigger condition is met (${effectDef.trigger}).`,
                onConfirm: () => {
                  dispatch(closeModal());
                },
              }),
            );
            return;
          }
        }

        // Get metadata once and use it for all checks
        const metadata = card.effectId
          ? getEffectMetadata(card.effectId)
          : null;

        // Handle targeting config - could be object or function
        const targeting = metadata?.targeting;
        const targetingConfig =
          typeof targeting === "function"
            ? targeting(gameState, 0).config
            : targeting;
        const requiresTargeting = targetingConfig?.required ?? false;

        if (card.effectId && requiresTargeting) {
          // Check if activation is possible
          const activationCheck = metadata?.canActivate
            ? metadata.canActivate(gameState, 0)
            : { canActivate: true };

          if (!activationCheck.canActivate) {
            dispatch(
              openModal({
                title: "Cannot Activate",
                message: `${card.name}: ${activationCheck.reason}. The card will be discarded.`,
                onConfirm: () => {
                  engine.activateSupport(0 as 0 | 1, slot);
                  refresh();
                  dispatch(closeModal());
                },
              }),
            );
            return;
          }

          // Get valid targets
          const options = metadata?.getValidTargets?.(gameState, 0) || [];

          if (options.length === 0) {
            dispatch(
              openModal({
                title: "Cannot Activate",
                message: `${card.name} has no valid targets. The card will be discarded.`,
                onConfirm: () => {
                  engine.activateSupport(0 as 0 | 1, slot);
                  refresh();
                  dispatch(closeModal());
                },
              }),
            );
            return;
          }

          // First show confirmation modal, then target selection
          dispatch(
            openModal({
              title: "Activate Card",
              message: `Flip ${card.name} face-up and activate it?`,
              onConfirm: () => {
                dispatch(closeModal());
                dispatch(
                  openTargetSelectModal({
                    title: targetingConfig?.description || "Select target",
                    message: `Choose a target for ${card.name}`,
                    options,
                    onConfirm: (targetValue: number) => {
                      const eventData: any = {};

                      if (targetingConfig?.targetType === "ENEMY_SUPPORT") {
                        eventData.targetPlayer = 1;
                        eventData.targetLane = targetValue;
                      } else if (
                        targetingConfig?.targetType?.includes("CREATURE")
                      ) {
                        eventData.targetLane = targetValue;
                        eventData.lane = targetValue;
                      }

                      if (element) {
                        queueActivation(card, element, () => {
                          engine.activateSupport(0 as 0 | 1, slot, eventData);
                          refresh();
                        });
                      } else {
                        engine.activateSupport(0 as 0 | 1, slot, eventData);
                        refresh();
                      }
                    },
                  }),
                );
              },
            }),
          );
          return;
        }

        // Standard activation (no targeting required)
        dispatch(
          openModal({
            title: "Activate Card",
            message: `Flip ${card.name} face-up and activate it?`,
            onConfirm: () => {
              if (element) {
                queueActivation(card, element, () => {
                  activateSupport(0, slot);
                });
              } else {
                activateSupport(0, slot);
              }
              dispatch(closeModal());
            },
          }),
        );
      }
    },
    [
      isShowingEffectNotification,
      gameState,
      engine,
      checkNeedsToDraw,
      showDrawReminderModal,
      activateSupport,
      refresh,
      queueActivation,
      dispatch,
    ],
  );

  return {
    handlePlayCreature,
    handlePlayCreatureClick,
    handlePlaySupport,
    handleActivateSupport,
  };
};
