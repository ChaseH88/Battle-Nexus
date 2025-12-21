import { PlayerState } from "../../../battle/PlayerState";
import { CardType } from "../../../cards/types";
import { CreatureCard } from "../../../cards/CreatureCard";
import { Card } from "../Card";

export interface CreatureZoneProps {
  player: PlayerState;
  selectedHandCard?: string | null;
  selectedAttacker?: number | null;
  isOpponent?: boolean;
  isFirstTurn?: boolean;
  onPlayCreature?: (lane: number) => void;
  onSelectAttacker?: (lane: number) => void;
  onAttack?: (targetLane: number) => void;
  onToggleMode?: (lane: number) => void;
  onFlipFaceUp?: (lane: number) => void;
}

export const CreatureZone = ({
  player,
  selectedHandCard,
  selectedAttacker,
  isOpponent = false,
  isFirstTurn = false,
  onPlayCreature,
  onSelectAttacker,
  onAttack,
  onToggleMode,
  onFlipFaceUp,
}: CreatureZoneProps) => (
  <div className="creature-zone">
    <h4>{isOpponent ? "Creatures" : "Your Creatures"}</h4>
    <div className="lanes">
      {player.lanes.map((card, i) => (
        <div key={i} className="lane">
          <div className="lane-label">Lane {i}</div>
          <Card
            card={card}
            onClick={
              !isOpponent && card && !isFirstTurn && onSelectAttacker
                ? () => onSelectAttacker(i)
                : undefined
            }
            isSelected={!isOpponent && selectedAttacker === i}
            showFaceDown={isOpponent}
            selectedHandCard={selectedHandCard}
          />

          {/* Opponent attack buttons */}
          {isOpponent && selectedAttacker !== null && onAttack && (
            <button
              className="attack-here"
              onClick={() => onAttack(i)}
              disabled={isFirstTurn}
            >
              {isFirstTurn
                ? "Cannot Attack (Turn 1)"
                : `Attack ${card ? "Creature" : "Directly"}`}
            </button>
          )}

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
                <button className="play-here" onClick={() => onPlayCreature(i)}>
                  Play Here
                </button>
              ) : null;
            })()}
        </div>
      ))}
    </div>
  </div>
);
