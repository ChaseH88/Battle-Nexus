import { PlayerState } from "../../../battle/PlayerState";
import { CardType } from "../../../cards/types";
import { CreatureCard } from "../../../cards/CreatureCard";
import { Card } from "../Card";

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
}

export const CreatureZone = ({
  player,
  currentPlayerState,
  selectedHandCard,
  selectedAttacker,
  isOpponent = false,
  isFirstTurn = false,
  onPlayCreature,
  onSelectAttacker,
  onAttack,
  onToggleMode,
  onFlipFaceUp,
  onCardDoubleClick,
}: CreatureZoneProps) => (
  <div className="creature-zone">
    <h4>{isOpponent ? "Creatures" : "Your Creatures"}</h4>
    <div className="lanes">
      {player.lanes.map((card, i) => (
        <div
          key={i}
          className="lane"
          data-testid={
            isOpponent ? `opponent-creature-lane-${i}` : `creature-lane-${i}`
          }
        >
          <div className="lane-label">Lane {i}</div>
          <Card
            card={card}
            onClick={
              !isOpponent && card && !isFirstTurn && onSelectAttacker
                ? () => onSelectAttacker(i)
                : undefined
            }
            onDoubleClick={
              card && onCardDoubleClick ? () => onCardDoubleClick(i) : undefined
            }
            isSelected={!isOpponent && selectedAttacker === i}
            showFaceDown={isOpponent}
            selectedHandCard={selectedHandCard}
          />

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
              const opponentHasCreatures = player.lanes.some((c) => c !== null);

              // If this lane has a creature, always show attack button
              if (card) {
                return (
                  <button
                    className="attack-here"
                    data-testid={`attack-button-lane-${i}`}
                    onClick={() => onAttack(i)}
                    disabled={isFirstTurn}
                  >
                    {isFirstTurn ? "Cannot Attack (Turn 1)" : "Attack Creature"}
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
                    {isFirstTurn ? "Cannot Attack (Turn 1)" : "Attack Directly"}
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
                <button className="flip-btn" onClick={() => onFlipFaceUp(i)}>
                  Flip Face-Up
                </button>
              )}
            </>
          )}

          {/* Current player creature placement buttons */}
          {!isOpponent &&
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
        </div>
      ))}
    </div>
  </div>
);
