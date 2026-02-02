import { PlayerState } from "../../../battle/PlayerState";
import { GameState } from "../../../battle/GameState";
import { CardType } from "../../../cards/types";
import { CreatureCard } from "../../../cards/CreatureCard";
import { Card } from "../Card";
import { motion } from "framer-motion";
import {
  ZoneContainer,
  Lanes,
  Lane,
  PlayHereButton,
  AttackButton,
  AttackDirectButton,
  ToggleModeButton,
  FlipButton,
} from "./Zone.styles";
import { useRef } from "react";
import { canActivateEffect } from "../../../effects/metadata";

export interface CreatureZoneProps {
  player: PlayerState;
  gameState?: GameState; // For checking effect activation requirements
  currentPlayerState?: PlayerState; // To check attacker mode when displaying opponent board
  selectedHandCard?: string | null;
  selectedAttacker?: number | null;
  isOpponent?: boolean;
  isFirstTurn?: boolean;
  onPlayCreature?: (lane: number) => void;
  onSelectAttacker?: (lane: number) => void;
  onAttack?: (targetLane: number, defenderElement?: HTMLElement) => void;
  onToggleMode?: (lane: number) => void;
  onFlipFaceUp?: (lane: number) => void;
  onCardDoubleClick?: (lane: number) => void;
  onActivateCreatureEffect?: (lane: number, element: HTMLElement) => void; // New prop for activating creature effects
  draggedCardId?: string | null; // Track what card is being dragged
  showPlayButtons?: boolean; // Show "Play Here" buttons for accessibility
  onSetAttackerRef?: (element: HTMLElement | null) => void; // For attack animation
  playerIndex?: 0 | 1; // Player index for active effects
}

