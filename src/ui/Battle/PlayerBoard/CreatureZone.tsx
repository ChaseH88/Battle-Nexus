import { PlayerState } from "../../../battle/PlayerState";
import { CardType } from "../../../cards/types";
import { CreatureCard } from "../../../cards/CreatureCard";
import { Card } from "../Card";
import { motion } from "framer-motion";

export interface CreatureZoneProps {
  player: PlayerState;
  currentPlayerState?: PlayerState; // To check attacker mode when displaying opponent board
  selectedHandCard?: string | null;
  selectedAttacker?: number | null;
  isOpponent?: boolean;
  isFirstTurn?: boolean;
  onPlayCreature?: (lane: number) => void;
  onSelectAttacker?: (lane: number) => void;
  onAttack?: (targetLane: number) => void;
  onToggleMode?: (lane: number) => void;
  onFlipFaceUp?: (lane: number) => void;
  onCardDoubleClick?: (lane: number) => void;
  onActivateCreatureEffect?: (lane: number) => void; // New prop for activating creature effects
  draggedCardId?: string | null; // Track what card is being dragged
  showPlayButtons?: boolean; // Show "Play Here" buttons for accessibility
}

export const CreatureZone = ({
  player,
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
}: CreatureZoneProps) => {
  return (
    <div className="creature-zone">
      <div className="lanes">
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

          return (
            <motion.div
              key={i}
              className="lane"
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
              >
                <Card
                  card={card}
                  onClick={
                    !isOpponent && card
                      ? () => {
                          // Check if creature has activatable effect
                          const creature = card as CreatureCard;
                          if (
                            creature.hasActivatableEffect &&
                            creature.canActivateEffect &&
                            onActivateCreatureEffect
                          ) {
                            onActivateCreatureEffect(i);
                          } else if (!isFirstTurn && onSelectAttacker) {
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
                  canActivate={
                    !isOpponent &&
                    card !== null &&
                    (card as CreatureCard).hasActivatableEffect &&
                    (card as CreatureCard).canActivateEffect
                  }
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
                    (c) => c !== null
                  );

                  // If this lane has a creature, always show attack button
                  if (card) {
                    return (
                      <button
                        className="attack-here"
                        data-testid={`attack-button-lane-${i}`}
                        onClick={() => onAttack(i)}
                        disabled={isFirstTurn}
                      >
                        {isFirstTurn
                          ? "Cannot Attack (Turn 1)"
                          : "Attack Creature"}
                      </button>
                    );
                  }

                  // For empty lanes: only show "Attack Directly" if opponent has NO creatures
                  // AND this is the first empty lane (to avoid multiple direct attack buttons)
                  if (!opponentHasCreatures && i === 0) {
                    return (
                      <button
                        className="attack-here attack-direct"
                        data-testid="attack-button"
                        onClick={() => onAttack(i)}
                        disabled={isFirstTurn}
                      >
                        {isFirstTurn
                          ? "Cannot Attack (Turn 1)"
                          : "Attack Directly"}
                      </button>
                    );
                  }

                  return null;
                })()}

              {/* Current player creature controls */}
              {!isOpponent && card && card.type === CardType.Creature && (
                <>
                  {onToggleMode && (
                    <button
                      className="toggle-mode-btn"
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
                    </button>
                  )}
                  {onFlipFaceUp && (card as CreatureCard).isFaceDown && (
                    <button
                      className="flip-btn"
                      onClick={() => onFlipFaceUp(i)}
                    >
                      Flip Face-Up
                    </button>
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
                    (c) => c.id === selectedHandCard
                  );
                  return handCard?.type === CardType.Creature ? (
                    <button
                      className="play-here"
                      data-testid={`play-creature-lane-${i}`}
                      onClick={() => onPlayCreature(i)}
                    >
                      Play Here
                    </button>
                  ) : null;
                })()}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