export const CreatureZone = ({
  player,
  gameState,
  currentPlayerState,
  selectedHandCard,
  selectedAttacker,
  isOpponent = false,
  showPlayButtons = false,
  isFirstTurn = false,
  onPlayCreature,
  onSelectAttacker,
  onAttack,
  onToggleMode,
  onFlipFaceUp,
  onCardDoubleClick,
  onActivateCreatureEffect,
  draggedCardId,
  onSetAttackerRef,
  playerIndex,
}: CreatureZoneProps) => {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const defenderRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Determine player index: use prop if provided, otherwise derive from isOpponent
  const effectivePlayerIndex =
    playerIndex !== undefined ? playerIndex : ((isOpponent ? 1 : 0) as 0 | 1);

  return (
    <ZoneContainer>
      <Lanes isCreature>
        {player.lanes.map((card, i) => {
          const draggedCard = draggedCardId
            ? player.hand.find((c) => c.id === draggedCardId)
            : null;
          const isDropTarget =
            !isOpponent &&
            draggedCardId &&
            !card &&
            draggedCard &&
            draggedCard.type === CardType.Creature;

          // Determine player index for activation checks (0 for current player, 1 for opponent)
          const playerIndex = isOpponent ? 1 : 0;

          // Check if creature can activate its effect
          const creatureCanActivate =
            !isOpponent &&
            card !== null &&
            card.type === CardType.Creature &&
            (card as CreatureCard).hasActivatableEffect &&
            (card as CreatureCard).canActivateEffect &&
            gameState &&
            (card as CreatureCard).effectId
              ? canActivateEffect(
                  (card as CreatureCard).effectId!,
                  gameState,
                  playerIndex as 0 | 1,
                ).canActivate
              : false;

          return (
            <Lane
              as={motion.div}
              key={i}
              data-testid={
                isOpponent
                  ? `opponent-creature-lane-${i}`
                  : `creature-lane-${i}`
              }
              data-drop-lane={isDropTarget ? i : undefined}
              animate={{
                scale: isDropTarget ? 1.05 : 1,
                backgroundColor: isDropTarget
                  ? "rgba(76, 175, 80, 0.2)"
                  : "transparent",
              }}
              transition={{ duration: 0.2 }}
              style={{
                border: isDropTarget ? "2px dashed #4caf50" : undefined,
                borderRadius: "8px",
              }}
            >
              <div
                data-drop-lane={isDropTarget ? i : undefined}
                onDragStart={(e) => e.preventDefault()}
                draggable={false}
                ref={(el) => {
                  cardRefs.current[i] = el;
                  // If opponent board, store as defender ref
                  if (isOpponent) {
                    defenderRefs.current[i] = el;
                  }
                }}
              >
                <Card
                  card={card}
                  activeEffects={gameState?.activeEffects || []}
                  playerIndex={effectivePlayerIndex}
                  onClick={
                    !isOpponent && card
                      ? () => {
                          // Priority: Attack selection over effect activation
                          // This prevents creatures with effects from blocking attack selection
                          if (!isFirstTurn && onSelectAttacker) {
                            // Set the attacker ref when selecting
                            const element = cardRefs.current[i];
                            if (element && onSetAttackerRef) {
                              onSetAttackerRef(element);
                            }
                            onSelectAttacker(i);
                          }
                        }
                      : undefined
                  }
                  onDoubleClick={
                    card && onCardDoubleClick
                      ? () => onCardDoubleClick(i)
                      : undefined
                  }
                  isSelected={!isOpponent && selectedAttacker === i}
                  showFaceDown={isOpponent}
                  selectedHandCard={selectedHandCard}
                  canActivate={creatureCanActivate}
                />
              </div>

              {/* Opponent attack buttons - only show for creatures or first empty lane */}
              {isOpponent &&
                typeof selectedAttacker === "number" &&
                onAttack &&
                currentPlayerState &&
                (() => {
                  // Check if the selected attacker is in defense mode
                  const attackerCard = currentPlayerState.lanes[
                    selectedAttacker
                  ] as CreatureCard | null;
                  const isDefenseMode = attackerCard?.mode === "DEFENSE";

                  // Don't show attack button if attacker is in defense mode
                  if (isDefenseMode) return null;

                  // Check if opponent has any creatures
                  const opponentHasCreatures = player.lanes.some(
                    (c) => c !== null,
                  );

                  // If this lane has a creature, always show attack button
                  if (card) {
                    return (
                      <AttackButton
                        data-testid={`attack-button-lane-${i}`}
                        onClick={() => {
                          const defenderElement = defenderRefs.current[i];
                          if (defenderElement) {
                            onAttack(i, defenderElement);
                          } else {
                            onAttack(i);
                          }
                        }}
                        disabled={isFirstTurn}
                      >
                        {isFirstTurn
                          ? "Cannot Attack (Turn 1)"
                          : "Attack Creature"}
                      </AttackButton>
                    );
                  }

                  // For empty lanes: only show "Attack Directly" if opponent has NO creatures
                  // AND this is the first empty lane (to avoid multiple direct attack buttons)
                  if (!opponentHasCreatures && i === 0) {
                    return (
                      <AttackDirectButton
                        data-testid="attack-button"
                        onClick={() => onAttack(i)}
                        disabled={isFirstTurn}
                      >
                        {isFirstTurn
                          ? "Cannot Attack (Turn 1)"
                          : "Attack Directly"}
                      </AttackDirectButton>
                    );
                  }

                  return null;
                })()}

              {/* Current player creature controls */}
              {!isOpponent && card && card.type === CardType.Creature && (
                <>
                  {onToggleMode && (
                    <ToggleModeButton
                      onClick={() => onToggleMode(i)}
                      disabled={(card as CreatureCard).hasChangedModeThisTurn}
                      title={
                        (card as CreatureCard).hasChangedModeThisTurn
                          ? "Already changed mode this turn"
                          : "Switch between Attack and Defense mode"
                      }
                    >
                      Switch Mode
                      {(card as CreatureCard).hasChangedModeThisTurn && " ✓"}
                    </ToggleModeButton>
                  )}
                  {onActivateCreatureEffect && creatureCanActivate && (
                    <ToggleModeButton
                      onClick={() => {
                        const element = cardRefs.current[i];
                        if (element) {
                          onActivateCreatureEffect(i, element);
                        }
                      }}
                      title="Activate this creature's special effect"
                    >
                      Activate Effect
                    </ToggleModeButton>
                  )}
                  {onFlipFaceUp && (card as CreatureCard).isFaceDown && (
                    <FlipButton onClick={() => onFlipFaceUp(i)}>
                      Flip Face-Up
                    </FlipButton>
                  )}
                </>
              )}

              {/* Current player creature placement buttons */}
              {showPlayButtons &&
                !isOpponent &&
                !card &&
                selectedHandCard &&
                onPlayCreature &&
                (() => {
                  const handCard = player.hand.find(
                    (c) => c.id === selectedHandCard,
                  );
                  return handCard?.type === CardType.Creature ? (
                    <PlayHereButton
                      data-testid={`play-creature-lane-${i}`}
                      onClick={() => onPlayCreature(i)}
                    >
                      Play Here
                    </PlayHereButton>
                  ) : null;
                })()}
            </Lane>
          );
        })}
      </Lanes>
    </ZoneContainer>
  );
};
